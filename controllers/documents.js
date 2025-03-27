import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import createError from '../utils/errorResponse.js';
import { upload, deleteFile } from '../utils/fileUpload.js';
import Usage from '../models/Usage.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup multer upload middleware
const documentUpload = upload.single('document');

/**
 * @desc    Upload document
 * @route   POST /api/documents
 * @access  Private
 */
export const uploadDocument = async (req, res, next) => {
  documentUpload(req, res, async (err) => {
    try {
      if (err) {
        return next(createError(err.message, 400));
      }

      if (!req.file) {
        return next(createError('Please upload a document', 400));
      }

      const { title, description } = req.body;

      if (!title) {
        // Remove uploaded file if title is missing
        deleteFile(req.file.path);
        return next(createError('Please provide a title for the document', 400));
      }

      // Create document
      const document = await Document.create({
        title,
        description,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        user: req.user.id,
        team: req.user.teamId
      });

      // Track usage
      await Usage.create({
        user: req.user.id,
        team: req.user.teamId,
        type: 'document_upload',
        resourceId: document._id,
        resourceModel: 'Document',
        storageUsed: req.file.size,
        endpoint: req.originalUrl,
        status: 201,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: document
      });
    } catch (error) {
      // Remove uploaded file if error occurs
      if (req.file) {
        deleteFile(req.file.path);
      }
      next(error);
    }
  });
};

/**
 * @desc    Get all documents
 * @route   GET /api/documents
 * @access  Private
 */
export const getDocuments = async (req, res, next) => {
  try {
    // Base query - get documents for current user
    let query = {
      user: req.user.id
    };

    // Add team filter if user is a team member
    if (req.user.isTeamMember && req.user.teamId) {
      query = {
        $or: [
          { user: req.user.id },
          { team: req.user.teamId }
        ]
      };
    }

    const documents = await Document.find(query).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single document
 * @route   GET /api/documents/:id
 * @access  Private
 */
export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return next(createError(`Document not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the document or is in the team
    if (
      document.user.toString() !== req.user.id && 
      (!req.user.teamId || document.team?.toString() !== req.user.teamId.toString())
    ) {
      return next(createError('Not authorized to access this document', 403));
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update document
 * @route   PUT /api/documents/:id
 * @access  Private
 */
export const updateDocument = async (req, res, next) => {
  try {
    const { title, description, isPublic } = req.body;
    
    let document = await Document.findById(req.params.id);

    if (!document) {
      return next(createError(`Document not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the document
    if (document.user.toString() !== req.user.id) {
      return next(createError('Not authorized to update this document', 403));
    }

    // Update document
    document = await Document.findByIdAndUpdate(
      req.params.id, 
      { title, description, isPublic },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return next(createError(`Document not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the document
    if (document.user.toString() !== req.user.id) {
      return next(createError('Not authorized to delete this document', 403));
    }

    // Delete file from storage
    deleteFile(document.filePath);

    // Delete document from database
    await document.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 