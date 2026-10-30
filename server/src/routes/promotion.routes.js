import express from 'express';
import { getActivePromotions, getPublicOffers } from '../controllers/promotion.controller.js';

const router = express.Router();

// Public: Retrieve active, non-expired promotional banners
router.get('/active', getActivePromotions);

// Public: Retrieve comprehensive festive offers, coupons & festive specials
router.get('/offers', getPublicOffers);

export default router;
