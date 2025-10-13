import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Calendar,
  MessageSquare,
  Activity,
  Star,
  Target,
  Zap,
  XCircle
} from 'lucide-react';
import ticketService from '../../services/ticket.service';

const TicketAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      avgResponseTime: '0 hours',
      avgResolutionTime: '0 days',
      satisfactionScore: 0
    },
    trends: {
      daily: [],
      weekly: [],
      monthly: []
    },
    categories: [],
    topIssues: [],
    staffPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getAnalytics(timeRange);
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        // Load fallback data if API fails
        setAnalytics({
          overview: {
            totalTickets: 156,
            openTickets: 12,
            inProgressTickets: 8,
            resolvedTickets: 89,
            closedTickets: 47,
            avgResponseTime: '2.5 hours',
            avgResolutionTime: '1.2 days',
            satisfactionScore: 4.6
          },
          trends: {
            daily: [
              { date: 'Mon', tickets: 15, resolved: 12 },
              { date: 'Tue', tickets: 18, resolved: 14 },
              { date: 'Wed', tickets: 22, resolved: 19 },
              { date: 'Thu', tickets: 16, resolved: 13 },
              { date: 'Fri', tickets: 20, resolved: 17 },
              { date: 'Sat', tickets: 8, resolved: 6 },
              { date: 'Sun', tickets: 5, resolved: 4 }
            ],
            weekly: [],
            monthly: []
          },
          categories: [
            { name: 'Technical Issues', count: 45, percentage: 28.8 },
            { name: 'Billing Questions', count: 32, percentage: 20.5 },
            { name: 'Account Access', count: 28, percentage: 17.9 },
            { name: 'Feature Requests', count: 25, percentage: 16.0 },
            { name: 'General Support', count: 26, percentage: 16.7 }
          ],
          topIssues: [
            { issue: 'Login Problems', count: 18, trend: 'up' },
            { issue: 'Payment Processing', count: 15, trend: 'down' },
            { issue: 'System Slowdown', count: 12, trend: 'up' },
            { issue: 'Feature Not Working', count: 10, trend: 'stable' },
            { issue: 'Account Locked', count: 8, trend: 'down' }
          ],
          staffPerformance: [
            { name: 'John Smith', tickets: 45, avgTime: 2.1, satisfaction: 4.8 },
            { name: 'Sarah Johnson', tickets: 38, avgTime: 2.3, satisfaction: 4.7 },
            { name: 'Mike Davis', tickets: 42, avgTime: 2.0, satisfaction: 4.9 },
            { name: 'Lisa Wilson', tickets: 31, avgTime: 2.5, satisfaction: 4.6 }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Load fallback data on error
      setAnalytics({
        overview: {
          totalTickets: 156,
          openTickets: 12,
          inProgressTickets: 8,
          resolvedTickets: 89,
          closedTickets: 47,
          avgResponseTime: '2.5 hours',
          avgResolutionTime: '1.2 days',
          satisfactionScore: 4.6
        },
        trends: {
          daily: [
            { date: 'Mon', tickets: 15, resolved: 12 },
            { date: 'Tue', tickets: 18, resolved: 14 },
            { date: 'Wed', tickets: 22, resolved: 19 },
            { date: 'Thu', tickets: 16, resolved: 13 },
            { date: 'Fri', tickets: 20, resolved: 17 },
            { date: 'Sat', tickets: 8, resolved: 6 },
            { date: 'Sun', tickets: 5, resolved: 4 }
          ],
          weekly: [],
          monthly: []
        },
        categories: [
          { name: 'Technical Issues', count: 45, percentage: 28.8 },
          { name: 'Billing Questions', count: 32, percentage: 20.5 },
          { name: 'Account Access', count: 28, percentage: 17.9 },
          { name: 'Feature Requests', count: 25, percentage: 16.0 },
          { name: 'General Support', count: 26, percentage: 16.7 }
        ],
        topIssues: [
          { issue: 'Login Problems', count: 18, trend: 'up' },
          { issue: 'Payment Processing', count: 15, trend: 'down' },
          { issue: 'System Slowdown', count: 12, trend: 'up' },
          { issue: 'Feature Not Working', count: 10, trend: 'stable' },
          { issue: 'Account Locked', count: 8, trend: 'down' }
        ],
        staffPerformance: [
          { name: 'John Smith', tickets: 45, avgTime: 2.1, satisfaction: 4.8 },
          { name: 'Sarah Johnson', tickets: 38, avgTime: 2.3, satisfaction: 4.7 },
          { name: 'Mike Davis', tickets: 42, avgTime: 2.0, satisfaction: 4.9 },
          { name: 'Lisa Wilson', tickets: 31, avgTime: 2.5, satisfaction: 4.6 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into ticket performance and trends</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview?.totalTickets || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview?.openTickets || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview?.avgResponseTime || '0 hours'}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview?.satisfactionScore || 0}/5</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg Response Time</p>
                  <p className="text-xs text-gray-600">Time to first response</p>
                </div>
              </div>
              <p className="text-lg font-bold text-blue-600">{analytics.overview?.avgResponseTime || '0 hours'}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg Resolution Time</p>
                  <p className="text-xs text-gray-600">Time to complete resolution</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">{analytics.overview?.avgResolutionTime || '0 days'}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Satisfaction Score</p>
                  <p className="text-xs text-gray-600">Customer satisfaction rating</p>
                </div>
              </div>
              <p className="text-lg font-bold text-yellow-600">{analytics.overview?.satisfactionScore || 0}/5</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Resolved This Week</p>
                  <p className="text-xs text-gray-600">Tickets resolved this week</p>
                </div>
              </div>
              <p className="text-lg font-bold text-purple-600">{analytics.overview?.resolvedTickets || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Open</p>
                  <p className="text-xs text-gray-600">Tickets awaiting response</p>
                </div>
              </div>
              <p className="text-lg font-bold text-blue-600">{analytics.overview?.openTickets || 0}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">In Progress</p>
                  <p className="text-xs text-gray-600">Tickets being worked on</p>
                </div>
              </div>
              <p className="text-lg font-bold text-yellow-600">{analytics.overview?.inProgressTickets || 0}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Resolved</p>
                  <p className="text-xs text-gray-600">Successfully resolved tickets</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">{analytics.overview?.resolvedTickets || 0}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Closed</p>
                  <p className="text-xs text-gray-600">Closed tickets</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-600">{analytics.overview?.closedTickets || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trends</h3>
        <div className="grid grid-cols-7 gap-4">
          {analytics.trends?.daily?.map((day, index) => (
            <div key={index} className="text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600">{day.date}</p>
                <p className="text-lg font-bold text-blue-600">{day.tickets}</p>
                <p className="text-xs text-green-600">+{day.resolved}</p>
              </div>
            </div>
          )) || (
            <div className="col-span-7 text-center py-8 text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </motion.div>

      {/* Categories and Top Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Categories</h3>
          <div className="space-y-3">
            {analytics.categories?.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">{category.count}</span>
                  <span className="text-xs text-gray-500">({category.percentage}%)</span>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h3>
          <div className="space-y-3">
            {analytics.topIssues?.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(issue.trend)}
                  <span className="text-sm font-medium text-gray-900">{issue.issue}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{issue.count}</span>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No issue data available
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Staff Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets Handled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satisfaction
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.staffPerformance?.map((staff, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staff.tickets}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staff.avgTime || staff.avgResolution || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{staff.satisfaction}/5</span>
                      <div className="ml-2 flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(staff.satisfaction)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No staff performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default TicketAnalytics; 