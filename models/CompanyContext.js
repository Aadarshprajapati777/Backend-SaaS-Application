import mongoose from 'mongoose';

/**
 * CompanyContext Schema
 * 
 * Stores the training context returned from Gemini for each company
 */
const CompanyContextSchema = new mongoose.Schema({
  company_id: {
    type: String,
    required: true,
    ref: 'Company',
    index: true
  },
  context: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('CompanyContext', CompanyContextSchema); 