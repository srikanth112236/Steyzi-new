const express = require('express');
const router = express.Router();
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
const RoomService = require('../services/room.service');
const SubscriptionValidationService = require('../services/subscriptionValidation.service');
const logger = require('../utils/logger');

/**
 * @route   POST /api/rooms
 * @desc    Create a new room with subscription validation
 * @access  Private (Admin/Superadmin)
 */
router.post('/', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const roomData = {
        ...req.body,
        pgId: req.user.pgId
      };

      // Validate room creation
      const validationResult = await SubscriptionValidationService.validateRoomCreation(
        req.user._id, 
        req.user.pgId, 
        roomData
      );

      // Check validation result
      if (!validationResult.success) {
        logger.log('warn', 'Room creation not allowed', {
          userId: req.user._id,
          pgId: req.user.pgId,
          roomData,
          reason: validationResult.message
        });

        return res.status(403).json({
          success: false,
          message: validationResult.message,
          requiresUpgrade: true,
          currentRooms: validationResult.currentRooms,
          maxAllowedRooms: validationResult.maxAllowedRooms,
          currentBeds: validationResult.currentBeds,
          maxAllowedBeds: validationResult.maxAllowedBeds,
          bedsToAdd: validationResult.bedsToAdd,
          remainingBeds: validationResult.remainingBeds
        });
      }

      // Proceed with room creation
      const result = await RoomService.createRoom(
        roomData, 
        req.user._id, 
        validationResult
      );

      // Log room creation activity
      logger.log('info', 'Room created successfully', {
        userId: req.user._id,
        pgId: req.user.pgId,
        roomId: result.data?._id
      });

      return res.status(result.statusCode).json(result);
    } catch (error) {
      logger.log('error', 'Room creation error', {
        userId: req.user._id,
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to create room',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/rooms/bulk-upload
 * @desc    Bulk upload rooms with subscription validation
 * @access  Private (Admin/Superadmin)
 */
router.post('/bulk-upload', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { rooms, pgId } = req.body;
      const userId = req.user._id;

      // Validate bulk room upload
      const validationResult = await SubscriptionValidationService.validateBulkRoomUpload(
        userId, 
        pgId, 
        rooms
      );

      // Check validation result
      if (!validationResult.success) {
        logger.log('warn', 'Bulk room upload not allowed', {
          userId,
          pgId,
          totalRooms: validationResult.totalRooms,
          totalBedsToAdd: validationResult.totalBedsToAdd,
          reason: validationResult.message
        });

        return res.status(403).json({
          success: false,
          message: validationResult.message,
          requiresUpgrade: true,
          currentRooms: validationResult.currentRooms,
          maxAllowedRooms: validationResult.maxAllowedRooms,
          currentBeds: validationResult.currentBeds,
          maxAllowedBeds: validationResult.maxAllowedBeds,
          totalRooms: validationResult.totalRooms,
          totalBedsToAdd: validationResult.totalBedsToAdd
        });
      }

      // Proceed with bulk upload
      const bulkUploadData = {
        rooms,
        pgId,
        userId: req.user._id
      };

      const result = await RoomService.bulkUploadRooms(
        bulkUploadData, 
        req.user._id, 
        validationResult
      );

      // Log bulk upload activity
      logger.log('info', 'Bulk room upload completed', {
        userId: req.user._id,
        pgId,
        uploadedRooms: result.data?.uploadedRoomsCount || 0,
        totalRooms: validationResult.totalRooms,
        totalBedsToAdd: validationResult.totalBedsToAdd
      });

      return res.status(result.statusCode).json(result);
    } catch (error) {
      logger.log('error', 'Bulk room upload error', {
        userId: req.user._id,
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to upload rooms',
        error: error.message
      });
    }
  }
);

module.exports = router;
