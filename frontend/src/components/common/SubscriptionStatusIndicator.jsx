import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheck, FiClock, FiXCircle } from 'react-icons/fi';

/**
 * Subscription Status Indicator
 * Shows current subscription status on all pages
 */
const SubscriptionStatusIndicator = () => {
  const navigate = useNavigate();
  const { subscription, user } = useSelector((state) => state.auth);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!subscription) return;

    // Calculate exact time remaining (days, hours, minutes)
    const calculateTimeRemaining = () => {
      let endDate;

      if (subscription.billingCycle === 'trial' && subscription.trialEndDate) {
        endDate = new Date(subscription.trialEndDate);
      } else if (subscription.endDate) {
        endDate = new Date(subscription.endDate);
      }

      if (endDate) {
        const now = new Date();
        const diffMs = endDate - now;

        if (diffMs > 0) {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
          const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          setTimeRemaining({ days, hours, minutes, totalHours, totalDays, expired: false });

          // Show banner if:
          // 1. Trial is active (always show for active trials)
          // 2. Expired or expiring soon (within 7 days)
          // 3. Subscription expiring soon (within 7 days)
          if (subscription.billingCycle === 'trial' && totalDays > 0) {
            // Always show for active trials
            setShowBanner(true);
          } else if (totalDays <= 7) {
            // Show for expiring subscriptions
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
        } else {
          setTimeRemaining({ days: 0, hours: 0, minutes: 0, totalHours: 0, totalDays: 0, expired: true });
          setShowBanner(true);
        }
      }
    };

    calculateTimeRemaining();

    // Update every minute for accurate countdown
    const interval = setInterval(calculateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [subscription]);

  // Don't show for superadmin, support, maintainer, or sales roles
  if (user?.role === 'superadmin' || user?.role === 'support' || user?.role === 'maintainer' ||
      user?.salesRole === 'sales_manager' || user?.salesRole === 'sub_sales') {
    return null;
  }

  if (!subscription || !showBanner || !timeRemaining) return null;

  const getStatusConfig = () => {
    if (!subscription.status) {
      return {
        color: 'bg-gray-100 border-gray-300 text-gray-700',
        icon: FiAlertCircle,
        title: 'No Subscription',
        message: 'Please select a subscription plan to continue',
        action: 'Select Plan',
        actionColor: 'bg-blue-600 hover:bg-blue-700'
      };
    }

    if (subscription.status === 'expired' || timeRemaining.expired) {
      return {
        color: 'bg-red-50 border-red-200 text-red-800',
        icon: FiXCircle,
        title: 'Subscription Expired',
        message: 'Your subscription has expired. Renew now to continue using the service.',
        action: 'Renew Now',
        actionColor: 'bg-red-600 hover:bg-red-700'
      };
    }

    if (subscription.billingCycle === 'trial') {
      if (timeRemaining.expired) {
        return {
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: FiAlertCircle,
          title: 'Trial Expired',
          message: 'Your free trial has ended. Upgrade to a paid plan to continue.',
          action: 'Upgrade Now',
          actionColor: 'bg-orange-600 hover:bg-orange-700'
        };
      }

      // Format time remaining message
      const formatTimeRemaining = () => {
        if (timeRemaining.totalDays >= 1) {
          if (timeRemaining.days === 1 && timeRemaining.hours === 0) {
            return '1 day';
          }
          return `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''}${timeRemaining.hours > 0 ? ` ${timeRemaining.hours} hour${timeRemaining.hours !== 1 ? 's' : ''}` : ''}`;
        } else if (timeRemaining.totalHours >= 1) {
          return `${timeRemaining.hours} hour${timeRemaining.hours !== 1 ? 's' : ''}${timeRemaining.minutes > 0 ? ` ${timeRemaining.minutes} minute${timeRemaining.minutes !== 1 ? 's' : ''}` : ''}`;
        } else {
          return `${timeRemaining.minutes} minute${timeRemaining.minutes !== 1 ? 's' : ''}`;
        }
      };

      const timeText = formatTimeRemaining();

      // Show different messages based on time remaining
      if (timeRemaining.totalDays < 1) {
        // Less than 1 day - show hours/minutes
        return {
          color: 'bg-red-50 border-red-200 text-red-800',
          icon: FiAlertCircle,
          title: 'Trial Ending Soon',
          message: `Your free trial expires in ${timeText}. Upgrade now to continue using all features without restrictions.`,
          action: 'Upgrade Now',
          actionColor: 'bg-red-600 hover:bg-red-700'
        };
      }

      if (timeRemaining.totalDays <= 1) {
        return {
          color: 'bg-red-50 border-red-200 text-red-800',
          icon: FiAlertCircle,
          title: 'Trial Ending Soon',
          message: `Your free trial expires in ${timeText}. Upgrade now to continue using all features.`,
          action: 'Upgrade Now',
          actionColor: 'bg-red-600 hover:bg-red-700'
        };
      }

      if (timeRemaining.totalDays <= 3) {
        return {
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: FiAlertCircle,
          title: 'Trial Ending Soon',
          message: `Your free trial expires in ${timeText}. Upgrade now to continue using all features.`,
          action: 'Upgrade Now',
          actionColor: 'bg-orange-600 hover:bg-orange-700'
        };
      }

      if (timeRemaining.totalDays <= 7) {
        return {
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: FiClock,
          title: 'Trial Ending Soon',
          message: `Your free trial expires in ${timeText}. Upgrade to continue using all features.`,
          action: 'Upgrade',
          actionColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      }

      // Active trial with more than 7 days remaining
      return {
        color: 'bg-green-50 border-green-200 text-green-800',
        icon: FiCheck,
        title: 'Free Trial Active',
        message: `Your free trial is active with ${timeText} remaining. Enjoy all premium features!`,
        action: 'View Plans',
        actionColor: 'bg-green-600 hover:bg-green-700'
      };
    }

    if (timeRemaining.totalDays <= 3) {
      return {
        color: 'bg-orange-50 border-orange-200 text-orange-800',
        icon: FiAlertCircle,
        title: 'Subscription Expiring Soon',
        message: `Your subscription expires in ${timeRemaining.totalDays} day${timeRemaining.totalDays !== 1 ? 's' : ''}. Renew now to avoid service interruption.`,
        action: 'Renew',
        actionColor: 'bg-orange-600 hover:bg-orange-700'
      };
    }

    if (timeRemaining.totalDays <= 7) {
      return {
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: FiClock,
        title: 'Subscription Renewal Reminder',
        message: `Your subscription expires in ${timeRemaining.totalDays} days. Consider renewing to ensure uninterrupted service.`,
        action: 'Renew',
        actionColor: 'bg-blue-600 hover:bg-blue-700'
      };
    }

    return null;
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  const handleAction = () => {
    navigate('/admin/subscription-selection');
  };

  return (
    <div className={`${config.color} border rounded-lg p-4 mb-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{config.title}</h3>
            <p className="text-sm mt-1">{config.message}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleAction}
            className={`${config.actionColor} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap`}
          >
            {config.action}
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Dismiss"
          >
            <FiXCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusIndicator;
