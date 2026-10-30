import express from 'express';
import {
  adminLogin,
  getAdminProfile,
  customerRegister,
  customerLogin,
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  requestPasswordReset
} from '../controllers/auth.controller.js';
import { requireAdminAuth, requireCustomerAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Customer Authentication
router.post('/register', authLimiter, customerRegister);
router.post('/login', authLimiter, customerLogin);
router.get('/me', requireCustomerAuth, getCustomerProfile);
router.put('/profile', requireCustomerAuth, updateCustomerProfile);
router.put('/password', requireCustomerAuth, changeCustomerPassword);
router.post('/forgot-password', authLimiter, requestPasswordReset);

// Admin Authentication
router.post('/admin/login', authLimiter, adminLogin);
router.get('/admin/me', requireAdminAuth, getAdminProfile);

export default router;
