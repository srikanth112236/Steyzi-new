import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔍 Redux: Login action dispatched');
      console.log('📧 Credentials:', { email: credentials.email, password: '***' });

      const response = await authService.login(credentials);
      console.log('✅ Redux: Login successful', {
        success: response.success,
        hasUser: !!response.data?.user,
        hasTokens: !!response.data?.tokens
      });

      return response;
    } catch (error) {
      console.error('❌ Redux: Login failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const loginSalesManager = createAsyncThunk(
  'auth/loginSalesManager',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('🔍 Redux: Sales Manager Login action dispatched');
      console.log('📧 Credentials:', { identifier: credentials.identifier, password: '***' });

      const response = await authService.loginSalesManager(credentials);
      console.log('✅ Redux: Sales Manager Login successful', {
        success: response.success,
        hasUser: !!response.data?.user,
        hasTokens: !!response.data?.tokens
      });

      return response;
    } catch (error) {
      console.error('❌ Redux: Sales Manager Login failed:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.logout();
      return response;
    } catch (error) {
      // Even if logout fails, we should still clear the auth state
      console.log('Logout failed, but clearing auth state:', error.message);
      return { success: true, message: 'Logged out successfully' };
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(token, password);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.resendVerification(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  user: authService.getCurrentUserFromStorage(),
  isAuthenticated: authService.isAuthenticated(), // Check if access token exists in localStorage
  isLoading: false,
  error: null,
  success: null,
  subscription: null, // Add subscription info to state
  // Form states
  isRegistering: false,
  isLoggingIn: false,
  isLoggingOut: false,
  isSendingForgotPassword: false,
  isResettingPassword: false,
  isVerifyingEmail: false,
  isResendingVerification: false,
  isUpdatingProfile: false,
  // Success messages
  registerSuccess: null,
  loginSuccess: null,
  logoutSuccess: null,
  forgotPasswordSuccess: null,
  resetPasswordSuccess: null,
  verifyEmailSuccess: null,
  resendVerificationSuccess: null,
  updateProfileSuccess: null,
  // Add new fields to initial state
  onboardingCompleted: false,
  defaultBranch: false,
  defaultBranchId: null,
  pgConfigured: false,
  pgId: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear messages
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
      state.registerSuccess = null;
      state.loginSuccess = null;
      state.logoutSuccess = null;
      state.forgotPasswordSuccess = null;
      state.resetPasswordSuccess = null;
      state.verifyEmailSuccess = null;
      state.resendVerificationSuccess = null;
      state.updateProfileSuccess = null;
    },
    // Update password changed status
    updatePasswordChanged: (state) => {
      if (state.user) {
        state.user.passwordChanged = true;
        state.user.forcePasswordChange = false;
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    // Update auth state partially
    updateAuthState(state, action) {
      // Merge the payload with existing state
      Object.keys(action.payload).forEach(key => {
        state[key] = action.payload[key];
      });
    },
    // Clear all auth state
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.success = null;
      state.registerSuccess = null;
      state.loginSuccess = null;
      state.logoutSuccess = null;
      state.forgotPasswordSuccess = null;
      state.resetPasswordSuccess = null;
      state.verifyEmailSuccess = null;
      state.resendVerificationSuccess = null;
      state.updateProfileSuccess = null;
    },
    // Set user from localStorage
    setUserFromStorage: (state) => {
      const user = authService.getCurrentUserFromStorage();
      state.user = user;
      state.isAuthenticated = !!user;
    },
    // Update user theme
    updateUserTheme: (state, action) => {
      if (state.user) {
        state.user.theme = action.payload;
      }
    },
    // Update user language
    updateUserLanguage: (state, action) => {
      if (state.user) {
        state.user.language = action.payload;
      }
    },
    // Update subscription from subscription manager
    updateSubscriptionFromManager: (state, action) => {
      state.subscription = action.payload;
      // Also update user subscription if user object exists
      if (state.user) {
        state.user.subscription = action.payload;
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(state.user));
      }
      console.log('🔄 Subscription updated from manager:', action.payload);
    },
    // Clear auth state completely
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoggingIn = false;
      state.isLoggingOut = false;
      state.isRegistering = false;
      state.isSendingForgotPassword = false;
      state.isResettingPassword = false;
      state.isVerifyingEmail = false;
      state.isSendingVerification = false;
      state.isGettingProfile = false;
      state.isUpdatingProfile = false;
      state.isGettingCurrentUser = false;
      state.error = null;
      state.loginSuccess = null;
      state.logoutSuccess = null;
      state.registerSuccess = null;
      state.forgotPasswordSuccess = null;
      state.resetPasswordSuccess = null;
      state.verifyEmailSuccess = null;
      state.resendVerificationSuccess = null;
      state.updateProfileSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isRegistering = true;
        state.error = null;
        state.registerSuccess = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.registerSuccess = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.isRegistering = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true;
        state.error = null;
        state.loginSuccess = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('✅ Redux: Login fulfilled reducer called');
        console.log('📊 Action payload:', {
          success: action.payload.success,
          hasUser: !!action.payload.data?.user,
          hasTokens: !!action.payload.data?.tokens,
          hasSubscription: !!action.payload.data?.user?.subscription
        });

        state.isLoggingIn = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
        state.loginSuccess = action.payload.message;
        state.subscription = action.payload.data.user.subscription; // Store subscription info from user object

        // Set new onboarding fields from user object
        state.onboardingCompleted = action.payload.data?.user?.onboarding_completed || false;
        state.defaultBranch = action.payload.data?.user?.default_branch || false;
        state.defaultBranchId = action.payload.data?.user?.default_branch_id || null;
        state.pgConfigured = action.payload.data?.user?.pg_configured || false;
        state.pgId = action.payload.data?.user?.pgId || null;

        console.log('✅ Redux: State updated', {
          isAuthenticated: state.isAuthenticated,
          hasUser: !!state.user,
          loginSuccess: state.loginSuccess,
          subscription: state.subscription
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoggingOut = true;
        state.error = null;
        state.logoutSuccess = null;
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.isLoggingOut = false;
        state.user = null;
        state.isAuthenticated = false;
        state.logoutSuccess = action.payload.message;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoggingOut = false;
        state.error = action.payload;
        // Even if logout fails, clear user state
        state.user = null;
        state.isAuthenticated = false;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isSendingForgotPassword = true;
        state.error = null;
        state.forgotPasswordSuccess = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isSendingForgotPassword = false;
        state.forgotPasswordSuccess = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isSendingForgotPassword = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isResettingPassword = true;
        state.error = null;
        state.resetPasswordSuccess = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isResettingPassword = false;
        state.resetPasswordSuccess = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isResettingPassword = false;
        state.error = action.payload;
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isVerifyingEmail = true;
        state.error = null;
        state.verifyEmailSuccess = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isVerifyingEmail = false;
        state.verifyEmailSuccess = action.payload.message;
        // Update user email verification status
        if (state.user) {
          state.user.isEmailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isVerifyingEmail = false;
        state.error = action.payload;
      })
      // Resend Verification
      .addCase(resendVerification.pending, (state) => {
        state.isResendingVerification = true;
        state.error = null;
        state.resendVerificationSuccess = null;
      })
      .addCase(resendVerification.fulfilled, (state, action) => {
        state.isResendingVerification = false;
        state.resendVerificationSuccess = action.payload.message;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.isResendingVerification = false;
        state.error = action.payload;
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isUpdatingProfile = true;
        state.error = null;
        state.updateProfileSuccess = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.user = action.payload.data.user;
        state.updateProfileSuccess = action.payload.message;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.error = action.payload;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Login Sales Manager
      .addCase(loginSalesManager.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginSalesManager.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginSalesManager.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

// Export actions
export const {
  clearError,
  clearSuccess,
  clearAuth,
  setUserFromStorage,
  updateUserTheme,
  updateUserLanguage,
  updatePasswordChanged,
  updateSubscriptionFromManager,
  updateAuthState,
} = authSlice.actions;

// Export selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectSuccess = (state) => state.auth.success;
export const selectSubscription = (state) => state.auth.subscription;
export const selectOnboardingCompleted = (state) => state.auth.onboardingCompleted;
export const selectDefaultBranch = (state) => state.auth.defaultBranch || false;
export const selectDefaultBranchId = (state) => state.auth.defaultBranchId;
export const selectPgConfigured = (state) => state.auth.pgConfigured || false;
export const selectPgId = (state) => state.auth.pgId;

// Export reducer
export default authSlice.reducer; 