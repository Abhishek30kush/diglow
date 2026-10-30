// In production, VITE_API_BASE_URL can point to external backend (e.g. https://api.diglow.com/api)
// When omitted or in local dev, it defaults to '/api' which proxies to localhost:5000
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '/api';

/**
 * Universal API request wrapper
 */
export async function apiRequest(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Check for admin token or customer token
  const storedAdminToken = localStorage.getItem('diglow_admin_token');
  const storedCustomerToken = localStorage.getItem('diglow_customer_token');
  const activeToken = token || storedAdminToken || storedCustomerToken;

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${BASE_URL}${formattedEndpoint}`, config);

  // If response is CSV file download
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.text();
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.statusText}`);
  }

  return data;
}

export const api = {
  // Public Products
  getProducts: (params = '') => apiRequest(`/products${params}`),
  getProductBySlug: (slug) => apiRequest(`/products/${slug}`),
  getCategories: () => apiRequest('/products/categories'),
  addProductReview: (id, reviewData) =>
    apiRequest(`/products/${id}/reviews`, { method: 'POST', body: reviewData }),
  subscribeNewsletter: (email, hasConsent = true, source = 'storefront') =>
    apiRequest('/newsletter', { method: 'POST', body: { email, hasConsent, source } }),

  // Public Orders
  checkout: (orderData) => apiRequest('/orders/checkout', { method: 'POST', body: orderData }),
  trackOrder: (orderNumber, phone) =>
    apiRequest('/orders/track', { method: 'POST', body: { orderNumber, phone } }),
  validateCoupon: (code, subtotal) =>
    apiRequest('/orders/validate-coupon', { method: 'POST', body: { code, subtotal } }),

  // Payments (Razorpay)
  getPaymentConfig: () => apiRequest('/payments/config'),
  createRazorpayOrder: (orderId) =>
    apiRequest('/payments/razorpay/create-order', { method: 'POST', body: { orderId } }),
  verifyRazorpayPayment: (verificationData) =>
    apiRequest('/payments/razorpay/verify', { method: 'POST', body: verificationData }),

  // Customer Auth
  customerRegister: (userData) =>
    apiRequest('/auth/register', { method: 'POST', body: userData }),
  customerLogin: (credentials) =>
    apiRequest('/auth/login', { method: 'POST', body: credentials }),
  getCustomerProfile: () => apiRequest('/auth/me'),
  updateCustomerProfile: (data) =>
    apiRequest('/auth/profile', { method: 'PUT', body: data }),
  changeCustomerPassword: (data) =>
    apiRequest('/auth/password', { method: 'PUT', body: data }),
  requestPasswordReset: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),

  // Customer Portal & Wishlist
  getCustomerAddresses: () => apiRequest('/customer/addresses'),
  addCustomerAddress: (address) =>
    apiRequest('/customer/addresses', { method: 'POST', body: address }),
  updateCustomerAddress: (id, address) =>
    apiRequest(`/customer/addresses/${id}`, { method: 'PUT', body: address }),
  deleteCustomerAddress: (id) =>
    apiRequest(`/customer/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id) =>
    apiRequest(`/customer/addresses/${id}/default`, { method: 'PATCH' }),
  getCustomerOrders: () => apiRequest('/customer/orders'),
  cancelCustomerOrder: (orderId, reason) =>
    apiRequest(`/customer/orders/${orderId}/cancel`, { method: 'POST', body: { reason } }),
  reorderCustomerOrder: (orderId) =>
    apiRequest(`/customer/orders/${orderId}/reorder`, { method: 'POST' }),
  getCustomerWishlist: () => apiRequest('/customer/wishlist'),
  addToWishlist: (productId) =>
    apiRequest('/customer/wishlist', { method: 'POST', body: { productId } }),
  removeFromWishlist: (productId) =>
    apiRequest(`/customer/wishlist/${productId}`, { method: 'DELETE' }),
  getCustomerNewsletterPreferences: () =>
    apiRequest('/customer/newsletter-preferences'),
  updateCustomerNewsletterPreferences: (subscribed) =>
    apiRequest('/customer/newsletter-preferences', { method: 'PATCH', body: { subscribed } }),


  // Admin Auth
  adminLogin: (credentials) =>
    apiRequest('/auth/admin/login', { method: 'POST', body: credentials }),
  getAdminProfile: () => apiRequest('/auth/admin/me'),

  // Admin Dashboard & Reports
  getDashboardStats: (params = '') => apiRequest(`/admin/stats${params}`),
  getSalesSummary: () => apiRequest('/admin/sales-summary'),
  exportOrdersCsv: (params = '') => apiRequest(`/admin/orders/export/csv${params}`),
  exportSalesCsv: () => apiRequest('/admin/sales/export/csv'),

  // Admin Product Management & Upload
  getAdminProducts: (params = '') => apiRequest(`/admin/products${params}`),
  createProduct: (data) => apiRequest('/admin/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => apiRequest(`/admin/products/${id}`, { method: 'PUT', body: data }),
  updateStock: (id, stock, reason) =>
    apiRequest(`/admin/products/${id}/stock`, { method: 'PATCH', body: { stock, reason } }),
  deleteProduct: (id) => apiRequest(`/admin/products/${id}`, { method: 'DELETE' }),
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('diglow_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${BASE_URL}/admin/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Image upload failed');
    return data;
  },

  // Admin Product Variants & Gallery (Phase 11)
  createProductVariant: (productId, data) =>
    apiRequest(`/admin/products/${productId}/variants`, { method: 'POST', body: data }),
  updateProductVariant: (variantId, data) =>
    apiRequest(`/admin/variants/${variantId}`, { method: 'PUT', body: data }),
  deleteProductVariant: (variantId) =>
    apiRequest(`/admin/variants/${variantId}`, { method: 'DELETE' }),
  adjustVariantStock: (variantId, stock, reason) =>
    apiRequest(`/admin/variants/${variantId}/stock`, { method: 'PATCH', body: { stock, reason } }),
  updateProductGallery: (productId, gallery) =>
    apiRequest(`/admin/products/${productId}/gallery`, { method: 'PATCH', body: { gallery } }),
  removeProductGalleryImage: (productId, imageUrl) =>
    apiRequest(`/admin/products/${productId}/gallery`, { method: 'DELETE', body: { imageUrl } }),

  // Admin Inventory Movement Logs
  getInventoryLogs: (params = '') => apiRequest(`/admin/inventory-logs${params}`),

  // Admin Order Management & Fulfilment
  getAdminOrders: (params = '') => apiRequest(`/admin/orders${params}`),
  getAdminOrderById: (id) => apiRequest(`/admin/orders/${id}`),
  getOrderInvoice: (id) => apiRequest(`/admin/orders/${id}/invoice`),
  updateOrderStatus: (id, data) =>
    apiRequest(`/admin/orders/${id}/status`, { method: 'PATCH', body: data }),
  verifyDeliveryPin: (id, pin) =>
    apiRequest(`/admin/orders/${id}/verify-delivery`, { method: 'POST', body: { pin } }),
  getDeliveryStaffList: () => apiRequest('/admin/staff/delivery'),
  assignOrderDelivery: (id, data) =>
    apiRequest(`/admin/orders/${id}/assign`, { method: 'PATCH', body: data }),
  getAssignedDeliveryOrders: (params = '') =>
    apiRequest(`/admin/delivery/assigned${params}`),
  recordFailedDelivery: (id, reason) =>
    apiRequest(`/admin/orders/${id}/failed-delivery`, { method: 'POST', body: { reason } }),
  processOrderReturn: (id, data) =>
    apiRequest(`/admin/orders/${id}/return`, { method: 'POST', body: data }),

  // Admin Coupons & Promotions Management
  getCoupons: () => apiRequest('/admin/coupons'),
  createCoupon: (data) => apiRequest('/admin/coupons', { method: 'POST', body: data }),
  updateCoupon: (id, data) => apiRequest(`/admin/coupons/${id}`, { method: 'PUT', body: data }),
  deleteCoupon: (id) => apiRequest(`/admin/coupons/${id}`, { method: 'DELETE' }),

  // Promotions & Seasonal Campaign Banners (Phase 7)
  getActivePromotions: () => apiRequest('/promotions/active'),
  getAdminPromotions: () => apiRequest('/admin/promotions'),
  createPromotion: (data) => apiRequest('/admin/promotions', { method: 'POST', body: data }),
  updatePromotion: (id, data) => apiRequest(`/admin/promotions/${id}`, { method: 'PUT', body: data }),
  deletePromotion: (id) => apiRequest(`/admin/promotions/${id}`, { method: 'DELETE' }),

  // Newsletter Unsubscribe (Phase 7)
  unsubscribeNewsletter: (email) =>
    apiRequest('/newsletter/unsubscribe', { method: 'POST', body: { email } }),

  // Cart Synchronization & Abandoned Cart Recovery (Phase 13)
  syncCart: (cartData) =>
    apiRequest('/cart/sync', { method: 'POST', body: cartData }),
  getCart: (sessionToken) =>
    apiRequest(`/cart?sessionToken=${encodeURIComponent(sessionToken)}`),
  recoverCart: (token) =>
    apiRequest(`/cart/recover/${encodeURIComponent(token)}`),
  getAdminAbandonedCarts: (params = '') =>
    apiRequest(`/admin/abandoned-carts${params}`),
  triggerAbandonedCartRecovery: (data = {}) =>
    apiRequest('/admin/abandoned-carts/process', { method: 'POST', body: data })
};
