import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  generateApiKey 
} from '../controllers/auth.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

// Protected routes - require authentication
router.get('/me', protect, getMe);
router.post('/api-key', protect, generateApiKey);

export default router; 