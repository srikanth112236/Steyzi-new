import { api } from './auth.service';

class MaintainerService {
  /**
   * Create a new maintainer
   * @param {Object} maintainerData - Maintainer creation data
   * @returns {Promise<Object>} - Created maintainer response
   */
  async createMaintainer(maintainerData) {
    try {
      // Ensure PG ID is included
      const userData = {
        ...maintainerData,
        pgId: maintainerData.pgId || this.getPgIdFromStorage()
      };

      const response = await api.post('/maintainers', userData);

      // Show success message with login credentials if default password was used
      if (response.data.success && response.data.data?.loginCredentials) {
        const credentials = response.data.data.loginCredentials;
        if (credentials.passwordType === 'default') {
          console.log('🔑 Default maintainer password:', credentials.password);
          // You might want to show this to the admin somehow
        }
      }

      return response.data;
    } catch (error) {
      // Re-throw the error with response data so frontend can access error details
      if (error.response?.data) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to create maintainer');
        customError.response = { data: errorData };
        throw customError;
      }
      this.handleError(error);
    }
  }

  /**
   * Get all maintainers
   * @param {Object} filters - Optional filters for pagination and filtering
   * @returns {Promise<Object>} - List of maintainers
   */
  async getAllMaintainers(filters = {}) {
    try {
      const response = await api.get('/maintainers', { 
        params: {
          ...filters,
          pgId: this.getPgIdFromStorage()
        } 
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single maintainer by ID
   * @param {string} maintainerId - ID of the maintainer
   * @returns {Promise<Object>} - Maintainer details
   */
  async getMaintainerById(maintainerId) {
    try {
      const response = await api.get(`/maintainers/${maintainerId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a maintainer
   * @param {string} maintainerId - ID of the maintainer to update
   * @param {Object} updateData - Updated maintainer data
   * @returns {Promise<Object>} - Updated maintainer response
   */
  async updateMaintainer(maintainerId, updateData) {
    try {
      const response = await api.put(`/maintainers/${maintainerId}`, {
        ...updateData,
        pgId: this.getPgIdFromStorage()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Soft delete a maintainer
   * @param {string} maintainerId - ID of the maintainer to soft delete
   * @returns {Promise<Object>} - Soft delete response
   */
  async softDeleteMaintainer(maintainerId) {
    try {
      const response = await api.patch(`/maintainers/${maintainerId}/soft-delete`, {
        pgId: this.getPgIdFromStorage()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a maintainer
   * @param {string} maintainerId - ID of the maintainer to delete
   * @returns {Promise<Object>} - Deletion response
   */
  async deleteMaintainer(maintainerId) {
    try {
      const response = await api.delete(`/maintainers/${maintainerId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Assign branches to a maintainer
   * @param {string} maintainerId - ID of the maintainer
   * @param {string[]} branchIds - Array of branch IDs to assign
   * @returns {Promise<Object>} - Branch assignment response
   */
  async assignBranches(maintainerId, branchIds) {
    try {
      const response = await api.post('/maintainers/assign-branches', {
        maintainerId,
        branchIds
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Remove branches from a maintainer
   * @param {string} maintainerId - ID of the maintainer
   * @param {string[]} branchIds - Array of branch IDs to remove
   * @returns {Promise<Object>} - Branch removal response
   */
  async removeBranches(maintainerId, branchIds) {
    try {
      const response = await api.post('/maintainers/remove-branches', {
        maintainerId,
        branchIds
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get maintainer's assigned branches
   * @returns {Promise<Object>} - List of assigned branches
   */
  async getAssignedBranches() {
    try {
      const response = await api.get('/maintainers/my-branches');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get PG ID from user storage
   * @returns {string|null} - PG ID from user object in localStorage
   */
  getPgIdFromStorage() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.pgId || null;
  }

  /**
   * Handle API errors
   * @param {Object} error - Axios error object
   * @throws {Error} - Throws an error with a user-friendly message
   */
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      const errorMessage = error.response.data.message || 'An error occurred';
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server');
    } else {
      // Something happened in setting up the request
      throw new Error('Error setting up the request');
    }
  }
}

export default new MaintainerService();
