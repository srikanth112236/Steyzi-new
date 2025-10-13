import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Building2,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Award
} from 'lucide-react';
import salesService from '../../services/sales.service';

const Performance = () => {
  const { user } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const response = await salesService.getPerformanceAnalytics();
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch performance data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No performance data available</p>
      </div>
    );
  }

  const isManager = user?.role === 'sales_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your sales performance and achievements
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isManager ? (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Size</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.teamSize}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">PGs This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.pgsThisMonth}</p>
                  <div className="flex items-center text-sm">
                    {analytics.summary.growthRate >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={analytics.summary.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {analytics.summary.growthRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Yearly Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.targets.currentProgress}%</p>
                  <p className="text-sm text-gray-500">
                    {analytics.summary.pgsThisYear} / {analytics.targets.yearlyTarget} PGs
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.summary.totalCommission)}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">PGs This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.pgsThisMonth}</p>
                  <div className="flex items-center text-sm">
                    {analytics.summary.growthRate >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={analytics.summary.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {analytics.summary.growthRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Yearly Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.targets.currentProgress}%</p>
                  <p className="text-sm text-gray-500">
                    {analytics.summary.pgsThisYear} / {analytics.targets.yearlyTarget} PGs
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.summary.totalCommission)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Commission Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.commissionRate}%</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Performance Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.monthlyTrend.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">{item.pgs} PGs</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((item.pgs / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Performance (for managers only) */}
        {isManager && analytics.staffPerformance && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.staffPerformance.slice(0, 5).map((staff, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-500">{staff.uniqueId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{staff.pgsThisYear} PGs</p>
                    <p className="text-xs text-green-600">{formatCurrency(staff.commission)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Goals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Goals</h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Monthly Target</span>
                <span>{analytics.summary.pgsThisMonth || 0} / {analytics.targets.monthlyTarget}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(((analytics.summary.pgsThisMonth || 0) / analytics.targets.monthlyTarget) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Yearly Target</span>
                <span>{analytics.summary.pgsThisYear || 0} / {analytics.targets.yearlyTarget}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(((analytics.summary.pgsThisYear || 0) / analytics.targets.yearlyTarget) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
            <Award className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(analytics.summary.pgsThisMonth || 0) >= analytics.targets.monthlyTarget && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <Award className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-yellow-800">Monthly Target</p>
                <p className="text-xs text-yellow-600">Achieved!</p>
              </div>
            )}

            {(analytics.summary.pgsThisYear || 0) >= analytics.targets.yearlyTarget && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <Award className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-green-800">Yearly Target</p>
                <p className="text-xs text-green-600">Achieved!</p>
              </div>
            )}

            {parseFloat(analytics.summary.growthRate) > 20 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-blue-800">High Growth</p>
                <p className="text-xs text-blue-600">+{analytics.summary.growthRate}%</p>
              </div>
            )}

            {isManager && (analytics.summary.teamSize || 0) >= 5 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-purple-800">Team Builder</p>
                <p className="text-xs text-purple-600">{analytics.summary.teamSize} members</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
