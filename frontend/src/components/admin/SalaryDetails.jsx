import React from 'react';
import { X, Calendar, DollarSign, Building2, User, FileText, TrendingUp, Calculator, CreditCard, Eye, Download } from 'lucide-react';
import salaryService from '../../services/salary.service';

const SalaryDetails = ({ isOpen, onClose, salary }) => {
  if (!isOpen || !salary) return null;

  const handleViewReceipt = () => {
    if (salary.receiptImage) {
      const imageUrl = `/uploads/salaries/${salary.receiptImage.fileName}`;
      window.open(imageUrl, '_blank');
    }
  };

  const handleDownloadReceipt = () => {
    if (salary.receiptImage) {
      const link = document.createElement('a');
      link.href = `/uploads/salaries/${salary.receiptImage.fileName}`;
      link.download = salary.receiptImage.originalName || 'salary_receipt.jpg';
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
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {salary.maintainerId?.user?.firstName} {salary.maintainerId?.user?.lastName}
              </h2>
              <p className="text-xs text-gray-600">
                {salary.month} {salary.year} Salary
              </p>
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
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salaryService.getStatusColor(salary.status)}`}>
                  {salary.status.replace('_', ' ')}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  {salary.month} {salary.year}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {salaryService.formatCurrency(salary.netSalary)}
                </div>
                <div className="text-xs text-gray-500">Net Salary</div>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calculator className="h-4 w-4 mr-2 text-blue-500" />
              Salary Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">
                  {salaryService.formatCurrency(salary.baseSalary || 0)}
                </div>
                <div className="text-xs text-gray-500">Base Salary</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-green-600">
                  +{salaryService.formatCurrency(salary.bonus || 0)}
                </div>
                <div className="text-xs text-gray-500">Bonus</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-600">
                  +{salaryService.formatCurrency(salary.overtime?.amount || 0)}
                </div>
                <div className="text-xs text-gray-500">Overtime</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-red-600">
                  -{salaryService.formatCurrency(salary.totalDeductions || 0)}
                </div>
                <div className="text-xs text-gray-500">Deductions</div>
              </div>
            </div>

            {/* Overtime Details */}
            {salary.overtime && (salary.overtime.hours > 0 || salary.overtime.amount > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600 mb-2">Overtime Details:</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Hours:</span>
                    <div className="font-medium">{salary.overtime.hours || 0}h</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate:</span>
                    <div className="font-medium">{salaryService.formatCurrency(salary.overtime.rate || 0)}/h</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <div className="font-medium text-blue-600">{salaryService.formatCurrency(salary.overtime.amount || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Deductions Breakdown */}
            {salary.deductions && salary.totalDeductions > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600 mb-2">Deductions Breakdown:</div>
                <div className="text-xs">
                  {salary.deductions.other > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Other Deductions:</span>
                      <span className="font-medium text-red-600">{salaryService.formatCurrency(salary.deductions.other)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Net Salary</span>
                <span className="text-lg font-bold text-green-600">{salaryService.formatCurrency(salary.netSalary)}</span>
              </div>
            </div>
          </div>

          {/* Key Information Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">Maintainer</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {salary.maintainerId?.user?.firstName} {salary.maintainerId?.user?.lastName}
              </div>
              <div className="text-xs text-gray-500">{salary.maintainerId?.user?.email}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-700">Branch</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {salary.branchId?.name || 'N/A'}
              </div>
              {salary.branchId?.address && (
                <div className="text-xs text-gray-500 truncate">
                  {salary.branchId.address.city}
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {salary.status !== 'pending' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Payment Information</span>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {salaryService.formatCurrency(salary.paidAmount || 0)}
                  </div>
                  <div className="text-xs text-gray-500">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {salaryService.formatCurrency((salary.netSalary || 0) - (salary.paidAmount || 0))}
                  </div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {salary.payments ? salary.payments.length : 0}
                  </div>
                  <div className="text-xs text-gray-500">Transactions</div>
                </div>
              </div>

              {/* Payment History */}
              {salary.payments && salary.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Payment History</h4>
                  <div className="space-y-3">
                    {salary.payments.map((payment, index) => (
                      <div key={index} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              {salaryService.formatCurrency(payment.amount)}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              ({payment.paymentMethod})
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(payment.paidAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <div className="font-medium">{salaryService.formatDate(payment.paymentDate)}</div>
                          </div>
                          {payment.transactionId && (
                            <div>
                              <span className="text-gray-500">Txn ID:</span>
                              <div className="font-mono text-xs bg-white px-2 py-1 rounded mt-1">{payment.transactionId}</div>
                            </div>
                          )}
                        </div>

                        {payment.notes && (
                          <div className="mt-2 text-xs">
                            <span className="text-gray-500">Notes:</span>
                            <div className="text-gray-700 mt-1">{payment.notes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Payment Details (for backward compatibility) */}
              {(!salary.payments || salary.payments.length === 0) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Payment Date:</span>
                    <div className="font-medium">{salary.paymentDate ? salaryService.formatDate(salary.paymentDate) : 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Method:</span>
                    <div className="font-medium capitalize">{salary.paymentMethod || 'N/A'}</div>
                  </div>
                  {salary.transactionId && (
                    <>
                      <div className="col-span-2">
                        <span className="text-gray-500">Transaction ID:</span>
                        <div className="font-mono text-xs bg-gray-50 px-2 py-1 rounded mt-1">{salary.transactionId}</div>
                      </div>
                    </>
                  )}
                  {salary.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Notes:</span>
                      <div className="text-sm mt-1">{salary.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Receipt */}
          {salary.receiptImage && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Payment Receipt</div>
                    <div className="text-xs text-gray-500">{salary.receiptImage.originalName}</div>
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
              Created {salaryService.formatDate(salary.createdAt)}
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

export default SalaryDetails;