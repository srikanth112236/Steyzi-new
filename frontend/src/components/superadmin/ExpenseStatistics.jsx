import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chart from '../common/charts/Chart';
import api from '../../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Zap
} from 'lucide-react';

const ExpenseStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/expenses/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No statistics available</p>
      </div>
    );
  }

  const totalAmount = statistics.total.amount;
  const totalCount = statistics.total.count;
  const currentMonthAmount = statistics.currentMonth.amount;
  const currentMonthCount = statistics.currentMonth.count;
  const lastMonthAmount = statistics.lastMonth.amount;
  const lastMonthCount = statistics.lastMonth.count;
  const monthDifference = currentMonthAmount - lastMonthAmount;
  const monthPercentChange = lastMonthAmount > 0 
    ? ((monthDifference / lastMonthAmount) * 100).toFixed(1) 
    : 0;
  
  // Calculate additional metrics
  const averageExpense = totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : 0;
  const averageMonthlyExpense = currentMonthCount > 0 ? (currentMonthAmount / currentMonthCount).toFixed(2) : 0;
  
  // Find highest expense type
  const highestExpenseType = statistics.byType.length > 0 
    ? statistics.byType.reduce((max, item) => item.totalAmount > max.totalAmount ? item : max, statistics.byType[0])
    : null;

  // Prepare chart data for expenses by type (Pie/Donut)
  const byTypeData = {
    labels: statistics.byType.map(item => item._id),
    datasets: [{
      label: 'Amount (₹)',
      data: statistics.byType.map(item => item.totalAmount),
      backgroundColor: [
        'rgba(6, 182, 212, 0.8)',   // cyan
        'rgba(59, 130, 246, 0.8)',   // blue
        'rgba(16, 185, 129, 0.8)',   // green
        'rgba(245, 158, 11, 0.8)',  // amber
        'rgba(239, 68, 68, 0.8)',    // red
        'rgba(139, 92, 246, 0.8)',   // purple
        'rgba(132, 204, 22, 0.8)',   // lime
        'rgba(249, 115, 22, 0.8)',   // orange
        'rgba(236, 72, 153, 0.8)'    // pink
      ],
      borderColor: [
        '#06B6D4',
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#84CC16',
        '#F97316',
        '#EC4899'
      ],
      borderWidth: 2
    }]
  };

  // Prepare bar chart data for expenses by type
  const byTypeBarData = {
    labels: statistics.byType.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
    datasets: [{
      label: 'Total Amount (₹)',
      data: statistics.byType.map(item => item.totalAmount),
      backgroundColor: 'rgba(6, 182, 212, 0.8)',
      borderColor: '#06B6D4',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  // Prepare monthly trend data (Area Chart)
  const monthlyTrendData = {
    labels: statistics.monthlyTrend.map(item => item.month),
    datasets: [{
      label: 'Monthly Expenses (₹)',
      data: statistics.monthlyTrend.map(item => item.amount),
      backgroundColor: 'rgba(6, 182, 212, 0.2)',
      borderColor: '#06B6D4',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#06B6D4',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  // Stat Card Component
  const StatCard = ({ icon, title, value, subtitle, trend, trendValue, bgColor = "bg-white" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} rounded-xl shadow-lg border border-cyan-100 p-4 hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : 
             trend === 'down' ? <ArrowDownRight className="h-3.5 w-3.5" /> : 
             <Minus className="h-3.5 w-3.5" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          title="Total Expenses"
          value={`₹${totalAmount.toLocaleString('en-IN')}`}
          subtitle={`${totalCount} expenses`}
          bgColor="bg-gradient-to-br from-cyan-50 to-white"
        />
        
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          title="This Month"
          value={`₹${currentMonthAmount.toLocaleString('en-IN')}`}
          subtitle={`${currentMonthCount} expenses`}
          trend={monthDifference > 0 ? 'up' : monthDifference < 0 ? 'down' : null}
          trendValue={monthDifference !== 0 ? `${Math.abs(monthPercentChange)}%` : '0%'}
          bgColor="bg-gradient-to-br from-blue-50 to-white"
        />
        
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          title="Last Month"
          value={`₹${lastMonthAmount.toLocaleString('en-IN')}`}
          subtitle={`${lastMonthCount} expenses`}
          bgColor="bg-gradient-to-br from-purple-50 to-white"
        />
        
        <StatCard
          icon={monthDifference > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          title="Month Change"
          value={`₹${Math.abs(monthDifference).toLocaleString('en-IN')}`}
          subtitle={monthDifference > 0 ? 'Increased' : monthDifference < 0 ? 'Decreased' : 'No change'}
          trend={monthDifference > 0 ? 'up' : monthDifference < 0 ? 'down' : null}
          trendValue={monthDifference !== 0 ? `${Math.abs(monthPercentChange)}%` : '0%'}
          bgColor="bg-gradient-to-br from-green-50 to-white"
        />
      </div>

      {/* Secondary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="h-5 w-5" />}
          title="Average Expense"
          value={`₹${parseFloat(averageExpense).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          subtitle="Per transaction"
          bgColor="bg-gradient-to-br from-amber-50 to-white"
        />
        
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          title="Monthly Average"
          value={`₹${parseFloat(averageMonthlyExpense).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          subtitle="This month"
          bgColor="bg-gradient-to-br from-indigo-50 to-white"
        />
        
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          title="Top Category"
          value={highestExpenseType ? highestExpenseType._id.charAt(0).toUpperCase() + highestExpenseType._id.slice(1) : 'N/A'}
          subtitle={highestExpenseType ? `₹${highestExpenseType.totalAmount.toLocaleString('en-IN')}` : 'No data'}
          bgColor="bg-gradient-to-br from-pink-50 to-white"
        />
        
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="Categories"
          value={statistics.byType.length}
          subtitle="Active types"
          bgColor="bg-gradient-to-br from-teal-50 to-white"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Type - Donut Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg border border-cyan-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-cyan-600" />
              Expenses by Type
            </h3>
          </div>
          <Chart
            type="doughnut"
            data={byTypeData}
            height={300}
            options={{
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    padding: 15,
                    usePointStyle: true,
                    font: {
                      size: 12
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                    }
                  }
                }
              },
              cutout: '60%'
            }}
          />
        </motion.div>

        {/* Monthly Trend - Area Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-cyan-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-600" />
              Monthly Trend
            </h3>
          </div>
          <Chart
            type="line"
            data={monthlyTrendData}
            height={300}
            options={{
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const value = context.parsed.y || 0;
                      return `₹${value.toLocaleString('en-IN')}`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₹' + value.toLocaleString('en-IN');
                    },
                    font: {
                      size: 11
                    }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      size: 11
                    }
                  }
                }
              }
            }}
          />
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Type - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-cyan-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-600" />
              Category Comparison
            </h3>
          </div>
          <Chart
            type="bar"
            data={byTypeBarData}
            height={300}
            options={{
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const value = context.parsed.y || 0;
                      return `₹${value.toLocaleString('en-IN')}`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₹' + value.toLocaleString('en-IN');
                    },
                    font: {
                      size: 11
                    }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      size: 11
                    }
                  }
                }
              }
            }}
          />
        </motion.div>

        {/* Detailed Breakdown Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-cyan-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            Detailed Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-200">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Amount</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Count</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">%</th>
                </tr>
              </thead>
              <tbody>
                {statistics.byType.map((item, index) => {
                  const percentage = totalAmount > 0 
                    ? ((item.totalAmount / totalAmount) * 100).toFixed(1) 
                    : 0;
                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-cyan-50/50 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-900 capitalize">
                        {item._id}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                        ₹{item.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-600">
                        {item.count}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ExpenseStatistics;
