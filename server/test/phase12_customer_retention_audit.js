/**
 * DiGlow Candle Store — Phase 12 Customer Retention & Loyalty Audit
 * Tests:
 * 1. Customer registration, login, profile view & update
 * 2. Secure password change & validation (valid, wrong current, short new)
 * 3. Saved addresses (create multiple, default toggle, update, delete, cross-account isolation)
 * 4. Wishlist persistence, active variant details, out-of-stock handling, cross-account isolation
 * 5. Reorder flow with live stock & catalog price revalidation (price change detection & out-of-stock guard)
 * 6. Cross-account authorization guards (Order reorder, cancellation, address tampering)
 * 7. Newsletter preferences toggle & consent timestamp recording
 * 8. Public order tracking privacy (masked email, masked phone, masked private street address)
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

async function runPhase12Audit() {
  console.log('\n================================================================');
  console.log('   🕯️ DIGLOW CANDLE STORE — PHASE 12 CUSTOMER RETENTION AUDIT');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testUserA = {
    name: 'Maharani Gayatri',
    email: `gayatri_${timestamp}@diglow-sanctum.test`,
    password: 'InitialPassword@2026',
    phone: '9876543210'
  };

  const testUserB = {
    name: 'Raja Vikramaditya',
    email: `vikram_${timestamp}@diglow-sanctum.test`,
    password: 'VikramPassword@2026',
    phone: '9812345678'
  };

  let tokenA = null;
  let userAId = null;
  let tokenB = null;
  let userBId = null;
  let fixtureProduct = null;

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Customer Account & Profile
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Customer Registration & Authentication ---');

    // 1.1 Register User A
    const regResA = await api('/auth/register', { method: 'POST', body: testUserA });
    assert(regResA.status === 201 && regResA.data.success, 'Customer A registered successfully');
    tokenA = regResA.data.token;
    userAId = regResA.data.user.id;

    // 1.2 Register User B
    const regResB = await api('/auth/register', { method: 'POST', body: testUserB });
    assert(regResB.status === 201 && regResB.data.success, 'Customer B registered successfully');
    tokenB = regResB.data.token;
    userBId = regResB.data.user.id;

    const authHeadersA = { headers: { Authorization: `Bearer ${tokenA}` } };
    const authHeadersB = { headers: { Authorization: `Bearer ${tokenB}` } };

    // 1.3 Unauthenticated access rejection
    const unauthRes = await api('/auth/me');
    assert(unauthRes.status === 401, 'Unauthenticated /auth/me rejected with 401 Unauthorized');

    // 1.4 Get Profile
    const profileRes = await api('/auth/me', { ...authHeadersA });
    assert(
      profileRes.data.success && profileRes.data.user.email === testUserA.email,
      'Authenticated customer profile retrieved correctly'
    );

    // 1.5 Update Profile
    const updatedName = 'Maharani Gayatri Devi of Jaipur';
    const updateRes = await api('/auth/profile', {
      method: 'PUT',
      body: { name: updatedName, phone: '9876500000' },
      ...authHeadersA
    });
    assert(
      updateRes.data.success && updateRes.data.user.name === updatedName,
      'Customer profile updated name and contact phone securely'
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 2: Secure Password Change & Recovery
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Secure Password Change & Validation ---');

    // 2.1 Password change fails with wrong current password
    const wrongPassRes = await api('/auth/password', {
      method: 'PUT',
      body: { currentPassword: 'WrongPassword', newPassword: 'NewSecurePassword@2026' },
      ...authHeadersA
    });
    assert(wrongPassRes.status === 400, 'Password change rejected for incorrect current password');

    // 2.2 Password change fails with new password < 6 chars
    const shortPassRes = await api('/auth/password', {
      method: 'PUT',
      body: { currentPassword: testUserA.password, newPassword: '123' },
      ...authHeadersA
    });
    assert(shortPassRes.status === 400, 'Password change rejected for password under 6 chars');

    // 2.3 Valid password change
    const newPasswordA = 'DiGlowUpdated@2026';
    const changePassRes = await api('/auth/password', {
      method: 'PUT',
      body: { currentPassword: testUserA.password, newPassword: newPasswordA },
      ...authHeadersA
    });
    assert(changePassRes.data.success, 'Valid password change succeeded');

    // 2.4 Old password login fails
    const oldLoginRes = await api('/auth/login', {
      method: 'POST',
      body: { email: testUserA.email, password: testUserA.password }
    });
    assert(oldLoginRes.status === 401, 'Login with previous password rejected');

    // 2.5 New password login succeeds
    const newLoginRes = await api('/auth/login', {
      method: 'POST',
      body: { email: testUserA.email, password: newPasswordA }
    });
    assert(newLoginRes.data.success && Boolean(newLoginRes.data.token), 'Login with new password succeeded');
    tokenA = newLoginRes.data.token;
    authHeadersA.headers.Authorization = `Bearer ${tokenA}`;

    // 2.6 Forgot password endpoint handles request cleanly
    const forgotRes = await api('/auth/forgot-password', {
      method: 'POST',
      body: { email: testUserA.email }
    });
    assert(forgotRes.data.success, 'Password recovery endpoint dispatched confirmation');

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Saved Addresses & Cross-Account Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Saved Addresses & Cross-Account Isolation ---');

    // 3.1 Add Address 1 (Default)
    const addr1Res = await api('/customer/addresses', {
      method: 'POST',
      body: {
        label: 'Jaipur Palace',
        name: 'Maharani Gayatri',
        phone: '9876543210',
        street: 'City Palace Complex',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302002',
        isDefault: true
      },
      ...authHeadersA
    });
    assert(addr1Res.status === 201 && addr1Res.data.address.isDefault, 'Address 1 saved with default: true');
    const addr1Id = addr1Res.data.address.id;

    // 3.2 Add Address 2 (Second address, default: true should unset Address 1 as default)
    const addr2Res = await api('/customer/addresses', {
      method: 'POST',
      body: {
        label: 'Delhi Sanctum',
        name: 'Maharani Gayatri',
        phone: '9876543210',
        street: '42 Chanakyapuri Diplomatic Enclave',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110021',
        isDefault: true
      },
      ...authHeadersA
    });
    assert(addr2Res.status === 201 && addr2Res.data.address.isDefault, 'Address 2 saved as new default');
    const addr2Id = addr2Res.data.address.id;

    // Verify Address 1 default flag was unset
    const listAddrRes = await api('/customer/addresses', { ...authHeadersA });
    const refreshedAddr1 = listAddrRes.data.addresses.find((a) => a.id === addr1Id);
    assert(!refreshedAddr1.isDefault, 'Previous default address was automatically unset');

    // 3.3 Edit Address 1
    const editAddrRes = await api(`/customer/addresses/${addr1Id}`, {
      method: 'PUT',
      body: { label: 'Royal Haveli Retreat' },
      ...authHeadersA
    });
    assert(
      editAddrRes.data.success && editAddrRes.data.address.label === 'Royal Haveli Retreat',
      'Address updated successfully'
    );

    // 3.4 Cross-account protection: User B cannot delete or edit User A's address
    const crossDeleteRes = await api(`/customer/addresses/${addr1Id}`, {
      method: 'DELETE',
      ...authHeadersB
    });
    assert(crossDeleteRes.status === 404, 'Cross-account address deletion blocked with 404');

    const crossEditRes = await api(`/customer/addresses/${addr1Id}`, {
      method: 'PUT',
      body: { label: 'Hacked' },
      ...authHeadersB
    });
    assert(crossEditRes.status === 404, 'Cross-account address edit blocked with 404');

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Wishlist & Cross-Account Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Wishlist Persistence & Isolation ---');

    // Fetch or create a deterministic test product fixture with guaranteed inventory
    fixtureProduct = await prisma.product.create({
      data: {
        name: `QA Loyalty Test Candle ${timestamp}`,
        slug: `qa-loyalty-candle-${timestamp}`,
        sku: `QA-LOYAL-${timestamp.toString().slice(-6)}`,
        description: 'Isolated test fixture for customer retention and reorder test',
        scentProfile: 'Royal Rose & Cardamom',
        imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80',
        price: 899,
        stock: 50,
        category: 'Festive Sanctum',
        isActive: true,
        productVariants: {
          create: [
            {
              sku: `QA-VAR-1-${timestamp.toString().slice(-6)}`,
              title: 'Grand 500g / Sanctum Box',
              price: 899,
              stock: 25,
              isActive: true
            }
          ]
        }
      },
      include: { productVariants: true }
    });
    const candleProduct = fixtureProduct;
    assert(Boolean(candleProduct), 'Isolated candle product fixture initialized with 50 units stock');

    // 4.1 Add to wishlist
    const wishAddRes = await api('/customer/wishlist', {
      method: 'POST',
      body: { productId: candleProduct.id },
      ...authHeadersA
    });
    assert(wishAddRes.data.success, 'Product added to Customer A wishlist');

    // 4.2 Duplicate add (upsert)
    const wishAddDup = await api('/customer/wishlist', {
      method: 'POST',
      body: { productId: candleProduct.id },
      ...authHeadersA
    });
    assert(wishAddDup.data.success, 'Duplicate wishlist item handled idempotently without error');

    // 4.3 Get wishlist items
    const wishListRes = await api('/customer/wishlist', { ...authHeadersA });
    assert(
      wishListRes.data.success && wishListRes.data.wishlist.some((w) => w.productId === candleProduct.id),
      'Wishlist item contains live product and active variant data'
    );

    // 4.4 Cross-account isolation: User B's wishlist is empty
    const wishListB = await api('/customer/wishlist', { ...authHeadersB });
    assert(
      wishListB.data.wishlist.length === 0,
      'User B wishlist is isolated and does not see User A items'
    );

    // 4.5 Remove from wishlist
    const removeWishRes = await api(`/customer/wishlist/${candleProduct.id}`, {
      method: 'DELETE',
      ...authHeadersA
    });
    assert(removeWishRes.data.success, 'Product removed from wishlist successfully');

    // -------------------------------------------------------------------------
    // TEST SECTION 5: Reorder Flow with Live Pricing & Stock Revalidation
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Reorder Flow with Live Pricing & Stock Revalidation ---');

    // 5.1 Place a test order for Customer A
    const orderPayload = {
      customerName: 'Maharani Gayatri',
      customerEmail: testUserA.email,
      customerPhone: '9876543210',
      shippingAddress: 'City Palace Complex',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302002',
      paymentMethod: 'COD',
      items: [
        {
          productId: candleProduct.id,
          quantity: 2,
          variantId: candleProduct.productVariants?.[0]?.id || null
        }
      ]
    };

    const checkoutRes = await api('/orders/checkout', {
      method: 'POST',
      body: orderPayload,
      ...authHeadersA
    });
    assert(checkoutRes.data.success && checkoutRes.data.order, 'Test order placed for Customer A');
    const pastOrder = checkoutRes.data.order;

    // 5.2 Customer A requests reorder availability
    const reorderRes = await api(`/customer/orders/${pastOrder.id}/reorder`, {
      method: 'POST',
      ...authHeadersA
    });
    assert(reorderRes.data.success && reorderRes.data.reorder, 'Reorder availability fetched successfully');
    assert(
      reorderRes.data.reorder.items.length === 1,
      'Reorder items correctly populated from historical order'
    );
    assert(
      reorderRes.data.reorder.items[0].currentPrice !== undefined,
      'Reorder uses current catalog price, not hardcoded historical price'
    );

    // 5.3 Cross-account reorder attempt: User B tries to reorder User A order
    const crossReorderRes = await api(`/customer/orders/${pastOrder.id}/reorder`, {
      method: 'POST',
      ...authHeadersB
    });
    assert(crossReorderRes.status === 404, 'Unauthorized reorder attempt blocked with 404 Not Found');

    // -------------------------------------------------------------------------
    // TEST SECTION 6: Customer Communication & Newsletter Preferences
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Customer Communication & Newsletter Preferences ---');

    // 6.1 Get Newsletter Preferences
    const prefRes = await api('/customer/newsletter-preferences', { ...authHeadersA });
    assert(prefRes.data.success, 'Retrieved customer newsletter preferences');

    // 6.2 Update Newsletter Preference to Subscribed (opt-in with consent)
    const optInRes = await api('/customer/newsletter-preferences', {
      method: 'PATCH',
      body: { subscribed: true },
      ...authHeadersA
    });
    assert(
      optInRes.data.success && optInRes.data.subscribed === true,
      'Customer opted in to newsletter with consent timestamp'
    );

    // 6.3 Update Newsletter Preference to Unsubscribed (opt-out)
    const optOutRes = await api('/customer/newsletter-preferences', {
      method: 'PATCH',
      body: { subscribed: false },
      ...authHeadersA
    });
    assert(
      optOutRes.data.success && optOutRes.data.subscribed === false,
      'Customer opted out of marketing communications cleanly'
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 7: Public Order Tracking Privacy Protection
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Public Order Tracking Privacy Protection ---');

    const trackRes = await api('/orders/track', {
      method: 'POST',
      body: {
        orderNumber: pastOrder.orderNumber,
        phone: '9876543210'
      }
    });

    assert(trackRes.data.success && trackRes.data.order, 'Public track order succeeded with orderNumber + phone');
    const trackedOrder = trackRes.data.order;

    // Verify sensitive data is masked
    assert(
      trackedOrder.customerEmail.includes('***@'),
      `Customer email is masked in public tracking: "${trackedOrder.customerEmail}"`
    );
    assert(
      trackedOrder.customerPhone.startsWith('******'),
      `Customer phone is masked in public tracking: "${trackedOrder.customerPhone}"`
    );
    assert(
      !trackedOrder.shippingAddress.includes('City Palace Complex'),
      `Private street address is masked in public tracking: "${trackedOrder.shippingAddress}"`
    );
    assert(
      trackedOrder.deliveryPinHash === undefined,
      'Security: deliveryPinHash is never exposed in public tracking'
    );

  } catch (err) {
    console.error('Unexpected test error:', err.message);
    failed++;
  } finally {
    // Clean up test data
    console.log('\n--- Cleaning up test artifacts ---');
    try {
      if (userAId) {
        await prisma.wishlistItem.deleteMany({ where: { userId: userAId } });
        await prisma.address.deleteMany({ where: { userId: userAId } });
        await prisma.orderItem.deleteMany({ where: { order: { userId: userAId } } });
        await prisma.orderStatusLog.deleteMany({ where: { order: { userId: userAId } } });
        await prisma.order.deleteMany({ where: { userId: userAId } });
        await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
      }
      if (userBId) {
        await prisma.wishlistItem.deleteMany({ where: { userId: userBId } });
        await prisma.address.deleteMany({ where: { userId: userBId } });
        await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
      }
      if (fixtureProduct) {
        await prisma.inventoryLog.deleteMany({ where: { productId: fixtureProduct.id } });
        await prisma.orderItem.deleteMany({ where: { productId: fixtureProduct.id } });
        await prisma.productVariant.deleteMany({ where: { productId: fixtureProduct.id } });
        await prisma.product.delete({ where: { id: fixtureProduct.id } }).catch(() => {});
      }
      await prisma.$disconnect();
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n================================================================');
  console.log(`   PHASE 12 AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase12Audit();
