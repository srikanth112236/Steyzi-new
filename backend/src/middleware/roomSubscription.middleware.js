const SubscriptionValidationService = require('../services/subscriptionValidation.service');
const logger = require('../utils/logger');

/**
 * Middleware to validate room addition based on subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateRoomAddition = async (req, res, next) => {
  try {
    // Extract necessary information
    const userId = req.user._id;
    const pgId = req.user.pgId;
    
    // Determine number of rooms to add
    const roomsToAdd = req.body.numberOfRooms || 1;

    // Validate room addition
    const validationResult = await SubscriptionValidationService.canAddRooms(
      userId, 
      pgId, 
      roomsToAdd
    );

    // Check validation result
    if (!validationResult.success) {
      logger.log('warn', 'Room addition not allowed', {
        userId,
        pgId,
        roomsToAdd,
        reason: validationResult.message
      });

      return res.status(403).json({
        success: false,
        message: validationResult.message,
        requiresUpgrade: validationResult.requiresUpgrade,
        currentRooms: validationResult.currentRooms,
        maxAllowedRooms: validationResult.maxAllowedRooms
      });
    }

    // Attach validation result to request for potential use in route handler
    req.roomValidation = validationResult;

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    logger.log('error', 'Room addition validation middleware error', {
      error: error.message,
      userId: req.user._id
    });

    return res.status(500).json({
      success: false,
      message: 'Error validating room addition',
      error: error.message
    });
  }
};

/**
 * Middleware to validate bulk room upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateBulkRoomUpload = async (req, res, next) => {
  try {
    // Extract necessary information
    const userId = req.user._id;
    const pgId = req.user.pgId;
    
    // Determine number of rooms to upload
    const roomCount = req.body.rooms ? req.body.rooms.length : 0;

    // Validate bulk room upload
    const validationResult = await SubscriptionValidationService.validateBulkRoomUpload(
      userId, 
      pgId, 
      roomCount
    );

    // Check validation result
    if (!validationResult.success) {
      logger.log('warn', 'Bulk room upload not allowed', {
        userId,
        pgId,
        roomCount,
        reason: validationResult.message
      });

      return res.status(403).json({
        success: false,
        message: validationResult.message,
        requiresUpgrade: validationResult.requiresUpgrade,
        currentRooms: validationResult.currentRooms,
        maxAllowedRooms: validationResult.maxAllowedRooms
      });
    }

    // Attach validation result to request for potential use in route handler
    req.bulkUploadValidation = validationResult;

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    logger.log('error', 'Bulk room upload validation middleware error', {
      error: error.message,
      userId: req.user._id
    });

    return res.status(500).json({
      success: false,
      message: 'Error validating bulk room upload',
      error: error.message
    });
  }
};

module.exports = {
  validateRoomAddition,
  validateBulkRoomUpload
};
