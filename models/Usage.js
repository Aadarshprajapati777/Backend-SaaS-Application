import mongoose from 'mongoose';

const UsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  type: {
    type: String,
    enum: ['document_upload', 'model_training', 'chat', 'api_call'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceModel'
  },
  resourceModel: {
    type: String,
    enum: ['Document', 'AIModel', 'Chat'],
    required: function() {
      return this.resourceId !== undefined;
    }
  },
  requestSize: {
    type: Number, // Size in bytes or tokens
    default: 0
  },
  responseSize: {
    type: Number, // Size in bytes or tokens
    default: 0
  },
  totalTokens: {
    type: Number,
    default: 0
  },
  computeTimeMs: {
    type: Number,
    default: 0
  },
  storageUsed: {
    type: Number, // Size in bytes
    default: 0
  },
  endpoint: {
    type: String
  },
  status: {
    type: Number // HTTP status code
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: Object
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient querying
UsageSchema.index({ user: 1, timestamp: -1 });
UsageSchema.index({ team: 1, timestamp: -1 });
UsageSchema.index({ type: 1, timestamp: -1 });

const Usage = mongoose.model('Usage', UsageSchema);

export default Usage; 