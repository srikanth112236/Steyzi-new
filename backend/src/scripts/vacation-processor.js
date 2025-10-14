const mongoose = require('mongoose');
const Resident = require('../models/resident.model');
const Room = require('../models/room.model');
const logger = require('../utils/logger');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.log('info', 'Connected to MongoDB for vacation processing');
  } catch (error) {
    logger.log('error', 'Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Process scheduled vacations
const processScheduledVacations = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    logger.log('info', `🕐 Processing vacations for date: ${today.toDateString()}`);

    // Find residents with vacation date today or in the past
    const residentsToVacate = await Resident.find({
      status: 'notice_period',
      vacationDate: { $lte: today },
      isActive: true
    }).populate('roomId');

    logger.log('info', `Found ${residentsToVacate.length} residents to vacate today`);

    let processedCount = 0;
    let errorCount = 0;

    for (const resident of residentsToVacate) {
      try {
        logger.log('info', `Processing resident: ${resident.firstName} ${resident.lastName} (ID: ${resident._id})`);
        logger.log('info', `Vacation date: ${resident.vacationDate}, Today: ${today}`);

        if (!resident.roomId) {
          logger.log('warn', `Resident ${resident._id} has no room assignment, marking as inactive`);
          
          // Update resident status even without room
          resident.status = 'inactive';
          resident.checkOutDate = new Date();
          resident.vacationDate = null;
          resident.noticeDays = null;
          await resident.save();
          
          processedCount++;
          continue;
        }

        const room = await Room.findById(resident.roomId);
        if (!room) {
          logger.log('warn', `Room ${resident.roomId} not found for resident ${resident._id}, marking as inactive`);
          
          // Update resident status even without room
          resident.roomId = null;
          resident.bedNumber = null;
          resident.status = 'inactive';
          resident.checkOutDate = new Date();
          resident.vacationDate = null;
          resident.noticeDays = null;
          await resident.save();
          
          processedCount++;
          continue;
        }

        logger.log('info', `Unassigning bed ${resident.bedNumber} from room ${room.roomNumber}`);

        // Unassign bed
        const bedUnassigned = room.unassignBed(resident.bedNumber);
        if (!bedUnassigned) {
          logger.log('warn', `Failed to unassign bed ${resident.bedNumber} from room ${room.roomNumber}`);
        }

        await room.save();

        // Update resident
        resident.roomId = null;
        resident.bedNumber = null;
        resident.roomNumber = null;
        resident.status = 'inactive';
        resident.checkOutDate = new Date();
        resident.vacationDate = null;
        resident.noticeDays = null;
        await resident.save();

        logger.log('info', `✅ Successfully vacated resident ${resident._id} from room ${room._id}, bed ${resident.bedNumber}`);
        processedCount++;

      } catch (error) {
        logger.log('error', `❌ Error vacating resident ${resident._id}:`, error);
        errorCount++;
      }
    }

    logger.log('info', `🎉 Vacation processing completed. Processed: ${processedCount}, Errors: ${errorCount}`);

    return {
      success: true,
      processedCount,
      errorCount,
      totalFound: residentsToVacate.length
    };

  } catch (error) {
    logger.log('error', '❌ Error in vacation processing:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Run the processor
const runVacationProcessor = async () => {
  try {
    await connectDB();
    const result = await processScheduledVacations();
    
    // Close connection
    await mongoose.connection.close();
    logger.log('info', 'Vacation processor completed, connection closed');
    
    return result;
  } catch (error) {
    logger.log('error', 'Error in vacation processor:', error);
    await mongoose.connection.close();
    return {
      success: false,
      error: error.message
    };
  }
};

// Run if called directly
if (require.main === module) {
  runVacationProcessor().then(result => {
    console.log('Vacation processor result:', result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = {
  processScheduledVacations,
  runVacationProcessor
}; 