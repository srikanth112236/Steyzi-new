const Subscription = require('../models/subscription.model');
const PG = require('../models/pg.model');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Subscription Service
 * Handles all subscription-related business logic
 */
class SubscriptionService {
  /**
   * Create new subscription plan
   */
  async createSubscription(subscriptionData, userId) {
    try {
      // If it's a custom plan, find and set the PG email
      if (subscriptionData.isCustomPlan && subscriptionData.assignedPG) {
        const pg = await PG.findById(subscriptionData.assignedPG);
        
        if (!pg) {
          return {
            success: false,
            message: 'Selected PG not found'
          };
        }
        
        // Set the PG email for strict filtering
        subscriptionData.assignedPGEmail = pg.email;
      }

      // Add creator
      subscriptionData.createdBy = userId;

      const subscription = new Subscription(subscriptionData);
      await subscription.save();

      logger.info(`Subscription plan created: ${subscription.planName} by user ${userId}`);

      return {
        success: true,
        message: 'Subscription plan created successfully',
        data: subscription
      };
    } catch (error) {
      logger.error('Error creating subscription:', error);

      if (error.code === 11000) {
        return {
          success: false,
          message: 'A subscription plan with this name already exists'
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to create subscription plan'
      };
    }
  }

  /**
   * Get all PGs for custom plan selection
   */
  async getPGsForCustomPlans(search = '') {
    try {
      const query = { isActive: true };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const pgs = await PG.find(query)
        .populate('admin', 'firstName lastName email')
        .select('name email phone admin')
        .sort({ name: 1 })
        .limit(50);

      const formattedPGs = pgs.map(pg => ({
        _id: pg._id,
        name: pg.name,
        email: pg.email,
        phone: pg.phone,
        adminName: pg.admin ? `${pg.admin.firstName} ${pg.admin.lastName}` : 'N/A',
        displayText: `${pg.name} - ${pg.email} - ${pg.phone || 'N/A'}`
      }));

      return {
        success: true,
        data: formattedPGs,
        count: formattedPGs.length
      };
    } catch (error) {
      logger.error('Error fetching PGs for custom plans:', error);
      return {
        success: false,
        message: 'Failed to fetch PGs'
      };
    }
  }

  /**
   * Get active plans (filtered based on user subscription status and custom plans)
   * @param {Object} [userContext] - User context for filtering
   * @param {string} [userContext.role] - User's role
   * @param {string} [userContext.userPGId] - User's PG ID
   * @param {string} [userContext.userEmail] - User's email
   */
  async getActivePlans(userContext = {}) {
    try {
      const { role, userPGId, userEmail } = userContext;

      // Different filtering logic based on user role
      let query = { status: 'active' };
      
      if (role === 'superadmin') {
        // Superadmin sees ALL active plans
        query = { status: 'active' };
      } else if (role === 'admin') {
        // Admin sees global plans and custom plans for their PG
        query = {
          $or: [
            { isCustomPlan: false }, // Global plans
            { 
              isCustomPlan: true,
              $or: [
                { assignedPG: mongoose.Types.ObjectId(userPGId) }, // Plans for their PG
                { assignedPGEmail: userEmail } // Plans created for their PG's email
              ]
            }
          ],
          status: 'active'
        };
      } else {
        // Other roles see only global and their specific custom plans
        query = {
          $or: [
            { isCustomPlan: false },
            { 
              isCustomPlan: true,
              assignedPGEmail: userEmail 
            }
          ],
          status: 'active'
        };
      }

      let plans = await Subscription.aggregate([
        { $match: query },
        // Populate assignedPG details
        {
          $lookup: {
            from: 'pgs', // Assuming the PG collection is named 'pgs'
            localField: 'assignedPG',
            foreignField: '_id',
            as: 'pgDetails'
          }
        },
        {
          $unwind: {
            path: '$pgDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        // Remove sensitive fields
        {
          $project: {
            'pgDetails.password': 0,
            'pgDetails.admin': 0
          }
        }
      ]);

      // Filter out system plans that shouldn't be user-selectable (except for trial plans)
      plans = plans.filter(plan =>
        plan.planName !== 'Trial Expired Plan'
      );

      return {
        success: true,
        data: plans,
        count: plans.length
      };
    } catch (error) {
      logger.error('Error fetching active plans:', error);
      return {
        success: false,
        message: 'Failed to fetch active plans'
      };
    }
  }

  /**
   * Request upgrade for custom plan
   */
  async requestUpgrade(planId, userId, upgradeData) {
    try {
      const { requestedBeds, requestedBranches, requestMessage } = upgradeData;

      const plan = await Subscription.findById(planId);
      if (!plan) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      if (!plan.isCustomPlan) {
        return {
          success: false,
          message: 'Upgrade requests are only available for custom plans'
        };
      }

      // Check if user already has a pending request
      const existingRequest = plan.requestedUpgrades.find(
        req => req.userId.toString() === userId.toString() && req.status === 'pending'
      );

      if (existingRequest) {
        return {
          success: false,
          message: 'You already have a pending upgrade request for this plan'
        };
      }

      // Add the upgrade request
      plan.requestedUpgrades.push({
        userId,
        requestedBeds,
        requestedBranches: requestedBranches || 1,
        requestMessage: requestMessage || '',
        status: 'pending'
      });

      await plan.save();

      logger.info(`Upgrade request submitted for plan ${planId} by user ${userId}`);

      return {
        success: true,
        message: 'Upgrade request submitted successfully. You will be notified once it\'s reviewed.',
        data: plan.requestedUpgrades[plan.requestedUpgrades.length - 1]
      };
    } catch (error) {
      logger.error('Error requesting upgrade:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit upgrade request'
      };
    }
  }

  /**
   * Get upgrade requests for a plan (superadmin only)
   */
  async getUpgradeRequests(planId) {
    try {
      const plan = await Subscription.findById(planId)
        .populate('requestedUpgrades.userId', 'firstName lastName email')
        .populate('requestedUpgrades.respondedBy', 'firstName lastName email');

      if (!plan) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      return {
        success: true,
        data: plan.requestedUpgrades,
        count: plan.requestedUpgrades.length
      };
    } catch (error) {
      logger.error('Error fetching upgrade requests:', error);
      return {
        success: false,
        message: 'Failed to fetch upgrade requests'
      };
    }
  }

  /**
   * Respond to upgrade request (superadmin only)
   */
  async respondToUpgradeRequest(planId, requestId, responseData, respondedBy) {
    try {
      const { status, responseMessage } = responseData;

      const plan = await Subscription.findById(planId);
      if (!plan) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      const request = plan.requestedUpgrades.id(requestId);
      if (!request) {
        return {
          success: false,
          message: 'Upgrade request not found'
        };
      }

      // Update the request
      request.status = status;
      request.respondedAt = new Date();
      request.respondedBy = respondedBy;
      request.responseMessage = responseMessage || '';

      await plan.save();

      logger.info(`Upgrade request ${requestId} ${status} by superadmin ${respondedBy}`);

      return {
        success: true,
        message: `Upgrade request ${status} successfully`,
        data: request
      };
    } catch (error) {
      logger.error('Error responding to upgrade request:', error);
      return {
        success: false,
        message: error.message || 'Failed to respond to upgrade request'
      };
    }
  }

  /**
   * Get all subscription plans with filters
   */
  async getAllSubscriptions(filters = {}) {
    try {
      const { pgId, role, userPGId, userEmail } = filters;
      
      // Different filtering logic based on user role
      let query = {};
      
      if (role === 'superadmin') {
        // Superadmin sees ALL plans
        query = {};
      } else if (role === 'admin') {
        // Admin sees global plans and custom plans for their PG
        query = {
          $or: [
            { isCustomPlan: false }, // Global plans
            { 
              isCustomPlan: true,
              $or: [
                { assignedPG: userPGId }, // Plans for their PG
                { assignedPGEmail: userEmail } // Plans created for their PG's email
              ]
            }
          ]
        };
      } else {
        // Other roles see only global and their specific custom plans
        query = {
          $or: [
            { isCustomPlan: false },
            { 
              isCustomPlan: true,
              assignedPGEmail: userEmail 
            }
          ]
        };
      }
      
      // If a specific PG is provided, add additional filtering
      if (pgId) {
        query.$or.push({ 
          isCustomPlan: true, 
          assignedPG: pgId 
        });
      }
      
      const subscriptions = await Subscription.aggregate([
        {
          $lookup: {
            from: 'pgs', // Assuming the PG collection is named 'pgs'
            localField: 'assignedPG',
            foreignField: '_id',
            as: 'pgDetails'
          }
        },
        {
          $unwind: {
            path: '$pgDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: query
        },
        {
          $project: {
            'pgDetails.password': 0,
            'pgDetails.admin': 0
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]);
      
      return {
        success: true,
        data: subscriptions,
        count: subscriptions.length
      };
    } catch (error) {
      logger.error('Error fetching subscriptions:', error);
      return {
        success: false,
        message: 'Failed to fetch subscription plans'
      };
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('assignedPG', 'name email phone');

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      return {
        success: true,
        data: subscription
      };
    } catch (error) {
      logger.error('Error fetching subscription by ID:', error);
      return {
        success: false,
        message: 'Failed to fetch subscription plan'
      };
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(subscriptionId, updateData, userId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      // If it's a custom plan, find and set the PG email
      if (updateData.isCustomPlan && updateData.assignedPG) {
        const pg = await PG.findById(updateData.assignedPG);
        
        if (!pg) {
          return {
            success: false,
            message: 'Selected PG not found'
          };
        }
        
        // Set the PG email for strict filtering
        updateData.assignedPGEmail = pg.email;
      } else {
        // If not a custom plan, clear the PG email
        updateData.assignedPGEmail = null;
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key !== 'createdBy' && key !== '_id') {
          subscription[key] = updateData[key];
        }
      });

      subscription.updatedBy = userId;
      await subscription.save();

      logger.info(`Subscription plan updated: ${subscription.planName} by user ${userId}`);

      return {
        success: true,
        message: 'Subscription plan updated successfully',
        data: subscription
      };
    } catch (error) {
      logger.error('Error updating subscription:', error);
      
      if (error.code === 11000) {
        return {
          success: false,
          message: 'A subscription plan with this name already exists'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to update subscription plan'
      };
    }
  }

  /**
   * Delete subscription plan
   */
  async deleteSubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      // Check if plan has active subscribers
      if (subscription.subscribedCount > 0) {
        // Archive instead of delete
        subscription.status = 'archived';
        await subscription.save();

        return {
          success: true,
          message: 'Subscription plan archived (has active subscribers)',
          data: subscription
        };
      }

      await subscription.deleteOne();
      logger.info(`Subscription plan deleted: ${subscription.planName}`);

      return {
        success: true,
        message: 'Subscription plan deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting subscription:', error);
      return {
        success: false,
        message: 'Failed to delete subscription plan'
      };
    }
  }

  /**
   * Calculate cost for given bed count and branch count
   */
  async calculateCost(subscriptionId, bedCount, branchCount = 1) {
    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      if (subscription.status !== 'active') {
        return {
          success: false,
          message: 'This subscription plan is not active'
        };
      }

      const calculation = subscription.calculateTotalCost(bedCount, branchCount);

      return {
        success: true,
        data: calculation
      };
    } catch (error) {
      logger.error('Error calculating cost:', error);
      return {
        success: false,
        message: error.message || 'Failed to calculate cost'
      };
    }
  }

  /**
   * Get active plans for PG owners
   */
  async getActivePlans() {
    try {
      const plans = await Subscription.getActivePlans();

      return {
        success: true,
        data: plans,
        count: plans.length
      };
    } catch (error) {
      logger.error('Error fetching active plans:', error);
      return {
        success: false,
        message: 'Failed to fetch active plans'
      };
    }
  }

  /**
   * Get popular plans
   */
  async getPopularPlans() {
    try {
      const plans = await Subscription.getPopularPlans();

      return {
        success: true,
        data: plans,
        count: plans.length
      };
    } catch (error) {
      logger.error('Error fetching popular plans:', error);
      return {
        success: false,
        message: 'Failed to fetch popular plans'
      };
    }
  }

  /**
   * Toggle plan popularity
   */
  async togglePopular(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      subscription.isPopular = !subscription.isPopular;
      await subscription.save();

      return {
        success: true,
        message: `Plan ${subscription.isPopular ? 'marked' : 'unmarked'} as popular`,
        data: subscription
      };
    } catch (error) {
      logger.error('Error toggling popularity:', error);
      return {
        success: false,
        message: 'Failed to update plan popularity'
      };
    }
  }

  /**
   * Toggle plan recommended status
   */
  async toggleRecommended(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      subscription.isRecommended = !subscription.isRecommended;
      await subscription.save();

      return {
        success: true,
        message: `Plan ${subscription.isRecommended ? 'marked' : 'unmarked'} as recommended`,
        data: subscription
      };
    } catch (error) {
      logger.error('Error toggling recommended:', error);
      return {
        success: false,
        message: 'Failed to update plan recommended status'
      };
    }
  }

  /**
   * Get subscription statistics
   */
  async getStatistics() {
    try {
      const SubscriptionManagementService = require('./subscriptionManagement.service');
      const managementStats = await SubscriptionManagementService.getSubscriptionStats();

      const [totalPlans, activePlans, monthlyPlans, annualPlans] = await Promise.all([
        Subscription.countDocuments(),
        Subscription.countDocuments({ status: 'active' }),
        Subscription.countDocuments({ billingCycle: 'monthly', status: 'active' }),
        Subscription.countDocuments({ billingCycle: 'annual', status: 'active' })
      ]);

      return {
        success: true,
        data: {
          totalPlans,
          activePlans,
          inactivePlans: totalPlans - activePlans,
          monthlyPlans,
          annualPlans,
          totalSubscribers: managementStats.data?.totalActive || 0,
          subscriberStats: managementStats.data
        }
      };
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      return {
        success: false,
        message: 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Duplicate subscription plan
   */
  async duplicateSubscription(subscriptionId, userId) {
    try {
      const original = await Subscription.findById(subscriptionId);

      if (!original) {
        return {
          success: false,
          message: 'Subscription plan not found'
        };
      }

      const duplicate = new Subscription({
        ...original.toObject(),
        _id: undefined,
        planName: `${original.planName} (Copy)`,
        subscribedCount: 0,
        createdBy: userId,
        updatedBy: undefined,
        createdAt: undefined,
        updatedAt: undefined
      });

      await duplicate.save();

      logger.info(`Subscription plan duplicated: ${duplicate.planName} by user ${userId}`);

      return {
        success: true,
        message: 'Subscription plan duplicated successfully',
        data: duplicate
      };
    } catch (error) {
      logger.error('Error duplicating subscription:', error);
      return {
        success: false,
        message: 'Failed to duplicate subscription plan'
      };
    }
  }
}

module.exports = new SubscriptionService();
