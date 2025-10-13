import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

// Usage API service
const usageService = {
  getDashboard: async (timeframe = '30d') => {
    const response = await fetch(`/api/advanced/usage/dashboard?timeframe=${timeframe}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getCostBreakdown: async () => {
    const response = await fetch('/api/advanced/usage/cost-breakdown', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

const UsageDashboard = () => {
  const [usageData, setUsageData] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    loadUsageData();
  }, [timeframe]);

  const loadUsageData = async () => {
    try {
      setLoading(true);

      const [usageRes, costRes] = await Promise.all([
        usageService.getDashboard(timeframe),
        usageService.getCostBreakdown()
      ]);

      if (usageRes.success) {
        setUsageData(usageRes.data);
      }

      if (costRes.success) {
        setCostBreakdown(costRes.data);
      }

    } catch (error) {
      console.error('Failed to load usage data:', error);
      toast.error('Failed to load usage dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value?.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              onClick={loadUsageData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Usage Metrics */}
      {usageData && (
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Utilization Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Resource Utilization
              </h3>
              <span className="text-sm text-gray-500">{timeframe}</span>
            </div>

            {usageData && (
              <div className="space-y-6">
                {/* Beds Utilization */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Bed Utilization</span>
                    <span className="text-sm text-gray-600">
                      {usageData.currentUsage.beds.occupied}/{usageData.currentUsage.beds.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        usageData.currentUsage.beds.utilizationRate >= 90 ? 'bg-red-500' :
                        usageData.currentUsage.beds.utilizationRate >= 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usageData.currentUsage.beds.utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatPercentage(usageData.utilizationRates.beds.current)} utilized</span>
                    <span>{usageData.utilizationRates.beds.remaining} beds remaining</span>
                  </div>
                </div>

                {/* Room Utilization */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Room Utilization</span>
                    <span className="text-sm text-gray-600">
                      {usageData.currentUsage.rooms.occupied}/{usageData.currentUsage.rooms.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        usageData.currentUsage.rooms.occupancyRate >= 95 ? 'bg-red-500' :
                        usageData.currentUsage.rooms.occupancyRate >= 80 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usageData.currentUsage.rooms.occupancyRate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatPercentage(usageData.utilizationRates.rooms.current)} occupied</span>
                    <span>{usageData.utilizationRates.rooms.remaining} rooms available</span>
                  </div>
                </div>

                {/* Resident Capacity */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Resident Capacity</span>
                    <span className="text-sm text-gray-600">
                      {usageData.currentUsage.residents.active}/{usageData.limits.beds.allowed}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        usageData.utilizationRates.residents.utilization >= 90 ? 'bg-red-500' :
                        usageData.utilizationRates.residents.utilization >= 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usageData.utilizationRates.residents.utilization, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatPercentage(usageData.utilizationRates.residents.utilization)} capacity used</span>
                    <span>{usageData.limits.beds.allowed - usageData.currentUsage.residents.active} spots available</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Usage Trends Chart */}
          {usageData?.trends && usageData.trends.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Usage Trends
              </h3>

              <Chart
                type="line"
                data={{
                  labels: usageData.trends.map(trend => trend.date),
                  values: usageData.trends.map(trend => trend.beds)
                }}
                height={250}
                options={{
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Bed Utilization'
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Alerts & Cost Breakdown */}
        <div className="space-y-6">
          {/* Usage Alerts */}
          {usageData?.alerts && usageData.alerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Usage Alerts
              </h3>

              <div className="space-y-3">
                {usageData.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    alert.severity === 'high' ? 'border-red-200 bg-red-50' :
                    alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        alert.severity === 'high' ? 'text-red-600' :
                        alert.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          {costBreakdown && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Cost Breakdown
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Base Subscription</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(costBreakdown.baseSubscription)}
                  </span>
                </div>

                {costBreakdown.extraBeds > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Extra Beds ({costBreakdown.extraBeds})
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(costBreakdown.extraBedCost)}
                    </span>
                  </div>
                )}

                {costBreakdown.extraBranches > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Extra Branches ({costBreakdown.extraBranches})
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(costBreakdown.branchCost)}
                    </span>
                  </div>
                )}

                {costBreakdown.discounts > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Discounts</span>
                    <span className="text-sm font-medium text-green-600">
                      -{formatCurrency(costBreakdown.discounts)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(costBreakdown.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxes (18% GST)</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(costBreakdown.taxes)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-base font-bold text-green-600">
                      {formatCurrency(costBreakdown.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Info */}
          {usageData?.subscription && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Subscription Info
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-medium text-gray-900">{usageData.subscription.planName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    usageData.subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                    usageData.subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {usageData.subscription.status}
                  </span>
                </div>

                {usageData.subscription.endDate && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {usageData.subscription.status === 'trial' ? 'Trial Ends' : 'Next Billing'}
                    </p>
                    <p className="font-medium text-gray-900">
                      {new Date(usageData.subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Limits</p>
                  <div className="text-sm text-gray-900">
                    <p>{usageData.limits.beds.allowed} beds allowed</p>
                    <p>{usageData.limits.branches.allowed} branches allowed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Upgrade Plan
              </button>

              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Add More Beds
              </button>

              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                View Cost Calculator
              </button>

              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;
