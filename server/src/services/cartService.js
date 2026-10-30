import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { sendAbandonedCartRecoveryEmail } from './notificationService.js';

/**
 * Format and sanitize cart line items snapshot
 */
function sanitizeCartItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.product && item.product.id && item.quantity > 0)
    .map((item) => {
      const unitPrice = Number(item.variant?.price ?? item.product?.price ?? 0);
      return {
        key: item.key || `${item.product.id}_${item.variant?.id || 'standard'}`,
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        imageUrl: item.variant?.imageUrl || item.product.imageUrl || '',
        quantity: Number(item.quantity),
        price: unitPrice,
        totalPrice: Number((unitPrice * item.quantity).toFixed(2)),
        variantId: item.variant?.id || null,
        variantTitle: item.variant?.title || null,
        variantSku: item.variant?.sku || null
      };
    });
}

/**
 * Synchronize client cart with persistent database store
 */
export async function syncCart({
  sessionToken,
  userId = null,
  customerEmail = null,
  customerName = null,
  customerPhone = null,
  items = []
}) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    throw new Error('Valid sessionToken is required to synchronize cart.');
  }

  const cleanSessionToken = sessionToken.trim();
  const cleanEmail = customerEmail && typeof customerEmail === 'string' && customerEmail.includes('@')
    ? customerEmail.trim().toLowerCase()
    : null;
  const cleanPhone = customerPhone && typeof customerPhone === 'string'
    ? customerPhone.replace(/\D/g, '').slice(-10)
    : null;
  const cleanName = customerName && typeof customerName === 'string'
    ? customerName.trim()
    : null;

  const sanitizedItems = sanitizeCartItems(items);
  const subtotal = Number(sanitizedItems.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2));
  const itemCount = sanitizedItems.reduce((sum, i) => sum + i.quantity, 0);

  const existing = await prisma.cart.findUnique({
    where: { sessionToken: cleanSessionToken }
  });

  if (existing) {
    const updated = await prisma.cart.update({
      where: { sessionToken: cleanSessionToken },
      data: {
        userId: userId || existing.userId || null,
        customerEmail: cleanEmail || existing.customerEmail || null,
        customerName: cleanName || existing.customerName || null,
        customerPhone: cleanPhone || existing.customerPhone || null,
        items: sanitizedItems,
        subtotal,
        itemCount,
        lastActivityAt: new Date(),
        // Keep converted carts converted, otherwise active
        status: existing.status === 'CONVERTED' || existing.status === 'RECOVERED'
          ? (itemCount > 0 ? 'ACTIVE' : existing.status)
          : (itemCount > 0 ? (existing.status === 'ABANDONED' ? 'ABANDONED' : 'ACTIVE') : 'ACTIVE')
      }
    });
    return updated;
  }

  const created = await prisma.cart.create({
    data: {
      sessionToken: cleanSessionToken,
      userId,
      customerEmail: cleanEmail,
      customerName: cleanName,
      customerPhone: cleanPhone,
      items: sanitizedItems,
      subtotal,
      itemCount,
      lastActivityAt: new Date(),
      status: 'ACTIVE'
    }
  });

  return created;
}

/**
 * Retrieve cart by session token
 */
export async function getCartBySessionToken(sessionToken) {
  if (!sessionToken) return null;
  return prisma.cart.findUnique({
    where: { sessionToken: sessionToken.trim() }
  });
}

/**
 * Validate and restore cart from a secure recovery token
 * Revalidates live product stock and catalog pricing
 */
export async function getCartByRecoveryToken(recoveryToken) {
  if (!recoveryToken || typeof recoveryToken !== 'string') {
    return { valid: false, error: 'MISSING_TOKEN', message: 'No recovery token provided.' };
  }

  const cleanToken = recoveryToken.trim();
  const cart = await prisma.cart.findUnique({
    where: { recoveryToken: cleanToken }
  });

  if (!cart) {
    return { valid: false, error: 'INVALID_TOKEN', message: 'Invalid or unrecognized cart recovery link.' };
  }

  // Check expiration (72 hours)
  if (cart.recoveryTokenExpiresAt && new Date() > new Date(cart.recoveryTokenExpiresAt)) {
    return { valid: false, error: 'EXPIRED_TOKEN', message: 'This sanctuary recovery link has expired. Your current items have been refreshed.' };
  }

  // Track click timestamp for analytics attribution
  await prisma.cart.update({
    where: { id: cart.id },
    data: { recoveryClickedAt: new Date() }
  });

  // Revalidate live catalog items
  const items = Array.isArray(cart.items) ? cart.items : [];
  const verifiedItems = [];
  const unavailableItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    if (!product || !product.isActive || product.stock < 1) {
      unavailableItems.push(item.name);
      continue;
    }

    let liveVariant = null;
    if (item.variantId) {
      liveVariant = await prisma.productVariant.findUnique({
        where: { id: item.variantId }
      });
      if (!liveVariant || !liveVariant.isActive || liveVariant.isArchived || liveVariant.stock < 1) {
        unavailableItems.push(`${item.name} (${item.variantTitle || 'Edition'})`);
        continue;
      }
    }

    const livePrice = liveVariant ? liveVariant.price : product.price;
    const liveStock = liveVariant ? Math.min(liveVariant.stock, product.stock) : product.stock;

    verifiedItems.push({
      key: item.key,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: livePrice,
        compareAtPrice: product.compareAtPrice,
        imageUrl: liveVariant?.imageUrl || product.imageUrl,
        stock: liveStock
      },
      variant: liveVariant,
      quantity: Math.min(item.quantity, liveStock)
    });
  }

  return {
    valid: true,
    cartId: cart.id,
    sessionToken: cart.sessionToken,
    customerEmail: cart.customerEmail,
    customerName: cart.customerName,
    items: verifiedItems,
    unavailableItems,
    allAvailable: unavailableItems.length === 0 && verifiedItems.length > 0
  };
}

/**
 * Background / scheduled processor for abandoned carts
 * Idempotent: strictly skips carts that have already received recovery emails
 */
export async function processAbandonedCarts({
  inactivityMinutes = 60,
  maxEmails = 1,
  couponCode = null,
  discountText = null
} = {}) {
  const cutoff = new Date(Date.now() - Number(inactivityMinutes) * 60 * 1000);

  // Find eligible abandoned carts
  const candidates = await prisma.cart.findMany({
    where: {
      status: { in: ['ACTIVE', 'ABANDONED'] },
      recoveredOrderId: null,
      itemCount: { gt: 0 },
      customerEmail: { not: null },
      recoveryEmailSentCount: { lt: maxEmails },
      lastActivityAt: { lte: cutoff }
    },
    take: 50,
    orderBy: { lastActivityAt: 'asc' }
  });

  const results = {
    processedCount: 0,
    emailsDispatched: 0,
    skippedUnsubscribed: 0,
    skippedEmpty: 0,
    errors: []
  };

  for (const cart of candidates) {
    results.processedCount++;

    if (!cart.customerEmail || !cart.customerEmail.includes('@')) {
      results.skippedEmpty++;
      continue;
    }

    // Check marketing consent / unsubscribe status
    const cleanEmail = cart.customerEmail.trim().toLowerCase();
    const newsletter = await prisma.newsletter.findUnique({
      where: { email: cleanEmail }
    });

    if (newsletter && (newsletter.hasConsent === false || newsletter.unsubscribedAt !== null)) {
      results.skippedUnsubscribed++;
      // Mark as abandoned without emailing to prevent re-querying
      await prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'ABANDONED' }
      });
      continue;
    }

    // Generate or reuse secure 72-hour token
    const token = cart.recoveryToken || crypto.randomBytes(24).toString('hex');
    const expiresAt = cart.recoveryTokenExpiresAt || new Date(Date.now() + 72 * 3600 * 1000);
    const recoveryUrl = `${config.clientUrl}/cart?recovery_token=${token}`;

    try {
      const emailResult = await sendAbandonedCartRecoveryEmail({
        cart,
        recoveryUrl,
        couponCode,
        discountText
      });

      if (emailResult.sent) {
        results.emailsDispatched++;
        await prisma.cart.update({
          where: { id: cart.id },
          data: {
            status: 'ABANDONED',
            recoveryToken: token,
            recoveryTokenExpiresAt: expiresAt,
            recoveryEmailSentCount: cart.recoveryEmailSentCount + 1,
            lastEmailSentAt: new Date()
          }
        });
      }
    } catch (err) {
      results.errors.push({ cartId: cart.id, email: cart.customerEmail, error: err.message });
    }
  }

  return results;
}

/**
 * Mark cart as converted/recovered upon successful checkout
 * Protects against duplicate attribution
 */
export async function attributeCartConversion({
  orderId,
  orderTotal,
  sessionToken = null,
  recoveryToken = null,
  customerEmail = null
}) {
  let cart = null;

  if (recoveryToken && typeof recoveryToken === 'string') {
    cart = await prisma.cart.findUnique({
      where: { recoveryToken: recoveryToken.trim() }
    });
  }

  if (!cart && sessionToken && typeof sessionToken === 'string') {
    cart = await prisma.cart.findUnique({
      where: { sessionToken: sessionToken.trim() }
    });
  }

  if (!cart && customerEmail && typeof customerEmail === 'string') {
    cart = await prisma.cart.findFirst({
      where: {
        customerEmail: customerEmail.trim().toLowerCase(),
        recoveredOrderId: null,
        status: { in: ['ACTIVE', 'ABANDONED'] }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  if (!cart) return null;

  // Prevent double counting if already attributed
  if (cart.recoveredOrderId) {
    return cart;
  }

  const isRecovered = Boolean(cart.recoveryClickedAt || cart.recoveryEmailSentCount > 0);

  const updated = await prisma.cart.update({
    where: { id: cart.id },
    data: {
      status: isRecovered ? 'RECOVERED' : 'CONVERTED',
      recoveredOrderId: orderId,
      recoveredRevenue: Number(orderTotal) || 0,
      recoveredAt: new Date()
    }
  });

  return updated;
}

/**
 * Retrieve abandoned cart analytics and recovery KPI metrics
 */
export async function getAbandonedCartAnalytics({
  startDate = null,
  endDate = null,
  limit = 20,
  page = 1,
  status = null
} = {}) {
  const whereClause = {};

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  if (status && status !== 'ALL') {
    whereClause.status = status;
  }

  // Aggregate metrics
  const totalCarts = await prisma.cart.count({ where: whereClause });
  const abandonedCartsCount = await prisma.cart.count({
    where: { ...whereClause, status: 'ABANDONED' }
  });
  const emailsSentAggregate = await prisma.cart.aggregate({
    where: whereClause,
    _sum: { recoveryEmailSentCount: true }
  });
  const totalClicks = await prisma.cart.count({
    where: { ...whereClause, recoveryClickedAt: { not: null } }
  });
  const recoveredCarts = await prisma.cart.findMany({
    where: { ...whereClause, recoveredOrderId: { not: null } },
    select: { recoveredRevenue: true }
  });

  const recoveredOrdersCount = recoveredCarts.length;
  const recoveredRevenue = recoveredCarts.reduce((sum, c) => sum + (c.recoveredRevenue || 0), 0);
  const emailsSent = emailsSentAggregate._sum.recoveryEmailSentCount || 0;
  const recoveryRate = emailsSent > 0 ? Number(((recoveredOrdersCount / emailsSent) * 100).toFixed(1)) : 0;

  // Paginated list
  const skip = (Math.max(1, page) - 1) * limit;
  const carts = await prisma.cart.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    skip,
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      recoveredOrder: {
        select: { id: true, orderNumber: true, total: true, orderStatus: true, createdAt: true }
      }
    }
  });

  const kpis = {
    totalCarts,
    abandonedCartsCount,
    abandonedCarts: abandonedCartsCount,
    emailsSent,
    emailsDispatched: emailsSent,
    totalClicks,
    recoveryClicks: totalClicks,
    recoveredOrdersCount,
    recoveredOrders: recoveredOrdersCount,
    recoveredRevenue: Number(recoveredRevenue.toFixed(2)),
    recoveryRate,
    recoveryRatePercent: recoveryRate
  };

  return {
    success: true,
    kpis,
    metrics: kpis,
    pagination: {
      page: Math.max(1, page),
      limit,
      total: totalCarts,
      totalPages: Math.ceil(totalCarts / limit) || 1
    },
    carts: carts.map((c) => ({
      id: c.id,
      sessionToken: c.sessionToken,
      customerName: c.customerName || c.user?.name || 'Guest Connoisseur',
      customerEmail: c.customerEmail || c.user?.email || null,
      customerPhone: c.customerPhone || null,
      items: c.items,
      itemCount: c.itemCount,
      subtotal: c.subtotal,
      status: c.status,
      recoveryEmailSentCount: c.recoveryEmailSentCount,
      lastEmailSentAt: c.lastEmailSentAt,
      recoveryClickedAt: c.recoveryClickedAt,
      recoveredAt: c.recoveredAt,
      recoveredRevenue: c.recoveredRevenue,
      recoveredOrder: c.recoveredOrder,
      lastActivityAt: c.lastActivityAt,
      createdAt: c.createdAt
    }))
  };
}
