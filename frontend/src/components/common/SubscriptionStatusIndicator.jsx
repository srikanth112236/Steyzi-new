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
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!subscription) return;

    // Calculate days remaining
    const calculateDaysRemaining = () => {
      let endDate;

      if (subscription.billingCycle === 'trial' && subscription.trialEndDate) {
        endDate = new Date(subscription.trialEndDate);
      } else if (subscription.endDate) {
        endDate = new Date(subscription.endDate);
      }

      if (endDate) {
        const now = new Date();
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);

        // Show banner if expired or expiring soon (within 7 days)
        if (diffDays <= 7) {
          setShowBanner(true);
        }
      }
    };

    calculateDaysRemaining();

    // Update every hour
    const interval = setInterval(calculateDaysRemaining, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [subscription]);

  // Don't show for superadmin, support, or sales roles
  if (user?.role === 'superadmin' || user?.role === 'support' ||
      user?.salesRole === 'sales_manager' || user?.salesRole === 'sub_sales') {
    return null;
  }

  if (!subscription || !showBanner) return null;

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

    if (subscription.status === 'expired' || daysRemaining < 0) {
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
      if (daysRemaining <= 0) {
        return {
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: FiAlertCircle,
          title: 'Trial Expired',
          message: 'Your free trial has ended. Upgrade to a paid plan to continue.',
          action: 'Upgrade Now',
          actionColor: 'bg-orange-600 hover:bg-orange-700'
        };
      }

      return {
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: FiClock,
        title: `Trial Ending Soon`,
        message: `Your trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Upgrade to continue using all features.`,
        action: 'Upgrade',
        actionColor: 'bg-yellow-600 hover:bg-yellow-700'
      };
    }

    if (daysRemaining <= 3) {
      return {
        color: 'bg-orange-50 border-orange-200 text-orange-800',
        icon: FiAlertCircle,
        title: 'Subscription Expiring Soon',
        message: `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew now to avoid service interruption.`,
        action: 'Renew',
        actionColor: 'bg-orange-600 hover:bg-orange-700'
      };
    }

    if (daysRemaining <= 7) {
      return {
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: FiClock,
        title: 'Subscription Renewal Reminder',
        message: `Your subscription expires in ${daysRemaining} days. Consider renewing to ensure uninterrupted service.`,
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
