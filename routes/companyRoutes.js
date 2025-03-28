import express from 'express';
import {
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  updateTrainingStatus,
  getCompanyContext,
  updateCompanyContext,
  storeSummary
} from '../controllers/companyController.js';

const router = express.Router();

// Company routes
router.route('/')
  .post(createCompany);

// Summary route - add this new route
router.route('/summary')
  .post(storeSummary);

router.route('/:companyId')
  .get(getCompanyById)
  .put(updateCompany)
  .delete(deleteCompany);

router.route('/:companyId/training-status')
  .put(updateTrainingStatus);

// Add the new route for company context
router.route('/:companyId/context')
  .get(getCompanyContext)
  .post(updateCompanyContext);

// Add a diagnostic endpoint for context issues
router.get('/:companyId/context-diagnostic', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Import the models directly within this function
    const Company = req.app.get('models').Company;
    const CompanyContext = req.app.get('models').CompanyContext;
    
    if (!Company || !CompanyContext) {
      return res.status(500).json({
        success: false,
        error: 'Models not available in the application context'
      });
    }
    
    // 1. Check if company exists
    const company = await Company.findOne({ companyId });
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        diagnostic: {
          companyId,
          exists: false,
          action: 'Company must be created first'
        }
      });
    }
    
    // 2. Check if there's context in the CompanyContext collection
    const contexts = await CompanyContext.find({ company_id: companyId }).sort({ version: -1 });
    
    // 3. Check if there's context in the Company document
    const hasDocumentContext = !!(company.documentContext && company.documentContext.length > 100);
    
    const diagnostic = {
      companyId,
      exists: true,
      companyName: company.name,
      hasDocumentContext,
      documentContextLength: company.documentContext ? company.documentContext.length : 0,
      contextsCount: contexts.length,
      activeContexts: contexts.filter(c => c.isActive).length,
      contexts: contexts.map(c => ({
        id: c._id,
        version: c.version,
        isActive: c.isActive,
        contextLength: c.context ? c.context.length : 0,
        createdAt: c.createdAt
      }))
    };
    
    // 4. If no contexts exist but company has documentContext, suggest creating a context
    if (contexts.length === 0 && hasDocumentContext) {
      diagnostic.suggestion = 'CREATE_CONTEXT';
      diagnostic.action = 'POST to /api/companies/' + companyId + '/context with the documentContext';
    } 
    // 5. If no context anywhere, suggest uploading a document
    else if (contexts.length === 0 && !hasDocumentContext) {
      diagnostic.suggestion = 'UPLOAD_DOCUMENT';
      diagnostic.action = 'Upload a document and train the model again';
    }
    // 6. If multiple active contexts, suggest fixing
    else if (contexts.filter(c => c.isActive).length > 1) {
      diagnostic.suggestion = 'FIX_ACTIVE_CONTEXTS';
      diagnostic.action = 'Multiple active contexts found, should be fixed';
    }
    
    return res.status(200).json({
      success: true,
      diagnostic
    });
    
  } catch (error) {
    console.error('Context diagnostic error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error running context diagnostic'
    });
  }
});

export default router; 