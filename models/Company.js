import mongoose from 'mongoose';

/**
 * Company Schema
 * 
 * Stores information about companies and their associated document context
 */
const CompanySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  documentName: {
    type: String,
    trim: true
  },
  documentContext: {
    type: String,
    required: true
  },
  trainingStatus: {
    type: String,
    enum: ['in_progress', 'completed', 'failed'],
    default: 'completed'
  },
  chatbotUrl: {
    type: String,
    required: true
  },
  logoUrl: {
    type: String,
    default: function() {
      // Generate a default logo URL using the first 2 letters of company name
      const initials = this.name.substring(0, 2).toUpperCase();
      return `https://placehold.co/100x100?text=${initials}`;
    }
  },
  brandColor: {
    type: String,
    default: "#4f46e5"
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

export default mongoose.model('Company', CompanySchema); 