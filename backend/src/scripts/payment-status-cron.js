const cron = require('node-cron');
const ResidentService = require('../services/resident.service');
const SubscriptionManagementService = require('../services/subscriptionManagement.service');
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
      logger.log('info', 'Payment Status Cron: Starting daily payment status update');
      
      // Get all PGs and update payment status for each
      const Pg = require('../models/pg.model');
      const pgs = await Pg.find({ isActive: true });

      let totalUpdated = 0;
      let subscriptionsRenewed = 0;
      let subscriptionsExpired = 0;

      for (const pg of pgs) {
        try {
          const result = await ResidentService.updateAllResidentsPaymentStatus(pg._id);
          if (result.success) {
            totalUpdated += result.data.updatedCount || 0;
            console.log(`✅ Updated ${result.data.updatedCount || 0} residents in PG: ${pg.name}`);
            logger.log('info', `Updated ${result.data.updatedCount || 0} residents in PG: ${pg.name}`);
          }
        } catch (error) {
          console.error(`❌ Error updating residents in PG ${pg.name}:`, error.message);
          logger.log('error', `Error updating residents in PG ${pg.name}: ${error.message}`);
        }
      }

      // Handle subscription renewals and expirations
      try {
        console.log('🔄 Processing subscription renewals and expirations...');

        // Check for subscriptions expiring today and attempt auto-renewal
        const subscriptionsToRenew = await SubscriptionManagementService.getSubscriptionsDueForRenewal();
        console.log(`📋 Found ${subscriptionsToRenew.length} subscriptions due for renewal`);

        for (const subscription of subscriptionsToRenew) {
          try {
            // Only auto-renew if payment succeeds (this would integrate with Razorpay)
            const renewalResult = await SubscriptionManagementService.processSubscriptionRenewal(subscription);

            if (renewalResult.success) {
              subscriptionsRenewed++;
              console.log(`✅ Renewed subscription ${subscription._id} for user ${subscription.userId}`);
              logger.log('info', `Renewed subscription ${subscription._id} for user ${subscription.userId}`);
            } else {
              console.log(`❌ Failed to renew subscription ${subscription._id}: ${renewalResult.message}`);
              logger.log('warn', `Failed to renew subscription ${subscription._id}: ${renewalResult.message}`);
            }
          } catch (error) {
            console.error(`❌ Error processing subscription renewal ${subscription._id}:`, error.message);
            logger.log('error', `Error processing subscription renewal ${subscription._id}: ${error.message}`);
          }
        }

        // Check for expired subscriptions
        const expiredSubscriptions = await SubscriptionManagementService.getExpiredSubscriptions();
        console.log(`📋 Found ${expiredSubscriptions.length} expired subscriptions`);

        for (const subscription of expiredSubscriptions) {
          try {
            await SubscriptionManagementService.expireSubscription(subscription._id, 'Auto-expired by cron job');
            subscriptionsExpired++;
            console.log(`✅ Expired subscription ${subscription._id} for user ${subscription.userId}`);
            logger.log('info', `Expired subscription ${subscription._id} for user ${subscription.userId}`);
          } catch (error) {
            console.error(`❌ Error expiring subscription ${subscription._id}:`, error.message);
            logger.log('error', `Error expiring subscription ${subscription._id}: ${error.message}`);
          }
        }

        console.log(`🎉 Subscription Cron: Completed! Renewed: ${subscriptionsRenewed}, Expired: ${subscriptionsExpired}`);
        logger.log('info', `Subscription Cron: Completed! Renewed: ${subscriptionsRenewed}, Expired: ${subscriptionsExpired}`);

      } catch (error) {
        console.error('❌ Subscription Cron: Error in subscription processing:', error);
        logger.log('error', `Subscription Cron: Error in subscription processing: ${error.message}`);
      }
      
      console.log(`🎉 Payment Status Cron: Completed! Total updated: ${totalUpdated} residents`);
      logger.log('info', `Payment Status Cron: Completed! Total updated: ${totalUpdated} residents`);
      
    } catch (error) {
      console.error('❌ Payment Status Cron: Error in daily update:', error);
      logger.log('error', `Payment Status Cron: Error in daily update: ${error.message}`);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });
  
  console.log('✅ Payment Status Cron: Scheduled daily at 12:01 AM IST');
  logger.log('info', 'Payment Status Cron: Scheduled daily at 12:01 AM IST');
};

module.exports = { setupPaymentStatusCron }; 