/**
 * Utility functions for creating standardized API responses
 */

/**
 * Create a standardized API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {*} data - Response data (optional)
 * @returns {Object} Express response
 */
const createResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
    statusCode
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create a success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Response data (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response
 */
const successResponse = (res, message, data = null, statusCode = 200) => {
  return createResponse(res, statusCode, true, message, data);
};

/**
 * Create an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} data - Error data (optional)
 * @returns {Object} Express response
 */
const errorResponse = (res, message, statusCode = 400, data = null) => {
  return createResponse(res, statusCode, false, message, data);
};

/**
 * Create a validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Array} errors - Validation errors array
 * @returns {Object} Express response
 */
const validationErrorResponse = (res, message, errors = []) => {
  return createResponse(res, 400, false, message, { errors });
};

/**
 * Create a not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 * @returns {Object} Express response
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return createResponse(res, 404, false, message);
};

/**
 * Create an unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 * @returns {Object} Express response
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return createResponse(res, 401, false, message);
};

/**
 * Create a forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 * @returns {Object} Express response
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return createResponse(res, 403, false, message);
};

/**
 * Create a server error response
 * @param {Object} res - Express response object
 * @param {string} message - Server error message
 * @returns {Object} Express response
 */
const serverErrorResponse = (res, message = 'Internal server error') => {
  return createResponse(res, 500, false, message);
};

module.exports = {
  createResponse,
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse
}; 