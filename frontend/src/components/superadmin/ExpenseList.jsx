import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import api from '../../services/api';
import { format } from 'date-fns';
import { Edit, Trash2, Search, Calendar, Eye, X, DollarSign, FileText, Tag, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';

const expenseTypes = [
  { value: 'server', label: 'Server' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'office', label: 'Office' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'travel', label: 'Travel' },
  { value: 'miscellaneous', label: 'Miscellaneous' }
];

const ExpenseList = ({ onExpenseUpdated, onExpenseDeleted, onEditExpense }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/expenses?${params.toString()}`);
      
      if (response.data.success) {
        setExpenses(response.data.data);
        setTotalPages(response.data.pagination.pages);
      } else {
        throw new Error(response.data.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, filters]);

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    setDeletingId(expenseToDelete._id);
    try {
      const response = await api.delete(`/expenses/${expenseToDelete._id}`);
      if (response.data.success) {
        if (onExpenseDeleted) {
          onExpenseDeleted();
        }
        fetchExpenses();
        setShowDeleteModal(false);
        setExpenseToDelete(null);
      } else {
        throw new Error(response.data.message || 'Failed to delete expense');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (expense) => {
    if (onEditExpense) {
      onEditExpense(expense);
    }
  };

  const handleView = (expense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      expense.description?.toLowerCase().includes(search) ||
      expense.type?.toLowerCase().includes(search) ||
      expense.category?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-cyan-100 overflow-hidden">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 border-b border-cyan-200">
        <h2 className="text-lg font-semibold text-gray-900">Expense List</h2>
      </div>

      {/* Compact Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Select
            value={filters.type || 'all'}
            onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {expenseTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Compact Table */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500">Loading expenses...</div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-600">{error}</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">No expenses found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-200">
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Date</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Amount</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Description</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Category</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => {
                  const expenseDate = expense.date ? new Date(expense.date) : null;
                  const isValidDate = expenseDate && !isNaN(expenseDate.getTime());
                  
                  return (
                    <motion.tr
                      key={expense._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="border-b hover:bg-cyan-50/50 transition-colors cursor-pointer"
                      onClick={() => handleView(expense)}
                    >
                      <td className="px-2 py-2 text-[11px] text-gray-700">
                        {isValidDate ? format(expenseDate, 'MMM dd, yyyy') : 'Invalid date'}
                      </td>
                      <td className="px-2 py-2">
                        <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-medium">
                          {expense.type}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[11px] font-semibold text-gray-900">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-gray-600 max-w-xs truncate">
                        {expense.description}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-gray-500">
                        {expense.category || '-'}
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(expense)}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-1 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded transition-all"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(expense);
                            }}
                            disabled={deletingId === expense._id}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 px-2 text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-gray-600 px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Expense Preview Modal */}
      {showViewModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] my-8"
          >
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Expense Details</h2>
                    <p className="text-cyan-100 text-xs">
                      {selectedExpense._id ? selectedExpense._id.slice(-8).toUpperCase() : 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedExpense(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Preview Section with Cyan Background */}
            <div className="bg-cyan-50 border-b border-cyan-200 p-4 flex-shrink-0">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      ₹
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selectedExpense.description || 'No Description'}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">{selectedExpense.type || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-600">
                      ₹{selectedExpense.amount?.toLocaleString('en-IN') || '0'}
                    </p>
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-medium capitalize">
                      {selectedExpense.type || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <CalendarIcon className="h-3 w-3" />
                      Expense Date
                    </label>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {selectedExpense.date 
                        ? format(new Date(selectedExpense.date), 'MMMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3" />
                      Amount
                    </label>
                    <p className="text-sm font-semibold text-cyan-600 mt-0.5">
                      ₹{selectedExpense.amount?.toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <Tag className="h-3 w-3" />
                      Category
                    </label>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {selectedExpense.category || '-'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <FileText className="h-3 w-3" />
                      Type
                    </label>
                    <div className="mt-0.5">
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium capitalize">
                        {selectedExpense.type || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {selectedExpense.createdAt && (
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                        <CalendarIcon className="h-3 w-3" />
                        Created Date
                      </label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {format(new Date(selectedExpense.createdAt), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedExpense.updatedAt && selectedExpense.updatedAt !== selectedExpense.createdAt && (
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                        <CalendarIcon className="h-3 w-3" />
                        Last Updated
                      </label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {format(new Date(selectedExpense.updatedAt), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
                  <FileText className="h-3 w-3" />
                  Description
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedExpense.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Footer with Action Buttons */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl flex-shrink-0">
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedExpense);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 h-8 px-3 text-xs flex-1"
                >
                  <Edit className="h-3 w-3 mr-1.5" />
                  Edit Expense
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    handleDeleteClick(selectedExpense);
                  }}
                  className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-3 text-xs flex-1"
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && expenseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
          >
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Delete Expense</h2>
                    <p className="text-red-100 text-xs">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setExpenseToDelete(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-4">
                  Are you sure you want to delete the expense <strong>"{expenseToDelete.description || 'N/A'}"</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-800">
                      <p className="font-semibold mb-1">Warning:</p>
                      <p>This will permanently remove the expense record and all associated data. This action cannot be reversed.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expense Preview */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Expense Details</span>
                  <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-medium capitalize">
                    {expenseToDelete.type || 'N/A'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">₹{expenseToDelete.amount?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {expenseToDelete.date 
                        ? format(new Date(expenseToDelete.date), 'MMM dd, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                  {expenseToDelete.category && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{expenseToDelete.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer with Action Buttons */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl flex-shrink-0">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setExpenseToDelete(null);
                  }}
                  disabled={deletingId === expenseToDelete._id}
                  className="flex-1 h-8 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deletingId === expenseToDelete._id}
                  className="flex-1 h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {deletingId === expenseToDelete._id ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Delete Expense
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
