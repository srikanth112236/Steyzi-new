const Room = require('../models/room.model');
const Resident = require('../models/resident.model');

class NoticePeriodService {
  // Process expired notice period beds and auto-assign reserved beds
  async processExpiredNoticePeriodBeds() {
    try {
      console.log('🔄 Processing expired notice period beds...');
      
      const currentDate = new Date();
      
      // Find all rooms with notice period beds that have expired
      const rooms = await Room.find({
        'beds.reservation.status': 'pending'
      }).populate('beds.reservation.newResidentId', 'firstName lastName email phone');
      
      let processedCount = 0;
      
      for (const room of rooms) {
        for (const bed of room.beds) {
          if (bed.reservation && bed.reservation.status === 'pending') {
            // Check if the notice period has expired
            if (currentDate >= new Date(bed.reservation.expectedAvailabilityDate)) {
              try {
                // Auto-assign the bed to the reserved resident
                const result = await this.autoAssignReservedBed(room._id, bed.bedNumber);
                
                if (result.success) {
                  processedCount++;
                  console.log(`✅ Auto-assigned bed ${bed.bedNumber} in room ${room.roomNumber} to resident ${bed.reservation.newResidentId.firstName}`);
                }
              } catch (error) {
                console.error(`❌ Error auto-assigning bed ${bed.bedNumber} in room ${room.roomNumber}:`, error);
              }
            }
          }
        }
      }
      
      console.log(`✅ Processed ${processedCount} expired notice period beds`);
      
      return {
        success: true,
        processedCount,
        message: `Successfully processed ${processedCount} expired notice period beds`
      };
    } catch (error) {
      console.error('❌ Error processing expired notice period beds:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Auto-assign a reserved bed to the new resident
  async autoAssignReservedBed(roomId, bedNumber) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      const bed = room.beds.find(b => String(b.bedNumber) === String(bedNumber));
      if (!bed || !bed.reservation) {
        throw new Error('Bed or reservation not found');
      }

      // Get the current resident (in notice period)
      const currentResident = await Resident.findById(bed.occupiedBy);
      if (!currentResident) {
        throw new Error('Current resident not found');
      }

      // Get the new resident (reserved)
      const newResident = await Resident.findById(bed.reservation.newResidentId);
      if (!newResident) {
        throw new Error('New resident not found');
      }

      // Update current resident status to moved_out
      currentResident.status = 'moved_out';
      currentResident.checkOutDate = new Date();
      await currentResident.save();

      // Update bed assignment
      bed.isOccupied = true;
      bed.occupiedBy = newResident._id;
      bed.occupiedAt = new Date();
      
      // Update reservation status
      bed.reservation.status = 'completed';
      bed.reservation.completedAt = new Date();

      // Update new resident
      newResident.roomId = room.roomNumber;
      newResident.bedNumber = bed.bedNumber;
      newResident.checkInDate = new Date();
      newResident.status = 'active';
      await newResident.save();

      // Update room occupancy status
      room.isOccupied = room.beds.every(b => b.isOccupied);
      await room.save();

      // Log the auto-assignment
      console.log(`🔄 Auto-assigned bed ${bedNumber} in room ${room.roomNumber} from ${currentResident.firstName} to ${newResident.firstName}`);

      return {
        success: true,
        message: 'Bed auto-assigned successfully',
        data: {
          roomId: room._id,
          bedNumber: bed.bedNumber,
          previousResident: currentResident._id,
          newResident: newResident._id,
          assignedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error auto-assigning reserved bed:', error);
      throw error;
    }
  }

  // Get all pending notice period bed reservations
  async getPendingReservations() {
    try {
      const rooms = await Room.find({
        'beds.reservation.status': 'pending'
      }).populate('beds.reservation.newResidentId', 'firstName lastName email phone')
        .populate('beds.occupiedBy', 'firstName lastName status noticeDays checkOutDate');

      const reservations = [];
      
      rooms.forEach(room => {
        room.beds.forEach(bed => {
          if (bed.reservation && bed.reservation.status === 'pending') {
            reservations.push({
              roomId: room._id,
              roomNumber: room.roomNumber,
              bedNumber: bed.bedNumber,
              currentResident: bed.occupiedBy,
              newResident: bed.reservation.newResidentId,
              expectedAvailabilityDate: bed.reservation.expectedAvailabilityDate,
              reservationDate: bed.reservation.reservationDate
            });
          }
        });
      });

      return {
        success: true,
        data: reservations,
        count: reservations.length
      };
    } catch (error) {
      console.error('Error getting pending reservations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NoticePeriodService();
