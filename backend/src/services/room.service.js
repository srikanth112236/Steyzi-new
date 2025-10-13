const Room = require('../models/room.model');
const Floor = require('../models/floor.model');
const PG = require('../models/pg.model');
const Branch = require('../models/branch.model');
const User = require('../models/user.model');

class RoomService {
  /**
   * Check if user can add beds based on subscription limits
   */
  async checkSubscriptionLimits(userId, bedsToAdd) {
    try {
      // Get user with subscription
      const user = await User.findById(userId).populate('subscription.planId');
      if (!user?.subscription) {
        return {
          allowed: false,
          message: 'No active subscription found',
          upgradeRequired: true
        };
      }

      const subscription = user.subscription;
      const plan = subscription.planId;

      // Check if subscription allows bed creation
      const allowedStatuses = ['active', 'free', 'trial'];
      if (!allowedStatuses.includes(subscription.status)) {
        return {
          allowed: false,
          message: 'Subscription is not active. Please upgrade your subscription.',
          upgradeRequired: true
        };
      }

      // Check trial expiration
      if (subscription.billingCycle === 'trial' && subscription.trialEndDate) {
        const now = new Date();
        const trialEnd = new Date(subscription.trialEndDate);
        if (trialEnd <= now) {
          return {
            allowed: false,
            message: 'Your free trial has expired. Please upgrade your subscription to add more beds.',
            upgradeRequired: true,
            trialExpired: true
          };
        }
      }

      // Get current bed usage
      const currentBedsUsed = subscription.usage?.bedsUsed || 0;

      // Set default limits based on subscription type
      let maxBedsAllowed = 0;
      if (subscription.status === 'free') {
        // Free users get a basic limit
        maxBedsAllowed = 5; // Allow 5 beds for free users
      } else if (subscription.status === 'trial') {
        // Trial users get a trial limit
        maxBedsAllowed = 10; // Allow 10 beds for trial users
      } else if (plan) {
        // Paid users get plan-based limits
        maxBedsAllowed = subscription.customPricing?.maxBedsAllowed ||
                        plan.maxBedsAllowed ||
                        plan.baseBedCount || 0;
      }

      const totalBedsAfterAddition = currentBedsUsed + bedsToAdd;

      // Check if this would exceed limits
      if (totalBedsAfterAddition > maxBedsAllowed) {
        const remainingBeds = Math.max(0, maxBedsAllowed - currentBedsUsed);

        if (subscription.status === 'trial' || subscription.billingCycle === 'trial') {
          return {
            allowed: false,
            message: `You're in a free trial with ${maxBedsAllowed} beds limit. You've used ${currentBedsUsed} beds and can add ${remainingBeds} more beds. Upgrade to add more beds.`,
            upgradeRequired: true,
            trialLimit: true,
            currentUsage: currentBedsUsed,
            limit: maxBedsAllowed,
            remaining: remainingBeds,
            requested: bedsToAdd
          };
        } else if (subscription.status === 'free') {
          return {
            allowed: false,
            message: `Free plan allows up to ${maxBedsAllowed} beds. You've used ${currentBedsUsed} beds and can add ${remainingBeds} more beds. Upgrade to add more beds.`,
            upgradeRequired: true,
            freeLimit: true,
            currentUsage: currentBedsUsed,
            limit: maxBedsAllowed,
            remaining: remainingBeds,
            requested: bedsToAdd
          };
        } else {
          return {
            allowed: false,
            message: `Bed limit exceeded. You have ${remainingBeds} beds remaining out of ${maxBedsAllowed} allowed. Please upgrade your plan or contact support.`,
            upgradeRequired: true,
            paidLimit: true,
            currentUsage: currentBedsUsed,
            limit: maxBedsAllowed,
            remaining: remainingBeds,
            requested: bedsToAdd
          };
        }
      }

      return {
        allowed: true,
        currentUsage: currentBedsUsed,
        limit: maxBedsAllowed,
        remaining: maxBedsAllowed - currentBedsUsed
      };

    } catch (error) {
      console.error('Error checking subscription limits:', error);
      return {
        allowed: false,
        message: 'Unable to verify subscription limits. Please try again.',
        upgradeRequired: false
      };
    }
  }

  // Get all rooms for a PG with resident information (with optional branch filtering)
  async getRoomsByPG(pgId, branchId = null) {
    try {
      const query = { pgId, isActive: true };
      
      // Add branch filtering if branchId is provided
      if (branchId) {
        query.branchId = branchId;
      }
      
      const rooms = await Room.find(query)
        .populate('floorId', 'name')
        .populate('branchId', 'name address')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
      
      // Populate resident information for each bed
      const roomsWithResidents = await Promise.all(rooms.map(async (room) => {
        const roomObj = room.toObject();
        
        // Get resident information for each bed
        roomObj.beds = await Promise.all(roomObj.beds.map(async (bed) => {
          if (bed.isOccupied && bed.occupiedBy) {
            const Resident = require('../models/resident.model');
            const resident = await Resident.findById(bed.occupiedBy)
              .select('firstName lastName email phone status noticeDays vacationDate');
            
            if (resident) {
              return {
                ...bed,
                resident: {
                  _id: resident._id,
                  firstName: resident.firstName,
                  lastName: resident.lastName,
                  email: resident.email,
                  phone: resident.phone,
                  noticeDays: resident.noticeDays,
                  vacationDate: resident.vacationDate
                },
                residentStatus: resident.status
              };
            }
          }
          return bed;
        }));
        
        // Calculate virtual fields with proper notice period handling
        roomObj.availableBeds = roomObj.beds.filter(bed => !bed.isOccupied).length;
        roomObj.occupiedBeds = roomObj.beds.filter(bed => bed.isOccupied && bed.residentStatus === 'active').length;
        roomObj.noticePeriodBeds = roomObj.beds.filter(bed => bed.isOccupied && bed.residentStatus === 'notice_period').length;
        
        // Calculate room-level status
        if (roomObj.noticePeriodBeds > 0) {
          roomObj.roomStatus = 'notice_period';
        } else if (roomObj.occupiedBeds === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_occupied';
        } else if (roomObj.availableBeds === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_available';
        } else {
          roomObj.roomStatus = 'partially_occupied';
        }
        
        return roomObj;
      }));
      
      return {
        success: true,
        data: roomsWithResidents,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting rooms:', error);
      return {
        success: false,
        message: 'Failed to get rooms',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get rooms by floor with resident information
  async getRoomsByFloor(floorId) {
    try {
      const rooms = await Room.find({ floorId, isActive: true })
        .populate('floorId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'firstName lastName email')
        .sort({ roomNumber: 1 });
      
      // Populate resident information for each bed
      const roomsWithResidents = await Promise.all(rooms.map(async (room) => {
        const roomObj = room.toObject();
        
        // Get resident information for each bed
        roomObj.beds = await Promise.all(roomObj.beds.map(async (bed) => {
          if (bed.isOccupied && bed.occupiedBy) {
            const Resident = require('../models/resident.model');
            const resident = await Resident.findById(bed.occupiedBy)
              .select('firstName lastName email phone status noticeDays vacationDate');
            
            if (resident) {
              return {
                ...bed,
                resident: {
                  _id: resident._id,
                  firstName: resident.firstName,
                  lastName: resident.lastName,
                  email: resident.email,
                  phone: resident.phone,
                  noticeDays: resident.noticeDays,
                  vacationDate: resident.vacationDate
                },
                residentStatus: resident.status
              };
            }
          }
          return bed;
        }));
        
        // Calculate virtual fields with proper notice period handling
        roomObj.availableBeds = roomObj.beds.filter(bed => !bed.isOccupied).length;
        roomObj.occupiedBeds = roomObj.beds.filter(bed => bed.isOccupied && bed.residentStatus === 'active').length;
        roomObj.noticePeriodBeds = roomObj.beds.filter(bed => bed.isOccupied && bed.residentStatus === 'notice_period').length;
        
        // Calculate room-level status
        if (roomObj.noticePeriodBeds > 0) {
          roomObj.roomStatus = 'notice_period';
        } else if (roomObj.occupiedBeds === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_occupied';
        } else if (roomObj.availableBeds === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_available';
        } else {
          roomObj.roomStatus = 'partially_occupied';
        }
        
        return roomObj;
      }));
      
      return {
        success: true,
        data: roomsWithResidents,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting rooms by floor:', error);
      return {
        success: false,
        message: 'Failed to get rooms',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get room by ID with resident information
  async getRoomById(roomId) {
    try {
      const room = await Room.findById(roomId)
        .populate('floorId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'firstName lastName email')
        .populate('pgId', 'name');
      
      if (!room) {
        return {
          success: false,
          message: 'Room not found',
          statusCode: 404
        };
      }
      
      // Populate resident information for each bed
      const roomObj = room.toObject();
      roomObj.beds = await Promise.all(roomObj.beds.map(async (bed) => {
        if (bed.isOccupied && bed.occupiedBy) {
          const Resident = require('../models/resident.model');
          const resident = await Resident.findById(bed.occupiedBy)
            .select('firstName lastName email phone status noticeDays vacationDate');
          
          if (resident) {
            return {
              ...bed,
              resident: {
                _id: resident._id,
                firstName: resident.firstName,
                lastName: resident.lastName,
                email: resident.email,
                phone: resident.phone,
                noticeDays: resident.noticeDays,
                vacationDate: resident.vacationDate
              },
              residentStatus: resident.status
            };
          }
        }
        return bed;
      }));
      
              // Calculate virtual fields with proper notice period handling
        roomObj.availableBeds = roomObj.beds.filter(bed => !bed.isOccupied).length;
        roomObj.occupiedBeds = roomObj.beds.filter(bed => bed.isOccupied && bed.residentStatus === 'active').length;
        roomObj.noticePeriodBeds = roomObj.beds.filter(bed => bed.isOccupied && bed.residentStatus === 'notice_period').length;
        
        // Calculate room-level status
        if (roomObj.noticePeriodBeds > 0) {
          roomObj.roomStatus = 'notice_period';
        } else if (roomObj.occupiedBeds === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_occupied';
        } else if (roomObj.availableBeds === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_available';
        } else {
          roomObj.roomStatus = 'partially_occupied';
        }
      
      return {
        success: true,
        data: roomObj,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting room:', error);
      return {
        success: false,
        message: 'Failed to get room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Create new room
  async createRoom(roomData, userId) {
    try {
      // Check if PG exists
      const pg = await PG.findById(roomData.pgId);
      if (!pg) {
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      // Check if floor exists
      const floor = await Floor.findById(roomData.floorId);
      if (!floor) {
        return {
          success: false,
          message: 'Floor not found',
          statusCode: 404
        };
      }

      // Get branchId from floor if not provided
      let branchId = roomData.branchId;
      if (!branchId) {
        branchId = floor.branchId;
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

      // Check if room number already exists for this branch
      const existingRoom = await Room.findOne({
        pgId: roomData.pgId,
        branchId: branchId,
        roomNumber: roomData.roomNumber,
        isActive: true
      });

      if (existingRoom) {
        return {
          success: false,
          message: 'Room with this number already exists in this branch',
          statusCode: 400
        };
      }

      // Validate sharing type
      const validSharingTypes = ['1-sharing', '2-sharing', '3-sharing', '4-sharing'];
      if (!validSharingTypes.includes(roomData.sharingType)) {
        return {
          success: false,
          message: 'Invalid sharing type',
          statusCode: 400
        };
      }

      // Check subscription limits for bed creation
      const bedsToAdd = roomData.numberOfBeds || 1;
      const subscriptionCheck = await this.checkSubscriptionLimits(userId, bedsToAdd);

      if (!subscriptionCheck.allowed) {
        return {
          success: false,
          message: subscriptionCheck.message,
          statusCode: 403,
          subscriptionError: true,
          upgradeRequired: subscriptionCheck.upgradeRequired
        };
      }

      // Extract custom bed numbers if provided
      const customBedNumbers = roomData.bedNumbers || [];
      
      const room = new Room({
        ...roomData,
        branchId: branchId,
        createdBy: userId
      });

      // Initialize beds with custom bed numbers
      room.initializeBeds(customBedNumbers);

      await room.save();

      const populatedRoom = await Room.findById(room._id)
        .populate('floorId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'firstName lastName email');

      return {
        success: true,
        data: populatedRoom,
        message: 'Room created successfully',
        statusCode: 201
      };
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        success: false,
        message: 'Failed to create room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Update room
  async updateRoom(roomId, updateData, userId) {
    try {
      const room = await Room.findById(roomId);
      
      if (!room) {
        return {
          success: false,
          message: 'Room not found',
          statusCode: 404
        };
      }

      // Handle branchId update
      let branchId = updateData.branchId || room.branchId;
      if (updateData.branchId && updateData.branchId !== room.branchId.toString()) {
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

      // Check if room number already exists for this branch (excluding current room)
      if (updateData.roomNumber && updateData.roomNumber !== room.roomNumber) {
        const existingRoom = await Room.findOne({
          pgId: room.pgId,
          branchId: branchId,
          roomNumber: updateData.roomNumber,
          isActive: true,
          _id: { $ne: roomId }
        });

        if (existingRoom) {
          return {
            success: false,
            message: 'Room with this number already exists in this branch',
            statusCode: 400
          };
        }
      }

      // Check if floor exists (if floor is being updated)
      if (updateData.floorId && updateData.floorId !== room.floorId.toString()) {
        const floor = await Floor.findById(updateData.floorId);
        if (!floor) {
          return {
            success: false,
            message: 'Floor not found',
            statusCode: 404
          };
        }
        // Update branchId to match the new floor's branch
        branchId = floor.branchId;
      }

      // Validate sharing type if being updated
      if (updateData.sharingType) {
        const validSharingTypes = ['1-sharing', '2-sharing', '3-sharing', '4-sharing'];
        if (!validSharingTypes.includes(updateData.sharingType)) {
          return {
            success: false,
            message: 'Invalid sharing type',
            statusCode: 400
          };
        }
      }

      // Update room data
      Object.assign(room, updateData);
      room.branchId = branchId;
      await room.save();

      const updatedRoom = await Room.findById(roomId)
        .populate('floorId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'firstName lastName email');

      return {
        success: true,
        data: updatedRoom,
        message: 'Room updated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error updating room:', error);
      return {
        success: false,
        message: 'Failed to update room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Delete room
  async deleteRoom(roomId, userId) {
    try {
      const room = await Room.findById(roomId);
      
      if (!room) {
        return {
          success: false,
          message: 'Room not found',
          statusCode: 404
        };
      }

      // Check if room is occupied
      if (room.isOccupied) {
        return {
          success: false,
          message: 'Cannot delete occupied room. Please vacate the room first.',
          statusCode: 400
        };
      }

      // Soft delete the room
      room.isActive = false;
      await room.save();

      return {
        success: true,
        message: 'Room deleted successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error deleting room:', error);
      return {
        success: false,
        message: 'Failed to delete room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get room statistics
  async getRoomStats(pgId) {
    try {
      const rooms = await Room.find({ pgId, isActive: true });
      
      const stats = {
        totalRooms: rooms.length,
        occupiedRooms: rooms.filter(room => room.isOccupied).length,
        availableRooms: rooms.filter(room => !room.isOccupied).length,
        sharingTypeStats: {
          '1-sharing': rooms.filter(room => room.sharingType === '1-sharing').length,
          '2-sharing': rooms.filter(room => room.sharingType === '2-sharing').length,
          '3-sharing': rooms.filter(room => room.sharingType === '3-sharing').length,
          '4-sharing': rooms.filter(room => room.sharingType === '4-sharing').length
        },
        totalBeds: rooms.reduce((sum, room) => sum + room.numberOfBeds, 0),
        totalRevenue: rooms.reduce((sum, room) => sum + room.cost, 0)
      };

      return {
        success: true,
        data: stats,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting room stats:', error);
      return {
        success: false,
        message: 'Failed to get room statistics',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get available rooms with detailed bed status information
  async getAvailableRooms(pgId, sharingType = null) {
    try {
      const query = { 
        pgId, 
        isActive: true
      };
      
      // Filter by sharing type if provided
      if (sharingType) {
        query.sharingType = sharingType;
      }
      
      const rooms = await Room.find(query)
        .populate('floorId', 'name')
        .populate({
          path: 'beds.occupiedBy',
          select: 'firstName lastName status noticeDays checkOutDate contractEndDate',
          model: 'Resident'
        })
        .sort({ roomNumber: 1 });
      
      // Enhance room data with detailed bed status
      const roomsWithBeds = rooms.map(room => {
        const roomObj = room.toObject();
        
        // Process each bed with detailed status
        roomObj.beds = roomObj.beds.map(bed => {
          const bedData = { ...bed };
          
          if (bed.isOccupied && bed.occupiedBy) {
            // Add resident status and notice period info
            bedData.residentStatus = bed.occupiedBy.status;
            bedData.resident = {
              _id: bed.occupiedBy._id,
              firstName: bed.occupiedBy.firstName,
              lastName: bed.occupiedBy.lastName,
              status: bed.occupiedBy.status,
              noticeDays: bed.occupiedBy.noticeDays,
              checkOutDate: bed.occupiedBy.checkOutDate,
              contractEndDate: bed.occupiedBy.contractEndDate
            };
            
            // Remove the populated occupiedBy field to avoid duplication
            delete bedData.occupiedBy;
          } else {
            bedData.residentStatus = 'available';
            bedData.resident = null;
          }
          
          return bedData;
        });
        
        // Calculate bed counts by status
        const availableBeds = roomObj.beds.filter(bed => !bed.isOccupied);
        const occupiedBeds = roomObj.beds.filter(bed => 
          bed.isOccupied && bed.residentStatus === 'active'
        );
        const noticePeriodBeds = roomObj.beds.filter(bed => 
          bed.isOccupied && bed.residentStatus === 'notice_period'
        );
        
        // Calculate room-level status
        if (noticePeriodBeds.length > 0) {
          roomObj.roomStatus = 'notice_period';
        } else if (occupiedBeds.length === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_occupied';
        } else if (availableBeds.length === roomObj.beds.length) {
          roomObj.roomStatus = 'fully_available';
        } else {
          roomObj.roomStatus = 'partially_occupied';
        }
        
        // Add calculated fields
        roomObj.availableBeds = availableBeds;
        roomObj.occupiedBeds = occupiedBeds;
        roomObj.noticePeriodBeds = noticePeriodBeds;
        roomObj.availableBedsCount = availableBeds.length;
        roomObj.occupiedBedsCount = occupiedBeds.length;
        roomObj.noticePeriodBedsCount = noticePeriodBeds.length;
        roomObj.hasAvailableBeds = availableBeds.length > 0;
        roomObj.hasNoticePeriodBeds = noticePeriodBeds.length > 0;
        
        // Add notice period information for onboarding
        if (noticePeriodBeds.length > 0) {
          roomObj.noticePeriodInfo = {
            totalBeds: noticePeriodBeds.length,
            earliestAvailability: Math.min(...noticePeriodBeds.map(bed => 
              bed.resident?.noticeDays || 0
            )),
            latestAvailability: Math.max(...noticePeriodBeds.map(bed => 
              bed.resident?.noticeDays || 0
            )),
            beds: noticePeriodBeds.map(bed => ({
              bedNumber: bed.bedNumber,
              residentName: `${bed.resident?.firstName} ${bed.resident?.lastName}`,
              noticeDays: bed.resident?.noticeDays,
              checkOutDate: bed.resident?.checkOutDate
            }))
          };
        }
        
        return roomObj;
      });
      
      return {
        success: true,
        data: roomsWithBeds,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting available rooms:', error);
      return {
        success: false,
        message: 'Failed to get available rooms',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Auto-assign notice period bed after expiry
  async autoAssignNoticePeriodBed(roomId, bedNumber, residentId) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        return {
          success: false,
          message: 'Room not found',
          statusCode: 404
        };
      }

      // Find the specific bed
      const bed = room.beds.find(b => String(b.bedNumber) === String(bedNumber));
      if (!bed) {
        return {
          success: false,
          message: 'Bed not found',
          statusCode: 404
        };
      }

      // Check if bed is in notice period
      if (!bed.isOccupied || !bed.occupiedBy) {
        return {
          success: false,
          message: 'Bed is not occupied',
          statusCode: 400
        };
      }

      // Get resident to check notice period status
      const Resident = require('../models/resident.model');
      const resident = await Resident.findById(bed.occupiedBy);
      
      if (!resident || resident.status !== 'notice_period') {
        return {
          success: false,
          message: 'Bed is not in notice period',
          statusCode: 400
        };
      }

      // Check if notice period has expired
      const currentDate = new Date();
      const checkOutDate = new Date(resident.checkOutDate);
      
      if (currentDate < checkOutDate) {
        return {
          success: false,
          message: 'Notice period has not expired yet',
          statusCode: 400
        };
      }

      // Unassign the current resident from the bed
      bed.isOccupied = false;
      bed.occupiedBy = null;
      bed.occupiedAt = null;

      // Update room occupancy status
      room.isOccupied = room.beds.every(b => b.isOccupied);

      // Save room changes
      await room.save();

      // Update resident status to moved_out
      resident.status = 'moved_out';
      resident.checkOutDate = currentDate;
      await resident.save();

      // Log the auto-assignment
      console.log(`Auto-assigned bed ${bedNumber} in room ${room.roomNumber} after notice period expiry`);

      return {
        success: true,
        message: 'Bed auto-assigned successfully after notice period expiry',
        data: {
          roomId: room._id,
          bedNumber: bed.bedNumber,
          previousResident: resident._id,
          assignedAt: currentDate
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error auto-assigning notice period bed:', error);
      return {
        success: false,
        message: 'Failed to auto-assign bed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Reserve notice period bed for future assignment
  async reserveNoticePeriodBed(roomId, bedNumber, residentId, expectedAvailabilityDate) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        return {
          success: false,
          message: 'Room not found',
          statusCode: 404
        };
      }

      // Find the specific bed
      const bed = room.beds.find(b => String(b.bedNumber) === String(bedNumber));
      if (!bed) {
        return {
          success: false,
          message: 'Bed not found',
          statusCode: 404
        };
      }

      // Check if bed is in notice period
      if (!bed.isOccupied || !bed.occupiedBy) {
        return {
          success: false,
          message: 'Bed is not occupied',
          statusCode: 400
        };
      }

      // Get resident to check notice period status
      const Resident = require('../models/resident.model');
      const currentResident = await Resident.findById(bed.occupiedBy);
      
      if (!currentResident || currentResident.status !== 'notice_period') {
        return {
          success: false,
          message: 'Bed is not in notice period',
          statusCode: 400
        };
      }

      // Create a reservation record
      const reservation = {
        bedNumber: bed.bedNumber,
        currentResidentId: currentResident._id,
        newResidentId: residentId,
        expectedAvailabilityDate: new Date(expectedAvailabilityDate),
        reservationDate: new Date(),
        status: 'pending'
      };

      // Add reservation to the bed
      bed.reservation = reservation;

      // Save room changes
      await room.save();

      // Log the reservation
      console.log(`Bed ${bedNumber} in room ${room.roomNumber} reserved for resident ${residentId} after notice period expiry`);

      return {
        success: true,
        message: 'Notice period bed reserved successfully',
        data: {
          roomId: room._id,
          bedNumber: bed.bedNumber,
          currentResident: currentResident._id,
          newResident: residentId,
          expectedAvailabilityDate: reservation.expectedAvailabilityDate,
          reservationDate: reservation.reservationDate
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error reserving notice period bed:', error);
      return {
        success: false,
        message: 'Failed to reserve notice period bed',
        error: error.message,
        statusCode: 500
      };
    }
  }
}

module.exports = new RoomService(); 