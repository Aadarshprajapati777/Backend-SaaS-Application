import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokenCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Object
  }
});

const ChatSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
    default: 'New Chat'
  },
  aiModel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIModel',
    required: true
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
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  language: {
    type: String,
    enum: ['english', 'hindi', 'arabic', 'nepali', 'spanish', 'french', 'chinese'],
    default: 'english'
  },
  messages: [MessageSchema],
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp and calculate total tokens before saving
ChatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total tokens
  if (this.isModified('messages')) {
    this.totalTokensUsed = this.messages.reduce((total, message) => {
      return total + (message.tokenCount || 0);
    }, 0);
  }
  
  next();
});

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat; 