import React, { useState, useEffect } from 'react';
import Chart from '../common/charts/Chart';
import StatCard from '../common/StatCard';
import api from '../../services/api';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';

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
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!statistics) {
    return <div className="text-center py-8 text-gray-500">No statistics available</div>;
  }

  const totalAmount = statistics.total.amount;
  const currentMonthAmount = statistics.currentMonth.amount;
  const lastMonthAmount = statistics.lastMonth.amount;
  const monthDifference = currentMonthAmount - lastMonthAmount;
  const monthPercentChange = lastMonthAmount > 0 
    ? ((monthDifference / lastMonthAmount) * 100).toFixed(1) 
    : 0;

  // Prepare chart data for expenses by type
  const byTypeData = {
    labels: statistics.byType.map(item => item._id),
    datasets: [{
      label: 'Amount (₹)',
      data: statistics.byType.map(item => item.totalAmount),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(132, 204, 22, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#06B6D4',
        '#84CC16',
        '#F97316',
        '#EC4899'
      ],
      borderWidth: 2
    }]
  };

  // Prepare monthly trend data
  const monthlyTrendData = {
    labels: statistics.monthlyTrend.map(item => item.month),
    datasets: [{
      label: 'Monthly Expenses (₹)',
      data: statistics.monthlyTrend.map(item => item.amount),
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3B82F6',
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Expenses"
          value={`₹${totalAmount.toLocaleString('en-IN')}`}
          subtitle={`${statistics.total.count} expenses`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={null}
        />

        <StatCard
          title="This Month"
          value={`₹${currentMonthAmount.toLocaleString('en-IN')}`}
          subtitle={`${statistics.currentMonth.count} expenses`}
          icon={<FileText className="w-6 h-6" />}
          trend={monthDifference > 0 ? (
            <span className="text-red-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +{monthPercentChange}%
            </span>
          ) : monthDifference < 0 ? (
            <span className="text-green-600 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {Math.abs(monthPercentChange)}%
            </span>
          ) : null}
        />

        <StatCard
          title="Last Month"
          value={`₹${lastMonthAmount.toLocaleString('en-IN')}`}
          subtitle={`${statistics.lastMonth.count} expenses`}
          icon={<FileText className="w-6 h-6" />}
          trend={null}
        />

        <StatCard
          title="Month Change"
          value={`₹${Math.abs(monthDifference).toLocaleString('en-IN')}`}
          subtitle={monthDifference > 0 ? 'Increased' : monthDifference < 0 ? 'Decreased' : 'No change'}
          icon={monthDifference > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          trend={monthDifference > 0 ? (
            <span className="text-red-600">+{monthPercentChange}%</span>
          ) : monthDifference < 0 ? (
            <span className="text-green-600">-{Math.abs(monthPercentChange)}%</span>
          ) : null}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Expenses by Type</h3>
          <Chart
            type="pie"
            data={byTypeData}
            height={300}
            options={{
              plugins: {
                legend: {
                  position: 'right'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      return `${label}: ₹${value.toLocaleString('en-IN')}`;
                    }
                  }
                }
              }
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Trend</h3>
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
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Expenses by Type Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Breakdown by Type</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {statistics.byType.map((item, index) => {
                const percentage = totalAmount > 0 
                  ? ((item.totalAmount / totalAmount) * 100).toFixed(1) 
                  : 0;
                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{item._id}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      ₹{item.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseStatistics;

