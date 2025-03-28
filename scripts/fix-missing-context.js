/**
 * Fix Missing Context Script
 * 
 * This script fixes the issue when a company exists but has no corresponding context
 * in the CompanyContext collection.
 * 
 * Usage: 
 * node scripts/fix-missing-context.js <companyId>
 * 
 * Example:
 * node scripts/fix-missing-context.js company-sgf9a8
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define schemas
const CompanySchema = new mongoose.Schema({
  companyId: String,
  name: String,
  documentName: String,
  documentContext: String,
  trainingStatus: String,
  chatbotUrl: String,
  createdAt: Date,
  updatedAt: Date
});

const CompanyContextSchema = new mongoose.Schema({
  company_id: String,
  context: String,
  version: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
});

// Create models
const Company = mongoose.model('Company', CompanySchema);
const CompanyContext = mongoose.model('CompanyContext', CompanyContextSchema);

// Get company ID from command line argument
const companyId = process.argv[2];

if (!companyId) {
  console.error('Please provide a company ID as command line argument');
  console.log('Usage: node scripts/fix-missing-context.js <companyId>');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-document-chat-saas')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Fix the missing context
async function fixMissingContext() {
  try {
    console.log(`Attempting to fix context for company: ${companyId}`);
    
    // Check if company exists
    const company = await Company.findOne({ companyId });
    
    if (!company) {
      console.error(`Company with ID ${companyId} not found`);
      process.exit(1);
    }
    
    console.log(`Found company: ${company.name}`);
    
    // Check if company has document context
    if (!company.documentContext) {
      console.error(`Company ${companyId} has no documentContext to use`);
      process.exit(1);
    }
    
    console.log(`Company has documentContext of length: ${company.documentContext.length}`);
    
    // Check if context already exists
    const existingContext = await CompanyContext.findOne({ company_id: companyId });
    
    if (existingContext) {
      console.log(`Context already exists for company ${companyId}, version: ${existingContext.version}`);
      console.log('Ensuring it is marked as active...');
      
      if (!existingContext.isActive) {
        existingContext.isActive = true;
        await existingContext.save();
        console.log('Context marked as active');
      } else {
        console.log('Context is already active');
      }
    } else {
      // Create new context
      console.log('Creating new context record...');
      
      const newContext = new CompanyContext({
        company_id: companyId,
        context: company.documentContext,
        version: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newContext.save();
      console.log('New context created successfully');
    }
    
    console.log('\nContext repair complete!');
    console.log('\nYou can now test the context API with:');
    console.log(`curl http://localhost:5000/api/companies/${companyId}/context`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the function
fixMissingContext(); 