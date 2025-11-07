import api from './api';

class ExpenseService {
  // Create a new expense
  async createExpense(expenseData, receiptImage = null) {
    try {
      const formData = new FormData();

      // Add all expense data to form data
      Object.keys(expenseData).forEach(key => {
        if (expenseData[key] !== null && expenseData[key] !== undefined) {
          if (key === 'tags' && Array.isArray(expenseData[key])) {
            formData.append(key, expenseData[key].join(','));
          } else {
            formData.append(key, expenseData[key]);
          }
        }
      });

      // Add receipt image if provided
      if (receiptImage) {
        formData.append('receiptImage', receiptImage);
      }

      const response = await api.post('/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error.response?.data || error;
    }
  }

  // Get all expenses with filters and pagination
  async getAllExpenses(filters = {}, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await api.get(`/expenses?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error.response?.data || error;
    }
  }

  // Get expense by ID
  async getExpenseById(expenseId) {
    try {
      const response = await api.get(`/expenses/${expenseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error.response?.data || error;
    }
  }

  // Update expense
  async updateExpense(expenseId, updateData, receiptImage = null) {
    try {
      const formData = new FormData();

      // Add all update data to form data
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== null && updateData[key] !== undefined) {
          if (key === 'tags' && Array.isArray(updateData[key])) {
            formData.append(key, updateData[key].join(','));
          } else {
            formData.append(key, updateData[key]);
          }
        }
      });

      // Add receipt image if provided
      if (receiptImage) {
        formData.append('receiptImage', receiptImage);
      }

      const response = await api.put(`/expenses/${expenseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error.response?.data || error;
    }
  }

  // Delete expense
  async deleteExpense(expenseId) {
    try {
      const response = await api.delete(`/expenses/${expenseId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error.response?.data || error;
    }
  }

  // Approve expense
  async approveExpense(expenseId) {
    try {
      const response = await api.patch(`/expenses/${expenseId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving expense:', error);
      throw error.response?.data || error;
    }
  }

  // Mark expense as paid
  async markExpenseAsPaid(expenseId, paymentData = {}) {
    try {
      const response = await api.patch(`/expenses/${expenseId}/mark-paid`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      throw error.response?.data || error;
    }
  }

  // Get expense statistics
  async getExpenseStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await api.get(`/expenses/stats?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      throw error.response?.data || error;
    }
  }

  // Get expense analytics
  async getExpenseAnalytics(year, branchId = null) {
    try {
      const queryParams = new URLSearchParams({ year: year.toString() });
      if (branchId) {
        queryParams.append('branchId', branchId);
      }

      const response = await api.get(`/expenses/analytics?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
      throw error.response?.data || error;
    }
  }

  // Get expense types
  async getExpenseTypes() {
    try {
      const response = await api.get('/expenses/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching expense types:', error);
      throw error.response?.data || error;
    }
  }

  // Format currency for display
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Get expense status color
  getStatusColor(status) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Get expense type color
  getExpenseTypeColor(expenseType) {
    const colors = {
      maintenance: 'bg-blue-100 text-blue-800',
      utilities: 'bg-cyan-100 text-cyan-800',
      housekeeping: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800',
      food: 'bg-orange-100 text-orange-800',
      transportation: 'bg-purple-100 text-purple-800',
      marketing: 'bg-pink-100 text-pink-800',
      office_supplies: 'bg-gray-100 text-gray-800',
      repairs: 'bg-yellow-100 text-yellow-800',
      insurance: 'bg-indigo-100 text-indigo-800',
      legal: 'bg-teal-100 text-teal-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[expenseType] || colors.other;
  }

  // Export expenses to CSV
  async exportExpenses(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await api.get(`/expenses?${queryParams}&export=csv`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error exporting expenses:', error);
      throw error.response?.data || error;
    }
  }
}

const expenseService = new ExpenseService();
export default expenseService;
