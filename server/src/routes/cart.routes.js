import express from 'express';
import {
  syncCartHandler,
  getCartHandler,
  recoverCartHandler
} from '../controllers/cart.controller.js';
import { optionalCustomerAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Synchronize cart state (accepts optional Bearer token to connect customer profile)
router.post('/sync', apiLimiter, optionalCustomerAuth, syncCartHandler);

// Retrieve current cart by session token
router.get('/', apiLimiter, getCartHandler);

// Restore cart from recovery email link
router.get('/recover/:token', apiLimiter, recoverCartHandler);

export default router;
