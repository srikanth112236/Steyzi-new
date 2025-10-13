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
        className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 overflow-hidden ${
          isSelected
            ? 'border-blue-500 shadow-blue-200 shadow-2xl'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradientClass} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <PlanIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{plan.planName}</h3>
                <p className="text-sm opacity-90">{plan.planDescription}</p>
              </div>
            </div>
            {plan.isPopular && (
              <div className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                POPULAR
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="p-4 bg-gray-50">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {plan.basePrice === 0 ? 'FREE' : formatCurrency(plan.basePrice)}
            </div>
            <div className="text-sm text-gray-600">
              {plan.billingCycle === 'monthly' ? '/month' :
               plan.billingCycle === 'annual' ? '/year' : ''}
            </div>
            {plan.annualDiscount > 0 && (
              <div className="text-xs text-green-600 font-medium mt-1">
                Save {plan.annualDiscount}% annually
              </div>
            )}
          </div>
        </div>

        {/* Key Features */}
        <div className="p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Bed className="h-4 w-4 text-blue-500" />
              <span>Up to {plan.baseBedCount} beds</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Building2 className="h-4 w-4 text-green-500" />
              <span>{plan.allowMultipleBranches ? 'Multi-branch' : 'Single branch'}</span>
            </div>
            {plan.billingCycle !== 'trial' && (
              <div className="flex items-center space-x-2 text-sm">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span>Advanced analytics</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {showSelectButton && (
          <div className="p-4 pt-0">
            <button
              onClick={() => onSelect(plan)}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelected ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // Full preview mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-3xl shadow-2xl border-2 transition-all duration-500 overflow-hidden ${
        isSelected
          ? 'border-blue-500 shadow-blue-200 shadow-2xl scale-105'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
      }`}
    >
      {/* Header with Gradient */}
      <div className={`bg-gradient-to-br ${gradientClass} p-8 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <PlanIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{plan.planName}</h2>
                <p className="text-blue-100 text-sm leading-relaxed max-w-md">
                  {plan.planDescription}
                </p>
              </div>
            </div>
            {plan.isPopular && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-full text-sm shadow-lg"
              >
                ⭐ MOST POPULAR
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-5xl font-bold text-gray-900">
              {plan.basePrice === 0 ? 'FREE' : formatCurrency(plan.basePrice)}
            </span>
            {plan.basePrice > 0 && (
              <span className="text-lg text-gray-600 self-end mb-2">
                /{plan.billingCycle === 'monthly' ? 'month' :
                  plan.billingCycle === 'annual' ? 'year' : 'trial'}
              </span>
            )}
          </div>

          {plan.annualDiscount > 0 && plan.billingCycle === 'monthly' && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="h-4 w-4" />
              <span>Save {plan.annualDiscount}% with annual billing</span>
            </div>
          )}

          {plan.billingCycle === 'trial' && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Crown className="h-4 w-4" />
              <span>14-day free trial</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-8 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Plan Includes</h3>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <Bed className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{plan.baseBedCount}</div>
            <div className="text-sm text-blue-700">Beds Included</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {plan.allowMultipleBranches ? '∞' : '1'}
            </div>
            <div className="text-sm text-green-700">
              {plan.allowMultipleBranches ? 'Multi-branch' : 'Single Branch'}
            </div>
          </div>
        </div>

        {/* Module Access */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Module Access</h4>
          <div className="grid grid-cols-1 gap-3">
            {modules.slice(0, 6).map((module, index) => (
              <motion.div
                key={module.moduleName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  module.enabled ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {module.enabled ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 capitalize">
                    {module.moduleName.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {module.enabled ? 'Full access' : 'Not included'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {showSelectButton && (
        <div className="p-8 bg-gray-50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(plan)}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
              isSelected
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
            }`}
          >
            {isSelected ? (
              <div className="flex items-center justify-center space-x-2">
                <Check className="h-5 w-5" />
                <span>Currently Selected</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Choose This Plan</span>
              </div>
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default SubscriptionPlanPreview;
