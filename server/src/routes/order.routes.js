import express from 'express';
import { checkout, trackOrder, checkCoupon } from '../controllers/order.controller.js';
import { orderLimiter } from '../middleware/rateLimiter.js';
import { optionalCustomerAuth } from '../middleware/auth.js';

const router = express.Router();

// Validate Coupon Code
router.post('/validate-coupon', checkCoupon);

// Order Checkout (rate limited & optionally authenticated)
router.post('/checkout', orderLimiter, optionalCustomerAuth, checkout);

// Order Tracking by Order Number & Phone
router.post('/track', orderLimiter, trackOrder);

export default router;
