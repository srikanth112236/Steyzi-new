import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  Bed,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Eye,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import common components
import StatCard from '../../components/common/StatCard';
import Chart from '../../components/common/charts/Chart';
import { getApiBaseUrl } from '../../utils/apiUrl';

// Utility function for stable data caching
const createStableCache = () => {
  const cache = new Map();
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  return {
    set: (key, value) => {
      cache.set(key, {
        timestamp: Date.now(),
        value
      });
    },
    get: (key) => {
      const entry = cache.get(key);
      if (!entry) return null;
      
      // Check if cache is still valid
      if (Date.now() - entry.timestamp < CACHE_DURATION) {
        return entry.value;
      }
      
      cache.delete(key);
      return null;
    },
    clear: () => cache.clear()
  };
};

const dashboardCache = createStableCache();

// Enhanced Usage API service
const usageService = {
  // Fetch dashboard usage data
  getDashboard: async (timeframe = '30d') => {
    try {
      // Check cache first
      const cachedData = dashboardCache.get('usageData');
      if (cachedData) return cachedData;

      const response = await axios.get(`/api/advanced/usage/dashboard`, {
        params: { timeframe },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      // Cache the response
      dashboardCache.set('usageData', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch usage dashboard:', error);
      throw error;
    }
  },

  // Fetch cost breakdown
  getCostBreakdown: async () => {
    try {
      // Check cache first
      const cachedData = dashboardCache.get('costBreakdown');
      if (cachedData) return cachedData;

      const apiBase = getApiBaseUrl();
      const response = await axios.get(`${apiBase}/advanced/usage/cost-breakdown`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });

      // Cache the response
      dashboardCache.set('costBreakdown', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cost breakdown:', error);
      throw error;
    }
  },

  // Get subscription details from Redux state
  getSubscriptionDetails: () => {
    try {
      // Get subscription from Redux store
      const subscription = store.getState().auth.subscription;

      if (!subscription) {
        throw new Error('No subscription data available');
      }

      const processedData = {
        success: true,
        data: {
          planName: subscription.plan?.planName || 'Unknown Plan',
          status: subscription.status || 'unknown',
          endDate: subscription.endDate,
          limits: {
            beds: subscription.totalBeds || 0,
            branches: subscription.totalBranches || 0
          }
        }
      };

      return processedData;
    } catch (error) {
      console.error('Failed to get subscription details:', error);
      throw new Error(
        'Unable to retrieve subscription details. Please try again later.'
      );
    }
  }
};

const UsageDashboard = () => {
  // State management
  const [usageData, setUsageData] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [dataError, setDataError] = useState(null);

  // Validate and sanitize usage data
  const sanitizeUsageData = (data) => {
    if (!data || !data.currentUsage) {
      return null;
    }

    const currentUsage = { ...data.currentUsage };
    const limits = data.limits || {};

    // Validate and cap residents
    const maxBeds = limits.beds?.allowed || 60;
    currentUsage.residents = {
      active: Math.min(currentUsage.residents?.active || 0, maxBeds),
      total: Math.min(currentUsage.residents?.total || 0, maxBeds)
    };

    // Validate rooms
    const totalRooms = Math.max(Math.ceil(maxBeds / 6), 1); // Ensure at least 1 room
    currentUsage.rooms = {
      total: totalRooms,
      occupied: Math.min(currentUsage.rooms?.occupied || 0, totalRooms),
      vacant: Math.max(totalRooms - (currentUsage.rooms?.occupied || 0), 0),
      occupancyRate: Math.min(currentUsage.rooms?.occupancyRate || 0, 100)
    };

    // Validate beds
    currentUsage.beds = {
      total: maxBeds,
      occupied: Math.min(currentUsage.beds?.occupied || 0, maxBeds),
      vacant: Math.max(maxBeds - (currentUsage.beds?.occupied || 0), 0),
      utilizationRate: Math.min(currentUsage.beds?.utilizationRate || 0, 100)
    };

    // Validate payments with minimum values
    currentUsage.payments = {
      totalAmount: Math.max(currentUsage.payments?.totalAmount || 0, 0),
      transactionCount: Math.max(currentUsage.payments?.transactionCount || 0, 0),
      averageAmount: Math.max(currentUsage.payments?.averageAmount || 0, 0)
    };

    return {
      ...data,
      currentUsage
    };
  };

  // Stable data loading with memoized callback
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setDataError(null);

      // Parallel data fetching with cache-first approach
      const [usageRes, costRes, subscriptionRes] = await Promise.all([
        usageService.getDashboard(timeframe),
        usageService.getCostBreakdown(),
        usageService.getSubscriptionDetails()
      ]);

      // Process and set usage data with validation
      if (usageRes.success) {
        const sanitizedUsageData = sanitizeUsageData(usageRes.data);
        
        if (!sanitizedUsageData) {
          setDataError('Unable to process usage data');
          setUsageData(null);
        } else {
          setUsageData(sanitizedUsageData);
        }
      } else {
        setDataError(usageRes.message || 'Failed to load usage data');
        setUsageData(null);
        toast.error(usageRes.message || 'Failed to load usage data');
      }

      // Process and set cost breakdown
      if (costRes.success) {
        setCostBreakdown(costRes.data);
      } else {
        toast.error(costRes.message || 'Failed to load cost breakdown');
        setCostBreakdown(null);
      }

      // Process and set subscription details
      if (subscriptionRes.success) {
        setSubscriptionDetails(subscriptionRes.data);
      } else {
        toast.error(subscriptionRes.message || 'Failed to load subscription details');
        setSubscriptionDetails(null);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setDataError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Initial and timeframe-based data loading
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Memoized currency and percentage formatters
  const formatCurrency = useMemo(() => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format
  , []);

  const formatPercentage = useMemo(() => 
    (value) => `${Math.min(Math.max(value || 0, 0), 100).toFixed(1)}%`
  , []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Loading Error</h2>
          <p className="text-gray-600 mb-6">{dataError}</p>
          <button 
            onClick={loadDashboardData}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Render empty state component
  const EmptyStateComponent = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gray-50 rounded-xl p-8 text-center">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-24 w-24 text-gray-400 mb-6"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9.172 16.172a4 4 0 015.656 0M9 12h.01M15 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        No Usage Data Available
      </h2>
      <p className="text-gray-600 mb-6">
        It seems there are no residents or transactions recorded yet. 
        Start adding residents or processing payments to see your dashboard.
      </p>
      <div className="flex space-x-4">
        <button 
          onClick={() => {/* Navigate to add resident */}}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add Resident
        </button>
        <button 
          onClick={() => {/* Navigate to payments */}}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Process Payment
        </button>
      </div>
    </div>
  );

  // Render dashboard content
  const renderDashboardContent = () => {
    // If no usage data or all metrics are zero
    if (!usageData || (
      usageData.currentUsage.residents.active === 0 &&
      usageData.currentUsage.rooms.total === 0 &&
      usageData.currentUsage.beds.total === 0 &&
      usageData.currentUsage.payments.totalAmount === 0
    )) {
      return <EmptyStateComponent />;
    }

    return (
      <div>
        {/* Current Usage Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="Active Residents"
            value={usageData.currentUsage.residents.active.toString()}
            subtitle={`of ${usageData.limits.beds.allowed} beds`}
          />

          <StatCard
            icon={<Home className="h-6 w-6 text-green-600" />}
            title="Room Utilization"
            value={formatPercentage(usageData.currentUsage.rooms.occupancyRate)}
            subtitle={`${usageData.currentUsage.rooms.occupied}/${usageData.currentUsage.rooms.total} occupied`}
          />

          <StatCard
            icon={<Bed className="h-6 w-6 text-purple-600" />}
            title="Bed Utilization"
            value={formatPercentage(usageData.currentUsage.beds.utilizationRate)}
            subtitle={`${usageData.currentUsage.beds.occupied}/${usageData.currentUsage.beds.total} occupied`}
          />

          <StatCard
            icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
            title="Payment Volume"
            value={formatCurrency(usageData.currentUsage.payments.totalAmount)}
            subtitle={`${usageData.currentUsage.payments.transactionCount} transactions`}
          />
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Resource Utilization Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Cost Breakdown
              </h3>

              {costBreakdown ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Base Subscription</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(costBreakdown.baseSubscription || 0)}
                    </span>
                  </div>

                  {costBreakdown.extraBeds > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Extra Beds ({costBreakdown.extraBeds})
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(costBreakdown.extraBedCost || 0)}
                      </span>
                    </div>
                  )}

                  {costBreakdown.extraBranches > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Extra Branches ({costBreakdown.extraBranches})
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(costBreakdown.branchCost || 0)}
                      </span>
                    </div>
                  )}

                  {costBreakdown.discounts > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Discounts</span>
                      <span className="text-sm font-medium text-green-600">
                        -{formatCurrency(costBreakdown.discounts || 0)}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Subtotal</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(costBreakdown.subtotal || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taxes (18% GST)</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(costBreakdown.taxes || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-base font-bold text-green-600">
                        {formatCurrency(costBreakdown.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">No cost breakdown available</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button 
                onClick={() => {/* Implement upgrade plan logic */}}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Upgrade Plan
              </button>

              <button 
                onClick={() => {/* Implement add beds logic */}}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Add More Beds
              </button>

              <button 
                onClick={() => {/* Navigate to cost calculator */}}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                View Cost Calculator
              </button>

              <button 
                onClick={() => {/* Open support contact */}}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-600" />
              Subscription Info
            </h3>

            {subscriptionDetails ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-medium text-gray-900">
                    {subscriptionDetails.planName || 'No Plan'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    subscriptionDetails.status === 'active' ? 'bg-green-100 text-green-800' :
                    subscriptionDetails.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {subscriptionDetails.status || 'Unknown'}
                  </span>
                </div>

                {subscriptionDetails.endDate && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {subscriptionDetails.status === 'trial' ? 'Trial Ends' : 'Next Billing'}
                    </p>
                    <p className="font-medium text-gray-900">
                      {new Date(subscriptionDetails.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {subscriptionDetails.limits && (
                  <div>
                    <p className="text-sm text-gray-600">Limits</p>
                    <div className="text-sm text-gray-900">
                      <p>{subscriptionDetails.limits.beds} beds allowed</p>
                      <p>{subscriptionDetails.limits.branches} branches allowed</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No subscription information available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Usage Dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Real-time usage monitoring and resource utilization
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>

            <button
              onClick={loadDashboardData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {renderDashboardContent()}
    </div>
  );
};

export default UsageDashboard;
