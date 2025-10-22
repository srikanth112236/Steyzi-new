import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Star,
  Crown,
  Zap,
  Shield,
  Users,
  Bed,
  Building2,
  BarChart3,
  Mail,
  Phone,
  Cloud,
  Smartphone,
  Globe,
  Lock,
  TrendingUp
} from 'lucide-react';

const SubscriptionPlanPreview = ({
  plan,
  isSelected = false,
  onSelect,
  showSelectButton = true,
  compact = false
}) => {
  if (!plan) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPlanIcon = (planName) => {
    if (planName.includes('Free Trial')) return Crown;
    if (planName.includes('Basic') || planName.includes('Starter')) return Star;
    if (planName.includes('Pro') || planName.includes('Professional')) return Zap;
    if (planName.includes('Enterprise')) return Building2;
    return Shield;
  };

  const getPlanColor = (planName) => {
    if (planName.includes('Free Trial')) return 'from-blue-500 to-purple-600';
    if (planName.includes('Basic') || planName.includes('Starter')) return 'from-green-500 to-emerald-600';
    if (planName.includes('Pro') || planName.includes('Professional')) return 'from-orange-500 to-red-600';
    if (planName.includes('Enterprise')) return 'from-indigo-500 to-purple-600';
    return 'from-gray-500 to-gray-600';
  };

  const PlanIcon = getPlanIcon(plan.planName);
  const gradientClass = getPlanColor(plan.planName);

  const features = plan.features || [];
  const modules = plan.modules || [];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative bg-white rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden ${
          isSelected
            ? 'border-blue-500 ring-1 ring-blue-200'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* Plan Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.planName}</h3>
              {plan.planDescription && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {plan.planDescription}
                </p>
              )}
            </div>
            {plan.isPopular && (
              <span className="ml-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                POPULAR
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="mb-4">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">
                {plan.basePrice === 0 ? 'FREE' : formatCurrency(plan.basePrice)}
              </span>
              {plan.basePrice > 0 && (
                <span className="text-sm text-gray-600">
                  /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              )}
            </div>
            {plan.annualDiscount > 0 && plan.billingCycle === 'monthly' && (
              <div className="mt-1">
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                  Save {plan.annualDiscount}% yearly
                </span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-2 mb-4">
            {features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  feature.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {feature.enabled ? (
                    <Check className="h-2.5 w-2.5 text-white" />
                  ) : (
                    <X className="h-2.5 w-2.5 text-gray-500" />
                  )}
                </div>
                <span className={`text-sm ${feature.enabled ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
            {features.length > 4 && (
              <p className="text-xs text-blue-600 font-medium ml-6">
                +{features.length - 4} more features
              </p>
            )}
          </div>

          {/* Action Button */}
          {showSelectButton && (
            <button
              onClick={() => onSelect(plan)}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelected ? 'Selected' : 'Select Plan'}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Full preview mode - Modern Design
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-3xl shadow-lg border transition-all duration-300 overflow-hidden ${
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-200 shadow-blue-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
      }`}
    >
      {/* Clean Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.planName}</h2>
            {plan.planDescription && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {plan.planDescription}
              </p>
            )}
          </div>
          {plan.isPopular && (
            <span className="ml-4 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full flex-shrink-0">
              ⭐ POPULAR
            </span>
          )}
        </div>

        {/* Modern Pricing Display */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">
              {plan.basePrice === 0 ? 'FREE' : formatCurrency(plan.basePrice)}
            </span>
            {plan.basePrice > 0 && (
              <span className="text-lg text-gray-600">
                /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            )}
          </div>

          {plan.annualDiscount > 0 && plan.billingCycle === 'monthly' && (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>Save {plan.annualDiscount}% yearly</span>
            </div>
          )}

          {plan.billingCycle === 'trial' && (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <Crown className="h-4 w-4" />
              <span>14-day free trial</span>
            </div>
          )}
        </div>

        {/* Feature List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">What's included:</h3>
          <div className="space-y-2">
            {features.slice(0, 6).map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  feature.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {feature.enabled ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <X className="h-3 w-3 text-gray-500" />
                  )}
                </div>
                <span className={`text-sm ${feature.enabled ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
            {features.length > 6 && (
              <p className="text-sm text-blue-600 font-medium ml-8">
                +{features.length - 6} more features
              </p>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <Bed className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-900">{plan.baseBedCount}</div>
            <div className="text-xs text-blue-700">Beds Included</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <Building2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-900">
              {plan.allowMultipleBranches ? '∞' : '1'}
            </div>
            <div className="text-xs text-green-700">
              {plan.allowMultipleBranches ? 'Multi-branch' : 'Single Branch'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {showSelectButton && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(plan)}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-md ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? (
              <div className="flex items-center justify-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Currently Selected</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Choose This Plan</span>
              </div>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionPlanPreview;
