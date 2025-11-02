import React from 'react';
import { X, DollarSign, Building2, User, MessageSquare, Tag, FileText, Calendar, CheckCircle } from 'lucide-react';
import expenseService from '../../services/expense.service';

const ExpenseApprovalModal = ({ isOpen, onClose, expense, onConfirmApproval }) => {
  if (!isOpen || !expense) return null;

  const handleConfirm = async () => {
    try {
      await onConfirmApproval(expense._id);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Approve Expense</h2>
              <p className="text-xs text-gray-600">Review expense details before approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Expense Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
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

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-700">Branch</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {expense.branchId?.name || 'N/A'}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">Paid By</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {expense.paidBy?.firstName} {expense.paidBy?.lastName}
              </div>
            </div>
          </div>

          {/* Expense Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Expense Date</span>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-700">{expenseService.formatDate(expense.expenseDate)}</p>
            </div>

            {expense.purpose && (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Purpose</span>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700">{expense.purpose}</p>
                </div>
              </>
            )}

            {expense.notes && (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Notes</span>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700">{expense.notes}</p>
                </div>
              </>
            )}

            {expense.tags && expense.tags.length > 0 && (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {expense.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Confirmation Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Confirm Approval</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Are you sure you want to approve this expense? Once approved, it can be marked as paid.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseApprovalModal;
