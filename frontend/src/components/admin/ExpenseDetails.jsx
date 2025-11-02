import React from 'react';
import { X, Calendar, DollarSign, Building2, User, MessageSquare, Tag, FileText, Eye, Download } from 'lucide-react';
import expenseService from '../../services/expense.service';

const ExpenseDetails = ({ isOpen, onClose, expense }) => {
  if (!isOpen || !expense) return null;

  const handleViewReceipt = () => {
    if (expense.receiptImage) {
      const imageUrl = `/uploads/expenses/${expense.receiptImage.fileName}`;
      window.open(imageUrl, '_blank');
    }
  };

  const handleDownloadReceipt = () => {
    if (expense.receiptImage) {
      const link = document.createElement('a');
      link.href = `/uploads/expenses/${expense.receiptImage.fileName}`;
      link.download = expense.receiptImage.originalName || 'receipt.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{expense.expenseName}</h2>
              <p className="text-xs text-gray-600">Expense Details</p>
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
          {/* Status and Amount Card */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expenseService.getStatusColor(expense.status)}`}>
                  {expense.status}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expenseService.getExpenseTypeColor(expense.expenseType)} ml-2`}>
                  {expense.expenseType.replace('_', ' ')}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  {expenseService.formatDate(expense.expenseDate)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {expenseService.formatCurrency(expense.amount)}
                </div>
                <div className="text-xs text-gray-500 capitalize">{expense.paidType}</div>
              </div>
            </div>
          </div>

          {/* Key Information Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-700">Branch</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {expense.branchId?.name || 'N/A'}
              </div>
              {expense.branchId?.address && (
                <div className="text-xs text-gray-500 truncate">
                  {expense.branchId.address.city}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">Paid By</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {expense.paidBy?.firstName} {expense.paidBy?.lastName}
              </div>
              <div className="text-xs text-gray-500">{expense.paidBy?.email}</div>
            </div>
          </div>

          {/* Approval & Payment Info */}
          {(expense.approvedBy || expense.status === 'paid') && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                {expense.approvedBy && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Approved By</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.approvedBy?.firstName} {expense.approvedBy?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {expense.approvedAt ? expenseService.formatDate(expense.approvedAt) : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {expense.status === 'paid' && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Payment Date</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {expense.paidAt ? expenseService.formatDate(expense.paidAt) : 'N/A'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expense Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Purpose */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Purpose</span>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-700">{expense.purpose || 'No purpose specified'}</p>
              </div>
            </div>

            {/* Notes */}
            {expense.notes && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Notes</span>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700">{expense.notes}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {expense.tags && expense.tags.length > 0 && (
              <div>
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
              </div>
            )}

            {/* Transaction ID */}
            {expense.transactionId && (
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Transaction ID</span>
                </div>
                <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded">
                  {expense.transactionId}
                </div>
              </div>
            )}
          </div>

          {/* Receipt */}
          {expense.receiptImage && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Payment Receipt</div>
                    <div className="text-xs text-gray-500">{expense.receiptImage.originalName}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleViewReceipt}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={handleDownloadReceipt}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Created {expenseService.formatDate(expense.createdAt)}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetails;