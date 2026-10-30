import prisma from '../lib/prisma.js';
import { createOrderWithTransaction, sanitizeOrder, sanitizePublicOrder } from '../services/orderService.js';
import { createRazorpayOrder } from '../services/paymentService.js';
import { validateCoupon } from '../services/couponService.js';
import { attributeCartConversion } from '../services/cartService.js';

/**
 * Validate coupon code and return discount
 */
export const checkCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code.' });
    }
    const result = await validateCoupon({ code, subtotal: parseFloat(subtotal) || 0 });
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({
      success: true,
      message: `Coupon "${result.coupon.code}" applied! You save ₹${result.coupon.discountAmount}.`,
      coupon: result.coupon
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Checkout (Cash on Delivery or Razorpay Online Payment) with Idempotency Support
 */
export const checkout = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      state,
      postalCode,
      notes,
      paymentMethod = 'COD',
      items,
      couponCode,
      idempotencyKey: bodyIdempotencyKey
    } = req.body;

    // Validate required fields
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }
    if (!customerPhone || !/^\d{10}$/.test(customerPhone.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit Indian phone number is required.' });
    }
    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City is required.' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'State is required.' });
    }
    if (!postalCode || !/^\d{6}$/.test(postalCode.trim())) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit PIN code is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
    }

    // Enforce COD-Only launch constraint
    if (paymentMethod && paymentMethod.toUpperCase() !== 'COD') {
      return res.status(400).json({
        success: false,
        message: 'Online payments are temporarily disabled for the initial launch. Only Cash on Delivery (COD) is supported.'
      });
    }

    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    const userId = req.user?.id || null;
    const idempotencyKey = req.headers['x-idempotency-key'] || bodyIdempotencyKey || null;

    const result = await createOrderWithTransaction({
      userId,
      customerName,
      customerEmail,
      customerPhone: cleanPhone,
      shippingAddress,
      city,
      state,
      postalCode,
      notes,
      paymentMethod: 'COD',
      items,
      couponCode,
      idempotencyKey
    });

    // In COD-only mode, paymentData is null
    const paymentData = null;

    // Phase 13: Attribute Cart Conversion / Recovery
    try {
      const sessionToken = req.body.sessionToken || req.headers['x-cart-session-token'] || null;
      const recoveryToken = req.body.recoveryToken || req.headers['x-cart-recovery-token'] || null;
      if (!result.duplicate && result.order?.id) {
        await attributeCartConversion({
          orderId: result.order.id,
          orderTotal: result.order.total,
          sessionToken,
          recoveryToken,
          customerEmail
        });
      }
    } catch (attrErr) {
      console.warn('Cart conversion attribution non-fatal notice:', attrErr.message);
    }

    res.status(result.duplicate ? 200 : 201).json({
      success: true,
      message: result.duplicate
        ? 'Existing order retrieved successfully.'
        : 'Order placed successfully with Cash on Delivery.',
      order: result.order,
      deliveryPin: result.deliveryPin, // Secret 6-digit delivery PIN for doorstep confirmation
      duplicate: result.duplicate || false,
      paymentData
    });
  } catch (error) {
    if (
      error.message.includes('Insufficient stock') ||
      error.message.includes('unavailable') ||
      error.message.includes('inactive') ||
      error.message.includes('variant') ||
      error.message.includes('Selected variant')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Public Customer Order Tracking
 * Requires both orderNumber and phone for privacy & security
 * Never exposes delivery PIN or delivery PIN hash!
 */
export const trackOrder = async (req, res, next) => {
  try {
    const { orderNumber, phone } = req.body;

    if (!orderNumber || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your Order Number and Registered Phone Number.'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: cleanOrderNumber,
        customerPhone: {
          contains: cleanPhone
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
                imageUrl: true,
                category: true,
                scentProfile: true
              }
            }
          }
        },
        statusLogs: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            notes: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No order matching this Order Number and Phone Number was found. Please double-check your details.'
      });
    }

    // Sanitize order and mask personal contact information in public tracking
    const safeOrder = sanitizePublicOrder(order);

    res.json({
      success: true,
      order: safeOrder
    });
  } catch (error) {
    next(error);
  }
};
