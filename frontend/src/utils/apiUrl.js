/**
 * Get the API base URL based on environment
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  // If explicitly set in environment, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use direct URL to backend (no proxy)
  if (import.meta.env.DEV) {
    return 'https://api.steyzi.com/api';
  }
  
  // In production, use production API URL
  return 'https://api.steyzi.com/api';
};

/**
 * Get the API base URL without /api suffix (for Socket.IO, etc.)
 * @returns {string} The API base URL without /api
 */
export const getApiBaseUrlWithoutApi = () => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api$/, '');
};

