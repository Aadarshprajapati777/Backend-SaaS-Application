import AIModel from '../models/AIModel.js';
import Document from '../models/Document.js';
import Usage from '../models/Usage.js';
import createError from '../utils/errorResponse.js';

/**
 * Simulates training an AI model
 * This would be replaced with a real AI training process
 * @param {Object} model - AI model to train
 * @param {Array} documents - Documents to train on
 * @returns {Promise<Object>} Updated model
 */
const simulateModelTraining = async (model, documents) => {
  // Update model to training status
  model.status = 'training';
  model.trainingStartedAt = Date.now();
  model.trainingProgress = 0;
  await model.save();

  // Simulate background processing over time
  const totalTime = 10000; // 10 seconds for simulation
  const steps = 5;
  const stepTime = totalTime / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepTime));
    model.trainingProgress = Math.floor((i / steps) * 100);
    await model.save();
  }

  // Complete training
  model.status = 'ready';
  model.trainingCompletedAt = Date.now();
  model.trainingProgress = 100;
  await model.save();

  return model;
};

/**
 * @desc    Get all models
 * @route   GET /api/models
 * @access  Private
 */
export const getModels = async (req, res, next) => {
  try {
    // Base query - get models for current user
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

    const models = await AIModel.find(query).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: models.length,
      data: models
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single model
 * @route   GET /api/models/:id
 * @access  Private
 */
export const getModel = async (req, res, next) => {
  try {
    const model = await AIModel.findById(req.params.id);

    if (!model) {
      return next(createError(`Model not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the model or is in the team
    if (
      model.user.toString() !== req.user.id && 
      (!req.user.teamId || model.team?.toString() !== req.user.teamId.toString())
    ) {
      return next(createError('Not authorized to access this model', 403));
    }

    res.status(200).json({
      success: true,
      data: model
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new model
 * @route   POST /api/models
 * @access  Private
 */
export const createModel = async (req, res, next) => {
  try {
    const { name, description, baseModel, documentIds } = req.body;

    if (!name || !baseModel) {
      return next(createError('Please provide model name and base model', 400));
    }

    // Validate documents
    let documents = [];
    if (documentIds && documentIds.length > 0) {
      documents = await Document.find({ 
        _id: { $in: documentIds },
        user: req.user.id
      });

      if (documents.length !== documentIds.length) {
        return next(createError('One or more documents not found or not owned by user', 400));
      }
    }

    // Create model
    const model = await AIModel.create({
      name,
      description,
      baseModel,
      documents: documents.map(doc => doc._id),
      user: req.user.id,
      team: req.user.teamId
    });

    // Track usage
    await Usage.create({
      user: req.user.id,
      team: req.user.teamId,
      type: 'model_training',
      resourceId: model._id,
      resourceModel: 'AIModel',
      endpoint: req.originalUrl,
      status: 201,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: model
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Start model training
 * @route   POST /api/models/:id/train
 * @access  Private
 */
export const trainModel = async (req, res, next) => {
  try {
    const model = await AIModel.findById(req.params.id);

    if (!model) {
      return next(createError(`Model not found with id of ${req.params.id}`, 404));
    }

    // Check if model is already training or ready
    if (model.status === 'training') {
      return next(createError('Model is already training', 400));
    }

    // Make sure user owns the model
    if (model.user.toString() !== req.user.id) {
      return next(createError('Not authorized to train this model', 403));
    }

    // Get documents
    const documents = await Document.find({
      _id: { $in: model.documents }
    });

    if (documents.length === 0) {
      return next(createError('No documents available for training', 400));
    }

    // Start training (would actually be done in a background job)
    // For demo, we'll simulate async training
    setTimeout(() => {
      simulateModelTraining(model, documents).catch(console.error);
    }, 0);

    // Return the model with updated status
    model.status = 'training';
    model.trainingStartedAt = Date.now();
    model.trainingProgress = 0;
    await model.save();

    res.status(200).json({
      success: true,
      data: model
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete model
 * @route   DELETE /api/models/:id
 * @access  Private
 */
export const deleteModel = async (req, res, next) => {
  try {
    const model = await AIModel.findById(req.params.id);

    if (!model) {
      return next(createError(`Model not found with id of ${req.params.id}`, 404));
    }

    // Make sure user owns the model
    if (model.user.toString() !== req.user.id) {
      return next(createError('Not authorized to delete this model', 403));
    }

    await model.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 