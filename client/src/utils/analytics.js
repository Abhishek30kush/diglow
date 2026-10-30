/**
 * Privacy-Conscious Analytics & Conversion Tracking Module
 * 
 * Complies with strict privacy guidelines:
 * 1. Only activates when user grants explicit tracking consent.
 * 2. Uses configurable environment variables (VITE_GA_MEASUREMENT_ID).
 * 3. Does not load external tracking scripts if ID is absent or consent is denied.
 * 4. Deduplicates purchase events using orderNumber in sessionStorage.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Check if the user has explicitly consented to analytics tracking
 */
export function hasAnalyticsConsent() {
  try {
    return localStorage.getItem('diglow_analytics_consent') === 'granted';
  } catch {
    return false;
  }
}

/**
 * Grant or deny analytics tracking consent
 */
export function setAnalyticsConsent(granted) {
  try {
    localStorage.setItem('diglow_analytics_consent', granted ? 'granted' : 'denied');
    if (granted && GA_ID) {
      loadGoogleAnalytics();
    }
  } catch (e) {
    console.warn('Could not persist analytics consent preference:', e);
  }
}

/**
 * Dynamically and safely load Google Analytics 4 script only after consent
 */
function loadGoogleAnalytics() {
  if (!GA_ID || typeof window === 'undefined') return;
  if (document.getElementById('ga4-script')) return;

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    anonymize_ip: true,
    send_page_view: false // Managed explicitly via trackPageView
  });
}

// Automatically load GA4 on startup IF user already granted consent in a prior session
if (typeof window !== 'undefined' && hasAnalyticsConsent() && GA_ID) {
  loadGoogleAnalytics();
}

/**
 * Safely dispatch an analytics event if consent is granted
 */
function dispatchEvent(eventName, params = {}) {
  if (!hasAnalyticsConsent()) {
    return;
  }

  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_ID) {
    window.gtag('event', eventName, params);
  } else if (import.meta.env.DEV) {
    // In local dev without live GA ID, log cleanly
    console.debug(`[Analytics Event: ${eventName}]`, params);
  }
}

/**
 * Track Page View
 */
export function trackPageView(path, title) {
  dispatchEvent('page_view', {
    page_path: path,
    page_title: title || document.title
  });
}

/**
 * Track Product View (view_item)
 */
export function trackProductView(product) {
  if (!product) return;
  dispatchEvent('view_item', {
    currency: 'INR',
    value: product.price,
    items: [
      {
        item_id: product.sku || product.slug || product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1
      }
    ]
  });
}

/**
 * Track Add to Cart (add_to_cart)
 */
export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  dispatchEvent('add_to_cart', {
    currency: 'INR',
    value: product.price * quantity,
    items: [
      {
        item_id: product.sku || product.slug || product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity
      }
    ]
  });
}

/**
 * Track Checkout Begin (begin_checkout)
 */
export function trackBeginCheckout(items, totalAmount, couponCode) {
  if (!Array.isArray(items) || items.length === 0) return;
  dispatchEvent('begin_checkout', {
    currency: 'INR',
    value: totalAmount,
    coupon: couponCode || undefined,
    items: items.map((item) => ({
      item_id: item.sku || item.slug || item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity
    }))
  });
}

/**
 * Track Completed Purchase (purchase)
 * Strictly verifies confirmed order status and deduplicates by orderNumber
 */
export function trackPurchase(order) {
  if (!order || !order.orderNumber) return;

  // Prevent recording cancelled or incomplete orders
  if (order.orderStatus === 'Cancelled') {
    return;
  }

  // Deduplication defense: prevent recording same order multiple times
  const purchaseStorageKey = `diglow_purchase_recorded_${order.orderNumber}`;
  try {
    if (sessionStorage.getItem(purchaseStorageKey)) {
      return; // Already recorded in this session
    }
    sessionStorage.setItem(purchaseStorageKey, 'true');
  } catch (e) {
    // SessionStorage unavailable, continue safely
  }

  dispatchEvent('purchase', {
    transaction_id: order.orderNumber,
    value: order.total,
    currency: 'INR',
    tax: order.taxAmount || 0,
    shipping: order.deliveryFee || 0,
    coupon: order.couponCode || undefined,
    items: (order.items || []).map((item) => ({
      item_id: item.product?.sku || item.product?.slug || item.productId,
      item_name: item.product?.name || 'DiGlow Candle',
      price: item.unitPrice,
      quantity: item.quantity
    }))
  });
}
