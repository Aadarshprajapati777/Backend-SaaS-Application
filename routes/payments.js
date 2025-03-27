import express from 'express';
import {
  getPlans,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
  getPaymentHistory,
  updatePaymentMethod
} from '../controllers/payments.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Payment routes
router.get('/plans', getPlans);
router.get('/subscription', getCurrentSubscription);
router.post('/subscribe', subscribe);
router.post('/cancel', cancelSubscription);
router.get('/history', getPaymentHistory);
router.put('/method', updatePaymentMethod);

export default router; 