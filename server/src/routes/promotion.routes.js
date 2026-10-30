import express from 'express';
import { getActivePromotions } from '../controllers/promotion.controller.js';

const router = express.Router();

// Public: Retrieve active, non-expired promotional banners
router.get('/active', getActivePromotions);

export default router;
