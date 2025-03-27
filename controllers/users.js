import User from '../models/User.js';
import Usage from '../models/Usage.js';
import createError from '../utils/errorResponse.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(createError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, businessName, businessSize } = req.body;

    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    
    // Only update business fields if user is a business
    if (req.user.userType === 'business') {
      if (businessName) updateFields.businessName = businessName;
      if (businessSize) updateFields.businessSize = businessSize;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(createError('Please provide current and new password', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(createError('Current password is incorrect', 401));
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user usage statistics
 * @route   GET /api/users/usage
 * @access  Private
 */
export const getUserUsage = async (req, res, next) => {
  try {
    // Get all usage for the user
    const usage = await Usage.find({ user: req.user.id }).sort('-timestamp');

    // Calculate statistics
    const documentUploads = usage.filter(item => item.type === 'document_upload').length;
    const modelTrainings = usage.filter(item => item.type === 'model_training').length;
    const chatInteractions = usage.filter(item => item.type === 'chat').length;
    const apiCalls = usage.filter(item => item.type === 'api_call').length;
    
    // Calculate total tokens used
    const totalTokens = usage.reduce((total, item) => total + (item.totalTokens || 0), 0);
    
    // Calculate storage used
    const storageUsed = usage.reduce((total, item) => total + (item.storageUsed || 0), 0);

    // Get last 7 days of usage
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const lastWeekUsage = usage.filter(item => 
      new Date(item.timestamp) >= oneWeekAgo
    );

    // Calculate daily usage for the last 7 days
    const dailyUsage = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayUsage = lastWeekUsage.filter(item => 
        new Date(item.timestamp).toISOString().split('T')[0] === dateString
      );
      
      dailyUsage[dateString] = {
        count: dayUsage.length,
        tokens: dayUsage.reduce((total, item) => total + (item.totalTokens || 0), 0),
        storage: dayUsage.reduce((total, item) => total + (item.storageUsed || 0), 0)
      };
    }

    res.status(200).json({
      success: true,
      data: {
        documentUploads,
        modelTrainings,
        chatInteractions,
        apiCalls,
        totalTokens,
        storageUsed,
        dailyUsage,
        recentActivity: usage.slice(0, 10) // Last 10 activities
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users
 * @access  Private
 */
export const deleteAccount = async (req, res, next) => {
  try {
    // In a real app, you'd delete associated data or mark it for deletion
    
    // For now, we'll just delete the user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 