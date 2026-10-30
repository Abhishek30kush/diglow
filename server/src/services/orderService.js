import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from './notificationService.js';
import { validateCoupon, applyCouponUsage } from './couponService.js';

/**
 * Valid state transitions for Order Status
 */
export const ORDER_STATUS_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Packing', 'Packed', 'Cancelled'],
  Processing: ['Packed', 'Packing', 'Shipped', 'Cancelled'],
  Packing: ['Packed', 'Shipped', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Out for Delivery', 'Delivered', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Failed Delivery'],
  'Failed Delivery': ['Out for Delivery', 'Cancelled', 'Returned'],
  Delivered: ['Returned'],
  Returned: [],
  Cancelled: []
};

/**
 * Validate permitted order status transitions
 */
export function validateOrderStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return true;
  const allowed = ORDER_STATUS_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid order status transition from "${currentStatus}" to "${nextStatus}". Allowed next steps: ${
        allowed && allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'
      }`
    );
  }
  return true;
}

/**
 * Generate unique order number (e.g., DIG-2026-8K4P9)
 */
export function generateOrderNumber() {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
  return `DIG-${year}-${randomPart}`;
}

/**
 * Generate secure 6-digit delivery PIN (e.g. "492018")
 */
export function generateDeliveryPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Concurrency-safe Checkout & Order Creation with Duplicate Protection
 */
export async function createOrderWithTransaction({
  userId = null,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  city,
  state,
  postalCode,
  notes,
  paymentMethod = 'COD',
  items, // array of { productId, quantity }
  couponCode,
  idempotencyKey = null
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item.');
  }

  const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
  const cleanEmail = customerEmail.trim().toLowerCase();

  // 1. Idempotency Key deduplication
  if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
    const existingIdempotent = await prisma.order.findUnique({
      where: { idempotencyKey: idempotencyKey.trim() },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, sku: true, imageUrl: true }
            }
          }
        },
        statusLogs: true
      }
    });

    if (existingIdempotent) {
      console.log(`ℹ️ Idempotent checkout hit for key: ${idempotencyKey}`);
      return {
        order: sanitizeOrder(existingIdempotent),
        deliveryPin: null,
        duplicate: true
      };
    }
  }

  // 2. Rapid repeated submission deduplication guard (within 15 seconds)
  const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
  const rapidDuplicate = await prisma.order.findFirst({
    where: {
      customerPhone: cleanPhone,
      customerEmail: cleanEmail,
      createdAt: { gte: fifteenSecondsAgo },
      orderStatus: { in: ['Pending', 'Confirmed'] }
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, sku: true, imageUrl: true }
          }
        }
      },
      statusLogs: true
    }
  });

  if (rapidDuplicate && rapidDuplicate.items.length === items.length) {
    console.log(`ℹ️ Rapid repeated checkout duplicate prevented for order: ${rapidDuplicate.orderNumber}`);
    return {
      order: sanitizeOrder(rapidDuplicate),
      deliveryPin: null,
      duplicate: true
    };
  }

  // Generate 6-digit delivery PIN and hash it
  const plainDeliveryPin = generateDeliveryPin();
  const deliveryPinHash = await bcrypt.hash(plainDeliveryPin, 10);
  const orderNumber = generateOrderNumber();

  // Execute in an interactive transaction with concurrency check
  const createdOrder = await prisma.$transaction(async (tx) => {
    const orderItemsData = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid item or quantity.');
      }

      // Fetch latest product directly from DB inside transaction
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        throw new Error(`Product not found (ID: ${item.productId})`);
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is currently unavailable.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      let variant = null;
      let effectivePrice = product.price;

      if (item.variantId) {
        variant = await tx.productVariant.findUnique({
          where: { id: item.variantId }
        });

        if (!variant || variant.productId !== product.id) {
          throw new Error(`Selected variant not found for candle "${product.name}".`);
        }

        if (!variant.isActive || variant.isArchived) {
          throw new Error(`The selected variant "${variant.title}" of "${product.name}" is currently inactive.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name} (${variant.title})". Available: ${variant.stock}, Requested: ${item.quantity}`
          );
        }

        // Concurrency-safe atomic variant stock decrement
        const variantUpdate = await tx.productVariant.updateMany({
          where: {
            id: variant.id,
            stock: { gte: item.quantity }
          },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        if (variantUpdate.count === 0) {
          throw new Error(
            `Insufficient stock for "${product.name} (${variant.title})". Stock was reserved by a concurrent checkout.`
          );
        }

        effectivePrice = variant.price;
      }

      // Concurrency-safe atomic stock decrement with gte constraint on parent product
      const updateResult = await tx.product.updateMany({
        where: {
          id: product.id,
          stock: { gte: item.quantity }
        },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });

      if (updateResult.count === 0) {
        throw new Error(
          `Insufficient stock for "${product.name}". Stock was reserved by a concurrent checkout.`
        );
      }

      // Record inventory movement log inside the same transaction
      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          variantId: variant ? variant.id : null,
          variantSku: variant ? variant.sku : null,
          change: -item.quantity,
          previousStock: product.stock,
          newStock: product.stock - item.quantity,
          type: 'SALE',
          reason: `Order placed #${orderNumber}${variant ? ` (${variant.title})` : ''}`,
          updatedBy: userId ? 'CUSTOMER' : 'GUEST'
        }
      });

      const lineTotal = effectivePrice * item.quantity;
      calculatedSubtotal += lineTotal;

      orderItemsData.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        productName: product.name,
        variantSku: variant ? variant.sku : product.sku,
        variantName: variant ? variant.title : null,
        variantOptions: variant ? variant.options : null,
        quantity: item.quantity,
        unitPrice: effectivePrice,
        totalPrice: lineTotal
      });
    }

    // Server-side calculation of delivery fee
    const deliveryFee =
      calculatedSubtotal >= config.freeDeliveryThreshold
        ? 0
        : config.standardDeliveryFee;

    // Database-backed coupon discount calculation
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const validation = await validateCoupon({
        code: couponCode.trim(),
        subtotal: calculatedSubtotal,
        tx
      });

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      discount = validation.coupon.discountAmount;
      appliedCouponCode = validation.coupon.code;

      // Increment coupon usage limit count inside transaction
      await applyCouponUsage(appliedCouponCode, tx);
    }

    // Ensure total is never negative
    const total = Math.max(0, calculatedSubtotal + deliveryFee - discount);

    // Create Order with nested items and initial status log
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        customerName: customerName.trim(),
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        shippingAddress: shippingAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        paymentMethod: paymentMethod === 'RAZORPAY' ? 'RAZORPAY' : 'COD',
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        deliveryPinHash,
        subtotal: calculatedSubtotal,
        deliveryFee,
        discount,
        couponCode: appliedCouponCode,
        couponDiscount: discount,
        total,
        notes: notes ? notes.trim() : null,
        idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
        items: {
          create: orderItemsData
        },
        statusLogs: {
          create: {
            toStatus: 'Pending',
            notes: `Order placed via ${paymentMethod === 'RAZORPAY' ? 'Online Payment (Razorpay)' : 'Cash on Delivery (COD)'}`,
            updatedBy: userId ? 'CUSTOMER' : 'GUEST'
          }
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                imageUrl: true,
                scentProfile: true
              }
            }
          }
        },
        statusLogs: true
      }
    });

    return newOrder;
  });

  // Trigger email notification for order confirmation
  sendOrderConfirmationEmail({
    order: createdOrder,
    deliveryPin: plainDeliveryPin
  }).catch((err) => console.error('Notification error:', err.message));

  return {
    order: sanitizeOrder(createdOrder),
    deliveryPin: plainDeliveryPin,
    duplicate: false
  };
}

/**
 * Remove sensitive PIN hash from order response
 */
export function sanitizeOrder(order) {
  if (!order) return null;
  const { deliveryPinHash, ...sanitized } = order;
  return sanitized;
}

/**
 * Remove sensitive PIN hash and mask personal contact information for unauthenticated public order tracking
 */
export function sanitizePublicOrder(order) {
  if (!order) return null;
  const { deliveryPinHash, ...sanitized } = order;

  let maskedEmail = sanitized.customerEmail;
  if (sanitized.customerEmail && sanitized.customerEmail.includes('@')) {
    const [userPart, domainPart] = sanitized.customerEmail.split('@');
    maskedEmail = `${userPart.slice(0, 2)}***@${domainPart}`;
  }

  const phoneStr = sanitized.customerPhone || '';
  const maskedPhone = phoneStr.length >= 4
    ? '******' + phoneStr.slice(-4)
    : '******';

  const maskedAddress = `[Private Sanctuary Address], ${sanitized.city || ''}, ${sanitized.state || ''} - ${sanitized.postalCode || ''}`.replace(/^,\s*/, '');

  return {
    ...sanitized,
    customerEmail: maskedEmail,
    customerPhone: maskedPhone,
    shippingAddress: maskedAddress
  };
}


/**
 * Verify delivery PIN securely and transition to Delivered & Paid
 */
export async function verifyOrderDeliveryPin(orderId, pin, staff = null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  if (order.orderStatus === 'Delivered') {
    throw new Error('This order has already been marked as Delivered.');
  }
  if (order.orderStatus === 'Cancelled') {
    throw new Error('Cannot deliver a cancelled order.');
  }

  // Delivery staff permission check
  if (staff && staff.role === 'DELIVERY' && order.assignedToId && order.assignedToId !== staff.id) {
    throw new Error('You are not authorized to confirm delivery on orders assigned to another delivery agent.');
  }

  const isMatch = await bcrypt.compare(pin.trim(), order.deliveryPinHash);
  if (!isMatch) {
    return false;
  }

  const staffName = staff ? staff.name || staff.email : 'ADMIN';
  const staffId = staff ? staff.id : null;

  // Update order to Delivered and Paid inside transaction with status log
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'Delivered',
        paymentStatus: 'Paid',
        deliveredAt: new Date()
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, sku: true, imageUrl: true } }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    await tx.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: order.orderStatus,
        toStatus: 'Delivered',
        notes: `Doorstep 6-Digit Delivery PIN verified by ${staffName}. COD payment settled.`,
        updatedBy: staff ? staff.role : 'ADMIN',
        staffId,
        staffName
      }
    });

    return updated;
  });

  sendOrderStatusUpdateEmail({
    order: updatedOrder,
    newStatus: 'Delivered'
  }).catch((err) => console.error('Email error:', err.message));

  return sanitizeOrder(updatedOrder);
}

/**
 * Order Cancellation with Atomic Stock Restoration and Double-Restock Prevention
 */
export async function cancelOrderWithStockRestoration({
  orderId,
  reason = 'Customer requested cancellation',
  cancelledBy = 'CUSTOMER',
  staffId = null,
  staffName = null
}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  // Validate state transition rule
  validateOrderStatusTransition(order.orderStatus, 'Cancelled');

  // Guard against double-restocking and duplicate cancellation
  if (order.isRestocked || order.orderStatus === 'Cancelled') {
    throw new Error('Order is already cancelled and items have already been restocked to inventory.');
  }

  // Customer can cancel only before dispatch
  if (cancelledBy === 'CUSTOMER' && ['Shipped', 'Out for Delivery'].includes(order.orderStatus)) {
    throw new Error('Order has already been dispatched and cannot be cancelled directly. Please contact concierge support.');
  }

  // Atomic transaction to restore stock, record inventory movement logs, and cancel order
  const cancelledOrder = await prisma.$transaction(async (tx) => {
    // Restore stock for all products in the order and record inventory log
    for (const item of order.items) {
      const prod = await tx.product.findUnique({ where: { id: item.productId } });
      if (prod) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          }).catch(() => {});
        }

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            variantSku: item.variantSku || null,
            change: item.quantity,
            previousStock: prod.stock,
            newStock: prod.stock + item.quantity,
            type: 'CANCELLATION',
            reason: `Restocked due to order cancellation #${order.orderNumber}. Reason: ${reason}`,
            updatedBy: staffName || cancelledBy
          }
        });
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'Cancelled',
        isRestocked: true,
        paymentStatus: order.paymentStatus === 'Paid' ? 'Refund Pending' : 'Cancelled'
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, sku: true, imageUrl: true } }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const cancellationNote = order.paymentStatus === 'Paid'
      ? `Cancellation reason: ${reason}. Order was paid; marked as Refund Pending for authorized manual refund verification.`
      : `Cancellation reason: ${reason}. Unpaid COD order cancelled without monetary refund.`;

    await tx.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: order.orderStatus,
        toStatus: 'Cancelled',
        notes: cancellationNote,
        updatedBy: cancelledBy,
        staffId,
        staffName: staffName || cancelledBy
      }
    });

    return updated;
  });

  sendOrderStatusUpdateEmail({
    order: cancelledOrder,
    newStatus: 'Cancelled'
  }).catch((err) => console.error('Email error:', err.message));

  return sanitizeOrder(cancelledOrder);
}

/**
 * Process Order Return with Selective Restock or Damaged Item Write-off
 */
export async function processOrderReturn({
  orderId,
  itemDisposition = 'RESTOCK_TO_INVENTORY', // 'RESTOCK_TO_INVENTORY' or 'DAMAGED_WRITE_OFF'
  reason = 'Customer return / Transit damage inspection',
  staffId = null,
  staffName = 'ADMIN'
}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  if (order.orderStatus === 'Returned') {
    throw new Error('This order has already been processed for return.');
  }

  validateOrderStatusTransition(order.orderStatus, 'Returned');

  if (order.isRestocked) {
    throw new Error('Order items have already been processed for restocking.');
  }

  return await prisma.$transaction(async (tx) => {
    // If disposition is restock, increment inventory and log
    if (itemDisposition === 'RESTOCK_TO_INVENTORY') {
      for (const item of order.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });

          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } }
            }).catch(() => {});
          }

          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              variantId: item.variantId || null,
              variantSku: item.variantSku || null,
              change: item.quantity,
              previousStock: prod.stock,
              newStock: prod.stock + item.quantity,
              type: 'RETURNED_RESTOCKED',
              reason: `Return restocked #${order.orderNumber}. Reason: ${reason}`,
              updatedBy: staffName
            }
          });
        }
      }
    } else {
      // DAMAGED_WRITE_OFF: do not increment stock, but record damaged inventory log
      for (const item of order.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              variantId: item.variantId || null,
              variantSku: item.variantSku || null,
              change: 0,
              previousStock: prod.stock,
              newStock: prod.stock,
              type: 'RETURNED_DAMAGED',
              reason: `Damaged candle write-off #${order.orderNumber}. Reason: ${reason}`,
              updatedBy: staffName
            }
          });
        }
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'Returned',
        isRestocked: true,
        returnStatus: itemDisposition,
        returnNotes: reason,
        returnedAt: new Date(),
        paymentStatus: order.paymentStatus === 'Paid' ? 'Refund Pending' : order.paymentStatus
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, sku: true, imageUrl: true } }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    await tx.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: order.orderStatus,
        toStatus: 'Returned',
        notes: `Order return processed (${itemDisposition}). Reason: ${reason}`,
        updatedBy: staffName,
        staffId,
        staffName
      }
    });

    return sanitizeOrder(updated);
  });
}

/**
 * Reorder availability & live pricing verification from a historical order
 * Validates current product and variant stock and current catalog prices (never uses historical prices)
 */
export async function getReorderAvailability(orderId, userId = null) {
  const pastOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          variant: true
        }
      }
    }
  });

  if (!pastOrder) {
    throw new Error('Historical order not found.');
  }

  if (userId && pastOrder.userId && pastOrder.userId !== userId) {
    throw new Error('You are not authorized to reorder from this past order.');
  }

  const items = [];
  const availableItems = [];
  const unavailableItems = [];
  const priceChangedItems = [];

  for (const item of pastOrder.items) {
    const liveProduct = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    let liveVariant = null;
    if (item.variantId) {
      liveVariant = await prisma.productVariant.findUnique({
        where: { id: item.variantId }
      });
    }

    const isProductActive = liveProduct && liveProduct.isActive;
    const isVariantActive = !item.variantId || (liveVariant && liveVariant.isActive && !liveVariant.isArchived);
    const liveStock = liveVariant
      ? Math.min(liveVariant.stock, liveProduct ? liveProduct.stock : 0)
      : (liveProduct ? liveProduct.stock : 0);

    const isAvailable = Boolean(isProductActive && isVariantActive && liveStock > 0);
    const currentPrice = liveVariant ? liveVariant.price : (liveProduct ? liveProduct.price : item.unitPrice);
    const priceChanged = Number(currentPrice) !== Number(item.unitPrice);
    const quantityToAdd = isAvailable ? Math.min(item.quantity, liveStock) : 0;

    let reasonUnavailable = null;
    if (!liveProduct || !liveProduct.isActive) {
      reasonUnavailable = 'Product is currently discontinued or inactive.';
    } else if (item.variantId && (!liveVariant || !liveVariant.isActive || liveVariant.isArchived)) {
      reasonUnavailable = 'This candle variant is no longer offered.';
    } else if (liveStock < 1) {
      reasonUnavailable = 'Currently out of workshop stock.';
    }

    const reorderItem = {
      orderItemId: item.id,
      productId: item.productId,
      variantId: item.variantId || null,
      name: liveVariant
        ? `${liveProduct?.name || item.productName || 'Artisanal Candle'} (${liveVariant.title})`
        : (liveProduct?.name || item.productName || 'Artisanal Candle'),
      productName: liveProduct?.name || item.productName || 'Artisanal Candle',
      variantTitle: liveVariant?.title || item.variantName || null,
      slug: liveProduct?.slug || '',
      imageUrl: liveVariant?.imageUrl || liveProduct?.imageUrl || '',
      requestedQuantity: item.quantity,
      availableStock: liveStock,
      quantityToAdd,
      historicalPrice: item.unitPrice,
      currentPrice,
      priceChanged,
      priceDiff: Number((currentPrice - item.unitPrice).toFixed(2)),
      isAvailable,
      reasonUnavailable,
      variant: liveVariant,
      product: liveProduct
    };

    items.push(reorderItem);

    if (isAvailable && quantityToAdd > 0) {
      availableItems.push(reorderItem);
    } else {
      unavailableItems.push(reorderItem);
    }

    if (priceChanged) {
      priceChangedItems.push(reorderItem);
    }
  }

  const allAvailable = unavailableItems.length === 0 && availableItems.length > 0;

  return {
    success: true,
    orderId,
    orderNumber: pastOrder.orderNumber,
    items,
    availableItems,
    unavailableItems,
    priceChangedItems,
    allAvailable,
    hasPartialAvailability: unavailableItems.length > 0 && availableItems.length > 0
  };
}

/**
 * Reorder items from a historical order alias
 */
export async function reorderItemsFromHistoricalOrder({ orderId, userId }) {
  return getReorderAvailability(orderId, userId);
}

