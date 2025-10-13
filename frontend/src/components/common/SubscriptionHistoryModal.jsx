import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  X,
  Calendar,
  DollarSign,
  Clock,
  Bed,
  Building2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import subscriptionService from '../../services/subscription.service';

const SubscriptionHistoryModal = ({ isOpen, onClose, userId, userName }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadSubscriptionHistory();
    }
  }, [isOpen, userId]);

  const loadSubscriptionHistory = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getUserSubscriptionHistory(userId);

      if (response.success) {
        setHistory(response.data || []);
      } else {
        toast.error('Failed to load subscription history');
      }
    } catch (error) {
      console.error('Error loading subscription history:', error);
      toast.error('Failed to load subscription history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getBillingCycleBadge = (cycle) => {
    const cycleConfig = {
      monthly: 'bg-blue-100 text-blue-800',
      annual: 'bg-green-100 text-green-800',
      trial: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${cycleConfig[cycle] || cycleConfig.monthly}`}>
        {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
      </span>
    );
  };

  const getChangeType = (current, previous) => {
    if (!previous) return null;

    const currentBeds = current.totalBeds || 0;
    const previousBeds = previous.totalBeds || 0;

    if (current.subscriptionPlanId !== previous.subscriptionPlanId) {
      return { type: 'plan_change', icon: TrendingUp, color: 'text-purple-600' };
    } else if (currentBeds > previousBeds) {
      return { type: 'bed_upgrade', icon: ArrowUp, color: 'text-green-600' };
    } else if (currentBeds < previousBeds) {
      return { type: 'bed_downgrade', icon: ArrowDown, color: 'text-orange-600' };
    }

    return null;
  };

  const exportHistory = () => {
    const csvData = history.map(sub => ({
      'Plan Name': sub.subscriptionPlanId?.planName || 'N/A',
      'Status': sub.status,
      'Billing Cycle': sub.billingCycle,
      'Total Beds': sub.totalBeds,
      'Total Branches': sub.totalBranches,
      'Price': formatCurrency(sub.totalPrice),
      'Start Date': formatDate(sub.startDate),
      'End Date': formatDate(sub.endDate),
      'Trial End Date': formatDate(sub.trialEndDate),
      'Created': formatDate(sub.createdAt)
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription_history_${userName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Subscription history exported successfully');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <History className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Subscription History</h2>
                <p className="text-sm text-gray-600">
                  {userName ? `${userName}'s subscription timeline` : 'User subscription history'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {history.length > 0 && (
                <button
                  onClick={exportHistory}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-80px)]">
            {/* History List */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-center">
                  <div>
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription History</h3>
                    <p className="text-gray-600">This user hasn't had any subscriptions yet.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {history.map((subscription, index) => {
                    const changeInfo = getChangeType(subscription, history[index + 1]);
                    const isActive = subscription.status === 'active' || subscription.status === 'trial';

                    return (
                      <motion.div
                        key={subscription._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedSubscription?._id === subscription._id
                            ? 'border-blue-300 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedSubscription(subscription)}
                      >
                        {/* Timeline connector */}
                        {index < history.length - 1 && (
                          <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-200"></div>
                        )}

                        <div className="flex items-start space-x-3">
                          {/* Status indicator */}
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {subscription.subscriptionPlanId?.planName || 'Unknown Plan'}
                              </h4>
                              {changeInfo && (
                                <div className={`flex items-center space-x-1 ${changeInfo.color}`}>
                                  <changeInfo.icon className="h-3 w-3" />
                                  <span className="text-xs font-medium">
                                    {changeInfo.type.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusBadge(subscription.status)}
                              {getBillingCycleBadge(subscription.billingCycle)}
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center space-x-4">
                                <span>Created: {formatDate(subscription.createdAt)}</span>
                                {subscription.upgradeDate && (
                                  <span>Upgraded: {formatDate(subscription.upgradeDate)}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Bed className="h-3 w-3 mr-1" />
                                  {subscription.totalBeds} beds
                                </span>
                                <span className="flex items-center">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {subscription.totalBranches} branches
                                </span>
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(subscription.totalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details Panel */}
            <div className="w-1/2 overflow-y-auto">
              {selectedSubscription ? (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {selectedSubscription.subscriptionPlanId?.planName || 'Unknown Plan'}
                    </h3>
                    <div className="flex items-center space-x-2 mb-4">
                      {getStatusBadge(selectedSubscription.status)}
                      {getBillingCycleBadge(selectedSubscription.billingCycle)}
                    </div>
                  </div>

                  {/* Key Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Bed className="h-4 w-4 mr-2" />
                        Total Beds
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedSubscription.totalBeds}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Building2 className="h-4 w-4 mr-2" />
                        Total Branches
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedSubscription.totalBranches}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Total Price
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(selectedSubscription.totalPrice)}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Duration
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {selectedSubscription.durationDays} days
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-900">Important Dates</h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-800">Start Date</span>
                        <span className="text-sm font-medium text-blue-900">
                          {formatDate(selectedSubscription.startDate)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-800">End Date</span>
                        <span className="text-sm font-medium text-green-900">
                          {formatDate(selectedSubscription.endDate)}
                        </span>
                      </div>

                      {selectedSubscription.trialEndDate && (
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm text-purple-800">Trial End Date</span>
                          <span className="text-sm font-medium text-purple-900">
                            {formatDate(selectedSubscription.trialEndDate)}
                          </span>
                        </div>
                      )}

                      {selectedSubscription.upgradeDate && (
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                          <span className="text-sm text-orange-800">Last Upgrade</span>
                          <span className="text-sm font-medium text-orange-900">
                            {formatDate(selectedSubscription.upgradeDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {selectedSubscription.notes && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedSubscription.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Usage Info */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Usage Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {selectedSubscription.currentBedUsage || 0}
                        </div>
                        <div className="text-xs text-gray-600">Beds Used</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {selectedSubscription.currentBranchUsage || 1}
                        </div>
                        <div className="text-xs text-gray-600">Branches Used</div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Status Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Auto Renew</span>
                        <span className={`text-sm font-medium ${selectedSubscription.autoRenew ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      {selectedSubscription.cancelledAt && (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Cancelled</span>
                          </div>
                          <div className="text-xs text-red-700">
                            Cancelled on {formatDate(selectedSubscription.cancelledAt)}
                            {selectedSubscription.cancellationReason && (
                              <span> - {selectedSubscription.cancellationReason}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Subscription</h3>
                    <p className="text-gray-600">Click on a subscription from the list to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionHistoryModal;
