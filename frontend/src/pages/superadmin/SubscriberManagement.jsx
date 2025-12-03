import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Building2,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  History,
  BarChart3,
  Mail,
  Phone,
  Bed,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import subscriptionService from '../../services/subscription.service';
import SubscriptionHistoryModal from '../../components/common/SubscriptionHistoryModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const SubscriberManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'active', // Default to active subscriptions only
    billingCycle: 'all',
    subscriptionPlanId: 'all',
    userRole: 'all',
    startDate: '',
    endDate: ''
  });

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSubscriberHistory, setSelectedSubscriberHistory] = useState(null);
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [showAllSubscriptions]);

  useEffect(() => {
    applyFilters();
  }, [filters, subscribers]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const statusFilter = showAllSubscriptions ? 'all' : 'active';
      const [subsResponse, statsResponse] = await Promise.all([
        subscriptionService.getAllSubscribers({ status: statusFilter }),
        subscriptionService.getSubscriptionManagementStats()
      ]);

      if (subsResponse.success) {
        setSubscribers(subsResponse.data);
        // Update the filter state to match what was actually loaded
        setFilters(prev => ({
          ...prev,
          status: statusFilter
        }));
      }

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading subscriber data:', error);
      toast.error('Failed to load subscriber data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...subscribers];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.userId?.firstName?.toLowerCase().includes(searchLower) ||
        sub.userId?.lastName?.toLowerCase().includes(searchLower) ||
        sub.userId?.email?.toLowerCase().includes(searchLower) ||
        sub.subscriptionPlanId?.planName?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(sub => sub.status === filters.status);
    }

    // Billing cycle filter
    if (filters.billingCycle !== 'all') {
      filtered = filtered.filter(sub => sub.billingCycle === filters.billingCycle);
    }

    // Subscription plan filter
    if (filters.subscriptionPlanId !== 'all') {
      filtered = filtered.filter(sub => sub.subscriptionPlanId?._id === filters.subscriptionPlanId);
    }

    // User role filter
    if (filters.userRole !== 'all') {
      filtered = filtered.filter(sub => sub.userId?.role === filters.userRole);
    }

    // Date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(sub => new Date(sub.startDate) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(sub => new Date(sub.endDate) <= endDate);
    }

    setFilteredSubscribers(filtered);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      expired: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
      upgraded: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp },
      downgraded: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: TrendingUp }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-0.5 px-1 py-0.5 text-[10px] font-bold rounded border ${config.color}`}>
        <Icon className="h-2 w-2" />
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const getBillingCycleBadge = (cycle) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${
        cycle === 'monthly'
          ? 'bg-blue-100 text-blue-800 border-blue-200'
          : 'bg-purple-100 text-purple-800 border-purple-200'
      }`}>
        {cycle === 'monthly' ? 'Monthly' : 'Annual'}
      </span>
    );
  };

  const handleViewHistory = async (subscriber) => {
    try {
      const historyResponse = await subscriptionService.getUserSubscriptionHistory(subscriber.userId._id);
      setSelectedSubscriberHistory({
        subscriber: subscriber.userId,
        history: historyResponse.data
      });
      setShowHistoryModal(true);
    } catch (error) {
      toast.error('Failed to load subscription history');
    }
  };

  const handleViewDetails = (subscriber) => {
    // For now, just show history. Can be expanded to show current plan details
    handleViewHistory(subscriber);
  };

  const getDaysRemainingBadge = (daysRemaining, isExpiringSoon) => {
    if (daysRemaining === null || daysRemaining === undefined) return null;

    let color = 'bg-green-100 text-green-800 border-green-200';
    if (isExpiringSoon) {
      color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (daysRemaining < 0) {
      color = 'bg-red-100 text-red-800 border-red-200';
    }

    return (
      <span className={`inline-flex items-center space-x-0.5 px-1 py-0.5 text-[10px] font-bold rounded border ${color}`}>
        <Clock className="h-2 w-2" />
        <span>{daysRemaining < 0 ? 'Expired' : `${daysRemaining}d left`}</span>
      </span>
    );
  };

  const getUniqueSubscriptionPlans = () => {
    const plans = subscribers
      .map(sub => sub.subscriptionPlanId)
      .filter(plan => plan)
      .filter((plan, index, self) =>
        index === self.findIndex(p => p._id === plan._id)
      );
    return plans;
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
      {/* Modern Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Subscriber Management</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage all subscription subscribers and their history
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <button
              onClick={() => setShowAllSubscriptions(!showAllSubscriptions)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm ${
                showAllSubscriptions
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">
                {showAllSubscriptions ? 'All Subscriptions' : 'Active Only'}
              </span>
            </button>

            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Subscription Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalActive || 0}</div>
                  <div className="text-sm text-gray-600">Active Subscribers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalRevenue || 0)}</div>
                  <div className="text-sm text-gray-600">Current Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{statistics.trialActiveCount || 0}</div>
                  <div className="text-sm text-gray-600">Trial Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{statistics.expiringSoonCount || 0}</div>
                  <div className="text-sm text-gray-600">Expiring Soon</div>
                </div>
              </div>
            </div>

            {/* Detailed Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Active Subscribers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.totalActive || 0}</p>
                  <div className="flex items-center space-x-3 mt-2 text-xs">
                    <span className="text-blue-600">Monthly: {statistics.monthlyCount || 0}</span>
                    <span className="text-purple-600">Annual: {statistics.annualCount || 0}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Trial Users</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.trialActiveCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {statistics.trialExpiredCount || 0} expired this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Expiring Soon (30 days)</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{statistics.expiringSoonCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {statistics.expiredCount || 0} expired this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-600">Current Revenue</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(statistics.monthlyRevenue || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                      Monthly: {formatCurrency(statistics.monthlyRevenue || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                    Annual: {formatCurrency(statistics.annualRevenue || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="upgraded">Upgraded</SelectItem>
                    <SelectItem value="downgraded">Downgraded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Billing Cycle Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                <Select value={filters.billingCycle} onValueChange={(value) => setFilters({ ...filters, billingCycle: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Billing Cycles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Billing Cycles</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subscription Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <Select value={filters.subscriptionPlanId} onValueChange={(value) => setFilters({ ...filters, subscriptionPlanId: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                {getUniqueSubscriptionPlans().map(plan => (
                      <SelectItem key={plan._id} value={plan._id}>{plan.planName}</SelectItem>
                ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                <Select value={filters.userRole} onValueChange={(value) => setFilters({ ...filters, userRole: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date From</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date To</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    search: '',
                    status: 'all',
                    billingCycle: 'all',
                    subscriptionPlanId: 'all',
                    userRole: 'all',
                    startDate: '',
                    endDate: ''
                  })}
                  className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscribers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Subscribers ({filteredSubscribers.length})
              {showAllSubscriptions && (
                <span className="text-xs text-blue-600 ml-2">(including cancelled)</span>
              )}
            </h2>
            {(filters.search || filters.status !== (showAllSubscriptions ? 'all' : 'active') || filters.billingCycle !== 'all' ||
              filters.subscriptionPlanId !== 'all' || filters.userRole !== 'all' ||
              filters.startDate || filters.endDate) && (
              <p className="text-sm text-gray-600">
                Filtered from {subscribers.length} {showAllSubscriptions ? 'total' : 'active'} subscribers
              </p>
            )}
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3 p-3">
          {paginatedSubscribers.map((subscriber, index) => (
            <motion.div
              key={subscriber._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
            >
              {/* Subscriber Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {subscriber.userId?.firstName} {subscriber.userId?.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-48">{subscriber.userId?.email}</p>
                  </div>
                </div>
                {getStatusBadge(subscriber.status)}
              </div>

              {/* Plan & Billing Info */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Plan</p>
                  <p className="text-sm font-medium text-gray-900">{subscriber.subscriptionPlanId?.planName}</p>
                  <p className="text-xs text-gray-600">
                    {subscriber.billingCycle === 'trial'
                      ? 'Trial Period'
                      : `${formatCurrency(subscriber.totalPrice)}/${subscriber.billingCycle}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Usage</p>
                  <p className="text-xs text-gray-900">
                    {subscriber.currentBedUsage || 0}/{subscriber.totalBeds} beds
                  </p>
                  <p className="text-xs text-gray-600">
                    {subscriber.currentBranchUsage || 1}/{subscriber.totalBranches} br
                  </p>
                </div>
              </div>

              {/* Dates & Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {subscriber.billingCycle === 'trial'
                    ? `${formatDate(subscriber.startDate)} - ${formatDate(subscriber.trialEndDate)}`
                    : `${formatDate(subscriber.startDate)} - ${formatDate(subscriber.endDate)}`}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleViewDetails(subscriber)}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleViewHistory(subscriber)}
                    className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                    title="History"
                  >
                    <History className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Table View - Ultra Compact Design */}
        <div className="hidden md:block overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Subscriber
                    </th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Plan & Status
                    </th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Dates
                    </th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Usage
                    </th>
                    <th className="px-2 py-1.5 text-center text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  <AnimatePresence>
                    {paginatedSubscribers.map((subscriber, index) => (
                      <motion.tr
                        key={subscriber._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="hover:bg-blue-50/50 transition-colors duration-100 border-b border-gray-100"
                      >
                        {/* Subscriber Info - Ultra Compact */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <div className="flex-shrink-0 w-6 h-6">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center shadow-sm">
                                <User className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-semibold text-gray-900 truncate leading-tight">
                                {subscriber.userId?.firstName} {subscriber.userId?.lastName}
                              </div>
                              <div className="text-[10px] text-gray-500 truncate flex items-center leading-tight">
                                <Mail className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
                                <span className="truncate max-w-[140px]">{subscriber.userId?.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Status - Ultra Compact */}
                        <td className="px-2 py-1.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 flex-wrap gap-0.5">
                              <span className="text-[11px] font-semibold text-gray-900 truncate max-w-[100px]">
                                {subscriber.subscriptionPlanId?.planName || 'N/A'}
                              </span>
                              {getStatusBadge(subscriber.status)}
                            </div>
                            <div className="text-[10px] text-gray-600 font-medium">
                              {subscriber.billingCycle === 'trial' 
                                ? '₹0/trial' 
                                : `${formatCurrency(subscriber.totalPrice)}/${subscriber.billingCycle === 'monthly' ? 'mo' : 'yr'}`}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                              <span className="flex items-center space-x-0.5">
                                <Bed className="h-2.5 w-2.5" />
                                <span>{subscriber.totalBeds}</span>
                              </span>
                              {subscriber.totalBranches > 1 && (
                                <span className="flex items-center space-x-0.5">
                                  <Building2 className="h-2.5 w-2.5" />
                                  <span>{subscriber.totalBranches}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Dates - Ultra Compact */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="text-[11px] leading-tight">
                            <div className="text-gray-900 font-semibold">{formatDate(subscriber.startDate)}</div>
                            <div className="text-gray-500">
                              {subscriber.billingCycle === 'trial' 
                                ? `→ ${formatDate(subscriber.trialEndDate)}` 
                                : `→ ${formatDate(subscriber.endDate)}`}
                            </div>
                          </div>
                        </td>

                        {/* Usage - Ultra Compact */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="text-[11px] space-y-0.5">
                            <div className="flex items-center space-x-0.5 text-gray-700">
                              <Bed className="h-2.5 w-2.5 text-gray-400" />
                              <span className="font-medium">{subscriber.currentBedUsage || 0}/{subscriber.totalBeds}</span>
                            </div>
                            <div className="flex items-center space-x-0.5 text-gray-700">
                              <Building2 className="h-2.5 w-2.5 text-gray-400" />
                              <span className="font-medium">{subscriber.currentBranchUsage || 1}/{subscriber.totalBranches}</span>
                            </div>
                            <div className="mt-0.5">
                              {getDaysRemainingBadge(subscriber.daysRemaining, subscriber.isExpiringSoon)}
                            </div>
                          </div>
                        </td>

                        {/* Actions - Ultra Compact */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-0.5">
                            <button
                              onClick={() => handleViewDetails(subscriber)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all duration-100"
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleViewHistory(subscriber)}
                              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all duration-100"
                              title="History"
                            >
                              <History className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredSubscribers.length)}</span> of{' '}
                      <span className="font-medium">{filteredSubscribers.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium transition-colors ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredSubscribers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscribers Found</h3>
            <p className="text-gray-600">
              {subscribers.length === 0
                ? 'No subscribers have been added yet.'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="block md:hidden bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <span className="text-xs text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Subscription History Modal */}
        <SubscriptionHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedSubscriberHistory(null);
          }}
          userId={selectedSubscriberHistory?.subscriber?._id}
          userName={selectedSubscriberHistory ? `${selectedSubscriberHistory.subscriber.firstName} ${selectedSubscriberHistory.subscriber.lastName}` : ''}
        />
      </div>
    </div>
  );
};
export default SubscriberManagement;