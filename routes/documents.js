import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument
} from '../controllers/documents.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Document routes
router.route('/')
  .get(getDocuments)
  .post(uploadDocument);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

export default router; 