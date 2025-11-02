import api from './api';

class SalesService {
  /**
   * Log method calls with detailed information
   * @param {string} methodName - Name of the method being called
   * @param {Object} [params] - Optional parameters
   */
  _logMethodCall(methodName, params = {}) {
    console.group(`🚀 SalesService: ${methodName}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Parameters:', params);
    console.groupEnd();
  }

  /**
   * Handle API errors with comprehensive logging
   * @param {Error} error - Error object
   * @param {string} methodName - Name of the method where error occurred
   * @throws {Error} Rethrows the error after logging
   */
  _handleError(error, methodName) {
    console.group(`❌ SalesService Error: ${methodName}`);
    console.error('Error Message:', error.message);
    console.error('Error Response:', error.response?.data);
    console.error('Error Status:', error.response?.status);
    console.groupEnd();
    throw error;
  }

  /**
   * Get PGs added by the current sub-sales staff
   * @returns {Promise} List of PGs
   */
  async getMyPGs() {
    try {
      this._logMethodCall('getMyPGs');
      const response = await api.get('/sales/my-pgs');
      console.log('✅ My PGs Retrieved:', response.data);
      return response;
    } catch (error) {
      this._handleError(error, 'getMyPGs');
    }
  }

  /**
   * Get dashboard data for sales users
   * @returns {Promise} Dashboard data
   */
  async getDashboardData() {
    try {
      this._logMethodCall('getDashboardData');
      const response = await api.get('/sales/dashboard');
      console.log('✅ Dashboard Data Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getDashboardData');
    }
  }

  async getPerformanceAnalytics() {
    try {
      this._logMethodCall('getPerformanceAnalytics');
      const response = await api.get('/sales/performance');
      console.log('✅ Performance Analytics Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getPerformanceAnalytics');
    }
  }

  async getSalesReports() {
    try {
      this._logMethodCall('getSalesReports');
      const response = await api.get('/sales/reports');
      console.log('✅ Sales Reports Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getSalesReports');
    }
  }

  async changePassword(passwordData) {
    try {
      this._logMethodCall('changePassword');

      // Ensure data is clean and properly formatted
      const cleanData = {
        currentPassword: String(passwordData.currentPassword || '').trim(),
        newPassword: String(passwordData.newPassword || '').trim()
      };

      console.log('🔐 SalesService changePassword - sending data:', {
        endpoint: '/sales/change-password',
        data: {
          currentPassword: cleanData.currentPassword ? '***' : 'empty',
          newPassword: cleanData.newPassword ? '***' : 'empty'
        },
        dataTypes: {
          currentPassword: typeof cleanData.currentPassword,
          newPassword: typeof cleanData.newPassword
        }
      });

      // Send request with explicit headers and ensure clean JSON
      const response = await api.put('/sales/change-password', cleanData, {
        headers: {
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => {
          // Ensure clean JSON serialization
          return JSON.stringify(data);
        }]
      });

      console.log('✅ Password Changed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ SalesService changePassword error:', error);
      this._handleError(error, 'changePassword');
    }
  }

  async getMyFinancials() {
    try {
      this._logMethodCall('getMyFinancials');
      const response = await api.get('/sales/my-financials');
      console.log('✅ Financial Data Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getMyFinancials');
    }
  }

  /**
   * Get financial data for the current sub-sales staff
   * @returns {Promise} Financial data
   */
  async getMyFinancials() {
    try {
      this._logMethodCall('getMyFinancials');
      const response = await api.get('/sales/my-financials');
      console.log('✅ My Financials Retrieved:', response.data);
      return response;
    } catch (error) {
      this._handleError(error, 'getMyFinancials');
    }
  }

  /**
   * Add a new PG for the current sub-sales staff
   * @param {Object} pgData - PG details
   * @returns {Promise} Added PG details
   */
  async addPG(pgData) {
    try {
      this._logMethodCall('addPG', { pgData });
      const response = await api.post('/sales/pgs', pgData);
      console.log('✅ PG Added Successfully:', response.data);
      return response;
    } catch (error) {
      this._handleError(error, 'addPG');
    }
  }

  /**
   * Create a new sales staff member
   * @param {Object} staffData - Sales staff data
   * @returns {Promise} API response
   */
  async createSalesStaff(staffData) {
    try {
      this._logMethodCall('createSalesStaff', { staffData });
      
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email'];
      for (const field of requiredFields) {
        if (!staffData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      const response = await api.post('/sales/staff', staffData);
      console.log('✅ Sales Staff Created:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'createSalesStaff');
    }
  }

  /**
   * Get all sales staff with optional filtering
   * @param {Object} [filters={}] - Optional filters for querying sales staff
   * @returns {Promise} List of sales staff
   */
  async getAllSalesStaff(filters = {}) {
    try {
      this._logMethodCall('getAllSalesStaff', { filters });
      
      // Convert filters to query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });

      const response = await api.get(`/sales/staff?${queryParams.toString()}`);
      console.log('✅ Sales Staff Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getAllSalesStaff');
    }
  }

  /**
   * Get specific sales staff details
   * @param {string} staffId - ID of the sales staff member
   * @returns {Promise} Sales staff details
   */
  async getSalesStaffDetails(staffId) {
    try {
      this._logMethodCall('getSalesStaffDetails', { staffId });
      const response = await api.get(`/sales/staff/${staffId}`);
      console.log('✅ Sales Staff Details Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getSalesStaffDetails');
    }
  }

  /**
   * Update sales staff details
   * @param {string} staffId - ID of the sales staff member
   * @param {Object} updateData - Data to update
   * @returns {Promise} Updated sales staff details
   */
  async updateSalesStaff(staffId, updateData) {
    try {
      this._logMethodCall('updateSalesStaff', { staffId, updateData });
      const response = await api.put(`/sales/staff/${staffId}`, updateData);
      console.log('✅ Sales Staff Updated:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'updateSalesStaff');
    }
  }

  /**
   * Delete sales staff
   * @param {string} staffId - ID of the sales staff member
   * @returns {Promise} Deletion confirmation
   */
  async deleteSalesStaff(staffId) {
    try {
      this._logMethodCall('deleteSalesStaff', { staffId });
      const response = await api.delete(`/sales/staff/${staffId}`);
      console.log('✅ Sales Staff Deleted:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'deleteSalesStaff');
    }
  }

  /**
   * Get sales staff hierarchy
   * @returns {Promise} Sales staff hierarchy
   */
  async getSalesHierarchy() {
    try {
      this._logMethodCall('getSalesHierarchy');
      const response = await api.get('/sales/hierarchy');
      console.log('✅ Sales Hierarchy Retrieved:', response.data);
      return response;
    } catch (error) {
      this._handleError(error, 'getSalesHierarchy');
    }
  }

  /**
   * Get team PGs for a sales manager
   * @returns {Promise} List of PGs
   */
  async getTeamPGs() {
    try {
      this._logMethodCall('getTeamPGs');
      const response = await api.get('/sales/team/pgs');
      console.log('✅ Team PGs Retrieved:', response.data);
      return response;
    } catch (error) {
      this._handleError(error, 'getTeamPGs');
    }
  }

  /**
   * Get financial data for sales team
   * @returns {Promise} Financial data
   */
  async getTeamFinancials() {
    try {
      this._logMethodCall('getTeamFinancials');
      const response = await api.get('/sales/financials');
      console.log('✅ Team Financials Retrieved:', response.data);
      return response;
    } catch (error) {
      this._handleError(error, 'getTeamFinancials');
    }
  }

  /**
   * Get profile for current sales user
   * @returns {Promise} Profile data
   */
  async getProfile() {
    try {
      this._logMethodCall('getProfile');
      const response = await api.get('/sales/profile');
      console.log('✅ Profile Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getProfile');
    }
  }

  /**
   * Get detailed commission management data for superadmin
   * @param {Object} filters - Optional filters (startDate, endDate, salesManagerId)
   * @returns {Promise} Commission management data
   */
  async getCommissionManagement(filters = {}) {
    try {
      this._logMethodCall('getCommissionManagement', { filters });
      
      // Convert filters to query parameters
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.salesManagerId) queryParams.append('salesManagerId', filters.salesManagerId);

      const url = `/sales/commission-management${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      console.log('✅ Commission Management Data Retrieved:', response.data);
      return response.data;
    } catch (error) {
      this._handleError(error, 'getCommissionManagement');
    }
  }

  /**
   * Update profile for current sales user
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Updated profile data
   */
  async updateProfile(profileData) {
    try {
      this._logMethodCall('updateProfile');

      // Clean and validate data
      const cleanData = {
        firstName: String(profileData.firstName || '').trim(),
        lastName: String(profileData.lastName || '').trim(),
        phone: String(profileData.phone || '').trim(),
        address: profileData.address ? {
          street: String(profileData.address.street || '').trim(),
          city: String(profileData.address.city || '').trim(),
          state: String(profileData.address.state || '').trim(),
          pincode: String(profileData.address.pincode || '').trim(),
          country: String(profileData.address.country || 'India').trim()
        } : undefined
      };

      console.log('🔐 SalesService updateProfile - sending data:', {
        endpoint: '/sales/profile',
        data: {
          firstName: cleanData.firstName ? '***' : 'empty',
          lastName: cleanData.lastName ? '***' : 'empty',
          phone: cleanData.phone ? '***' : 'empty',
          hasAddress: !!cleanData.address
        }
      });

      const response = await api.put('/sales/profile', cleanData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('✅ Profile Updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ SalesService updateProfile error:', error);
      this._handleError(error, 'updateProfile');
    }
  }
}

export default new SalesService();
