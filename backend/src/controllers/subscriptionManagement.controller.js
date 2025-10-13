const SubscriptionManagementService = require('../services/subscriptionManagement.service');
const logger = require('../utils/logger');

/**
 * Subscription Management Controller
 * Handles subscription management endpoints
 */
class SubscriptionManagementController {
  /**
   * Subscribe user to a plan
   */
  async subscribeUser(req, res) {
    try {
      const { userId } = req.params;
      const subscriptionData = req.body;
      const createdBy = req.user.id;

      const result = await SubscriptionManagementService.subscribeUser({
        userId,
        ...subscriptionData
      }, createdBy);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in subscribeUser:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Change user subscription (upgrade/downgrade)
   */
  async changeUserSubscription(req, res) {
    try {
      const { userId } = req.params;
      const subscriptionData = req.body;
      const updatedBy = req.user.id;

      const result = await SubscriptionManagementService.changeUserSubscription(
        userId,
        subscriptionData,
        updatedBy
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in changeUserSubscription:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelUserSubscription(req, res) {
    try {
      const { userId } = req.params;
      const { cancellationReason } = req.body;
      const cancelledBy = req.user.id;

      const result = await SubscriptionManagementService.cancelUserSubscription(
        userId,
        cancellationReason,
        cancelledBy
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in cancelUserSubscription:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all subscribers with filters
   */
  async getAllSubscribers(req, res) {
    try {
      const filters = req.query;

      const result = await SubscriptionManagementService.getAllSubscribers(filters);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in getAllSubscribers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get subscription history for a user
   */
  async getUserSubscriptionHistory(req, res) {
    try {
      const { userId } = req.params;

      const result = await SubscriptionManagementService.getUserSubscriptionHistory(userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in getUserSubscriptionHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(req, res) {
    try {
      const result = await SubscriptionManagementService.getSubscriptionStats();

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('Error in getSubscriptionStats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update subscription usage
   */
  async updateSubscriptionUsage(req, res) {
    try {
      const { userId } = req.params;
      const usageData = req.body;
      const updatedBy = req.user.id;

      const result = await SubscriptionManagementService.updateSubscriptionUsage(
        userId,
        usageData
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in updateSubscriptionUsage:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Extend subscription
   */
  async extendSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { extensionDays } = req.body;
      const extendedBy = req.user.id;

      const result = await SubscriptionManagementService.extendSubscription(
        subscriptionId,
        extensionDays,
        extendedBy
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in extendSubscription:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get subscriptions expiring soon
   */
  async getExpiringSoonSubscriptions(req, res) {
    try {
      const daysAhead = parseInt(req.query.days) || 7;

      const subscriptions = await SubscriptionManagementService.getExpiringSoonSubscriptions(daysAhead);

      res.json({
        success: true,
        data: subscriptions,
        count: subscriptions.length
      });
    } catch (error) {
      logger.error('Error in getExpiringSoonSubscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get active subscriptions count by plan
   */
  async getActiveSubscriptionsByPlan(req, res) {
    try {
      const UserSubscription = require('../models/userSubscription.model');

      const planStats = await UserSubscription.aggregate([
        {
          $match: {
            status: { $in: ['active', 'trial'] },
            endDate: { $gt: new Date() }
          }
        },
        {
          $group: {
            _id: '$subscriptionPlanId',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' }
          }
        },
        {
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: '_id',
            as: 'plan'
          }
        },
        {
          $unwind: '$plan'
        },
        {
          $project: {
            planName: '$plan.planName',
            billingCycle: '$plan.billingCycle',
            count: 1,
            totalRevenue: 1
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      res.json({
        success: true,
        data: planStats
      });
    } catch (error) {
      logger.error('Error in getActiveSubscriptionsByPlan:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user subscription history
   */
  async getUserSubscriptionHistory(req, res) {
    try {
      const { userId } = req.params;

      const result = await SubscriptionManagementService.getUserSubscriptionHistory(userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in getUserSubscriptionHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Activate free trial for user
   */
  async activateFreeTrial(req, res) {
    try {
      const { userId } = req.params;
      const activatedBy = req.user._id;

      const result = await SubscriptionManagementService.activateFreeTrial(userId, activatedBy);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in activateFreeTrial:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check and handle trial expirations (admin only)
   */
  async checkTrialExpirations(req, res) {
    try {
      const result = await SubscriptionManagementService.checkAndHandleTrialExpirations();

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error in checkTrialExpirations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new SubscriptionManagementController();
