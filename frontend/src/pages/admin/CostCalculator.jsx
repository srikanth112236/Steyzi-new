import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

// Enhanced Cost Calculator API service
const costService = {
  // Fetch active subscription plans
  fetchActivePlans: async () => {
    try {
      const response = await axios.get('/api/subscriptions/active/plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active plans:', error);
      throw error;
    }
  },

  // Calculate cost for a specific plan
  calculateCost: async (planId, configuration) => {
    try {
      const response = await axios.post('/api/advanced/cost/calculate', 
        { 
          planId, 
          configuration 
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Cost calculation error:', error);
      throw error;
    }
  },

  // Compare multiple plans
  comparePlans: async (planIds, configuration) => {
    try {
      const response = await axios.post('/api/advanced/cost/compare', 
        { 
          planIds, 
          configuration 
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Plan comparison error:', error);
      throw error;
    }
  },

};

const CostCalculator = () => {
  // State management
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [configuration, setConfiguration] = useState({
    beds: 0,
    branches: 0,
    billingCycle: 'monthly'
  });
  
  // Calculation states
  const [calculation, setCalculation] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Compare view states
  const [comparePlan1, setComparePlan1] = useState(null);
  const [comparePlan2, setComparePlan2] = useState(null);

  // UI and loading states
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('calculator');

  // Fetch plans and initial data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const plansResponse = await costService.fetchActivePlans();
        console.log('📋 Loaded plans:', plansResponse);

        if (plansResponse.success && plansResponse.data.length > 0) {
          setPlans(plansResponse.data);

          // Automatically select the first plan
          const firstPlan = plansResponse.data[0];
          console.log('🎯 Auto-selecting first plan:', firstPlan.planName, firstPlan);
          setSelectedPlan(firstPlan);

          // The useEffect below will handle the calculation
        }
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
        toast.error('Failed to load initial data');
      }
    };

    initializeData();
  }, []);

  // Update configuration when plan changes
  useEffect(() => {
    if (selectedPlan) {
      console.log('📋 Updating configuration for selected plan:', selectedPlan.planName);
      setConfiguration(prev => ({
        ...prev,
        beds: selectedPlan.baseBedCount || prev.beds,
        branches: selectedPlan.branchCount || prev.branches,
        billingCycle: selectedPlan.billingCycle || prev.billingCycle
      }));
    }
  }, [selectedPlan]);

  // Auto-calculate when selected plan or configuration changes
  useEffect(() => {
    if (selectedPlan) {
      console.log('🔄 Auto-calculating cost for plan:', selectedPlan.planName, 'config:', configuration);
      calculateCost(selectedPlan._id, false); // Don't show feedback for auto-calculation
    }
  }, [selectedPlan, configuration]);

  // Memoized currency formatter
  const formatCurrency = useMemo(() => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format
  , []);

  // Calculate cost for selected plan
  const calculateCost = async (planId = selectedPlan?._id, showFeedback = false) => {
    if (!planId) {
      if (showFeedback) {
        toast.error('Please select a plan');
      }
      return;
    }

    try {
      if (showFeedback) setLoading(true);
      console.log('📊 Calculating cost for planId:', planId, 'configuration:', configuration);
      const result = await costService.calculateCost(planId, configuration);
      console.log('📊 Calculation result:', result);

      if (result.success) {
        setCalculation(result.data);
        console.log('✅ Calculation data set:', result.data);
        if (showFeedback) {
          setCurrentView('calculator');
          toast.success('Cost calculated successfully');
        }
      } else {
        console.error('❌ Calculation failed:', result.message);
        if (showFeedback) {
          toast.error(result.message || 'Failed to calculate cost');
        }
      }
    } catch (error) {
      console.error('💥 Calculation error:', error);
      if (showFeedback) {
        toast.error('An error occurred while calculating cost');
      }
    } finally {
      if (showFeedback) setLoading(false);
    }
  };

  // Compare selected plans
  const comparePlans = async () => {
    if (!comparePlan1 || !comparePlan2) {
      toast.error('Please select two plans to compare');
      return;
    }

    if (comparePlan1._id === comparePlan2._id) {
      toast.error('Please select different plans to compare');
      return;
    }

    try {
      setLoading(true);
      const planIds = [comparePlan1._id, comparePlan2._id];
      const result = await costService.comparePlans(planIds, configuration);

      if (result.success) {
        setComparison(result.data);
        setCurrentView('compare');
        toast.success('Plans compared successfully');
      } else {
        toast.error(result.message || 'Failed to compare plans');
      }
    } catch (error) {
      toast.error('An error occurred while comparing plans');
    } finally {
      setLoading(false);
    }
  };


  // Render methods remain the same as in the previous implementation
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Cost Calculator</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Calculate, compare, and optimize your subscription costs
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {[
                { key: 'calculator', label: 'Calculator', icon: Calculator },
                { key: 'compare', label: 'Compare', icon: BarChart3 }
              ].map((view) => (
                <button
                  key={view.key}
                  onClick={() => setCurrentView(view.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                    currentView === view.key
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <view.icon className="h-4 w-4" />
                  <span>{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
            <select
              value={selectedPlan?._id || ''}
              onChange={(e) => {
                const plan = plans.find(p => p._id === e.target.value);
                console.log('📋 Plan selected from dropdown:', plan?.planName, plan);
                setSelectedPlan(plan);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a plan...</option>
              {plans.map(plan => (
                <option key={plan._id} value={plan._id}>
                  {plan.planName} - {formatCurrency(plan.basePrice)}/{plan.billingCycle}
                </option>
              ))}
            </select>
          </div>

          {/* Beds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={configuration.beds}
              placeholder={selectedPlan ? `Default: ${selectedPlan.baseBedCount}` : "Select a plan first"}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                beds: parseInt(e.target.value) || 0
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Branches */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Branches</label>
            <input
              type="number"
              min="0"
              max="50"
              value={configuration.branches}
              placeholder={selectedPlan ? `Default: ${selectedPlan.branchCount}` : "Select a plan first"}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                branches: parseInt(e.target.value) || 0
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
            <select
              value={configuration.billingCycle}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                billingCycle: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>

        {/* Buttons for calculations */}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => calculateCost(selectedPlan?._id, true)}
            disabled={loading || !selectedPlan}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            <span>Calculate Cost</span>
          </button>

          <button
            onClick={() => setCurrentView('compare')}
            disabled={loading || plans.length < 2}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Compare Plans</span>
          </button>

        </div>
      </div>

      {/* Content Based on Current View */}
      {currentView === 'calculator' && (
        selectedPlan ? (
          calculation ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cost Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Subscription ({selectedPlan?.baseBedCount || 0} beds, {selectedPlan?.branchCount || 0} branches)</span>
                <span className="font-medium">{formatCurrency(calculation.calculation.basePrice)}</span>
              </div>

              {calculation.calculation.extraBeds > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Extra Beds ({calculation.calculation.extraBeds} × ₹{selectedPlan?.topUpPricePerBed || 0})
                  </span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.extraBedCost)}</span>
                </div>
              )}

              {calculation.calculation.extraBranches > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Extra Branches ({calculation.calculation.extraBranches} × ₹{selectedPlan?.costPerBranch || 0})
                  </span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.branchCost)}</span>
                </div>
              )}

              {calculation.calculation.annualDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Annual Discount ({selectedPlan?.annualDiscount || 0}%)</span>
                  <span className="font-medium">-{formatCurrency(calculation.calculation.annualDiscount)}</span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal (before tax)</span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST ({calculation.calculation.taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.taxAmount)}</span>
                </div>

                {calculation.calculation.setupFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Setup Fee</span>
                    <span className="font-medium">{formatCurrency(calculation.calculation.setupFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-lg font-bold text-green-600 border-t pt-2 mt-2">
                  <span>Total {configuration.billingCycle === 'annual' ? 'Annually' : 'Monthly'}</span>
                  <span>{formatCurrency(calculation.calculation.totalPrice)}</span>
                </div>

                {configuration.billingCycle === 'annual' && (
                  <div className="flex justify-between items-center text-sm text-blue-600">
                    <span>Monthly Equivalent</span>
                    <span>{formatCurrency(calculation.calculation.monthlyEquivalent)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Selected Plan Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">Plan:</span> <span className="font-medium">{selectedPlan?.planName}</span></div>
                <div><span className="text-gray-600">Description:</span> <span className="font-medium">{selectedPlan?.planDescription}</span></div>
                <div><span className="text-gray-600">Features:</span> <span className="font-medium">{selectedPlan?.modules?.length || 0} modules</span></div>
                <div><span className="text-gray-600">Includes:</span> <span className="font-medium">{selectedPlan?.baseBedCount || 0} beds, {selectedPlan?.branchCount || 0} branches</span></div>
                <div><span className="text-gray-600">Extra Bed Cost:</span> <span className="font-medium">₹{selectedPlan?.topUpPricePerBed || 0}/bed</span></div>
                <div><span className="text-gray-600">Extra Branch Cost:</span> <span className="font-medium">₹{selectedPlan?.costPerBranch || 0}/branch</span></div>
                <div className="border-t pt-2 mt-2">
                  <div><span className="text-gray-600">Your Configuration:</span></div>
                  <div className="ml-2">
                    <div><span className="text-gray-600">Beds:</span> <span className="font-medium">{configuration.beds}</span></div>
                    <div><span className="text-gray-600">Branches:</span> <span className="font-medium">{configuration.branches}</span></div>
                    <div><span className="text-gray-600">Billing:</span> <span className="font-medium capitalize">{configuration.billingCycle}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
                  <p className="text-gray-600">Calculating cost...</p>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <Calculator className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Please select a subscription plan to view cost breakdown</p>
              </div>
            </div>
          )
        )}

      {currentView === 'compare' && (
        <div className="space-y-6">
          {/* Plan Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Plans to Compare</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan 1 Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan 1</label>
                  <Select
                    value={comparePlan1?._id || ''}
                    onValueChange={(value) => {
                      const plan = plans.find(p => p._id === value);
                      setComparePlan1(plan);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(plan => plan._id !== comparePlan2?._id).map(plan => (
                        <SelectItem key={`plan1-${plan._id}`} value={plan._id}>
                          {plan.planName} - {formatCurrency(plan.basePrice)}/{plan.billingCycle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {comparePlan1 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{comparePlan1.planName}</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Base Price:</span> <span className="font-medium">{formatCurrency(comparePlan1.basePrice)}</span></div>
                      <div><span className="text-gray-600">Billing:</span> <span className="font-medium capitalize">{comparePlan1.billingCycle}</span></div>
                      <div><span className="text-gray-600">Features:</span> <span className="font-medium">{comparePlan1.modules?.length || 0} modules</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Plan 2 Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan 2</label>
                  <Select
                    value={comparePlan2?._id || ''}
                    onValueChange={(value) => {
                      const plan = plans.find(p => p._id === value);
                      setComparePlan2(plan);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(plan => plan._id !== comparePlan1?._id).map(plan => (
                        <SelectItem key={`plan2-${plan._id}`} value={plan._id}>
                          {plan.planName} - {formatCurrency(plan.basePrice)}/{plan.billingCycle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {comparePlan2 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{comparePlan2.planName}</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Base Price:</span> <span className="font-medium">{formatCurrency(comparePlan2.basePrice)}</span></div>
                      <div><span className="text-gray-600">Billing:</span> <span className="font-medium capitalize">{comparePlan2.billingCycle}</span></div>
                      <div><span className="text-gray-600">Features:</span> <span className="font-medium">{comparePlan2.modules?.length || 0} modules</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={comparePlans}
                disabled={loading || !comparePlan1 || !comparePlan2 || comparePlan1._id === comparePlan2._id}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                <span>Compare Selected Plans</span>
              </button>
            </div>
          </div>

          {/* Comparison Results */}
          {comparison && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Results</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {comparison.comparisons.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{item.plan.name}</h4>
                      {index === 0 && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Plan 1</span>}
                      {index === 1 && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Plan 2</span>}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monthly Cost</span>
                        <span className="font-medium">{formatCurrency(item.calculation.monthlyEquivalent)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Annual Cost</span>
                        <span className="font-medium">{formatCurrency(item.calculation.totalPrice)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Features</span>
                        <span className="font-medium">{item.plan.features || 'N/A'} modules</span>
                      </div>

                      {item.calculation.extraBeds > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Extra Beds ({item.calculation.extraBeds})</span>
                          <span className="font-medium">{formatCurrency(item.calculation.extraBedCost)}</span>
                        </div>
                      )}

                      {item.calculation.extraBranches > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Extra Branches ({item.calculation.extraBranches})</span>
                          <span className="font-medium">{formatCurrency(item.calculation.branchCost)}</span>
                        </div>
                      )}

                      {item.calculation.annualDiscount > 0 && (
                        <div className="flex justify-between items-center text-green-600 text-sm">
                          <span>Annual Discount</span>
                          <span className="font-medium">-{formatCurrency(item.calculation.annualDiscount)}</span>
                        </div>
                      )}

                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center font-semibold text-lg">
                          <span>Total {configuration.billingCycle === 'annual' ? 'Annually' : 'Monthly'}</span>
                          <span className="text-green-600">{formatCurrency(item.calculation.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Side-by-side comparison summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(comparison.comparisons[0]?.calculation.totalPrice - comparison.comparisons[1]?.calculation.totalPrice)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {comparison.comparisons[0]?.calculation.totalPrice > comparison.comparisons[1]?.calculation.totalPrice
                      ? `${comparison.comparisons[0]?.plan.name} is more expensive`
                      : `${comparison.comparisons[0]?.plan.name} is cheaper`}
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.abs(comparison.comparisons[0]?.plan.features - comparison.comparisons[1]?.plan.features)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Feature difference ({comparison.comparisons[0]?.plan.features > comparison.comparisons[1]?.plan.features
                      ? `${comparison.comparisons[0]?.plan.name} has more features`
                      : `${comparison.comparisons[1]?.plan.name} has more features`})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CostCalculator;
