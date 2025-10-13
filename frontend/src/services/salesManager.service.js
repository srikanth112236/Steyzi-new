import api from './api';
import { store } from '../store/store';

class SalesManagerService {
  /**
   * Create a new Sales Manager
   * @param {Object} salesManagerData 
   * @returns {Promise}
   */
  async createSalesManager(salesManagerData) {
    try {
      const response = await api.post('/sales-managers', salesManagerData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get all Sales Managers
   * @param {Object} filters 
   * @returns {Promise}
   */
  async getAllSalesManagers(filters = {}) {
    try {
      const response = await api.get('/sales-managers', { params: filters });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update Sales Manager
   * @param {String} salesManagerId 
   * @param {Object} updateData 
   * @returns {Promise}
   */
  async updateSalesManager(salesManagerId, updateData) {
    try {
      const response = await api.put(`/sales-managers/${salesManagerId}`, updateData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Delete Sales Manager
   * @param {String} salesManagerId 
   * @returns {Promise}
   */
  async deleteSalesManager(salesManagerId) {
    try {
      const response = await api.delete(`/sales-managers/${salesManagerId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Reset Sales Manager Password
   * @param {String} salesManagerId
   * @returns {Promise}
   */
  async resetPassword(salesManagerId) {
    try {
      const response = await api.post(`/sales-managers/${salesManagerId}/reset-password`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Change Sales Manager Password
   * @param {String} salesManagerId
   * @param {Object} passwordData - Current and new password
   * @returns {Promise}
   */
  async changePassword(salesManagerId, passwordData) {
    try {
      const response = await api.put(`/sales-managers/${salesManagerId}/change-password`, passwordData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Check if password change is required
   * @param {String} salesManagerId
   * @returns {Promise}
   */
  async needsPasswordChange(salesManagerId) {
    try {
      const response = await api.get(`/sales-managers/${salesManagerId}/needs-password-change`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get Sales Manager Performance
   * @param {String} salesManagerId 
   * @returns {Promise}
   */
  async getSalesManagerPerformance(salesManagerId) {
    try {
      const response = await api.get(`/sales-managers/${salesManagerId}/performance`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handle API errors
   * @param {Error} error 
   */
  handleError(error) {
    // Check if the error is due to unauthorized access
    if (error.response && error.response.status === 401) {
      // Dispatch logout action or redirect to login
      store.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }

    // Log the error
    console.error('API Error:', error.response ? error.response.data : error.message);
  }
}

export default new SalesManagerService();
