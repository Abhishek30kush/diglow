import express from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  handleWebhook
} from '../controllers/payment.controller.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/razorpay/create-order', createPaymentOrder);
router.post('/razorpay/verify', authLimiter, verifyPayment);
router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
