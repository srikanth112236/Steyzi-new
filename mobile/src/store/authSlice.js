import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storage } from '../utils/storage';
import { apiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";

// Helper function to check network connectivity
const checkNetworkConnectivity = async () => {
  try {
    const state = await NetInfo.fetch();
    console.log('Network state for login:', JSON.stringify(state, null, 2));
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
};

// Helper function to check token expiration
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    const payload = JSON.parse(atob(base64));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return true;
  }
};

// Async thunk for checking persistent authentication
export const checkPersistentAuth = createAsyncThunk(
  'auth/checkPersistentAuth',
  async (_, { rejectWithValue }) => {
    try {
      // Check network connectivity first
      const isNetworkAvailable = await checkNetworkConnectivity();
      if (!isNetworkAvailable) {
        return rejectWithValue('No internet connection');
      }

      // Retrieve stored credentials
      const storedCredentials = await storage.getStoredCredentials();
      
      if (!storedCredentials || !storedCredentials.accessToken) {
        return rejectWithValue('No stored credentials');
      }

      // Check if token is expired
      if (isTokenExpired(storedCredentials.accessToken)) {
        // Attempt to refresh token
        const refreshResponse = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            refreshToken: storedCredentials.refreshToken 
          }),
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok) {
          // Clear storage if refresh fails
          await storage.clearAll();
          return rejectWithValue('Token refresh failed');
        }

        // Update stored tokens
        await storage.setTokens(
          refreshData.data.tokens.accessToken, 
          refreshData.data.tokens.refreshToken
        );

        // Return refreshed user data
        return {
          user: storedCredentials.user,
          tokens: refreshData.data.tokens
        };
      }

      // Return existing credentials if token is still valid
      return {
        user: storedCredentials.user,
        tokens: {
          accessToken: storedCredentials.accessToken,
          refreshToken: storedCredentials.refreshToken
        }
      };
    } catch (error) {
      console.error('Persistent auth check failed:', error);
      await storage.clearAll();
      return rejectWithValue(error.message || 'Persistent auth check failed');
    }
  }
);

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Check network connectivity first
      const isNetworkAvailable = await checkNetworkConnectivity();
      if (!isNetworkAvailable) {
        console.log('Network unavailable during login attempt');
        return rejectWithValue('No internet connection. Please check your network settings.');
      }

      console.log('Attempting login:', { email, apiUrl });

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Log full response details
      const responseText = await response.text();
      console.log('Login response:', {
        status: response.status,
        ok: response.ok,
        responseText
      });

      // Parse response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        return rejectWithValue('Invalid server response');
      }

      // Check response status
      if (!response.ok) {
        console.error('Login error response:', {
          status: response.status,
          message: data.message || 'Unknown error'
        });

        return rejectWithValue(data.message || 'Login failed');
      }

      // Validate response data
      if (!data.data?.tokens || !data.data?.user) {
        console.error('Invalid login response structure:', data);
        return rejectWithValue('Invalid login response');
      }

      // Store tokens and user data
      await storage.setTokens(
        data.data.tokens.accessToken, 
        data.data.tokens.refreshToken
      );
      await storage.setUser(data.data.user);

      return data;
    } catch (error) {
      console.error('Login network error:', error);
      
      // Detailed error logging
      if (error instanceof TypeError) {
        console.error('Network request failed. Possible reasons:', {
          networkError: true,
          message: error.message,
          apiUrl: apiUrl
        });
      }

      return rejectWithValue(error.message || 'Network error. Please try again.');
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Check network connectivity
      const isNetworkAvailable = await NetInfo.fetch();
      if (!isNetworkAvailable.isConnected) {
        console.warn('No network connection during logout');
      }

      const accessToken = await storage.getAccessToken();

      // Attempt to call logout endpoint if token exists
      if (accessToken) {
        try {
          const response = await fetch(`${apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          // Log the response for debugging
          console.log('Logout endpoint response:', {
            status: response.status,
            ok: response.ok,
          });
        } catch (networkError) {
          console.warn('Logout network error:', networkError);
          // Continue with clearing storage even if network call fails
        }
      }

      // Always clear storage
      await storage.clearAll();
      await AsyncStorage.clear();

      return true;
    } catch (error) {
      console.error('Logout process error:', error);
      
      // Attempt to clear storage even if an error occurs
      try {
        await storage.clearAll();
        await AsyncStorage.clear();
      } catch (clearError) {
        console.error('Error clearing storage during logout:', clearError);
      }

      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Persistent Auth Check
      .addCase(checkPersistentAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkPersistentAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkPersistentAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.tokens.accessToken;
        state.refreshToken = action.payload.data.tokens.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })

      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
