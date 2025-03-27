import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protects routes that require authentication
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-api-key']) {
    // Set token from API key
    token = req.headers['x-api-key'];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from decoded token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

/**
 * Grant access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Grant access to specific user types
 */
export const authorizeUserType = (...types) => {
  return (req, res, next) => {
    if (!types.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: `User type ${req.user.userType} is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Check if user is a team member
 */
export const isTeamMember = async (req, res, next) => {
  if (req.user.isTeamMember && req.user.teamId) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Only team members can access this route'
    });
  }
}; 