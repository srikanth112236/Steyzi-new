import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  Receipt,
  ExternalLink,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import razorpayPaymentService from '../../services/razorpayPayment.service';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchPaymentHistory();
  }, [currentPage]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await razorpayPaymentService.getPaymentHistory(currentPage, itemsPerPage);

      if (response.success) {
        setPayments(response.data.payments || []);
        setTotalPages(response.data.pagination.totalPages || 1);
      } else {
        toast.error('Failed to fetch payment history');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
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
      'created': { color: 'bg-blue-100 text-blue-800', text: 'Created' },
      'paid': { color: 'bg-green-100 text-green-800', text: 'Paid' },
      'failed': { color: 'bg-red-100 text-red-800', text: 'Failed' },
      'refunded': { color: 'bg-orange-100 text-orange-800', text: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.created;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      'card': { color: 'bg-purple-100 text-purple-800', text: 'Card' },
      'netbanking': { color: 'bg-blue-100 text-blue-800', text: 'Net Banking' },
      'wallet': { color: 'bg-green-100 text-green-800', text: 'Wallet' },
      'upi': { color: 'bg-orange-100 text-orange-800', text: 'UPI' },
      'emi': { color: 'bg-pink-100 text-pink-800', text: 'EMI' }
    };

    const config = methodConfig[method] || { color: 'bg-gray-100 text-gray-800', text: method || 'Unknown' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.subscriptionPlanId?.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.razorpayOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewPayment = async (payment) => {
    try {
      const response = await razorpayPaymentService.getPaymentStatus(payment.razorpayPaymentId);
      if (response.success) {
        setSelectedPayment({ ...payment, details: response.data });
      } else {
        toast.error('Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to fetch payment details');
    }
  };

  const exportPaymentHistory = () => {
    const csvData = filteredPayments.map(payment => ({
      'Order ID': payment.razorpayOrderId,
      'Payment ID': payment.razorpayPaymentId,
      'Amount': payment.amount,
      'Status': payment.status,
      'Payment Method': payment.paymentMethod,
      'Plan': payment.planDetails?.planName || 'N/A',
      'Beds': payment.planDetails?.bedCount || 'N/A',
      'Branches': payment.planDetails?.branchCount || 'N/A',
      'Date': formatDate(payment.createdAt)
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Payment history exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
          <p className="text-gray-600">View all your subscription payments</p>
        </div>
        <button
          onClick={exportPaymentHistory}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={fetchPaymentHistory}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
            <p className="text-gray-600">Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <motion.tr
                    key={payment._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.planDetails?.planName || 'Subscription Payment'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.razorpayOrderId}
                        </div>
                        <div className="text-xs text-gray-400">
                          {payment.billingCycle} • {payment.planDetails?.bedCount} beds • {payment.planDetails?.branchCount} branches
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getPaymentMethodBadge(payment.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Amount:</span>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(selectedPayment.amount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <p>{getStatusBadge(selectedPayment.status)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <p>{getPaymentMethodBadge(selectedPayment.paymentMethod)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Date:</span>
                      <p className="text-sm">{formatDate(selectedPayment.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono text-gray-900">{selectedPayment.razorpayOrderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-mono text-gray-900">{selectedPayment.razorpayPaymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing Cycle:</span>
                      <span className="capitalize">{selectedPayment.billingCycle}</span>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                {selectedPayment.planDetails && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Plan Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium">{selectedPayment.planDetails.planName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Beds:</span>
                        <span>{selectedPayment.planDetails.bedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Branches:</span>
                        <span>{selectedPayment.planDetails.branchCount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Subscription Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subscription ID:</span>
                      <span className="font-mono text-gray-900">{selectedPayment.subscriptionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{formatDate(selectedPayment.subscriptionStartDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span>{formatDate(selectedPayment.subscriptionEndDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
