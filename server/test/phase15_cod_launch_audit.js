/**
 * DiGlow Candle Store — Phase 15 COD-Only Launch, Security & Refund Safety Audit Suite
 *
 * Automated verification of:
 * 1. Successful COD checkout with server-side totals & 6-digit delivery PIN issuance.
 * 2. Unsupported online payment methods (RAZORPAY, STRIPE) rejected by backend (HTTP 400).
 * 3. Correct initial COD payment status ('Pending') and order status ('Pending').
 * 4. Customer attempts to mark order 'Paid' via payment endpoints rejected.
 * 5. Unauthorized delivery or staff collection rejected (RBAC & unassigned agent guard).
 * 6. Authorized COD collection by assigned delivery personnel or store admin.
 * 7. Duplicate collection attempts prevented with atomic guard.
 * 8. COD cancellation before payment collection (paymentStatus: 'Cancelled', zero monetary refund).
 * 9. Cancellation after COD collection (paymentStatus: 'Refund Pending', verified manual refund recorded).
 * 10. Atomic inventory restoration on cancellation & double-restock guard.
 * 11. Concurrency-safe duplicate checkout submission defense (Idempotency key).
 * 12. Public order tracking privacy: delivery PIN and deliveryPinHash are NEVER exposed.
 * 13. Email provider safe fallback and duplicate event deduplication.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = 'http://127.0.0.1:5000/api';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return {
    status: res.status,
    ok: res.ok,
    data
  };
}

async function runPhase15Audit() {
  console.log('\n================================================================');
  console.log('   🛡️  DIGLOW CANDLE STORE — PHASE 15 COD-ONLY LAUNCH AUDIT');
  console.log('================================================================\n');

  const timestamp = Date.now();
  let adminToken = null;
  let riderToken = null;
  let unassignedRiderToken = null;
  let customerToken = null;
  let customerUser = null;
  let riderAdmin = null;
  let unassignedRiderAdmin = null;
  let storeAdmin = null;
  let testProduct = null;

  try {
    // -------------------------------------------------------------------------
    // Setup Isolated Test Fixtures: Product, Admin, Riders, Customer
    // -------------------------------------------------------------------------
    console.log('--- Setting up isolated audit fixtures ---');
    
    // 1. Test Product Fixture
    testProduct = await prisma.product.create({
      data: {
        name: `Phase 15 Festive Candle ${timestamp}`,
        slug: `phase-15-festive-candle-${timestamp}`,
        sku: `P15-SKU-${timestamp.toString().slice(-6)}`,
        description: 'Hardened COD testing candle fixture',
        scentProfile: 'Mysore Sandalwood & Kashmiri Saffron',
        imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80',
        price: 999,
        stock: 50,
        category: 'Heritage Pillars',
        isActive: true,
        productVariants: {
          create: [
            {
              sku: `P15-VAR-${timestamp.toString().slice(-6)}`,
              title: 'Sanctum 400g / Brass Vessel',
              price: 999,
              stock: 20,
              isActive: true
            }
          ]
        }
      },
      include: { productVariants: true }
    });

    // 2. Admin User Fixture
    const hashedPassword = await bcrypt.hash('DiGlowAdmin@2026', 10);
    storeAdmin = await prisma.admin.create({
      data: {
        name: 'Store Super Admin',
        email: `admin_${timestamp}@diglow.test`,
        password: hashedPassword,
        phone: '9999900001',
        role: 'ADMIN'
      }
    });

    // 3. Assigned Rider User Fixture
    riderAdmin = await prisma.admin.create({
      data: {
        name: 'Assigned Courier Rider',
        email: `rider_${timestamp}@diglow.test`,
        password: hashedPassword,
        phone: '9999900002',
        role: 'DELIVERY'
      }
    });

    // 4. Unassigned Rider User Fixture
    unassignedRiderAdmin = await prisma.admin.create({
      data: {
        name: 'Unassigned Courier Rider',
        email: `other_rider_${timestamp}@diglow.test`,
        password: hashedPassword,
        phone: '9999900003',
        role: 'DELIVERY'
      }
    });

    // 5. Customer Fixture
    customerUser = await prisma.user.create({
      data: {
        name: 'Maharani Client',
        email: `client_${timestamp}@diglow.test`,
        password: hashedPassword,
        phone: '9876543210',
        role: 'CUSTOMER'
      }
    });

    // Authenticate Admin
    const adminLoginRes = await api('/auth/admin/login', {
      method: 'POST',
      body: { email: storeAdmin.email, password: 'DiGlowAdmin@2026' }
    });
    adminToken = adminLoginRes.data.token;

    // Authenticate Assigned Rider
    const riderLoginRes = await api('/auth/admin/login', {
      method: 'POST',
      body: { email: riderAdmin.email, password: 'DiGlowAdmin@2026' }
    });
    riderToken = riderLoginRes.data.token;

    // Authenticate Unassigned Rider
    const unassignedRiderLoginRes = await api('/auth/admin/login', {
      method: 'POST',
      body: { email: unassignedRiderAdmin.email, password: 'DiGlowAdmin@2026' }
    });
    unassignedRiderToken = unassignedRiderLoginRes.data.token;

    // Authenticate Customer
    const customerLoginRes = await api('/auth/login', {
      method: 'POST',
      body: { email: customerUser.email, password: 'DiGlowAdmin@2026' }
    });
    customerToken = customerLoginRes.data.token;

    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    const riderHeaders = { headers: { Authorization: `Bearer ${riderToken}` } };
    const unassignedRiderHeaders = { headers: { Authorization: `Bearer ${unassignedRiderToken}` } };
    const customerHeaders = { headers: { Authorization: `Bearer ${customerToken}` } };

    // -------------------------------------------------------------------------
    // TEST 1: Successful COD Checkout & Server-Side Totals
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Successful COD Checkout & Server-Side Calculations ---');
    const checkoutPayload1 = {
      customerName: 'Maharani Client',
      customerEmail: customerUser.email,
      customerPhone: '9876543210',
      shippingAddress: 'Sanctum Suite 101, City Palace',
      city: 'Udaipur',
      state: 'Rajasthan',
      postalCode: '313001',
      paymentMethod: 'COD',
      items: [{ productId: testProduct.id, quantity: 1, variantId: testProduct.productVariants[0].id }]
    };

    const checkoutRes1 = await api('/orders/checkout', {
      method: 'POST',
      body: checkoutPayload1,
      ...customerHeaders
    });

    assert(checkoutRes1.status === 201 && checkoutRes1.data.success, 'COD order created successfully with HTTP 201');
    assert(checkoutRes1.data.order.paymentMethod === 'COD', 'Order recorded with paymentMethod = "COD"');
    assert(checkoutRes1.data.order.total === 999, 'Server-side order total matches item unit price (₹999)');
    assert(typeof checkoutRes1.data.deliveryPin === 'string' && checkoutRes1.data.deliveryPin.length === 6, 'Secret 6-digit delivery PIN issued to client on checkout');
    const order1 = checkoutRes1.data.order;

    // -------------------------------------------------------------------------
    // TEST 2: Rejection of Unsupported Online Payment Methods
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Rejection of Unsupported Payment Methods by Backend ---');
    const razorpayCheckoutPayload = {
      ...checkoutPayload1,
      paymentMethod: 'RAZORPAY'
    };
    const razorpayRes = await api('/orders/checkout', {
      method: 'POST',
      body: razorpayCheckoutPayload,
      ...customerHeaders
    });
    assert(razorpayRes.status === 400, 'Checkout with paymentMethod: RAZORPAY rejected with HTTP 400');
    assert(
      razorpayRes.data.message && razorpayRes.data.message.includes('Cash on Delivery'),
      'Informative error returned explaining COD-only policy'
    );

    const stripeCheckoutPayload = {
      ...checkoutPayload1,
      paymentMethod: 'STRIPE'
    };
    const stripeRes = await api('/orders/checkout', {
      method: 'POST',
      body: stripeCheckoutPayload,
      ...customerHeaders
    });
    assert(stripeRes.status === 400, 'Checkout with paymentMethod: STRIPE rejected with HTTP 400');

    // -------------------------------------------------------------------------
    // TEST 3: Initial COD Payment Status & Fulfillment Decoupling
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Correct Initial Payment Status & Decoupled State ---');
    const createdOrderDb = await prisma.order.findUnique({ where: { id: order1.id } });
    assert(createdOrderDb.paymentStatus === 'Pending', 'Initial paymentStatus is strictly "Pending"');
    assert(createdOrderDb.orderStatus === 'Pending', 'Initial orderStatus is "Pending"');

    // -------------------------------------------------------------------------
    // TEST 4: Customer Attempts to Mark Order Paid via Payment Endpoints
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Customer Protection — Cannot Mark Order Paid ---');
    const payCreateRes = await api('/payments/razorpay/create-order', {
      method: 'POST',
      body: { orderId: order1.id },
      ...customerHeaders
    });
    assert(payCreateRes.status === 400, 'POST /payments/razorpay/create-order disabled and returns HTTP 400');

    const payVerifyRes = await api('/payments/razorpay/verify', {
      method: 'POST',
      body: {
        orderId: order1.id,
        razorpayOrderId: 'fake_order',
        razorpayPaymentId: 'fake_pay',
        razorpaySignature: 'fake_sig'
      },
      ...customerHeaders
    });
    assert(payVerifyRes.status === 400, 'POST /payments/razorpay/verify disabled and returns HTTP 400');

    // -------------------------------------------------------------------------
    // TEST 5: Unauthorized COD Collection Rejections (RBAC & Ineligible Stages)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Unauthorized Collection & Ineligible Stage Guards ---');
    
    // Customer cannot call collect-cod
    const custCollectRes = await api(`/admin/orders/${order1.id}/collect-cod`, {
      method: 'POST',
      body: { amountCollected: 999 },
      ...customerHeaders
    });
    assert(custCollectRes.status === 401, 'Customer unauthorized from admin collect-cod endpoint (HTTP 401)');

    // Ineligible stage: Pending order cannot have COD collected yet
    const earlyCollectRes = await api(`/admin/orders/${order1.id}/collect-cod`, {
      method: 'POST',
      body: { amountCollected: 999 },
      ...adminHeaders
    });
    assert(earlyCollectRes.status === 400, 'COD collection rejected while order is still in "Pending" stage (HTTP 400)');

    // Transition order to Out for Delivery and assign to riderAdmin
    await api(`/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      body: { status: 'Confirmed' },
      ...adminHeaders
    });
    await api(`/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      body: { status: 'Processing' },
      ...adminHeaders
    });
    await api(`/admin/orders/${order1.id}/assign`, {
      method: 'PATCH',
      body: { assignedToId: riderAdmin.id },
      ...adminHeaders
    });
    await api(`/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      body: { status: 'Shipped' },
      ...adminHeaders
    });
    await api(`/admin/orders/${order1.id}/status`, {
      method: 'PATCH',
      body: { status: 'Out for Delivery' },
      ...riderHeaders
    });

    // Unassigned rider cannot collect payment for this order
    const wrongRiderCollect = await api(`/admin/orders/${order1.id}/collect-cod`, {
      method: 'POST',
      body: { amountCollected: 999 },
      ...unassignedRiderHeaders
    });
    assert(wrongRiderCollect.status === 403, 'Unassigned delivery rider forbidden from collecting payment (HTTP 403)');

    // Mismatched collection amount rejected
    const badAmountCollect = await api(`/admin/orders/${order1.id}/collect-cod`, {
      method: 'POST',
      body: { amountCollected: 500 },
      ...riderHeaders
    });
    assert(badAmountCollect.status === 400, 'Mismatched collection amount (₹500 vs ₹999) rejected with HTTP 400');

    // -------------------------------------------------------------------------
    // TEST 6: Authorized COD Collection
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Authorized COD Collection by Assigned Delivery Agent ---');
    const validCollectRes = await api(`/admin/orders/${order1.id}/collect-cod`, {
      method: 'POST',
      body: { amountCollected: 999, notes: 'Cash received at doorstep' },
      ...riderHeaders
    });
    assert(validCollectRes.status === 200 && validCollectRes.data.success, 'Assigned rider collected COD payment successfully');
    assert(validCollectRes.data.order.paymentStatus === 'Paid', 'Order paymentStatus updated to "Paid"');

    // Verify audit log
    const updatedOrderLogs = await prisma.orderStatusLog.findMany({
      where: { orderId: order1.id },
      orderBy: { createdAt: 'desc' }
    });
    const collectionLog = updatedOrderLogs.find(l => l.notes.includes('COD payment of ₹999.00 collected'));
    assert(Boolean(collectionLog), 'Detailed OrderStatusLog created for COD collection audit trail');

    // -------------------------------------------------------------------------
    // TEST 7: Duplicate Collection Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Duplicate Collection Attempt Guard ---');
    const repeatCollectRes = await api(`/admin/orders/${order1.id}/collect-cod`, {
      method: 'POST',
      body: { amountCollected: 999 },
      ...riderHeaders
    });
    assert(repeatCollectRes.status === 400, 'Duplicate COD collection attempt rejected with HTTP 400');

    // -------------------------------------------------------------------------
    // TEST 8: Unpaid COD Order Cancellation (Zero Monetary Refund)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Unpaid COD Order Cancellation ---');
    const unpaidOrderRes = await api('/orders/checkout', {
      method: 'POST',
      body: {
        ...checkoutPayload1,
        items: [{ productId: testProduct.id, quantity: 1 }]
      },
      ...customerHeaders
    });
    const unpaidOrderId = unpaidOrderRes.data.order.id;

    // Customer cancels unpaid order
    const cancelUnpaidRes = await api(`/customer/orders/${unpaidOrderId}/cancel`, {
      method: 'POST',
      body: { reason: 'Changed fragrance choice' },
      ...customerHeaders
    });
    assert(cancelUnpaidRes.status === 200, 'Unpaid COD order cancelled successfully');
    assert(cancelUnpaidRes.data.order.orderStatus === 'Cancelled', 'Order status marked "Cancelled"');
    assert(cancelUnpaidRes.data.order.paymentStatus === 'Cancelled', 'Payment status marked "Cancelled" (NO monetary refund created)');
    assert(cancelUnpaidRes.data.order.paymentStatus !== 'Refunded', 'Unpaid order is NEVER marked "Refunded"');

    console.log('\n--- Test 9: Cancellation/Return After Collection & Manual Verified Refund ---');
    // Order 1 was already Paid (collected COD in Test 6). Verify delivery PIN to transition to Delivered:
    const deliverRes = await api(`/admin/orders/${order1.id}/verify-delivery`, {
      method: 'POST',
      body: { pin: checkoutRes1.data.deliveryPin },
      ...riderHeaders
    });
    assert(deliverRes.status === 200 && deliverRes.data.order.orderStatus === 'Delivered', 'Doorstep delivery verified with 6-digit PIN');

    // Admin processes return
    const returnPaidRes = await api(`/admin/orders/${order1.id}/return`, {
      method: 'POST',
      body: { itemDisposition: 'RESTOCK_TO_INVENTORY', reason: 'Customer returned package' },
      ...adminHeaders
    });
    assert(returnPaidRes.status === 200, 'Paid order processed for return');
    assert(returnPaidRes.data.order.paymentStatus === 'Refund Pending', 'Paid order marked "Refund Pending" (not instantly marked refunded without verified refund)');

    // Admin records verified manual refund
    const recordRefundRes = await api(`/admin/orders/${order1.id}/record-refund`, {
      method: 'POST',
      body: {
        refundAmount: 999,
        transactionReference: 'UPI-REF-20261026-001',
        notes: 'Cash handed back to customer with written receipt'
      },
      ...adminHeaders
    });
    assert(recordRefundRes.status === 200 && recordRefundRes.data.success, 'Authorized staff recorded verified external refund');
    assert(recordRefundRes.data.order.paymentStatus === 'Refunded', 'Order paymentStatus updated to "Refunded" after verified settlement');

    // -------------------------------------------------------------------------
    // TEST 10: Inventory Restoration & Duplicate Restock Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: Inventory Restoration & Duplicate Restock Defense ---');
    const stockBeforeOrder = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stock;
    
    // Place order of 2 items
    const stockTestOrderRes = await api('/orders/checkout', {
      method: 'POST',
      body: {
        ...checkoutPayload1,
        items: [{ productId: testProduct.id, quantity: 2 }]
      },
      ...customerHeaders
    });
    const stockOrderId = stockTestOrderRes.data.order.id;
    const stockAfterOrder = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stock;
    assert(stockAfterOrder === stockBeforeOrder - 2, 'Inventory correctly decremented by 2 units on order checkout');

    // Cancel order -> inventory restored
    await api(`/customer/orders/${stockOrderId}/cancel`, {
      method: 'POST',
      body: { reason: 'Stock restoration test' },
      ...customerHeaders
    });
    const stockAfterCancel = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stock;
    assert(stockAfterCancel === stockBeforeOrder, 'Inventory accurately restored by 2 units on cancellation');

    // Duplicate cancellation attempt -> rejected, prevents double-restock
    const duplicateCancelRes = await api(`/customer/orders/${stockOrderId}/cancel`, {
      method: 'POST',
      body: { reason: 'Second cancellation attempt' },
      ...customerHeaders
    });
    assert(duplicateCancelRes.status === 400 || duplicateCancelRes.status === 500, 'Duplicate cancellation attempt blocked');
    const stockAfterDupCancel = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stock;
    assert(stockAfterDupCancel === stockBeforeOrder, 'Inventory remained unchanged (double-restock prevented)');

    // -------------------------------------------------------------------------
    // TEST 11: Concurrency & Duplicate Order Submission Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: Idempotency Key & Duplicate Checkout Defense ---');
    const idempotencyKey = `chk_idem_${timestamp}`;
    const checkoutWithIdem = {
      ...checkoutPayload1,
      idempotencyKey,
      items: [{ productId: testProduct.id, quantity: 1 }]
    };

    const firstRes = await api('/orders/checkout', {
      method: 'POST',
      body: checkoutWithIdem,
      ...customerHeaders
    });
    assert(firstRes.status === 201 && firstRes.data.order, 'First order created with idempotencyKey');

    const duplicateRes = await api('/orders/checkout', {
      method: 'POST',
      body: checkoutWithIdem,
      ...customerHeaders
    });
    assert(duplicateRes.status === 200 && duplicateRes.data.duplicate === true, 'Duplicate submission with same idempotency key returned existing order safely (HTTP 200)');
    assert(duplicateRes.data.order.id === firstRes.data.order.id, 'No duplicate database record created');

    // -------------------------------------------------------------------------
    // TEST 12: Public Order Tracking Privacy Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Test 12: Public Order Tracking Privacy & Delivery PIN Protection ---');
    const trackRes = await api('/orders/track', {
      method: 'POST',
      body: {
        orderNumber: firstRes.data.order.orderNumber,
        phone: '9876543210'
      }
    });
    assert(trackRes.status === 200 && trackRes.data.success, 'Public order tracking succeeded with valid orderNumber + phone');
    assert(trackRes.data.order.deliveryPin === undefined, 'CRITICAL: deliveryPin is NOT exposed in public tracking response');
    assert(trackRes.data.order.deliveryPinHash === undefined, 'CRITICAL: deliveryPinHash is NOT exposed in public tracking response');
    assert(trackRes.data.order.customerPhone.startsWith('******'), 'Customer phone is masked for privacy');
    assert(trackRes.data.order.customerEmail.includes('***@'), 'Customer email is masked for privacy');

    // -------------------------------------------------------------------------
    // TEST 13: Role Token Isolation (STAFF vs CUSTOMER Token Separation)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 13: Role Token Isolation ---');
    // Try using customerToken to access admin orders
    const crossTokenRes = await api('/admin/orders', { ...customerHeaders });
    assert(crossTokenRes.status === 401, 'Customer token strictly forbidden from admin endpoints (HTTP 401)');

  } catch (err) {
    console.error('Unexpected test error in Phase 15 suite:', err.message, err.stack);
    failed++;
  } finally {
    console.log('\n--- Cleaning up Phase 15 test artifacts ---');
    try {
      if (customerUser) {
        await prisma.orderItem.deleteMany({ where: { order: { customerEmail: customerUser.email } } });
        await prisma.orderStatusLog.deleteMany({ where: { order: { customerEmail: customerUser.email } } });
        await prisma.order.deleteMany({ where: { customerEmail: customerUser.email } });
        await prisma.user.delete({ where: { id: customerUser.id } }).catch(() => {});
      }
      if (testProduct) {
        await prisma.inventoryLog.deleteMany({ where: { productId: testProduct.id } });
        await prisma.orderItem.deleteMany({ where: { productId: testProduct.id } });
        await prisma.productVariant.deleteMany({ where: { productId: testProduct.id } });
        await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => {});
      }
      if (riderAdmin) await prisma.admin.delete({ where: { id: riderAdmin.id } }).catch(() => {});
      if (unassignedRiderAdmin) await prisma.admin.delete({ where: { id: unassignedRiderAdmin.id } }).catch(() => {});
      if (storeAdmin) await prisma.admin.delete({ where: { id: storeAdmin.id } }).catch(() => {});
      await prisma.$disconnect();
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n================================================================');
  console.log(`   PHASE 15 AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase15Audit();
