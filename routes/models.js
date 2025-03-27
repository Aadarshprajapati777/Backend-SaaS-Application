import express from 'express';
import {
  getModels,
  getModel,
  createModel,
  trainModel,
  deleteModel
} from '../controllers/models.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Model routes
router.route('/')
  .get(getModels)
  .post(createModel);

router.route('/:id')
  .get(getModel)
  .delete(deleteModel);

router.route('/:id/train')
  .post(trainModel);

export default router; 