import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const storage = {
  // Store tokens securely
  setTokens: async (accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  },

  // Retrieve tokens
  getAccessToken: async () => {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  },

  getRefreshToken: async () => {
    try {
      return await SecureStore.getItemAsync('refreshToken');
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  },

  // Store user data
  setUser: async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  },

  // Retrieve user data
  getUser: async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  // Retrieve stored credentials
  getStoredCredentials: async () => {
    try {
      const accessToken = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();
      const user = await storage.getUser();

      if (accessToken && refreshToken && user) {
        return { accessToken, refreshToken, user };
      }

      return null;
    } catch (error) {
      console.error('Error retrieving stored credentials:', error);
      return null;
    }
  },

  // Clear all stored data
  clearAll: async () => {
    try {
      // Remove tokens from Secure Store
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');

      // Remove user data from Async Storage
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('appTheme');
      await AsyncStorage.removeItem('showTrialModal');

      console.log('All storage data cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
