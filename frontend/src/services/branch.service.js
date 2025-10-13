import axios from 'axios';
import { getAuthToken } from '../utils/auth';

class BranchService {
  constructor() {
    this.api = axios.create({
      baseURL: '/api/branches',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async createBranch(branchData) {
    try {
      // Validate input
      if (!branchData) {
        throw new Error('Branch data is required');
      }

      // Validate required fields
      const requiredFields = ['pgId', 'name', 'address', 'maintainer', 'contact'];
      for (const field of requiredFields) {
        if (!branchData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate nested fields
      const addressFields = ['street', 'city', 'state', 'pincode'];
      for (const field of addressFields) {
        if (!branchData.address[field]) {
          throw new Error(`Missing required address field: ${field}`);
        }
      }

      const maintainerFields = ['name', 'mobile', 'email'];
      for (const field of maintainerFields) {
        if (!branchData.maintainer[field]) {
          throw new Error(`Missing required maintainer field: ${field}`);
        }
      }

      const contactFields = ['phone', 'email'];
      for (const field of contactFields) {
        if (!branchData.contact[field]) {
          throw new Error(`Missing required contact field: ${field}`);
        }
      }

      const response = await this.api.post('/', branchData);
      // Log the full response for debugging
      console.log('Branch Creation Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating branch:', error);
      // Handle axios/network errors
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Server error response:', error.response.data);
        return {
          success: false,
          message: error.response.data.message || 'Failed to create branch',
          error: error.response.data.error || error.message
        };
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        return {
          success: false,
          message: 'No response from server',
          error: error.message
        };
      } else {
        // Something happened in setting up the request
        console.error('Error setting up branch creation request:', error.message);
        return {
          success: false,
          message: 'Error preparing branch creation request',
          error: error.message
        };
      }
    }
  }

  async getBranchesByPG(pgId) {
    try {
      // Validate pgId
      if (!pgId) {
        throw new Error('PG ID is required');
      }

      const response = await this.api.get(`/pg/${pgId}`);
      
      // Log the full response for debugging
      console.log('Branches Fetch Response:', response.data);
      
      return {
        success: true,
        data: response.data.branches || []
      };
    } catch (error) {
      console.error('Error fetching branches:', error);
      
      // Handle axios/network errors
      if (error.response) {
        console.error('Server error response:', error.response.data);
        return {
          success: false,
          message: error.response.data.message || 'Failed to fetch branches',
          error: error.response.data.error || error.message
        };
      } else if (error.request) {
        console.error('No response received:', error.request);
        return {
          success: false,
          message: 'No response from server',
          error: error.message
        };
      } else {
        console.error('Error setting up branches fetch request:', error.message);
        return {
          success: false,
          message: 'Error preparing branches fetch request',
          error: error.message
        };
      }
    }
  }

  async setDefaultBranch(branchId) {
    try {
      // Validate branchId
      if (!branchId) {
        throw new Error('Branch ID is required');
      }

      const response = await this.api.patch(`/${branchId}/default`);
      
      // Log the full response for debugging
      console.log('Set Default Branch Response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error setting default branch:', error);
      
      // Handle axios/network errors
      if (error.response) {
        console.error('Server error response:', error.response.data);
        return {
          success: false,
          message: error.response.data.message || 'Failed to set default branch',
          error: error.response.data.error || error.message
        };
      } else if (error.request) {
        console.error('No response received:', error.request);
        return {
          success: false,
          message: 'No response from server',
          error: error.message
        };
      } else {
        console.error('Error setting up default branch request:', error.message);
        return {
          success: false,
          message: 'Error preparing default branch request',
          error: error.message
        };
      }
    }
  }

  async updateBranch(branchId, branchData) {
    try {
      // Validate inputs
      if (!branchId) {
        throw new Error('Branch ID is required');
      }
      if (!branchData) {
        throw new Error('Branch data is required');
      }

      const response = await this.api.put(`/${branchId}`, branchData);
      
      // Log the full response for debugging
      console.log('Branch Update Response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating branch:', error);
      
      // Handle axios/network errors
      if (error.response) {
        console.error('Server error response:', error.response.data);
        return {
          success: false,
          message: error.response.data.message || 'Failed to update branch',
          error: error.response.data.error || error.message
        };
      } else if (error.request) {
        console.error('No response received:', error.request);
        return {
          success: false,
          message: 'No response from server',
          error: error.message
        };
      } else {
        console.error('Error setting up branch update request:', error.message);
        return {
          success: false,
          message: 'Error preparing branch update request',
          error: error.message
        };
      }
    }
  }

  async deleteBranch(branchId) {
    try {
      // Validate branchId
      if (!branchId) {
        throw new Error('Branch ID is required');
      }

      const response = await this.api.delete(`/${branchId}`);
      
      // Log the full response for debugging
      console.log('Branch Delete Response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting branch:', error);
      
      // Handle axios/network errors
      if (error.response) {
        console.error('Server error response:', error.response.data);
        return {
          success: false,
          message: error.response.data.message || 'Failed to delete branch',
          error: error.response.data.error || error.message
        };
      } else if (error.request) {
        console.error('No response received:', error.request);
        return {
          success: false,
          message: 'No response from server',
          error: error.message
        };
      } else {
        console.error('Error setting up branch delete request:', error.message);
        return {
          success: false,
          message: 'Error preparing branch delete request',
          error: error.message
        };
      }
    }
  }
}

export default new BranchService();
