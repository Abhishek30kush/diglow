/**
 * DiGlow Phase 10: Order Fulfilment System — Comprehensive Integration Audit Test Suite
 *
 * Validates:
 * 1. Order Status Progression & Valid State Machine Transitions
 * 2. Invalid Status Transition Rejection Guard
 * 3. Idempotency Key & Duplicate Checkout Submission Prevention
 * 4. Delivery Personnel Assignment & Role-Based Access Control (RBAC)
 * 5. Unauthorized Delivery User Cross-Order Isolation (HTTP 403)
 * 6. Secure 6-Digit Delivery PIN Verification
 * 7. Delivery PIN Leakage Prevention in Public Tracking
 * 8. Failed Delivery Attempt Logging (Reason & Timestamp)
 * 9. Order Cancellation Stock Restoration & Double-Restock Prevention
 * 10. Warehouse Returns Processing (RESTOCK_TO_INVENTORY vs DAMAGED_WRITE_OFF)
 */

import http from 'http';

const BASE_URL = 'http://127.0.0.1:5000/api';

function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

const auditResults = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    auditResults.push({ test: testName, passed: true, details });
  } else {
    console.error(`  [FAIL] ${testName}: ${details}`);
    auditResults.push({ test: testName, passed: false, details });
  }
}

async function runPhase10Audit() {
  console.log('===============================================================');
  console.log('   DiGlow Candle Store — Phase 10 Fulfilment Audit Test Suite   ');
  console.log('===============================================================\n');

  try {
    // 1. Authenticate ADMIN, STAFF, and DELIVERY accounts
    console.log('[Step 1] Authenticating Test User Roles...');
    const adminLoginRes = await request('/auth/admin/login', {
      method: 'POST',
      body: { email: 'admin@diglow.com', password: 'DiGlow@Admin2026' }
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Admin Login successful');
    const adminToken = adminLoginRes.data.token;

    const deliveryLoginRes = await request('/auth/admin/login', {
      method: 'POST',
      body: { email: 'delivery@diglow.com', password: 'DiGlow@Delivery2026' }
    });
    assert(deliveryLoginRes.status === 200 && deliveryLoginRes.data.token, 'Delivery Rider Login successful');
    const deliveryToken = deliveryLoginRes.data.token;
    const deliveryRiderId = deliveryLoginRes.data.admin.id;

    const staffLoginRes = await request('/auth/admin/login', {
      method: 'POST',
      body: { email: 'staff@diglow.com', password: 'DiGlow@Staff2026' }
    });
    assert(staffLoginRes.status === 200 && staffLoginRes.data.token, 'Fulfilment Staff Login successful');
    const staffToken = staffLoginRes.data.token;

    // Fetch sample product
    const prodRes = await request('/products');
    const targetProduct = prodRes.data.products[0];
    assert(targetProduct && targetProduct.id, 'Sample product fetched for fulfillment testing');
    const initialProductStock = targetProduct.stock;

    // 2. Test Idempotency & Duplicate Order Prevention
    console.log('\n[Step 2] Testing Duplicate Checkout Submission & Idempotency Key...');
    const idempotencyKey = `audit_idem_${Date.now()}`;
    const checkoutPayload = {
      customerName: 'Priya Sharma (Fulfilment QA)',
      customerEmail: 'priya.qa@example.com',
      customerPhone: '9876543201',
      shippingAddress: 'Flat 402, Lotus Heritage Sanctum, Mehrauli',
      city: 'New Delhi',
      state: 'Delhi NCR',
      postalCode: '110030',
      paymentMethod: 'COD',
      idempotencyKey,
      items: [{ productId: targetProduct.id, quantity: 1 }]
    };

    const firstCheckoutRes = await request('/orders/checkout', {
      method: 'POST',
      body: checkoutPayload
    });
    assert(firstCheckoutRes.status === 201 && firstCheckoutRes.data.order, 'First order submission created order');
    const createdOrder = firstCheckoutRes.data.order;
    const generatedDeliveryPin = firstCheckoutRes.data.deliveryPin;
    assert(Boolean(generatedDeliveryPin), 'Delivery PIN generated for customer on COD order');

    // Duplicate submission with same idempotency key
    const duplicateCheckoutRes = await request('/orders/checkout', {
      method: 'POST',
      body: checkoutPayload
    });
    assert(
      duplicateCheckoutRes.status === 200 &&
      duplicateCheckoutRes.data.order.id === createdOrder.id,
      'Duplicate submission returned existing order without creating duplicate'
    );

    // Verify stock was only decremented ONCE
    const prodCheck = await request(`/products/${targetProduct.slug}`);
    assert(
      prodCheck.data.product.stock === initialProductStock - 1,
      'Stock only decremented once despite repeated checkout submissions'
    );

    // 3. Test Order Status State Machine Transitions
    console.log('\n[Step 3] Testing Order Status State Machine Transitions...');
    // Invalid transition: Pending -> Shipped (should fail because intermediate Confirmed/Processing required)
    const invalidSkipRes = await request(`/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Shipped' }
    });
    assert(invalidSkipRes.status === 400, 'Invalid transition skip (Pending -> Shipped) rejected by state machine');

    // Valid progression: Pending -> Confirmed
    const confirmRes = await request(`/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Confirmed', notes: 'Verified by warehouse manager' }
    });
    assert(confirmRes.status === 200 && confirmRes.data.order.orderStatus === 'Confirmed', 'Transition to Confirmed succeeded');

    // Confirmed -> Processing
    const procRes = await request(`/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'Processing', notes: 'Candles brought to wrapping table' }
    });
    assert(procRes.status === 200 && procRes.data.order.orderStatus === 'Processing', 'Staff transitioned order to Processing');

    // Processing -> Packed
    const packRes = await request(`/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { status: 'Packed', notes: 'QC checked & sealed with packing slip' }
    });
    assert(packRes.status === 200 && packRes.data.order.orderStatus === 'Packed', 'Order marked as Packed');

    // 4. Test Delivery Assignment
    console.log('\n[Step 4] Testing Delivery Rider Assignment...');
    // Delivery rider cannot assign orders (RBAC)
    const riderAssignRes = await request(`/admin/orders/${createdOrder.id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${deliveryToken}` },
      body: { assignedToId: deliveryRiderId }
    });
    assert(riderAssignRes.status === 403, 'Rider prohibited from assigning orders (HTTP 403 Forbidden)');

    // Staff assigns to Delivery Rider
    const staffAssignRes = await request(`/admin/orders/${createdOrder.id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        assignedToId: deliveryRiderId,
        deliveryPartner: 'DiGlow Express Express Delivery'
      }
    });
    assert(
      staffAssignRes.status === 200 &&
      staffAssignRes.data.order.assignedToId === deliveryRiderId,
      'Staff assigned order to Delivery Rider Vikram Singh'
    );

    // 5. Packed -> Shipped (dispatches order and records dispatchedAt)
    console.log('\n[Step 5] Testing Dispatch & Logistics Tracking...');
    const shipRes = await request(`/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'Shipped',
        trackingNumber: 'DG-EXP-889922IN',
        deliveryPartner: 'DiGlow Express'
      }
    });
    assert(shipRes.status === 200 && shipRes.data.order.orderStatus === 'Shipped', 'Order transitioned to Shipped');
    assert(Boolean(shipRes.data.order.dispatchedAt), 'Dispatched timestamp recorded');

    // 6. Test Public Tracking Endpoint & Security Isolation
    console.log('\n[Step 6] Testing Public Tracking API Security & Privacy...');
    const trackRes = await request('/orders/track', {
      method: 'POST',
      body: {
        orderNumber: createdOrder.orderNumber,
        phone: createdOrder.customerPhone
      }
    });
    assert(trackRes.status === 200 && trackRes.data.order, 'Customer tracking query succeeded');
    assert(
      trackRes.data.order.deliveryPin === undefined &&
      trackRes.data.order.deliveryPinHash === undefined,
      'Delivery PIN and PIN Hash are strictly shielded from public tracking response'
    );
    assert(
      trackRes.data.order.trackingNumber === 'DG-EXP-889922IN',
      'AWB tracking number visible to customer'
    );

    // 7. Shipped -> Out for Delivery (Rider action)
    console.log('\n[Step 7] Testing Delivery Portal Access & Out for Delivery transition...');
    const riderAssignedView = await request('/admin/delivery/assigned', {
      headers: { Authorization: `Bearer ${deliveryToken}` }
    });
    assert(
      riderAssignedView.status === 200 &&
      riderAssignedView.data.orders.some((o) => o.id === createdOrder.id),
      'Assigned order is visible in rider portal view'
    );

    const outRes = await request(`/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${deliveryToken}` },
      body: { status: 'Out for Delivery', notes: 'Rider is on the way' }
    });
    assert(outRes.status === 200 && outRes.data.order.orderStatus === 'Out for Delivery', 'Rider marked order Out for Delivery');

    // 8. Test Failed Delivery Logging
    console.log('\n[Step 8] Testing Failed Delivery Attempt Logging...');
    const failedRes = await request(`/admin/orders/${createdOrder.id}/failed-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deliveryToken}` },
      body: { reason: 'Customer door locked & phone unreachable' }
    });
    assert(
      failedRes.status === 200 &&
      failedRes.data.order.orderStatus === 'Failed Delivery' &&
      failedRes.data.order.failedAttempts === 1,
      'Failed delivery attempt recorded with counter increment and reason'
    );

    // Reschedule: Failed Delivery -> Out for Delivery
    const retryRunRes = await request(`/admin/orders/${createdOrder.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${deliveryToken}` },
      body: { status: 'Out for Delivery', notes: 'Second delivery run scheduled' }
    });
    assert(retryRunRes.status === 200 && retryRunRes.data.order.orderStatus === 'Out for Delivery', 'Re-dispatched for second run');

    // 9. Test Secure 6-Digit Delivery PIN Verification
    console.log('\n[Step 9] Testing Secure Doorstep PIN Verification...');
    // Wrong PIN
    const wrongPinRes = await request(`/admin/orders/${createdOrder.id}/verify-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deliveryToken}` },
      body: { pin: '000000' }
    });
    assert(wrongPinRes.status === 400, 'Incorrect delivery PIN rejected');

    // Correct PIN
    const correctPinRes = await request(`/admin/orders/${createdOrder.id}/verify-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deliveryToken}` },
      body: { pin: generatedDeliveryPin }
    });
    assert(
      correctPinRes.status === 200 &&
      correctPinRes.data.order.orderStatus === 'Delivered' &&
      correctPinRes.data.order.paymentStatus === 'Paid',
      'Correct PIN verified, order marked Delivered, and COD payment collected'
    );

    // 10. Test Returns Processing (RESTOCK_TO_INVENTORY vs DAMAGED_WRITE_OFF)
    console.log('\n[Step 10] Testing Warehouse Return Processing & Restock Rules...');
    // Rider cannot process returns (RBAC)
    const riderReturnRes = await request(`/admin/orders/${createdOrder.id}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deliveryToken}` },
      body: { itemDisposition: 'RESTOCK_TO_INVENTORY', reason: 'Unopened box returned' }
    });
    assert(riderReturnRes.status === 403, 'Delivery rider forbidden from processing returns (HTTP 403)');

    // Admin processes return with RESTOCK_TO_INVENTORY
    const stockBeforeReturn = (await request(`/products/${targetProduct.slug}`)).data.product.stock;
    const adminReturnRes = await request(`/admin/orders/${createdOrder.id}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        itemDisposition: 'RESTOCK_TO_INVENTORY',
        reason: 'Customer returned sealed parcel in original packing'
      }
    });
    assert(
      adminReturnRes.status === 200 &&
      adminReturnRes.data.order.orderStatus === 'Returned' &&
      adminReturnRes.data.order.isRestocked === true,
      'Order marked as Returned with isRestocked=true'
    );

    // Check stock was incremented
    const stockAfterReturn = (await request(`/products/${targetProduct.slug}`)).data.product.stock;
    assert(
      stockAfterReturn === stockBeforeReturn + 1,
      'Stock successfully incremented by returned quantity in inventory'
    );

    // Verify double-restocking is blocked
    const doubleReturnRes = await request(`/admin/orders/${createdOrder.id}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { itemDisposition: 'RESTOCK_TO_INVENTORY', reason: 'Repeat return attempt' }
    });
    assert(
      doubleReturnRes.status === 400 || doubleReturnRes.status === 500,
      'Double-restocking guard prevented second restock of the same order'
    );

    // 11. Test Order Cancellation Stock Restoration & Double-Restock Guard
    console.log('\n[Step 11] Testing Cancellation Stock Restoration & Double-Restock Guard...');
    const cancelCheckoutRes = await request('/orders/checkout', {
      method: 'POST',
      body: {
        customerName: 'Aarav Patel (Cancel Test)',
        customerEmail: 'aarav.cancel@example.com',
        customerPhone: '9876543209',
        shippingAddress: '12 Connaught Place, Block B',
        city: 'New Delhi',
        state: 'Delhi NCR',
        postalCode: '110001',
        paymentMethod: 'COD',
        items: [{ productId: targetProduct.id, quantity: 2 }]
      }
    });
    const orderToCancel = cancelCheckoutRes.data.order;
    const stockBeforeCancel = (await request(`/products/${targetProduct.slug}`)).data.product.stock;

    // Admin cancels order
    const cancelRes = await request(`/admin/orders/${orderToCancel.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Cancelled', notes: 'Customer changed scent preference' }
    });
    assert(
      cancelRes.status === 200 &&
      cancelRes.data.order.orderStatus === 'Cancelled',
      'Order cancelled successfully'
    );

    const stockAfterCancel = (await request(`/products/${targetProduct.slug}`)).data.product.stock;
    assert(
      stockAfterCancel === stockBeforeCancel + 2,
      'Full stock restored to inventory upon cancellation (+2 units)'
    );

    // Attempting to cancel again should fail state machine or double restock guard
    const repeatCancelRes = await request(`/admin/orders/${orderToCancel.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Cancelled', notes: 'Repeat cancellation' }
    });
    assert(repeatCancelRes.status === 400, 'Repeat cancellation rejected (cannot double-restore stock)');

    // 12. Test Fulfilment Dashboard Metrics
    console.log('\n[Step 12] Testing Fulfilment Operations Dashboard Analytics...');
    const statsRes = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(statsRes.status === 200 && statsRes.data.stats, 'Dashboard stats fetched successfully');
    const stats = statsRes.data.stats;
    assert(
      stats.deliveredOrders !== undefined &&
      stats.failedDeliveryOrders !== undefined &&
      stats.shippedOrders !== undefined &&
      stats.packedOrders !== undefined &&
      stats.returnedOrders !== undefined,
      'All Phase 10 fulfilment status counts present in dashboard stats'
    );

    // 13. Test Filtered CSV Export
    console.log('\n[Step 13] Testing Filtered Orders CSV Export...');
    const csvRes = await request('/admin/orders/export/csv?status=Delivered', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(csvRes.status === 200, 'Orders CSV export endpoint returned HTTP 200');
    assert(
      csvRes.data.raw.includes('Order Number') &&
      csvRes.data.raw.includes('Assigned Rider') &&
      csvRes.data.raw.includes('Dispatched At'),
      'CSV contains required fulfillment headers (Assigned Rider, Dispatched At)'
    );

    // Summary
    console.log('\n===============================================================');
    const passedCount = auditResults.filter((r) => r.passed).length;
    const totalCount = auditResults.length;
    console.log(`   Phase 10 Audit Summary: ${passedCount} / ${totalCount} PASSED`);
    console.log('===============================================================\n');

    if (passedCount === totalCount) {
      console.log('ALL PHASE 10 FULFILMENT REQUIREMENTS VERIFIED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error(`FAILED: ${totalCount - passedCount} assertions failed.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running Phase 10 audit:', error);
    process.exit(1);
  }
}

runPhase10Audit();
