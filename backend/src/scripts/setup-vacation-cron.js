const cron = require('node-cron');
const { processScheduledVacations } = require('./vacation-processor');
const logger = require('../utils/logger');

// Set up cron job to run vacation processor daily at 12:00 AM and 6:00 AM
const setupVacationCron = () => {
  // Schedule: Run every day at 12:00 AM
  cron.schedule('0 0 * * *', async () => {
    logger.info('🕐 Running scheduled vacation processor (12:00 AM)...');
    try {
      const result = await processScheduledVacations();
      if (result.success) {
        logger.info(`✅ Vacation processor completed successfully. Processed: ${result.processedCount}, Errors: ${result.errorCount}`);
      } else {
        logger.error('❌ Vacation processor failed:', result.error);
      }
    } catch (error) {
      logger.error('❌ Error in scheduled vacation processor:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });

  // Schedule: Run every day at 6:00 AM (additional check)
  cron.schedule('0 6 * * *', async () => {
    logger.info('🕐 Running scheduled vacation processor (6:00 AM)...');
    try {
      const result = await processScheduledVacations();
      if (result.success) {
        logger.info(`✅ Vacation processor completed successfully. Processed: ${result.processedCount}, Errors: ${result.errorCount}`);
      } else {
        logger.error('❌ Vacation processor failed:', result.error);
      }
    } catch (error) {
      logger.error('❌ Error in scheduled vacation processor:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });

  // Schedule: Run every hour to catch any missed vacations
  cron.schedule('0 * * * *', async () => {
    logger.info('🕐 Running hourly vacation processor check...');
    try {
      const result = await processScheduledVacations();
      if (result.success && result.processedCount > 0) {
        logger.info(`✅ Hourly vacation processor found and processed ${result.processedCount} overdue vacations`);
      }
    } catch (error) {
      logger.error('❌ Error in hourly vacation processor:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });

  logger.info('📅 Vacation processor cron jobs scheduled (12:00 AM, 6:00 AM, and hourly)');
};

// Manual trigger function for testing
const triggerVacationProcessor = async () => {
  logger.info('🔧 Manually triggering vacation processor...');
  try {
    const result = await processScheduledVacations();
    if (result.success) {
      logger.info(`✅ Manual vacation processor completed successfully. Processed: ${result.processedCount}, Errors: ${result.errorCount}`);
      return result;
    } else {
      logger.error('❌ Manual vacation processor failed:', result.error);
      return result;
    }
  } catch (error) {
    logger.error('❌ Error in manual vacation processor:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  setupVacationCron,
  triggerVacationProcessor
}; 