import prisma from '../src/lib/prisma.js';

async function verifyAdminOrder() {
  // 1. Admin login
  const loginRes = await fetch('http://localhost:5000/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@diglow.com', password: 'DiGlow@Admin2026' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('1. Admin authenticated:', !!token);

  // 2. Fetch order
  const order = await prisma.order.findUnique({
    where: { orderNumber: 'DIG-2026-CA84A' }
  });
  console.log('2. Real customer order ID:', order.id);

  // 3. Status transition: Confirmed -> Processing
  const procRes = await fetch(`http://localhost:5000/api/admin/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'Processing', notes: 'Wick trimming and QC check' })
  });
  const procData = await procRes.json();
  console.log('3. Processing status:', procData.order?.orderStatus);

  // 4. Status transition: Processing -> Packing
  const packRes = await fetch(`http://localhost:5000/api/admin/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'Packing', notes: 'Handcrafted box sealed with golden ribbon' })
  });
  const packData = await packRes.json();
  console.log('4. Packing status:', packData.order?.orderStatus);

  // 5. Status transition: Packing -> Shipped
  const shipRes = await fetch(`http://localhost:5000/api/admin/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      status: 'Shipped',
      deliveryPartner: 'BlueDart Express',
      trackingNumber: 'BD98234821',
      notes: 'Dispatched from New Delhi hub'
    })
  });
  const shipData = await shipRes.json();
  console.log('5. Shipped status:', shipData.order?.orderStatus);

  // 6. Status transition: Shipped -> Out for Delivery
  const ofdRes = await fetch(`http://localhost:5000/api/admin/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'Out for Delivery', notes: 'Rider en route with parcel' })
  });
  const ofdData = await ofdRes.json();
  console.log('6. Out for Delivery status:', ofdData.order?.orderStatus);

  // 7. Invalid transition test: Out for Delivery -> Confirmed (illegal backwards jump)
  const invalidRes = await fetch(`http://localhost:5000/api/admin/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'Confirmed' })
  });
  const invalidData = await invalidRes.json();
  console.log('7. State Machine Guard - Invalid transition code:', invalidRes.status, 'Rejection:', invalidData.message);

  // 8. Delivery PIN verification security test: Wrong 6-digit PIN
  const wrongPinRes = await fetch(`http://localhost:5000/api/admin/orders/${order.id}/verify-delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pin: '000000' })
  });
  console.log('8. Delivery PIN Security - Wrong PIN rejected with HTTP code:', wrongPinRes.status);

  // 9. Customer Order Tracking public endpoint check
  const trackRes = await fetch('http://localhost:5000/api/orders/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber: 'DIG-2026-CA84A', phone: '9876543210' })
  });
  const trackData = await trackRes.json();
  console.log('9. Public Customer Tracking view:');
  console.log('   - Current Status in timeline:', trackData.order.orderStatus);
  console.log('   - Courier Partner:', trackData.order.deliveryPartner);
  console.log('   - Tracking AWB Number:', trackData.order.trackingNumber);
  console.log('   - Delivery PIN leaked in response?:', trackData.order.deliveryPin !== undefined || trackData.order.deliveryPinHash !== undefined);
  console.log('   - Timeline audit entries logged:', trackData.order.statusLogs.length);
}

verifyAdminOrder().then(() => process.exit(0)).catch(console.error);
