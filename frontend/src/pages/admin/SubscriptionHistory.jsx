import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCalendar, FiCreditCard, FiPackage, FiCheck, FiX, FiClock } from 'react-icons/fi';

/**
 * Subscription History Page
 * Shows user's subscription history and payment records
 */
const SubscriptionHistoryPage = () => {
  const { user, subscription: currentSubscription } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'history', 'payments'

  useEffect(() => {
    fetchSubscriptionHistory();
    fetchPaymentHistory();
  }, []);

  const fetchSubscriptionHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/subscription-history');
      if (response.data.success) {
        setSubscriptionHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      toast.error('Failed to load subscription history');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      // Fetch from user's payment history
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user.paymentHistory) {
        setPaymentHistory(response.data.user.paymentHistory || []);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', icon: FiCheck, text: 'Active' },
      trial: { color: 'bg-blue-100 text-blue-800', icon: FiClock, text: 'Trial' },
      expired: { color: 'bg-red-100 text-red-800', icon: FiX, text: 'Expired' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: FiX, text: 'Cancelled' },
      upgraded: { color: 'bg-purple-100 text-purple-800', icon: FiCheck, text: 'Upgraded' },
      downgraded: { color: 'bg-orange-100 text-orange-800', icon: FiCheck, text: 'Downgraded' }
    };

    const { color, icon: Icon, text } = config[status] || config.expired;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const config = {
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    };

    const { color, text } = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderCurrentSubscription = () => {
    if (!currentSubscription) {
      return (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
          <p className="text-gray-600 mb-4">You don't have an active subscription yet.</p>
          <button
            onClick={() => window.location.href = '/admin/subscription-selection'}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Plans
          </button>
        </div>
      );
    }

    const daysRemaining = calculateDaysRemaining(
      currentSubscription.billingCycle === 'trial' ? currentSubscription.trialEndDate : currentSubscription.endDate
    );

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Current Subscription</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Plan Name</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {currentSubscription.plan?.planName || 'Unknown Plan'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1">{getStatusBadge(currentSubscription.status)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Billing Cycle</label>
              <p className="mt-1 text-gray-900 capitalize">{currentSubscription.billingCycle || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="mt-1 text-gray-900">{formatDate(currentSubscription.startDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">End Date</label>
              <p className="mt-1 text-gray-900">
                {formatDate(currentSubscription.billingCycle === 'trial' ? currentSubscription.trialEndDate : currentSubscription.endDate)}
              </p>
            </div>
            {daysRemaining !== null && (
              <div>
                <label className="text-sm font-medium text-gray-500">Days Remaining</label>
                <p className={`mt-1 text-lg font-semibold ${daysRemaining < 7 ? 'text-red-600' : 'text-green-600'}`}>
                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Total Beds</label>
              <p className="mt-1 text-gray-900">{currentSubscription.totalBeds || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Branches</label>
              <p className="mt-1 text-gray-900">{currentSubscription.totalBranches || 1}</p>
            </div>
          </div>

          {currentSubscription.customPricing && (
            <div className="mt-6 border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Pricing Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Monthly Price</label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatCurrency(currentSubscription.customPricing.totalMonthlyPrice || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Annual Price</label>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatCurrency(currentSubscription.customPricing.totalAnnualPrice || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Base Price</label>
                  <p className="mt-1 text-gray-900">
                    {formatCurrency(currentSubscription.customPricing.basePrice || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Top-up Cost</label>
                  <p className="mt-1 text-gray-900">
                    {formatCurrency(currentSubscription.customPricing.topUpCost || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSubscriptionHistory = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      );
    }

    if (subscriptionHistory.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No History Yet</h3>
          <p className="text-gray-600">Your subscription history will appear here.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beds/Branches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptionHistory.map((sub, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {sub.subscriptionPlanId?.planName || 'Unknown Plan'}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{sub.billingCycle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(sub.startDate)}</div>
                    <div className="text-sm text-gray-500">to {formatDate(sub.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sub.totalBeds} / {sub.totalBranches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(sub.totalPrice || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sub.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPaymentHistory = () => {
    if (paymentHistory.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiCreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Yet</h3>
          <p className="text-gray-600">Your payment history will appear here.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentHistory.slice().reverse().map((payment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.description || 'Subscription Payment'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.planDetails?.planName} - {payment.planDetails?.bedCount} beds
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500 font-mono">
                      {payment.razorpayPaymentId?.substring(0, 20)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentStatusBadge(payment.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-gray-600">View and manage your subscriptions and payment history</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('current')}
              className={`${
                activeTab === 'current'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Current Subscription
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Subscription History
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Payment History
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'current' && renderCurrentSubscription()}
          {activeTab === 'history' && renderSubscriptionHistory()}
          {activeTab === 'payments' && renderPaymentHistory()}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionHistoryPage;
