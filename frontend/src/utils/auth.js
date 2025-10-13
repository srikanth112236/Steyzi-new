/**
 * Auth utility functions
 */

/**
 * Get authentication token from localStorage
 * @returns {string|null} - Access token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Set authentication token in localStorage
 * @param {string} token - Access token to store
 */
export const setAuthToken = (token) => {
  localStorage.setItem('accessToken', token);
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = () => {
  localStorage.removeItem('accessToken');
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} - Refresh token or null
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Set refresh token in localStorage
 * @param {string} token - Refresh token to store
 */
export const setRefreshToken = (token) => {
  localStorage.setItem('refreshToken', token);
};

/**
 * Remove refresh token from localStorage
 */
export const removeRefreshToken = () => {
  localStorage.removeItem('refreshToken');
};
