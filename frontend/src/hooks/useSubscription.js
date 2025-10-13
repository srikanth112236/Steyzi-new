import { useSubscription as useNewSubscription } from '../utils/subscriptionUtils';

/**
 * Hook to manage and check subscription restrictions
 * Now uses the new auth-based subscription system
 */
export const useSubscription = () => {
  const subscriptionUtils = useNewSubscription();

  // Return all methods from the new subscription utils
  return {
    // Plan info
    currentPlan: subscriptionUtils.subscription?.plan || null,
    subscriptionStatus: subscriptionUtils.subscription?.status || 'free',
    restrictions: subscriptionUtils.subscription?.restrictions || {
      maxBeds: 10,
      maxBranches: 1,
      modules: [],
      features: []
    },
    currentUsage: subscriptionUtils.subscription?.usage || {
      bedsUsed: 0,
      branchesUsed: 0
    },

    // All utility methods from the new system
    ...subscriptionUtils,

    // Legacy method aliases for backward compatibility
    canAddMoreBeds: subscriptionUtils.canAddBeds,
    canAddBeds: subscriptionUtils.canAddBeds,
    isSubscriptionActive: subscriptionUtils.isSubscribed,
    isFeatureEnabled: subscriptionUtils.hasFeature,
    isModuleEnabled: subscriptionUtils.hasModule,

    // Legacy method implementations
    updateBedsUsage: (count) => {
      // This would need to be implemented with an API call to update usage
      console.warn('updateBedsUsage is not implemented in the new subscription system');
    },

    getSubscriptionLimits: () => ({
      maxBeds: subscriptionUtils.getMaxBeds(),
      bedsUsed: subscriptionUtils.subscription?.usage?.bedsUsed || 0,
      bedsRemaining: subscriptionUtils.getRemainingBeds(),
      enabledModules: subscriptionUtils.subscription?.restrictions?.modules?.length || 0,
      enabledFeatures: subscriptionUtils.subscription?.restrictions?.features?.length || 0,
    }),
  };
};
