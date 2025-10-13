const cron = require('node-cron');
const ResidentService = require('../services/resident.service');
const logger = require('../utils/logger');

/**
 * Setup cron job to update payment status daily at 12:01 AM
 * This ensures payment status is updated based on current date
 */
const setupPaymentStatusCron = () => {
  // Run daily at 12:01 AM
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('🕐 Payment Status Cron: Starting daily payment status update...');
      logger.info('Payment Status Cron: Starting daily payment status update');
      
      // Get all PGs and update payment status for each
      const Pg = require('../models/pg.model');
      const pgs = await Pg.find({ isActive: true });
      
      let totalUpdated = 0;
      
      for (const pg of pgs) {
        try {
          const result = await ResidentService.updateAllResidentsPaymentStatus(pg._id);
          if (result.success) {
            totalUpdated += result.data.updatedCount || 0;
            console.log(`✅ Updated ${result.data.updatedCount || 0} residents in PG: ${pg.name}`);
            logger.info(`Updated ${result.data.updatedCount || 0} residents in PG: ${pg.name}`);
          }
        } catch (error) {
          console.error(`❌ Error updating residents in PG ${pg.name}:`, error.message);
          logger.error(`Error updating residents in PG ${pg.name}: ${error.message}`);
        }
      }
      
      console.log(`🎉 Payment Status Cron: Completed! Total updated: ${totalUpdated} residents`);
      logger.info(`Payment Status Cron: Completed! Total updated: ${totalUpdated} residents`);
      
    } catch (error) {
      console.error('❌ Payment Status Cron: Error in daily update:', error);
      logger.error(`Payment Status Cron: Error in daily update: ${error.message}`);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });
  
  console.log('✅ Payment Status Cron: Scheduled daily at 12:01 AM IST');
  logger.info('Payment Status Cron: Scheduled daily at 12:01 AM IST');
};

module.exports = { setupPaymentStatusCron }; 