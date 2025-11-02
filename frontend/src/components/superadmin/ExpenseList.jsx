import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import ExpenseForm from './ExpenseForm';
import api from '../../services/api';
import { format } from 'date-fns';
import { Edit, Trash2, Plus, Search, Filter } from 'lucide-react';

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

const ExpenseList = ({ onExpenseUpdated, onExpenseDeleted }) => {
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
  const [editingExpense, setEditingExpense] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await api.delete(`/expenses/${id}`);
      if (response.data.success) {
        if (onExpenseDeleted) {
          onExpenseDeleted();
        }
        fetchExpenses();
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
    setEditingExpense(expense);
    setShowAddForm(false);
  };

  const handleEditClose = () => {
    setEditingExpense(null);
  };

  const handleEditSave = () => {
    setEditingExpense(null);
    if (onExpenseUpdated) {
      onExpenseUpdated();
    }
    fetchExpenses();
  };

  const handleAddSave = () => {
    setShowAddForm(false);
    fetchExpenses();
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Expense List</h2>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingExpense(null);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.type || 'all'}
          onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? '' : value })}
        >
          <SelectTrigger>
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

        <Input
          type="date"
          placeholder="Start Date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />

        <Input
          type="date"
          placeholder="End Date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <ExpenseForm
            onExpenseAdded={handleAddSave}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Edit Form */}
      {editingExpense && (
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <ExpenseForm
            expense={editingExpense}
            onExpenseAdded={handleEditSave}
            onCancel={handleEditClose}
          />
        </div>
      )}

      {/* Expense Table */}
      {loading ? (
        <div className="text-center py-8">Loading expenses...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No expenses found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const expenseDate = expense.date ? new Date(expense.date) : null;
                  const isValidDate = expenseDate && !isNaN(expenseDate.getTime());
                  
                  return (
                  <tr key={expense._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {isValidDate ? format(expenseDate, 'PPP') : 'Invalid date'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {expense.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense._id)}
                          disabled={deletingId === expense._id}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseList;

