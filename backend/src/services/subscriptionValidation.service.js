const UserSubscription = require('../models/userSubscription.model');
const PG = require('../models/pg.model');
const Room = require('../models/room.model');
const logger = require('../utils/logger');

class SubscriptionValidationService {
  /**
   * Validate room creation against subscription limits
   * @param {string} userId - User ID
   * @param {string} pgId - PG ID
   * @param {Object} roomData - Room creation data
   * @returns {Promise<Object>} Validation result
   */
  async validateRoomCreation(userId, pgId, roomData) {
    try {
      // Find active subscription for the user
      const activeSubscription = await UserSubscription.findOne({
        userId: userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).populate('subscriptionPlanId');

      // If no active subscription, check for free trial or default plan
      if (!activeSubscription) {
        return this.handleNoActiveSubscription(userId, pgId, roomData);
      }

      // Get current room and bed count for the PG
      const currentRoomCount = await Room.countDocuments({
        pgId: pgId,
        isActive: true
      });

      const currentBedCount = await Room.aggregate([
        { $match: { pgId: pgId, isActive: true } },
        { $group: { 
          _id: null, 
          totalBeds: { $sum: '$numberOfBeds' } 
        }}
      ]);

      // Check subscription restrictions
      const maxAllowedRooms = activeSubscription.totalRooms || 
        activeSubscription.subscriptionPlanId.maxRoomsAllowed || 
        5; // Default to 5 rooms if not specified

      const maxAllowedBeds = activeSubscription.totalBeds || 
        activeSubscription.subscriptionPlanId.maxBedsAllowed || 
        30; // Default to 30 beds if not specified

      // Calculate current total beds
      const currentTotalBeds = currentBedCount[0]?.totalBeds || 0;
      const bedsToAdd = roomData.numberOfBeds || 1;

      // Validate room addition
      if (currentRoomCount + 1 > maxAllowedRooms) {
        return {
          success: false,
          message: `Room limit exceeded. Maximum allowed rooms: ${maxAllowedRooms}`,
          currentRooms: currentRoomCount,
          maxAllowedRooms: maxAllowedRooms,
          requiresUpgrade: true,
          type: 'rooms'
        };
      }

      // Validate bed addition with strict enforcement
      if (currentTotalBeds + bedsToAdd > maxAllowedBeds) {
        const remainingBeds = Math.max(0, maxAllowedBeds - currentTotalBeds);
        
        return {
          success: false,
          message: `Bed limit exceeded. Maximum allowed beds: ${maxAllowedBeds}. You can add ${remainingBeds} more beds.`,
          currentBeds: currentTotalBeds,
          maxAllowedBeds: maxAllowedBeds,
          bedsToAdd: bedsToAdd,
          remainingBeds: remainingBeds,
          requiresUpgrade: true,
          type: 'beds'
        };
      }

      // Room and bed addition is allowed
      return {
        success: true,
        message: 'Room addition allowed',
        currentRooms: currentRoomCount,
        maxAllowedRooms: maxAllowedRooms,
        currentBeds: currentTotalBeds,
        maxAllowedBeds: maxAllowedBeds,
        remainingRooms: maxAllowedRooms - (currentRoomCount + 1),
        remainingBeds: maxAllowedBeds - (currentTotalBeds + bedsToAdd)
      };
    } catch (error) {
      logger.log('error', 'Subscription room validation error', { 
        userId, 
        pgId, 
        roomData,
        error: error.message 
      });

      return {
        success: false,
        message: 'Error validating room addition',
        error: error.message
      };
    }
  }

  /**
   * Validate bulk room upload with strict bed limit enforcement
   * @param {string} userId - User ID
   * @param {string} pgId - PG ID
   * @param {Array} rooms - Rooms to upload
   * @returns {Promise<Object>} Bulk upload validation result
   */
  async validateBulkRoomUpload(userId, pgId, rooms) {
    try {
      // Calculate total rooms and beds
      const roomCount = rooms.length;
      const totalBedsToAdd = rooms.reduce((total, room) => 
        total + (room.numberOfBeds || 1), 0);

      // Find active subscription for the user
      const activeSubscription = await UserSubscription.findOne({
        userId: userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).populate('subscriptionPlanId');

      // If no active subscription, check for free trial or default plan
      if (!activeSubscription) {
        return this.handleNoActiveSubscription(userId, pgId, { rooms });
      }

      // Get current room and bed count for the PG
      const currentRoomCount = await Room.countDocuments({
        pgId: pgId,
        isActive: true
      });

      const currentBedCount = await Room.aggregate([
        { $match: { pgId: pgId, isActive: true } },
        { $group: { 
          _id: null, 
          totalBeds: { $sum: '$numberOfBeds' } 
        }}
      ]);

      // Check subscription restrictions
      const maxAllowedRooms = activeSubscription.totalRooms || 
        activeSubscription.subscriptionPlanId.maxRoomsAllowed || 
        5; // Default to 5 rooms if not specified

      const maxAllowedBeds = activeSubscription.totalBeds || 
        activeSubscription.subscriptionPlanId.maxBedsAllowed || 
        30; // Default to 30 beds if not specified

      // Calculate current total beds
      const currentTotalBeds = currentBedCount[0]?.totalBeds || 0;

      // Validate room addition
      if (currentRoomCount + roomCount > maxAllowedRooms) {
        return {
          success: false,
          message: `Room limit exceeded. Maximum allowed rooms: ${maxAllowedRooms}`,
          currentRooms: currentRoomCount,
          maxAllowedRooms: maxAllowedRooms,
          totalRooms: roomCount,
          requiresUpgrade: true,
          type: 'rooms'
        };
      }

      // Validate bed addition with strict enforcement
      if (currentTotalBeds + totalBedsToAdd > maxAllowedBeds) {
        const remainingBeds = Math.max(0, maxAllowedBeds - currentTotalBeds);
        
        return {
          success: false,
          message: `Bed limit exceeded. Maximum allowed beds: ${maxAllowedBeds}. You can add ${remainingBeds} more beds.`,
          currentBeds: currentTotalBeds,
          maxAllowedBeds: maxAllowedBeds,
          totalBedsToAdd: totalBedsToAdd,
          remainingBeds: remainingBeds,
          requiresUpgrade: true,
          type: 'beds'
        };
      }

      // Room and bed addition is allowed
      return {
        success: true,
        message: 'Bulk upload allowed',
        currentRooms: currentRoomCount,
        maxAllowedRooms: maxAllowedRooms,
        currentBeds: currentTotalBeds,
        maxAllowedBeds: maxAllowedBeds,
        totalRooms: roomCount,
        totalBedsToAdd: totalBedsToAdd,
        remainingRooms: maxAllowedRooms - (currentRoomCount + roomCount),
        remainingBeds: maxAllowedBeds - (currentTotalBeds + totalBedsToAdd)
      };
    } catch (error) {
      logger.log('error', 'Bulk room upload validation error', { 
        userId, 
        pgId, 
        error: error.message 
      });

      return {
        success: false,
        message: 'Bulk room upload validation failed',
        requiresUpgrade: true
      };
    }
  }

  /**
   * Handle scenarios with no active subscription
   * @param {string} userId - User ID
   * @param {string} pgId - PG ID
   * @param {Object} data - Room or rooms data
   * @returns {Promise<Object>} Validation result
   */
  async handleNoActiveSubscription(userId, pgId, data) {
    try {
      // Attempt to activate free trial
      const SubscriptionManagementService = require('./subscriptionManagement.service');
      
      const trialResult = await SubscriptionManagementService.activateFreeTrial(userId);
      
      if (!trialResult.success) {
        return {
          success: false,
          message: 'No active subscription and failed to activate free trial',
          requiresUpgrade: true
        };
      }

      // Recheck room addition with new trial subscription
      return data.rooms 
        ? this.validateBulkRoomUpload(userId, pgId, data.rooms)
        : this.validateRoomCreation(userId, pgId, data);
    } catch (error) {
      logger.log('error', 'No subscription handling error', { 
        userId, 
        pgId, 
        error: error.message 
      });

      return {
        success: false,
        message: 'Failed to handle no subscription scenario',
        requiresUpgrade: true
      };
    }
  }
}

module.exports = new SubscriptionValidationService();
