import axios from 'axios';
import { store } from '../store/store';

class BranchService {
  /**
   * Create a new branch
   * @param {Object} branchData - Branch creation data
   * @returns {Promise<Object>} Branch creation result
   */
  async createBranch(branchData) {
    try {
      // Ensure PG ID is included
      if (!branchData.pgId) {
        const state = store.getState();
        const pgId = state.auth.user?.pgId;

        if (!pgId) {
          return {
            success: false,
            message: 'PG ID is required. Please contact support.',
            error: 'Missing PG ID'
          };
        }

        branchData.pgId = pgId;
      }

      // Validate required fields
      const requiredFields = [
        'name', 'address', 'contact', 'maintainer', 'pgId'
      ];

      for (const field of requiredFields) {
        if (!branchData[field]) {
          return {
            success: false,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
            error: `Missing ${field}`
          };
        }
      }

      // Make API call
      const response = await axios.post('/api/branches', branchData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: 'Branch created successfully',
        data: response.data.data
      };
    } catch (error) {
      console.error('Branch creation error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create branch',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Update an existing branch
   * @param {string} branchId - ID of the branch to update
   * @param {Object} branchData - Branch update data
   * @returns {Promise<Object>} Branch update result
   */
  async updateBranch(branchId, branchData) {
    try {
      // Ensure PG ID is included
      if (!branchData.pgId) {
        const state = store.getState();
        const pgId = state.auth.user?.pgId;

        if (!pgId) {
          return {
            success: false,
            message: 'PG ID is required. Please contact support.',
            error: 'Missing PG ID'
          };
        }

        branchData.pgId = pgId;
      }

      // Validate required fields
      const requiredFields = [
        'name', 'address', 'contact', 'maintainer', 'pgId'
      ];

      for (const field of requiredFields) {
        if (!branchData[field]) {
          return {
            success: false,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
            error: `Missing ${field}`
          };
        }
      }

      // Make API call
      const response = await axios.put(`/api/branches/${branchId}`, branchData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: 'Branch updated successfully',
        data: response.data.data
      };
    } catch (error) {
      console.error('Branch update error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update branch',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Fetch branches for a specific PG
   * @param {string} pgId - PG ID to fetch branches for
   * @returns {Promise<Object>} Branches fetch result
   */
  async getBranchesByPG(pgId) {
    try {
      if (!pgId) {
        return {
          success: false,
          message: 'PG ID is required. Please contact support.',
          error: 'Missing PG ID'
        };
      }

      const response = await axios.get(`/api/branches?pgId=${pgId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: 'Branches fetched successfully',
        data: response.data.data
      };
    } catch (error) {
      console.error('Branches fetch error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch branches',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Fetch branches for the current PG
   * @returns {Promise<Object>} Branches fetch result
   */
  async fetchBranches() {
    try {
      const state = store.getState();
      const pgId = state.auth.user?.pgId;

      if (!pgId) {
        return {
          success: false,
          message: 'PG ID is required. Please contact support.',
          error: 'Missing PG ID'
        };
      }

      const response = await axios.get(`/api/branches?pgId=${pgId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: 'Branches fetched successfully',
        data: response.data.data
      };
    } catch (error) {
      console.error('Branches fetch error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch branches',
        error: error.response?.data || error.message
      };
    }
  }
}

export default new BranchService();
