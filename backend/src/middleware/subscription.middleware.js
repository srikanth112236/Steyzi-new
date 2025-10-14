const SubscriptionManagementService = require('../services/subscriptionManagement.service');
const AdvancedSubscriptionService = require('../services/advancedSubscription.service');
const { realTimeTrialCheck } = require('./advancedSecurity.middleware');

/**
 * Enhanced trial expiration check with real-time validation
 * Fixes: Trial Bypass Vulnerabilities
 */
const checkTrialExpiration = realTimeTrialCheck;

/**
 * Check if user has access to specific modules/features
 */
const checkModuleAccess = (requiredModules = []) => {
  return async (req, res, next) => {
    try {
      // Completely skip module access checks for these roles
      const bypassRoles = ['superadmin', 'support', 'sales', 'sub_sales'];
      if (bypassRoles.includes(req.user.role)) {
        console.log(`🎉 Bypassing ALL module access checks for role: ${req.user.role}`);
        return next();
      }

      // If no subscription exists and user is not in bypass roles, continue to check
      if (!req.subscription) {
        return next();
      }

      // Allow full access during trial period - no limitations
      if (req.subscription.billingCycle === 'trial') {
        return next();
      }

      // Skip if no subscription restrictions
      if (!req.subscription.subscriptionPlanId) {
        return next();
      }

      const userModules = req.subscription.subscriptionPlanId.modules || [];
      const hasAccess = requiredModules.every(requiredModule =>
        userModules.some(userModule =>
          userModule.moduleName === requiredModule && userModule.enabled
        )
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Your current plan does not include this feature.',
          moduleAccessDenied: true,
          requiredModules
        });
      }

      next();
    } catch (error) {
      console.error('Module access check error:', error);
      next();
    }
  };
};

/**
 * Check if user has exceeded their usage limits
 */
const checkUsageLimits = async (req, res, next) => {
  try {
    // Completely skip usage limit checks for these roles
    const bypassRoles = ['superadmin', 'support', 'sales', 'sub_sales'];
    if (bypassRoles.includes(req.user.role)) {
      console.log(`🎉 Bypassing ALL usage limit checks for role: ${req.user.role}`);
      return next();
    }

    // If no subscription exists and user is not in bypass roles, continue to check
    if (!req.subscription) {
      return next();
    }

    // Allow unlimited usage during trial period
    if (req.subscription.billingCycle === 'trial') {
      return next();
    }

    const subscription = req.subscription;
    const currentBedUsage = subscription.currentBedUsage || 0;
    const currentBranchUsage = subscription.currentBranchUsage || 1;
    const maxBeds = subscription.totalBeds || subscription.subscriptionPlanId?.baseBedCount || 1;
    const maxBranches = subscription.totalBranches || 1;

    if (currentBedUsage >= maxBeds) {
      return res.status(403).json({
        success: false,
        message: `Bed usage limit exceeded. Current: ${currentBedUsage}, Limit: ${maxBeds}`,
        usageLimitExceeded: true,
        limitType: 'beds',
        currentUsage: currentBedUsage,
        limit: maxBeds
      });
    }

    if (currentBranchUsage > maxBranches) {
      return res.status(403).json({
        success: false,
        message: `Branch usage limit exceeded. Current: ${currentBranchUsage}, Limit: ${maxBranches}`,
        usageLimitExceeded: true,
        limitType: 'branches',
        currentUsage: currentBranchUsage,
        limit: maxBranches
      });
    }

    next();
  } catch (error) {
    console.error('Usage limits check error:', error);
    next();
  }
};

module.exports = {
  checkTrialExpiration,
  checkModuleAccess,
  checkUsageLimits
};
