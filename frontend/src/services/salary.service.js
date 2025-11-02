import api from './api';

class SalaryService {
  // Create or update salary record
  async createOrUpdateSalary(salaryData, receiptImage = null) {
    try {
      const formData = new FormData();

      // Add all salary data to form data
      Object.keys(salaryData).forEach(key => {
        if (salaryData[key] !== null && salaryData[key] !== undefined) {
          if (key === 'allowances' || key === 'deductions' || key === 'overtime') {
            formData.append(key, JSON.stringify(salaryData[key]));
          } else {
            formData.append(key, salaryData[key]);
          }
        }
      });

      // Add receipt image if provided
      if (receiptImage) {
        formData.append('receiptImage', receiptImage);
      }

      const response = await api.post('/salaries', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating/updating salary:', error);
      throw error.response?.data || error;
    }
  }

  // Get all salaries with filters and pagination
  async getAllSalaries(filters = {}, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await api.get(`/salaries?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salaries:', error);
      throw error.response?.data || error;
    }
  }

  // Get salary by ID
  async getSalaryById(salaryId) {
    try {
      const response = await api.get(`/salaries/${salaryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salary:', error);
      throw error.response?.data || error;
    }
  }

  // Update salary
  async updateSalary(salaryId, updateData, receiptImage = null) {
    try {
      const formData = new FormData();

      // Add all update data to form data
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== null && updateData[key] !== undefined) {
          if (key === 'allowances' || key === 'deductions' || key === 'overtime') {
            formData.append(key, JSON.stringify(updateData[key]));
          } else {
            formData.append(key, updateData[key]);
          }
        }
      });

      // Add receipt image if provided
      if (receiptImage) {
        formData.append('receiptImage', receiptImage);
      }

      const response = await api.put(`/salaries/${salaryId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating salary:', error);
      throw error.response?.data || error;
    }
  }

  // Delete salary
  async deleteSalary(salaryId) {
    try {
      const response = await api.delete(`/salaries/${salaryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting salary:', error);
      throw error.response?.data || error;
    }
  }

  // Process salary payment
  async processSalaryPayment(salaryId, paymentData, receiptImage = null) {
    try {
      const formData = new FormData();

      // Add payment data to form data
      Object.keys(paymentData).forEach(key => {
        if (paymentData[key] !== null && paymentData[key] !== undefined) {
          formData.append(key, paymentData[key]);
        }
      });

      // Add receipt image if provided
      if (receiptImage) {
        formData.append('receiptImage', receiptImage);
      }

      const response = await api.patch(`/salaries/${salaryId}/payment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error processing salary payment:', error);
      throw error.response?.data || error;
    }
  }

  // Get salary statistics
  async getSalaryStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await api.get(`/salaries/stats?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salary stats:', error);
      throw error.response?.data || error;
    }
  }

  // Get salary analytics
  async getSalaryAnalytics(year, branchId = null) {
    try {
      const queryParams = new URLSearchParams({ year: year.toString() });
      if (branchId) {
        queryParams.append('branchId', branchId);
      }

      const response = await api.get(`/salaries/analytics?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salary analytics:', error);
      throw error.response?.data || error;
    }
  }

  // Get maintainer salary summary
  async getMaintainerSalarySummary(maintainerId, year = null) {
    try {
      const queryParams = new URLSearchParams();
      if (year) {
        queryParams.append('year', year.toString());
      }

      const response = await api.get(`/salaries/maintainer/${maintainerId}/summary?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintainer salary summary:', error);
      throw error.response?.data || error;
    }
  }

  // Get active maintainers for salary management
  async getActiveMaintainers() {
    try {
      const response = await api.get('/salaries/maintainers');
      return response.data;
    } catch (error) {
      console.error('Error fetching active maintainers:', error);
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Get salary status color
  getStatusColor(status) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-orange-100 text-orange-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Get payment method color
  getPaymentMethodColor(method) {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      online_transfer: 'bg-blue-100 text-blue-800',
      upi: 'bg-purple-100 text-purple-800',
      cheque: 'bg-yellow-100 text-yellow-800',
      card: 'bg-red-100 text-red-800',
    };
    return colors[method] || colors.cash;
  }

  // Calculate total allowances
  calculateTotalAllowances(allowances) {
    if (!allowances) return 0;
    return (allowances.hra || 0) +
           (allowances.conveyance || 0) +
           (allowances.medical || 0) +
           (allowances.other || 0);
  }

  // Calculate total deductions
  calculateTotalDeductions(deductions) {
    if (!deductions) return 0;
    return (deductions.pf || 0) +
           (deductions.professional_tax || 0) +
           (deductions.other || 0);
  }

  // Calculate gross salary
  calculateGrossSalary(baseSalary, allowances, bonus, overtime) {
    const totalAllowances = this.calculateTotalAllowances(allowances);
    const overtimeAmount = overtime?.amount || 0;
    return baseSalary + totalAllowances + (bonus || 0) + overtimeAmount;
  }

  // Calculate net salary
  calculateNetSalary(grossSalary, deductions) {
    const totalDeductions = this.calculateTotalDeductions(deductions);
    return grossSalary - totalDeductions;
  }

  // Export salaries to CSV
  async exportSalaries(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await api.get(`/salaries?${queryParams}&export=csv`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salaries_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error exporting salaries:', error);
      throw error.response?.data || error;
    }
  }

  // Get months list
  getMonthsList() {
    return [
      { value: 'January', label: 'January' },
      { value: 'February', label: 'February' },
      { value: 'March', label: 'March' },
      { value: 'April', label: 'April' },
      { value: 'May', label: 'May' },
      { value: 'June', label: 'June' },
      { value: 'July', label: 'July' },
      { value: 'August', label: 'August' },
      { value: 'September', label: 'September' },
      { value: 'October', label: 'October' },
      { value: 'November', label: 'November' },
      { value: 'December', label: 'December' }
    ];
  }

  // Get payment methods list
  getPaymentMethodsList() {
    return [
      { value: 'cash', label: 'Cash' },
      { value: 'online_transfer', label: 'Online Transfer' },
      { value: 'upi', label: 'UPI' },
      { value: 'cheque', label: 'Cheque' },
      { value: 'card', label: 'Card' }
    ];
  }
}

const salaryService = new SalaryService();
export default salaryService;
