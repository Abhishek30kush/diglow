import prisma from '../lib/prisma.js';
import {
  sanitizeOrder,
  verifyOrderDeliveryPin,
  cancelOrderWithStockRestoration,
  validateOrderStatusTransition,
  processOrderReturn
} from '../services/orderService.js';
import { sendOrderStatusUpdateEmail } from '../services/notificationService.js';
import { getAbandonedCartAnalytics, processAbandonedCarts } from '../services/cartService.js';

/**
 * 1. Comprehensive Business Analytics Dashboard
 * Calculates Gross Sales, Net Sales, Order Counts, Cancellations, Refunds, AOV, Low-Stock via DB queries
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const { range, startDate, endDate } = req.query;

    const dateFilter = {};
    const now = new Date();

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    } else if (range === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter.createdAt = { gte: startOfToday };
    } else if (range === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { gte: oneWeekAgo };
    } else if (range === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter.createdAt = { gte: oneMonthAgo };
    } else if (range === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      dateFilter.createdAt = { gte: oneYearAgo };
    }

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      packedOrders,
      shippedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      failedDeliveryOrders,
      cancelledOrdersCount,
      returnedOrders,
      paidOrdersCount,
      totalProducts,
      lowStockProductsList,
      grossSalesAgg,
      netSalesAgg,
      cancelledAgg,
      refundedAgg,
      recentOrders,
      topItems
    ] = await Promise.all([
      prisma.order.count({ where: dateFilter }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Pending' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Confirmed' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Processing' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: { in: ['Packed', 'Packing'] } } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Shipped' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Out for Delivery' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Delivered' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Failed Delivery' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Cancelled' } }),
      prisma.order.count({ where: { ...dateFilter, orderStatus: 'Returned' } }),
      prisma.order.count({ where: { ...dateFilter, paymentStatus: 'Paid' } }),
      prisma.product.count(),
      // Low stock: products whose stock is <= lowStockThreshold and isActive = true
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true, category: true, price: true }
      }),
      // Gross Sales: Subtotal of placed orders excluding cancelled
      prisma.order.aggregate({
        where: { ...dateFilter, orderStatus: { not: 'Cancelled' } },
        _sum: { total: true, subtotal: true, deliveryFee: true, discount: true }
      }),
      // Net Sales: Total of successfully Paid orders
      prisma.order.aggregate({
        where: { ...dateFilter, paymentStatus: 'Paid' },
        _sum: { total: true }
      }),
      // Cancelled Orders Total
      prisma.order.aggregate({
        where: { ...dateFilter, orderStatus: 'Cancelled' },
        _sum: { total: true }
      }),
      // Refunded Amount
      prisma.order.aggregate({
        where: { ...dateFilter, paymentStatus: 'Refunded' },
        _sum: { total: true }
      }),
      prisma.order.findMany({
        where: dateFilter,
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            take: 2,
            include: {
              product: { select: { name: true, sku: true, imageUrl: true } }
            }
          }
        }
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: Object.keys(dateFilter).length > 0 ? { order: dateFilter } : undefined,
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
    ]);

    // Filter products whose current stock is <= threshold
    const lowStockItems = lowStockProductsList.filter((p) => p.stock <= (p.lowStockThreshold || 10));
    const lowStockCount = lowStockItems.length;

    const grossSales = grossSalesAgg._sum.total || 0;
    const netSales = netSalesAgg._sum.total || 0;
    const cancelledAmount = cancelledAgg._sum.total || 0;
    const refundedAmount = refundedAgg._sum.total || 0;
    const nonCancelledOrdersCount = totalOrders - cancelledOrdersCount;
    const averageOrderValue = nonCancelledOrdersCount > 0 ? Math.round(grossSales / nonCancelledOrdersCount) : 0;

    const topSellingProducts = await Promise.all(
      topItems.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, imageUrl: true, price: true, category: true, stock: true }
        });
        return {
          productId: item.productId,
          name: prod?.name || 'Artisanal Candle',
          sku: prod?.sku || 'N/A',
          category: prod?.category,
          imageUrl: prod?.imageUrl,
          price: prod?.price,
          stock: prod?.stock,
          unitsSold: item._sum.quantity || 0,
          totalRevenue: item._sum.totalPrice || 0
        };
      })
    );

    res.json({
      success: true,
      stats: {
        grossSales,
        netSales,
        totalOrders,
        paidOrdersCount,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        packedOrders,
        shippedOrders,
        outForDeliveryOrders,
        deliveredOrders,
        failedDeliveryOrders,
        cancelledOrdersCount,
        returnedOrders,
        cancelledAmount,
        refundedAmount,
        averageOrderValue,
        totalProducts,
        lowStockProducts: lowStockCount,
        lowStockItems: lowStockItems.slice(0, 10)
      },
      recentOrders: recentOrders.map(sanitizeOrder),
      topSellingProducts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Product Catalog Management with SKU, Low-Stock Threshold & Variants
 */
export const getAdminProducts = async (req, res, next) => {
  try {
    const { search, category, stockStatus, page = 1, limit = 50 } = req.query;

    const where = {};

    if (category && category !== 'All') {
      where.category = category;
    }

    if (stockStatus === 'out') {
      where.stock = 0;
    } else if (stockStatus === 'in') {
      where.stock = { gt: 10 };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { scentProfile: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [totalCount, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          productVariants: {
            where: { isArchived: false },
            orderBy: { price: 'asc' }
          },
          inventoryLogs: {
            take: 3,
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    ]);

    res.json({
      success: true,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / pageSize),
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      sku,
      description,
      category,
      scentProfile,
      topNotes,
      heartNotes,
      baseNotes,
      price,
      compareAtPrice,
      stock,
      lowStockThreshold = 10,
      variants,
      productVariants: inputVariants,
      imageUrl,
      gallery,
      burnTime,
      waxType,
      weight,
      ingredients,
      dimensions,
      careInstructions,
      safetyWarnings,
      isFeatured,
      isFestiveSpecial,
      isActive
    } = req.body;

    if (!name || !price || !category || !scentProfile || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, scent profile, and primary image are required.'
      });
    }

    const autoSlug =
      (slug && slug.trim()) ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const existingSlug = await prisma.product.findUnique({
      where: { slug: autoSlug }
    });

    const finalSlug = existingSlug ? `${autoSlug}-${Date.now().toString().slice(-4)}` : autoSlug;

    // Generate clean SKU if not provided (e.g. DIG-CANDLE-XXXX)
    const cleanSku =
      (sku && sku.trim().toUpperCase()) ||
      `DIG-${name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'C')}-${Math.floor(100 + Math.random() * 900)}`;

    const initialStock = parseInt(stock || 0, 10);

    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          sku: cleanSku,
          description: description ? description.trim() : '',
          category: category.trim(),
          scentProfile: scentProfile.trim(),
          topNotes: topNotes ? topNotes.trim() : null,
          heartNotes: heartNotes ? heartNotes.trim() : null,
          baseNotes: baseNotes ? baseNotes.trim() : null,
          price: parseFloat(price),
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          stock: initialStock,
          lowStockThreshold: parseInt(lowStockThreshold || 10, 10),
          variants: variants || null,
          imageUrl: imageUrl.trim(),
          gallery: Array.isArray(gallery) ? gallery : [imageUrl.trim()],
          burnTime: burnTime ? burnTime.trim() : '45-50 Hours',
          waxType: waxType ? waxType.trim() : '100% Organic Soy & Coconut Wax',
          weight: weight ? weight.trim() : '240g / 8.5 oz',
          ingredients: ingredients ? ingredients.trim() : null,
          dimensions: dimensions ? dimensions.trim() : null,
          careInstructions: careInstructions ? careInstructions.trim() : null,
          safetyWarnings: safetyWarnings ? safetyWarnings.trim() : null,
          isFeatured: Boolean(isFeatured),
          isFestiveSpecial: Boolean(isFestiveSpecial),
          isActive: isActive !== undefined ? Boolean(isActive) : true
        }
      });

      if (initialStock > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: prod.id,
            change: initialStock,
            previousStock: 0,
            newStock: initialStock,
            type: 'INITIAL',
            reason: 'Initial product stock intake from artisanal workshop',
            updatedBy: 'ADMIN'
          }
        });
      }

      // If concrete variants provided on creation
      if (Array.isArray(inputVariants) && inputVariants.length > 0) {
        for (const iv of inputVariants) {
          const vSku = (iv.sku && iv.sku.trim().toUpperCase()) || `${cleanSku}-V${Math.floor(100 + Math.random() * 900)}`;
          await tx.productVariant.create({
            data: {
              productId: prod.id,
              sku: vSku,
              title: iv.title ? iv.title.trim() : 'Standard Variant',
              size: iv.size ? iv.size.trim() : null,
              fragrance: iv.fragrance ? iv.fragrance.trim() : null,
              color: iv.color ? iv.color.trim() : null,
              packaging: iv.packaging ? iv.packaging.trim() : null,
              price: parseFloat(iv.price || price),
              compareAtPrice: iv.compareAtPrice ? parseFloat(iv.compareAtPrice) : null,
              stock: parseInt(iv.stock || 0, 10),
              lowStockThreshold: parseInt(iv.lowStockThreshold || 5, 10),
              isActive: iv.isActive !== undefined ? Boolean(iv.isActive) : true,
              options: iv.options || null
            }
          });
        }
      }

      return prod;
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      category,
      scentProfile,
      topNotes,
      heartNotes,
      baseNotes,
      price,
      compareAtPrice,
      stock,
      lowStockThreshold,
      variants,
      imageUrl,
      gallery,
      burnTime,
      waxType,
      weight,
      ingredients,
      dimensions,
      careInstructions,
      safetyWarnings,
      isFeatured,
      isFestiveSpecial,
      isActive
    } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(sku && { sku: sku.trim().toUpperCase() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category && { category: category.trim() }),
        ...(scentProfile && { scentProfile: scentProfile.trim() }),
        ...(topNotes !== undefined && { topNotes: topNotes ? topNotes.trim() : null }),
        ...(heartNotes !== undefined && { heartNotes: heartNotes ? heartNotes.trim() : null }),
        ...(baseNotes !== undefined && { baseNotes: baseNotes ? baseNotes.trim() : null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(compareAtPrice !== undefined && {
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null
        }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold, 10) }),
        ...(variants !== undefined && { variants }),
        ...(imageUrl && { imageUrl: imageUrl.trim() }),
        ...(gallery && { gallery: Array.isArray(gallery) ? gallery : [imageUrl] }),
        ...(burnTime !== undefined && { burnTime: burnTime ? burnTime.trim() : null }),
        ...(waxType !== undefined && { waxType: waxType ? waxType.trim() : null }),
        ...(weight !== undefined && { weight: weight ? weight.trim() : null }),
        ...(ingredients !== undefined && { ingredients: ingredients ? ingredients.trim() : null }),
        ...(dimensions !== undefined && { dimensions: dimensions ? dimensions.trim() : null }),
        ...(careInstructions !== undefined && { careInstructions: careInstructions ? careInstructions.trim() : null }),
        ...(safetyWarnings !== undefined && { safetyWarnings: safetyWarnings ? safetyWarnings.trim() : null }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(isFestiveSpecial !== undefined && { isFestiveSpecial: Boolean(isFestiveSpecial) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      },
      include: {
        productVariants: {
          where: { isArchived: false },
          orderBy: { price: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Manual Stock Adjustment with Mandatory Reason & Movement Log
 */
export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, reason } = req.body;

    if (stock === undefined || isNaN(stock) || parseInt(stock, 10) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative stock number is required.'
      });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason is required for manual stock adjustments (e.g. Physical inventory count audit, Workshop shipment received, Damaged vessel write-off).'
      });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const targetStock = parseInt(stock, 10);
    const diff = targetStock - product.stock;

    if (diff === 0) {
      return res.json({
        success: true,
        message: `Stock is already at ${targetStock}. No change recorded.`,
        product
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id },
        data: { stock: targetStock }
      });

      await tx.inventoryLog.create({
        data: {
          productId: id,
          change: diff,
          previousStock: product.stock,
          newStock: targetStock,
          type: 'MANUAL_ADJUSTMENT',
          reason: reason.trim(),
          updatedBy: 'ADMIN'
        }
      });

      return prod;
    });

    res.json({
      success: true,
      message: `Stock updated to ${updated.stock} (Change: ${diff > 0 ? `+${diff}` : diff}).`,
      product: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Inventory Movement History with Filters & Pagination
 */
export const getInventoryLogs = async (req, res, next) => {
  try {
    const { productId, type, page = 1, limit = 50 } = req.query;

    const where = {};
    if (productId && productId !== 'All') where.productId = productId;
    if (type && type !== 'All') where.type = type;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [totalCount, logs] = await Promise.all([
      prisma.inventoryLog.count({ where }),
      prisma.inventoryLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true, imageUrl: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / pageSize),
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Product Image Upload via Multer
 */
export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select a valid JPEG, PNG, or WEBP image.'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Product image uploaded successfully.',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const linkedItemsCount = await prisma.orderItem.count({
      where: { productId: id }
    });

    if (linkedItemsCount > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });
      return res.json({
        success: true,
        message: 'Product has linked historical orders. It has been deactivated instead of deleted.'
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Product deleted permanently.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Order Management with Comprehensive Filters & Pagination
 */
export const getAdminOrders = async (req, res, next) => {
  try {
    const {
      status,
      paymentMethod,
      paymentStatus,
      deliveryStatus,
      assignedToId,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    // Delivery personnel can only view their assigned orders
    if (req.admin && req.admin.role === 'DELIVERY') {
      where.assignedToId = req.admin.id;
    } else if (assignedToId && assignedToId !== 'All') {
      if (assignedToId === 'unassigned') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedToId;
      }
    }

    if (status && status !== 'All') {
      where.orderStatus = status;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      where.paymentMethod = paymentMethod;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      where.paymentStatus = paymentStatus;
    }

    if (deliveryStatus && deliveryStatus !== 'All') {
      if (deliveryStatus === 'Delivered') {
        where.orderStatus = 'Delivered';
      } else if (deliveryStatus === 'In Transit') {
        where.orderStatus = { in: ['Shipped', 'Out for Delivery'] };
      } else if (deliveryStatus === 'Pending Dispatch') {
        where.orderStatus = { in: ['Pending', 'Confirmed', 'Processing', 'Packing', 'Packed'] };
      } else if (deliveryStatus === 'Failed') {
        where.orderStatus = 'Failed Delivery';
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { trackingNumber: { contains: q, mode: 'insensitive' } },
        { assignedToName: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const validSortFields = ['createdAt', 'total', 'orderStatus', 'customerName', 'assignedAt'];
    const resolvedSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [resolvedSortBy]: sortOrder === 'asc' ? 'asc' : 'desc' };

    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, slug: true, imageUrl: true }
              }
            }
          },
          statusLogs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    ]);

    res.json({
      success: true,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / pageSize),
      count: orders.length,
      orders: orders.map(sanitizeOrder)
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    res.json({
      success: true,
      order: sanitizeOrder(order)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Printable Invoice & Packing Slip Data
 */
export const getOrderInvoiceData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, category: true, weight: true }
            }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      invoice: {
        company: {
          name: 'DiGlow Artisanal Candles Pvt. Ltd.',
          tagline: 'Artisanal Indian Luxury Candles & Festive Sanctum',
          gstin: '07AAACD1234F1Z5',
          sanctumAddress: 'Crafts Heritage Enclave, Mehrauli, New Delhi 110030',
          email: 'support@diglow.com',
          supportPhone: '+91 98765 43210',
          website: 'https://diglow.com'
        },
        order: sanitizeOrder(order)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status with strict state machine validation
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, deliveryPartner, trackingNumber, estimatedDelivery } = req.body;

    const currentOrder = await prisma.order.findUnique({ where: { id } });
    if (!currentOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Role-based authorization for DELIVERY agents: can only update their assigned orders
    if (req.admin && req.admin.role === 'DELIVERY' && currentOrder.assignedToId !== req.admin.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update status on orders assigned to another agent.'
      });
    }

    // Reject status updates on terminal Cancelled or Returned orders
    if (currentOrder.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already Cancelled and cannot be modified again.'
      });
    }

    if (currentOrder.orderStatus === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'Order is already Returned and cannot be modified.'
      });
    }

    // Validate state machine rule for permitted status transitions
    if (status && status !== currentOrder.orderStatus) {
      try {
        validateOrderStatusTransition(currentOrder.orderStatus, status);
      } catch (validationErr) {
        return res.status(400).json({
          success: false,
          message: validationErr.message
        });
      }
    }

    // Handle cancellation with stock restoration
    if (status === 'Cancelled' && currentOrder.orderStatus !== 'Cancelled') {
      if (req.admin && req.admin.role === 'DELIVERY') {
        return res.status(403).json({
          success: false,
          message: 'Delivery agents cannot cancel orders. Please record a failed delivery attempt or contact store dispatch.'
        });
      }
      const cancelled = await cancelOrderWithStockRestoration({
        orderId: id,
        reason: notes || 'Cancelled by Store Staff',
        cancelledBy: req.admin?.role || 'ADMIN',
        staffId: req.admin?.id || null,
        staffName: req.admin?.name || req.admin?.email || 'ADMIN'
      });
      return res.json({
        success: true,
        message: 'Order cancelled and product inventory restored.',
        order: cancelled
      });
    }

    const isDispatching = status === 'Shipped' && currentOrder.orderStatus !== 'Shipped';

    // Transaction to update status and add status log
    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id },
        data: {
          ...(status && { orderStatus: status }),
          ...(notes && { notes }),
          ...(deliveryPartner !== undefined && { deliveryPartner: deliveryPartner ? deliveryPartner.trim() : null }),
          ...(trackingNumber !== undefined && { trackingNumber: trackingNumber ? trackingNumber.trim() : null }),
          ...(estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) }),
          ...(isDispatching && { dispatchedAt: currentOrder.dispatchedAt || new Date() })
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, slug: true, imageUrl: true } }
            }
          },
          statusLogs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (status && status !== currentOrder.orderStatus) {
        await tx.orderStatusLog.create({
          data: {
            orderId: id,
            fromStatus: currentOrder.orderStatus,
            toStatus: status,
            notes: notes || `Order transitioned to ${status}`,
            updatedBy: req.admin?.role || 'ADMIN',
            staffId: req.admin?.id || null,
            staffName: req.admin?.name || req.admin?.email || 'ADMIN'
          }
        });
      }

      return ord;
    });

    if (status && ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(status)) {
      sendOrderStatusUpdateEmail({
        order: updated,
        newStatus: status,
        deliveryPartner: updated.deliveryPartner,
        trackingNumber: updated.trackingNumber
      }).catch((e) => console.error(e.message));
    }

    res.json({
      success: true,
      message: `Order status updated to ${updated.orderStatus}.`,
      order: sanitizeOrder(updated)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify customer's 6-digit delivery PIN before marking Delivered
 */
export const verifyAndDeliverOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin || pin.toString().trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the valid 6-digit delivery PIN given by the customer.'
      });
    }

    const updatedOrder = await verifyOrderDeliveryPin(id, pin.toString().trim(), req.admin);

    if (!updatedOrder) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect Delivery PIN! Please ask customer for the 6-digit PIN shown on their order receipt.'
      });
    }

    res.json({
      success: true,
      message: 'Delivery PIN verified successfully! Order marked as Delivered and payment collected.',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List staff eligible for order delivery assignment
 */
export const getDeliveryStaffList = async (req, res, next) => {
  try {
    const staff = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, count: staff.length, staff });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign an order to a delivery partner/rider
 */
export const assignOrderDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedToId, deliveryPartner, notes } = req.body;

    if (req.admin && req.admin.role === 'DELIVERY') {
      return res.status(403).json({
        success: false,
        message: 'Delivery personnel cannot assign or reassign orders.'
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    let assignedStaff = null;
    if (assignedToId) {
      assignedStaff = await prisma.admin.findUnique({ where: { id: assignedToId } });
      if (!assignedStaff) {
        return res.status(404).json({ success: false, message: 'Designated staff account not found.' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id },
        data: {
          assignedToId: assignedStaff ? assignedStaff.id : null,
          assignedToName: assignedStaff ? assignedStaff.name : null,
          assignedToPhone: assignedStaff ? assignedStaff.phone : null,
          assignedAt: assignedStaff ? new Date() : null,
          ...(deliveryPartner !== undefined && { deliveryPartner: deliveryPartner ? deliveryPartner.trim() : null })
        },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, sku: true, slug: true, imageUrl: true } } }
          },
          statusLogs: { orderBy: { createdAt: 'desc' } }
        }
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: order.orderStatus,
          toStatus: order.orderStatus,
          notes: notes || (assignedStaff
            ? `Assigned to delivery agent: ${assignedStaff.name} (${assignedStaff.phone || assignedStaff.email})`
            : 'Delivery assignment removed'),
          updatedBy: req.admin?.role || 'ADMIN',
          staffId: req.admin?.id || null,
          staffName: req.admin?.name || req.admin?.email || 'ADMIN'
        }
      });

      return ord;
    });

    res.json({
      success: true,
      message: assignedStaff
        ? `Order successfully assigned to ${assignedStaff.name}.`
        : 'Order assignment removed.',
      order: sanitizeOrder(updated)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dedicated Delivery Portal view showing orders assigned to the logged-in rider
 */
export const getAssignedDeliveryOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const where = {};
    if (req.admin && req.admin.role === 'DELIVERY') {
      where.assignedToId = req.admin.id;
    } else if (req.query.assignedToId) {
      where.assignedToId = req.query.assignedToId;
    }

    if (status && status !== 'All') {
      where.orderStatus = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, sku: true, slug: true, imageUrl: true } } }
          },
          statusLogs: { orderBy: { createdAt: 'desc' } }
        }
      })
    ]);

    res.json({
      success: true,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / pageSize),
      count: orders.length,
      orders: orders.map(sanitizeOrder)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a failed delivery attempt with mandatory reason and timestamp
 */
export const recordFailedDeliveryAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason is required to record a failed delivery attempt (e.g. Customer unavailable, Address untraceable, Rescheduling requested).'
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Authorization: If user is DELIVERY, must be assigned to this order
    if (req.admin && req.admin.role === 'DELIVERY' && order.assignedToId !== req.admin.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update delivery attempts on orders assigned to another agent.'
      });
    }

    // Validate state transition to Failed Delivery
    validateOrderStatusTransition(order.orderStatus, 'Failed Delivery');

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id },
        data: {
          orderStatus: 'Failed Delivery',
          failedAttempts: (order.failedAttempts || 0) + 1,
          failedReason: reason.trim(),
          failedAt: new Date()
        },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, sku: true, slug: true, imageUrl: true } } }
          },
          statusLogs: { orderBy: { createdAt: 'desc' } }
        }
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: order.orderStatus,
          toStatus: 'Failed Delivery',
          notes: `Delivery attempt failed: ${reason.trim()} (Attempt #${(order.failedAttempts || 0) + 1})`,
          updatedBy: req.admin?.role || 'DELIVERY',
          staffId: req.admin?.id || null,
          staffName: req.admin?.name || req.admin?.email || 'STAFF'
        }
      });

      return ord;
    });

    res.json({
      success: true,
      message: `Failed delivery attempt recorded for order #${order.orderNumber}.`,
      order: sanitizeOrder(updated)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Warehouse Returns: Restock to inventory or damaged write-off
 */
export const processOrderReturnController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemDisposition = 'RESTOCK_TO_INVENTORY', reason } = req.body;

    if (req.admin && req.admin.role === 'DELIVERY') {
      return res.status(403).json({
        success: false,
        message: 'Delivery agents cannot process warehouse returns. Please escalate to warehouse administration.'
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason is required to process an order return.'
      });
    }

    const returnedOrder = await processOrderReturn({
      orderId: id,
      itemDisposition: itemDisposition === 'DAMAGED_WRITE_OFF' ? 'DAMAGED_WRITE_OFF' : 'RESTOCK_TO_INVENTORY',
      reason: reason.trim(),
      staffId: req.admin?.id || null,
      staffName: req.admin?.name || req.admin?.email || 'ADMIN'
    });

    res.json({
      success: true,
      message: `Order return processed successfully (${itemDisposition === 'RESTOCK_TO_INVENTORY' ? 'Restocked to Inventory' : 'Damaged Item Write-off'}).`,
      order: returnedOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Coupons & Promotions Management
 */
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      isActive
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code "${cleanCode}" already exists.` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        description: description ? description.trim() : null,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        minOrderAmount: parseFloat(minOrderAmount || 0),
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully.', coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      isActive
    } = req.body;

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(discountType && { discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE' }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(minOrderAmount !== undefined && { minOrderAmount: parseFloat(minOrderAmount) }),
        ...(maxDiscountAmount !== undefined && { maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(usageLimit, 10) : null }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    res.json({ success: true, message: 'Coupon updated successfully.', coupon: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Export Orders to CSV
 */
export const exportOrdersCsv = async (req, res, next) => {
  try {
    const { status, assignedToId, startDate, endDate } = req.query;

    const where = {};
    if (status && status !== 'All') where.orderStatus = status;
    if (assignedToId && assignedToId !== 'All') {
      where.assignedToId = assignedToId === 'unassigned' ? null : assignedToId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true, sku: true } } }
        }
      }
    });

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Address',
      'City',
      'State',
      'PIN Code',
      'Items (SKU)',
      'Subtotal',
      'Delivery Fee',
      'Discount',
      'Coupon Code',
      'Total',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Delivery Partner',
      'Tracking Number',
      'Dispatched At',
      'Assigned Rider',
      'Failed Attempts',
      'Failed Reason',
      'Return Status'
    ];

    const rows = orders.map((o) => {
      const itemsStr = o.items.map((i) => `${i.product?.name || 'Candle'} [${i.product?.sku || 'SKU'}] (Qty: ${i.quantity})`).join('; ');
      return [
        o.orderNumber,
        new Date(o.createdAt).toISOString().split('T')[0],
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.customerEmail,
        o.customerPhone,
        `"${o.shippingAddress.replace(/"/g, '""')}"`,
        `"${o.city}"`,
        `"${o.state}"`,
        o.postalCode,
        `"${itemsStr.replace(/"/g, '""')}"`,
        o.subtotal,
        o.deliveryFee,
        o.discount,
        o.couponCode || '',
        o.total,
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
        `"${o.deliveryPartner || ''}"`,
        `"${o.trackingNumber || ''}"`,
        o.dispatchedAt ? new Date(o.dispatchedAt).toISOString().split('T')[0] : '',
        `"${o.assignedToName || ''}"`,
        o.failedAttempts || 0,
        `"${(o.failedReason || '').replace(/"/g, '""')}"`,
        `"${o.returnStatus || ''}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=diglow_orders_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Export Sales Summary to CSV
 */
export const exportSalesCsv = async (req, res, next) => {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } }
    });

    const headers = ['Product ID', 'Product SKU', 'Product Name', 'Category', 'Units Sold', 'Total Revenue (INR)'];
    const rows = await Promise.all(
      items.map(async (i) => {
        const prod = await prisma.product.findUnique({
          where: { id: i.productId },
          select: { name: true, sku: true, category: true }
        });
        return [
          i.productId,
          `"${prod?.sku || 'N/A'}"`,
          `"${(prod?.name || 'Artisanal Candle').replace(/"/g, '""')}"`,
          `"${prod?.category || 'General'}"`,
          i._sum.quantity || 0,
          i._sum.totalPrice || 0
        ].join(',');
      })
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=diglow_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const getSalesSummary = async (req, res, next) => {
  try {
    const ordersByStatus = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { id: true },
      _sum: { total: true }
    });

    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topProductsWithDetails = await Promise.all(
      topItems.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, imageUrl: true, price: true }
        });
        return {
          productId: item.productId,
          name: prod?.name || 'Unknown Product',
          sku: prod?.sku || 'N/A',
          imageUrl: prod?.imageUrl,
          unitsSold: item._sum.quantity || 0,
          totalRevenue: item._sum.totalPrice || 0
        };
      })
    );

    res.json({
      success: true,
      ordersByStatus,
      topProducts: topProductsWithDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 16. Create Product Variant
 */
export const createProductVariant = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      sku,
      title,
      size,
      fragrance,
      color,
      packaging,
      price,
      compareAtPrice,
      stock = 0,
      lowStockThreshold = 5,
      isActive = true,
      imageUrl,
      options
    } = req.body;

    if (!title || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Variant title and price are required.'
      });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Parent product not found.' });
    }

    const cleanSku =
      (sku && sku.trim().toUpperCase()) ||
      `${product.sku || 'DIG'}-V${Math.floor(100 + Math.random() * 900)}`;

    const variant = await prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.create({
        data: {
          productId,
          sku: cleanSku,
          title: title.trim(),
          size: size ? size.trim() : null,
          fragrance: fragrance ? fragrance.trim() : null,
          color: color ? color.trim() : null,
          packaging: packaging ? packaging.trim() : null,
          price: parseFloat(price),
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          stock: parseInt(stock, 10) || 0,
          lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
          isActive: Boolean(isActive),
          imageUrl: imageUrl ? imageUrl.trim() : null,
          options: options || null
        }
      });

      if (v.stock > 0) {
        await tx.inventoryLog.create({
          data: {
            productId,
            variantId: v.id,
            variantSku: v.sku,
            change: v.stock,
            previousStock: 0,
            newStock: v.stock,
            type: 'INITIAL',
            reason: `Initial stock intake for variant "${v.title}"`,
            updatedBy: req.admin?.name || 'ADMIN'
          }
        });
      }

      return v;
    });

    res.status(201).json({
      success: true,
      message: 'Product variant created successfully.',
      variant
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Variant with this SKU already exists.' });
    }
    next(error);
  }
};

/**
 * 17. Update Product Variant
 */
export const updateProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      sku,
      title,
      size,
      fragrance,
      color,
      packaging,
      price,
      compareAtPrice,
      stock,
      lowStockThreshold,
      isActive,
      imageUrl,
      options
    } = req.body;

    const existing = await prisma.productVariant.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product variant not found.' });
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(sku && { sku: sku.trim().toUpperCase() }),
        ...(title && { title: title.trim() }),
        ...(size !== undefined && { size: size ? size.trim() : null }),
        ...(fragrance !== undefined && { fragrance: fragrance ? fragrance.trim() : null }),
        ...(color !== undefined && { color: color ? color.trim() : null }),
        ...(packaging !== undefined && { packaging: packaging ? packaging.trim() : null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(compareAtPrice !== undefined && {
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null
        }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(lowStockThreshold !== undefined && {
          lowStockThreshold: parseInt(lowStockThreshold, 10)
        }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? imageUrl.trim() : null }),
        ...(options !== undefined && { options })
      }
    });

    res.json({
      success: true,
      message: 'Product variant updated successfully.',
      variant: updated
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Variant with this SKU already exists.' });
    }
    next(error);
  }
};

/**
 * 18. Delete or Archive Product Variant (Historical Integrity Guard)
 */
export const deleteProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product variant not found.' });
    }

    // Check if referenced by historical order items
    const linkedOrderCount = await prisma.orderItem.count({
      where: { variantId: id }
    });

    if (linkedOrderCount > 0) {
      // Archive and deactivate instead of hard delete to preserve historical integrity
      await prisma.productVariant.update({
        where: { id },
        data: {
          isActive: false,
          isArchived: true
        }
      });

      return res.json({
        success: true,
        archived: true,
        message:
          'Variant is referenced by historical orders; deactivated and archived instead of permanently deleted.'
      });
    }

    // If never ordered, safe to delete permanently
    await prisma.productVariant.delete({ where: { id } });

    res.json({
      success: true,
      archived: false,
      message: 'Product variant deleted permanently.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 19. Manual Variant Stock Adjustment with Mandatory Reason & Audit Trail
 */
export const adjustVariantStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, delta, reason } = req.body;

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory reason is required for manual variant stock adjustment.'
      });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product variant not found.' });
    }

    let targetStock;
    if (stock !== undefined && !isNaN(stock) && parseInt(stock, 10) >= 0) {
      targetStock = parseInt(stock, 10);
    } else if (delta !== undefined && !isNaN(delta)) {
      targetStock = Math.max(0, variant.stock + parseInt(delta, 10));
    } else {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative stock quantity or delta is required.'
      });
    }

    const diff = targetStock - variant.stock;

    if (diff === 0) {
      return res.json({
        success: true,
        message: `Variant stock is already at ${targetStock}. No change recorded.`,
        variant
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.update({
        where: { id },
        data: { stock: targetStock }
      });

      // Update parent product stock to reflect change
      await tx.product.update({
        where: { id: variant.productId },
        data: { stock: { increment: diff } }
      });

      await tx.inventoryLog.create({
        data: {
          productId: variant.productId,
          variantId: variant.id,
          variantSku: variant.sku,
          change: diff,
          previousStock: variant.stock,
          newStock: targetStock,
          type: 'MANUAL_ADJUSTMENT',
          reason: `Variant "${variant.title}" stock adjusted: ${reason.trim()}`,
          updatedBy: req.admin?.name || 'ADMIN'
        }
      });

      return v;
    });

    res.json({
      success: true,
      message: `Variant stock updated to ${updated.stock} (Change: ${diff > 0 ? `+${diff}` : diff}).`,
      variant: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 20. Update Product Gallery (Reorder & Set Images)
 */
export const updateProductGallery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gallery } = req.body;

    if (!Array.isArray(gallery)) {
      return res.status(400).json({
        success: false,
        message: 'Gallery must be an array of image URLs.'
      });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { gallery }
    });

    res.json({
      success: true,
      message: 'Product gallery updated successfully.',
      product: updated,
      gallery: updated.gallery
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 21. Remove Image From Product Gallery
 */
export const removeProductGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const imageUrl = req.body?.imageUrl || req.query?.imageUrl;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required to remove from gallery.'
      });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updatedGallery = product.gallery.filter((img) => img !== imageUrl);

    const updated = await prisma.product.update({
      where: { id },
      data: { gallery: updatedGallery }
    });

    res.json({
      success: true,
      message: 'Image removed from product gallery.',
      product: updated,
      gallery: updated.gallery
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 22. Get Abandoned Carts & Recovery Analytics (Phase 13)
 */
export const getAdminAbandonedCarts = async (req, res, next) => {
  try {
    const { startDate, endDate, limit, page, status } = req.query;
    const analytics = await getAbandonedCartAnalytics({
      startDate,
      endDate,
      limit: parseInt(limit, 10) || 20,
      page: parseInt(page, 10) || 1,
      status
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 23. Trigger Abandoned Cart Recovery Batch Dispatch (Phase 13)
 */
export const triggerAbandonedCartRecovery = async (req, res, next) => {
  try {
    const { inactivityMinutes, maxEmails, couponCode, discountText } = req.body;
    const result = await processAbandonedCarts({
      inactivityMinutes: inactivityMinutes ? Number(inactivityMinutes) : 60,
      maxEmails: maxEmails ? Number(maxEmails) : 1,
      couponCode,
      discountText
    });

    res.json({
      success: true,
      message: `Abandoned cart recovery run complete. Dispatched ${result.emailsDispatched} emails.`,
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 24. Record Doorstep Cash on Delivery (COD) Payment Collection (Phase 15)
 * Guards:
 * - Allowed roles: ADMIN, STAFF, or assigned DELIVERY agent
 * - Order must be at eligible stage: 'Out for Delivery' or 'Delivered'
 * - Prevents duplicate collection (cannot collect if already 'Paid')
 * - Validates collected amount matches outstanding order total
 * - Uses atomic database transaction and creates an OrderStatusLog audit trail
 */
export const collectCodPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amountCollected, notes } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, slug: true, imageUrl: true } }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Role-based authorization for DELIVERY agents: can only collect on orders assigned to them
    if (req.admin && req.admin.role === 'DELIVERY') {
      if (!order.assignedToId || order.assignedToId !== req.admin.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to collect payment on orders not assigned to you.'
        });
      }
    }

    // Must be at eligible fulfillment stage
    if (!['Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `COD payment can only be collected when the order is 'Out for Delivery' or 'Delivered'. Current order status: '${order.orderStatus}'.`
      });
    }

    // Prevent duplicate collection confirmations
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been collected and marked Paid for this order.'
      });
    }

    // Amount verification if provided
    if (amountCollected !== undefined && amountCollected !== null) {
      const parsedAmount = Number(amountCollected);
      if (isNaN(parsedAmount) || Math.abs(parsedAmount - order.total) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Collected amount (₹${parsedAmount}) does not match outstanding order total (₹${order.total.toFixed(2)}).`
        });
      }
    }

    const staffName = req.admin?.name || req.admin?.email || 'ADMIN';
    const staffId = req.admin?.id || null;
    const staffRole = req.admin?.role || 'ADMIN';

    // Atomic transaction for updating paymentStatus and logging audit event
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Concurrency safety: double-check paymentStatus within transaction
      const current = await tx.order.findUnique({ where: { id } });
      if (current.paymentStatus === 'Paid') {
        throw new Error('Payment has already been collected for this order.');
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          paymentStatus: 'Paid'
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, slug: true, imageUrl: true } }
            }
          },
          statusLogs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      const auditNote = `COD payment of ₹${order.total.toFixed(2)} collected by ${staffName} (${staffRole}). ${notes ? notes.trim() : ''}`.trim();

      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: order.orderStatus,
          toStatus: order.orderStatus,
          notes: auditNote,
          updatedBy: staffRole,
          staffId,
          staffName
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: `COD payment of ₹${order.total.toFixed(2)} recorded successfully.`,
      order: sanitizeOrder(updatedOrder)
    });
  } catch (error) {
    if (error.message.includes('already been collected')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 25. Record Verified External Refund Completion (Phase 15)
 * Guards:
 * - Allowed roles: ADMIN, STAFF (delivery personnel forbidden)
 * - Order must be 'Cancelled' or 'Returned'
 * - Payment must have been collected ('Paid' or 'Refund Pending')
 * - Requires refund amount and external transaction reference or notes
 * - Atomic database transaction and creates an OrderStatusLog audit trail
 */
export const recordManualRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundAmount, transactionReference, reason, notes } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentStatus === 'Refunded') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been recorded as Refunded.'
      });
    }

    if (!['Paid', 'Refund Pending'].includes(order.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot issue a monetary refund for an order with payment status '${order.paymentStatus}'. Refunds are only applicable to paid orders.`
      });
    }

    if (!['Cancelled', 'Returned'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Monetary refunds can only be settled for Cancelled or Returned orders. Current status: '${order.orderStatus}'.`
      });
    }

    const amount = refundAmount !== undefined ? Number(refundAmount) : order.total;
    if (isNaN(amount) || amount <= 0 || amount > order.total + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Invalid refund amount ₹${refundAmount}. Must be between ₹1 and order total ₹${order.total.toFixed(2)}.`
      });
    }

    const staffName = req.admin?.name || req.admin?.email || 'ADMIN';
    const staffId = req.admin?.id || null;
    const staffRole = req.admin?.role || 'ADMIN';

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          paymentStatus: 'Refunded'
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, slug: true, imageUrl: true } }
            }
          },
          statusLogs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      const refNote = transactionReference ? ` Ref/UTR: ${transactionReference.trim()}.` : '';
      const customNotes = notes || reason || 'External refund verified & settled.';
      const auditNote = `External verified refund of ₹${amount.toFixed(2)} processed by ${staffName} (${staffRole}).${refNote} Notes: ${customNotes}`.trim();

      await tx.orderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: order.orderStatus,
          toStatus: order.orderStatus,
          notes: auditNote,
          updatedBy: staffRole,
          staffId,
          staffName
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Verified external refund of ₹${amount.toFixed(2)} recorded successfully.`,
      order: sanitizeOrder(updatedOrder)
    });
  } catch (error) {
    next(error);
  }
};

