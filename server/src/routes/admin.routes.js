import express from 'express';
import {
  getDashboardStats,
  getAdminProducts,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getInventoryLogs,
  uploadProductImage,
  getAdminOrders,
  getAdminOrderById,
  getOrderInvoiceData,
  updateOrderStatus,
  verifyAndDeliverOrder,
  getDeliveryStaffList,
  assignOrderDelivery,
  getAssignedDeliveryOrders,
  recordFailedDeliveryAttempt,
  processOrderReturnController,
  getSalesSummary,
  exportOrdersCsv,
  exportSalesCsv,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  adjustVariantStock,
  updateProductGallery,
  removeProductGalleryImage,
  getAdminAbandonedCarts,
  triggerAbandonedCartRecovery,
  collectCodPayment,
  recordManualRefund
} from '../controllers/admin.controller.js';
import {
  getAdminPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
} from '../controllers/promotion.controller.js';
import { requireAdminAuth, requireRoles } from '../middleware/auth.js';
import { uploadSingleImage } from '../middleware/upload.js';

const router = express.Router();

// Strict server-side RBAC: All admin endpoints require verified JWT (ADMIN, STAFF, or DELIVERY)
router.use(requireAdminAuth);

// Analytics & Reports (Admin / Staff)
router.get('/stats', requireRoles('ADMIN', 'STAFF'), getDashboardStats);
router.get('/sales-summary', requireRoles('ADMIN', 'STAFF'), getSalesSummary);
router.get('/orders/export/csv', requireRoles('ADMIN', 'STAFF'), exportOrdersCsv);
router.get('/sales/export/csv', requireRoles('ADMIN', 'STAFF'), exportSalesCsv);

// Product Catalog & Image Upload (Admin / Staff)
router.get('/products', requireRoles('ADMIN', 'STAFF'), getAdminProducts);
router.post('/products', requireRoles('ADMIN', 'STAFF'), createProduct);
router.put('/products/:id', requireRoles('ADMIN', 'STAFF'), updateProduct);
router.patch('/products/:id/stock', requireRoles('ADMIN', 'STAFF'), updateStock);
router.delete('/products/:id', requireRoles('ADMIN'), deleteProduct);
router.post('/upload', requireRoles('ADMIN', 'STAFF'), uploadSingleImage, uploadProductImage);

// Product Variants Management (Phase 11)
router.post('/products/:productId/variants', requireRoles('ADMIN', 'STAFF'), createProductVariant);
router.put('/variants/:id', requireRoles('ADMIN', 'STAFF'), updateProductVariant);
router.delete('/variants/:id', requireRoles('ADMIN', 'STAFF'), deleteProductVariant);
router.patch('/variants/:id/stock', requireRoles('ADMIN', 'STAFF'), adjustVariantStock);

// Product Gallery Management (Phase 11)
router.patch('/products/:id/gallery', requireRoles('ADMIN', 'STAFF'), updateProductGallery);
router.delete('/products/:id/gallery', requireRoles('ADMIN', 'STAFF'), removeProductGalleryImage);

// Inventory Movement Logs
router.get('/inventory-logs', requireRoles('ADMIN', 'STAFF'), getInventoryLogs);

// Orders & Invoices (Admin, Staff, Delivery Rider)
router.get('/orders', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), getAdminOrders);
router.get('/orders/:id', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), getAdminOrderById);
router.get('/orders/:id/invoice', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), getOrderInvoiceData);
router.patch('/orders/:id/status', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), updateOrderStatus);
router.post('/orders/:id/verify-delivery', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), verifyAndDeliverOrder);
router.post('/orders/:id/collect-cod', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), collectCodPayment);
router.post('/orders/:id/record-refund', requireRoles('ADMIN', 'STAFF'), recordManualRefund);

// Fulfilment & Delivery Management
router.get('/staff/delivery', requireRoles('ADMIN', 'STAFF'), getDeliveryStaffList);
router.get('/delivery/assigned', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), getAssignedDeliveryOrders);
router.patch('/orders/:id/assign', requireRoles('ADMIN', 'STAFF'), assignOrderDelivery);
router.post('/orders/:id/failed-delivery', requireRoles('ADMIN', 'STAFF', 'DELIVERY'), recordFailedDeliveryAttempt);
router.post('/orders/:id/return', requireRoles('ADMIN', 'STAFF'), processOrderReturnController);

// Coupons Management
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Promotional Campaign Banners
router.get('/promotions', getAdminPromotions);
router.post('/promotions', createPromotion);
router.put('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);

// Abandoned Cart Recovery & Analytics (Phase 13)
router.get('/abandoned-carts', requireRoles('ADMIN', 'STAFF'), getAdminAbandonedCarts);
router.post('/abandoned-carts/process', requireRoles('ADMIN', 'STAFF'), triggerAbandonedCartRecovery);

export default router;
