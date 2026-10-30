import express from 'express';
import { requireCustomerAuth } from '../middleware/auth.js';
import {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
  getCustomerOrders,
  cancelCustomerOrder,
  reorderCustomerOrder,
  getCustomerWishlist,
  addToWishlist,
  removeFromWishlist,
  getCustomerNewsletterPreferences,
  updateCustomerNewsletterPreferences
} from '../controllers/customer.controller.js';

const router = express.Router();

// All customer routes require customer JWT authentication
router.use(requireCustomerAuth);

// Addresses
router.get('/addresses', getCustomerAddresses);
router.post('/addresses', addCustomerAddress);
router.put('/addresses/:id', updateCustomerAddress);
router.delete('/addresses/:id', deleteCustomerAddress);
router.patch('/addresses/:id/default', setDefaultAddress);

// Order history, self-service cancellation & reorder
router.get('/orders', getCustomerOrders);
router.post('/orders/:id/cancel', cancelCustomerOrder);
router.post('/orders/:id/reorder', reorderCustomerOrder);

// Wishlist
router.get('/wishlist', getCustomerWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Newsletter Preferences
router.get('/newsletter-preferences', getCustomerNewsletterPreferences);
router.patch('/newsletter-preferences', updateCustomerNewsletterPreferences);

export default router;

