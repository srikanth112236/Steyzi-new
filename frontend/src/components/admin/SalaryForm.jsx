import React, { useState, useEffect } from 'react';
import { X, Upload, Calculator, DollarSign, Users, Calendar, Building2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import salaryService from '../../services/salary.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const SalaryForm = ({ isOpen, onClose, onSubmit, editingSalary, maintainers }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const [formData, setFormData] = useState({
    maintainerId: '',
    branchId: '',
    month: new Date().toLocaleDateString('en-US', { month: 'long' }),
    year: new Date().getFullYear(),
    baseSalary: '',
    allowances: {
      hra: '',
      conveyance: '',
      medical: '',
      other: ''
    },
    deductions: {
      pf: '',
      professional_tax: '',
      other: ''
    },
    bonus: '',
    overtime: {
      hours: '',
      rate: '',
      amount: ''
    },
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });

  const [calculatedValues, setCalculatedValues] = useState({
    totalAllowances: 0,
    totalDeductions: 0,
    grossSalary: 0,
    netSalary: 0
  });

  const [receiptImage, setReceiptImage] = useState(null);
  const [branches, setBranches] = useState([]);

  // Load salary data for editing
  useEffect(() => {
    if (editingSalary && isOpen) {
      setFormData({
        maintainerId: editingSalary.maintainerId?._id || editingSalary.maintainerId || '',
        branchId: editingSalary.branchId?._id || editingSalary.branchId || '',
        month: editingSalary.month || '',
        year: editingSalary.year || '',
        baseSalary: editingSalary.baseSalary || '',
        deductions: {
          other: editingSalary.deductions?.other || '0'
        },
        bonus: editingSalary.bonus || '',
        overtime: {
          hours: editingSalary.overtime?.hours || '',
          rate: editingSalary.overtime?.rate || '',
          amount: editingSalary.overtime?.amount || ''
        },
        paymentMethod: editingSalary.paymentMethod || 'cash',
        transactionId: editingSalary.transactionId || '',
        notes: editingSalary.notes || ''
      });

      if (editingSalary.receiptImage) {
        setReceiptPreview(`/uploads/salaries/${editingSalary.receiptImage.fileName}`);
      }

      // Load branches for the selected maintainer
      loadBranchesForMaintainer(editingSalary.maintainerId?._id || editingSalary.maintainerId);
    } else if (!editingSalary && isOpen) {
      // Reset form for new salary
      setFormData({
        maintainerId: '',
        branchId: '',
        month: new Date().toLocaleDateString('en-US', { month: 'long' }),
        year: new Date().getFullYear(),
        baseSalary: '',
        deductions: {
          other: '0'
        },
        bonus: '',
        overtime: {
          hours: '',
          rate: '',
          amount: ''
        },
        paymentMethod: 'cash',
        transactionId: '',
        notes: ''
      });
      setReceiptImage(null);
      setReceiptPreview(null);
      setBranches([]);
    }
  }, [editingSalary, isOpen]);

  // Calculate values whenever form data changes
  useEffect(() => {
    calculateSalaryValues();
  }, [formData]);

  const calculateSalaryValues = () => {
    const baseSalary = parseFloat(formData.baseSalary) || 0;
    const bonus = parseFloat(formData.bonus) || 0;

    // Calculate deductions (only other deductions)
    const totalDeductions = parseFloat(formData.deductions.other) || 0;

    // Calculate overtime
    const overtimeHours = parseFloat(formData.overtime.hours) || 0;
    const overtimeRate = parseFloat(formData.overtime.rate) || 0;
    const overtimeAmount = overtimeHours * overtimeRate;

    // Calculate gross and net salary (base + bonus + overtime - deductions)
    const grossSalary = baseSalary + bonus + overtimeAmount;
    const netSalary = grossSalary - totalDeductions;

    setCalculatedValues({
      totalAllowances: 0,
      totalDeductions,
      grossSalary,
      netSalary
    });

    // Auto-update overtime amount
    if (overtimeAmount !== parseFloat(formData.overtime.amount || 0)) {
      setFormData(prev => ({
        ...prev,
        overtime: {
          ...prev.overtime,
          amount: overtimeAmount.toString()
        }
      }));
    }
  };

  const loadBranchesForMaintainer = async (maintainerId) => {
    if (!maintainerId) return;

    try {
      const maintainer = maintainers.find(m => m._id === maintainerId);
      if (maintainer && maintainer.branches) {
        setBranches(maintainer.branches);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Load branches when maintainer changes
    if (field === 'maintainerId') {
      loadBranchesForMaintainer(value);
      // Reset branch selection
      setFormData(prev => ({ ...prev, branchId: '' }));
    }
  };

  const handleReceiptUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
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

    // Validation
    if (!formData.maintainerId) {
      toast.error('Maintainer selection is required');
      return;
    }

    if (!formData.branchId) {
      toast.error('Branch selection is required');
      return;
    }

    if (!formData.month) {
      toast.error('Month is required');
      return;
    }

    if (!formData.year) {
      toast.error('Year is required');
      return;
    }

    if (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0) {
      toast.error('Valid base salary is required');
      return;
    }

    try {
      setLoading(true);

      // Check for duplicate salary records (only for new records, not edits)
      // Allow only ONE salary record per maintainer - update monthly instead of creating multiple
      if (!editingSalary) {
        const existingSalaries = await salaryService.getAllSalaries({
          maintainerId: formData.maintainerId,
          limit: 1 // Just check if any salary exists for this maintainer
        });

        if (existingSalaries.success && existingSalaries.data.salaries.length > 0) {
          const maintainerName = maintainers.find(m => m._id === formData.maintainerId)?.name ||
                                `${maintainers.find(m => m._id === formData.maintainerId)?.firstName} ${maintainers.find(m => m._id === formData.maintainerId)?.lastName}`.trim() ||
                                'this maintainer';
          toast.error(`Salary record already exists for ${maintainerName}. Please edit the existing record to update salary details and process payments.`);
          return;
        }
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        baseSalary: parseFloat(formData.baseSalary),
        bonus: parseFloat(formData.bonus || 0),
        deductions: {
          other: parseFloat(formData.deductions.other || 0)
        },
        overtime: {
          hours: parseFloat(formData.overtime.hours || 0),
          rate: parseFloat(formData.overtime.rate || 0),
          amount: parseFloat(formData.overtime.amount || 0)
        }
      };

      // Remove empty fields
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === '' || submissionData[key] === null || submissionData[key] === undefined) {
          delete submissionData[key];
        }
      });

      // Remove empty nested objects
      ['allowances', 'deductions', 'overtime'].forEach(field => {
        if (submissionData[field]) {
          const allZero = Object.values(submissionData[field]).every(val => val === 0);
          if (allZero) {
            delete submissionData[field];
          }
        }
      });

      await onSubmit(submissionData, receiptImage);

    } catch (error) {
      console.error('Error submitting salary:', error);
      toast.error(error.message || 'Failed to save salary');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      maintainerId: '',
      branchId: '',
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      year: new Date().getFullYear(),
      baseSalary: '',
      deductions: {
        other: '0'
      },
      bonus: '',
      overtime: {
        hours: '',
        rate: '',
        amount: ''
      },
      paymentMethod: 'cash',
      transactionId: '',
      notes: ''
    });
    setReceiptImage(null);
    setReceiptPreview(null);
    setCalculatedValues({
      totalAllowances: 0,
      totalDeductions: 0,
      grossSalary: 0,
      netSalary: 0
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSalary ? 'Edit Salary' : 'Add Salary Record'}
              </h2>
              <p className="text-sm text-gray-600">
                {editingSalary ? 'Update salary details' : 'Create a new salary record for maintainer'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintainer *
                </label>
                <Select
                  value={formData.maintainerId}
                  onValueChange={(value) => handleInputChange('maintainerId', value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Maintainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(maintainers) && maintainers.map((maintainer) => (
                      <SelectItem key={maintainer._id} value={maintainer._id}>
                        {maintainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch *
                </label>
                <Select
                  value={formData.branchId}
                  onValueChange={(value) => handleInputChange('branchId', value)}
                  disabled={!formData.maintainerId}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(branches) && branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <Select
                  value={formData.month}
                  onValueChange={(value) => handleInputChange('month', value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {salaryService.getMonthsList().map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => handleInputChange('year', value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Salary Components */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Earnings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Salary (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => handleInputChange('bonus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Overtime</h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
                      <input
                        type="number"
                        value={formData.overtime.hours}
                        onChange={(e) => handleInputChange('overtime.hours', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.5"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Rate/Hour</label>
                      <input
                        type="number"
                        value={formData.overtime.rate}
                        onChange={(e) => handleInputChange('overtime.rate', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                      <input
                        type="number"
                        value={formData.overtime.amount}
                        readOnly
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50"
                        placeholder="Auto calculated"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-red-600" />
                Deductions
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.deductions.other}
                    onChange={(e) => handleInputChange('deductions.other', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Salary Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Salary Summary
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Gross Salary</div>
                <div className="text-lg font-bold text-blue-600">
                  {salaryService.formatCurrency(calculatedValues.grossSalary)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-600">Total Deductions</div>
                <div className="text-lg font-bold text-red-600">
                  {salaryService.formatCurrency(calculatedValues.totalDeductions)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-600">Net Salary</div>
                <div className="text-xl font-bold text-green-600">
                  {salaryService.formatCurrency(calculatedValues.netSalary)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {salaryService.getPaymentMethodsList().map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange('transactionId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes"
                />
              </div>
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt (Optional)</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {receiptPreview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="max-w-full max-h-48 rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptImage(null);
                        setReceiptPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Receipt uploaded successfully</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload Receipt</p>
                  <p className="text-gray-600 mb-4">
                    Upload a photo of the payment receipt for record keeping
                  </p>
                  <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition duration-200">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPEG, PNG, GIF (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {editingSalary ? 'Update Salary' : 'Save Salary'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryForm;
