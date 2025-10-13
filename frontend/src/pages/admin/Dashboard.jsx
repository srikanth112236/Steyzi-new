import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Home, 
  Activity, 
  RefreshCw, 
  Shield,
  Calendar,
  AlertCircle,
  UserMinus,
  MessageSquare,
  Bell,
  ArrowUpRight,
  UserPlus,
  Building2,
  TrendingDown,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Initialize state with default values to prevent undefined errors
  const [dashboardData, setDashboardData] = useState({
    residents: {
      total: 0,
      active: 0,
      pending: 0,
      movedOut: 0,
      thisMonth: 0,
      byStatus: { active: 0, pending: 0, inactive: 0 },
      byGender: { male: 0, female: 0 }
    },
    financial: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingPayments: 0,
      overduePayments: 0,
      revenueGrowth: 0,
      averageRent: 0
    },
    occupancy: {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      occupancyRate: 0,
      occupancyTrend: 0
    },
    tickets: {
      open: 0,
      urgent: 0,
      resolved: 0,
      total: 0,
      resolutionRate: 0
    },
    pg: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      totalBranches: 0
    }
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [pendingTasks, setPendingTasks] = useState({
    payments: { pending: 0, overdue: 0, total: 0, totalAmount: 0 },
    tickets: { open: 0, urgent: 0, total: 0 },
    residents: { pending: 0, onboarding: 0, offboarding: 0 },
    details: {
      pendingPayments: [],
      overduePayments: [],
      openTickets: [],
      pendingResidents: []
    }
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user, navigate, selectedBranch, refreshKey]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // If no branch is selected yet, wait (global selector will set it)
      if (!selectedBranch) {
        setLoading(false);
        return;
      }

      // Extract branch ID from selectedBranch object
      const branchId = selectedBranch._id || selectedBranch;
      
      if (!branchId) {
        setLoading(false);
        toast.error('Invalid branch selected. Please select a valid branch.');
        return;
      }

      // Fetch all dashboard data in parallel
      const [overviewResponse, activitiesResponse, tasksResponse] = await Promise.all([
        api.get(`/dashboard/overview?branchId=${branchId}`),
        api.get(`/dashboard/activities?branchId=${branchId}`),
        api.get(`/dashboard/pending-tasks?branchId=${branchId}`)
      ]);

      if (overviewResponse.data.success) {
        setDashboardData(overviewResponse.data.data);
      }

      if (activitiesResponse.data.success) {
        setRecentActivities(activitiesResponse.data.data);
        const tickets = activitiesResponse.data.data.filter(activity => activity.type === 'ticket');
        setRecentTickets(tickets.slice(0, 6));
      }

      if (tasksResponse.data.success) {
        setPendingTasks(tasksResponse.data.data);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      if (error.response?.status === 404) {
        toast.error('Dashboard API endpoints not found. Please check server configuration.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid branch ID. Please select a valid branch.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/admin/login');
      } else {
        toast.error('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Dashboard refreshed');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">PG Admin</h1>
                  <p className="text-xs text-gray-500">Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-300/20 to-cyan-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-200/20 to-blue-300/20 blur-2xl" />
        
        {(!selectedBranch || loading) ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <>
            {/* Dashboard Title Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Monitor, manage, and optimize your PG operations with ease.</p>
            </div>

            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue - Featured Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-emerald-100">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {Math.abs(dashboardData.financial.revenueGrowth || 0)}%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(dashboardData.financial.totalRevenue)}
                  </h3>
                  <p className="text-emerald-100 font-medium">Total Revenue</p>
                  <p className="text-emerald-200 text-sm mt-1">Increased from last month</p>
                </div>
              </motion.div>

                {/* Monthly Revenue */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +12%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrency(dashboardData.financial.monthlyRevenue)}
                  </h3>
                  <p className="text-gray-600 font-medium">This Month</p>
                  <p className="text-gray-500 text-sm mt-1">Increased from last month</p>
                </motion.div>

                {/* Pending Payments */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +5%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {dashboardData.financial.pendingPayments}
                  </h3>
                  <p className="text-gray-600 font-medium">Pending</p>
                  <p className="text-gray-500 text-sm mt-1">Awaiting payment</p>
                </motion.div>

                {/* Overdue Payments */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-rose-600 text-sm">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        -2%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {dashboardData.financial.overduePayments}
                  </h3>
                  <p className="text-gray-600 font-medium">Overdue</p>
                  <p className="text-gray-500 text-sm mt-1">Requires attention</p>
                </motion.div>
              </div>
          

            {/* Analytics and Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Analytics Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">This Month</span>
                  </div>
                </div>
                
                {/* Simple Bar Chart */}
                <div className="space-y-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-8 text-sm text-gray-600 font-medium">{day}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.random() * 80 + 20}%` }}
                        ></div>
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {Math.floor(Math.random() * 50 + 20)}%
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Reminders Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Reminders</h3>
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Payment Collection</h4>
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Collect rent from residents - 02:00 PM - 04:00 PM</p>
                    <button className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium">
                      Start Collection
                    </button>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Maintenance Check</h4>
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Tomorrow</span>
                    </div>
                    <p className="text-sm text-gray-600">Room 101 - AC repair scheduled</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Residents Overview Cards */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-cyan-600" />
                Residents Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Residents */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +{dashboardData.residents.thisMonth}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.total}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Total Residents</p>
                </motion.div>

                {/* Active Residents */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.active}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                </motion.div>

                {/* Pending Residents */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.pending}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                </motion.div>

                {/* Moved Out */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl">
                      <UserMinus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.movedOut}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Moved Out</p>
                </motion.div>
              </div>
            </div>

            {/* Tickets Overview Cards - Horizontal Row */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                Tickets Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.total}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                </motion.div>

                {/* Open Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.open}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Open</p>
                </motion.div>

                {/* Urgent Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.urgent}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                </motion.div>

                {/* Resolved Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.resolved}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                </motion.div>
              </div>
            </div>

            {/* Team Collaboration and Project Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Team Collaboration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Team Collaboration</h3>
                  <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                    + Add Member
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: "Alexandra Deff", task: "Payment Processing", status: "Completed", color: "emerald" },
                    { name: "Edwin Adenike", task: "Resident Onboarding", status: "In Progress", color: "blue" },
                    { name: "Isaac Oluwatemilorun", task: "Maintenance Check", status: "Pending", color: "amber" },
                    { name: "David Oshodi", task: "Room Allocation", status: "In Progress", color: "blue" }
                  ].map((member, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.task}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                        member.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Project Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">PG Progress</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">41%</div>
                    <div className="text-sm text-gray-600">Operations Complete</div>
                  </div>
                </div>
                
                {/* Progress Circle */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - 0.41)}`}
                      className="text-emerald-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">41%</div>
                      <div className="text-xs text-gray-600">Complete</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Completed (41%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">In Progress (35%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pending (24%)</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Tickets - Modern Card List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                  Recent Tickets
                </h2>
                <Link
                  to="/admin/tickets"
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentTickets.length > 0 ? (
                  recentTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                        {ticket.title}
                      </h3>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(ticket.timestamp)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent tickets found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activities - Compact List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Activities
                </h2>
                <Link
                  to="/admin/reports"
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {recentActivities.length > 0 ? (
                    recentActivities.slice(0, 5).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg mr-4 ${
                          activity.type === 'payment' ? 'bg-green-100' :
                          activity.type === 'resident' ? 'bg-blue-100' :
                          'bg-orange-100'
                        }`}>
                          {activity.type === 'payment' && <CreditCard className="h-4 w-4 text-green-600" />}
                          {activity.type === 'resident' && <Users className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'ticket' && <MessageSquare className="h-4 w-4 text-orange-600" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {activity.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activities found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Removed Time Tracker and Activity Monitor per requirements */}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Occupancy Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {dashboardData.occupancy.occupancyTrend > 0 ? '+' : ''}{dashboardData.occupancy.occupancyTrend}
                    </div>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboardData.occupancy.occupancyRate}%
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Occupancy Rate</p>
                <p className="text-xs text-gray-500">
                  {dashboardData.occupancy.occupiedRooms}/{dashboardData.occupancy.totalRooms} rooms
                </p>
              </motion.div>

              {/* Average Rent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(dashboardData.financial.averageRent)}
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Average Rent</p>
                <p className="text-xs text-gray-500">
                  Per resident per month
                </p>
              </motion.div>

              {/* Ticket Resolution Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboardData.tickets.resolutionRate}%
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Resolution Rate</p>
                <p className="text-xs text-gray-500">
                  Tickets resolved successfully
                </p>
              </motion.div>

              {/* Room Availability */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => navigate('/admin/room-availability')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-purple-600 text-sm">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      View
                    </div>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboardData.occupancy.availableRooms}
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Available Rooms</p>
                <p className="text-xs text-gray-500">
                  Click to view detailed availability
                </p>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 