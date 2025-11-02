import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, FileText, DollarSign, Calendar, CreditCard, Receipt, CheckCircle } from 'lucide-react';
import salaryService from '../../services/salary.service';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const SalaryPaymentModal = ({ isOpen, onClose, salary, onPaymentProcessed }) => {
  const [loading, setLoading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const hasUserChangedPaymentAmount = useRef(false);

  const [salaryData, setSalaryData] = useState({
    baseSalary: salary?.baseSalary || 0,
    bonus: salary?.bonus || 0,
    overtime: {
      hours: salary?.overtime?.hours || 0,
      rate: salary?.overtime?.rate || 0,
      amount: salary?.overtime?.amount || 0
    },
    deductions: {
      other: salary?.deductions?.other || 0
    }
  });

  const [paymentData, setPaymentData] = useState(() => {
    // Calculate remaining balance for default payment amount
    const grossSalary = (salary?.baseSalary || 0) + (salary?.bonus || 0) + (salary?.overtime?.amount || 0);
    const totalDeductions = salary?.deductions?.other || 0;
    const netSalary = grossSalary - totalDeductions;
    const remainingBalance = netSalary - (salary?.paidAmount || 0);

    return {
      paymentAmount: remainingBalance > 0 ? remainingBalance : netSalary,
      paymentMethod: 'cash',
      transactionId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    };
  });

  const handleInputChange = (field, value) => {
    if (field === 'paymentAmount') {
      hasUserChangedPaymentAmount.current = true;
    }
    setPaymentData(prev => ({
      ...prev,
      [field]: field === 'paymentAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSalaryChange = (field, value) => {
    if (field.startsWith('overtime.') || field.startsWith('deductions.')) {
      const [parent, child] = field.split('.');
      setSalaryData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseFloat(value) || 0
        }
      }));
    } else {
      setSalaryData(prev => ({
        ...prev,
        [field]: parseFloat(value) || 0
      }));
    }
  };

  // Calculate totals
  const grossSalary = (salaryData.baseSalary || 0) + (salaryData.bonus || 0) + (salaryData.overtime.amount || 0);
  const totalDeductions = salaryData.deductions.other || 0;
  const netSalary = grossSalary - totalDeductions;

  // Update payment amount when salary adjustments change (but not when user manually changes payment amount)
  useEffect(() => {
    if (!hasUserChangedPaymentAmount.current) {
      const remainingBalance = netSalary - (salary?.paidAmount || 0);
      setPaymentData(prev => ({
        ...prev,
        paymentAmount: remainingBalance > 0 ? remainingBalance : netSalary
      }));
    }
  }, [salaryData, netSalary, salary?.paidAmount]);

  // Reset the manual change flag when modal opens
  useEffect(() => {
    if (isOpen) {
      hasUserChangedPaymentAmount.current = false;
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      setReceiptImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validation
      const paymentAmount = parseFloat(paymentData.paymentAmount || 0);
      if (paymentAmount <= 0) {
        toast.error('Payment amount must be greater than 0');
        return;
      }

      // Calculate remaining amount to pay
      const remainingAmount = netSalary - (salary.paidAmount || 0);
      if (paymentAmount > remainingAmount) {
        toast.error(`Payment amount cannot exceed remaining balance of ${salaryService.formatCurrency(remainingAmount)}`);
        return;
      }

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

      // Include salary adjustments and payment amount
      const paymentDataWithSalary = {
        ...paymentData,
        paymentAmount: paymentAmount,
        salaryAdjustments: salaryData
      };

      await onPaymentProcessed(paymentDataWithSalary, receiptImage);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    // Calculate current remaining balance
    const grossSalary = (salaryData.baseSalary || 0) + (salaryData.bonus || 0) + (salaryData.overtime.amount || 0);
    const totalDeductions = salaryData.deductions.other || 0;
    const currentNetSalary = grossSalary - totalDeductions;
    const remainingBalance = currentNetSalary - (salary?.paidAmount || 0);

    setPaymentData({
      paymentAmount: remainingBalance > 0 ? remainingBalance : currentNetSalary,
      paymentMethod: 'cash',
      transactionId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setReceiptImage(null);
    setReceiptPreview(null);
    hasUserChangedPaymentAmount.current = false;
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !salary) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Process Salary Payment
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Salary Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {salary.maintainerId?.firstName} {salary.maintainerId?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {salary.month} {salary.year}
              </p>
              {salary.paidAmount > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Already paid: {salaryService.formatCurrency(salary.paidAmount)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                {salaryService.formatCurrency(netSalary)}
              </p>
              <p className="text-xs text-gray-500">Total Salary</p>
              <p className="text-xs text-blue-600 mt-1">
                Remaining: {salaryService.formatCurrency(netSalary - (salary.paidAmount || 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Salary Adjustments */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Salary Adjustments</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Base Salary */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Base Salary
              </label>
              <input
                type="number"
                value={salaryData.baseSalary}
                onChange={(e) => handleSalaryChange('baseSalary', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            {/* Bonus */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Bonus
              </label>
              <input
                type="number"
                value={salaryData.bonus}
                onChange={(e) => handleSalaryChange('bonus', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            {/* Overtime Hours */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                OT Hours
              </label>
              <input
                type="number"
                value={salaryData.overtime.hours}
                onChange={(e) => handleSalaryChange('overtime.hours', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            {/* Overtime Rate */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                OT Rate
              </label>
              <input
                type="number"
                value={salaryData.overtime.rate}
                onChange={(e) => handleSalaryChange('overtime.rate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            {/* Overtime Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                OT Amount
              </label>
              <input
                type="number"
                value={salaryData.overtime.amount}
                onChange={(e) => handleSalaryChange('overtime.amount', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            {/* Deductions */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Deductions
              </label>
              <input
                type="number"
                value={salaryData.deductions.other}
                onChange={(e) => handleSalaryChange('deductions.other', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-600">Gross:</span>
                <span className="font-medium ml-1">{salaryService.formatCurrency(grossSalary)}</span>
              </div>
              <div>
                <span className="text-gray-600">Deductions:</span>
                <span className="font-medium ml-1">{salaryService.formatCurrency(totalDeductions)}</span>
              </div>
              <div>
                <span className="text-gray-600">Net:</span>
                <span className="font-medium ml-1 text-green-600">{salaryService.formatCurrency(netSalary)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <div className="space-y-2">
              <input
                type="number"
                value={paymentData.paymentAmount}
                onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter payment amount"
                min="0.01"
                step="0.01"
                required
              />
              <div className="text-xs text-gray-500">
                Remaining balance: {salaryService.formatCurrency(netSalary - (salary.paidAmount || 0))}
                {salary.paidAmount > 0 && (
                  <span className="ml-2 text-orange-600">
                    (Already paid: {salaryService.formatCurrency(salary.paidAmount)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <Select
              value={paymentData.paymentMethod}
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Payment Method" />
              </SelectTrigger>
              <SelectContent>
                {salaryService.getPaymentMethodsList().map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Image (Optional)
            </label>
            <div className="space-y-3">
              {/* File Input */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition duration-200">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {receiptImage && (
                  <span className="text-sm text-gray-600">{receiptImage.name}</span>
                )}
              </div>

              {/* Preview */}
              {receiptPreview && (
                <div className="relative">
                  <img
                    src={receiptPreview}
                    alt="Receipt Preview"
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptImage(null);
                      setReceiptPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryPaymentModal;
