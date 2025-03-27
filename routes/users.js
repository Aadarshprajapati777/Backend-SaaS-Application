import express from 'express';
import { 
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserUsage,
  deleteAccount
} from '../controllers/users.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

router.put('/change-password', changePassword);
router.get('/usage', getUserUsage);
router.delete('/', deleteAccount);

export default router; 