import axios from 'axios';
import { store } from '../store/store';
import { clearAuth } from '../store/slices/authSlice';
import { createSubscriptionInterceptor } from '../middleware/subscription.middleware';

// Dynamic API URL detection
const getApiBaseURL = () => {
  // If explicitly set in environment, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Get current hostname
  const hostname = window.location.hostname;
  
  // If accessing via IP address, use the same IP for API
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `http://${hostname}:5000/api`;
  }
  
  // Default to localhost for development
  return 'https://api.steyzi.com/api';
};

// Create axios instance
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies
});

// Log the API URL for debugging
console.log('🌐 API Base URL:', api.defaults.baseURL);

// Apply subscription interceptor
createSubscriptionInterceptor(api);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers if available from localStorage
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add language header
    const state = store.getState();
    const language = state.ui?.language;
    if (language) {
      config.headers['Accept-Language'] = language;
    }

    // Debug: Log request details for debugging
    if (config.method !== 'get') {
      console.log('📡 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: {
          authorization: config.headers.Authorization ? 'Present' : 'Missing',
          'content-type': config.headers['Content-Type']
        },
        dataKeys: config.data ? Object.keys(config.data) : 'No data',
        dataTypes: config.data ? Object.keys(config.data).reduce((acc, key) => {
          acc[key] = typeof config.data[key];
          return acc;
        }, {}) : {}
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'https://api.steyzi.com/api'}/auth/refresh`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            }
          );

          if (response.data.success) {
            // Update tokens in localStorage
            localStorage.setItem('accessToken', response.data.data.token);
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
            
            // Update user in localStorage
            if (response.data.data.user) {
              localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${response.data.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        store.dispatch(clearAuth());
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden:', error.response.data);
    } else if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found:', error.response.data);
    } else if (error.response?.status === 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api; 