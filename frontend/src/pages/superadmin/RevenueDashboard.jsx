import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import common components
import StatCard from '../../components/common/StatCard';
import Chart from '../../components/common/charts/Chart';

// Revenue API service
const revenueService = {
  getForecast: async (timeframe = 12, forecastType = 'realistic') => {
    const response = await fetch(`/api/advanced/revenue/forecast?timeframe=${timeframe}&forecastType=${forecastType}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getInsights: async () => {
    const response = await fetch('/api/advanced/revenue/insights', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

const RevenueDashboard = () => {
  const [forecastData, setForecastData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(12);
  const [forecastType, setForecastType] = useState('realistic');

  useEffect(() => {
    loadRevenueData();
  }, [timeframe, forecastType]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);

      const [forecastRes, insightsRes] = await Promise.all([
        revenueService.getForecast(timeframe, forecastType),
        revenueService.getInsights()
      ]);

      if (forecastRes.success) {
        setForecastData(forecastRes.data);
      }

      if (insightsRes.success) {
        setInsights(insightsRes.data);
      }

    } catch (error) {
      console.error('Failed to load revenue data:', error);
      toast.error('Failed to load revenue dashboard');
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
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Predictive analytics and revenue forecasting
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={18}>18 Months</option>
              <option value={24}>24 Months</option>
            </select>

            <select
              value={forecastType}
              onChange={(e) => setForecastType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="conservative">Conservative</option>
              <option value="realistic">Realistic</option>
              <option value="optimistic">Optimistic</option>
              <option value="aggressive">Aggressive</option>
            </select>

            <button
              onClick={loadRevenueData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<DollarSign className="h-6 w-6 text-green-600" />}
            title="Current MRR"
            value={formatCurrency(insights.currentMRR)}
            subtitle="Monthly Recurring Revenue"
          />

          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
            title="Current ARR"
            value={formatCurrency(insights.currentARR)}
            subtitle="Annual Recurring Revenue"
          />

          <StatCard
            icon={<Target className="h-6 w-6 text-purple-600" />}
            title="6-Month Forecast"
            value={formatCurrency(insights.projectedRevenue6Months)}
            subtitle="Predicted revenue"
          />

          <StatCard
            icon={<BarChart3 className="h-6 w-6 text-orange-600" />}
            title="Growth Rate"
            value={formatPercentage(insights.growthRate * 100)}
            subtitle="Monthly growth rate"
            change={insights.growthRate > 0 ? "positive" : "negative"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Forecast Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Revenue Forecast ({timeframe} Months)
              </h3>
              <span className="text-sm text-gray-500 capitalize">
                {forecastType} Model
              </span>
            </div>

            {forecastData?.forecast && (
              <Chart
                type="line"
                data={{
                  labels: forecastData.forecast.map(month => month.month),
                  values: forecastData.forecast.map(month => month.predictedRevenue)
                }}
                height={300}
                options={{
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => formatCurrency(value)
                      }
                    }
                  }
                }}
              />
            )}
          </div>

          {/* Forecast Confidence Intervals */}
          {forecastData?.confidenceIntervals && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Intervals</h3>
              <div className="space-y-3">
                {forecastData.confidenceIntervals.slice(0, 6).map((interval, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{interval.month}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatCurrency(interval.lowerBound)} - {formatCurrency(interval.upperBound)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        interval.confidenceLevel >= 90 ? 'bg-green-100 text-green-800' :
                        interval.confidenceLevel >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {interval.confidenceLevel}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Insights & Recommendations */}
        <div className="space-y-6">
          {/* Top Performing Plans */}
          {insights?.topPerformingPlans && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Top Performing Plans
              </h3>

              <div className="space-y-3">
                {insights.topPerformingPlans.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{plan.planName}</p>
                      <p className="text-xs text-gray-500">{plan.subscriberCount} subscribers</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(plan.monthlyRevenue)}
                      </p>
                      <p className="text-xs text-gray-500">MRR</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {insights?.recommendations && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                AI Recommendations
              </h3>

              <div className="space-y-3">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                    rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {rec.type === 'positive' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : rec.type === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      ) : (
                        <Settings className="h-4 w-4 text-blue-600 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                        <p className="text-xs text-gray-600">{rec.description}</p>
                        {rec.potentialSavings && (
                          <p className="text-xs font-medium text-green-600 mt-1">
                            Potential savings: {formatCurrency(rec.potentialSavings)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">12-Month Forecast</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(insights?.projectedRevenue12Months || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Revenue/User</span>
                <span className="text-sm font-medium text-blue-600">
                  {formatCurrency(insights?.averageRevenuePerUser || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Potential Savings</span>
                <span className="text-sm font-medium text-purple-600">
                  {formatCurrency(insights?.recommendations?.reduce((sum, rec) => sum + (rec.potentialSavings || 0), 0) || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      {forecastData?.historicalData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Historical Performance</h3>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forecastData.historicalData.map((month, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{month.month}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{month.transactions}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{month.uniqueUsers}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(month.averageTransaction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueDashboard;
