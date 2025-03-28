import Company from '../models/Company.js';
import CompanyContext from '../models/CompanyContext.js';
import asyncHandler from '../middleware/asyncHandler.js';
import createError from '../utils/errorResponse.js';
import mongoose from 'mongoose';

/**
 * @desc    Get a company by ID
 * @route   GET /api/companies/:companyId
 * @access  Public
 */
export const getCompanyById = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ companyId: req.params.companyId });

  if (!company) {
    return next(createError(`Company with ID ${req.params.companyId} not found`, 404));
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

/**
 * @desc    Create a new company with document context
 * @route   POST /api/companies
 * @access  Private
 */
export const createCompany = asyncHandler(async (req, res, next) => {
  const { companyId, name, documentName, documentContext, chatbotUrl } = req.body;

  // Validate required fields
  if (!companyId || !name || !documentContext || !chatbotUrl) {
    return next(createError('Please provide companyId, name, documentContext, and chatbotUrl', 400));
  }

  // Check if company already exists
  const existingCompany = await Company.findOne({ companyId });
  if (existingCompany) {
    return next(createError(`Company with ID ${companyId} already exists`, 400));
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create company
    const company = await Company.create([{
      companyId,
      name,
      documentName,
      documentContext,
      chatbotUrl,
      trainingStatus: 'completed'
    }], { session });

    // Save the context in the CompanyContext model
    await CompanyContext.create([{
      company_id: companyId,
      context: documentContext,
      version: 1,
      isActive: true
    }], { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: company[0]
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

/**
 * @desc    Update company information and document context
 * @route   PUT /api/companies/:companyId
 * @access  Private
 */
export const updateCompany = asyncHandler(async (req, res, next) => {
  let company = await Company.findOne({ companyId: req.params.companyId });

  if (!company) {
    return next(createError(`Company with ID ${req.params.companyId} not found`, 404));
  }

  // Update the company
  company = await Company.findOneAndUpdate(
    { companyId: req.params.companyId },
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: company
  });
});

/**
 * @desc    Delete a company
 * @route   DELETE /api/companies/:companyId
 * @access  Private
 */
export const deleteCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ companyId: req.params.companyId });

  if (!company) {
    return next(createError(`Company with ID ${req.params.companyId} not found`, 404));
  }

  await company.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Update company training status
 * @route   PUT /api/companies/:companyId/training-status
 * @access  Private
 */
export const updateTrainingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['in_progress', 'completed', 'failed'].includes(status)) {
    return next(createError('Please provide a valid training status (in_progress, completed, failed)', 400));
  }

  const company = await Company.findOneAndUpdate(
    { companyId: req.params.companyId },
    { trainingStatus: status },
    { new: true, runValidators: true }
  );

  if (!company) {
    return next(createError(`Company with ID ${req.params.companyId} not found`, 404));
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

/**
 * @desc    Get the latest context for a company
 * @route   GET /api/companies/:companyId/context
 * @access  Public
 */
export const getCompanyContext = asyncHandler(async (req, res, next) => {
  console.log(`Attempting to fetch context for company ID: ${req.params.companyId}`);
  
  // First check if company exists
  const company = await Company.findOne({ companyId: req.params.companyId });

  if (!company) {
    console.error(`Company with ID ${req.params.companyId} not found in database`);
    return next(createError(`Company with ID ${req.params.companyId} not found`, 404));
  }
  
  console.log(`Company found: ${company.name} (ID: ${company.companyId})`);

  // Get the latest active context
  const context = await CompanyContext.findOne({ 
    company_id: req.params.companyId,
    isActive: true 
  }).sort({ version: -1 });
  
  console.log(`Context search result: ${context ? 'Found' : 'Not found'}`);

  // If no context found in CompanyContext, fall back to company's documentContext
  if (!context) {
    console.log('No context record found, checking for documentContext fallback');
    
    // Check if the company has a documentContext field
    if (!company.documentContext) {
      console.error(`No context available for company with ID ${req.params.companyId}`);
      return next(createError(`No context available for company with ID ${req.params.companyId}`, 404));
    }
    
    console.log(`Using documentContext fallback (length: ${company.documentContext.length} chars)`);
    
    // Use the documentContext from the Company model as fallback
    return res.status(200).json({
      success: true,
      data: {
        company: {
          id: company.companyId,
          name: company.name
        },
        context: company.documentContext,
        version: 1,
        updatedAt: company.updatedAt,
        source: 'company_fallback' // Indicate this is coming from the fallback source
      }
    });
  }
  
  console.log(`Using context from CompanyContext (version: ${context.version}, length: ${context.context.length} chars)`);

  res.status(200).json({
    success: true,
    data: {
      company: {
        id: company.companyId,
        name: company.name
      },
      context: context.context,
      version: context.version,
      updatedAt: context.updatedAt,
      source: 'context_collection'
    }
  });
});

/**
 * @desc    Update company context with a new version
 * @route   POST /api/companies/:companyId/context
 * @access  Private
 */
export const updateCompanyContext = asyncHandler(async (req, res, next) => {
  const { context } = req.body;
  
  if (!context) {
    return next(createError('Please provide the context to update', 400));
  }

  // Check if company exists
  const company = await Company.findOne({ companyId: req.params.companyId });
  if (!company) {
    return next(createError(`Company with ID ${req.params.companyId} not found`, 404));
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get the latest version number
    const latestContext = await CompanyContext.findOne({ 
      company_id: req.params.companyId 
    }).sort({ version: -1 });
    
    const newVersion = latestContext ? latestContext.version + 1 : 1;
    
    // Set all existing contexts to inactive
    await CompanyContext.updateMany(
      { company_id: req.params.companyId },
      { isActive: false },
      { session }
    );
    
    // Create new active context
    const newContext = await CompanyContext.create([{
      company_id: req.params.companyId,
      context,
      version: newVersion,
      isActive: true
    }], { session });
    
    // Update the company document to reflect this new context
    await Company.findOneAndUpdate(
      { companyId: req.params.companyId },
      { documentContext: context },
      { new: true, session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: {
        company: {
          id: company.companyId,
          name: company.name
        },
        context: newContext[0].context,
        version: newContext[0].version,
        updatedAt: newContext[0].updatedAt,
        isActive: newContext[0].isActive
      }
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});

/**
 * @desc    Store the Gemini-generated summary and create a shareable link
 * @route   POST /api/companies/summary
 * @access  Private
 */
export const storeSummary = asyncHandler(async (req, res, next) => {
  const { userId, fileName, summary } = req.body;
  
  if (!userId || !fileName || !summary) {
    return next(createError('Please provide userId, fileName, and summary', 400));
  }

  // Generate a unique companyId based on userId and a timestamp
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  const companyId = `${userId}-${timestamp}-${randomString}`;
  
  // Generate a URL-friendly slug from the file name
  const companySlug = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
  
  // Create a unique chatbot URL
  const chatbotUrl = `/chatbot/summary/${companyId}`;

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create company with the summary as documentContext
    const company = await Company.create([{
      companyId,
      name: fileName,
      documentName: fileName,
      documentContext: summary,
      chatbotUrl,
      trainingStatus: 'completed'
    }], { session });

    // Save the context in the CompanyContext model
    await CompanyContext.create([{
      company_id: companyId,
      context: summary,
      version: 1,
      isActive: true
    }], { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: {
        companyId,
        chatbotUrl,
        fileName,
        summaryLength: summary.length
      }
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
}); 