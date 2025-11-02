import React, { useState } from 'react';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import api from '../../services/api';
import { format } from 'date-fns';

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

const ExpenseForm = ({ expense = null, onExpenseAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    type: expense?.type || '',
    amount: expense?.amount || '',
    date: expense ? new Date(expense.date) : new Date(),
    description: expense?.description || '',
    category: expense?.category || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const isEditMode = !!expense;

  // Disable future dates
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleDateSelect = (date) => {
    if (date && date <= today) {
      setFormData(prev => ({ ...prev, date }));
      setShowCalendar(false);
    } else if (date > today) {
      setError('Expense date cannot be in the future');
      setShowCalendar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.type) {
        throw new Error('Expense type is required');
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Valid expense amount is required');
      }
      if (!formData.date) {
        throw new Error('Expense date is required');
      }
      if (formData.date > today) {
        throw new Error('Expense date cannot be in the future');
      }
      if (!formData.description || formData.description.trim().length === 0) {
        throw new Error('Description is required');
      }

      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date.toISOString()
      };

      const response = isEditMode
        ? await api.put(`/expenses/${expense._id}`, payload)
        : await api.post('/expenses', payload);

      if (response.data.success) {
        if (onExpenseAdded) {
          onExpenseAdded(response.data.data);
        }
        // Reset form if not in edit mode
        if (!isEditMode) {
          setFormData({
            type: '',
            amount: '',
            date: new Date(),
            description: '',
            category: ''
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to save expense');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Expense' : 'Add New Expense'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Expense Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Expense Date *</Label>
          <div className="relative">
            <Input
              id="date"
              type="text"
              value={format(formData.date, 'PPP')}
              readOnly
              onClick={() => setShowCalendar(!showCalendar)}
              className="cursor-pointer"
              placeholder="Select date"
            />
            {showCalendar && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowCalendar(false)}
                />
                <div className="absolute z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={handleDateSelect}
                    disabled={(date) => date > today}
                    defaultMonth={formData.date}
                    initialFocus
                  />
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Cannot select future dates</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category (Optional)</Label>
          <Input
            id="category"
            type="text"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="Enter category"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter expense description"
            rows={4}
            required
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 characters
          </p>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Update Expense' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;

