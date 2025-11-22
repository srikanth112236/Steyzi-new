const SubscriptionManagementService = require('../services/subscriptionManagement.service');
const AdvancedSubscriptionService = require('../services/advancedSubscription.service');
const { realTimeTrialCheck } = require('./advancedSecurity.middleware');
const User = require('../models/user.model');

/**
 * Enhanced trial expiration check with real-time validation
 * Fixes: Trial Bypass Vulnerabilities
 */
const checkTrialExpiration = realTimeTrialCheck;

/**
 * Comprehensive subscription validation middleware
 * Checks for active subscription, expiry, and redirects to subscription page if needed
 */
const checkSubscriptionStatus = async (req, res, next) => {
  try {
    // Bypass roles - these users don't need subscriptions
    const bypassRoles = ['superadmin', 'support', 'sales_manager', 'sales', 'sub_sales'];
    const userRole = req.user?.role;
    const userSalesRole = req.user?.salesRole;

    if (bypassRoles.includes(userRole) || bypassRoles.includes(userSalesRole)) {
      return next();
    }

    // Get fresh user data with subscription
    const user = await User.findById(req.user._id).populate('subscription.planId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        requiresSubscription: true
      });
    }

    // Check if user has any subscription
    if (!user.subscription || !user.subscription.planId) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription. Please select a subscription plan.',
        requiresSubscription: true,
        redirectTo: '/admin/subscription-selection'
      });
    }

    // Check if subscription is expired
    const now = new Date();
    let isExpired = false;
    let endDate = null;

    // Check trial expiration
    if (user.subscription.billingCycle === 'trial' && user.subscription.trialEndDate) {
      endDate = new Date(user.subscription.trialEndDate);
      isExpired = endDate < now;
    }
    // Check regular subscription expiration
    else if (user.subscription.endDate) {
      endDate = new Date(user.subscription.endDate);
      isExpired = endDate < now;
    }

    if (isExpired) {
      // Update subscription status to expired
      user.subscription.status = 'expired';
      user.markModified('subscription');
      await user.save();

      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
        subscriptionExpired: true,
        redirectTo: '/admin/subscription-selection'
      });
    }

    // Check if subscription is active
    if (user.subscription.status !== 'active' && user.subscription.billingCycle !== 'trial') {
      return res.status(403).json({
        success: false,
        message: 'Your subscription is not active. Please contact support or renew your subscription.',
        requiresSubscription: true,
        redirectTo: '/admin/subscription-selection'
      });
    }

    next();
  } catch (error) {
    console.error('Subscription status check error:', error);
    // Don't block request on middleware error, but log it
    next();
  }
};

/**
 * Check if user has access to specific modules/features
 */
const checkModuleAccess = (requiredModules = []) => {
  return async (req, res, next) => {
    try {
      // Completely skip module access checks for these roles
      // Sales managers and sub-sales staff are internal staff managed by superadmin and don't need subscriptions
      const bypassRoles = ['superadmin', 'support', 'sales_manager', 'sales', 'sub_sales'];
      const userRole = req.user?.role || req.userType;
      const userSalesRole = req.user?.salesRole;
      
      if (bypassRoles.includes(userRole) || bypassRoles.includes(userSalesRole)) {
        console.log(`🎉 Bypassing ALL module access checks for role: ${userRole || userSalesRole}`);
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
      // Sales managers and sub-sales staff are internal staff managed by superadmin and don't need subscriptions
      const bypassRoles = ['superadmin', 'support', 'sales_manager', 'sales', 'sub_sales'];
      const userRole = req.user?.role || req.userType;
      const userSalesRole = req.user?.salesRole;
      
      if (bypassRoles.includes(userRole) || bypassRoles.includes(userSalesRole)) {
        console.log(`🎉 Bypassing ALL usage limit checks for role: ${userRole || userSalesRole}`);
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
  checkSubscriptionStatus,
  checkModuleAccess,
  checkUsageLimits
};
