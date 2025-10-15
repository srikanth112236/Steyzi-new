import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Target,
  Zap,
  Star,
  Award,
  BarChart3,
  PieChart,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

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

  // Get current cost and optimization suggestions
  getOptimizationSuggestions: async () => {
    try {
      const response = await axios.get('/api/advanced/cost/optimization', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Optimization suggestions error:', error);
      throw error;
    }
  },

  // Get pricing tiers based on configuration
  getPricingTiers: async (configuration) => {
    try {
      const { beds, branches, billingCycle } = configuration;
      const response = await axios.get('/api/advanced/cost/tiers', {
        params: { beds, branches, billingCycle },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Pricing tiers error:', error);
      throw error;
    }
  }
};

const CostCalculator = () => {
  // State management
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [configuration, setConfiguration] = useState({
    beds: 10,
    branches: 1,
    billingCycle: 'monthly'
  });
  
  // Calculation states
  const [calculation, setCalculation] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [pricingTiers, setPricingTiers] = useState(null);
  
  // UI and loading states
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('calculator');

  // Fetch plans and initial data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const plansResponse = await costService.fetchActivePlans();
        
        if (plansResponse.success) {
          setPlans(plansResponse.data);
          
          // Automatically select the first plan
          if (plansResponse.data.length > 0) {
            setSelectedPlan(plansResponse.data[0]);
            
            // Perform initial cost calculation
            await calculateCost(plansResponse.data[0]._id);
          }
        }
      } catch (error) {
        toast.error('Failed to load initial data');
      }
    };

    initializeData();
  }, []);

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
  const calculateCost = async (planId = selectedPlan?._id) => {
    if (!planId) {
      toast.error('Please select a plan');
      return;
    }

    try {
      setLoading(true);
      const result = await costService.calculateCost(planId, configuration);

      if (result.success) {
        setCalculation(result.data);
        setCurrentView('calculator');
        toast.success('Cost calculated successfully');
      } else {
        toast.error(result.message || 'Failed to calculate cost');
      }
    } catch (error) {
      toast.error('An error occurred while calculating cost');
    } finally {
      setLoading(false);
    }
  };

  // Compare top 3 plans
  const comparePlans = async () => {
    if (plans.length < 2) {
      toast.error('Not enough plans to compare');
      return;
    }

    try {
      setLoading(true);
      const planIds = plans.slice(0, 3).map(plan => plan._id);
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

  // Get optimization suggestions
  const getOptimizationSuggestions = async () => {
    try {
      setLoading(true);
      const result = await costService.getOptimizationSuggestions();

      if (result.success) {
        setOptimization(result.data);
        setCurrentView('optimize');
        toast.success('Optimization suggestions loaded');
      } else {
        toast.error(result.message || 'Failed to get optimization suggestions');
      }
    } catch (error) {
      toast.error('An error occurred while fetching optimization suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Get pricing tiers
  const fetchPricingTiers = async () => {
    try {
      setLoading(true);
      const result = await costService.getPricingTiers(configuration);

      if (result.success) {
        setPricingTiers(result.data);
        setCurrentView('tiers');
        toast.success('Pricing tiers loaded');
      } else {
        toast.error(result.message || 'Failed to load pricing tiers');
      }
    } catch (error) {
      toast.error('An error occurred while fetching pricing tiers');
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
                { key: 'compare', label: 'Compare', icon: BarChart3 },
                { key: 'optimize', label: 'Optimize', icon: Target },
                { key: 'tiers', label: 'Tiers', icon: TrendingUp }
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
              min="1"
              max="1000"
              value={configuration.beds}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                beds: parseInt(e.target.value) || 1
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Branches */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Branches</label>
            <input
              type="number"
              min="1"
              max="50"
              value={configuration.branches}
              onChange={(e) => setConfiguration(prev => ({
                ...prev,
                branches: parseInt(e.target.value) || 1
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
            onClick={() => calculateCost()}
            disabled={loading || !selectedPlan}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            <span>Calculate Cost</span>
          </button>

          <button
            onClick={comparePlans}
            disabled={loading || plans.length < 2}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Compare Plans</span>
          </button>

          <button
            onClick={getOptimizationSuggestions}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target className="h-4 w-4" />
            <span>Optimize</span>
          </button>

          <button
            onClick={fetchPricingTiers}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Pricing Tiers</span>
          </button>
        </div>
      </div>

      {/* Content Based on Current View */}
      {currentView === 'calculator' && calculation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cost Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Subscription</span>
                <span className="font-medium">{formatCurrency(calculation.calculation.basePrice)}</span>
              </div>

              {calculation.calculation.extraBeds > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Extra Beds ({calculation.calculation.extraBeds})
                  </span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.extraBedCost)}</span>
                </div>
              )}

              {calculation.calculation.extraBranches > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Extra Branches ({calculation.calculation.extraBranches})
                  </span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.branchCost)}</span>
                </div>
              )}

              {calculation.calculation.annualDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Annual Discount</span>
                  <span className="font-medium">-{formatCurrency(calculation.calculation.annualDiscount)}</span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">{formatCurrency(calculation.calculation.taxAmount)}</span>
                </div>

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
              <h4 className="font-semibold text-gray-900 mb-3">Plan Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">Plan:</span> <span className="font-medium">{calculation.plan.name}</span></div>
                <div><span className="text-gray-600">Billing:</span> <span className="font-medium capitalize">{configuration.billingCycle}</span></div>
                <div><span className="text-gray-600">Beds:</span> <span className="font-medium">{configuration.beds}</span></div>
                <div><span className="text-gray-600">Branches:</span> <span className="font-medium">{configuration.branches}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'compare' && comparison && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Comparison</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Features</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Best For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparison.comparisons.map((item, index) => (
                  <tr key={index} className={index === 0 ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.plan.name}</div>
                      {index === 0 && <span className="text-xs text-green-600 font-medium">Best Value</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(item.calculation.monthlyEquivalent)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(item.calculation.totalPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.plan.features} modules
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.plan.name.includes('Basic') ? 'Small PGs' :
                       item.plan.name.includes('Pro') ? 'Growing PGs' :
                       'Large Networks'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentView === 'optimize' && optimization && (
        <div className="space-y-6">
          {/* Current Cost Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Cost Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(optimization.currentCost.totalPrice)}
                </div>
                <div className="text-sm text-gray-600">Current Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(optimization.totalPotentialSavings)}
                </div>
                <div className="text-sm text-gray-600">Potential Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(optimization.currentCost.totalPrice - optimization.totalPotentialSavings)}
                </div>
                <div className="text-sm text-gray-600">Optimized Cost</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>

            <div className="space-y-4">
              {optimization.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    {rec.type === 'billing_cycle' ? (
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : rec.type === 'bed_optimization' ? (
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    ) : (
                      <Settings className="h-5 w-5 text-purple-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      {rec.potentialSavings && (
                        <p className="text-sm font-medium text-green-600 mt-2">
                          Potential savings: {formatCurrency(rec.potentialSavings)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentView === 'tiers' && pricingTiers && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Tiers</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingTiers.tiers.map((tier, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                tier.recommended ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                  {tier.recommended && <Award className="h-5 w-5 text-green-600" />}
                </div>

                <div className="text-2xl font-bold text-green-600 mb-2">
                  {formatCurrency(tier.cost.totalPrice)}
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  {tier.cost.billingCycle === 'annual' ? 'per year' : 'per month'}
                </div>

                <div className="space-y-1 text-sm">
                  <div>Tier: <span className="font-medium capitalize">{tier.tier}</span></div>
                  <div>Features: <span className="font-medium">{tier.features} modules</span></div>
                  <div>Monthly: <span className="font-medium">{formatCurrency(tier.cost.monthlyEquivalent)}</span></div>
                </div>

                {tier.recommended && (
                  <div className="mt-3 text-xs text-green-600 font-medium">
                    Recommended for your usage
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCalculator;
