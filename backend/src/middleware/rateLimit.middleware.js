const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware for authentication routes
 * More permissive settings for login, register, and password reset
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Allow 50 requests per 15 minutes for auth routes
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => process.env.NODE_ENV === 'development',
  // Add more lenient settings
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Do count failed requests
  // Custom key generator to be more specific
  keyGenerator: (req) => {
    return req.ip + ':' + req.path; // Include path in key
  },
});

/**
 * General API rate limiting
 * More permissive for development and production
 */
const apiRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => process.env.NODE_ENV === 'development',
  // Add more lenient settings
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Do count failed requests
});

/**
 * Strict rate limiting for sensitive operations
 * Used for admin operations, file uploads, etc.
 */
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 requests per 15 minutes for sensitive operations
  message: {
    error: 'Too many requests for this operation. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => process.env.NODE_ENV === 'development',
});

/**
 * No rate limiting - for debugging
 * Completely bypasses rate limiting but logs requests
 */
const noRateLimit = (req, res, next) => {
  console.log('🔍 Rate Limit Debug:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  noRateLimit
}; 