/**
 * Async handler middleware
 * Wraps async route handlers to avoid try-catch blocks in each route
 * 
 * @param {Function} fn - The async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler; 