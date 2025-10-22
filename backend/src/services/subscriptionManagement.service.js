const UserSubscription = require('../models/userSubscription.model');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const logger = require('../utils/logger');

/**
 * Subscription Management Service
 * Handles user subscription tracking, history, and management
 */
class SubscriptionManagementService {
  /**
   * Subscribe user to a plan (handles new subscriptions and upgrades)
   */
  async subscribeUser(
    {
        userId,
        subscriptionPlanId,
        billingCycle,
        totalBeds,
      totalBranches,
      paymentStatus,
      notes
    },
    activatedBy = null
  ) {
    try {
      // Find the subscription plan
      const subscriptionPlan = await Subscription.findById(subscriptionPlanId);
      if (!subscriptionPlan) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      // Ensure activatedBy is set (fallback to userId if not provided)
      if (!activatedBy) {
        activatedBy = userId;
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      const trialEndDate = new Date(startDate);

      // Set end dates based on billing cycle
      if (billingCycle === 'trial') {
        // 7-day trial
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        endDate.setDate(endDate.getDate() + 7);
      } else if (billingCycle === 'monthly') {
        // 1-month subscription
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (billingCycle === 'annual') {
        // 1-year subscription
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Calculate total price (base price + top-up for extra beds)
      let totalPrice = subscriptionPlan.basePrice;
      if (totalBeds > subscriptionPlan.baseBedCount) {
        const extraBeds = totalBeds - subscriptionPlan.baseBedCount;
        totalPrice += extraBeds * subscriptionPlan.topUpPricePerBed;
      }

      // Create new user subscription
      const newSubscription = new UserSubscription({
        userId,
        subscriptionPlanId,
        billingCycle,
        startDate,
        endDate,
        trialEndDate: billingCycle === 'trial' ? trialEndDate : null,
        basePrice: subscriptionPlan.basePrice,
        totalPrice,
        totalBeds,
        totalBranches: totalBranches || 1,
        status: billingCycle === 'trial' ? 'trial' : 'active',
        paymentStatus: paymentStatus || (billingCycle === 'trial' ? 'completed' : 'pending'),
        createdBy: activatedBy, // Ensure createdBy is set
        notes: notes || (billingCycle === 'trial' ? 'Automatic free trial activation' : 'Subscription created')
      });

      // Save the new subscription
      await newSubscription.save();

      // Update user's subscription data
      const user = await User.findById(userId);
      if (user) {
        user.subscription = {
          planId: subscriptionPlanId,
          status: billingCycle === 'trial' ? 'trial' : 'active',
          startDate: startDate,
          endDate: endDate,
          trialEndDate: billingCycle === 'trial' ? trialEndDate : null,
          autoRenew: true,
          totalBeds: totalBeds,
          totalBranches: totalBranches || 1,
          totalPrice: totalPrice,
          basePrice: subscriptionPlan.basePrice,
          billingCycle: billingCycle,
          usage: {
            bedsUsed: 0,
            branchesUsed: 1
          }
        };
        await user.save();
      }

      // Update plan's subscribed count
      subscriptionPlan.subscribedCount += 1;
      await subscriptionPlan.save();

      // Log the subscription creation
      console.log(`Subscription created for user ${userId}`, {
        userId,
        subscriptionId: newSubscription._id,
        billingCycle,
        startDate,
        endDate
      });

      // Transform subscription data to ensure it's JSON serializable
      const transformedSubscription = this.transformSubscriptionData(newSubscription, subscriptionPlan);

      return {
        success: true,
        message: `${billingCycle === 'trial' ? 'Free trial' : 'Subscription'} activated successfully`,
        data: { userSubscription: transformedSubscription }
      };
    } catch (error) {
      // Log the error
      console.error('Error in subscribeUser:', error);

      // Check for validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
      return {
        success: false,
          message: `Validation failed: ${validationErrors.join(', ')}`,
          errors: validationErrors
        };
      }

      // Generic error response
      return {
        success: false,
        message: error.message || 'Failed to create subscription'
      };
    }
  }

  /**
   * Activate free trial for a user
   */
  async activateFreeTrial(userId, activatedBy) {
    try {
      // Ensure trial plan exists
      let trialPlan = await Subscription.findOne({
        planName: 'Free Trial Plan',
        billingCycle: 'monthly',
        status: 'active'
      });

      if (!trialPlan) {
        // If no trial plan exists, create it dynamically
        trialPlan = new Subscription({
          planName: 'Free Trial Plan',
          planDescription: 'Full-featured 14-day trial with complete access to all modules',
          billingCycle: 'monthly',
          basePrice: 0,
          baseBedCount: 30,
          maxBedsAllowed: 30,
          trialPeriodDays: 14,
          status: 'active',
          topUpPricePerBed: 0,
          createdBy: activatedBy || userId,
          modules: [
            {
              moduleName: 'resident_management',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['residents', { create: true, read: true, update: true, delete: true }],
                ['onboarding', { create: true, read: true, update: true, delete: true }],
                ['offboarding', { create: true, read: true, update: true, delete: true }],
                ['room_switching', { create: true, read: true, update: true, delete: true }],
                ['moved_out', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'payment_tracking',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['payments', { create: true, read: true, update: true, delete: true }],
                ['payment_history', { create: true, read: true, update: true, delete: true }],
                ['payment_reports', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'room_allocation',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['rooms', { create: true, read: true, update: true, delete: true }],
                ['room_availability', { create: true, read: true, update: true, delete: true }],
                ['room_assignments', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'qr_code_payments',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['qr_generation', { create: true, read: true, update: true, delete: true }],
                ['qr_scanning', { create: true, read: true, update: true, delete: true }],
                ['payment_processing', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'ticket_system',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['tickets', { create: true, read: true, update: true, delete: true }],
                ['ticket_categories', { create: true, read: true, update: true, delete: true }],
                ['ticket_priorities', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'analytics_reports',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['dashboard', { create: true, read: true, update: true, delete: true }],
                ['reports', { create: true, read: true, update: true, delete: true }],
                ['charts', { create: true, read: true, update: true, delete: true }],
                ['exports', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'bulk_upload',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['file_upload', { create: true, read: true, update: true, delete: true }],
                ['data_validation', { create: true, read: true, update: true, delete: true }],
                ['bulk_import', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'email_notifications',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['email_templates', { create: true, read: true, update: true, delete: true }],
                ['email_sending', { create: true, read: true, update: true, delete: true }],
                ['email_history', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'sms_notifications',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['sms_templates', { create: true, read: true, update: true, delete: true }],
                ['sms_sending', { create: true, read: true, update: true, delete: true }],
                ['sms_history', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'multi_branch',
              enabled: true,
              limit: 2, // Allow 2 branches during trial
              permissions: new Map([
                ['branch_management', { create: true, read: true, update: true, delete: true }],
                ['branch_switching', { create: true, read: true, update: true, delete: true }],
                ['branch_reports', { create: true, read: true, update: true, delete: true }]
              ])
            },
            {
              moduleName: 'custom_reports',
              enabled: true,
              limit: null,
              permissions: new Map([
                ['report_builder', { create: true, read: true, update: true, delete: true }],
                ['custom_queries', { create: true, read: true, update: true, delete: true }],
                ['report_scheduling', { create: true, read: true, update: true, delete: true }]
              ])
            }
          ],
          features: [
            { name: 'Full Dashboard', description: 'Complete access to all dashboard features', enabled: true },
            { name: 'Resident Management', description: 'Full resident CRUD operations', enabled: true },
            { name: 'Payment Tracking', description: 'Complete payment management', enabled: true },
            { name: 'Room Allocation', description: 'Full room management capabilities', enabled: true },
            { name: 'QR Code Payments', description: 'Generate and process QR code payments', enabled: true },
            { name: 'Support Tickets', description: 'Create, manage, and track tickets', enabled: true },
            { name: 'Advanced Reports', description: 'Comprehensive reporting tools', enabled: true },
            { name: 'Bulk Upload', description: 'Import and manage bulk data', enabled: true },
            { name: 'Email & SMS Notifications', description: 'Full communication tools', enabled: true },
            { name: 'Multi-Branch Management', description: 'Manage up to 2 branches', enabled: true }
          ]
        });

        await trialPlan.save();
      }

      // Check if user already has an active subscription or has used trial before
      const existingActiveSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      });

      if (existingActiveSubscription) {
        // Provide more detailed information about the existing subscription
        const isTrial = existingActiveSubscription.billingCycle === 'trial';
        const daysRemaining = Math.ceil((existingActiveSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24));

        return {
          success: false,
          message: isTrial
            ? `You already have an active free trial with ${daysRemaining} days remaining.`
            : 'You already have an active paid subscription.',
          code: 'ALREADY_HAS_ACTIVE_SUBSCRIPTION',
          subscription: {
            type: isTrial ? 'trial' : 'paid',
            status: existingActiveSubscription.status,
            billingCycle: existingActiveSubscription.billingCycle,
            daysRemaining: daysRemaining,
            endDate: existingActiveSubscription.endDate
          }
        };
      }

      // Check if user has used trial before
      const previousTrials = await UserSubscription.find({
        userId,
        billingCycle: 'trial'
      });

      if (previousTrials.length > 0) {
        const lastTrial = previousTrials[previousTrials.length - 1];
        const isExpired = lastTrial.endDate < new Date();
        const wasCancelled = lastTrial.status === 'cancelled';

        let message = 'You have already used a free trial.';
        let code = 'TRIAL_USED_BEFORE';

        if (isExpired) {
          message = 'Your previous trial has expired.';
          code = 'TRIAL_EXPIRED';
        } else if (wasCancelled) {
          message = 'Your previous trial was cancelled.';
          code = 'TRIAL_CANCELLED';
        }

        return {
          success: false,
          message,
          code,
          lastTrial: {
            endDate: lastTrial.endDate,
            status: lastTrial.status,
            isExpired,
            wasCancelled
          }
        };
      }

      // Activate trial
      const result = await this.subscribeUser({
        userId,
        subscriptionPlanId: trialPlan._id,
        billingCycle: 'trial',
        totalBeds: trialPlan.baseBedCount,
        totalBranches: 2 // Allow 2 branches during trial
      }, activatedBy || userId);

      // Transform the result data to ensure JSON serializability
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          userSubscription: this.transformSubscriptionData(result.data.userSubscription, trialPlan)
        };
      }

      return result;
    } catch (error) {
      console.error('Error activating free trial:', error);
      throw error;
    }
  }

  /**
   * Migrate existing UserSubscription data to user.subscription field
   * This ensures backward compatibility for existing subscriptions
   */
  async migrateExistingSubscriptions() {
    try {
      console.log('Starting subscription migration...');

      // Find all active subscriptions from UserSubscription collection
      const activeSubscriptions = await UserSubscription.find({
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      console.log(`Found ${activeSubscriptions.length} active subscriptions to migrate`);

      let migratedCount = 0;
      const processedUsers = new Set();

      for (const sub of activeSubscriptions) {
        // Skip if we've already processed this user
        if (processedUsers.has(sub.userId.toString())) {
          continue;
        }

        try {
          const user = await User.findById(sub.userId);
          if (!user) {
            console.log(`User ${sub.userId} not found, skipping`);
            continue;
          }

          // Update user's subscription field with the latest active subscription
          user.subscription = {
            planId: sub.subscriptionPlanId,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            trialEndDate: sub.trialEndDate,
            autoRenew: sub.autoRenew || true,
            totalBeds: sub.totalBeds,
            totalBranches: sub.totalBranches,
            totalPrice: sub.totalPrice,
            basePrice: sub.basePrice,
            billingCycle: sub.billingCycle,
            usage: {
              bedsUsed: sub.currentBedUsage || 0,
              branchesUsed: sub.currentBranchUsage || 1
            }
          };

          await user.save();
          migratedCount++;
          processedUsers.add(sub.userId.toString());

          console.log(`Migrated subscription for user ${user.firstName} ${user.lastName}`);
        } catch (userError) {
          console.error(`Error migrating subscription for user ${sub.userId}:`, userError.message);
        }
      }

      console.log(`Migration completed. Migrated ${migratedCount} users.`);

      return {
        success: true,
        migratedCount,
        totalFound: activeSubscriptions.length
      };
    } catch (error) {
      console.error('Error during subscription migration:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Check and handle trial expiration for all users
   */
  async checkAndHandleTrialExpirations() {
    try {
      const expiredTrials = await UserSubscription.find({
        billingCycle: 'trial',
        status: 'trial',
        trialEndDate: { $lte: new Date() }
      }).populate('userId');

      for (const trial of expiredTrials) {
        await this.handleTrialExpiration(trial.userId._id, trial._id);
      }

      return {
        success: true,
        expiredCount: expiredTrials.length
      };

    } catch (error) {
      logger.error('Error checking trial expirations:', error);
      return {
        success: false,
        message: 'Failed to check trial expirations'
      };
    }
  }

  /**
   * Handle individual trial expiration
   */
  async handleTrialExpiration(userId, trialSubscriptionId) {
    try {
      // Get the trial expired plan
      const expiredPlan = await Subscription.findOne({
        planName: 'Trial Expired Plan',
        status: 'active'
      });

      if (!expiredPlan) {
        logger.error('Trial expired plan not found');
        return {
          success: false,
          message: 'Trial expired plan not found'
        };
      }

      // Update the trial subscription to expired
      const trialSubscription = await UserSubscription.findById(trialSubscriptionId);
      if (trialSubscription) {
        trialSubscription.status = 'expired';
        trialSubscription.autoRenew = false;
        await trialSubscription.save();
      }

      // Assign the expired plan to the user
      const result = await this.subscribeUser({
        userId,
        subscriptionPlanId: expiredPlan._id,
        billingCycle: 'monthly',
        totalBeds: expiredPlan.baseBedCount,
        totalBranches: 1,
        paymentStatus: 'completed',
        notes: 'Trial expired - limited access plan applied',
        allowUpgrade: true
      }, null); // System action

      if (result.success) {
        logger.info(`Trial expired for user ${userId}, limited plan applied`);
      }

      return result;

    } catch (error) {
      logger.error('Error handling trial expiration:', error);
      return {
        success: false,
        message: 'Failed to handle trial expiration'
      };
    }
  }

  /**
   * Upgrade/downgrade user subscription
   */
  async changeUserSubscription(userId, newSubscriptionData, updatedBy) {
    try {
      const { subscriptionPlanId, totalBeds, totalBranches = 1 } = newSubscriptionData;

      // Get current active subscription
      const currentSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      });

      if (!currentSubscription) {
        return {
          success: false,
          message: 'No active subscription found for user'
        };
      }

      // Validate new plan
      const newPlan = await Subscription.findById(subscriptionPlanId);
      if (!newPlan || newPlan.status !== 'active') {
        return {
          success: false,
          message: 'New subscription plan not found or inactive'
        };
      }

      // Cancel current subscription
      currentSubscription.status = 'cancelled';
      currentSubscription.cancelledAt = new Date();
      currentSubscription.cancellationReason = 'Upgraded/Downgraded to new plan';
      currentSubscription.autoRenew = false;
      await currentSubscription.save();

      // Create new subscription
      const subscribeResult = await this.subscribeUser({
        userId,
        subscriptionPlanId,
        billingCycle: currentSubscription.billingCycle, // Keep same billing cycle
        totalBeds,
        totalBranches,
        paymentStatus: 'completed', // Assuming immediate activation for upgrades
        notes: `Upgraded from ${currentSubscription.subscriptionPlanId}`
      }, updatedBy);

      if (!subscribeResult.success) {
        return subscribeResult;
      }

      // Update the new subscription to reference the previous one
      const newUserSubscription = subscribeResult.data.userSubscription;
      newUserSubscription.previousSubscriptionId = currentSubscription._id;
      newUserSubscription.upgradeDate = new Date();
      await newUserSubscription.save();

      // Update plan counts
      const oldPlan = await Subscription.findById(currentSubscription.subscriptionPlanId);
      if (oldPlan && oldPlan.subscribedCount > 0) {
        oldPlan.subscribedCount -= 1;
        await oldPlan.save();
      }
      // New plan count already updated in subscribeUser

      logger.info(`User ${userId} subscription changed from ${currentSubscription.subscriptionPlanId} to ${subscriptionPlanId}`);

      // Transform the subscription data for JSON serializability
      const transformedData = {
        ...subscribeResult.data,
        userSubscription: this.transformSubscriptionData(subscribeResult.data.userSubscription, newPlan)
      };

      return {
        success: true,
        message: 'Subscription changed successfully',
        data: transformedData
      };
    } catch (error) {
      logger.error('Error changing user subscription:', error);
      return {
        success: false,
        message: error.message || 'Failed to change subscription'
      };
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelUserSubscription(userId, cancellationReason = '', cancelledBy) {
    try {
      const activeSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      });

      if (!activeSubscription) {
        return {
          success: false,
          message: 'No active subscription found for user'
        };
      }

      // Cancel subscription
      await activeSubscription.cancelSubscription(cancellationReason);

      // Update user status
      const user = await User.findById(userId);
      if (user) {
        user.subscription.status = 'cancelled';
        user.subscription.autoRenew = false;
        await user.save();
      }

      // Update plan count
      const plan = await Subscription.findById(activeSubscription.subscriptionPlanId);
      if (plan && plan.subscribedCount > 0) {
        plan.subscribedCount -= 1;
        await plan.save();
      }

      logger.info(`User ${userId} subscription cancelled`);

      return {
        success: true,
        message: 'Subscription cancelled successfully',
        data: activeSubscription
      };
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Get all subscribers with details
   */
  async getAllSubscribers(filters = {}) {
    try {
      // Build query for users with subscriptions
      let userQuery = {};

      // Handle status filter
      if (filters.status === 'all' || !filters.status) {
        // Show all users with any subscription status except 'free'
        userQuery = {
          'subscription.status': { $in: ['active', 'trial', 'expired', 'cancelled'] }
        };
      } else {
        // Filter by specific status
        userQuery = {
          'subscription.status': filters.status
        };
      }

      if (filters.billingCycle && filters.billingCycle !== 'all') {
        userQuery['subscription.billingCycle'] = filters.billingCycle;
      }

      if (filters.subscriptionPlanId && filters.subscriptionPlanId !== 'all') {
        userQuery['subscription.planId'] = filters.subscriptionPlanId;
      }

      if (filters.userRole && filters.userRole !== 'all') {
        userQuery.role = filters.userRole;
      }

      // Date range filters
      if (filters.startDate) {
        userQuery['subscription.startDate'] = { $gte: new Date(filters.startDate) };
      }
      if (filters.endDate) {
        userQuery['subscription.endDate'] = { $lte: new Date(filters.endDate) };
      }

      // Find users with subscriptions
      const subscribers = await User.find(userQuery)
        .populate('subscription.planId', 'planName billingCycle basePrice features')
        .populate('pgId', 'name email')
        .sort({ 'subscription.startDate': -1 })
        .limit(100); // Limit for performance

      // Transform data to match expected format
      const transformedSubscribers = subscribers.map(user => {
        const subscription = user.subscription;

        // Skip users without subscription data
        if (!subscription || !subscription.status) {
          return null;
        }

        const plan = subscription.planId;

        // Calculate additional fields
        const now = new Date();
        const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
        const trialEndDate = subscription.trialEndDate ? new Date(subscription.trialEndDate) : null;

        const daysRemaining = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;
        const trialDaysRemaining = trialEndDate ?
          Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)) : null;

        const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
        const isExpired = daysRemaining < 0;
        const isTrialActive = subscription.status === 'trial' && trialDaysRemaining > 0;

        return {
          _id: user._id,
          userId: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            pgId: user.pgId
          },
          subscriptionPlanId: plan ? {
            _id: plan._id,
            planName: plan.planName,
            billingCycle: plan.billingCycle,
            basePrice: plan.basePrice,
            features: plan.features
          } : null,
          billingCycle: subscription.billingCycle,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          trialEndDate: subscription.trialEndDate,
          basePrice: subscription.basePrice || 0,
          totalPrice: subscription.totalPrice || subscription.basePrice || 0,
          totalBeds: subscription.totalBeds,
          totalBranches: subscription.totalBranches,
          currentBedUsage: subscription.usage?.bedsUsed || 0,
          currentBranchUsage: subscription.usage?.branchesUsed || 1,
          status: subscription.status,
          paymentStatus: 'completed', // Assume completed for active subscriptions
          createdBy: user._id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,

          // Virtual fields
          durationDays: Math.ceil((endDate - new Date(subscription.startDate)) / (1000 * 60 * 60 * 24)),
          daysRemaining: daysRemaining,
          trialDaysRemaining: trialDaysRemaining,
          isExpiringSoon: isExpiringSoon,
          isExpired: isExpired,
          isTrialActive: isTrialActive
        };
      });

      // Filter out null entries
      const validSubscribers = transformedSubscribers.filter(sub => sub !== null);

      return {
        success: true,
        data: validSubscribers,
        count: validSubscribers.length
      };
    } catch (error) {
      logger.error('Error fetching subscribers:', error);
      return {
        success: false,
        message: 'Failed to fetch subscribers'
      };
    }
  }

  /**
   * Get subscription history for a user
   */
  async getUserSubscriptionHistory(userId) {
    try {
      // Get current subscription status
      const user = await User.findById(userId).populate('subscription.planId', 'planName billingCycle basePrice features');
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Get subscription history from UserSubscription collection
      const history = await UserSubscription.find({ userId })
        .populate('subscriptionPlanId', 'planName billingCycle basePrice features')
        .sort({ createdAt: -1 });

      // Add current subscription as the latest entry if it exists
      const currentSubscription = user.subscription && user.subscription.status !== 'free' ? [{
        _id: user._id + '_current',
        userId: user._id,
        subscriptionPlanId: user.subscription.planId,
        billingCycle: user.subscription.billingCycle,
        status: user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        trialEndDate: user.subscription.trialEndDate,
        totalPrice: user.subscription.totalPrice,
        totalBeds: user.subscription.totalBeds,
        totalBranches: user.subscription.totalBranches,
        createdAt: user.subscription.startDate,
        isCurrent: true
      }] : [];

      const allHistory = [...currentSubscription, ...history];

      return {
        success: true,
        data: allHistory.map(sub => {
          const subObj = sub.toObject ? sub.toObject() : sub;

          // Calculate virtual fields
          if (sub.endDate) {
            const endDate = new Date(sub.endDate);
            const now = new Date();
            subObj.daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            subObj.durationDays = sub.startDate ?
              Math.ceil((endDate - new Date(sub.startDate)) / (1000 * 60 * 60 * 24)) : null;
          }

          if (sub.trialEndDate) {
            const trialEnd = new Date(sub.trialEndDate);
            const now = new Date();
            subObj.trialDaysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
          }

          return subObj;
        })
      };
    } catch (error) {
      logger.error('Error fetching user subscription history:', error);
      return {
        success: false,
        message: 'Failed to fetch subscription history'
      };
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Get total active subscribers
      const totalActive = await User.countDocuments({
        'subscription.status': 'active'
      });

      // Get total trial users
      const trialActiveCount = await User.countDocuments({
        'subscription.status': 'trial',
        'subscription.trialEndDate': { $gt: now }
      });

      // Get revenue calculations
      const monthlyRevenueResult = await User.aggregate([
        {
          $match: {
            'subscription.status': { $in: ['active', 'trial'] },
            'subscription.billingCycle': 'monthly'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$subscription.totalPrice' }
          }
        }
      ]);

      const annualRevenueResult = await User.aggregate([
        {
          $match: {
            'subscription.status': { $in: ['active', 'trial'] },
            'subscription.billingCycle': 'annual'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$subscription.totalPrice' }
          }
        }
      ]);

      const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
      const annualRevenue = annualRevenueResult[0]?.total || 0;

      // Get billing cycle counts
      const monthlyCount = await User.countDocuments({
        'subscription.status': { $in: ['active', 'trial'] },
        'subscription.billingCycle': 'monthly'
      });

      const annualCount = await User.countDocuments({
        'subscription.status': { $in: ['active', 'trial'] },
        'subscription.billingCycle': 'annual'
      });

      // Get expiring soon (30 days)
      const expiringSoonCount = await User.countDocuments({
        'subscription.status': { $in: ['active', 'trial'] },
        'subscription.endDate': {
          $gt: now,
          $lte: thirtyDaysFromNow
        }
      });

      // Get expired count
      const expiredCount = await User.countDocuments({
        'subscription.status': 'expired',
        'subscription.endDate': { $lte: now }
      });

      return {
        success: true,
        data: {
          totalActive,
          trialActiveCount,
          monthlyRevenue,
          annualRevenue,
          totalRevenue: monthlyRevenue + annualRevenue,
          monthlyCount,
          annualCount,
          expiringSoonCount,
          expiredCount
        }
      };
    } catch (error) {
      logger.error('Error fetching subscription stats:', error);
      return {
        success: false,
        message: 'Failed to fetch subscription statistics'
      };
    }
  }

  /**
   * Update user subscription usage
   */
  async updateSubscriptionUsage(userId, usageData) {
    try {
      const { bedsUsed, branchesUsed } = usageData;

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (!user.subscription || !['active', 'trial'].includes(user.subscription.status)) {
        return {
          success: false,
          message: 'No active subscription found for user'
        };
      }

      // Update usage in user's subscription
      if (bedsUsed !== undefined) {
        user.subscription.usage.bedsUsed = bedsUsed;
      }
      if (branchesUsed !== undefined) {
        user.subscription.usage.branchesUsed = branchesUsed;
      }

      await user.save();

      return {
        success: true,
        message: 'Subscription usage updated successfully',
        data: {
          userId: user._id,
          bedsUsed: user.subscription.usage.bedsUsed,
          branchesUsed: user.subscription.usage.branchesUsed
        }
      };
    } catch (error) {
      logger.error('Error updating subscription usage:', error);
      return {
        success: false,
        message: error.message || 'Failed to update subscription usage'
      };
    }
  }

  /**
   * Extend subscription (for trials or extensions)
   */
  async extendSubscription(subscriptionId, extensionDays, extendedBy) {
    try {
      const subscription = await UserSubscription.findById(subscriptionId);

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found'
        };
      }

      await subscription.extendSubscription(extensionDays);

      // Update user record
      const user = await User.findById(subscription.userId);
      if (user) {
        user.subscription.endDate = subscription.endDate;
        if (subscription.trialEndDate) {
          user.subscription.trialEndDate = subscription.trialEndDate;
        }
        await user.save();
      }

      logger.info(`Subscription ${subscriptionId} extended by ${extensionDays} days by user ${extendedBy}`);

      return {
        success: true,
        message: 'Subscription extended successfully',
        data: subscription
      };
    } catch (error) {
      logger.error('Error extending subscription:', error);
      return {
        success: false,
        message: error.message || 'Failed to extend subscription'
      };
    }
  }

  /**
   * Get subscription details for login response
   */
  async getSubscriptionForLogin(userId) {
    try {
      const activeSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).populate('subscriptionPlanId');

      if (!activeSubscription) {
        // Return free plan with basic permissions
        const freeModules = [
          {
            moduleName: 'resident_management',
            enabled: true,
            limit: 5,
            permissions: {
              residents: { create: false, read: true, update: false, delete: false },
              onboarding: { create: false, read: false, update: false, delete: false },
              offboarding: { create: false, read: false, update: false, delete: false },
              room_switching: { create: false, read: false, update: false, delete: false },
              moved_out: { create: false, read: false, update: false, delete: false }
            }
          },
          {
            moduleName: 'payment_tracking',
            enabled: true,
            limit: null,
            permissions: {
              payments: { create: false, read: true, update: false, delete: false },
              payment_history: { create: false, read: true, update: false, delete: false },
              payment_reports: { create: false, read: false, update: false, delete: false }
            }
          },
          {
            moduleName: 'analytics_reports',
            enabled: true,
            limit: null,
            permissions: {
              dashboard: { create: false, read: true, update: false, delete: false },
              reports: { create: false, read: false, update: false, delete: false },
              charts: { create: false, read: true, update: false, delete: false },
              exports: { create: false, read: false, update: false, delete: false }
            }
          }
        ];

        const freeFeatures = [
          { name: 'Basic Dashboard', description: 'Access to basic analytics dashboard', enabled: true },
          { name: 'Read-only Resident View', description: 'View resident information only', enabled: true },
          { name: 'Payment History', description: 'View payment history', enabled: true },
          { name: 'Basic Reports', description: 'Limited reporting capabilities', enabled: true }
        ];

        return {
          subscription: {
            status: 'free',
            planId: null,
            startDate: null,
            endDate: null,
            trialEndDate: null,
            autoRenew: false,
            totalBeds: 5,
            totalBranches: 1,
            currentBedUsage: 0,
            currentBranchUsage: 0,
            daysRemaining: null,
            trialDaysRemaining: null,
            isExpiringSoon: false,
            isTrialActive: false,
            restrictions: {
              maxBeds: 5,
              maxBranches: 1,
              modules: freeModules,
              features: freeFeatures
            }
          }
        };
      }

      return {
        subscription: {
          planId: activeSubscription.subscriptionPlanId,
          status: activeSubscription.status,
          billingCycle: activeSubscription.billingCycle,
          startDate: activeSubscription.startDate,
          endDate: activeSubscription.endDate,
          trialEndDate: activeSubscription.trialEndDate,
          autoRenew: activeSubscription.autoRenew,
          totalBeds: activeSubscription.totalBeds,
          totalBranches: activeSubscription.totalBranches,
          currentBedUsage: activeSubscription.currentBedUsage,
          currentBranchUsage: activeSubscription.currentBranchUsage,
          daysRemaining: activeSubscription.daysRemaining,
          trialDaysRemaining: activeSubscription.trialDaysRemaining,
          isExpiringSoon: activeSubscription.isExpiringSoon,
          isTrialActive: activeSubscription.isTrialActive
        }
      };
    } catch (error) {
      logger.error('Error getting subscription for login:', error);
      // Return free plan with basic permissions on error
      const freeModules = [
        {
          moduleName: 'resident_management',
          enabled: true,
          limit: 5,
          permissions: {
            residents: { create: false, read: true, update: false, delete: false },
            onboarding: { create: false, read: false, update: false, delete: false },
            offboarding: { create: false, read: false, update: false, delete: false },
            room_switching: { create: false, read: false, update: false, delete: false },
            moved_out: { create: false, read: false, update: false, delete: false }
          }
        },
        {
          moduleName: 'payment_tracking',
          enabled: true,
          limit: null,
          permissions: {
            payments: { create: false, read: true, update: false, delete: false },
            payment_history: { create: false, read: true, update: false, delete: false },
            payment_reports: { create: false, read: false, update: false, delete: false }
          }
        },
        {
          moduleName: 'analytics_reports',
          enabled: true,
          limit: null,
          permissions: {
            dashboard: { create: false, read: true, update: false, delete: false },
            reports: { create: false, read: false, update: false, delete: false },
            charts: { create: false, read: true, update: false, delete: false },
            exports: { create: false, read: false, update: false, delete: false }
          }
        }
      ];

      const freeFeatures = [
        { name: 'Basic Dashboard', description: 'Access to basic analytics dashboard', enabled: true },
        { name: 'Read-only Resident View', description: 'View resident information only', enabled: true },
        { name: 'Payment History', description: 'View payment history', enabled: true },
        { name: 'Basic Reports', description: 'Limited reporting capabilities', enabled: true }
      ];

      return {
        subscription: {
          status: 'free',
          planId: null,
          startDate: null,
          endDate: null,
          trialEndDate: null,
          autoRenew: false,
          totalBeds: 5,
          totalBranches: 1,
          currentBedUsage: 0,
          currentBranchUsage: 0,
          daysRemaining: null,
          trialDaysRemaining: null,
          isExpiringSoon: false,
          isTrialActive: false,
          restrictions: {
            maxBeds: 5,
            maxBranches: 1,
            modules: freeModules,
            features: freeFeatures
          }
        }
      };
    }
  }

  // Add a new method to get user's active subscription
  async getUserActiveSubscription(userId) {
    try {
      // Find the most recent active subscription for the user
      const activeSubscription = await UserSubscription.findOne({
        userId: userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).populate('subscriptionPlanId');

      if (!activeSubscription) {
        // If no active subscription, try to activate free trial
        const trialResult = await this.activateFreeTrial(userId, userId);
        
        if (trialResult.success) {
          // Fetch the newly created trial subscription
          const newSubscription = await UserSubscription.findOne({
            userId: userId,
            status: 'trial'
          }).populate('subscriptionPlanId');

          return {
            success: true,
            data: newSubscription
          };
        }

        return {
          success: false,
          message: 'No active subscription found'
        };
      }

      // Process and return subscription data using the transformation method
      return {
        success: true,
        data: this.transformSubscriptionData(activeSubscription, activeSubscription.subscriptionPlanId)
      };
    } catch (error) {
      logger.log('error', 'Error fetching active subscription', { 
        userId, 
        error: error.message 
      });

      return {
        success: false,
        message: 'Failed to fetch active subscription',
        error: error.message
      };
    }
  }

  /**
   * Get subscriptions due for renewal
   */
  async getSubscriptionsDueForRenewal() {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    return await UserSubscription.find({
      status: 'active',
      autoRenew: true,
      endDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('userId', 'firstName lastName email')
      .populate('subscriptionPlanId');
  }

  /**
   * Get expired subscriptions
   */
  async getExpiredSubscriptions() {
    const today = new Date();

    return await UserSubscription.find({
      status: 'active',
      endDate: { $lt: today }
    }).populate('userId', 'firstName lastName email')
      .populate('subscriptionPlanId');
  }

  /**
   * Process subscription renewal
   */
  async processSubscriptionRenewal(subscription) {
    try {
      // TODO: Integrate with Razorpay to process payment
      // For now, we'll simulate successful renewal

      // Calculate new end date based on billing cycle
      const newEndDate = new Date(subscription.endDate);
      if (subscription.billingCycle === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (subscription.billingCycle === 'annual') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      // Update subscription
      subscription.endDate = newEndDate;
      subscription.updatedAt = new Date();

      await subscription.save();

      logger.info('Subscription renewed successfully:', {
        subscriptionId: subscription._id,
        userId: subscription.userId,
        newEndDate
      });

      return {
        success: true,
        message: 'Subscription renewed successfully',
        data: { subscriptionId: subscription._id, newEndDate }
      };
    } catch (error) {
      logger.error('Error processing subscription renewal:', error);
      return {
        success: false,
        message: 'Failed to process subscription renewal',
        error: error.message
      };
    }
  }

  /**
   * Expire subscription
   */
  async expireSubscription(subscriptionId, reason = 'Subscription expired') {
    try {
      const subscription = await UserSubscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      subscription.status = 'expired';
      subscription.updatedAt = new Date();

      await subscription.save();

      // TODO: Send notification to user about expiration

      logger.info('Subscription expired:', {
        subscriptionId,
        userId: subscription.userId,
        reason
      });

      return {
        success: true,
        message: 'Subscription expired successfully'
      };
    } catch (error) {
      logger.error('Error expiring subscription:', error);
      return {
        success: false,
        message: 'Failed to expire subscription',
        error: error.message
      };
    }
  }

  /**
   * Transform subscription data to ensure JSON serializability
   * Converts Map objects to plain objects for React compatibility
   */
  transformSubscriptionData(subscription, plan) {
    try {
      const subscriptionObj = subscription.toObject ? subscription.toObject() : subscription;

      // Transform the plan data if provided
      if (plan) {
        const planObj = plan.toObject ? plan.toObject() : plan;

        // Transform modules to convert Map objects to plain objects
        if (planObj.modules && Array.isArray(planObj.modules)) {
          planObj.modules = planObj.modules.map(module => {
            const moduleObj = { ...module };

            // Convert permissions Map to plain object
            if (module.permissions instanceof Map) {
              moduleObj.permissions = Object.fromEntries(module.permissions);
            } else if (module.permissions && typeof module.permissions === 'object') {
              moduleObj.permissions = module.permissions;
            } else {
              moduleObj.permissions = {};
            }

            // Ensure other fields are serializable
            if (moduleObj._id) {
              moduleObj._id = moduleObj._id.toString();
            }

            return moduleObj;
          });
        }

        // Transform features if they exist
        if (planObj.features && Array.isArray(planObj.features)) {
          planObj.features = planObj.features.map(feature => {
            const featureObj = { ...feature };
            if (featureObj._id) {
              featureObj._id = featureObj._id.toString();
            }
            return featureObj;
          });
        }

        subscriptionObj.plan = planObj;
      }

      // Transform subscription fields
      if (subscriptionObj._id) {
        subscriptionObj._id = subscriptionObj._id.toString();
      }
      if (subscriptionObj.userId) {
        subscriptionObj.userId = subscriptionObj.userId.toString();
      }
      if (subscriptionObj.subscriptionPlanId) {
        subscriptionObj.subscriptionPlanId = subscriptionObj.subscriptionPlanId.toString();
      }
      if (subscriptionObj.createdBy) {
        subscriptionObj.createdBy = subscriptionObj.createdBy.toString();
      }

      return subscriptionObj;
    } catch (error) {
      logger.error('Error transforming subscription data:', error);
      // Return basic subscription data if transformation fails
      return {
        _id: subscription._id?.toString(),
        userId: subscription.userId?.toString(),
        subscriptionPlanId: subscription.subscriptionPlanId?.toString(),
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        totalBeds: subscription.totalBeds,
        totalBranches: subscription.totalBranches,
        totalPrice: subscription.totalPrice
      };
    }
  }
}

module.exports = new SubscriptionManagementService();
