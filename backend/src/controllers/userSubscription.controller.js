const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const PG = require('../models/pg.model');
const logger = require('../utils/logger');

// Get WebSocket service from app
const getWebSocketService = (req) => {
  return req.app.get('subscriptionWebSocketService');
};

/**
 * Get user's current subscription
 */
exports.getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('subscription.planId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If no subscription, return free plan
    if (!user.subscription || !user.subscription.planId) {
      // Initialize subscription with default usage if it doesn't exist
      if (!user.subscription) {
        user.subscription = {
          status: 'free',
          usage: {
            bedsUsed: 0,
            branchesUsed: 0
          }
        };
        await user.save();
      }

      // Check if there's a trial end date for free users
      const isTrialActive = user.subscription.trialEndDate && new Date(user.subscription.trialEndDate) > new Date();
      let billingCycle = 'free';
      let trialDaysRemaining = null;

      if (isTrialActive) {
        billingCycle = 'trial';
        const daysDiff = Math.ceil((new Date(user.subscription.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, daysDiff);
      }

      return res.status(200).json({
        success: true,
        data: {
          plan: null,
          planId: null,
          status: 'free',
          billingCycle: billingCycle,
          isTrialActive: isTrialActive,
          trialDaysRemaining: trialDaysRemaining,
          usage: user.subscription.usage || {
            bedsUsed: 0,
            branchesUsed: 0
          },
          startDate: null,
          endDate: null,
          trialEndDate: user.subscription.trialEndDate
        }
      });
    }

    // Get max beds (considering custom pricing)
    const plan = user.subscription.planId;
    const maxBeds = user.subscription.customPricing?.maxBedsAllowed || 
                    plan.maxBedsAllowed || 
                    plan.baseBedCount;

    // Determine billing cycle
    let billingCycle = user.subscription.billingCycle;
    if (!billingCycle && user.subscription.trialEndDate && new Date(user.subscription.trialEndDate) > new Date()) {
      billingCycle = 'trial';
    }

    // Determine if trial is active
    const isTrialActive = user.subscription.trialEndDate && new Date(user.subscription.trialEndDate) > new Date();

    // Calculate trial days remaining if trial is active
    let trialDaysRemaining = null;
    if (isTrialActive) {
      const daysDiff = Math.ceil((new Date(user.subscription.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      trialDaysRemaining = Math.max(0, daysDiff);
    }

    return res.status(200).json({
      success: true,
      data: {
        plan: user.subscription.planId,
        planId: user.subscription.planId._id,
        status: user.subscription.status,
        billingCycle: billingCycle,
        isTrialActive: isTrialActive,
        trialDaysRemaining: trialDaysRemaining,
        usage: user.subscription.usage,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        trialEndDate: user.subscription.trialEndDate,
        autoRenew: user.subscription.autoRenew,
        customPricing: user.subscription.customPricing,
        restrictions: {
          maxBeds: maxBeds,
          maxBranches: plan.maxBranches || 1,
          modules: plan.modules || [],
          features: plan.features || []
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
};

/**
 * Select a subscription plan
 */
exports.selectSubscription = async (req, res) => {
  try {
    const { planId, bedCount, branchCount } = req.body;
    const SubscriptionManagementService = require('../services/subscriptionManagement.service');

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Use subscription management service to subscribe user (allows upgrades)
    const result = await SubscriptionManagementService.subscribeUser({
      userId: req.user._id,
      subscriptionPlanId: planId,
      billingCycle: 'monthly', // Default to monthly, can be changed later
      totalBeds: bedCount || 1,
      totalBranches: branchCount || 1,
      paymentStatus: 'completed', // Assuming immediate activation for admin selection
      notes: 'Selected via admin interface',
      allowUpgrade: true // Allow upgrading existing subscriptions
    }, req.user._id);

    // Note: The subscription service already returns updated user data
    // No need for additional database query

    if (result.success) {
      // Send WebSocket notification for subscription update
      try {
        const wsService = getWebSocketService(req);
        if (wsService) {
          await wsService.sendSubscriptionUpdate(req.user._id);
        }
      } catch (wsError) {
        logger.warn('Failed to send WebSocket notification:', wsError.message);
      }

      // Log subscription activity (don't fail the whole operation if logging fails)
      try {
        const ActivityService = require('../services/activity.service');
        await ActivityService.recordActivity({
          type: 'subscription_selected',
          title: 'Subscription Plan Selected',
          description: `User selected subscription plan with ${bedCount || 1} beds and ${branchCount || 1} branches`,
          category: 'user', // Use 'user' category since subscription is user-related
          entityType: 'subscription',
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          branchId: req.user.branchId,
          details: {
            planId,
            totalBeds: bedCount || 1,
            totalBranches: branchCount || 1
          },
          metadata: {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        });
      } catch (activityError) {
        logger.warn('Failed to log subscription activity:', activityError.message);
        // Don't fail the subscription creation if activity logging fails
      }

      res.json({
        success: true,
        message: result.message || 'Subscription plan selected successfully',
        data: result.data
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    logger.error('Error selecting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select subscription plan'
    });
  }
};

/**
 * Update subscription usage
 */
exports.updateSubscriptionUsage = async (req, res) => {
  try {
    const { bedsUsed, branchesUsed } = req.body;

    const user = await User.findById(req.user._id).populate('subscription.planId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize subscription if it doesn't exist
    if (!user.subscription) {
      user.subscription = {
        status: 'free',
        usage: {
          bedsUsed: 0,
          branchesUsed: 0
        }
      };
    }

    // Ensure usage object exists
    if (!user.subscription.usage) {
      user.subscription.usage = {
        bedsUsed: 0,
        branchesUsed: 0
      };
    }

    // Update usage
    if (bedsUsed !== undefined) {
      user.subscription.usage.bedsUsed = bedsUsed;
    }
    if (branchesUsed !== undefined) {
      user.subscription.usage.branchesUsed = branchesUsed;
    }

    // Mark the nested field as modified
    user.markModified('subscription.usage');
    
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Subscription usage updated successfully',
      data: {
        usage: user.subscription.usage
      }
    });
  } catch (error) {
    logger.error('Error updating subscription usage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update subscription usage',
      error: error.message
    });
  }
};

/**
 * Check subscription restrictions
 */
exports.checkRestrictions = async (req, res) => {
  try {
    const { resourceType, count } = req.query;

    const user = await User.findById(req.user._id).populate('subscription.planId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Free plan - default restrictions
    if (!user.subscription || !user.subscription.planId) {
      return res.status(200).json({
        success: true,
        data: {
          allowed: false,
          message: 'Please select a subscription plan to continue',
          currentUsage: 0,
          limit: 0
        }
      });
    }

    const plan = user.subscription.planId;
    const usage = user.subscription.usage;

    // Check bed restrictions
    if (resourceType === 'beds') {
      // Get max beds considering custom pricing (top-up beds)
      const maxBeds = user.subscription.customPricing?.maxBedsAllowed || 
                      plan.maxBedsAllowed || 
                      plan.baseBedCount;
      const currentBeds = usage.bedsUsed || 0;
      const requestedTotal = currentBeds + (parseInt(count) || 1);

      return res.status(200).json({
        success: true,
        data: {
          allowed: requestedTotal <= maxBeds,
          message: requestedTotal > maxBeds 
            ? `Bed limit exceeded. Your plan allows up to ${maxBeds} beds.`
            : 'Within limits',
          currentUsage: currentBeds,
          limit: maxBeds,
          remaining: Math.max(0, maxBeds - currentBeds)
        }
      });
    }

    // Check module access
    if (resourceType === 'module') {
      const moduleName = req.query.moduleName;
      const hasModule = plan.modules?.some(m => m.moduleName === moduleName && m.enabled);

      return res.status(200).json({
        success: true,
        data: {
          allowed: hasModule,
          message: hasModule ? 'Module is enabled' : 'Module not available in your plan'
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid resource type'
    });
  } catch (error) {
    logger.error('Error checking restrictions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check restrictions',
      error: error.message
    });
  }
};

/**
 * Add beds to user's subscription (Top-up)
 * @route POST /api/users/subscription/add-beds
 * @access Private (Admin only)
 */
exports.addBedsToSubscription = async (req, res) => {
  try {
    const { additionalBeds, newMaxBeds } = req.body;

    if (!additionalBeds || additionalBeds <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional beds must be greater than 0'
      });
    }

    const user = await User.findById(req.user._id).populate('subscription.planId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.subscription || !user.subscription.planId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found. Please select a plan first.'
      });
    }

    const plan = user.subscription.planId;
    
    // Calculate new pricing
    const baseBedCount = parseInt(plan.baseBedCount) || 0;
    const topUpPricePerBed = parseFloat(plan.topUpPricePerBed) || 0;
    const basePrice = parseFloat(plan.basePrice) || 0;
    const annualDiscount = parseFloat(plan.annualDiscount) || 0;
    
    const totalBeds = parseInt(newMaxBeds) || (baseBedCount + parseInt(additionalBeds));
    const topUpBeds = Math.max(0, totalBeds - baseBedCount);
    const topUpCost = topUpBeds * topUpPricePerBed;
    
    // Monthly price = base price + top-up cost
    const totalMonthlyPrice = basePrice + topUpCost;
    
    // Calculate annual price
    let totalAnnualPrice = totalMonthlyPrice * 12;
    if (plan.billingCycle === 'annual' && annualDiscount > 0) {
      totalAnnualPrice = totalAnnualPrice * (1 - annualDiscount / 100);
    }

    // Store custom pricing in user's subscription
    if (!user.subscription.customPricing) {
      user.subscription.customPricing = {};
    }

    user.subscription.customPricing = {
      maxBedsAllowed: totalBeds,
      topUpBeds: topUpBeds,
      basePrice: plan.basePrice,
      topUpCost: topUpCost,
      totalMonthlyPrice: totalMonthlyPrice,
      totalAnnualPrice: totalAnnualPrice,
      updatedAt: new Date()
    };

    user.markModified('subscription.customPricing');
    await user.save();

    // Update PG billing information if PG exists (atomic update)
    if (user.pgId) {
      try {
        const updateResult = await PG.findByIdAndUpdate(
          user.pgId,
          {
            $set: {
              'billing.subscriptionPlan': plan.planName,
              'billing.monthlyAmount': totalMonthlyPrice,
              'billing.annualAmount': totalAnnualPrice,
              'billing.maxBeds': totalBeds,
              'billing.lastUpdated': new Date()
            }
          },
          { new: true, runValidators: true }
        );
        if (updateResult) {
          logger.info(`Updated billing for PG ${user.pgId} with new bed count`);
        }
      } catch (pgError) {
        logger.warn(`Failed to update PG billing for ${user.pgId}:`, pgError.message);
        // Don't fail the main operation if PG update fails
      }
    }

    logger.info(`User ${user._id} added ${additionalBeds} beds to subscription. New total: ${totalBeds} beds`);

    return res.status(200).json({
      success: true,
      message: `Successfully added ${additionalBeds} beds to your subscription`,
      data: {
        totalBeds: totalBeds,
        topUpBeds: topUpBeds,
        additionalCost: topUpCost,
        newMonthlyPrice: totalMonthlyPrice,
        newAnnualPrice: totalAnnualPrice,
        customPricing: user.subscription.customPricing
      }
    });
  } catch (error) {
    logger.error('Error in addBedsToSubscription controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Add branches to subscription
 * @route POST /api/users/subscription/add-branches
 * @access Private (Admin only)
 */
exports.addBranchesToSubscription = async (req, res) => {
  try {
    const { additionalBranches, newMaxBranches } = req.body;

    if (!additionalBranches || additionalBranches <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional branches must be greater than 0'
      });
    }

    const user = await User.findById(req.user._id).populate('subscription.planId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.subscription || !user.subscription.planId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found. Please select a plan first.'
      });
    }

    const plan = user.subscription.planId;

    // Check if plan allows multiple branches
    if (!plan.allowMultipleBranches) {
      return res.status(400).json({
        success: false,
        message: 'Your current plan does not allow multiple branches'
      });
    }

    // Calculate new pricing
    const baseBranchCount = 1; // Base is always 1 branch
    const costPerBranch = parseFloat(plan.costPerBranch) || 0;
    const basePrice = parseFloat(plan.basePrice) || 0;
    const annualDiscount = parseFloat(plan.annualDiscount) || 0;

    const totalBranches = parseInt(newMaxBranches) || (baseBranchCount + parseInt(additionalBranches));
    const extraBranches = Math.max(0, totalBranches - baseBranchCount);
    const branchCost = extraBranches * costPerBranch;

    // Monthly price = base price + branch cost
    const totalMonthlyPrice = basePrice + branchCost;

    // Calculate annual price
    let totalAnnualPrice = totalMonthlyPrice * 12;
    if (plan.billingCycle === 'annual' && annualDiscount > 0) {
      totalAnnualPrice = totalAnnualPrice * (1 - annualDiscount / 100);
    }

    // Store custom pricing in user's subscription
    if (!user.subscription.customPricing) {
      user.subscription.customPricing = {};
    }

    user.subscription.customPricing = {
      ...user.subscription.customPricing,
      maxBranchesAllowed: totalBranches,
      extraBranches: extraBranches,
      branchCost: branchCost,
      totalMonthlyPrice: totalMonthlyPrice,
      totalAnnualPrice: totalAnnualPrice,
      updatedAt: new Date()
    };

    user.markModified('subscription.customPricing');
    await user.save();

    // Update PG billing information if PG exists (atomic update)
    if (user.pgId) {
      try {
        const updateResult = await PG.findByIdAndUpdate(
          user.pgId,
          {
            $set: {
              'billing.subscriptionPlan': plan.planName,
              'billing.monthlyAmount': totalMonthlyPrice,
              'billing.annualAmount': totalAnnualPrice,
              'billing.maxBranches': totalBranches,
              'billing.lastUpdated': new Date()
            }
          },
          { new: true, runValidators: true }
        );
        if (updateResult) {
          logger.info(`PG ${user.pgId} billing updated for branch addition`);
        }
      } catch (pgError) {
        logger.error('Error updating PG billing for branches:', pgError);
      }
    }

    logger.info(`User ${req.user._id} added ${additionalBranches} branches to subscription`);

    return res.status(200).json({
      success: true,
      message: 'Branches added successfully',
      data: {
        subscription: user.subscription,
        pgBilling: updateResult?.billing
      }
    });
  } catch (error) {
    logger.error('Error adding branches to subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};