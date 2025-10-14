const Room = require('../models/room.model');
const Floor = require('../models/floor.model');
const logger = require('../utils/logger');
const UserSubscription = require('../models/userSubscription.model');

class RoomService {
  /**
   * Create a new room
   * @param {Object} roomData - Room creation data
   * @param {string} userId - User creating the room
   * @param {Object} subscriptionValidation - Subscription validation result
   * @returns {Promise<Object>} Room creation result
   */
  async createRoom(roomData, userId, subscriptionValidation = null) {
    try {
      // Validate room data
      if (!roomData.floorId || !roomData.roomNumber) {
        return {
          success: false,
          message: 'Floor ID and room number are required',
          statusCode: 400
        };
      }

      // Verify floor exists and belongs to the PG
      const floor = await Floor.findOne({
        _id: roomData.floorId,
        pgId: roomData.pgId,
        isActive: true
      });

      if (!floor) {
        return {
          success: false,
          message: 'Invalid floor or floor not found',
          statusCode: 404
        };
      }

      // Check for existing room with same number in the floor
      const existingRoom = await Room.findOne({
        floorId: roomData.floorId,
        roomNumber: roomData.roomNumber,
        isActive: true
      });

      if (existingRoom) {
        return {
          success: false,
          message: 'Room number already exists in this floor',
          statusCode: 400
        };
      }

      // Prepare room data
      const newRoomData = {
        ...roomData,
        branchId: floor.branchId,
        createdBy: userId,
        beds: this.generateBedNumbers(roomData.roomNumber, roomData.numberOfBeds)
      };

      // Create room
      const room = new Room(newRoomData);
      const savedRoom = await room.save();

      // Populate room with floor and branch details
      const populatedRoom = await Room.findById(savedRoom._id)
        .populate('floorId', 'name floorNumber')
        .populate('branchId', 'name')
        .populate('createdBy', 'firstName lastName email');

      // Update subscription usage (if validation was performed)
      if (subscriptionValidation) {
        await this.updateSubscriptionUsage(userId, savedRoom.pgId);
      }

      // Log room creation
      logger.log('info', 'Room created successfully', {
        roomId: savedRoom._id,
        roomNumber: savedRoom.roomNumber,
        userId
      });

      return {
        success: true,
        message: 'Room created successfully',
        data: populatedRoom,
        statusCode: 201
      };
    } catch (error) {
      logger.log('error', 'Room creation error', {
        error: error.message,
        userId,
        roomData
      });

      return {
        success: false,
        message: 'Failed to create room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Bulk upload rooms
   * @param {Object} bulkUploadData - Bulk upload data
   * @param {string} userId - User performing upload
   * @param {Object} subscriptionValidation - Subscription validation result
   * @returns {Promise<Object>} Bulk upload result
   */
  async bulkUploadRooms(bulkUploadData, userId, subscriptionValidation = null) {
    const session = await Room.startSession();
    session.startTransaction();

    try {
      const { rooms, pgId, branchId } = bulkUploadData;
      const uploadedRooms = [];
      const failedRooms = [];
      const skippedRooms = [];

      for (const roomData of rooms) {
        try {
          // Find or validate floor
          const floor = await Floor.findOne({
            name: roomData.floorName || roomData.floor,
            pgId,
            branchId,
            isActive: true
          });

          if (!floor) {
            failedRooms.push({
              ...roomData,
              error: 'Floor not found'
            });
            continue;
          }

          // Check for existing room
          const existingRoom = await Room.findOne({
            floorId: floor._id,
            roomNumber: roomData.roomNumber,
            isActive: true
          });

          if (existingRoom) {
            skippedRooms.push({
              ...roomData,
              reason: 'Room already exists in this floor'
            });
            continue;
          }

          // Prepare room data
          const newRoomData = {
            ...roomData,
            pgId,
            branchId,
            floorId: floor._id,
            createdBy: userId,
            beds: this.generateBedNumbers(roomData.roomNumber, roomData.numberOfBeds || 1)
          };

          // Create room
          const room = new Room(newRoomData);
          const savedRoom = await room.save({ session });
          uploadedRooms.push(savedRoom);
        } catch (roomError) {
          failedRooms.push({
            ...roomData,
            error: roomError.message
          });
        }
      }

      // Update subscription usage (if validation was performed)
      if (subscriptionValidation) {
        await this.updateSubscriptionUsage(userId, pgId);
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Log bulk upload results
      logger.log('info', 'Bulk room upload completed', {
        uploadedRoomsCount: uploadedRooms.length,
        failedRoomsCount: failedRooms.length,
        skippedRoomsCount: skippedRooms.length,
        userId
      });

      return {
        success: true,
        message: 'Rooms uploaded successfully',
        data: {
          uploadedRooms,
          failedRooms,
          skippedRooms,
          uploadedRoomsCount: uploadedRooms.length,
          failedRoomsCount: failedRooms.length,
          skippedRoomsCount: skippedRooms.length
        },
        statusCode: 201
      };
    } catch (error) {
      // Abort transaction
      await session.abortTransaction();
      session.endSession();

      logger.log('error', 'Bulk room upload error', {
        error: error.message,
        userId,
        bulkUploadData
      });

      return {
        success: false,
        message: 'Failed to upload rooms',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Generate bed numbers for a room
   * @param {string} roomNumber - Room number
   * @param {number} numberOfBeds - Number of beds
   * @returns {Array} Generated bed numbers
   */
  generateBedNumbers(roomNumber, numberOfBeds) {
    const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return Array.from({ length: numberOfBeds }, (_, index) => ({
      bedNumber: `${roomNumber}-${bedLetters[index]}`,
      isOccupied: false,
      occupiedBy: null
    }));
  }

  /**
   * Update subscription usage after room creation
   * @param {string} userId - User ID
   * @param {string} pgId - PG ID
   */
  async updateSubscriptionUsage(userId, pgId) {
    try {
      // Count total rooms for the PG
      const roomCount = await Room.countDocuments({
        pgId,
        isActive: true
      });

      // Update user subscription usage
      await UserSubscription.findOneAndUpdate(
        { 
          userId, 
          status: { $in: ['active', 'trial'] } 
        },
        { 
          $set: { 
            'usage.roomsUsed': roomCount 
          } 
        }
      );
    } catch (error) {
      logger.log('error', 'Failed to update subscription usage', {
        userId,
        pgId,
        error: error.message
      });
    }
  }

  /**
 * Delete a room
 * @param {string} roomId - ID of the room to delete
 * @param {string} userId - User performing the deletion
 * @returns {Promise<Object>} Deletion result
 */
async deleteRoom(roomId, userId) {
  try {
    // Find the room to delete
    const room = await Room.findById(roomId);
    
    if (!room) {
      return {
        success: false,
        message: 'Room not found',
        statusCode: 404
      };
    }

    // Check if room is occupied
    const occupiedBeds = room.beds.filter(bed => bed.isOccupied);
    if (occupiedBeds.length > 0) {
      return {
        success: false,
        message: 'Cannot delete a room with occupied beds',
        statusCode: 400
      };
    }

    // Soft delete the room
    room.isActive = false;
    await room.save();

    // Update subscription usage
    await this.updateSubscriptionUsage(userId, room.pgId);

    // Log room deletion
    logger.log('info', 'Room deleted successfully', {
      roomId,
      userId,
      pgId: room.pgId
    });

    return {
      success: true,
      message: 'Room deleted successfully',
      statusCode: 200,
      data: room
    };
  } catch (error) {
    logger.log('error', 'Room deletion error', {
      roomId,
      userId,
      error: error.message
    });

    return {
      success: false,
      message: 'Failed to delete room',
      error: error.message,
      statusCode: 500
    };
  }
}

  /**
   * Get available rooms for a PG
   * @param {string} pgId - PG ID
   * @param {string} sharingType - Optional sharing type filter
   * @returns {Promise<Object>} Available rooms result
   */
  async getAvailableRooms(pgId, sharingType = null) {
    try {
      // Build query for available rooms
      const query = {
        pgId,
        isActive: true
      };

      // Filter by sharing type if provided
      if (sharingType) {
        query.sharingType = sharingType;
      }

      // Get all rooms for the PG
      const rooms = await Room.find(query)
        .populate('floorId', 'name floorNumber')
        .populate('branchId', 'name')
        .sort({ floorId: 1, roomNumber: 1 });

      // Process rooms to determine availability
      const availableRooms = [];
      const unavailableRooms = [];

      for (const room of rooms) {
        // Count occupied beds
        const occupiedBeds = room.beds.filter(bed => bed.isOccupied).length;
        const totalBeds = room.beds.length;
        const availableBedCount = totalBeds - occupiedBeds;

        const roomInfo = {
          roomId: room._id,
          roomNumber: room.roomNumber,
          floorName: room.floorId?.name || 'Unknown',
          floorNumber: room.floorId?.floorNumber || 0,
          branchName: room.branchId?.name || 'Unknown',
          sharingType: room.sharingType,
          totalBeds,
          occupiedBeds,
          availableBedsCount: availableBedCount,
          cost: room.cost,
          amenities: room.amenities || [],
          isAvailable: availableBedCount > 0,
          availableBedNumbers: room.beds
            .filter(bed => !bed.isOccupied)
            .map(bed => bed.bedNumber),
          hasNoticePeriodBeds: false, // For future implementation
          numberOfBeds: totalBeds
        };

        if (roomInfo.isAvailable) {
          availableRooms.push(roomInfo);
        } else {
          unavailableRooms.push(roomInfo);
        }
      }

      return {
        success: true,
        message: 'Available rooms retrieved successfully',
        data: {
          availableRooms,
          unavailableRooms,
          totalAvailableRooms: availableRooms.length,
          totalUnavailableRooms: unavailableRooms.length
        },
        statusCode: 200
      };
    } catch (error) {
      logger.log('error', 'Get available rooms error', {
        pgId,
        sharingType,
        error: error.message
      });

      return {
        success: false,
        message: 'Failed to get available rooms',
        error: error.message,
        statusCode: 500
      };
    }
  }
}

module.exports = new RoomService(); 