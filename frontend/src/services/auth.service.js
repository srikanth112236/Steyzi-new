import axios from 'axios';

// Use direct URL to backend (no proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL 
  || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://api.steyzi.com/api');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track refresh token requests to prevent multiple simultaneous calls
let isRefreshing = false;
let failedQueue = [];
let forcedLogoutInProgress = false;

const decodeTokenPayload = (token) => {
  try {
    if (!token) return null;
    const [, payload = ''] = token.split('.');
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Failed to decode token payload:', error);
    return null;
  }
};

const persistAccessTokenMetadata = ({ accessToken, expiresAt, expiresIn }) => {
  try {
    if (expiresAt) {
      const timestamp = new Date(expiresAt).getTime();
      if (!Number.isNaN(timestamp)) {
        localStorage.setItem('tokenExpiry', timestamp.toString());
        return;
      }
    }

    if (expiresIn) {
      const timestamp = Date.now() + expiresIn * 1000;
      localStorage.setItem('tokenExpiry', timestamp.toString());
      return;
    }

    if (accessToken) {
      const payload = decodeTokenPayload(accessToken);
      if (payload?.exp) {
        localStorage.setItem('tokenExpiry', (payload.exp * 1000).toString());
        return;
      }
    }

    localStorage.removeItem('tokenExpiry');
  } catch (error) {
    console.error('Failed to persist token metadata:', error);
    localStorage.removeItem('tokenExpiry');
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiry');
};

const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const handleForcedLogout = ({ message, status, redirectPath } = {}) => {
  if (forcedLogoutInProgress) {
    return;
  }

  forcedLogoutInProgress = true;
  const storedUser = getStoredUser();
  clearAuthStorage();

  const detail = {
    message: message || 'Your session has expired. Please log in again.',
    status: status || 401,
    reason: 'session_invalid',
    timestamp: new Date().toISOString()
  };

  try {
    window.dispatchEvent(new CustomEvent('tokenExpired', { detail }));
    window.dispatchEvent(new CustomEvent('apiError', { detail }));
  } catch (error) {
    console.error('Failed to dispatch forced logout events:', error);
  }

  const fallbackRedirect = storedUser?.role === 'superadmin' ? '/login' : '/admin/login';
  const targetRedirect = redirectPath || fallbackRedirect;

  if (typeof window !== 'undefined' && window.location) {
    window.location.href = targetRedirect;
  }

  setTimeout(() => {
    forcedLogoutInProgress = false;
  }, 1000);
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔒 401 Unauthorized error detected');
      console.log('📄 Error response:', error.response?.data);
      
      const responseMessage = error.response?.data?.message || '';
      const normalizedMessage = responseMessage.toLowerCase();
      const isInvalidOrExpired = normalizedMessage.includes('invalid token') ||
        normalizedMessage.includes('token expired');
      
      if (isInvalidOrExpired) {
        console.log('🚫 Invalid/expired token detected, forcing logout');
        handleForcedLogout({
          message: responseMessage || 'Your session has expired. Please log in again.',
          status: error.response?.status
        });
        return Promise.reject(error);
      }
      
      // For other 401 errors, try token refresh
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting token refresh...');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await api.post('/auth/refresh', {
          refreshToken,
        });

        const { accessToken, expiresAt, expiresIn } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        persistAccessTokenMetadata({ accessToken, expiresAt, expiresIn });

        console.log('✅ Token refresh successful');
        isRefreshing = false;
        processQueue(null, response.data);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError);
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Get user role to determine redirect path
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const redirectPath = user?.role === 'superadmin' ? '/login' : '/admin/login';
        
        console.log('Token refresh failed, redirecting to:', redirectPath);
        
        // Refresh failed, clear auth and redirect to appropriate login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = redirectPath;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

class AuthService {
  /**
   * Test backend connectivity
   * @returns {Promise<Object>} - Health check result
   */
  async healthCheck() {
    try {
      console.log('🏥 Testing backend health...');
      const response = await axios.get('http://localhost:5000/health');
      console.log('✅ Backend health check successful:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Backend health check failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Register a new superadmin
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register a new support staff
   * @param {Object} userData - Support staff registration data
   * @returns {Promise<Object>} - Registration result
   */
  async registerSupportStaff(userData) {
    try {
      const response = await api.post('/auth/register-support', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} - Login result
   */
  async login(credentials) {
    try {
      console.log('🔍 AuthService: Starting login...');
      console.log('📧 Credentials:', { email: credentials.email, password: '***' });
      console.log('🌐 API URL:', API_BASE_URL);
      
      const response = await api.post('/auth/login', credentials);
      console.log('📡 Login response:', {
        status: response.status,
        success: response.data.success,
        hasUser: !!response.data.data?.user,
        hasTokens: !!response.data.data?.tokens
      });
      
      if (response.data.success && response.data.data.tokens) {
        console.log('✅ Login successful, storing tokens in localStorage');
        // Store tokens in localStorage
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        persistAccessTokenMetadata(response.data.data.tokens);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        console.log('💾 Tokens stored in localStorage');
        console.log('🔑 Access token length:', response.data.data.tokens.accessToken.length);
        console.log('🔄 Refresh token length:', response.data.data.tokens.refreshToken.length);
      } else {
        console.log('❌ Login response missing tokens');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      console.error('❌ Error response:', error.response?.data);
      throw this.handleError(error);
    }
  }

  /**
   * Login sales manager
   * @param {Object} credentials - Login credentials (identifier can be email or unique ID)
   * @returns {Promise<Object>} - Login result
   */
  async loginSalesManager(credentials) {
    try {
      console.log('🔍 AuthService: Starting sales manager login...');
      console.log('📧 Credentials:', { identifier: credentials.identifier, password: '***' });

      const response = await api.post('/auth/sales-login', credentials);
      console.log('📡 Sales Manager Login response:', {
        status: response.status,
        success: response.data.success,
        hasUser: !!response.data.data?.user,
        hasTokens: !!response.data.data?.tokens
      });

      if (response.data.success && response.data.data.tokens) {
        console.log('✅ Sales Manager login successful, storing tokens in localStorage');
        // Store tokens in localStorage
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        persistAccessTokenMetadata(response.data.data.tokens);

        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        console.log('💾 Sales Manager tokens stored in localStorage');
      } else {
        console.log('❌ Sales Manager login response missing tokens');
      }

      return response.data;
    } catch (error) {
      console.error('❌ AuthService: Sales Manager Login error:', error);
      console.error('❌ Error response:', error.response?.data);
      throw this.handleError(error);
    }
  }

  /**
   * Login support staff
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} - Login result
   */
  async supportLogin(credentials) {
    try {
      console.log('🔍 AuthService: Starting support login...');
      console.log('📧 Credentials:', { email: credentials.email, password: '***' });
      console.log('🌐 API URL:', API_BASE_URL);
      
      const response = await api.post('/auth/support-login', credentials);
      console.log('📡 Support login response:', {
        status: response.status,
        success: response.data.success,
        hasUser: !!response.data.data?.user,
        hasTokens: !!response.data.data?.tokens
      });
      
      if (response.data.success && response.data.data.tokens) {
        console.log('✅ Support login successful, storing tokens in localStorage');
        // Store tokens in localStorage
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        persistAccessTokenMetadata(response.data.data.tokens);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        console.log('💾 Tokens stored in localStorage');
        console.log('🔑 Access token length:', response.data.data.tokens.accessToken.length);
        console.log('🔄 Refresh token length:', response.data.data.tokens.refreshToken.length);
      } else {
        console.log('❌ Support login response missing tokens');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ AuthService: Support login error:', error);
      console.error('❌ Error response:', error.response?.data);
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} - Logout result
   */
  async logout() {
    try {
      // Check if token exists and is valid before making API call
      const token = this.getAccessToken();
      if (!token) {
        // No token to logout, just clear localStorage
        this.clearAuth();
        return { success: true, message: 'Logged out successfully' };
      }

      // Try to make logout API call
      const response = await api.post('/auth/logout');
      
      // Clear localStorage
      this.clearAuth();
      
      return response.data;
    } catch (error) {
      console.log('Logout API call failed, clearing auth data:', error.message);
      // Even if logout fails, clear localStorage
      this.clearAuth();
      return { success: true, message: 'Logged out successfully' };
    }
  }

  /**
   * Send forgot password email
   * @param {string} email - User email
   * @returns {Promise<Object>} - Forgot password result
   */
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} - Reset password result
   */
  async resetPassword(token, password) {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword: password,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify email with credentials
   * @param {Object} credentials - Verification credentials
   * @returns {Promise<Object>} - Email verification result
   */
  async verifyEmail(credentials) {
    try {
      const response = await api.post('/auth/verify-email', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend email verification
   * @param {string} email - User email
   * @returns {Promise<Object>} - Resend verification result
   */
  async resendVerification(email) {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} - User profile
   */
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} - Update result
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update stored user data
      if (response.data.success && response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user info
   * @returns {Promise<Object>} - Current user info
   */
  async getCurrentUser() {
    try {
      console.log('🌐 Making API call to /auth/me...');
      const response = await api.get('/auth/me');
      console.log('✅ API response:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ API call failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return false;
    }

    try {
      // Decode JWT token to check if it's expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired (with 30 second buffer)
      const isExpired = payload.exp < (currentTime - 30);
      
      if (isExpired) {
        console.log('🔍 Token is expired, clearing auth data');
        
        // Dispatch token expiry event
        const tokenExpiryEvent = new CustomEvent('tokenExpired', {
          detail: {
            message: 'Your session has expired. Please log in again.',
            reason: 'token_expired',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(tokenExpiryEvent);
        
        this.clearAuth();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      // If we can't decode the token, clear auth and return false
      this.clearAuth();
      return false;
    }
  }

  /**
   * Get current user from localStorage
   * @returns {Object|null} - Current user or null
   */
  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get access token from localStorage
   * @returns {string|null} - Access token or null
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get refresh token from localStorage
   * @returns {string|null} - Refresh token or null
   */
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Clear all authentication data
   */
  clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error
   * @returns {Error} - Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { data, status } = error.response;
      
      if (data && data.message) {
        return new Error(data.message);
      }
      
      switch (status) {
        case 400:
          return new Error('Bad request. Please check your input.');
        case 401:
          return new Error('Authentication failed. Please log in again.');
        case 403:
          return new Error('Access denied. You do not have permission.');
        case 404:
          return new Error('Resource not found.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error('An unexpected error occurred.');
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result
   */
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    const isValid = password.length >= minLength && 
                   hasUpperCase && 
                   hasLowerCase && 
                   hasNumbers && 
                   hasSpecialChar;

    return {
      isValid,
      errors: {
        minLength: password.length < minLength,
        hasUpperCase: !hasUpperCase,
        hasLowerCase: !hasLowerCase,
        hasNumbers: !hasNumbers,
        hasSpecialChar: !hasSpecialChar,
      }
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Validation result
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Validation result
   */
  validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Get all support staff members
   * @returns {Promise<Object>} - Support staff list
   */
  async getSupportStaff() {
    try {
      const response = await api.get('/auth/support-staff');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a user (superadmin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user information
   * @param {string} userId - User ID to update
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Update result
   */
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user status (activate/deactivate)
   * @param {string} userId - User ID to update
   * @param {boolean} isActive - New status
   * @returns {Promise<Object>} - Update result
   */
  async updateUserStatus(userId, isActive) {
    try {
      const response = await api.patch(`/auth/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export default new AuthService();
export { api }; 