import mongoose from 'mongoose';

const AIModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a model name'],
    trim: true,
    maxlength: [50, 'Model name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  baseModel: {
    type: String,
    required: [true, 'Please specify the base model'],
    enum: ['gpt', 'gemini', 'mistral', 'llama', 'custom'],
    default: 'gpt'
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  status: {
    type: String,
    enum: ['pending', 'training', 'ready', 'failed'],
    default: 'pending'
  },
  trainingError: {
    type: String
  },
  trainingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  trainingStartedAt: {
    type: Date
  },
  trainingCompletedAt: {
    type: Date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  modelData: {
    type: Object
  },
  metadata: {
    type: Object
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
AIModelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const AIModel = mongoose.model('AIModel', AIModelSchema);

export default AIModel; 