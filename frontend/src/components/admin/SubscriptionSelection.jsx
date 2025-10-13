import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Check,
  Star,
  Award,
  Bed,
  TrendingUp,
  Calendar,
  DollarSign,
  Loader,
  AlertCircle,
  CheckCircle,
  Minus,
  Plus,
  XCircle,
  Building2,
  X,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchAvailablePlans,
  fetchUserSubscription,
  selectSubscriptionPlan,
  selectCurrentPlan,
  selectSubscriptionStatus,
  selectRestrictions,
  selectCurrentUsage,
  selectAvailablePlans,
  selectPlansLoading,
  selectSubscriptionLoading
} from '../../store/slices/subscription.slice';
import { getCurrentUser, selectUser } from '../../store/slices/authSlice';
import subscriptionService from '../../services/subscription.service';
import SubscriptionPlanPreview from '../common/SubscriptionPlanPreview';
import authService from '../../services/auth.service';

const SubscriptionSelection = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const currentPlan = useSelector(selectCurrentPlan);
  const subscriptionStatus = useSelector(selectSubscriptionStatus);
  const restrictions = useSelector(selectRestrictions);
  const currentUsage = useSelector(selectCurrentUsage);
  const allAvailablePlans = useSelector(selectAvailablePlans);
  const plansLoading = useSelector(selectPlansLoading);
  const loading = useSelector(selectSubscriptionLoading);

  // Filter out system plans (trial-related plans) that shouldn't be user-selectable
  const availablePlans = allAvailablePlans.filter(plan =>
    plan.planName !== 'Free Trial Plan' &&
    plan.planName !== 'Trial Expired Plan'
  );
  
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlan?._id || null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [showChangeSummary, setShowChangeSummary] = useState(false);
  const [changeSummary, setChangeSummary] = useState(null);
  const [showBedCountInput, setShowBedCountInput] = useState(false);
  const [tempBedCount, setTempBedCount] = useState(1);
  const [tempBranchCount, setTempBranchCount] = useState(1);
  const [selectedPlanForConfig, setSelectedPlanForConfig] = useState(null);
  const [planConfigurations, setPlanConfigurations] = useState({}); // Store bed/branch selections per plan
  const [useModernPreview, setUseModernPreview] = useState(true); // Toggle for modern preview
  const [showPlanPreview, setShowPlanPreview] = useState(false); // Preview modal state
  const [previewPlan, setPreviewPlan] = useState(null); // Plan to preview
  const [showAddBedsModal, setShowAddBedsModal] = useState(false); // Add beds modal state
  const [selectedPlanForBedAddition, setSelectedPlanForBedAddition] = useState(null); // Plan to add beds to
  const [additionalBeds, setAdditionalBeds] = useState(1); // Number of beds to add
  const [showAddBranchesModal, setShowAddBranchesModal] = useState(false); // Add branches modal state
  const [selectedPlanForBranchAddition, setSelectedPlanForBranchAddition] = useState(null); // Plan to add branches to
  const [additionalBranches, setAdditionalBranches] = useState(1); // Number of branches to add
  const [showUpgradeRequestModal, setShowUpgradeRequestModal] = useState(false); // Upgrade request modal state
  const [upgradeRequestData, setUpgradeRequestData] = useState({
    requestedBeds: currentUsage?.bedsUsed || 0,
    requestedBranches: 1,
    requestMessage: ''
  }); // Upgrade request data

  useEffect(() => {
    // Fetch available plans with current user context
    const fetchPlans = async () => {
      try {
        // Get current user details
        const currentUser = await authService.getCurrentUser();
        
        // Dispatch with user context
        await dispatch(fetchAvailablePlans({
          role: currentUser.role,
          pgId: currentUser.pgId,
          email: currentUser.email
        }));
      } catch (error) {
        console.error('Error fetching available plans:', error);
        toast.error('Failed to fetch available plans');
      }
    };

    fetchPlans();
  }, [dispatch]);

  useEffect(() => {
    if (currentPlan) {
      setSelectedPlanId(currentPlan._id);
    }
    // Trial plans are now filtered out from availablePlans, so no special handling needed
  }, [currentPlan]);

  const handleSelectPlan = (plan) => {
    const config = getPlanConfiguration(plan);
    setTempBedCount(config.bedCount);
    setTempBranchCount(config.branchCount);
    setSelectedPlanForConfig(plan);

    // Always show bed count input when selecting/changing plans
    setShowBedCountInput(true);
  };

  const handlePreviewPlan = (plan) => {
    setPreviewPlan(plan);
    setShowPlanPreview(true);
  };

  const handleAddBeds = (plan) => {
    // Open add beds modal/form
    setShowAddBedsModal(true);
    setSelectedPlanForBedAddition(plan);
  };

  const handleAddBranches = (plan) => {
    // Open add branches modal/form
    setShowAddBranchesModal(true);
    setSelectedPlanForBranchAddition(plan);
  };

  const handleChangePlan = (currentPlan) => {
    // Scroll to available plans section and highlight the current plan
    const plansSection = document.getElementById('available-plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
      // Optionally show a notification or highlight
      toast('Scroll down to see available plans and make changes', { icon: 'ℹ️' });
    }
  };

  const handleAddBedsConfirm = async () => {
    if (!selectedPlanForBedAddition || additionalBeds < 1) {
      toast.error('Please specify the number of beds to add');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/subscription/add-beds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          additionalBeds: additionalBeds,
          newMaxBeds: (restrictions.maxBeds || currentPlan.baseBedCount) + additionalBeds
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Beds added successfully!');

        // Refresh user data and subscription
        await dispatch(getCurrentUser());
        await dispatch(fetchUserSubscription());

        // Reset modal state
        setShowAddBedsModal(false);
        setSelectedPlanForBedAddition(null);
        setAdditionalBeds(1);
      } else {
        toast.error(result.message || 'Failed to add beds');
      }
    } catch (error) {
      console.error('Error adding beds:', error);
      toast.error('Failed to add beds. Please try again.');
    }
  };

  const handleAddBranchesConfirm = async () => {
    if (!selectedPlanForBranchAddition || additionalBranches < 1) {
      toast.error('Please specify the number of branches to add');
      return;
    }

    try {
      // Use direct API for adding branches (similar to adding beds)
      const result = await subscriptionService.addBranchesToSubscription(
        additionalBranches,
        (restrictions.maxBranches || 1) + additionalBranches
      );

      if (result.success) {
        toast.success(result.message || 'Branches added successfully!');

        // Refresh user data and subscription
        await dispatch(getCurrentUser());
        await dispatch(fetchUserSubscription());

        // Reset modal state
        setShowAddBranchesModal(false);
        setSelectedPlanForBranchAddition(null);
        setAdditionalBranches(1);
      } else {
        toast.error(result.message || 'Failed to add branches');
      }
    } catch (error) {
      console.error('Error adding branches:', error);
      toast.error('Failed to add branches. Please try again.');
    }
  };

  const handleUpgradeRequest = (plan) => {
    setShowUpgradeRequestModal(true);
    setUpgradeRequestData({
      requestedBeds: Math.max((currentUsage?.bedsUsed || 0) + 5, plan.baseBedCount), // Suggest 5 more beds
      requestedBranches: 1,
      requestMessage: ''
    });
  };

  const handleUpgradeRequestConfirm = async () => {
    if (!currentPlan || upgradeRequestData.requestedBeds < (currentUsage?.bedsUsed || 0)) {
      toast.error('Requested beds cannot be less than current usage');
      return;
    }

    try {
      const result = await subscriptionService.requestUpgrade(currentPlan._id, upgradeRequestData);

      if (result.success) {
        toast.success(result.message || 'Upgrade request submitted successfully!');
        setShowUpgradeRequestModal(false);
        setUpgradeRequestData({
          requestedBeds: currentUsage?.bedsUsed || 0,
          requestedBranches: 1,
          requestMessage: ''
        });
      } else {
        toast.error(result.message || 'Failed to submit upgrade request');
      }
    } catch (error) {
      console.error('Error requesting upgrade:', error);
      toast.error('Failed to submit upgrade request');
    }
  };

  const handleBedCountConfirm = () => {
    updatePlanConfiguration(selectedPlanForConfig._id, {
      bedCount: tempBedCount,
      branchCount: tempBranchCount
    });

    const config = { bedCount: tempBedCount, branchCount: tempBranchCount };
    const planWithConfig = {
      ...selectedPlanForConfig,
      selectedBedCount: config.bedCount,
      selectedBranchCount: config.branchCount
    };

    setConfirmPlan(planWithConfig);

    // Calculate change summary if switching from current plan
    if (currentPlan && currentPlan._id !== selectedPlanForConfig._id) {
      const summary = calculatePlanChangeSummary(currentPlan, planWithConfig);
      setChangeSummary(summary);
      setShowChangeSummary(true);
    } else {
      setShowConfirmation(true);
    }

    setShowBedCountInput(false);
    setSelectedPlanForConfig(null);
  };

  const calculatePlanChangeSummary = (fromPlan, toPlan) => {
    // Calculate actual costs based on configurations
    const fromConfig = getPlanConfiguration(fromPlan);
    const toConfig = getPlanConfiguration(toPlan);
    const fromCost = calculatePlanCost(fromPlan, fromConfig.bedCount, fromConfig.branchCount);
    const toCost = calculatePlanCost(toPlan, toConfig.bedCount, toConfig.branchCount);

    const changes = {
      priceChange: {
        from: fromCost.monthlyPrice,
        to: toCost.monthlyPrice,
        difference: toCost.monthlyPrice - fromCost.monthlyPrice,
        percentage: fromCost.monthlyPrice > 0 ? ((toCost.monthlyPrice - fromCost.monthlyPrice) / fromCost.monthlyPrice * 100) : 0
      },
      bedChange: {
        from: fromConfig.bedCount,
        to: toConfig.bedCount,
        difference: toConfig.bedCount - fromConfig.bedCount
      },
      branchChange: {
        from: fromConfig.branchCount,
        to: toConfig.branchCount,
        difference: toConfig.branchCount - fromConfig.branchCount
      },
      billingCycleChange: {
        from: fromPlan.billingCycle,
        to: toPlan.billingCycle,
        changed: fromPlan.billingCycle !== toPlan.billingCycle
      },
      branchSupportChange: {
        from: fromPlan.allowMultipleBranches,
        to: toPlan.allowMultipleBranches,
        changed: fromPlan.allowMultipleBranches !== toPlan.allowMultipleBranches
      },
      featuresAdded: [],
      featuresRemoved: [],
      modulesAdded: [],
      modulesRemoved: []
    };

    // Compare features
    const fromFeatures = fromPlan.features?.map(f => f.name) || [];
    const toFeatures = toPlan.features?.map(f => f.name) || [];

    changes.featuresAdded = toFeatures.filter(f => !fromFeatures.includes(f));
    changes.featuresRemoved = fromFeatures.filter(f => !toFeatures.includes(f));

    // Compare modules
    const fromModules = fromPlan.modules?.map(m => m.moduleName) || [];
    const toModules = toPlan.modules?.map(m => m.moduleName) || [];

    changes.modulesAdded = toModules.filter(m => !fromModules.includes(m));
    changes.modulesRemoved = fromModules.filter(m => !toModules.includes(m));

    return changes;
  };

  const updatePlanConfiguration = (planId, config) => {
    setPlanConfigurations(prev => ({
      ...prev,
      [planId]: { ...prev[planId], ...config }
    }));
  };

  const getPlanConfiguration = (plan) => {
    const config = planConfigurations[plan._id] || {};
    return {
      bedCount: config.bedCount || plan.baseBedCount,
      branchCount: config.branchCount || 1
    };
  };

  const calculatePlanCost = (plan, bedCount, branchCount) => {
    if (!plan) return 0;

    let totalCost = plan.basePrice;
    let extraBeds = 0;
    let extraBranches = 0;

    // Calculate extra beds
    if (bedCount > plan.baseBedCount) {
      extraBeds = bedCount - plan.baseBedCount;
      totalCost += extraBeds * plan.topUpPricePerBed;
    }

    // Calculate extra branches
    if (branchCount > 1) {
      extraBranches = branchCount - 1;
      totalCost += extraBranches * plan.costPerBranch;
    }

    // Apply annual discount if applicable
    if (plan.billingCycle === 'annual') {
      const annualTotal = totalCost * 12;
      const discount = (annualTotal * plan.annualDiscount) / 100;
      totalCost = (annualTotal - discount) / 12;
    }

    return {
      monthlyPrice: totalCost,
      annualPrice: totalCost * 12,
      extraBeds,
      extraBranches,
      basePrice: plan.basePrice,
      topUpCost: extraBeds * plan.topUpPricePerBed,
      branchCost: extraBranches * plan.costPerBranch
    };
  };

  const confirmSelection = async () => {
    try {
      const config = getPlanConfiguration(confirmPlan);
      const planData = {
        planId: confirmPlan._id,
        bedCount: config.bedCount,
        branchCount: config.branchCount
      };

      const result = await dispatch(selectSubscriptionPlan(planData)).unwrap();
      toast.success(result.message || 'Subscription plan updated successfully!');

      // Refresh user data to update subscription information
      await dispatch(getCurrentUser());

      setShowConfirmation(false);
      setSelectedPlanId(confirmPlan._id);
    } catch (error) {
      toast.error(error || 'Failed to select subscription plan');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'trial':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'expired':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Overview */}
      {currentPlan && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Package className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Current Plan</h3>
              </div>
              <p className="text-gray-600">Your active subscription</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(subscriptionStatus)}`}>
              {subscriptionStatus.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Plan Name</span>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">{currentPlan.planName}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Beds Limit</span>
                <Bed className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {currentUsage.bedsUsed || 0} / {restrictions.maxBeds || 'Unlimited'}
              </p>
              {restrictions.maxBeds && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((currentUsage.bedsUsed || 0) / restrictions.maxBeds) * 100)}%`
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Billing</span>
                <Calendar className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {currentPlan.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {subscriptionService.formatCurrency(currentPlan.basePrice)}
              </p>
            </div>
          </div>

          {/* Enabled Modules */}
          {restrictions.enabledModules.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Enabled Modules:</p>
              <div className="flex flex-wrap gap-2">
                {restrictions.enabledModules.slice(0, 6).map((module, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {module.replace(/_/g, ' ').toUpperCase()}
                  </span>
                ))}
                {restrictions.enabledModules.length > 6 && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    +{restrictions.enabledModules.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handlePreviewPlan(currentPlan)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => handleAddBeds(currentPlan)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Beds</span>
              </button>

              {currentPlan?.allowMultipleBranches && (
                <button
                  onClick={() => handleAddBranches(currentPlan)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 border border-purple-600 text-white rounded-lg hover:bg-purple-700 hover:border-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Branches</span>
                </button>
              )}

              {/* Show upgrade request button only for custom plans */}
              {currentPlan?.isCustomPlan && (
                <button
                  onClick={() => handleUpgradeRequest(currentPlan)}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 border border-orange-600 text-white rounded-lg hover:bg-orange-700 hover:border-orange-700 transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Request Upgrade</span>
                </button>
              )}

              <button
                onClick={() => handleChangePlan(currentPlan)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 border border-green-600 text-white rounded-lg hover:bg-green-700 hover:border-green-700 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Change Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div id="available-plans-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Available Plans</h3>
            <p className="text-sm text-gray-600">Choose the plan that fits your needs</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setUseModernPreview(true)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                useModernPreview
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Modern
            </button>
            <button
              onClick={() => setUseModernPreview(false)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                !useModernPreview
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Classic
            </button>
          </div>
        </div>

        {availablePlans.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Available</h3>
            <p className="text-gray-600">No subscription plans are currently available.</p>
          </div>
        ) : useModernPreview ? (
          <div className="space-y-8">
            {availablePlans.map((plan) => (
              <SubscriptionPlanPreview
                key={plan._id}
                plan={plan}
                isSelected={selectedPlanId === plan._id}
                onSelect={handleSelectPlan}
                showSelectButton={true}
                compact={false}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg overflow-hidden ${
                  selectedPlanId === plan._id
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-blue-100'
                    : 'border-gray-200 hover:border-blue-300'
                } ${plan.isRecommended ? 'ring-2 ring-purple-200 shadow-purple-100' : ''} ${
                  plan.isPopular ? 'shadow-yellow-100' : ''
                }`}
              >
                {/* Enhanced Badges */}
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                {plan.isRecommended && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                      <Award className="h-3 w-3" />
                      <span>BEST VALUE</span>
                  </div>
                )}
                      {plan.isPopular && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                      <Star className="h-3 w-3" />
                      <span>POPULAR</span>
                    </div>
                      )}
                  {currentPlan && currentPlan._id === plan._id && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow-lg">
                      <CheckCircle className="h-3 w-3" />
                      <span>CURRENT</span>
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedPlanId === plan._id && (
                  <div className="absolute top-4 left-4">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Enhanced Plan Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.planName}</h4>
                    {plan.planDescription && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {plan.planDescription}
                      </p>
                    )}
                      </div>
                    </div>

                    {/* Price Display */}
                    <div className="mb-4">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ₹{plan.basePrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      {plan.billingCycle === 'annual' && plan.annualDiscount > 0 && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-green-600 font-medium">
                            Save {plan.annualDiscount}%
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            ₹{(plan.basePrice * 12).toLocaleString()}/year
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Configuration Options */}
                  {(plan.maxBedsAllowed > plan.baseBedCount || plan.allowMultipleBranches) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Configure Your Plan</h5>
                      <div className="space-y-3">
                        {/* Bed Count Selection */}
                        {plan.maxBedsAllowed > plan.baseBedCount && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Number of Beds: {getPlanConfiguration(plan).bedCount}
                            </label>
                            <input
                              type="range"
                              min={plan.baseBedCount}
                              max={plan.maxBedsAllowed}
                              value={getPlanConfiguration(plan).bedCount}
                              onChange={(e) => updatePlanConfiguration(plan._id, { bedCount: parseInt(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{plan.baseBedCount} beds</span>
                              <span>{plan.maxBedsAllowed} beds</span>
                            </div>
                          </div>
                        )}

                        {/* Branch Count Selection */}
                        {plan.allowMultipleBranches && plan.branchCount > 1 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Number of Branches: {getPlanConfiguration(plan).branchCount}
                            </label>
                            <input
                              type="range"
                              min="1"
                              max={plan.branchCount}
                              value={getPlanConfiguration(plan).branchCount}
                              onChange={(e) => updatePlanConfiguration(plan._id, { branchCount: parseInt(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>1 branch</span>
                              <span>{plan.branchCount} branches</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    {(() => {
                      const config = getPlanConfiguration(plan);
                      const costBreakdown = calculatePlanCost(plan, config.bedCount, config.branchCount);

                      return (
                        <div>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-gray-900">
                              {subscriptionService.formatCurrency(costBreakdown.monthlyPrice)}
                            </span>
                            <span className="text-gray-600">
                              /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>

                          {plan.billingCycle === 'annual' && plan.annualDiscount > 0 && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                              Save {plan.annualDiscount}% with annual billing
                            </p>
                          )}

                          {/* Cost Breakdown */}
                          {(costBreakdown.extraBeds > 0 || costBreakdown.extraBranches > 0) && (
                            <div className="mt-2 text-xs text-gray-600 space-y-1">
                              {costBreakdown.extraBeds > 0 && (
                                <div className="flex justify-between">
                                  <span>Base ({plan.baseBedCount} beds):</span>
                                  <span>{subscriptionService.formatCurrency(costBreakdown.basePrice)}</span>
                                </div>
                              )}
                              {costBreakdown.extraBeds > 0 && (
                                <div className="flex justify-between">
                                  <span>Extra beds ({costBreakdown.extraBeds}):</span>
                                  <span>{subscriptionService.formatCurrency(costBreakdown.topUpCost)}</span>
                                </div>
                              )}
                              {costBreakdown.extraBranches > 0 && (
                                <div className="flex justify-between">
                                  <span>Extra branches ({costBreakdown.extraBranches}):</span>
                                  <span>{subscriptionService.formatCurrency(costBreakdown.branchCost)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {(() => {
                      const config = getPlanConfiguration(plan);
                      return (
                        <>
                          <div className="flex items-center space-x-2">
                            <Bed className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              <strong>{config.bedCount}</strong> beds configured
                              {config.bedCount > plan.baseBedCount && (
                                <span className="text-green-600 ml-1">
                                  (+{config.bedCount - plan.baseBedCount} extra)
                                </span>
                              )}
                            </span>
                          </div>
                          {plan.maxBedsAllowed > plan.baseBedCount && (
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {subscriptionService.formatCurrency(plan.topUpPricePerBed)}/bed top-up
                              </span>
                            </div>
                          )}
                          {plan.allowMultipleBranches && (
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                <strong>{config.branchCount}</strong> branch{config.branchCount !== 1 ? 'es' : ''} configured
                                {config.branchCount > 1 && (
                                  <span className="text-green-600 ml-1">
                                    (+{config.branchCount - 1} extra)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          {plan.allowMultipleBranches && plan.costPerBranch > 0 && config.branchCount > 1 && (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-orange-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {subscriptionService.formatCurrency(plan.costPerBranch)}/additional branch
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {plan.features && plan.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        {feature.enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.enabled ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                    {plan.features && plan.features.length > 3 && (
                      <p className="text-xs text-blue-600 font-medium">
                        +{plan.features.length - 3} more features
                      </p>
                    )}
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="space-y-3">
                    {(() => {
                      const isCurrentPlan = currentPlan && currentPlan._id === plan._id;
                      const isUpgrade = currentPlan && plan.basePrice > currentPlan.basePrice;
                      const isDowngrade = currentPlan && plan.basePrice < currentPlan.basePrice;
                      const isSamePrice = currentPlan && plan.basePrice === currentPlan.basePrice;

                      return (
                        <>
                          {/* Plan Change Indicator */}
                          {currentPlan && !isCurrentPlan && (
                            <div className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                              isUpgrade ? 'bg-green-50 text-green-700 border border-green-200' :
                              isDowngrade ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {isUpgrade && (
                                <>
                                  <TrendingUp className="h-4 w-4" />
                                  <span>Upgrade Plan</span>
                                  <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                                    +₹{(plan.basePrice - currentPlan.basePrice).toLocaleString()}
                                  </span>
                                </>
                              )}
                              {isDowngrade && (
                                <>
                                  <TrendingDown className="h-4 w-4" />
                                  <span>Downgrade Plan</span>
                                  <span className="text-xs bg-orange-100 px-2 py-0.5 rounded">
                                    -₹{(currentPlan.basePrice - plan.basePrice).toLocaleString()}
                                  </span>
                                </>
                              )}
                              {isSamePrice && (
                                <>
                                  <ArrowRight className="h-4 w-4" />
                                  <span>Switch Plan</span>
                                  <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                                    Same Price
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Preview Button */}
                            <button
                              onClick={() => handlePreviewPlan(plan)}
                              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">Preview</span>
                            </button>

                            {/* Select Plan Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={selectedPlanId === plan._id || loading}
                              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                      selectedPlanId === plan._id
                        ? 'bg-green-100 text-green-700 border-2 border-green-300 cursor-not-allowed'
                                  : isCurrentPlan
                                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-2 border-gray-300'
                                  : currentPlan
                                  ? isUpgrade
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                                  : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                    }`}
                  >
                    {loading ? (
                                <Loader className="h-4 w-4 animate-spin" />
                    ) : selectedPlanId === plan._id ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span className="text-sm">Selected</span>
                                </>
                              ) : isCurrentPlan ? (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-sm">Current</span>
                                </>
                    ) : currentPlan ? (
                                <>
                                  <ArrowRight className="h-4 w-4" />
                                  <span className="text-sm">
                                    {isUpgrade ? 'Upgrade' :
                                     isDowngrade ? 'Downgrade' :
                                     'Switch'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span className="text-sm">Start</span>
                                </>
                    )}
                  </button>
                          </div>

                          {/* Additional Info */}
                          {selectedPlanId === plan._id && (
                            <div className="text-center">
                              <p className="text-sm text-blue-600 font-medium">
                                Click "Confirm Selection" below to proceed
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Change Summary Modal */}
      <AnimatePresence>
        {showChangeSummary && changeSummary && confirmPlan && currentPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Plan Change Summary</h3>
                      <p className="text-sm text-gray-600">Review changes before switching plans</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChangeSummary(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Plan Comparison Header */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Current Plan</h4>
                    <p className="text-lg font-bold text-red-900">{currentPlan.planName}</p>
                    <p className="text-sm text-red-700">{subscriptionService.formatCurrency(currentPlan.basePrice)}/{currentPlan.billingCycle === 'monthly' ? 'month' : 'year'}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">New Plan</h4>
                    <p className="text-lg font-bold text-green-900">{confirmPlan.planName}</p>
                    <p className="text-sm text-green-700">{subscriptionService.formatCurrency(confirmPlan.basePrice)}/{confirmPlan.billingCycle === 'monthly' ? 'month' : 'year'}</p>
                  </div>
                </div>

                {/* Price Change */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Price Change
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Current</p>
                      <p className="text-lg font-bold text-gray-900">{subscriptionService.formatCurrency(changeSummary.priceChange.from)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">New</p>
                      <p className="text-lg font-bold text-gray-900">{subscriptionService.formatCurrency(changeSummary.priceChange.to)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Difference</p>
                      <p className={`text-lg font-bold ${changeSummary.priceChange.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {changeSummary.priceChange.difference >= 0 ? '+' : ''}{subscriptionService.formatCurrency(changeSummary.priceChange.difference)}
                        {changeSummary.priceChange.percentage !== 0 && (
                          <span className="text-sm ml-1">
                            ({changeSummary.priceChange.percentage >= 0 ? '+' : ''}{changeSummary.priceChange.percentage.toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bed Capacity Change */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Bed className="h-4 w-4 mr-2" />
                    Capacity Changes
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Current</p>
                      <p className="text-lg font-bold text-gray-900">{changeSummary.bedChange.from} beds</p>
                      <p className="text-sm text-gray-500">{changeSummary.branchChange.from} branch{changeSummary.branchChange.from !== 1 ? 'es' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">New</p>
                      <p className="text-lg font-bold text-gray-900">{changeSummary.bedChange.to} beds</p>
                      <p className="text-sm text-gray-500">{changeSummary.branchChange.to} branch{changeSummary.branchChange.to !== 1 ? 'es' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Difference</p>
                      <p className={`text-lg font-bold ${changeSummary.bedChange.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changeSummary.bedChange.difference >= 0 ? '+' : ''}{changeSummary.bedChange.difference} beds
                      </p>
                      <p className={`text-sm font-medium ${changeSummary.branchChange.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changeSummary.branchChange.difference >= 0 ? '+' : ''}{changeSummary.branchChange.difference} branch{changeSummary.branchChange.difference !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billing Cycle Change */}
                {changeSummary.billingCycleChange.changed && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Billing Cycle Change
                    </h4>
                    <p className="text-yellow-700">
                      Changing from <strong>{changeSummary.billingCycleChange.from}</strong> to <strong>{changeSummary.billingCycleChange.to}</strong> billing.
                    </p>
                  </div>
                )}

                {/* Branch Support Change */}
                {changeSummary.branchSupportChange.changed && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Branch Support</h4>
                    <p className="text-blue-700">
                      {changeSummary.branchSupportChange.to
                        ? 'New plan supports multiple branches'
                        : 'New plan does not support multiple branches'
                      }
                    </p>
                  </div>
                )}

                {/* Features Changes */}
                {(changeSummary.featuresAdded.length > 0 || changeSummary.featuresRemoved.length > 0) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-3">Feature Changes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {changeSummary.featuresAdded.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-2">Added Features:</p>
                          <ul className="space-y-1">
                            {changeSummary.featuresAdded.map((feature, idx) => (
                              <li key={idx} className="text-sm text-green-600 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {changeSummary.featuresRemoved.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-2">Removed Features:</p>
                          <ul className="space-y-1">
                            {changeSummary.featuresRemoved.map((feature, idx) => (
                              <li key={idx} className="text-sm text-red-600 flex items-center">
                                <XCircle className="h-3 w-3 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modules Changes */}
                {(changeSummary.modulesAdded.length > 0 || changeSummary.modulesRemoved.length > 0) && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-800 mb-3">Module Changes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {changeSummary.modulesAdded.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-2">Added Modules:</p>
                          <ul className="space-y-1">
                            {changeSummary.modulesAdded.map((module, idx) => (
                              <li key={idx} className="text-sm text-green-600 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-2" />
                                {module.replace(/_/g, ' ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {changeSummary.modulesRemoved.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-2">Removed Modules:</p>
                          <ul className="space-y-1">
                            {changeSummary.modulesRemoved.map((module, idx) => (
                              <li key={idx} className="text-sm text-red-600 flex items-center">
                                <XCircle className="h-3 w-3 mr-2" />
                                {module.replace(/_/g, ' ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowChangeSummary(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowChangeSummary(false);
                      setShowConfirmation(true);
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                  >
                    Continue to Confirmation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && confirmPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentPlan ? 'Confirm Plan Change' : 'Confirm Plan Selection'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentPlan
                      ? 'Are you sure you want to change your subscription plan?'
                      : 'Are you sure you want to select this plan?'
                    }
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-semibold text-gray-900 mb-2">{confirmPlan.planName}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  {(() => {
                    const config = getPlanConfiguration(confirmPlan);
                    const costBreakdown = calculatePlanCost(confirmPlan, config.bedCount, config.branchCount);
                    return (
                      <>
                        <p>• {subscriptionService.formatCurrency(costBreakdown.monthlyPrice)}/{confirmPlan.billingCycle === 'monthly' ? 'month' : 'year'}</p>
                        <p>• {config.bedCount} bed{config.bedCount !== 1 ? 's' : ''} configured</p>
                        {config.branchCount > 1 && (
                          <p>• {config.branchCount} branch{config.branchCount !== 1 ? 'es' : ''} configured</p>
                        )}
                        <p>• {confirmPlan.modules?.length || 0} modules included</p>
                        {(costBreakdown.extraBeds > 0 || costBreakdown.extraBranches > 0) && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="text-xs font-medium text-gray-700">Cost Breakdown:</p>
                            <div className="text-xs space-y-1 mt-1">
                              <p>• Base: {subscriptionService.formatCurrency(costBreakdown.basePrice)}</p>
                              {costBreakdown.extraBeds > 0 && (
                                <p>• Extra beds ({costBreakdown.extraBeds}): {subscriptionService.formatCurrency(costBreakdown.topUpCost)}</p>
                              )}
                              {costBreakdown.extraBranches > 0 && (
                                <p>• Extra branches ({costBreakdown.extraBranches}): {subscriptionService.formatCurrency(costBreakdown.branchCost)}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSelection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'Confirm Selection'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bed Count Input Modal */}
      <AnimatePresence>
        {showBedCountInput && selectedPlanForConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bed className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Configure Your Plan</h3>
                  <p className="text-sm text-gray-600">Customize bed and branch counts for {selectedPlanForConfig.planName}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Bed Count Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Beds
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setTempBedCount(Math.max(1, tempBedCount - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={tempBedCount}
                      onChange={(e) => setTempBedCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setTempBedCount(tempBedCount + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Base: {selectedPlanForConfig.baseBedCount} beds included
                  </p>
                </div>

                {/* Branch Count Input */}
                {selectedPlanForConfig.allowMultipleBranches && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Branches
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setTempBranchCount(Math.max(1, tempBranchCount - 1))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={tempBranchCount}
                        onChange={(e) => setTempBranchCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setTempBranchCount(tempBranchCount + 1)}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Additional branches: ₹{selectedPlanForConfig.costPerBranch}/month each
                    </p>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Pricing Summary</h4>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      const costBreakdown = calculatePlanCost(selectedPlanForConfig, tempBedCount, tempBranchCount);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span>₹{subscriptionService.formatCurrency(costBreakdown.basePrice)}</span>
                          </div>
                          {costBreakdown.extraBeds > 0 && (
                            <div className="flex justify-between">
                              <span>Extra Beds ({costBreakdown.extraBeds}):</span>
                              <span>₹{subscriptionService.formatCurrency(costBreakdown.topUpCost)}</span>
                            </div>
                          )}
                          {costBreakdown.extraBranches > 0 && (
                            <div className="flex justify-between">
                              <span>Extra Branches ({costBreakdown.extraBranches}):</span>
                              <span>₹{subscriptionService.formatCurrency(costBreakdown.branchCost)}</span>
                            </div>
                          )}
                          <div className="border-t pt-1 mt-2">
                            <div className="flex justify-between font-semibold text-gray-900">
                              <span>Monthly Total:</span>
                              <span>₹{subscriptionService.formatCurrency(costBreakdown.monthlyPrice)}</span>
                            </div>
                            {selectedPlanForConfig.billingCycle === 'annual' && (
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Annual Total:</span>
                                <span>₹{subscriptionService.formatCurrency(costBreakdown.annualPrice)}</span>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBedCountInput(false);
                    setSelectedPlanForConfig(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBedCountConfirm}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plan Preview Modal */}
      <AnimatePresence>
        {showPlanPreview && previewPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPlanPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            >
              <SubscriptionPlanPreview
                plan={previewPlan}
                isSelected={selectedPlanId === previewPlan._id}
                onSelect={(plan) => {
                  setShowPlanPreview(false);
                  handleSelectPlan(plan);
                }}
                showSelectButton={true}
                compact={false}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Add Beds Modal */}
        {showAddBedsModal && selectedPlanForBedAddition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddBedsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Add More Beds</h3>
                  <button
                    onClick={() => setShowAddBedsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Current Plan Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{selectedPlanForBedAddition.planName}</h4>
                    <div className="text-sm text-blue-800">
                      <p>Current beds: {currentUsage.bedsUsed || 0} / {restrictions.maxBeds || 'Unlimited'}</p>
                      <p>Base beds: {selectedPlanForBedAddition.baseBedCount}</p>
                    </div>
                  </div>

                  {/* Bed Count Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Additional Beds
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setAdditionalBeds(Math.max(1, additionalBeds - 1))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={additionalBeds}
                        onChange={(e) => setAdditionalBeds(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setAdditionalBeds(additionalBeds + 1)}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Additional beds: ₹{selectedPlanForBedAddition.topUpPricePerBed}/month each
                    </p>
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Cost Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Additional beds:</span>
                        <span>{additionalBeds}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per bed:</span>
                        <span>₹{subscriptionService.formatCurrency(selectedPlanForBedAddition.topUpPricePerBed)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total monthly cost:</span>
                        <span>₹{subscriptionService.formatCurrency(additionalBeds * selectedPlanForBedAddition.topUpPricePerBed)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAddBedsModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBedsConfirm}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>Add Beds</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Upgrade Request Modal */}
        {showUpgradeRequestModal && currentPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUpgradeRequestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Request Plan Upgrade</h3>
                  <button
                    onClick={() => setShowUpgradeRequestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Current Plan Info */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">Current Plan: {currentPlan.planName}</h4>
                    <div className="text-sm text-orange-800">
                      <p>Current beds: {currentUsage?.bedsUsed || 0} / {restrictions.maxBeds || 'Unlimited'}</p>
                      <p>Current branches: 1</p>
                    </div>
                  </div>

                  {/* Requested Beds Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requested Beds <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setUpgradeRequestData(prev => ({
                          ...prev,
                          requestedBeds: Math.max(currentUsage?.bedsUsed || 0, prev.requestedBeds - 1)
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={currentUsage?.bedsUsed || 0}
                        value={upgradeRequestData.requestedBeds}
                        onChange={(e) => setUpgradeRequestData(prev => ({
                          ...prev,
                          requestedBeds: Math.max(currentUsage?.bedsUsed || 0, parseInt(e.target.value) || 0)
                        }))}
                        className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setUpgradeRequestData(prev => ({
                          ...prev,
                          requestedBeds: prev.requestedBeds + 1
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum: {currentUsage?.bedsUsed || 0} beds (current usage)
                    </p>
                  </div>

                  {/* Requested Branches Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requested Branches
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setUpgradeRequestData(prev => ({
                          ...prev,
                          requestedBranches: Math.max(1, prev.requestedBranches - 1)
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={upgradeRequestData.requestedBranches}
                        onChange={(e) => setUpgradeRequestData(prev => ({
                          ...prev,
                          requestedBranches: Math.max(1, parseInt(e.target.value) || 1)
                        }))}
                        className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setUpgradeRequestData(prev => ({
                          ...prev,
                          requestedBranches: Math.min(10, prev.requestedBranches + 1)
                        }))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Number of branches you need
                    </p>
                  </div>

                  {/* Request Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Request Message (Optional)
                    </label>
                    <textarea
                      value={upgradeRequestData.requestMessage}
                      onChange={(e) => setUpgradeRequestData(prev => ({
                        ...prev,
                        requestMessage: e.target.value
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="Explain why you need this upgrade..."
                    />
                  </div>

                  {/* Cost Estimate */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Upgrade Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Additional beds needed:</span>
                        <span>{Math.max(0, upgradeRequestData.requestedBeds - (restrictions.maxBeds || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Additional branches needed:</span>
                        <span>{Math.max(0, upgradeRequestData.requestedBranches - 1)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>This request will be reviewed by admin</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowUpgradeRequestModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpgradeRequestConfirm}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                      <span>Submit Request</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add Branches Modal */}
        {showAddBranchesModal && selectedPlanForBranchAddition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddBranchesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Add More Branches</h3>
                  <button
                    onClick={() => setShowAddBranchesModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Current Plan Info */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">{selectedPlanForBranchAddition.planName}</h4>
                    <div className="text-sm text-purple-800">
                      <p>Current branches: {restrictions.maxBranches || 1}</p>
                      <p>Current beds: {currentUsage?.bedsUsed || 0} / {restrictions.maxBeds || 'Unlimited'}</p>
                    </div>
                  </div>

                  {/* Branch Count Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Additional Branches <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setAdditionalBranches(Math.max(1, additionalBranches - 1))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={additionalBranches}
                        onChange={(e) => setAdditionalBranches(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setAdditionalBranches(Math.min(10, additionalBranches + 1))}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Additional branches: ₹{selectedPlanForBranchAddition.costPerBranch}/month each
                    </p>
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Cost Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Additional branches:</span>
                        <span>{additionalBranches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per branch:</span>
                        <span>₹{subscriptionService.formatCurrency(selectedPlanForBranchAddition.costPerBranch)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total monthly cost:</span>
                        <span>₹{subscriptionService.formatCurrency(additionalBranches * selectedPlanForBranchAddition.costPerBranch)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Additional branches will be added immediately to your subscription and billing will be updated accordingly.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAddBranchesModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBranchesConfirm}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span>Add Branches</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionSelection;
