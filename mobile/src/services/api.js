import axios from 'axios';
import { storage } from '../utils/storage';
import { apiUrl } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const accessToken = await storage.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshTokenValue = await storage.getRefreshToken();

        if (refreshTokenValue) {
          const refreshResponse = await axios.post(`${apiUrl}/auth/refresh`, {
            refreshToken: refreshTokenValue,
          });

          if (refreshResponse.data.success) {
            const newAccessToken = refreshResponse.data.data.tokens.accessToken;
            const newRefreshToken = refreshResponse.data.data.tokens.refreshToken;

            // Update stored tokens
            await storage.setTokens(newAccessToken, newRefreshToken);

            // Update axios header
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/me'),
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  updateProfile: (data) => api.put('/auth/profile', data),
};


export default api;