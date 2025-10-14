import { useSelector } from 'react-redux';
import { selectSubscription, selectUser } from '../store/slices/authSlice';
import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * Subscription Utility Functions
 * Provides easy access to subscription limits, features, and usage checks
 */

export class SubscriptionUtils {
  /**
   * Check if user has an active subscription
   */
  static isSubscribed(subscription) {
    if (!subscription) return false;
    return subscription.status === 'active' || subscription.status === 'trial';
  }

  /**
   * Check if user is on a free plan
   */
  static isFreePlan(subscription) {
    return !subscription || subscription.status === 'free' || !subscription.plan;
  }

  /**
   * Get maximum allowed beds
   */
  static getMaxBeds(subscription) {
    // During trial period, allow higher limits
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial active - allowing higher bed limit');
      return 30; // Trial limit
    }

    if (!subscription) return 10; // Default free limit
    return subscription.restrictions?.maxBeds || 10;
  }

  /**
   * Get maximum allowed branches
   */
  static getMaxBranches(subscription) {
    // During trial period, allow higher limits
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial active - allowing higher branch limit');
      return 10; // Trial limit
    }

    if (!subscription) return 1; // Default free limit
    return subscription.restrictions?.maxBranches || 1;
  }

  /**
   * Check if user can add more beds
   */
  static canAddBeds(currentBeds, additionalBeds = 1, subscription) {
    const maxBeds = this.getMaxBeds(subscription);
    return (currentBeds + additionalBeds) <= maxBeds;
  }

  /**
   * Check if user is at bed limit (for trial users)
   */
  static isAtBedLimit(currentBeds, subscription) {
    const maxBeds = this.getMaxBeds(subscription);
    return currentBeds >= maxBeds;
  }

  /**
   * Show trial bed limit modal if needed
   */
  static showTrialBedLimitModal(currentBeds, subscription) {
    if (this.isSubscribed(subscription) && subscription.status === 'trial' && this.isAtBedLimit(currentBeds, subscription)) {
      // Import and show modal dynamically
      import('../components/common/TrialBedLimitModal').then(({ default: TrialBedLimitModal }) => {
        // Create a container for the modal
        const modalContainer = document.createElement('div');
        modalContainer.id = 'trial-bed-limit-modal-container';
        document.body.appendChild(modalContainer);

        // Import modal dynamically and render
        import('../components/common/TrialBedLimitModal').then(({ default: TrialBedLimitModal }) => {
          // Render modal
          const root = ReactDOM.createRoot(modalContainer);
          root.render(
            React.createElement(TrialBedLimitModal, {
              isOpen: true,
              currentBeds: currentBeds,
              maxBeds: this.getMaxBeds(subscription),
              onClose: () => {
                root.unmount();
                document.body.removeChild(modalContainer);
              }
            })
          );
        });
      });
      return true; // Modal shown
    }
    return false; // No modal needed
  }

  /**
   * Check if user can add more branches
   */
  static canAddBranches(currentBranches, additionalBranches = 1, subscription) {
    const maxBranches = this.getMaxBranches(subscription);
    return (currentBranches + additionalBranches) <= maxBranches;
  }

  /**
   * Check if a feature is enabled
   */
  static hasFeature(featureName, subscription) {
    if (!subscription || !subscription.restrictions?.features) return false;
    return subscription.restrictions.features.some(feature =>
      feature.name === featureName && feature.enabled
    );
  }

  /**
   * Check if a module is enabled
   */
  static hasModule(moduleName, subscription) {
    // During trial period, allow all modules
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial active - allowing module:', moduleName);
      return true;
    }

    if (!subscription || !subscription.restrictions?.modules) return false;
    return subscription.restrictions.modules.some(module =>
      module.moduleName === moduleName && module.enabled
    );
  }

  /**
   * Check if a specific permission is enabled for a submodule
   */
  static hasPermission(moduleName, submoduleName, permission, subscription) {
    // During trial period, allow all permissions
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial active - allowing permission:', { moduleName, submoduleName, permission });
      return true;
    }

    if (!subscription || !subscription.restrictions?.modules) return false;

    const module = subscription.restrictions.modules.find(m =>
      m.moduleName === moduleName && m.enabled
    );

    if (!module || !module.permissions) return false;

    // permissions should now be a plain object from the API response
    let permissions = module.permissions || {};

    const submodulePermissions = permissions[submoduleName];
    if (!submodulePermissions) return false;

    return submodulePermissions[permission] === true;
  }

  /**
   * Check if user can perform an action on a submodule
   */
  static canPerformActionOnSubmodule(moduleName, submoduleName, action, subscription) {
    // During trial period, allow all actions
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial active - allowing action:', { moduleName, submoduleName, action });
      return true;
    }

    const actionToPermission = {
      'create': 'create',
      'read': 'read',
      'view': 'read',
      'list': 'read',
      'update': 'update',
      'edit': 'update',
      'delete': 'delete',
      'remove': 'delete'
    };

    const permission = actionToPermission[action.toLowerCase()];
    return permission ? this.hasPermission(moduleName, submoduleName, permission, subscription) : false;
  }

  /**
   * Get permission status for a submodule
   */
  static getSubmodulePermissions(moduleName, submoduleName, subscription) {
    if (!subscription || !subscription.restrictions?.modules) return null;

    const module = subscription.restrictions.modules.find(m =>
      m.moduleName === moduleName && m.enabled
    );

    if (!module || !module.permissions) return null;

    return module.permissions[submoduleName] || null;
  }

  /**
   * Check if module has any restricted permissions
   */
  static hasRestrictedPermissions(moduleName, subscription) {
    if (!subscription || !subscription.restrictions?.modules) return false;

    const module = subscription.restrictions.modules.find(m =>
      m.moduleName === moduleName && m.enabled
    );

    if (!module || !module.permissions) return false;

    // Check if any permission is false
    for (const submodulePerms of Object.values(module.permissions)) {
      if (!submodulePerms.create || !submodulePerms.read || !submodulePerms.update || !submodulePerms.delete) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all permissions for a module
   */
  static getModulePermissions(moduleName, subscription) {
    if (!subscription || !subscription.restrictions?.modules) return {};

    const module = subscription.restrictions.modules.find(m =>
      m.moduleName === moduleName && m.enabled
    );

    return module?.permissions || {};
  }

  /**
   * Get remaining bed capacity
   */
  static getRemainingBeds(subscription) {
    if (!subscription) return 10;
    const used = subscription.usage?.bedsUsed || 0;
    const max = this.getMaxBeds(subscription);
    return Math.max(0, max - used);
  }

  /**
   * Get remaining branch capacity
   */
  static getRemainingBranches(subscription) {
    if (!subscription) return 0; // Free plan doesn't allow branches
    const used = subscription.usage?.branchesUsed || 0;
    const max = this.getMaxBranches(subscription);
    return Math.max(0, max - used);
  }

  /**
   * Check if user is approaching bed limit
   */
  static isApproachingBedLimit(subscription, threshold = 0.8) {
    if (!subscription) return false;
    const used = subscription.usage?.bedsUsed || 0;
    const max = this.getMaxBeds(subscription);
    return (used / max) >= threshold;
  }

  /**
   * Check if user is approaching branch limit
   */
  static isApproachingBranchLimit(subscription, threshold = 0.8) {
    if (!subscription) return false;
    const used = subscription.usage?.branchesUsed || 0;
    const max = this.getMaxBranches(subscription);
    return (used / max) >= threshold;
  }

  /**
   * Get subscription status badge info
   */
  static getStatusBadge(subscription) {
    if (!subscription) {
      return { text: 'Free Plan', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }

    switch (subscription.status) {
      case 'active':
        return { text: 'Active', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'trial':
        return { text: 'Trial', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'expired':
        return { text: 'Expired', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
      default:
        return { text: 'Free Plan', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  }

  /**
   * Get plan name
   */
  static getPlanName(subscription) {
    if (!subscription || !subscription.plan) return 'Free Plan';
    return subscription.plan.planName;
  }

  /**
   * Check if subscription allows multiple branches
   */
  static allowsMultipleBranches(subscription) {
    // During trial period, allow multiple branches
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial active - allowing multiple branches');
      return true;
    }

    if (!subscription || !subscription.plan) return false;
    return subscription.plan.allowMultipleBranches === true;
  }

  /**
   * Get usage percentage for beds
   */
  static getBedUsagePercentage(subscription) {
    if (!subscription) return 0;
    const used = subscription.usage?.bedsUsed || 0;
    const max = this.getMaxBeds(subscription);
    return max > 0 ? Math.round((used / max) * 100) : 0;
  }

  /**
   * Get usage percentage for branches
   */
  static getBranchUsagePercentage(subscription) {
    if (!subscription) return 0;
    const used = subscription.usage?.branchesUsed || 0;
    const max = this.getMaxBranches(subscription);
    return max > 0 ? Math.round((used / max) * 100) : 0;
  }

  /**
   * Check if user can perform an action based on subscription
   */
  static canPerformAction(action, subscription) {
    switch (action) {
      case 'create_branch':
        return this.allowsMultipleBranches(subscription) && this.getRemainingBranches(subscription) > 0;
      case 'add_bed':
        return this.getRemainingBeds(subscription) > 0;
      case 'bulk_upload':
        return this.hasModule('bulk_upload', subscription);
      case 'analytics':
        return this.hasModule('analytics_reports', subscription);
      case 'custom_reports':
        return this.hasModule('custom_reports', subscription);
      case 'api_access':
        return this.hasModule('api_access', subscription);
      default:
        return true;
    }
  }

  /**
   * Check if user can access a specific route based on subscription
   */
  static canAccessRoute(route, subscription) {
    // During trial period, allow ALL routes
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial active - allowing route:', route);
      return true;
    }

    // Always allow dashboard and settings
    if (route.includes('/admin') && (route.includes('/dashboard') || route.includes('/settings'))) {
      return true;
    }

    // PG Management - always allow
    if (route.includes('/admin/pg-management')) {
      return true;
    }

    // Resident Management routes
    if (route.includes('/admin/residents') || route.includes('/admin/onboarding') ||
        route.includes('/admin/offboarding') || route.includes('/admin/moved-out')) {
      return this.hasModule('resident_management', subscription);
    }

    // Room-related routes
    if (route.includes('/admin/room-switching') || route.includes('/admin/room-availability')) {
      return this.hasModule('room_allocation', subscription);
    }

    // Payments
    if (route.includes('/admin/payments')) {
      return this.hasModule('payment_tracking', subscription);
    }

    // Tickets
    if (route.includes('/admin/tickets')) {
      return this.hasModule('ticket_system', subscription);
    }

    // Reports
    if (route.includes('/admin/reports')) {
      return this.hasModule('analytics_reports', subscription);
    }

    // QR Codes
    if (route.includes('/admin/qr-management')) {
      return this.hasModule('qr_code_payments', subscription);
    }

    // Branch Activities - only if multiple branches allowed
    if (route.includes('/admin/branch-activities')) {
      return this.allowsMultipleBranches(subscription);
    }

    // All Activities - always allow
    if (route.includes('/admin/activities') && !route.includes('/branch-activities')) {
      return true;
    }

    // Default to allow if no specific rule
    return true;
  }

  /**
   * Get subscription summary for display
   */
  static getSubscriptionSummary(subscription) {
    if (!subscription) {
      return {
        planName: 'Free Plan',
        status: 'free',
        bedsUsed: 0,
        bedsLimit: 10,
        branchesUsed: 0,
        branchesLimit: 1,
        allowsMultipleBranches: false,
        isSubscribed: false
      };
    }

    return {
      planName: this.getPlanName(subscription),
      status: subscription.status,
      bedsUsed: subscription.usage?.bedsUsed || 0,
      bedsLimit: this.getMaxBeds(subscription),
      branchesUsed: subscription.usage?.branchesUsed || 0,
      branchesLimit: this.getMaxBranches(subscription),
      allowsMultipleBranches: this.allowsMultipleBranches(subscription),
      isSubscribed: this.isSubscribed(subscription),
      trialEndDate: subscription.trialEndDate,
      endDate: subscription.endDate
    };
  }
}

/**
 * React Hook for subscription utilities
 */
export const useSubscription = () => {
  const subscription = useSelector(selectSubscription);
  const user = useSelector(selectUser);

  return {
    subscription,
    user,

    // Utility methods bound to current subscription
    isSubscribed: () => SubscriptionUtils.isSubscribed(subscription),
    isFreePlan: () => SubscriptionUtils.isFreePlan(subscription),
    getMaxBeds: () => SubscriptionUtils.getMaxBeds(subscription),
    getMaxBranches: () => SubscriptionUtils.getMaxBranches(subscription),
    canAddBeds: (currentBeds, additional = 1) => SubscriptionUtils.canAddBeds(currentBeds, additional, subscription),
    canAddBranches: (currentBranches, additional = 1) => SubscriptionUtils.canAddBranches(currentBranches, additional, subscription),
    hasFeature: (featureName) => SubscriptionUtils.hasFeature(featureName, subscription),
    hasModule: (moduleName) => SubscriptionUtils.hasModule(moduleName, subscription),
    getRemainingBeds: () => SubscriptionUtils.getRemainingBeds(subscription),
    getRemainingBranches: () => SubscriptionUtils.getRemainingBranches(subscription),
    isApproachingBedLimit: (threshold = 0.8) => SubscriptionUtils.isApproachingBedLimit(subscription, threshold),
    isApproachingBranchLimit: (threshold = 0.8) => SubscriptionUtils.isApproachingBranchLimit(subscription, threshold),
    getStatusBadge: () => SubscriptionUtils.getStatusBadge(subscription),
    getPlanName: () => SubscriptionUtils.getPlanName(subscription),
    allowsMultipleBranches: () => SubscriptionUtils.allowsMultipleBranches(subscription),
    getBedUsagePercentage: () => SubscriptionUtils.getBedUsagePercentage(subscription),
    getBranchUsagePercentage: () => SubscriptionUtils.getBranchUsagePercentage(subscription),
    canPerformAction: (action) => SubscriptionUtils.canPerformAction(action, subscription),
    canAccessRoute: (route) => SubscriptionUtils.canAccessRoute(route, subscription),
    hasPermission: (moduleName, submoduleName, permission) => SubscriptionUtils.hasPermission(moduleName, submoduleName, permission, subscription),
    canPerformActionOnSubmodule: (moduleName, submoduleName, action) => SubscriptionUtils.canPerformActionOnSubmodule(moduleName, submoduleName, action, subscription),
    getSubmodulePermissions: (moduleName, submoduleName) => SubscriptionUtils.getSubmodulePermissions(moduleName, submoduleName, subscription),
    hasRestrictedPermissions: (moduleName) => SubscriptionUtils.hasRestrictedPermissions(moduleName, subscription),
    getModulePermissions: (moduleName) => SubscriptionUtils.getModulePermissions(moduleName, subscription),
    getSubscriptionSummary: () => SubscriptionUtils.getSubscriptionSummary(subscription),

    // Admin-only checks
    isAdmin: () => user?.role === 'admin',
    isSuperAdmin: () => user?.role === 'superadmin'
  };
};

export default SubscriptionUtils;
