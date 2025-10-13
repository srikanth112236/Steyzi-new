import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bed, TrendingUp, DollarSign, X, Check, Package } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentPlan, selectRestrictions, selectCurrentUsage } from '../../store/slices/subscription.slice';
import subscriptionService from '../../services/subscription.service';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BedLimitExceededModal = ({
  isOpen,
  onClose,
  requestedBeds = 1,
  currentBedsUsed = 0,
  subscriptionErrorDetails,
  onTopUpConfirm,
  onUpgrade
}) => {
  const currentPlan = useSelector(selectCurrentPlan);
  const restrictions = useSelector(selectRestrictions);
  const currentUsage = useSelector(selectCurrentUsage);
  
  const [topUpBeds, setTopUpBeds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pricingCalculation, setPricingCalculation] = useState(null);

  // Use subscription error details if available, otherwise fall back to Redux state
  const maxBeds = subscriptionErrorDetails?.limit || restrictions.maxBeds || currentPlan?.baseBedCount || 0;
  const currentBedsUsedActual = subscriptionErrorDetails?.currentUsage !== undefined ? subscriptionErrorDetails.currentUsage : currentBedsUsed;
  const bedsNeeded = subscriptionErrorDetails?.requested ? Math.max(0, subscriptionErrorDetails.requested - (subscriptionErrorDetails.limit - subscriptionErrorDetails.currentUsage)) : Math.max(0, (currentBedsUsedActual + requestedBeds) - maxBeds);
  const topUpPricePerBed = currentPlan?.topUpPricePerBed || 0;

  // Determine if this is a trial limit, free limit, or paid limit error
  const isTrialLimit = subscriptionErrorDetails?.trialLimit || subscriptionErrorDetails?.trialExpired;
  const isFreeLimit = subscriptionErrorDetails?.freeLimit;
  const isPaidLimit = subscriptionErrorDetails?.paidLimit;
  const isBulkUploadLimit = subscriptionErrorDetails?.bulkUploadLimit;

  useEffect(() => {
    if (isOpen && bedsNeeded > 0) {
      setTopUpBeds(bedsNeeded);
    }
  }, [isOpen, bedsNeeded]);

  useEffect(() => {
    if (currentPlan && topUpBeds > 0) {
      calculatePricing();
    }
  }, [topUpBeds, currentPlan]);

  const calculatePricing = async () => {
    try {
      const newTotalBeds = maxBeds + topUpBeds;
      const response = await api.post(`/api/subscriptions/${currentPlan._id}/calculate`, {
        bedCount: newTotalBeds
      });
      
      if (response.data.success) {
        setPricingCalculation(response.data.data);
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const handleTopUpConfirm = async () => {
    try {
      setLoading(true);
      
      // Update subscription with new bed count
      const response = await api.post('/users/subscription/add-beds', {
        additionalBeds: topUpBeds,
        newMaxBeds: maxBeds + topUpBeds
      });

      if (response.data.success) {
        toast.success(`Successfully added ${topUpBeds} beds to your plan!`);
        
        // Trigger subscription refetch to update limits everywhere
        window.location.reload();
        
        if (onTopUpConfirm) {
          onTopUpConfirm(topUpBeds);
        }
        
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add beds');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {isFreeLimit ? 'Free Plan Bed Limit Reached' :
                 isTrialLimit ? 'Free Trial Bed Limit Reached' : 'Bed Limit Exceeded'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {subscriptionErrorDetails?.message ||
                  (isFreeLimit
                    ? 'Your free plan has reached the bed limit. Upgrade to add more beds.'
                    : isTrialLimit
                    ? 'Your free trial has reached the bed limit. Upgrade to add more beds.'
                    : 'You\'ve reached the maximum bed limit for your current plan'
                  )
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Current Situation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Current Plan</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {isFreeLimit ? 'Free Plan' : currentPlan?.planName || 'Free'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Bed className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Current Limit</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{maxBeds} beds</p>
                {isTrialLimit && (
                  <p className="text-xs text-blue-600 mt-1">Free Trial</p>
                )}
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Beds Used</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{currentBedsUsedActual} beds</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Beds Needed</span>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  +{subscriptionErrorDetails?.requested || bedsNeeded} beds
                </p>
              </div>
              {subscriptionErrorDetails?.remaining !== undefined && (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Beds Remaining</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">{subscriptionErrorDetails.remaining} beds</p>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Choose an Option</h4>

            {/* Options Container */}
            <>
              {/* Option 1: Top-Up Beds (only for paid users) */}
              {!isFreeLimit && (
                <div className="space-y-4 mb-4">
                <div className="border-2 border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Add More Beds (Recommended)</span>
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">
                      Top-up your current plan with additional beds
                    </p>
                  </div>
                </div>

                {/* Bed Counter */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Additional Beds
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setTopUpBeds(Math.max(bedsNeeded, topUpBeds - 1))}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={bedsNeeded}
                      value={topUpBeds}
                      onChange={(e) => setTopUpBeds(Math.max(bedsNeeded, parseInt(e.target.value) || bedsNeeded))}
                      className="w-24 px-4 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setTopUpBeds(topUpBeds + 1)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-600">
                      @ {subscriptionService.formatCurrency(topUpPricePerBed)}/bed
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum {bedsNeeded} beds required to proceed
                  </p>
                </div>

                {/* Pricing Breakdown */}
                {pricingCalculation && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h6 className="font-semibold text-gray-900 mb-3">Updated Pricing</h6>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price</span>
                        <span className="font-medium">{subscriptionService.formatCurrency(pricingCalculation.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Top-up ({topUpBeds} beds)</span>
                        <span className="font-medium text-green-600">
                          +{subscriptionService.formatCurrency(pricingCalculation.topUpCost)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="font-semibold text-gray-900">New Monthly Total</span>
                        <span className="font-bold text-blue-600 text-lg">
                          {subscriptionService.formatCurrency(pricingCalculation.totalMonthlyPrice)}
                        </span>
                      </div>
                      {currentPlan?.billingCycle === 'annual' && (
                        <div className="flex justify-between text-gray-600">
                          <span>Annual Total</span>
                          <span>{subscriptionService.formatCurrency(pricingCalculation.totalAnnualPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleTopUpConfirm}
                  disabled={loading || topUpBeds < bedsNeeded}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Add {topUpBeds} Beds for {subscriptionService.formatCurrency(topUpBeds * topUpPricePerBed)}/month</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

            {/* Option 2: Upgrade Plan (always shown) */}
            {onUpgrade && (
                <div className="border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <Package className="h-5 w-5 text-purple-600" />
                        <span>
                          {isFreeLimit ? 'Upgrade from Free Plan' :
                           isTrialLimit ? 'Upgrade from Trial' : 'Upgrade to Higher Plan'}
                        </span>
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {isFreeLimit
                          ? 'Unlock unlimited beds and premium features'
                          : isTrialLimit
                          ? 'Continue with premium features after trial ends'
                          : 'Get more beds and features with a different plan'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onUpgrade();
                      onClose();
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
                  >
                    View Available Plans
                  </button>
                </div>
              )}
            </>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Note:</strong> Adding beds will update your monthly billing immediately. 
              The new pricing will be reflected in your next billing cycle.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BedLimitExceededModal;
