import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Subscription Guard Hook
 * Protects routes by checking subscription status and redirecting if needed
 * @param {boolean} requireActive - Whether to require an active subscription
 */
export const useSubscriptionGuard = (requireActive = true) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscription } = useSelector((state) => state.auth);

  useEffect(() => {
    // Don't check on subscription-related pages
    const exemptPaths = [
      '/admin/subscription-selection',
      '/admin/subscription-history',
      '/admin/settings',
      '/admin/payment/callback'
    ];

    if (exemptPaths.some(path => location.pathname.startsWith(path))) {
      return;
    }

    // Bypass roles don't need subscription checks
    const bypassRoles = ['superadmin', 'support', 'sales_manager', 'sales', 'sub_sales'];
    if (bypassRoles.includes(user?.role) || bypassRoles.includes(user?.salesRole)) {
      return;
    }

    if (!requireActive) {
      return;
    }

    // Check if user has a subscription
    if (!subscription || !subscription.plan) {
      toast.error('Please select a subscription plan to continue');
      navigate('/admin/subscription-selection', { replace: true });
      return;
    }

    // Check if subscription is expired
    const now = new Date();
    let isExpired = false;

    // Check trial expiration
    if (subscription.billingCycle === 'trial' && subscription.trialEndDate) {
      const trialEnd = new Date(subscription.trialEndDate);
      isExpired = trialEnd < now;
    }
    // Check regular subscription expiration
    else if (subscription.endDate) {
      const subEnd = new Date(subscription.endDate);
      isExpired = subEnd < now;
    }

    if (isExpired) {
      toast.error('Your subscription has expired. Please renew to continue.');
      navigate('/admin/subscription-selection', { replace: true });
      return;
    }

    // Check if subscription is active (not cancelled or suspended)
    if (subscription.status !== 'active' && subscription.billingCycle !== 'trial') {
      toast.error('Your subscription is not active. Please contact support or renew your subscription.');
      navigate('/admin/subscription-selection', { replace: true });
      return;
    }

  }, [user, subscription, location.pathname, navigate, requireActive]);

  return {
    isActive: subscription?.status === 'active' || subscription?.billingCycle === 'trial',
    isExpired: checkExpiry(subscription),
    subscription
  };
};

/**
 * Helper function to check if subscription is expired
 */
function checkExpiry(subscription) {
  if (!subscription) return true;

  const now = new Date();

  // Check trial expiration
  if (subscription.billingCycle === 'trial' && subscription.trialEndDate) {
    return new Date(subscription.trialEndDate) < now;
  }

  // Check regular subscription expiration
  if (subscription.endDate) {
    return new Date(subscription.endDate) < now;
  }

  return false;
}

/**
 * Hook to check if user has a specific module access
 * @param {string} moduleName - The module name to check
 * @returns {boolean} Whether user has access to the module
 */
export const useModuleAccess = (moduleName) => {
  const { subscription, user } = useSelector((state) => state.auth);

  // Bypass roles have access to everything
  const bypassRoles = ['superadmin', 'support', 'sales_manager', 'sales', 'sub_sales'];
  if (bypassRoles.includes(user?.role) || bypassRoles.includes(user?.salesRole)) {
    return true;
  }

  // Trial users have access to all modules
  if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
    return true;
  }

  // Check if module is in the subscription plan
  if (!subscription?.plan?.modules) {
    return false;
  }

  return subscription.plan.modules.some(
    m => m.moduleName === moduleName && m.enabled
  );
};

export default useSubscriptionGuard;
