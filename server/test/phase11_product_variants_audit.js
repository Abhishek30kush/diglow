import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();
const BASE_URL = 'http://127.0.0.1:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase11Audit() {
  console.log('\n======================================================');
  console.log('   DiGlow Candle Store — Phase 11 Automated Audit');
  console.log('   Product Variants, Gallery & Specification Suite');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, name) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test #${totalTests}: ${name}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test #${totalTests}: ${name}`);
    }
  }

  try {
    // 0. Authenticate admin user
    const adminLoginRes = await request('POST', '/auth/admin/login', {
      email: 'admin@diglow.com',
      password: 'DiGlow@Admin2026'
    });
    const adminToken = adminLoginRes.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin authentication successful');

    // 1. Fetch public product and verify variants & structured fields
    const prodListRes = await request('GET', '/products');
    const firstProd = prodListRes.data?.products?.[0];
    assert(Boolean(firstProd?.slug), 'Product list returned at least one candle');

    const productRes = await request('GET', `/products/${firstProd.slug}`);
    assert(productRes.status === 200 && productRes.data?.success, 'Fetch product by slug returns 200');
    
    const prod = productRes.data.product;
    assert(Array.isArray(prod.productVariants) && prod.productVariants.length >= 2, 'Product contains active productVariants array');
    assert(Boolean(prod.ingredients) && Boolean(prod.dimensions), 'Product includes structured ingredients & dimensions');
    assert(Boolean(prod.careInstructions) && Boolean(prod.safetyWarnings), 'Product includes care instructions & safety warnings');

    const grandVariant = prod.productVariants.find(v => v.title.includes('Grand'));
    assert(Boolean(grandVariant && grandVariant.sku && grandVariant.price), 'Grand Edition variant has SKU, title, and price');

    // 2. Admin Variant Creation
    const testSku = `DG-TEST-VAR-${Date.now()}`;
    const createVarRes = await request('POST', `/admin/products/${prod.id}/variants`, {
      sku: testSku,
      title: 'Festival Deluxe - Silk Embroidered Keepsake Box',
      size: '600g / 21 oz',
      packaging: 'Silk Embroidered Keepsake Box',
      fragrance: 'Royal Oudh & Amber',
      color: 'Emerald & Gold',
      price: 2499,
      compareAtPrice: 3200,
      stock: 12,
      lowStockThreshold: 4,
      imageUrl: prod.imageUrl,
      isActive: true
    }, adminToken);

    assert(createVarRes.status === 201 && createVarRes.data?.variant?.sku === testSku, 'Admin can create new product variant with custom SKU and stock');
    const createdVariant = createVarRes.data?.variant;

    // 3. Admin Variant Stock Adjustment with Audit Reason
    const adjustRes = await request('PATCH', `/admin/variants/${createdVariant.id}/stock`, {
      delta: 8,
      reason: 'FESTIVE_STOCK_REPLENISHMENT'
    }, adminToken);

    assert(adjustRes.status === 200 && adjustRes.data?.variant?.stock === 20, 'Admin can adjust variant stock with audit reason');

    const auditLog = await prisma.inventoryLog.findFirst({
      where: {
        variantId: createdVariant.id,
        reason: { contains: 'FESTIVE_STOCK_REPLENISHMENT' }
      }
    });
    assert(Boolean(auditLog && auditLog.change === 8), 'InventoryLog records variant stock adjustment and reason');

    // 4. Concurrency & Variant Stock Validation on Checkout
    await prisma.product.update({ where: { id: prod.id }, data: { stock: 500 } });
    const initialVariantStock = (await prisma.productVariant.findUnique({ where: { id: createdVariant.id } })).stock;
    const initialProductStock = 500;

    // Attempt checkout exceeding variant stock -> must be rejected
    const overstockOrderRes = await request('POST', '/orders/checkout', {
      customerName: 'Radhika Overstock Test',
      customerEmail: `radhika.overstock.${Date.now()}@example.com`,
      customerPhone: '9876543210',
      shippingAddress: 'Flat 402, Royal Palms, Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302006',
      paymentMethod: 'COD',
      items: [
        {
          productId: prod.id,
          variantId: createdVariant.id,
          quantity: initialVariantStock + 50
        }
      ]
    });
    assert(overstockOrderRes.status === 400, 'Checkout rejects purchase exceeding variant stock');

    // Attempt checkout of inactive variant -> must be rejected
    await prisma.productVariant.update({ where: { id: createdVariant.id }, data: { isActive: false } });
    const inactiveVariantOrderRes = await request('POST', '/orders/checkout', {
      customerName: 'Radhika Inactive Test',
      customerEmail: `radhika.inactive.${Date.now()}@example.com`,
      customerPhone: '9876543211',
      shippingAddress: 'Flat 402, Royal Palms, Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302006',
      paymentMethod: 'COD',
      items: [
        {
          productId: prod.id,
          variantId: createdVariant.id,
          quantity: 2
        }
      ]
    });
    assert(inactiveVariantOrderRes.status === 400, 'Checkout rejects purchase of inactive variant');

    // Reactivate variant for valid checkout
    await prisma.productVariant.update({ where: { id: createdVariant.id }, data: { isActive: true } });

    // Valid Checkout with Variant
    const purchaseQty = 3;
    const validOrderRes = await request('POST', '/orders/checkout', {
      customerName: 'Radhika Sharma Valid',
      customerEmail: `radhika.valid.${Date.now()}@example.com`,
      customerPhone: '9876543212',
      shippingAddress: 'Flat 402, Royal Palms, Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302006',
      paymentMethod: 'COD',
      items: [
        {
          productId: prod.id,
          variantId: createdVariant.id,
          quantity: purchaseQty
        }
      ]
    });
    assert(validOrderRes.status === 201 && validOrderRes.data?.success, 'Valid order placed successfully with selected variant');
    const createdOrder = validOrderRes.data?.order;

    // Verify stock decrement
    const afterVariantStock = (await prisma.productVariant.findUnique({ where: { id: createdVariant.id } })).stock;
    const afterProductStock = (await prisma.product.findUnique({ where: { id: prod.id } })).stock;
    assert(afterVariantStock === initialVariantStock - purchaseQty, `Variant stock decremented accurately: ${initialVariantStock} -> ${afterVariantStock}`);
    assert(afterProductStock === initialProductStock - purchaseQty, `Parent product stock decremented accurately: ${initialProductStock} -> ${afterProductStock}`);

    // Verify Historical Order Item Snapshot preservation
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId: createdOrder.id, variantId: createdVariant.id }
    });
    assert(Boolean(orderItem), 'OrderItem links to variantId');
    assert(orderItem.productName === prod.name, 'OrderItem preserves historical productName snapshot');
    assert(orderItem.variantSku === createdVariant.sku, 'OrderItem preserves historical variantSku snapshot');
    assert(orderItem.variantName === createdVariant.title, 'OrderItem preserves historical variantName snapshot');
    assert(Number(orderItem.unitPrice) === Number(createdVariant.price), 'OrderItem preserves historical purchase unitPrice');

    // 5. Admin Variant Deletion Guard (Historical Order Safety)
    const deleteReferencedVarRes = await request('DELETE', `/admin/variants/${createdVariant.id}`, null, adminToken);
    assert(deleteReferencedVarRes.status === 200 && deleteReferencedVarRes.data?.archived === true, 'Deleting variant with order history triggers archival guard (not DB hard delete)');

    const archivedVariantInDb = await prisma.productVariant.findUnique({ where: { id: createdVariant.id } });
    assert(archivedVariantInDb !== null && archivedVariantInDb.isArchived === true && archivedVariantInDb.isActive === false, 'Variant row preserved in DB with isArchived: true & isActive: false');

    // 6. Order Cancellation and Variant Stock Restoration
    const cancelRes = await request('PATCH', `/admin/orders/${createdOrder.id}/status`, {
      status: 'Cancelled',
      cancellationReason: 'Customer requested change of shipping address'
    }, adminToken);
    assert(cancelRes.status === 200 && cancelRes.data?.success, 'Order cancellation succeeds');

    const restoredVariantStock = (await prisma.productVariant.findUnique({ where: { id: createdVariant.id } })).stock;
    const restoredProductStock = (await prisma.product.findUnique({ where: { id: prod.id } })).stock;
    assert(restoredVariantStock === initialVariantStock, `Cancelled order restores variant stock: ${afterVariantStock} -> ${restoredVariantStock}`);
    assert(restoredProductStock === initialProductStock, `Cancelled order restores parent product stock: ${afterProductStock} -> ${restoredProductStock}`);

    // 7. Product Gallery Management API
    const testGallery = [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596433809252-260c2745dfdd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?auto=format&fit=crop&w=800&q=80'
    ];

    const galleryUpdateRes = await request('PATCH', `/admin/products/${prod.id}/gallery`, {
      gallery: testGallery
    }, adminToken);
    assert(galleryUpdateRes.status === 200 && galleryUpdateRes.data?.success, 'Admin can reorder and update product image gallery');

    const removeImgRes = await request('DELETE', `/admin/products/${prod.id}/gallery?imageUrl=${encodeURIComponent(testGallery[2])}`, null, adminToken);
    assert(removeImgRes.status === 200 && removeImgRes.data?.product?.gallery?.length === 2, 'Admin can remove specific angle image from gallery');

    console.log('\n======================================================');
    console.log(`   Phase 11 Audit Complete: ${passedTests}/${totalTests} Tests Passed`);
    console.log('======================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 11 Audit encountered error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase11Audit();
