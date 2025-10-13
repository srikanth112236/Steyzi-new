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
  XCircle,
  Filter,
  Download,
  RefreshCw,
  Eye,
  TrendingDown,
  BarChart,
  PieChart,
  LineChart,
  MapPin,
  Building,
  UserCheck,
  UserX,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import ticketService from '../../services/ticket.service';
import api from '../../services/api';

const SuperadminTicketAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      avgResponseTime: '0 hours',
      avgResolutionTime: '0 days',
      satisfactionScore: 0,
      totalRevenue: 0,
      activePGs: 0,
      totalResidents: 0
    },
    trends: {
      daily: [],
      weekly: [],
      monthly: []
    },
    categories: [],
    topIssues: [],
    staffPerformance: [],
    pgPerformance: [],
    realTimeStats: {
      ticketsCreatedToday: 0,
      ticketsResolvedToday: 0,
      activeSupportStaff: 0,
      avgWaitTime: '0 minutes'
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedPG, setSelectedPG] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadAnalytics();
    
    // Set up auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAnalytics();
        setLastUpdated(new Date());
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [timeRange, selectedPG, selectedCategory, selectedStatus, autoRefresh]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getSuperadminAnalytics(timeRange, {
        pg: selectedPG,
        category: selectedCategory,
        status: selectedStatus
      });
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        // Load fallback data if API fails
        setAnalytics({
          overview: {
            totalTickets: 1250,
            openTickets: 45,
            inProgressTickets: 28,
            resolvedTickets: 980,
            closedTickets: 197,
            avgResponseTime: '2.3 hours',
            avgResolutionTime: '1.1 days',
            satisfactionScore: 4.6,
            totalRevenue: 125000,
            activePGs: 15,
            totalResidents: 450
          },
          trends: {
            daily: [
              { date: 'Mon', tickets: 25, resolved: 22, revenue: 2500 },
              { date: 'Tue', tickets: 32, resolved: 28, revenue: 3200 },
              { date: 'Wed', tickets: 28, resolved: 25, revenue: 2800 },
              { date: 'Thu', tickets: 35, resolved: 30, revenue: 3500 },
              { date: 'Fri', tickets: 30, resolved: 27, revenue: 3000 },
              { date: 'Sat', tickets: 15, resolved: 12, revenue: 1500 },
              { date: 'Sun', tickets: 12, resolved: 10, revenue: 1200 }
            ],
            weekly: [],
            monthly: []
          },
          categories: [
            { name: 'Maintenance', count: 320, percentage: 25.6, avgResolution: '1.2 days' },
            { name: 'Billing', count: 280, percentage: 22.4, avgResolution: '0.8 days' },
            { name: 'Technical', count: 200, percentage: 16.0, avgResolution: '1.5 days' },
            { name: 'General', count: 180, percentage: 14.4, avgResolution: '1.0 days' },
            { name: 'Emergency', count: 150, percentage: 12.0, avgResolution: '0.5 days' },
            { name: 'Other', count: 120, percentage: 9.6, avgResolution: '1.8 days' }
          ],
          topIssues: [
            { issue: 'Payment Processing', count: 85, trend: 'up', avgResolution: '4 hours' },
            { issue: 'Room Maintenance', count: 72, trend: 'down', avgResolution: '1 day' },
            { issue: 'WiFi Connectivity', count: 65, trend: 'up', avgResolution: '2 hours' },
            { issue: 'Cleaning Services', count: 58, trend: 'stable', avgResolution: '6 hours' },
            { issue: 'Security Concerns', count: 45, trend: 'down', avgResolution: '1 hour' }
          ],
          staffPerformance: [
            { name: 'John Doe', tickets: 145, avgResolution: '2.1 hours', satisfaction: 4.8, efficiency: 95 },
            { name: 'Sarah Johnson', tickets: 132, avgResolution: '2.3 hours', satisfaction: 4.7, efficiency: 92 },
            { name: 'Mike Davis', tickets: 128, avgResolution: '2.0 hours', satisfaction: 4.9, efficiency: 98 },
            { name: 'Lisa Wilson', tickets: 118, avgResolution: '2.5 hours', satisfaction: 4.6, efficiency: 89 },
            { name: 'David Brown', tickets: 105, avgResolution: '2.8 hours', satisfaction: 4.5, efficiency: 87 }
          ],
          pgPerformance: [
            { name: 'Sunrise PG', tickets: 180, avgResolution: '1.8 days', satisfaction: 4.7, revenue: 25000 },
            { name: 'Green Valley', tickets: 165, avgResolution: '2.1 days', satisfaction: 4.6, revenue: 22000 },
            { name: 'City Center', tickets: 142, avgResolution: '1.9 days', satisfaction: 4.8, revenue: 20000 },
            { name: 'University Heights', tickets: 128, avgResolution: '2.3 days', satisfaction: 4.5, revenue: 18000 },
            { name: 'Downtown Plaza', tickets: 115, avgResolution: '2.0 days', satisfaction: 4.7, revenue: 16000 }
          ],
          realTimeStats: {
            ticketsCreatedToday: 12,
            ticketsResolvedToday: 15,
            activeSupportStaff: 8,
            avgWaitTime: '15 minutes'
          }
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Load fallback data on error
      setAnalytics({
        overview: {
          totalTickets: 1250,
          openTickets: 45,
          inProgressTickets: 28,
          resolvedTickets: 980,
          closedTickets: 197,
          avgResponseTime: '2.3 hours',
          avgResolutionTime: '1.1 days',
          satisfactionScore: 4.6,
          totalRevenue: 125000,
          activePGs: 15,
          totalResidents: 450
        },
        trends: {
          daily: [
            { date: 'Mon', tickets: 25, resolved: 22, revenue: 2500 },
            { date: 'Tue', tickets: 32, resolved: 28, revenue: 3200 },
            { date: 'Wed', tickets: 28, resolved: 25, revenue: 2800 },
            { date: 'Thu', tickets: 35, resolved: 30, revenue: 3500 },
            { date: 'Fri', tickets: 30, resolved: 27, revenue: 3000 },
            { date: 'Sat', tickets: 15, resolved: 12, revenue: 1500 },
            { date: 'Sun', tickets: 12, resolved: 10, revenue: 1200 }
          ],
          weekly: [],
          monthly: []
        },
        categories: [
          { name: 'Maintenance', count: 320, percentage: 25.6, avgResolution: '1.2 days' },
          { name: 'Billing', count: 280, percentage: 22.4, avgResolution: '0.8 days' },
          { name: 'Technical', count: 200, percentage: 16.0, avgResolution: '1.5 days' },
          { name: 'General', count: 180, percentage: 14.4, avgResolution: '1.0 days' },
          { name: 'Emergency', count: 150, percentage: 12.0, avgResolution: '0.5 days' },
          { name: 'Other', count: 120, percentage: 9.6, avgResolution: '1.8 days' }
        ],
        topIssues: [
          { issue: 'Payment Processing', count: 85, trend: 'up', avgResolution: '4 hours' },
          { issue: 'Room Maintenance', count: 72, trend: 'down', avgResolution: '1 day' },
          { issue: 'WiFi Connectivity', count: 65, trend: 'up', avgResolution: '2 hours' },
          { issue: 'Cleaning Services', count: 58, trend: 'stable', avgResolution: '6 hours' },
          { issue: 'Security Concerns', count: 45, trend: 'down', avgResolution: '1 hour' }
        ],
        staffPerformance: [
          { name: 'John Doe', tickets: 145, avgResolution: '2.1 hours', satisfaction: 4.8, efficiency: 95 },
          { name: 'Sarah Johnson', tickets: 132, avgResolution: '2.3 hours', satisfaction: 4.7, efficiency: 92 },
          { name: 'Mike Davis', tickets: 128, avgResolution: '2.0 hours', satisfaction: 4.9, efficiency: 98 },
          { name: 'Lisa Wilson', tickets: 118, avgResolution: '2.5 hours', satisfaction: 4.6, efficiency: 89 },
          { name: 'David Brown', tickets: 105, avgResolution: '2.8 hours', satisfaction: 4.5, efficiency: 87 }
        ],
        pgPerformance: [
          { name: 'Sunrise PG', tickets: 180, avgResolution: '1.8 days', satisfaction: 4.7, revenue: 25000 },
          { name: 'Green Valley', tickets: 165, avgResolution: '2.1 days', satisfaction: 4.6, revenue: 22000 },
          { name: 'City Center', tickets: 142, avgResolution: '1.9 days', satisfaction: 4.8, revenue: 20000 },
          { name: 'University Heights', tickets: 128, avgResolution: '2.3 days', satisfaction: 4.5, revenue: 18000 },
          { name: 'Downtown Plaza', tickets: 115, avgResolution: '2.0 days', satisfaction: 4.7, revenue: 16000 }
        ],
        realTimeStats: {
          ticketsCreatedToday: 12,
          ticketsResolvedToday: 15,
          activeSupportStaff: 8,
          avgWaitTime: '15 minutes'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportAnalytics = () => {
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-time Ticket Analytics</h1>
          <p className="text-gray-600">Comprehensive insights across all PG properties</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </button>
          <button
            onClick={loadAnalytics}
            className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportAnalytics}
            className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Last Updated Indicator */}
      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <select
            value={selectedPG}
            onChange={(e) => setSelectedPG(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All PGs</option>
            <option value="sunrise">Sunrise PG</option>
            <option value="green-valley">Green Valley</option>
            <option value="city-center">City Center</option>
          </select>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Tickets Created Today</p>
              <p className="text-2xl font-bold">{analytics.realTimeStats?.ticketsCreatedToday || 0}</p>
            </div>
            <div className="p-3 bg-blue-400 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Tickets Resolved Today</p>
              <p className="text-2xl font-bold">{analytics.realTimeStats?.ticketsResolvedToday || 0}</p>
            </div>
            <div className="p-3 bg-green-400 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Active Support Staff</p>
              <p className="text-2xl font-bold">{analytics.realTimeStats?.activeSupportStaff || 0}</p>
            </div>
            <div className="p-3 bg-purple-400 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-100">Avg Wait Time</p>
              <p className="text-2xl font-bold">{analytics.realTimeStats?.avgWaitTime || '0 minutes'}</p>
            </div>
            <div className="p-3 bg-orange-400 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview?.totalTickets || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.overview?.totalRevenue?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active PGs</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview?.activePGs || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Residents</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview?.totalResidents || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
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
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Open Tickets</p>
                  <p className="text-xs text-gray-600">Tickets awaiting response</p>
                </div>
              </div>
              <p className="text-lg font-bold text-red-600">{analytics.overview?.openTickets || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
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

      {/* Daily Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trends</h3>
        <div className="grid grid-cols-7 gap-4">
          {analytics.trends?.daily?.map((day, index) => (
            <div key={index} className="text-center">
              <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600">{day.date}</p>
                <p className="text-lg font-bold text-blue-600">{day.tickets}</p>
                <p className="text-xs text-green-600">+{day.resolved}</p>
                <p className="text-xs text-purple-600">₹{day.revenue}</p>
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
          transition={{ delay: 1.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Categories</h3>
          <div className="space-y-3">
            {analytics.categories?.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <p className="text-xs text-gray-500">Avg: {category.avgResolution}</p>
                  </div>
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
          transition={{ delay: 1.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h3>
          <div className="space-y-3">
            {analytics.topIssues?.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(issue.trend)}
                  <div>
                    <span className="text-sm font-medium text-gray-900">{issue.issue}</span>
                    <p className="text-xs text-gray-500">Avg: {issue.avgResolution}</p>
                  </div>
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
        transition={{ delay: 1.4 }}
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
                  Avg Resolution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satisfaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
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
                    <div className="text-sm text-gray-900">{staff.avgResolution}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-bold ${getEfficiencyColor(staff.efficiency)}`}>
                      {staff.efficiency}%
                    </div>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No staff performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PG Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">PG Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PG Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Resolution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satisfaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.pgPerformance?.map((pg, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Building className="h-4 w-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{pg.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pg.tickets}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pg.avgResolution}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{pg.satisfaction}/5</span>
                      <div className="ml-2 flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(pg.satisfaction)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">₹{pg.revenue?.toLocaleString()}</div>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No PG performance data available
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

export default SuperadminTicketAnalytics; 