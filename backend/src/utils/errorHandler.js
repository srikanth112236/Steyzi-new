/**
 * Global Error Handler Utilities
 */

/**
 * Catch async errors and pass them to the global error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle operational errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleOperationalError = (err, req, res, next) => {
  // Log error
  console.error('Operational Error:', err);

  // Send error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handle MongoDB validation errors
 * @param {Error} err - Mongoose validation error
 * @returns {Object} Formatted error
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data: ${errors.join('. ')}`;

  return {
    statusCode: 400,
    message,
    isOperational: true
  };
};

/**
 * Handle MongoDB duplicate field errors
 * @param {Error} err - MongoDB duplicate key error
 * @returns {Object} Formatted error
 */
const handleDuplicateFieldsError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} - '${value}'. Please use another value!`;

  return {
    statusCode: 400,
    message,
    isOperational: true
  };
};

/**
 * Handle MongoDB cast errors
 * @param {Error} err - MongoDB cast error
 * @returns {Object} Formatted error
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return {
    statusCode: 400,
    message,
    isOperational: true
  };
};

/**
 * Send error in development mode
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * Send error in production mode
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    const error = handleValidationError(err);
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (err.code === 11000) {
    const error = handleDuplicateFieldsError(err);
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (err.name === 'CastError') {
    const error = handleCastError(err);
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again!'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your token has expired! Please log in again.'
    });
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

module.exports = {
  catchAsync,
  handleOperationalError,
  globalErrorHandler
};
