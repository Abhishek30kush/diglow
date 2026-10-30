import { syncCart, getCartBySessionToken, getCartByRecoveryToken } from '../services/cartService.js';

/**
 * Synchronize client shopping cart state to PostgreSQL database
 * Handles guest carts via sessionToken and connects authenticated customers
 */
export async function syncCartHandler(req, res, next) {
  try {
    const { sessionToken, items, customerEmail, customerName, customerPhone } = req.body;

    if (!sessionToken || typeof sessionToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid anonymous sessionToken is required to track cart state.'
      });
    }

    const userId = req.user?.id || null;
    const resolvedEmail = customerEmail || req.user?.email || null;
    const resolvedName = customerName || req.user?.name || null;
    const resolvedPhone = customerPhone || req.user?.phone || null;

    const cart = await syncCart({
      sessionToken,
      userId,
      customerEmail: resolvedEmail,
      customerName: resolvedName,
      customerPhone: resolvedPhone,
      items: Array.isArray(items) ? items : []
    });

    return res.status(200).json({
      success: true,
      message: 'Cart synchronized successfully.',
      cart: {
        id: cart.id,
        sessionToken: cart.sessionToken,
        status: cart.status,
        subtotal: cart.subtotal,
        itemCount: cart.itemCount,
        customerEmail: cart.customerEmail,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch cart details by anonymous session token
 */
export async function getCartHandler(req, res, next) {
  try {
    const sessionToken =
      req.query.sessionToken ||
      req.headers['x-cart-session-token'] ||
      req.params.sessionToken;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'sessionToken query parameter or x-cart-session-token header required.'
      });
    }

    const cart = await getCartBySessionToken(sessionToken);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'No cart found for this session.'
      });
    }

    return res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle recovery link visit: validate expiring token, mark click timestamp,
 * and verify product stock and live pricing.
 */
export async function recoverCartHandler(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Recovery token parameter is required.'
      });
    }

    const result = await getCartByRecoveryToken(token);

    if (!result.valid) {
      return res.status(404).json({
        success: false,
        message: result.message || 'Recovery link is invalid or expired.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your sanctuary cart has been restored.',
      cart: result
    });
  } catch (error) {
    next(error);
  }
}
