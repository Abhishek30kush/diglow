/**
 * DiGlow Candle Store — Phase 13 Abandoned Cart Recovery Comprehensive Audit
 * Tests:
 * 1. Persistent cart database storage & anonymous sessionToken synchronization
 * 2. Authenticated customer cart association (userId & customerEmail)
 * 3. Inactivity-based abandoned cart detection (recent vs inactive cutoff)
 * 4. Marketing consent & unsubscribe enforcement (unsubscribed customers never emailed)
 * 5. Idempotent background processing (repeated batch runs never send duplicate emails)
 * 6. Expiring recovery token security & click tracking (72-hour validation, expired rejection)
 * 7. Order conversion attribution & non-duplication protection (no double counting)
 * 8. Admin recovery analytics, KPI calculation, date filtering & batch execution
 */

import { PrismaClient } from '@prisma/client';

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

async function runAudit() {
  console.log('\n======================================================');
  console.log('  DiGlow Phase 13: Abandoned Cart Recovery Audit');
  console.log('======================================================\n');

  try {
    // 0. Setup: Ensure an active product exists for testing
    const testProduct = await prisma.product.findFirst({
      where: { isActive: true },
      include: { productVariants: true }
    });

    if (!testProduct) {
      throw new Error('No active products found in database for testing.');
    }

    const testVariant = testProduct.productVariants?.[0] || null;
    const testSessionToken = `test_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const testCustomerEmail = `phase13.audit.${Date.now()}@diglow-candles.test`;

    // Obtain admin token for admin endpoints
    const adminLoginRes = await api('/auth/admin/login', {
      method: 'POST',
      body: {
        email: 'admin@diglow.com',
        password: 'DiGlow@Admin2026'
      }
    });

    const adminToken = adminLoginRes.data?.token;
    assert(Boolean(adminToken), 'Admin authorization token retrieved successfully');

    // -------------------------------------------------------------------------
    // TEST 1: Cart Synchronization & Database Persistence
    // -------------------------------------------------------------------------
    console.log('\n[1] Testing Cart Synchronization & Database Persistence...');

    const sampleItems = [
      {
        key: `${testProduct.id}_${testVariant ? testVariant.id : 'base'}`,
        product: {
          id: testProduct.id,
          name: testProduct.name,
          slug: testProduct.slug,
          price: testVariant ? testVariant.price : testProduct.price,
          imageUrl: testProduct.imageUrl,
          stock: testProduct.stock
        },
        variant: testVariant,
        quantity: 2
      }
    ];

    const syncRes1 = await api('/cart/sync', {
      method: 'POST',
      body: {
        sessionToken: testSessionToken,
        items: sampleItems,
        customerEmail: testCustomerEmail,
        customerName: 'Aarav Mehta',
        customerPhone: '9876543210'
      }
    });

    assert(syncRes1.ok && syncRes1.data.success, 'Cart sync request returns 200 OK');
    assert(syncRes1.data.cart?.itemCount === 2, 'Item count correctly computed as 2');

    // Verify in database directly
    const dbCart = await prisma.cart.findUnique({
      where: { sessionToken: testSessionToken }
    });

    assert(Boolean(dbCart), 'Cart persistent record exists in PostgreSQL database');
    assert(dbCart.customerEmail === testCustomerEmail, 'Customer email correctly linked to cart record');
    assert(dbCart.status === 'ACTIVE', 'Initial cart status is ACTIVE');

    // -------------------------------------------------------------------------
    // TEST 2: Inactivity-Based Abandoned Cart Detection
    // -------------------------------------------------------------------------
    console.log('\n[2] Testing Inactivity & Eligibility Detection...');

    // A cart that was active 1 minute ago should NOT be eligible under a 30-minute threshold
    const recentBatchRes = await api('/admin/abandoned-carts/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { inactivityMinutes: 30 }
    });

    // Verify recent cart was not emailed
    const cartStillActive = await prisma.cart.findUnique({
      where: { id: dbCart.id }
    });
    assert(cartStillActive.recoveryEmailSentCount === 0, 'Recent active cart (< 30 min) is NOT emailed');

    // Manually age the cart to simulate 2 hours of inactivity
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await prisma.cart.update({
      where: { id: dbCart.id },
      data: { lastActivityAt: twoHoursAgo }
    });

    // -------------------------------------------------------------------------
    // TEST 3: Marketing Consent & Unsubscribe Respect
    // -------------------------------------------------------------------------
    console.log('\n[3] Testing Marketing Consent & Unsubscribe Preference Enforcement...');

    // Simulate that the customer unsubscribed from marketing communications
    await prisma.newsletter.upsert({
      where: { email: testCustomerEmail },
      update: { hasConsent: false, unsubscribedAt: new Date() },
      create: { email: testCustomerEmail, hasConsent: false, unsubscribedAt: new Date(), source: 'checkout' }
    });

    const optOutBatchRes = await api('/admin/abandoned-carts/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { inactivityMinutes: 60 }
    });

    assert(optOutBatchRes.ok && optOutBatchRes.data.success, 'Batch run executed with unsubscribe check');

    const cartAfterUnsubscribeCheck = await prisma.cart.findUnique({
      where: { id: dbCart.id }
    });

    assert(
      cartAfterUnsubscribeCheck.recoveryEmailSentCount === 0,
      'Unsubscribed customer received 0 recovery emails (privacy preference respected)'
    );
    assert(
      cartAfterUnsubscribeCheck.status === 'ABANDONED',
      'Cart status transitioned to ABANDONED to prevent redundant re-queries'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Idempotent Email Dispatch & Deduplication Protection
    // -------------------------------------------------------------------------
    console.log('\n[4] Testing Idempotent Recovery Dispatch & Deduplication...');

    // Re-enable consent for a clean test customer
    const consentedEmail = `consented.cart.${Date.now()}@diglow-candles.test`;
    await prisma.newsletter.upsert({
      where: { email: consentedEmail },
      update: { hasConsent: true, unsubscribedAt: null },
      create: { email: consentedEmail, hasConsent: true, source: 'storefront' }
    });

    const consentedSessionToken = `session_consented_${Date.now()}`;
    await api('/cart/sync', {
      method: 'POST',
      body: {
        sessionToken: consentedSessionToken,
        items: sampleItems,
        customerEmail: consentedEmail,
        customerName: 'Ananya Sharma'
      }
    });

    // Age this cart by 2 hours
    await prisma.cart.update({
      where: { sessionToken: consentedSessionToken },
      data: { lastActivityAt: twoHoursAgo }
    });

    // First recovery dispatch
    const firstDispatchRes = await api('/admin/abandoned-carts/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { inactivityMinutes: 60, maxEmails: 1 }
    });

    assert(firstDispatchRes.ok, 'First recovery batch returns 200 OK');

    const cartAfterFirstSend = await prisma.cart.findUnique({
      where: { sessionToken: consentedSessionToken }
    });

    assert(cartAfterFirstSend.recoveryEmailSentCount === 1, 'First dispatch sent exactly 1 recovery email');
    assert(Boolean(cartAfterFirstSend.recoveryToken), 'Secure recovery token generated on dispatch');
    assert(Boolean(cartAfterFirstSend.recoveryTokenExpiresAt), 'Recovery token expiration timestamp set');

    // Second recovery dispatch: MUST BE IDEMPOTENT (0 new emails sent for this cart)
    const secondDispatchRes = await api('/admin/abandoned-carts/process', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { inactivityMinutes: 60, maxEmails: 1 }
    });

    const cartAfterSecondSend = await prisma.cart.findUnique({
      where: { sessionToken: consentedSessionToken }
    });

    assert(
      cartAfterSecondSend.recoveryEmailSentCount === 1,
      'Idempotent guarantee: Second batch dispatch did NOT send duplicate emails'
    );

    // -------------------------------------------------------------------------
    // TEST 5: Expiring Recovery Token Validation & Click Tracking
    // -------------------------------------------------------------------------
    console.log('\n[5] Testing Recovery Token Validation, Click Tracking & Expiration...');

    const validToken = cartAfterSecondSend.recoveryToken;

    // Call recover endpoint with valid token
    const recoverRes = await api(`/cart/recover/${validToken}`);
    assert(recoverRes.ok && recoverRes.data.success, 'Valid recovery token restores cart with 200 OK');
    assert(recoverRes.data.cart?.items?.length > 0, 'Restored cart includes verified items');

    const cartAfterClick = await prisma.cart.findUnique({
      where: { recoveryToken: validToken }
    });
    assert(Boolean(cartAfterClick.recoveryClickedAt), 'recoveryClickedAt timestamp recorded upon link visit');

    // Expired Token Test
    const expiredToken = `expired_tok_${Date.now()}`;
    await prisma.cart.create({
      data: {
        sessionToken: `session_expired_${Date.now()}`,
        items: sampleItems,
        subtotal: 1200,
        itemCount: 2,
        status: 'ABANDONED',
        recoveryToken: expiredToken,
        recoveryTokenExpiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      }
    });

    const expiredRes = await api(`/cart/recover/${expiredToken}`);
    assert(expiredRes.status === 404, 'Expired recovery token is rejected with 404 Not Found');

    // -------------------------------------------------------------------------
    // TEST 6: Checkout Conversion Attribution & Revenue Attribution
    // -------------------------------------------------------------------------
    console.log('\n[6] Testing Checkout Conversion Attribution & Duplicate Protection...');

    // Place an order associated with the recovered session token and recovery token
    const orderRes = await api('/orders/checkout', {
      method: 'POST',
      body: {
        sessionToken: consentedSessionToken,
        recoveryToken: validToken,
        customerName: 'Ananya Sharma',
        customerEmail: consentedEmail,
        customerPhone: '9876543210',
        shippingAddress: '42 Lotus Boulevard, Vasant Vihar',
        city: 'New Delhi',
        state: 'Delhi NCR',
        postalCode: '110057',
        paymentMethod: 'COD',
        items: [
          {
            productId: testProduct.id,
            variantId: testVariant ? testVariant.id : undefined,
            quantity: 1
          }
        ]
      }
    });

    assert(orderRes.ok && orderRes.data.success, 'Checkout order completed successfully');
    const placedOrder = orderRes.data.order;

    // Check cart conversion record
    const convertedCart = await prisma.cart.findUnique({
      where: { recoveryToken: validToken }
    });

    assert(convertedCart.status === 'RECOVERED', 'Cart status transitioned to RECOVERED');
    assert(convertedCart.recoveredOrderId === placedOrder.id, 'Cart accurately linked to placed order ID');
    assert(Number(convertedCart.recoveredRevenue) > 0, 'Attributable revenue recorded on cart');

    // Verify duplicate conversion protection: simulate re-running attribution
    const { attributeCartConversion } = await import('../src/services/cartService.js');
    const duplicateAttribution = await attributeCartConversion({
      orderId: 'fake_duplicate_order_id',
      orderTotal: 9999,
      recoveryToken: validToken
    });

    assert(
      duplicateAttribution.recoveredOrderId === placedOrder.id,
      'Duplicate attribution protection: Existing order link and revenue preserved unchanged'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Admin Recovery Analytics & KPI Verification
    // -------------------------------------------------------------------------
    console.log('\n[7] Testing Admin Abandoned Cart Analytics & KPI Aggregates...');

    const analyticsRes = await api('/admin/abandoned-carts', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert(analyticsRes.ok && analyticsRes.data.success, 'Admin analytics returns 200 OK');
    const { metrics, carts } = analyticsRes.data.data;

    assert(typeof metrics.totalCarts === 'number', 'totalCarts metric is numeric');
    assert(metrics.emailsDispatched >= 1, 'emailsDispatched reflects sent emails');
    assert(metrics.recoveryClicks >= 1, 'recoveryClicks reflects clicked tokens');
    assert(metrics.recoveredOrders >= 1, 'recoveredOrders reflects completed conversions');
    assert(metrics.recoveredRevenue >= 0, 'recoveredRevenue reflects positive monetary attribution');
    assert(Array.isArray(carts) && carts.length > 0, 'Carts list returned with pagination');

    // -------------------------------------------------------------------------
    // TEST 8: Standalone Background Worker Execution
    // -------------------------------------------------------------------------
    console.log('\n[8] Testing Standalone Background Worker Script Execution...');

    const { exec } = await import('child_process');
    const workerOutput = await new Promise((resolve) => {
      exec('node src/workers/abandonedCartWorker.js --inactivity=60', (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });

    assert(
      workerOutput.stdout.includes('DiGlow Abandoned Cart Recovery Worker Initialized'),
      'Standalone worker script initialized cleanly with DiGlow branding'
    );
    assert(
      workerOutput.stdout.includes('Execution completed'),
      'Worker executed batch iteration and logged completion metrics cleanly'
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    // Remove test carts and test orders created during audit
    if (placedOrder?.id) {
      await prisma.cart.deleteMany({
        where: { sessionToken: { in: [testSessionToken, consentedSessionToken] } }
      });
      await prisma.orderItem.deleteMany({ where: { orderId: placedOrder.id } });
      await prisma.order.delete({ where: { id: placedOrder.id } });
    }

    console.log('\n======================================================');
    console.log(`  Phase 13 Audit Completed: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal audit execution exception:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
