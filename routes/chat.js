import express from 'express';
import {
  getChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
  sendMessage
} from '../controllers/chat.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Chat routes
router.route('/')
  .get(getChats)
  .post(createChat);

router.route('/:id')
  .get(getChat)
  .put(updateChat)
  .delete(deleteChat);

// Chat messages route
router.post('/:id/messages', sendMessage);

export default router; 