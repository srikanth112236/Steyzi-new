import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Award,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  DollarSign,
  Bed,
  TrendingUp,
  CheckCircle,
  XCircle,
  Users,
  Package,
  Building2,
  RefreshCw
} from 'lucide-react';
import subscriptionService from '../../../services/subscription.service';

const SubscriptionCard = ({
  subscription,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePopular,
  onToggleRecommended
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(subscription.subscribedCount || 0);
  const [loadingCount, setLoadingCount] = useState(false);

  // Fetch real-time subscriber count
  useEffect(() => {
    const fetchSubscriberCount = async () => {
      try {
        setLoadingCount(true);
        const result = await subscriptionService.getActiveSubscriptionsByPlan();
        if (result.success && result.data) {
          const planData = result.data.find(plan => plan._id === subscription._id);
          if (planData) {
            setSubscriberCount(planData.count || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching subscriber count:', error);
        // Keep the static count as fallback
      } finally {
        setLoadingCount(false);
      }
    };

    fetchSubscriberCount();
  }, [subscription._id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBillingCycleColor = (cycle) => {
    return cycle === 'monthly'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
        subscription.isRecommended
          ? 'border-blue-300 ring-2 ring-blue-100'
          : 'border-gray-100'
      }`}
    >
      {/* Header with badges */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{subscription.planName}</h3>
              {subscription.isPopular && (
                <span className="flex items-center space-x-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                  <Star className="h-3 w-3 fill-current" />
                  <span>Popular</span>
                </span>
              )}
              {subscription.isRecommended && (
                <span className="flex items-center space-x-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200">
                  <Award className="h-3 w-3" />
                  <span>Recommended</span>
                </span>
              )}
            </div>
            
            {subscription.planDescription && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {subscription.planDescription}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onEdit(subscription);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onDuplicate(subscription);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Duplicate</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onTogglePopular(subscription);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Star className="h-4 w-4" />
                    <span>{subscription.isPopular ? 'Remove Popular' : 'Mark Popular'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onToggleRecommended(subscription);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Award className="h-4 w-4" />
                    <span>{subscription.isRecommended ? 'Remove Recommended' : 'Mark Recommended'}</span>
                  </button>
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  <button
                    onClick={() => {
                      onDelete(subscription);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(subscription.status)}`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded border ${getBillingCycleColor(subscription.billingCycle)}`}>
            {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
          </span>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {subscriptionService.formatCurrency(subscription.basePrice)}
          </span>
          <span className="text-gray-600">
            /{subscription.billingCycle === 'monthly' ? 'month' : 'year'}
          </span>
        </div>

        {subscription.billingCycle === 'annual' && subscription.annualDiscount > 0 && (
          <p className="text-sm text-green-600 font-medium">
            Save {subscription.annualDiscount}% with annual billing
          </p>
        )}

        {subscription.setupFee > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            + {subscriptionService.formatCurrency(subscription.setupFee)} setup fee
          </p>
        )}
      </div>

      {/* Bed Management Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bed className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Base Beds</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{subscription.baseBedCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Top-up per Bed</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {subscriptionService.formatCurrency(subscription.topUpPricePerBed)}
            </span>
          </div>

          {subscription.maxBedsAllowed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Max Beds</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{subscription.maxBedsAllowed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Branch Support Section */}
      {subscription.allowMultipleBranches && (
        <div className="p-6 border-b border-gray-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium text-gray-700">Max Branches</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{subscription.branchCount}</span>
            </div>

            {subscription.bedsPerBranch && subscription.bedsPerBranch !== subscription.baseBedCount && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bed className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">Beds per Branch</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{subscription.bedsPerBranch}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Branch Cost</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {subscriptionService.formatCurrency(subscription.costPerBranch)}/month
              </span>
            </div>

            <div className="mt-3 p-2 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-xs text-teal-800">
                <strong>Multi-branch enabled:</strong> Users can create up to {subscription.branchCount} branches.
                Each additional branch costs {subscriptionService.formatCurrency(subscription.costPerBranch)}/month.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      {subscription.features && subscription.features.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Features</h4>
          <div className="space-y-2">
            {subscription.features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                {feature.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                )}
                <span className={`text-sm ${feature.enabled ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
            {subscription.features.length > 4 && (
              <p className="text-xs text-blue-600 font-medium">
                +{subscription.features.length - 4} more features
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modules Section */}
      {subscription.modules && subscription.modules.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Modules</h4>
          <div className="flex flex-wrap gap-2">
            {subscription.modules.slice(0, 6).map((module, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 text-xs font-medium rounded ${
                  module.enabled
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {module.moduleName.replace(/_/g, ' ').toUpperCase()}
              </span>
            ))}
            {subscription.modules.length > 6 && (
              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                +{subscription.modules.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-6 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="h-4 w-4" />
            {loadingCount ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <span>{subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}</span>
            )}
          </div>

          {subscription.trialPeriodDays > 0 && (
            <div className="flex items-center space-x-2 text-green-600">
              <Calendar className="h-4 w-4" />
              <span>{subscription.trialPeriodDays} day trial</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;
