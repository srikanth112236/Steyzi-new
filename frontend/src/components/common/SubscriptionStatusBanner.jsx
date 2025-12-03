import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, Clock, Zap, Crown, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useSubscriptionManager } from '../../hooks/useSubscriptionManager';
import toast from 'react-hot-toast';

/**
 * Subscription Status Banner Component
 * Shows trial expiry warnings, usage limits, and subscription status alerts
 */
const SubscriptionStatusBanner = () => {
  const { user } = useSelector((state) => state.auth);
  const {
    subscription,
    getSubscriptionSummary,
    getSubscriptionHealth,
    forceRefresh
  } = useSubscriptionManager();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const summary = getSubscriptionSummary();
  const health = getSubscriptionHealth();

  // Don't show banner for maintainers
  if (user?.role === 'maintainer') {
    return null;
  }

  // Auto-expand for critical issues
  useEffect(() => {
    if (health?.issues?.some(issue => issue.type === 'critical')) {
      setIsExpanded(true);
    }
  }, [health]);

  if (!subscription || !summary || !health) {
    return null;
  }

  // Don't show banner if everything is healthy and no trial
  if (health.isHealthy && !summary.isTrialActive) {
    return null;
  }

  const getBannerStyle = () => {
    const hasCritical = health.issues.some(issue => issue.type === 'critical');
    const hasWarnings = health.issues.some(issue => issue.type === 'warning');

    if (hasCritical) {
      return {
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-800',
        icon: AlertTriangle,
        iconColor: 'text-red-600'
      };
    } else if (hasWarnings) {
      return {
        bgClass: 'bg-yellow-50 border-yellow-200',
        textClass: 'text-yellow-800',
        icon: Clock,
        iconColor: 'text-yellow-600'
      };
    } else if (summary.isTrialActive) {
      return {
        bgClass: 'bg-blue-50 border-blue-200',
        textClass: 'text-blue-800',
        icon: Zap,
        iconColor: 'text-blue-600'
      };
    } else {
      return {
        bgClass: 'bg-green-50 border-green-200',
        textClass: 'text-green-800',
        icon: Crown,
        iconColor: 'text-green-600'
      };
    }
  };

  const bannerStyle = getBannerStyle();
  const IconComponent = bannerStyle.icon;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsRefreshing(false);
    }
  };

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getVisibleIssues = () => {
    return health.issues.filter(issue => !dismissedAlerts.has(issue.message));
  };

  const visibleIssues = getVisibleIssues();

  // Don't show banner if no visible issues and not in trial
  if (visibleIssues.length === 0 && !summary.isTrialActive) {
    return null;
  }

  return (
    <div className={`border-l-4 ${bannerStyle.bgClass} p-4 mb-4 relative`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <IconComponent className={`h-5 w-5 ${bannerStyle.iconColor} mt-0.5`} />
          <div className="flex-1">
            {/* Main message */}
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${bannerStyle.textClass}`}>
                {summary.isTrialActive ? 'Trial Active' : 'Subscription Status'}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-1 rounded-md ${bannerStyle.iconColor} hover:bg-white hover:bg-opacity-50 transition-colors ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                  title="Refresh subscription status"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {visibleIssues.length > 0 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-1 rounded-md ${bannerStyle.iconColor} hover:bg-white hover:bg-opacity-50 transition-colors`}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Trial info or main status */}
            <div className={`text-sm ${bannerStyle.textClass} mt-1`}>
              {summary.isTrialActive ? (
                <span>
                  <strong>{summary.planName}</strong> - {summary.trialDaysRemaining} days remaining
                  {summary.trialDaysRemaining <= 3 && (
                    <span className="font-semibold text-red-600 ml-2">
                      (Expires soon!)
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  <strong>{summary.planName}</strong> - {summary.status.charAt(0).toUpperCase() + summary.status.slice(1)}
                </span>
              )}
            </div>

            {/* Usage summary */}
            <div className="flex items-center space-x-4 mt-2 text-xs">
              <span className={bannerStyle.textClass}>
                Beds: {subscription.usage?.bedsUsed || 0} / {subscription.restrictions?.maxBeds || 0}
              </span>
              <span className={bannerStyle.textClass}>
                Branches: {subscription.usage?.branchesUsed || 0} / {subscription.restrictions?.maxBranches || 0}
              </span>
            </div>

            {/* Expandable issues section */}
            {isExpanded && visibleIssues.length > 0 && (
              <div className="mt-3 space-y-2">
                {visibleIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      issue.type === 'critical'
                        ? 'bg-red-100 border border-red-200'
                        : 'bg-yellow-100 border border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        issue.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      <span className={`text-sm ${
                        issue.type === 'critical' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {issue.message}
                      </span>
                    </div>
                    <button
                      onClick={() => dismissAlert(issue.message)}
                      className={`p-1 rounded-md hover:bg-white hover:bg-opacity-50 transition-colors ${
                        issue.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-3 mt-3">
              {summary.isTrialActive && summary.trialDaysRemaining <= 3 && (
                <button
                  onClick={() => {
                    // Navigate to subscription selection
                    toast.success('Navigate to subscription upgrade page');
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade Now
                </button>
              )}

              {visibleIssues.some(issue => issue.message.includes('bed limit')) && (
                <button
                  onClick={() => {
                    // Navigate to add beds or upgrade
                    toast.success('Navigate to add beds or upgrade plan');
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Beds
                </button>
              )}

              {visibleIssues.some(issue => issue.message.includes('branch limit')) && (
                <button
                  onClick={() => {
                    // Navigate to add branches or upgrade
                    toast.success('Navigate to add branches or upgrade plan');
                  }}
                  className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                  Add Branches
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusBanner;
