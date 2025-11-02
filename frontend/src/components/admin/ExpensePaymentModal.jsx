import React, { useState } from 'react';
import { X, DollarSign, Building2, User, MessageSquare, Tag, FileText, Calendar, CreditCard } from 'lucide-react';
import expenseService from '../../services/expense.service';
import toast from 'react-hot-toast';

const ExpensePaymentModal = ({ isOpen, onClose, expense, onConfirmPayment }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      // Validation
      if (!paymentData.paymentMethod) {
        toast.error('Payment method is required');
        return;
      }

      if (!paymentData.paymentDate) {
        toast.error('Payment date is required');
        return;
      }

      // For non-cash payments, transaction ID might be required
      if (paymentData.paymentMethod !== 'cash' && !paymentData.transactionId.trim()) {
        toast.error('Transaction ID is required for this payment method');
        return;
      }

      await onConfirmPayment(expense._id, paymentData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentData({
      paymentMethod: 'cash',
      transactionId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mark Expense as Paid</h2>
              <p className="text-xs text-gray-600">Confirm payment details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Expense Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{expense.expenseName}</h3>
                <p className="text-sm text-gray-600">{expense.expenseType.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {expenseService.formatCurrency(expense.amount)}
                </div>
                <div className="text-xs text-gray-500">{expense.paidType}</div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="cash">Cash</option>
                <option value="online_transfer">Online Transfer</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Transaction ID */}
            {paymentData.paymentMethod !== 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => handleInputChange('transactionId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter transaction/reference ID"
                  required
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional payment notes..."
                rows={2}
              />
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Confirm Payment</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Are you sure you want to mark this expense as paid? This action will update the expense status to "paid".
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensePaymentModal;
