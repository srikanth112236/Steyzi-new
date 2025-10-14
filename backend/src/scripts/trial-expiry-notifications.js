const cron = require('node-cron');
const mongoose = require('mongoose');
const UserSubscription = require('../models/userSubscription.model');
const User = require('../models/user.model');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

require('dotenv').config();

/**
 * Send trial expiry notifications to users whose trials expire in 3 days
 */
async function sendTrialExpiryNotifications() {
  try {
    logger.log('info', '⏰ Starting trial expiry notification process...');

    // Calculate date 3 days from now
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find active trials expiring in exactly 3 days
    const expiringTrials = await UserSubscription.find({
      billingCycle: 'trial',
      status: 'trial',
      trialEndDate: {
        $gte: new Date(threeDaysFromNow.setHours(0, 0, 0, 0)), // Start of day 3 days from now
        $lt: new Date(threeDaysFromNow.setHours(23, 59, 59, 999)) // End of day 3 days from now
      }
    }).populate('userId', 'firstName lastName email');

    logger.log('info', `📧 Found ${expiringTrials.length} trials expiring in 3 days`);

    for (const trial of expiringTrials) {
      try {
        const user = trial.userId;
        if (!user || !user.email) {
          logger.warn(`⚠️ User or email not found for trial: ${trial._id}`);
          continue;
        }

        const daysLeft = Math.ceil((new Date(trial.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));

        // Send email notification
        await emailService.sendTrialExpiryNotification({
          to: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          daysLeft: daysLeft,
          expiryDate: trial.trialEndDate
        });

        logger.log('info', `📧 Trial expiry notification sent to ${user.email} (${daysLeft} days left)`);

        // Add small delay to avoid overwhelming email service
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.log('error', `❌ Error sending notification for trial ${trial._id}:`, error);
      }
    }

    logger.log('info', '✅ Trial expiry notification check completed');

  } catch (error) {
    logger.log('error', '❌ Error in trial expiry notification check:', error);
  }
}

/**
 * Send trial expired notifications (for trials that just expired)
 */
async function sendTrialExpiredNotifications() {
  try {
    logger.log('info', '🔄 Starting trial expired notification check...');

    // Find trials that expired in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const expiredTrials = await UserSubscription.find({
      billingCycle: 'trial',
      status: 'expired', // Already marked as expired by the system
      trialEndDate: {
        $gte: yesterday,
        $lt: new Date()
      }
    }).populate('userId', 'firstName lastName email');

    logger.log('info', `📧 Found ${expiredTrials.length} trials that expired recently`);

    for (const trial of expiredTrials) {
      try {
        const user = trial.userId;
        if (!user || !user.email) {
          logger.warn(`⚠️ User or email not found for expired trial: ${trial._id}`);
          continue;
        }

        // Send expired notification
        await emailService.sendTrialExpiredNotification({
          to: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          expiredDate: trial.trialEndDate
        });

        logger.log('info', `📧 Trial expired notification sent to ${user.email}`);

        // Add small delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.log('error', `❌ Error sending expired notification for trial ${trial._id}:`, error);
      }
    }

    logger.log('info', '✅ Trial expired notification check completed');

  } catch (error) {
    logger.log('error', '❌ Error in trial expired notification check:', error);
  }
}

/**
 * Start the cron jobs for trial notifications
 */
function startTrialNotificationCron() {
  logger.log('info', '🚀 Starting trial notification cron jobs...');

  // Run trial expiry notifications daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.log('info', '⏰ Running daily trial expiry notification check');
    await sendTrialExpiryNotifications();
  });

  // Run trial expired notifications daily at 10 AM
  cron.schedule('0 10 * * *', async () => {
    logger.log('info', '⏰ Running daily trial expired notification check');
    await sendTrialExpiredNotifications();
  });

  // Also run immediately for testing
  if (process.env.NODE_ENV === 'development') {
    logger.log('info', '🧪 Running trial notifications immediately for testing');
    setTimeout(() => {
      sendTrialExpiryNotifications();
      sendTrialExpiredNotifications();
    }, 5000); // 5 second delay
  }

  logger.log('info', '✅ Trial notification cron jobs started successfully');
}

/**
 * Manual execution for testing
 */
async function runManualCheck() {
  logger.log('info', '🔧 Running manual trial notification check...');

  // Connect to database if not connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.log('info', '📡 Connected to MongoDB');
  }

  await sendTrialExpiryNotifications();
  await sendTrialExpiredNotifications();

  // Disconnect if we connected manually
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    logger.log('info', '📡 Disconnected from MongoDB');
  }
}

// Export functions
module.exports = {
  startTrialNotificationCron,
  sendTrialExpiryNotifications,
  sendTrialExpiredNotifications,
  runManualCheck
};

// If run directly, execute manual check
if (require.main === module) {
  runManualCheck()
    .then(() => {
      logger.log('info', '✅ Manual trial notification check completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.log('error', '❌ Manual trial notification check failed:', error);
      process.exit(1);
    });
}
