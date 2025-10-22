import { api } from './auth.service';

class BranchService {
  /**
   * Create a new branch
   * @param {Object} branchData - Branch creation data
   * @returns {Promise<Object>} - Created branch response
   */
  async createBranch(branchData) {
    try {
      const response = await api.post('/branches', branchData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all branches
   * @param {Object} params - Optional query parameters
   * @returns {Promise<Object>} - List of branches
   */
  async getAllBranches(params = {}) {
    try {
      const response = await api.get('/branches', { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get branches by PG ID
   * @param {string} pgId - PG ID to filter branches
   * @returns {Promise<Object>} - List of branches for the specified PG
   */
  async getBranchesByPG(pgId) {
    try {
      const response = await api.get(`/branches/pg/${pgId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get branches with their assigned maintainers
   * @returns {Promise<Object>} - List of branches with maintainer details
   */
  async getBranchesWithMaintainers() {
    try {
      const response = await api.get('/branches/with-maintainers');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a branch
   * @param {string} branchId - ID of the branch to update
   * @param {Object} updateData - Updated branch data
   * @returns {Promise<Object>} - Updated branch response
   */
  async updateBranch(branchId, updateData) {
    try {
      const response = await api.put(`/branches/${branchId}`, updateData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Assign a maintainer to a branch
   * @param {Object} assignmentData - Branch and maintainer IDs
   * @returns {Promise<Object>} - Branch assignment response
   */
  async assignMaintainerToBranch(assignmentData) {
    try {
      const response = await api.post('/branches/assign-maintainer', assignmentData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
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

export default new BranchService();
