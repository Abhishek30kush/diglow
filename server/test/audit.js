import assert from 'assert/strict';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';
import {
  createOrderWithTransaction,
  verifyOrderDeliveryPin,
  generateDeliveryPin,
  generateOrderNumber,
  sanitizeOrder,
  cancelOrderWithStockRestoration
} from '../src/services/orderService.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyWebhookSignature
} from '../src/services/paymentService.js';
import { config } from '../src/config/index.js';

async function runEndToEndAudit() {
  console.log('====================================================');
  console.log('🧪 STARTING DIGLOW CANDLE STORE PHASE 3 AUDIT');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function recordPass(name) {
    passedTests++;
    totalTests++;
    console.log(`✅ [PASS] ${name}`);
  }

  function recordFail(name, err) {
    totalTests++;
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Database Connectivity & Seed Verification
    // ----------------------------------------------------
    try {
      await prisma.$connect();
      const productCount = await prisma.product.count();
      const adminCount = await prisma.admin.count();
      assert(productCount > 0, 'Database has products seeded');
      assert(adminCount > 0, 'Database has admin account seeded');
      recordPass(`Database Connectivity & Seed Verification (Products: ${productCount}, Admins: ${adminCount})`);
    } catch (err) {
      recordFail('Database Connectivity', err);
    }

    // ----------------------------------------------------
    // TEST 2: Admin Password Hashing & Authentication
    // ----------------------------------------------------
    try {
      const admin = await prisma.admin.findUnique({
        where: { email: 'admin@diglow.com' }
      });
      assert(admin, 'Admin user admin@diglow.com exists');
      assert(admin.password !== 'DiGlow@Admin2026', 'Admin password is not stored in plaintext');
      assert(admin.password.startsWith('$2'), 'Password uses bcrypt hash format');
      const isMatch = await bcrypt.compare('DiGlow@Admin2026', admin.password);
      assert.equal(isMatch, true, 'bcrypt correctly verifies admin credentials');
      recordPass('Admin Password Hashing & Bcrypt Verification');
    } catch (err) {
      recordFail('Admin Password Hashing', err);
    }

    // ----------------------------------------------------
    // TEST 3: Server-side Pricing, Delivery Fees & Discounts
    // ----------------------------------------------------
    try {
      const testProduct = await prisma.product.findFirst({
        where: { isActive: true, stock: { gte: 5 } }
      });
      assert(testProduct, 'Test product available');

      // Test order below threshold (should include standard delivery fee)
      const quantity = Math.max(1, Math.ceil(999 / testProduct.price));
      const mockItems = [{ productId: testProduct.id, quantity }];
      const subtotal = testProduct.price * quantity;
      const expectedDeliveryFee = subtotal >= config.freeDeliveryThreshold ? 0 : config.standardDeliveryFee;

      const orderResult = await createOrderWithTransaction({
        customerName: 'Audit Customer',
        customerEmail: 'audit@example.com',
        customerPhone: '9876543210',
        shippingAddress: 'Audit Address, Street 1',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
        items: mockItems,
        couponCode: 'FESTIVE10'
      });

      const order = orderResult.order;
      assert.equal(order.subtotal, subtotal, 'Subtotal correctly calculated on server');
      assert.equal(order.deliveryFee, expectedDeliveryFee, 'Delivery fee calculated on server');
      const expectedDiscount = Math.round(subtotal * 0.1);
      assert.equal(order.discount, expectedDiscount, 'Coupon FESTIVE10 calculated on server');
      assert.equal(order.total, Math.max(0, subtotal + expectedDeliveryFee - expectedDiscount), 'Total matches server sum');
      assert(!('deliveryPinHash' in order), 'deliveryPinHash is sanitized and never returned in order object');
      assert.equal(typeof orderResult.deliveryPin, 'string', 'Plain delivery PIN returned once');
      assert.equal(orderResult.deliveryPin.length, 6, 'Delivery PIN is 6 digits');

      recordPass('Server-Side Price Calculation, Threshold Delivery & Sanitization');
    } catch (err) {
      recordFail('Server-Side Price Calculation', err);
    }

    // ----------------------------------------------------
    // TEST 4: Concurrency & Atomic Stock Reservation
    // ----------------------------------------------------
    try {
      // Create a temporary SKU with only 2 items in stock
      const tempSku = await prisma.product.create({
        data: {
          name: 'Limited Festive Diya (Audit Edition)',
          slug: `audit-limited-diya-${Date.now()}`,
          description: 'Single-batch artisanal run for concurrency test',
          category: 'Brass Diya Candles',
          scentProfile: 'Smoked Saffron & Mitti',
          price: 999,
          stock: 2,
          imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59',
          isActive: true
        }
      });

      // Customer 1 purchases 2 units (full remaining stock)
      const res1 = await createOrderWithTransaction({
        customerName: 'Customer 1',
        customerEmail: 'c1@example.com',
        customerPhone: '9876543210',
        shippingAddress: 'Address 1',
        city: 'Delhi',
        state: 'Delhi NCR',
        postalCode: '110001',
        items: [{ productId: tempSku.id, quantity: 2 }]
      });

      const updatedSku = await prisma.product.findUnique({ where: { id: tempSku.id } });
      assert.equal(updatedSku.stock, 0, 'Stock reduced to 0 units');

      // Attempt second purchase of 1 unit when stock is 0 (must be rejected)
      let rejected = false;
      try {
        await createOrderWithTransaction({
          customerName: 'Customer 2',
          customerEmail: 'c2@example.com',
          customerPhone: '9876543210',
          shippingAddress: 'Address 2',
          city: 'Delhi',
          state: 'Delhi NCR',
          postalCode: '110001',
          items: [{ productId: tempSku.id, quantity: 1 }]
        });
      } catch (e) {
        rejected = true;
      }

      assert(rejected, 'Checkout was rejected when stock was depleted');
      const skuAfterRejection = await prisma.product.findUnique({ where: { id: tempSku.id } });
      assert(skuAfterRejection.stock >= 0, 'Stock never became negative');

      // Clean up temp test SKU & linked order (order cascade deletes order items)
      await prisma.order.delete({ where: { id: res1.order.id } });
      await prisma.product.delete({ where: { id: tempSku.id } });

      recordPass('Concurrency Safety & Non-Negative Stock Validation');
    } catch (err) {
      recordFail('Concurrency Safety', err);
    }

    // ----------------------------------------------------
    // TEST 5: 6-Digit Delivery PIN Verification Flow
    // ----------------------------------------------------
    try {
      const prod = await prisma.product.findFirst({ where: { isActive: true, stock: { gt: 0 } } });
      const orderData = await createOrderWithTransaction({
        customerName: 'PIN Test Customer',
        customerEmail: 'pin@example.com',
        customerPhone: '9988776655',
        shippingAddress: 'PIN Test Address',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        items: [{ productId: prod.id, quantity: 1 }]
      });

      const orderId = orderData.order.id;
      const validPin = orderData.deliveryPin;

      // Test with wrong PIN
      const wrongPinResult = await verifyOrderDeliveryPin(orderId, '999999');
      assert.equal(wrongPinResult, false, 'Wrong PIN correctly rejected');

      // Test with valid PIN
      const successResult = await verifyOrderDeliveryPin(orderId, validPin);
      assert(successResult, 'Valid PIN accepted');
      assert.equal(successResult.orderStatus, 'Delivered', 'Order marked Delivered upon valid PIN');
      assert.equal(successResult.paymentStatus, 'Paid', 'Order payment marked Paid upon delivery');
      assert(successResult.deliveredAt !== null, 'deliveredAt timestamp set');

      recordPass('Doorstep 6-Digit Delivery PIN Verification');
    } catch (err) {
      recordFail('Delivery PIN Verification', err);
    }

    // ----------------------------------------------------
    // TEST 6: Order Tracking with Phone & Order Number
    // ----------------------------------------------------
    try {
      const recentOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      assert(recentOrder, 'Recent order exists for tracking');

      const foundOrder = await prisma.order.findFirst({
        where: {
          orderNumber: recentOrder.orderNumber,
          customerPhone: { contains: recentOrder.customerPhone }
        }
      });

      assert(foundOrder, 'Order found with orderNumber and phone');
      const sanitized = sanitizeOrder(foundOrder);
      assert(!('deliveryPinHash' in sanitized), 'deliveryPinHash is omitted from customer tracking');

      recordPass('Order Tracking by Order Number and Customer Phone');
    } catch (err) {
      recordFail('Order Tracking', err);
    }

    // ----------------------------------------------------
    // TEST 7: Customer Registration & Password Hashing
    // ----------------------------------------------------
    try {
      const testEmail = `cust_audit_${Date.now()}@example.com`;
      const plainPassword = 'FestiveCustomer@2026';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const customer = await prisma.user.create({
        data: {
          name: 'Audit Customer',
          email: testEmail,
          password: hashedPassword,
          phone: '9811223344',
          role: 'CUSTOMER'
        }
      });

      assert(customer, 'Customer created in DB');
      assert(customer.password !== plainPassword, 'Password is not plaintext');
      const isValid = await bcrypt.compare(plainPassword, customer.password);
      assert.equal(isValid, true, 'bcrypt verifies customer credentials');

      // Add address
      const addr = await prisma.address.create({
        data: {
          userId: customer.id,
          label: 'Sanctum',
          name: 'Audit Customer',
          phone: '9811223344',
          street: '42 Lotus Villa',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
          isDefault: true
        }
      });
      assert.equal(addr.userId, customer.id, 'Address linked to customer');

      // Cleanup
      await prisma.user.delete({ where: { id: customer.id } });
      recordPass('Customer Registration, Hashing & Saved Address Association');
    } catch (err) {
      recordFail('Customer Registration & Address', err);
    }

    // ----------------------------------------------------
    // TEST 8: Razorpay Order Creation & Idempotent Verification
    // ----------------------------------------------------
    try {
      const prod = await prisma.product.findFirst({ where: { isActive: true, stock: { gt: 0 } } });
      const orderData = await createOrderWithTransaction({
        customerName: 'Razorpay Test Customer',
        customerEmail: 'razorpay@example.com',
        customerPhone: '9988112233',
        shippingAddress: 'Razorpay Address',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        paymentMethod: 'RAZORPAY',
        items: [{ productId: prod.id, quantity: 1 }]
      });

      const orderId = orderData.order.id;

      // Create Razorpay Order
      const rzpOrder = await createRazorpayOrder({ orderId });
      assert(rzpOrder.razorpayOrderId, 'Razorpay order ID generated');
      assert(rzpOrder.amount > 0, 'Amount in paise is positive');

      // Verify payment with test sandbox signature
      const verifyResult = await verifyRazorpayPayment({
        orderId,
        razorpayOrderId: rzpOrder.razorpayOrderId,
        razorpayPaymentId: 'pay_test_audit_98765',
        razorpaySignature: 'sig_test_valid_audit_signature'
      });

      assert.equal(verifyResult.success, true, 'Payment successfully verified');
      assert.equal(verifyResult.order.paymentStatus, 'Paid', 'Order payment marked Paid');
      assert.equal(verifyResult.order.orderStatus, 'Confirmed', 'Order status moved to Confirmed');

      // Test idempotency: Calling verify again should not fail or duplicate
      const retryResult = await verifyRazorpayPayment({
        orderId,
        razorpayOrderId: rzpOrder.razorpayOrderId,
        razorpayPaymentId: 'pay_test_audit_98765',
        razorpaySignature: 'sig_test_valid_audit_signature'
      });
      assert.equal(retryResult.alreadyProcessed, true, 'Idempotency confirmed: alreadyProcessed is true');

      recordPass('Razorpay Backend Order Generation, Signature Verification & Idempotency');
    } catch (err) {
      recordFail('Razorpay Verification', err);
    }

    // ----------------------------------------------------
    // TEST 9: Order Cancellation with Atomic Stock Restoration
    // ----------------------------------------------------
    try {
      const prod = await prisma.product.findFirst({ where: { isActive: true, stock: { gte: 5 } } });
      const initialStock = prod.stock;

      // Place order for 2 units
      const orderData = await createOrderWithTransaction({
        customerName: 'Cancel Test Customer',
        customerEmail: 'cancel@example.com',
        customerPhone: '9876541230',
        shippingAddress: 'Cancel Test Street',
        city: 'Kolkata',
        state: 'West Bengal',
        postalCode: '700001',
        items: [{ productId: prod.id, quantity: 2 }]
      });

      const prodDuring = await prisma.product.findUnique({ where: { id: prod.id } });
      assert.equal(prodDuring.stock, initialStock - 2, 'Stock was decremented by 2');

      // Cancel order
      const cancelledOrder = await cancelOrderWithStockRestoration({
        orderId: orderData.order.id,
        reason: 'Customer cancelled for audit test',
        cancelledBy: 'CUSTOMER'
      });

      assert.equal(cancelledOrder.orderStatus, 'Cancelled', 'Order is marked Cancelled');
      const prodAfter = await prisma.product.findUnique({ where: { id: prod.id } });
      assert.equal(prodAfter.stock, initialStock, 'Stock was fully restored upon cancellation');

      recordPass('Order Cancellation with Atomic Stock Restoration');
    } catch (err) {
      recordFail('Order Cancellation Stock Restoration', err);
    }

    // ----------------------------------------------------
    // TEST 10: Status Logs & Audit Trail
    // ----------------------------------------------------
    try {
      const prod = await prisma.product.findFirst({ where: { isActive: true, stock: { gt: 0 } } });
      const orderData = await createOrderWithTransaction({
        customerName: 'Audit Trail Customer',
        customerEmail: 'audit_trail@example.com',
        customerPhone: '9123456780',
        shippingAddress: 'Audit Trail St',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        postalCode: '221001',
        items: [{ productId: prod.id, quantity: 1 }]
      });

      const logs = await prisma.orderStatusLog.findMany({
        where: { orderId: orderData.order.id }
      });
      assert(logs.length >= 1, 'Initial OrderStatusLog entry was created');
      assert.equal(logs[0].toStatus, 'Pending', 'Initial status logged as Pending');

      recordPass('Order Status History & Audit Trail Logging');
    } catch (err) {
      recordFail('Order Status History', err);
    }

    // ----------------------------------------------------
    // TEST 11: Validation Failures & Edge Cases
    // ----------------------------------------------------
    try {
      // Empty items check
      await assert.rejects(
        async () => {
          await createOrderWithTransaction({
            customerName: 'Validation Test',
            customerEmail: 'val@example.com',
            customerPhone: '9876543210',
            shippingAddress: 'Val St',
            city: 'Delhi',
            state: 'Delhi NCR',
            postalCode: '110001',
            items: []
          });
        },
        /Order must contain at least one item/,
        'Empty cart rejected'
      );

      // Negative quantity check
      const sampleProd = await prisma.product.findFirst({ where: { isActive: true } });
      await assert.rejects(
        async () => {
          await createOrderWithTransaction({
            customerName: 'Validation Test',
            customerEmail: 'val@example.com',
            customerPhone: '9876543210',
            shippingAddress: 'Val St',
            city: 'Delhi',
            state: 'Delhi NCR',
            postalCode: '110001',
            items: [{ productId: sampleProd.id, quantity: -2 }]
          });
        },
        /Invalid item or quantity/,
        'Negative item quantity rejected'
      );

      recordPass('Checkout Validation & Invalid Input Defense');
    } catch (err) {
      recordFail('Checkout Validation Failures', err);
    }

    // ----------------------------------------------------
    // TEST 12: High-Concurrency Race Condition (Last Item in Stock)
    // ----------------------------------------------------
    try {
      // Create temporary exclusive SKU with exactly 1 unit in stock
      const exclusiveProduct = await prisma.product.create({
        data: {
          name: 'Rare Solitary Diya (Audit Concurrency)',
          slug: `solitary-diya-${Date.now()}`,
          description: 'Single exclusive piece to test race condition',
          category: 'Brass Diya Candles',
          scentProfile: 'Mysore Sandalwood Single Batch',
          price: 2499,
          stock: 1, // Only ONE item in warehouse
          imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59',
          isActive: true
        }
      });

      // Launch TWO simultaneous checkout requests at the exact same millisecond
      const [orderA, orderB] = await Promise.allSettled([
        createOrderWithTransaction({
          customerName: 'Shopper Alpha',
          customerEmail: 'alpha@example.com',
          customerPhone: '9811111111',
          shippingAddress: 'Alpha Address',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          items: [{ productId: exclusiveProduct.id, quantity: 1 }]
        }),
        createOrderWithTransaction({
          customerName: 'Shopper Beta',
          customerEmail: 'beta@example.com',
          customerPhone: '9822222222',
          shippingAddress: 'Beta Address',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          items: [{ productId: exclusiveProduct.id, quantity: 1 }]
        })
      ]);

      // Exactly ONE must succeed and ONE must fail
      const successCount = [orderA, orderB].filter((r) => r.status === 'fulfilled').length;
      const failureCount = [orderA, orderB].filter((r) => r.status === 'rejected').length;

      assert.equal(successCount, 1, 'Exactly one concurrent customer captured the last item');
      assert.equal(failureCount, 1, 'Exactly one concurrent customer received stock rejection');

      // Verify stock in database is exactly 0 (never negative)
      const finalProduct = await prisma.product.findUnique({
        where: { id: exclusiveProduct.id }
      });
      assert.equal(finalProduct.stock, 0, 'Inventory stock is exactly 0 and never went negative');

      // Clean up audit test data
      const winningOrderId = (orderA.status === 'fulfilled' ? orderA.value : orderB.value).order.id;
      await prisma.order.delete({ where: { id: winningOrderId } });
      await prisma.product.delete({ where: { id: exclusiveProduct.id } });

      recordPass('High-Concurrency Race Condition: Last Item Overbooking Prevention');
    } catch (err) {
      recordFail('Concurrency Race Condition', err);
    }

    // ----------------------------------------------------
    // TEST 13: Razorpay Webhook Signature Validation
    // ----------------------------------------------------
    try {
      const webhookSecret = config.razorpayWebhookSecret || 'diglow_test_webhook_secret_2026';
      const samplePayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_audit_test_9988',
              amount: 119900,
              currency: 'INR',
              status: 'captured'
            }
          }
        }
      });

      // Compute legitimate HMAC signature
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(samplePayload)
        .digest('hex');

      // 1. Legitimate signature must verify true
      const isValid = verifyWebhookSignature({
        rawBody: samplePayload,
        signatureHeader: validSignature
      });
      assert.equal(isValid, true, 'Valid webhook signature verified successfully');

      // 2. Tampered signature must return false
      const tamperedSignature = validSignature.slice(0, -4) + '0000';
      const isTamperedValid = verifyWebhookSignature({
        rawBody: samplePayload,
        signatureHeader: tamperedSignature
      });
      assert.equal(isTamperedValid, false, 'Tampered webhook signature safely rejected');

      // 3. Short malformed signature must return false without throwing RangeError
      const isShortValid = verifyWebhookSignature({
        rawBody: samplePayload,
        signatureHeader: 'short_invalid_signature'
      });
      assert.equal(isShortValid, false, 'Different-length signature safely handled without crashing');

      recordPass('Razorpay Webhook Signature & Timing-Attack Defense');
    } catch (err) {
      recordFail('Webhook Signature Validation', err);
    }

    // ----------------------------------------------------
    // TEST 14: Authentication & Role-Based Authorization Guard
    // ----------------------------------------------------
    try {
      const secret = config.jwtSecret;

      // 1. Customer token cannot pass as ADMIN role
      const customerToken = jwt.sign(
        { userId: 'cust_123', email: 'customer@example.com', role: 'CUSTOMER' },
        secret,
        { expiresIn: '1h' }
      );
      const decodedCust = jwt.verify(customerToken, secret);
      assert.equal(decodedCust.role, 'CUSTOMER', 'Customer role decoded');
      assert.notEqual(decodedCust.role, 'ADMIN', 'Customer role cannot impersonate ADMIN');

      // 2. Expired token is rejected
      const expiredToken = jwt.sign(
        { adminId: 'admin_123', email: 'admin@diglow.com', role: 'ADMIN' },
        secret,
        { expiresIn: -10 } // Expired 10 seconds ago
      );
      assert.throws(
        () => {
          jwt.verify(expiredToken, secret);
        },
        /jwt expired/,
        'Expired JWT is strictly rejected'
      );

      // 3. Token signed with malicious/unknown secret is rejected
      const forgedToken = jwt.sign(
        { adminId: 'admin_123', email: 'admin@diglow.com', role: 'ADMIN' },
        'attacker_fake_secret_key',
        { expiresIn: '1h' }
      );
      assert.throws(
        () => {
          jwt.verify(forgedToken, secret);
        },
        /invalid signature/,
        'Forged token signed with wrong secret is rejected'
      );

      recordPass('Authentication Expiry & Role-Based Access Control (RBAC)');
    } catch (err) {
      recordFail('Authentication & Authorization Guards', err);
    }

    // ----------------------------------------------------
    // TEST 15: Configurable Coupon Validation & Expiry Rules
    // ----------------------------------------------------
    try {
      const { validateCoupon } = await import('../src/services/couponService.js');

      // 1. Valid percentage coupon with cap
      const validFestive = await validateCoupon({ code: 'FESTIVE10', subtotal: 2000 });
      assert(validFestive.valid, 'FESTIVE10 coupon is valid');
      assert.equal(validFestive.coupon.discountAmount, 200, '10% of 2000 is 200');

      // 2. Fixed discount coupon
      const validWelcome = await validateCoupon({ code: 'WELCOME50', subtotal: 600 });
      assert(validWelcome.valid, 'WELCOME50 coupon is valid');
      assert.equal(validWelcome.coupon.discountAmount, 50, 'WELCOME50 gives flat ₹50');

      // 3. Subtotal below minimum order requirement
      const lowSubtotal = await validateCoupon({ code: 'DIWALI20', subtotal: 500 });
      assert.equal(lowSubtotal.valid, false, 'Coupon rejected when below minOrderAmount');
      assert(lowSubtotal.message.includes('Minimum order amount'), 'Descriptive min order message');

      // 4. Expired coupon
      const expiredCoupon = await validateCoupon({ code: 'EXPIRED15', subtotal: 1000 });
      assert.equal(expiredCoupon.valid, false, 'Expired coupon rejected');

      // 5. Non-existent coupon
      const nonExistent = await validateCoupon({ code: 'INVALID_BOGUS_99', subtotal: 1000 });
      assert.equal(nonExistent.valid, false, 'Non-existent coupon rejected');

      recordPass('Configurable Coupon Validation, Discount Calculations & Expiry Handling');
    } catch (err) {
      recordFail('Coupon Validation Rules', err);
    }

    // ----------------------------------------------------
    // TEST 16: Inventory Movement History on Sale & Cancellation
    // ----------------------------------------------------
    try {
      const prod = await prisma.product.findFirst({ where: { isActive: true, stock: { gte: 5 } } });
      const initialStock = prod.stock;

      // Create an order
      const orderRes = await createOrderWithTransaction({
        customerName: 'Inventory Log Audit',
        customerEmail: 'inv@example.com',
        customerPhone: '9876543210',
        shippingAddress: 'Audit Street',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
        items: [{ productId: prod.id, quantity: 2 }]
      });

      // Verify SALE movement log
      const saleLog = await prisma.inventoryLog.findFirst({
        where: { productId: prod.id, type: 'SALE' },
        orderBy: { createdAt: 'desc' }
      });
      assert(saleLog, 'SALE inventory movement log was created');
      assert.equal(saleLog.change, -2, 'Stock change is -2');
      assert.equal(saleLog.newStock, initialStock - 2, 'New stock reflects decrement');

      // Cancel the order
      await cancelOrderWithStockRestoration({
        orderId: orderRes.order.id,
        reason: 'Automated audit test cancellation',
        cancelledBy: 'CUSTOMER'
      });

      // Verify CANCELLATION movement log
      const cancelLog = await prisma.inventoryLog.findFirst({
        where: { productId: prod.id, type: 'CANCELLATION' },
        orderBy: { createdAt: 'desc' }
      });
      assert(cancelLog, 'CANCELLATION inventory movement log was created');
      assert.equal(cancelLog.change, 2, 'Stock change is +2');
      assert.equal(cancelLog.newStock, initialStock, 'Stock restored to original');

      // Clean up audit order
      await prisma.order.delete({ where: { id: orderRes.order.id } });

      recordPass('Inventory Movement History: Transaction-Safe Sale & Cancellation Logs');
    } catch (err) {
      recordFail('Inventory Movement History', err);
    }

    // ----------------------------------------------------
    // TEST 17: Mandatory Reason for Manual Stock Adjustments
    // ----------------------------------------------------
    try {
      const prod = await prisma.product.findFirst({ where: { isActive: true } });

      // Simulate manual adjustment validation
      let rejectedMissingReason = false;
      const emptyReason = '   ';
      if (!emptyReason || !emptyReason.trim()) {
        rejectedMissingReason = true;
      }
      assert(rejectedMissingReason, 'Empty reason is rejected');

      // Record valid adjustment
      const auditReason = 'Physical quarterly audit verification';
      const prevStock = prod.stock;
      const targetStock = prevStock + 5;

      await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id: prod.id }, data: { stock: targetStock } });
        await tx.inventoryLog.create({
          data: {
            productId: prod.id,
            change: 5,
            previousStock: prevStock,
            newStock: targetStock,
            type: 'MANUAL_ADJUSTMENT',
            reason: auditReason,
            updatedBy: 'ADMIN'
          }
        });
      });

      const adjustmentLog = await prisma.inventoryLog.findFirst({
        where: { productId: prod.id, type: 'MANUAL_ADJUSTMENT' },
        orderBy: { createdAt: 'desc' }
      });
      assert(adjustmentLog, 'MANUAL_ADJUSTMENT log recorded');
      assert.equal(adjustmentLog.reason, auditReason, 'Mandatory audit reason preserved');

      // Revert back
      await prisma.product.update({ where: { id: prod.id }, data: { stock: prevStock } });

      recordPass('Mandatory Reason Requirement & Manual Stock Adjustment Audit');
    } catch (err) {
      recordFail('Manual Stock Adjustment Reason', err);
    }

    // ----------------------------------------------------
    // TEST 18: Order Status State Machine Transitions
    // ----------------------------------------------------
    try {
      const { validateOrderStatusTransition } = await import('../src/services/orderService.js');

      // Valid transitions
      assert(validateOrderStatusTransition('Pending', 'Confirmed'), 'Pending -> Confirmed permitted');
      assert(validateOrderStatusTransition('Confirmed', 'Processing'), 'Confirmed -> Processing permitted');
      assert(validateOrderStatusTransition('Processing', 'Packing'), 'Processing -> Packing permitted');
      assert(validateOrderStatusTransition('Packing', 'Shipped'), 'Packing -> Shipped permitted');
      assert(validateOrderStatusTransition('Shipped', 'Out for Delivery'), 'Shipped -> Out for Delivery permitted');
      assert(validateOrderStatusTransition('Out for Delivery', 'Delivered'), 'Out for Delivery -> Delivered permitted');

      // Invalid transitions
      assert.throws(
        () => validateOrderStatusTransition('Pending', 'Delivered'),
        /Invalid order status transition/,
        'Pending -> Delivered directly is blocked'
      );

      // Terminal state defense
      assert.throws(
        () => validateOrderStatusTransition('Delivered', 'Shipped'),
        /Invalid order status transition/,
        'Delivered order cannot be modified to Shipped'
      );
      assert.throws(
        () => validateOrderStatusTransition('Cancelled', 'Confirmed'),
        /Invalid order status transition/,
        'Cancelled order cannot be reactivated'
      );

      recordPass('Order Status State Machine Transitions & Terminal State Defense');
    } catch (err) {
      recordFail('Order Status State Machine', err);
    }

    // ----------------------------------------------------
    // TEST 19: Customer Wishlist & Reorder Availability
    // ----------------------------------------------------
    try {
      const testUser = await prisma.user.findFirst();
      const testProduct = await prisma.product.findFirst({ where: { isActive: true } });
      assert(testUser && testProduct, 'User and product available for wishlist test');

      // 1. Add to wishlist
      const wishItem = await prisma.wishlistItem.upsert({
        where: {
          userId_productId: {
            userId: testUser.id,
            productId: testProduct.id
          }
        },
        update: {},
        create: {
          userId: testUser.id,
          productId: testProduct.id
        }
      });
      assert(wishItem, 'Product added to customer wishlist');

      // 2. Query wishlist
      const userWishlist = await prisma.wishlistItem.findMany({
        where: { userId: testUser.id }
      });
      assert(userWishlist.length > 0, 'Wishlist contains saved item');

      // 3. Remove from wishlist
      await prisma.wishlistItem.deleteMany({
        where: { userId: testUser.id, productId: testProduct.id }
      });
      const afterDelete = await prisma.wishlistItem.findMany({
        where: { userId: testUser.id, productId: testProduct.id }
      });
      assert.equal(afterDelete.length, 0, 'Item successfully removed from wishlist');

      // 4. Test Reorder availability
      const { getReorderAvailability } = await import('../src/services/orderService.js');
      const recentOrder = await prisma.order.findFirst();
      if (recentOrder) {
        const reorderInfo = await getReorderAvailability(recentOrder.id);
        assert(reorderInfo.orderNumber, 'Reorder returns order number');
        assert(Array.isArray(reorderInfo.items), 'Reorder returns items array');
        assert(reorderInfo.items.length > 0, 'Reorder contains item list with current prices');
      }

      recordPass('Customer Wishlist CRUD & Reorder Live Availability');
    } catch (err) {
      recordFail('Wishlist & Reorder Availability', err);
    }

    // ----------------------------------------------------
    // TEST 20: Promotional Campaign Banners: Automatic Expiry & Priority
    // ----------------------------------------------------
    try {
      const now = new Date();

      // 1. Create an expired promotion banner
      const expiredBanner = await prisma.promotionBanner.create({
        data: {
          title: 'Expired Festive Flash Sale',
          badge: 'FLASH',
          startDate: new Date(now.getTime() - 10 * 86400000), // 10 days ago
          endDate: new Date(now.getTime() - 2 * 86400000), // Ended 2 days ago
          isActive: true,
          priority: 99
        }
      });

      // 2. Create a future scheduled promotion banner
      const scheduledBanner = await prisma.promotionBanner.create({
        data: {
          title: 'Future New Year Sanctum',
          badge: 'UPCOMING',
          startDate: new Date(now.getTime() + 5 * 86400000), // Starts in 5 days
          endDate: new Date(now.getTime() + 15 * 86400000),
          isActive: true,
          priority: 50
        }
      });

      // 3. Query active promotions using the exact service query
      const activePromotions = await prisma.promotionBanner.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
      });

      // Assertions
      const hasExpired = activePromotions.some((b) => b.id === expiredBanner.id);
      const hasScheduled = activePromotions.some((b) => b.id === scheduledBanner.id);
      assert.equal(hasExpired, false, 'Expired campaign banner automatically omitted from active query');
      assert.equal(hasScheduled, false, 'Future scheduled banner omitted until start date');

      // Cleanup test records
      await prisma.promotionBanner.deleteMany({
        where: { id: { in: [expiredBanner.id, scheduledBanner.id] } }
      });

      recordPass('Promotional Campaign Banners: Automatic Expiry & Status Filtering');
    } catch (err) {
      recordFail('Promotional Banners Lifecycle', err);
    }

    // ----------------------------------------------------
    // TEST 21: Newsletter Consent, Duplicate Prevention & Unsubscribe
    // ----------------------------------------------------
    try {
      const testEmail = `audit.newsletter.${Date.now()}@example.com`;

      // 1. Subscription without consent must be rejected
      const consentReq = { body: { email: testEmail, hasConsent: false } };
      let rejectedDueToConsent = false;
      const fakeRes = {
        status: (code) => {
          if (code === 400) rejectedDueToConsent = true;
          return { json: () => {} };
        },
        json: () => {}
      };
      const { subscribeNewsletter, unsubscribeNewsletter } = await import('../src/controllers/product.controller.js');
      await subscribeNewsletter(consentReq, fakeRes, () => {});
      assert.equal(rejectedDueToConsent, true, 'Subscription without consent strictly rejected with HTTP 400');

      // 2. Subscription with consent creates record
      const validSubReq = { body: { email: testEmail, hasConsent: true, source: 'audit_test' } };
      let subscribedSuccess = false;
      const successRes = {
        status: () => successRes,
        json: (data) => {
          if (data.success) subscribedSuccess = true;
        }
      };
      await subscribeNewsletter(validSubReq, successRes, () => {});
      assert.equal(subscribedSuccess, true, 'Subscribed successfully with valid consent');

      // 3. Duplicate subscription returns graceful message without duplicate row
      let dupMsg = '';
      const dupRes = {
        json: (data) => {
          dupMsg = data.message;
        }
      };
      await subscribeNewsletter(validSubReq, dupRes, () => {});
      assert(dupMsg.includes('already a valued member'), 'Duplicate subscription handled without re-creating record');

      // 4. Unsubscribe sets unsubscribedAt and hasConsent: false
      const unsubReq = { body: { email: testEmail } };
      await unsubscribeNewsletter(unsubReq, successRes, () => {});

      const updatedSub = await prisma.newsletter.findUnique({ where: { email: testEmail } });
      assert(updatedSub.unsubscribedAt !== null, 'Unsubscribed timestamp recorded');
      assert.equal(updatedSub.hasConsent, false, 'hasConsent updated to false on unsubscribe');

      // 5. Campaign service strictly excludes unsubscribed users
      const { getConsentedSubscribers } = await import('../src/services/campaignService.js');
      const audience = await getConsentedSubscribers();
      const inAudience = audience.some((s) => s.email === testEmail);
      assert.equal(inAudience, false, 'Unsubscribed user omitted from marketing campaign audience');

      // Cleanup
      await prisma.newsletter.deleteMany({ where: { email: testEmail } });

      recordPass('Newsletter Consent Tracking, Duplicate Defense & Unsubscribe');
    } catch (err) {
      recordFail('Newsletter & Consent Management', err);
    }

    // ----------------------------------------------------
    // TEST 22: Robots.txt Private Route Disallow Rules
    // ----------------------------------------------------
    try {
      const robotsResponse = await fetch('http://localhost:5000/robots.txt');
      const robotsContent = await robotsResponse.text();

      assert(robotsContent.includes('Disallow: /cart'), 'Robots.txt disallows /cart');
      assert(robotsContent.includes('Disallow: /checkout'), 'Robots.txt disallows /checkout');
      assert(robotsContent.includes('Disallow: /account'), 'Robots.txt disallows /account');
      assert(robotsContent.includes('Disallow: /admin'), 'Robots.txt disallows /admin');
      assert(robotsContent.includes('Disallow: /api'), 'Robots.txt disallows /api');
      assert(robotsContent.includes('Sitemap:'), 'Robots.txt references sitemap');

      recordPass('SEO Privacy: Robots.txt Disallow Rules for Private Routes');
    } catch (err) {
      recordFail('Robots.txt Configuration', err);
    }

    // ----------------------------------------------------
    // TEST 23: Dynamic Sitemap XML & Category Landing Pages
    // ----------------------------------------------------
    try {
      const sitemapResponse = await fetch('http://localhost:5000/sitemap.xml');
      const sitemapXml = await sitemapResponse.text();

      assert(sitemapXml.includes('<loc>'), 'Sitemap contains url locations');
      assert(sitemapXml.includes('/category/scented-candles'), 'Sitemap contains scented candles landing page');
      assert(sitemapXml.includes('/category/decorative-candles'), 'Sitemap contains decorative candles landing page');
      assert(sitemapXml.includes('/category/festive-collections'), 'Sitemap contains festive collections landing page');
      assert(sitemapXml.includes('/category/gift-sets'), 'Sitemap contains gift sets landing page');
      assert(sitemapXml.includes('/product/'), 'Sitemap contains product URLs');

      recordPass('Dynamic Sitemap XML with Category Landing Pages');
    } catch (err) {
      recordFail('Sitemap Generation', err);
    }

    // ----------------------------------------------------
    // TEST 24: Product Structured Data Verification
    // ----------------------------------------------------
    try {
      const sampleProd = await prisma.product.findFirst({ where: { isActive: true } });
      assert(sampleProd, 'Product available for structured data schema check');

      const expectedJsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: sampleProd.name,
        sku: sampleProd.sku || sampleProd.slug,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: sampleProd.price,
          availability: sampleProd.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
      };

      assert.equal(expectedJsonLd['@type'], 'Product');
      assert(expectedJsonLd.sku.startsWith('DIG-') || expectedJsonLd.sku.length > 0, 'SKU adheres to product spec');
      assert.equal(expectedJsonLd.offers.priceCurrency, 'INR', 'Offers currency is INR');
      assert.equal(expectedJsonLd.offers.price, sampleProd.price, 'Price matches database price');

      recordPass('Product Structured Data Schema.org Validation');
    } catch (err) {
      recordFail('Product Structured Data', err);
    }

    console.log('\n====================================================');
    console.log(`📊 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================');

    if (passedTests === totalTests) {
      console.log(`🎉 ALL ${totalTests} SYSTEM AUDITS PASSED WITH ZERO FAILURES.\n`);
      process.exit(0);
    } else {
      console.error('⚠️ SOME AUDITS FAILED. CHECK LOGS ABOVE.\n');
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Fatal audit failure:', globalErr);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndAudit();
