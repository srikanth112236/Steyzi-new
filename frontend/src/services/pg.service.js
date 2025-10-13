import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class PGService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/pg`,
      withCredentials: true
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
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Test authentication and user role
  async testAuth() {
    try {
      const response = await this.api.get('/test-auth');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Test user data from database
  async testDbUser(email) {
    try {
      const response = await this.api.get(`/test-db-user/${email}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Test simple endpoint without auth
  async testSimple() {
    try {
      const response = await this.api.get('/test-simple');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Test email functionality
  async testEmail(email) {
    try {
      const response = await this.api.post('/test-email', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create a new PG (superadmin)
  async createPG(pgData) {
    try {
      const response = await this.api.post('/', pgData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create a new PG (sales users)
  async createPGSales(pgData) {
    try {
      const response = await this.api.post('/sales-create', pgData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get PGs for sales users (only shows PGs they created)
  async getSalesPGs(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await this.api.get(`/sales-list?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get PG statistics for sales users (only PGs they created)
  async getSalesPGStats() {
    try {
      const response = await this.api.get('/sales-stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all PGs with filters
  async getAllPGs(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await this.api.get(`/?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get PG by ID
  async getPGById(pgId) {
    try {
      const response = await this.api.get(`/${pgId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update PG
  async updatePG(pgId, updateData) {
    try {
      const response = await this.api.put(`/${pgId}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete PG
  async deletePG(pgId) {
    try {
      const response = await this.api.delete(`/${pgId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get PG statistics
  async getPGStats(pgId = null) {
    try {
      // If no pgId is provided, use the global stats endpoint
      const url = pgId ? `/stats/${pgId}` : '/stats';
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      // Use the error handling method to standardize error responses
      throw this.handleError(error);
    }
  }

  // Search PGs
  async searchPGs(searchTerm, filters = {}) {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        ...filters
      });

      const response = await this.api.get(`/search?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get PGs by location
  async getPGsByLocation(city, state) {
    try {
      const params = new URLSearchParams({ city, state });
      const response = await this.api.get(`/location?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get PG analytics
  async getPGAnalytics(pgId, period = 'month') {
    try {
      const params = new URLSearchParams({ period });
      const response = await this.api.get(`/${pgId}/analytics?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload PG image
  async uploadImage(pgId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await this.api.post(`/${pgId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete PG image
  async deleteImage(pgId, imageId) {
    try {
      const response = await this.api.delete(`/${pgId}/images/${imageId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get PG dashboard data
  async getPGDashboard(pgId) {
    try {
      const response = await this.api.get(`/${pgId}/dashboard`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Export PG data
  async exportPGData(pgId, format = 'pdf') {
    try {
      const params = new URLSearchParams({ format });
      const response = await this.api.get(`/${pgId}/export?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Add sample data (for development/testing)
  async addSampleData() {
    try {
      const response = await this.api.post('/sample/add');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Clear sample data (for development/testing)
  async clearSampleData() {
    try {
      const response = await this.api.delete('/sample/clear');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Configure PG Sharing Types
   * @param {string} pgId - PG ID to configure
   * @param {Array} sharingTypes - Array of sharing types to configure
   * @returns {Promise<Object>} - Configuration result
   */
  async configureSharingTypes(pgId, sharingTypes) {
    try {
      const response = await this.api.post('/configure-sharing-types', {
        pgId,
        sharingTypes
      });

      return response.data;
    } catch (error) {
      console.error('Error configuring PG sharing types:', error);
      throw error;
    }
  }

  /**
   * Get default sharing types
   * @returns {Array} - Default sharing types
   */
  getDefaultSharingTypes() {
    return [
      {
        type: '1-sharing',
        name: 'Single Occupancy',
        description: 'Private room with single bed',
        cost: 8000,
        isCustom: false
      },
      {
        type: '2-sharing',
        name: 'Double Occupancy',
        description: 'Room shared between two residents',
        cost: 6000,
        isCustom: false
      },
      {
        type: '3-sharing',
        name: 'Triple Occupancy',
        description: 'Room shared between three residents',
        cost: 5000,
        isCustom: false
      },
      {
        type: '4-sharing',
        name: 'Quad Occupancy',
        description: 'Room shared between four residents',
        cost: 4000,
        isCustom: false
      }
    ];
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      const { data, status } = error.response;
      return {
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
        statusCode: status
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        statusCode: 0
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        statusCode: 500
      };
    }
  }

  // Validate PG data
  validatePGData(data) {
    const errors = [];

    // Required fields
    if (!data.name?.trim()) {
      errors.push({ field: 'name', message: 'PG name is required' });
    }

    if (!data.address?.street?.trim()) {
      errors.push({ field: 'address.street', message: 'Street address is required' });
    }

    if (!data.address?.city?.trim()) {
      errors.push({ field: 'address.city', message: 'City is required' });
    }

    if (!data.address?.state?.trim()) {
      errors.push({ field: 'address.state', message: 'State is required' });
    }

    if (!data.address?.pincode?.trim()) {
      errors.push({ field: 'address.pincode', message: 'Pincode is required' });
    } else if (!/^\d{6}$/.test(data.address.pincode)) {
      errors.push({ field: 'address.pincode', message: 'Pincode must be 6 digits' });
    }

    if (!data.contact?.phone?.trim()) {
      errors.push({ field: 'contact.phone', message: 'Phone number is required' });
    } else if (!/^\d{10}$/.test(data.contact.phone)) {
      errors.push({ field: 'contact.phone', message: 'Phone number must be 10 digits' });
    }

    if (!data.contact?.email?.trim()) {
      errors.push({ field: 'contact.email', message: 'Email is required' });
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.contact.email)) {
      errors.push({ field: 'contact.email', message: 'Please enter a valid email' });
    }

    // Validate alternate phone if provided
    if (data.contact?.alternatePhone?.trim() && !/^\d{10}$/.test(data.contact.alternatePhone)) {
      errors.push({ field: 'contact.alternatePhone', message: 'Alternate phone number must be 10 digits' });
    }

    // Validate status
    const validStatuses = [
      'active', 
      'inactive', 
      'maintenance', 
      'full', 
      'under_renovation', 
      'pending_approval', 
      'suspended', 
      'closed', 
      'limited_occupancy'
    ];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.push({ field: 'status', message: 'Invalid PG status' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format PG data for API submission
  formatPGDataForAPI(data) {
    return {
      name: data.name?.trim(),
      description: data.description?.trim() || '',
      address: {
        street: data.address?.street?.trim() || '',
        city: data.address?.city?.trim() || '',
        state: data.address?.state?.trim() || '',
        pincode: data.address?.pincode?.trim() || '',
        landmark: data.address?.landmark?.trim() || ''
      },
      contact: {
        phone: data.contact?.phone?.trim() || '',
        email: data.contact?.email?.trim() || '',
        alternatePhone: data.contact?.alternatePhone?.trim() || ''
      },
      property: {
        type: data.property?.type || 'Gents PG'
      },
      status: data.status || 'active', // Add status with default
      ...(data.salesManager && { salesManager: data.salesManager }),
      ...(data.salesStaff && { salesStaff: data.salesStaff })
    };
  }

  // Format PG data for display
  formatPGData(pg) {
    return {
      ...pg,
      formattedAddress: `${pg.address.street}, ${pg.address.city}, ${pg.address.state} - ${pg.address.pincode}`,
      formattedContact: `${pg.contact.phone} | ${pg.contact.email}`,
      occupancyRate: pg.occupancyRate || 0,
      isAvailable: pg.status === 'active' && pg.property.availableRooms > 0,
      amenitiesList: pg.property.amenities?.join(', ') || 'No amenities listed',
      status: pg.status || 'active' // Ensure status is always present
    };
  }

  // Get room type options
  getRoomTypeOptions() {
    return [
      { value: 'Single', label: 'Single Room' },
      { value: 'Double', label: 'Double Room' },
      { value: 'Triple', label: 'Triple Room' },
      { value: 'Dormitory', label: 'Dormitory' }
    ];
  }

  // Get property type options
  getPropertyTypeOptions() {
    return [
      { value: 'Gents PG', label: 'Gents PG' },
      { value: 'Ladies PG', label: 'Ladies PG' },
      { value: 'Coliving PG', label: 'Coliving PG' },
      { value: 'PG', label: 'PG' },
      { value: 'Hostel', label: 'Hostel' },
      { value: 'Apartment', label: 'Apartment' },
      { value: 'Independent', label: 'Independent' }
    ];
  }

  // Get amenity options
  getAmenityOptions() {
    return [
      { value: 'WiFi', label: 'WiFi' },
      { value: 'AC', label: 'Air Conditioning' },
      { value: 'Food', label: 'Food Included' },
      { value: 'Laundry', label: 'Laundry' },
      { value: 'Cleaning', label: 'Cleaning Service' },
      { value: 'Security', label: 'Security' },
      { value: 'Parking', label: 'Parking' },
      { value: 'Gym', label: 'Gym' },
      { value: 'TV', label: 'TV' },
      { value: 'Refrigerator', label: 'Refrigerator' },
      { value: 'Geyser', label: 'Geyser' },
      { value: 'Furnished', label: 'Furnished' }
    ];
  }

  // Get status options
  getStatusOptions() {
    return [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
      { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
      { value: 'full', label: 'Full', color: 'red' },
      { value: 'under_renovation', label: 'Under Renovation', color: 'orange' },
      { value: 'pending_approval', label: 'Pending Approval', color: 'blue' },
      { value: 'suspended', label: 'Suspended', color: 'red' },
      { value: 'closed', label: 'Closed', color: 'gray' },
      { value: 'limited_occupancy', label: 'Limited Occupancy', color: 'purple' }
    ];
  }
}

export default new PGService(); 