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
// Add logging for registration requests
router.post('/register', (req, res, next) => {
  console.log('Registration request received:', {
    userType: req.body.userType,
    email: req.body.email,
    businessData: req.body.userType === 'business' ? {
      businessName: req.body.businessName,
      businessSize: req.body.businessSize
    } : null
  });
  next();
}, register);

router.post('/login', login);
router.post('/logout', logout);

// Protected routes - require authentication
router.get('/me', protect, getMe);
router.post('/api-key', protect, generateApiKey);

export default router; 