/**
 * Migration Script: Create CompanyContext records for existing companies
 * 
 * This script checks all companies and creates a context record for any
 * that don't have one. It's useful for migrating existing data after
 * adding the CompanyContext collection.
 * 
 * Run with: node scripts/migrateCompanyContexts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Company from '../models/Company.js';
import CompanyContext from '../models/CompanyContext.js';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-document-chat-saas')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const migrateCompanyContexts = async () => {
  try {
    // Get all companies
    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies`);
    
    // Counter for created records
    let created = 0;
    let skipped = 0;
    
    // Process each company
    for (const company of companies) {
      // Check if company already has a context record
      const existingContext = await CompanyContext.findOne({ 
        company_id: company.companyId,
        isActive: true
      });
      
      if (existingContext) {
        console.log(`Company ${company.companyId} already has context (version ${existingContext.version}), skipping...`);
        skipped++;
        continue;
      }
      
      // Create new context record
      if (company.documentContext) {
        await CompanyContext.create({
          company_id: company.companyId,
          context: company.documentContext,
          version: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        created++;
        console.log(`Created context record for company ${company.companyId}`);
      } else {
        console.log(`Company ${company.companyId} has no documentContext, skipping...`);
        skipped++;
      }
    }
    
    console.log(`Migration complete: Created ${created} context records, skipped ${skipped} companies.`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
migrateCompanyContexts(); 