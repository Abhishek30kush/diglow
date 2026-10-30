import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { sanitizeOrder } from './orderService.js';
import { sendOrderConfirmationEmail } from './notificationService.js';

/**
 * Determine if real Razorpay credentials are provided
 */
export function isRazorpayConfigured() {
  return Boolean(
    config.razorpayKeyId &&
      config.razorpayKeySecret &&
      !config.razorpayKeyId.includes('mock') &&
      !config.razorpayKeySecret.includes('mock')
  );
}

/**
 * Create a Razorpay Order
 * Creates Razorpay order with currency INR and server-calculated amount in paise
 */
export async function createRazorpayOrder({ orderId }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  if (order.paymentStatus === 'Paid') {
    throw new Error('This order has already been paid.');
  }

  // Idempotency: If razorpayOrderId already exists on order, return existing
  if (order.razorpayOrderId) {
    return {
      orderId: order.id,
      razorpayOrderId: order.razorpayOrderId,
      amount: Math.round(order.total * 100),
      currency: 'INR',
      keyId: config.razorpayKeyId || 'rzp_test_mock_diglow'
    };
  }

  const amountInPaise = Math.round(order.total * 100);
  let razorpayOrderId = null;

  if (isRazorpayConfigured()) {
    try {
      const auth = Buffer.from(
        `${config.razorpayKeyId}:${config.razorpayKeySecret}`
      ).toString('base64');

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.orderNumber,
          notes: {
            orderId: order.id,
            customerPhone: order.customerPhone
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to create Razorpay order');
      }

      const rzpData = await response.json();
      razorpayOrderId = rzpData.id;
    } catch (err) {
      console.error('Razorpay API error, falling back to structured test mode:', err.message);
      razorpayOrderId = `order_test_${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
    }
  } else {
    // Structured Test/Sandbox mode for development when credentials are not configured
    razorpayOrderId = `order_test_${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  // Update order with razorpayOrderId
  await prisma.order.update({
    where: { id: orderId },
    data: {
      razorpayOrderId,
      paymentMethod: 'RAZORPAY'
    }
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId: config.razorpayKeyId || 'rzp_test_mock_diglow',
    isTestMode: !isRazorpayConfigured()
  };
}

/**
 * Verify Razorpay Payment Signature on the Backend
 * Idempotent: safe against duplicate requests/retries
 */
export async function verifyRazorpayPayment({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
}) {
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new Error('Missing payment verification details.');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, imageUrl: true } }
        }
      }
    }
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  // Idempotency check: If already marked Paid, return immediately without duplicate processing
  if (order.paymentStatus === 'Paid') {
    return {
      success: true,
      alreadyProcessed: true,
      order: sanitizeOrder(order)
    };
  }

  // Signature verification
  const secret = config.razorpayKeySecret || 'diglow_test_payment_secret_2026';
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  // If in sandbox mode without real credentials, accept valid test signature or standard HMAC
  const isValidSignature =
    generatedSignature === razorpaySignature ||
    (!isRazorpayConfigured() && razorpaySignature.startsWith('sig_test_'));

  if (!isValidSignature) {
    // Log security failure
    console.warn(`⚠️ Invalid payment signature detected for order ${order.orderNumber}`);
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.orderStatus,
        toStatus: order.orderStatus,
        notes: `Invalid payment signature attempted: ${razorpayPaymentId}`,
        updatedBy: 'SYSTEM'
      }
    });
    throw new Error('Payment signature verification failed. Untrusted payment.');
  }

  // Update order inside an atomic transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'Paid',
        orderStatus: order.orderStatus === 'Pending' ? 'Confirmed' : order.orderStatus,
        paymentMethod: 'RAZORPAY',
        razorpayPaymentId,
        razorpaySignature,
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, imageUrl: true } }
          }
        }
      }
    });

    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: 'Pending',
        toStatus: updated.orderStatus,
        notes: `Razorpay payment verified successfully (Payment ID: ${razorpayPaymentId})`,
        updatedBy: 'SYSTEM'
      }
    });

    return updated;
  });

  // Trigger confirmation email
  sendOrderConfirmationEmail({ order: updatedOrder, deliveryPin: null }).catch((err) =>
    console.error('Email error:', err.message)
  );

  return {
    success: true,
    alreadyProcessed: false,
    order: sanitizeOrder(updatedOrder)
  };
}

/**
 * Verify Razorpay Webhook Signature
 */
export function verifyWebhookSignature({ rawBody, signatureHeader }) {
  const secret = config.razorpayWebhookSecret || 'diglow_test_webhook_secret_2026';
  if (!signatureHeader || !rawBody) {
    return false;
  }

  const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const signatureBuf = Buffer.from(signatureHeader, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
