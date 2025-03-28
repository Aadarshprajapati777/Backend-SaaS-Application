import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configure environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-document-chat-saas')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define CompanyContext Schema
const CompanyContextSchema = new mongoose.Schema({
  company_id: String,
  context: String,
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const CompanyContext = mongoose.model('CompanyContext', CompanyContextSchema);

// Create a new context for the company
async function createContext() {
  try {
    // Find if there's already a CompanyContext for this company
    const existingContext = await CompanyContext.findOne({ company_id: 'company-abc123' });
    
    if (existingContext) {
      console.log('Found existing context, updating isActive to true');
      existingContext.isActive = true;
      await existingContext.save();
      console.log('Context updated successfully');
    } else {
      // Create a new context
      const newContext = new CompanyContext({
        company_id: 'company-abc123',
        context: 'This is a test document context for Test Company. The company provides AI-powered customer support solutions.',
        version: 1,
        isActive: true
      });
      
      await newContext.save();
      console.log('New context created successfully');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

createContext(); 