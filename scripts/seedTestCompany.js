import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Company model
import Company from '../models/Company.js';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-document-chat-saas';

// Sample company data for testing
const testCompany = {
  companyId: 'company-abc123',
  name: 'Test Company',
  documentName: 'test-document.pdf',
  documentContext: `
This is a test document for Test Company. 
The company provides AI-powered customer support solutions.
Our products include chatbots, document analysis, and knowledge base management.
Frequently asked questions:
1. How do I set up the chatbot? Answer: You can set up the chatbot by uploading your documentation and generating a unique URL.
2. What file formats are supported? Answer: Currently we support PDF files.
3. How secure is the data? Answer: All data is encrypted and stored securely.
`,
  chatbotUrl: 'http://localhost:5178/support/company-abc123',
  trainingStatus: 'completed',
  brandColor: '#4f46e5'
};

// User-specific company data
const userCompany = {
  companyId: 'company-nxkylw',
  name: 'User Company',
  documentName: 'user-document.pdf',
  documentContext: `
This is the documentation for User Company.
Our company specializes in providing AI-powered solutions for various industries.

Product Features:
- AI Document Analysis
- Chatbot Integration
- Knowledge Base Management
- Customer Support Automation

Frequently Asked Questions:
1. How do I install the software? - You can install it by following the instructions in section 2.
2. What are the system requirements? - We recommend at least 8GB RAM and 50GB of free disk space.
3. How do I contact support? - You can reach our support team at support@usercompany.com
4. Is there a mobile app? - Yes, we have apps for both iOS and Android platforms.
`,
  chatbotUrl: 'http://localhost:5178/support/company-nxkylw',
  trainingStatus: 'completed',
  brandColor: '#0ea5e9'
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    try {
      // Check if test company already exists
      const existingCompany = await Company.findOne({ companyId: testCompany.companyId });
      
      if (existingCompany) {
        console.log(`Test company with ID ${testCompany.companyId} already exists`);
        console.log('Updating existing company data...');
        
        await Company.findOneAndUpdate(
          { companyId: testCompany.companyId },
          testCompany,
          { new: true }
        );
      } else {
        // Create new test company
        await Company.create(testCompany);
        console.log(`Test company with ID ${testCompany.companyId} created successfully`);
      }
      
      // Add the specific user company
      const existingUserCompany = await Company.findOne({ companyId: userCompany.companyId });
      
      if (existingUserCompany) {
        console.log(`User company with ID ${userCompany.companyId} already exists`);
        console.log('Updating existing user company data...');
        
        await Company.findOneAndUpdate(
          { companyId: userCompany.companyId },
          userCompany,
          { new: true }
        );
      } else {
        // Create new user company
        await Company.create(userCompany);
        console.log(`User company with ID ${userCompany.companyId} created successfully`);
      }
      
      console.log('Test data seeded successfully!');
      
      // Add another test company
      const anotherCompany = {
        companyId: 'company-def456',
        name: 'Example Corp',
        documentName: 'example-manual.pdf',
        documentContext: `
Example Corp User Manual
This manual covers the basic usage of Example Corp products.
Our main product line includes:
1. ExamplePro - Professional edition with advanced features
2. ExampleLite - Simplified version for small businesses
3. ExampleCloud - Cloud-based solution with automatic updates

For support, contact us at support@example.com or call 555-123-4567.
`,
        chatbotUrl: 'http://localhost:5178/support/company-def456',
        trainingStatus: 'completed',
        brandColor: '#10b981'
      };
      
      const existingSecondCompany = await Company.findOne({ companyId: anotherCompany.companyId });
      
      if (!existingSecondCompany) {
        await Company.create(anotherCompany);
        console.log(`Second test company with ID ${anotherCompany.companyId} created successfully`);
      } else {
        await Company.findOneAndUpdate(
          { companyId: anotherCompany.companyId },
          anotherCompany,
          { new: true }
        );
        console.log(`Updated second test company with ID ${anotherCompany.companyId}`);
      }
      
    } catch (error) {
      console.error('Error seeding test data:', error);
    } finally {
      // Close MongoDB connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 