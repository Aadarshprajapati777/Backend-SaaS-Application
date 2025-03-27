import User from '../models/User.js';
import createError from '../utils/errorResponse.js';

/**
 * Helper function to get token from model, create cookie and send response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Use secure flag in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from response
  user.password = undefined;

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      data: user
    });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */export const register = async (req, res, next) => {
  try {
    const { name, email, password, userType, businessName, businessSize } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError('Email already exists', 400));
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      userType: userType || 'individual'
    };

    // Add business-specific fields if user type is business
    if (userData.userType === 'business') {
      if (!businessName) {
        return next(createError('Business name is required for business accounts', 400));
      }
      userData.businessName = businessName;
      userData.businessSize = businessSize || 'small';
      userData.role = 'owner'; // Business account creator is the owner
    }

    const user = await User.create(userData);

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(createError('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(createError('Invalid credentials', 401));
    }

    // Update last active timestamp
    user.lastActiveAt = Date.now();
    await user.save({ validateBeforeSave: false });

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};
/**
 * @desc    Log user out / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Generate API key for user
 * @route   POST /api/auth/api-key
 * @access  Private
 */
export const generateApiKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Check if user is allowed to generate API key
    if (user.userType === 'individual' && user.plan === 'free') {
      return next(createError('Upgrade to a paid plan to access API features', 403));
    }

    // Generate API key
    const apiKey = user.generateApiKey();
    
    // Save user with new API key
    await user.save();

    res.status(200).json({
      success: true,
      data: { apiKey }
    });
  } catch (err) {
    next(err);
  }
}; 