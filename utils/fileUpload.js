import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import createError from './errorResponse.js';

// Get directory name (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures upload directory exists
 * @returns {string} Path to upload directory
 */
const createUploadDir = () => {
  const uploadDir = process.env.FILE_UPLOAD_PATH || './uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = createUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: function (req, file, cb) {
    // Accept only PDF files for now
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(createError('Only PDF files are allowed', 400), false);
    }
  }
});

/**
 * Deletes a file at the specified path
 * @param {string} filePath - Path to file
 * @returns {boolean} Success status
 */
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

export { upload, deleteFile }; 