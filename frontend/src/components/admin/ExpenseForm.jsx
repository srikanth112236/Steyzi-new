import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, FileText, DollarSign, Calendar, Building2, MessageSquare } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import expenseService from '../../services/expense.service';
import branchService from '../../services/branch.service';

const ExpenseForm = ({ isOpen, onClose, onSubmit, editingExpense }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchError, setBranchError] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const [formData, setFormData] = useState({
    expenseName: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paidType: 'cash',
    expenseType: 'other',
    purpose: '',
    amount: '',
    branchId: '',
    status: 'pending',
    notes: '',
    tags: ''
  });

  const [receiptImage, setReceiptImage] = useState(null);

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setBranchError(null);
        const response = await branchService.getAllBranches();

        if (response.success) {
          const branchesData = response.data?.branches || [];
          setBranches(branchesData);
          if (branchesData.length === 0) {
            setBranchError('No active branches found. Please contact your administrator to create branches for your PG.');
          }
        } else {
          setBranches([]);
          if (response.message && response.message.includes('PG')) {
            setBranchError('You are not associated with any PG. Please contact your administrator.');
          } else {
            setBranchError('Failed to load branches. Please try again.');
          }
        }
      } catch (error) {
        setBranches([]);
        if (error.message && error.message.includes('PG')) {
          setBranchError('You are not associated with any PG. Please contact your administrator.');
        } else {
          setBranchError('Unable to load branches. Please check your connection and try again.');
        }
      }
    };

    if (isOpen) {
      loadBranches();
    }
  }, [isOpen]);

  // Load expense data for editing
  useEffect(() => {
    if (editingExpense && isOpen) {
      setFormData({
        expenseName: editingExpense.expenseName || '',
        expenseDate: editingExpense.expenseDate ? new Date(editingExpense.expenseDate).toISOString().split('T')[0] : '',
        paidType: editingExpense.paidType || 'cash',
        expenseType: editingExpense.expenseType || 'other',
        purpose: editingExpense.purpose || '',
        amount: editingExpense.amount || '',
        branchId: editingExpense.branchId?._id || '',
        status: editingExpense.status || 'pending',
        notes: editingExpense.notes || '',
        tags: editingExpense.tags ? editingExpense.tags.join(', ') : ''
      });

      if (editingExpense.receiptImage) {
        setReceiptPreview(`/uploads/expenses/${editingExpense.receiptImage.fileName}`);
      }
    } else if (!editingExpense && isOpen) {
      // Reset form for new expense
      setFormData({
        expenseName: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paidType: 'cash',
        expenseType: 'other',
        purpose: '',
        amount: '',
        branchId: '',
        status: 'pending',
        notes: '',
        tags: ''
      });
      setReceiptImage(null);
      setReceiptPreview(null);
    }
  }, [editingExpense, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Load branches when maintainer changes (if this was for salary form)
    // For expenses, we don't need maintainer-specific branches, but keeping for compatibility
  };

  const loadBranchesForMaintainer = async (maintainerId) => {
    if (!maintainerId) {
      setBranches([]);
      return;
    }

    try {
      // For now, we'll load all branches since we don't have a specific endpoint
      // to get branches for a specific maintainer. The backend will filter appropriately.
      const response = await branchService.getAllBranches();
      if (response.success) {
        setBranches(response.data?.branches || []);
      }
    } catch (error) {
      console.error('Error loading branches for maintainer:', error);
      setBranches([]);
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
    if (!formData.expenseName.trim()) {
      toast.error('Expense name is required');
      return;
    }

    if (!formData.expenseDate) {
      toast.error('Expense date is required');
      return;
    }

    if (!formData.purpose.trim()) {
      toast.error('Purpose is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valid amount is required');
      return;
    }

    if (branchError) {
      toast.error('Cannot submit expense: ' + branchError);
      return;
    }

    if (!formData.branchId) {
      toast.error('Branch selection is required');
      return;
    }

    try {
      setLoading(true);

      // Prepare submission data
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      // Remove empty fields
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === '' || submissionData[key] === null || submissionData[key] === undefined) {
          delete submissionData[key];
        }
      });

      await onSubmit(submissionData, receiptImage);

    } catch (error) {
      console.error('Error submitting expense:', error);
      toast.error(error.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      expenseName: '',
      expenseDate: new Date().toISOString().split('T')[0],
      paidType: 'cash',
      expenseType: 'other',
      purpose: '',
      amount: '',
      branchId: '',
      status: 'pending',
      notes: '',
      tags: ''
    });
    setReceiptImage(null);
    setReceiptPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <p className="text-sm text-gray-600">
                {editingExpense ? 'Update expense details' : 'Record a new expense for your PG'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Name *
                </label>
                <input
                  type="text"
                  value={formData.expenseName}
                  onChange={(e) => handleInputChange('expenseName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter expense name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => handleInputChange('expenseDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Type *
                </label>
                <select
                  value={formData.expenseType}
                  onChange={(e) => handleInputChange('expenseType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="utilities">Utilities</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="security">Security</option>
                  <option value="food">Food</option>
                  <option value="transportation">Transportation</option>
                  <option value="marketing">Marketing</option>
                  <option value="office_supplies">Office Supplies</option>
                  <option value="repairs">Repairs</option>
                  <option value="insurance">Insurance</option>
                  <option value="legal">Legal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={formData.paidType}
                  onChange={(e) => handleInputChange('paidType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="online_transfer">Online Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch *
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => handleInputChange('branchId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    branchError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  disabled={!!branchError}
                >
                  <option value="">
                    {branchError ? 'Unable to load branches' :
                     Array.isArray(branches) && branches.length === 0 ? 'No branches available' :
                     'Select Branch'}
                  </option>
                  {Array.isArray(branches) && branches.length > 0 && branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {branchError && (
                  <p className="mt-1 text-sm text-red-600">
                    {branchError}
                  </p>
                )}
                {!branchError && Array.isArray(branches) && branches.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No branches are available. Please contact your administrator to set up branches for your PG.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose/Description *
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the purpose of this expense..."
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="urgent, monthly, repair (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
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
                    Upload a photo of your receipt for record keeping
                  </p>
                  <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition duration-200">
                    <Camera className="h-4 w-4 mr-2" />
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

          {/* Additional Notes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes or comments..."
              />
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
                  <FileText className="h-4 w-4 mr-2" />
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
