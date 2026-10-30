import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getCategories,
  addProductReview,
  subscribeNewsletter
} from '../controllers/product.controller.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:slug', getProductBySlug);
router.post('/:id/reviews', apiLimiter, addProductReview);

export default router;
