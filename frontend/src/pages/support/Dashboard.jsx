import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  Star,
  Calendar,
  Activity,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticket.service';

const SupportDashboard = () => {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0
  });
  const [performance, setPerformance] = useState({
    avgResponseTime: 0,
    avgResolutionTime: 0,
    satisfactionScore: 0,
    ticketsThisWeek: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ticket stats
      const statsResponse = await ticketService.getTicketStats();
      if (statsResponse.success) {
        setStats({
          totalTickets: statsResponse.data.totalTickets || 0,
          openTickets: statsResponse.data.openTickets || 0,
          inProgressTickets: statsResponse.data.inProgressTickets || 0,
          resolvedTickets: statsResponse.data.resolvedTickets || 0,
          closedTickets: statsResponse.data.closedTickets || 0
        });
      }

      // Fetch analytics for performance metrics
      const analyticsResponse = await ticketService.getAnalytics('week');
      if (analyticsResponse.success) {
        const overview = analyticsResponse.data.overview || {};
        setPerformance({
          avgResponseTime: parseFloat(overview.avgResponseTime) || 0,
          avgResolutionTime: parseFloat(overview.avgResolutionTime) || 0,
          satisfactionScore: overview.satisfactionScore || 0,
          ticketsThisWeek: overview.totalTickets || 0
        });
      }

      // Fetch recent tickets
      const ticketsResponse = await ticketService.getTickets({ 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      
      if (ticketsResponse.success) {
        const formattedTickets = ticketsResponse.data.map(ticket => ({
          id: ticket._id,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: new Date(ticket.createdAt).toLocaleDateString(),
          description: ticket.description?.substring(0, 50) + '...'
        }));
        setRecentTickets(formattedTickets);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      
      // Fallback to default data
      setStats({
        totalTickets: 156,
        openTickets: 12,
        inProgressTickets: 8,
        resolvedTickets: 89,
        closedTickets: 47
      });
      
      setPerformance({
        avgResponseTime: 2.5,
        avgResolutionTime: 8.3,
        satisfactionScore: 4.6,
        ticketsThisWeek: 23
      });
      
      setRecentTickets([
        {
          id: 1,
          title: 'Login System Issue',
          status: 'open',
          priority: 'high',
          createdAt: '2024-01-15',
          description: 'Users unable to access login system...'
        },
        {
          id: 2,
          title: 'Payment Processing Error',
          status: 'in_progress',
          priority: 'medium',
          createdAt: '2024-01-14',
          description: 'Payment gateway not responding...'
        }
      ]);

      // Show error toast
      toast.error('Unable to fetch real-time dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadDashboardData();

    // Set up interval for periodic updates
    const intervalId = setInterval(loadDashboardData, 30000); // Update every 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [loadDashboardData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-gray-600">Real-time support overview</p>
        </div>
        <div className="text-sm text-gray-500 flex items-center space-x-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
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
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
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
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressTickets}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
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
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.closedTickets}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg Response Time</p>
                  <p className="text-xs text-gray-600">Time to first response</p>
                </div>
              </div>
              <p className="text-lg font-bold text-blue-600">{performance.avgResponseTime}h</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg Resolution Time</p>
                  <p className="text-xs text-gray-600">Time to complete resolution</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">{performance.avgResolutionTime}h</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Satisfaction Score</p>
                  <p className="text-xs text-gray-600">Customer satisfaction rating</p>
                </div>
              </div>
              <p className="text-lg font-bold text-yellow-600">{performance.satisfactionScore}/5</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">This Week</p>
                  <p className="text-xs text-gray-600">Tickets handled this week</p>
                </div>
              </div>
              <p className="text-lg font-bold text-purple-600">{performance.ticketsThisWeek}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            Quick Actions
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">View All Tickets</p>
                  <p className="text-xs text-gray-600">Browse all support tickets</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{stats.totalTickets} tickets</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">My Assigned</p>
                  <p className="text-xs text-gray-600">Tickets assigned to me</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{stats.inProgressTickets} active</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-600">View performance metrics</p>
                </div>
              </div>
              <div className="text-right">
                <button className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
                  View
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Settings</p>
                  <p className="text-xs text-gray-600">Configure preferences</p>
                </div>
              </div>
              <div className="text-right">
                <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Recent Tickets
        </h3>
        <div className="space-y-4">
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{ticket.title}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{ticket.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Created: {ticket.createdAt}</p>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                  View
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent tickets found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SupportDashboard;

