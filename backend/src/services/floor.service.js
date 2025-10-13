const Floor = require('../models/floor.model');
const Room = require('../models/room.model');
const PG = require('../models/pg.model');
const Branch = require('../models/branch.model');

class FloorService {
  // Get all floors for a PG (with optional branch filtering)
  async getFloorsByPG(pgId, branchId = null) {
    try {
      const query = { pgId, isActive: true };
      
      // Add branch filtering if branchId is provided
      if (branchId) {
        query.branchId = branchId;
      }
      
      const floors = await Floor.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('branchId', 'name address')
        .sort({ createdAt: -1 });
      
      return {
        success: true,
        data: floors,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting floors:', error);
      return {
        success: false,
        message: 'Failed to get floors',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get floor by ID
  async getFloorById(floorId) {
    try {
      const floor = await Floor.findById(floorId)
        .populate('createdBy', 'firstName lastName email')
        .populate('pgId', 'name')
        .populate('branchId', 'name');
      
      if (!floor) {
        return {
          success: false,
          message: 'Floor not found',
          statusCode: 404
        };
      }
      
      return {
        success: true,
        data: floor,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting floor:', error);
      return {
        success: false,
        message: 'Failed to get floor',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Create new floor
  async createFloor(floorData, userId) {
    try {
      // Check if PG exists
      const pg = await PG.findById(floorData.pgId);
      if (!pg) {
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      // Get the default branch for this PG if branchId is not provided
      let branchId = floorData.branchId;
      if (!branchId) {
        const defaultBranch = await Branch.findOne({ pgId: floorData.pgId, isDefault: true, isActive: true });
        if (!defaultBranch) {
          return {
            success: false,
            message: 'No default branch found. Please set up a default branch first.',
            statusCode: 400
          };
        }
        branchId = defaultBranch._id;
      }

      // Check if branch exists
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }

      // Check if floor name already exists for this branch
      const existingFloor = await Floor.findOne({
        pgId: floorData.pgId,
        branchId: branchId,
        name: floorData.name,
        isActive: true
      });

      if (existingFloor) {
        return {
          success: false,
          message: 'Floor with this name already exists in this branch',
          statusCode: 400
        };
      }

      const floor = new Floor({
        ...floorData,
        branchId: branchId,
        createdBy: userId
      });

      await floor.save();

      const populatedFloor = await Floor.findById(floor._id)
        .populate('createdBy', 'firstName lastName email')
        .populate('branchId', 'name');

      return {
        success: true,
        data: populatedFloor,
        message: 'Floor created successfully',
        statusCode: 201
      };
    } catch (error) {
      console.error('Error creating floor:', error);
      return {
        success: false,
        message: 'Failed to create floor',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Update floor
  async updateFloor(floorId, updateData, userId) {
    try {
      const floor = await Floor.findById(floorId);
      
      if (!floor) {
        return {
          success: false,
          message: 'Floor not found',
          statusCode: 404
        };
      }

      // Handle branchId update
      let branchId = updateData.branchId || floor.branchId;
      if (updateData.branchId && updateData.branchId !== floor.branchId.toString()) {
        // Check if new branch exists
        const branch = await Branch.findById(updateData.branchId);
        if (!branch) {
          return {
            success: false,
            message: 'Branch not found',
            statusCode: 404
          };
        }
        branchId = updateData.branchId;
      }

      // Check if floor name already exists for this branch (excluding current floor)
      if (updateData.name && updateData.name !== floor.name) {
        const existingFloor = await Floor.findOne({
          pgId: floor.pgId,
          branchId: branchId,
          name: updateData.name,
          isActive: true,
          _id: { $ne: floorId }
        });

        if (existingFloor) {
          return {
            success: false,
            message: 'Floor with this name already exists in this branch',
            statusCode: 400
          };
        }
      }

      // Update floor data
      Object.assign(floor, updateData);
      floor.branchId = branchId;
      await floor.save();

      const updatedFloor = await Floor.findById(floorId)
        .populate('createdBy', 'firstName lastName email')
        .populate('branchId', 'name');

      return {
        success: true,
        data: updatedFloor,
        message: 'Floor updated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error updating floor:', error);
      return {
        success: false,
        message: 'Failed to update floor',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Delete floor
  async deleteFloor(floorId, userId) {
    try {
      const floor = await Floor.findById(floorId);
      
      if (!floor) {
        return {
          success: false,
          message: 'Floor not found',
          statusCode: 404
        };
      }

      // Check if floor has rooms
      const roomsCount = await Room.countDocuments({ floorId, isActive: true });
      
      if (roomsCount > 0) {
        return {
          success: false,
          message: `Cannot delete floor. It has ${roomsCount} active room(s). Please delete all rooms first.`,
          statusCode: 400
        };
      }

      // Soft delete the floor
      floor.isActive = false;
      await floor.save();

      return {
        success: true,
        message: 'Floor deleted successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error deleting floor:', error);
      return {
        success: false,
        message: 'Failed to delete floor',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get floor statistics
  async getFloorStats(pgId) {
    try {
      const floors = await Floor.find({ pgId, isActive: true });
      const rooms = await Room.find({ pgId, isActive: true });

      const stats = floors.map(floor => {
        const floorRooms = rooms.filter(room => room.floorId.toString() === floor._id.toString());
        const occupiedRooms = floorRooms.filter(room => room.isOccupied);
        
        return {
          floorId: floor._id,
          floorName: floor.name,
          totalRooms: floor.totalRooms,
          activeRooms: floorRooms.length,
          occupiedRooms: occupiedRooms.length,
          availableRooms: floorRooms.length - occupiedRooms.length
        };
      });

      return {
        success: true,
        data: stats,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting floor stats:', error);
      return {
        success: false,
        message: 'Failed to get floor statistics',
        error: error.message,
        statusCode: 500
      };
    }
  }
}

module.exports = new FloorService(); 