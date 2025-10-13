import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Star,
  Award,
  Copy,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  RefreshCw,
  Eye,
  MoreVertical,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import subscriptionService from '../../../services/subscription.service';
import SubscriptionForm from './SubscriptionForm';
import SubscriptionCard from './SubscriptionCard';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, subscription: null });
  const [statistics, setStatistics] = useState(null);
  const [authError, setAuthError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    billingCycle: 'all',
    isPopular: false
  });

  useEffect(() => {
    // Check if user is authenticated and has superadmin role
    if (!user) {
      setAuthError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    if (user?.role !== 'superadmin') {
      setAuthError('Access denied. Superadmin privileges required.');
      setLoading(false);
      return;
    }

    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, subscriptions]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [subsResponse, statsResponse] = await Promise.all([
        subscriptionService.getAllSubscriptions(),
        subscriptionService.getStatistics()
      ]);

      if (subsResponse.success) {
        setSubscriptions(subsResponse.data);
      }

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 403) {
        setAuthError('Access denied. Please check your permissions or contact support.');
      } else {
        toast.error('Failed to load subscriptions');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...subscriptions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.planName.toLowerCase().includes(searchLower) ||
        sub.planDescription?.toLowerCase().includes(searchLower)
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

    // Popular filter
    if (filters.isPopular) {
      filtered = filtered.filter(sub => sub.isPopular);
    }

    setFilteredSubscriptions(filtered);
  };

  const handleCreate = () => {
    setEditingSubscription(null);
    setShowForm(true);
  };

  const handleEdit = (subscription) => {
    setEditingSubscription(subscription);
    setShowForm(true);
  };

  const handleDelete = (subscription) => {
    setDeleteModal({ show: true, subscription });
  };

  const confirmDelete = async () => {
    try {
      const result = await subscriptionService.deleteSubscription(deleteModal.subscription._id);
      
      if (result.success) {
        toast.success(result.message);
        loadData();
        setDeleteModal({ show: false, subscription: null });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const handleDuplicate = async (subscription) => {
    try {
      const result = await subscriptionService.duplicateSubscription(subscription._id);
      
      if (result.success) {
        toast.success('Subscription plan duplicated successfully');
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error duplicating subscription:', error);
      toast.error('Failed to duplicate subscription');
    }
  };

  const handleTogglePopular = async (subscription) => {
    try {
      const result = await subscriptionService.togglePopular(subscription._id);
      
      if (result.success) {
        toast.success(result.message);
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error toggling popularity:', error);
      toast.error('Failed to update popularity');
    }
  };

  const handleToggleRecommended = async (subscription) => {
    try {
      const result = await subscriptionService.toggleRecommended(subscription._id);
      
      if (result.success) {
        toast.success(result.message);
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error toggling recommended:', error);
      toast.error('Failed to update recommended status');
    }
  };

  const handleFormSuccess = () => {
    loadData();
    setShowForm(false);
    setEditingSubscription(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <p className="text-sm text-gray-500">
            Current user role: {user?.role || 'Not logged in'}<br />
            Current user email: {user?.email || 'N/A'}
          </p>
        </div>
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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage subscription plans and pricing
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              <span>Create Plan</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.totalPlans}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{statistics.activePlans}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Subscribers</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{statistics.totalSubscribers}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Plans</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{statistics.monthlyPlans}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>

          {/* Billing Cycle Filter */}
          <select
            value={filters.billingCycle}
            onChange={(e) => setFilters({ ...filters, billingCycle: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">All Billing Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>

          {/* Popular Filter */}
          <label className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
            <input
              type="checkbox"
              checked={filters.isPopular}
              onChange={(e) => setFilters({ ...filters, isPopular: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-700">Popular Only</span>
          </label>
        </div>

        {/* Active Filters Count */}
        {(filters.search || filters.status !== 'all' || filters.billingCycle !== 'all' || filters.isPopular) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredSubscriptions.length} of {subscriptions.length} plans
            </p>
            <button
              onClick={() => setFilters({ search: '', status: 'all', billingCycle: 'all', isPopular: false })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Subscription Plans Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscription Plans Found</h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.status !== 'all' || filters.billingCycle !== 'all' || filters.isPopular
              ? 'Try adjusting your filters'
              : 'Create your first subscription plan to get started'}
          </p>
          {!filters.search && filters.status === 'all' && filters.billingCycle === 'all' && !filters.isPopular && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              <span>Create First Plan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSubscriptions.map((subscription, index) => (
              <SubscriptionCard
                key={subscription._id}
                subscription={subscription}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onTogglePopular={handleTogglePopular}
                onToggleRecommended={handleToggleRecommended}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Subscription Form Modal */}
      {showForm && (
        <SubscriptionForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingSubscription(null);
          }}
          subscription={editingSubscription}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, subscription: null })}
        onConfirm={confirmDelete}
        title="Delete Subscription Plan"
        message={`Are you sure you want to delete "${deleteModal.subscription?.planName}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default SubscriptionManagement;
