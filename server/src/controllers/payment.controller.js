import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyWebhookSignature,
  isRazorpayConfigured
} from '../services/paymentService.js';
import { config } from '../config/index.js';

/**
 * Get public payment configuration
 * COD-Only Launch: Informs clients that online payments are disabled
 */
export const getPaymentConfig = (req, res) => {
  res.json({
    success: true,
    enabled: false,
    codOnly: true,
    currency: 'INR',
    message: 'Online payments are temporarily disabled for the initial launch. Only Cash on Delivery (COD) is supported.'
  });
};

/**
 * Create a Razorpay Order for an existing pending order
 * Disabled during initial COD-only launch
 */
export const createPaymentOrder = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Online payments are temporarily disabled for the initial launch. Only Cash on Delivery (COD) is supported.'
  });
};

/**
 * Verify Razorpay payment signature
 * Disabled during initial COD-only launch
 */
export const verifyPayment = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Online payments are temporarily disabled for the initial launch. Only Cash on Delivery (COD) is supported.'
  });
};

/**
 * Handle Razorpay Webhooks
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = verifyWebhookSignature({
      rawBody: JSON.stringify(req.body),
      signatureHeader: signature
    });

    if (!isValid && isRazorpayConfigured()) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    console.log(`🔔 Razorpay Webhook Event: ${event}`);

    // Idempotent processing of payment.captured event
    if (event === 'payment.captured' && req.body.payload?.payment?.entity) {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Note: Full verification flow handles idempotency if already updated
      console.log(`Payment captured via webhook: Order ${razorpayOrderId}, Payment ${razorpayPaymentId}`);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};
