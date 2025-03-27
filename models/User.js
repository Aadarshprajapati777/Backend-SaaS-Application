import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  userType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },
  // Business user fields
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot be more than 100 characters']
  },
  businessSize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+', 'small', 'medium', 'large'],
  },
  industry: {
    type: String,
    enum: [
      'technology', 'finance', 'healthcare', 'education', 
      'retail', 'manufacturing', 'consulting', 'media', 
      'legal', 'nonprofit', 'other'
    ],
  },
  website: {
    type: String,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please add a valid URL'
    ]
  },
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise', 'free'],
    default: 'free'
  },
  teamSize: {
    type: String,
    enum: ['1-5', '6-15', '16-30', '31+']
  },
  apiAccess: {
    type: Boolean,
    default: false
  },
  // End business user fields
  role: {
    type: String,
    enum: ['user', 'admin', 'owner'],
    default: 'user'
  },
  usageLimit: {
    type: Number,
    default: 100 // Default usage limit for free users
  },
  currentUsage: {
    type: Number,
    default: 0
  },
  isTeamMember: {
    type: Boolean,
    default: false
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  parentBusinessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  apiKey: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Business usage tracking
  documentsUploaded: {
    type: Number,
    default: 0
  },
  modelsCreated: {
    type: Number,
    default: 0
  },
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, userType: this.userType, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.generateApiKey = function() {
  // Generate API key
  const apiKey = jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    {
      expiresIn: '1y'
    }
  );

  this.apiKey = apiKey;
  return apiKey;
};

// Set plan-based usage limits
UserSchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    // Set usage limits based on plan
    switch (this.plan) {
      case 'free':
        this.usageLimit = 100;
        break;
      case 'starter':
        this.usageLimit = 1000;
        break;
      case 'professional':
        this.usageLimit = 5000;
        break;
      case 'enterprise':
        this.usageLimit = 100000;
        break;
      default:
        this.usageLimit = 100;
    }
  }
  next();
});

const User = mongoose.model('User', UserSchema);

export default User; 