import prisma from '../lib/prisma.js';
import { cancelOrderWithStockRestoration, sanitizeOrder } from '../services/orderService.js';

/**
 * Get all saved addresses for customer
 */
export const getCustomerAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new saved address
 */
export const addCustomerAddress = async (req, res, next) => {
  try {
    const { label, name, phone, street, city, state, postalCode, isDefault } = req.body;

    if (!name || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'All address fields are required.'
      });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        label: label ? label.trim() : 'Home',
        name: name.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        isDefault: Boolean(isDefault)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing saved address
 */
export const updateCustomerAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, name, phone, street, city, state, postalCode, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Address not found in your account.'
      });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label: label !== undefined ? label.trim() : existing.label,
        name: name !== undefined ? name.trim() : existing.name,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        street: street !== undefined ? street.trim() : existing.street,
        city: city !== undefined ? city.trim() : existing.city,
        state: state !== undefined ? state.trim() : existing.state,
        postalCode: postalCode !== undefined ? postalCode.trim() : existing.postalCode,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : existing.isDefault
      }
    });

    res.json({
      success: true,
      message: 'Address updated successfully.',
      address: updated
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Delete a saved address
 */
export const deleteCustomerAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.'
      });
    }

    await prisma.address.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Address removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set an address as default
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json({
      success: true,
      message: 'Default address updated.',
      address: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer order history
 */
export const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { customerEmail: req.user.email }
        ]
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
                scentProfile: true
              }
            }
          }
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      orders: orders.map(sanitizeOrder)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer cancel order with automatic stock restoration
 */
export const cancelCustomerOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Verify order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { customerEmail: req.user.email }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found in your account.'
      });
    }

    const cancelledOrder = await cancelOrderWithStockRestoration({
      orderId: order.id,
      reason: reason || 'Cancelled by customer from account portal',
      cancelledBy: 'CUSTOMER'
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully. Any reserved stock has been returned.',
      order: cancelledOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder items from a past order using live stock and current catalog prices
 */
export const reorderCustomerOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { customerEmail: req.user.email }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found in your account.'
      });
    }

    const { getReorderAvailability } = await import('../services/orderService.js');
    const reorderData = await getReorderAvailability(order.id, req.user.id);

    res.json({
      success: true,
      message: reorderData.allAvailable
        ? 'All items are in stock and ready to add to your cart.'
        : 'Some items from this previous order have limited stock, changed prices, or are currently unavailable.',
      reorder: reorderData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer's wishlist items
 */
export const getCustomerWishlist = async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            category: true,
            scentProfile: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            imageUrl: true,
            isActive: true,
            productVariants: {
              where: { isActive: true, isArchived: false },
              select: {
                id: true,
                title: true,
                price: true,
                compareAtPrice: true,
                stock: true,
                sku: true,
                size: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      count: items.length,
      wishlist: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        addedAt: i.createdAt,
        product: i.product
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a product to customer wishlist
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId
        }
      },
      update: {},
      create: {
        userId: req.user.id,
        productId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            imageUrl: true,
            stock: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `"${product.name}" added to your sanctum wishlist.`,
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a product from customer wishlist
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user.id,
        productId
      }
    });

    res.json({
      success: true,
      message: 'Item removed from your wishlist.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer newsletter & dispatch preferences
 */
export const getCustomerNewsletterPreferences = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const subscription = await prisma.newsletter.findUnique({
      where: { email: user.email.toLowerCase() }
    });

    const isSubscribed = Boolean(subscription && subscription.hasConsent && !subscription.unsubscribedAt);

    res.json({
      success: true,
      subscribed: isSubscribed,
      consentTimestamp: subscription ? subscription.consentTimestamp : null,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer newsletter & dispatch preferences
 */
export const updateCustomerNewsletterPreferences = async (req, res, next) => {
  try {
    const { subscribed } = req.body;
    const shouldSubscribe = Boolean(subscribed);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const email = user.email.toLowerCase();

    const result = await prisma.newsletter.upsert({
      where: { email },
      update: {
        hasConsent: shouldSubscribe,
        consentTimestamp: shouldSubscribe ? new Date() : undefined,
        unsubscribedAt: shouldSubscribe ? null : new Date(),
        source: 'customer_account_dashboard'
      },
      create: {
        email,
        hasConsent: shouldSubscribe,
        consentTimestamp: new Date(),
        unsubscribedAt: shouldSubscribe ? null : new Date(),
        source: 'customer_account_dashboard'
      }
    });

    res.json({
      success: true,
      subscribed: result.hasConsent && !result.unsubscribedAt,
      message: shouldSubscribe
        ? 'You have successfully subscribed to DiGlow Sanctum Notes & VIP Releases.'
        : 'You have been unsubscribed from promotional communications.'
    });
  } catch (error) {
    next(error);
  }
};


