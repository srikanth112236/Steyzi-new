import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscription.service';
import api from '../../services/api';

/**
 * Subscription Slice
 * Manages user's subscription plan and restrictions
 */

// Async thunks
export const fetchUserSubscription = createAsyncThunk(
  'subscription/fetchUserSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/my-subscription');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }
);

export const selectSubscriptionPlan = createAsyncThunk(
  'subscription/selectPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/select-subscription', planData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to select subscription');
    }
  }
);

export const fetchAvailablePlans = createAsyncThunk(
  'subscription/fetchAvailablePlans',
  async (userContext = {}, { rejectWithValue, getState }) => {
    try {
      // Check if we have cached plans that are less than 5 minutes old
      const state = getState();
      const cacheAge = state.subscription.plansCacheTime ?
        Date.now() - state.subscription.plansCacheTime : Infinity;

      if (state.subscription.availablePlans.length > 0 && cacheAge < 5 * 60 * 1000) {
        // Return cached data
        return state.subscription.availablePlans;
      }

      // Use provided user context or fallback to state
      const user = {
        role: userContext.role || state.auth.user?.role || 'admin',
        pgId: userContext.pgId || state.auth.user?.pgId,
        email: userContext.email || state.auth.user?.email
      };

      const response = await subscriptionService.getActivePlans(user);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
    }
  }
);

const initialState = {
  // Current subscription
  currentPlan: null,
  subscriptionStatus: 'free', // free, active, trial, expired
  selectedPlanId: null,
  
  // Available plans
  availablePlans: [],
  plansCacheTime: null,

  // Restrictions
  restrictions: {
    maxBeds: 0,
    enabledModules: [],
    enabledFeatures: [],
  },
  
  // Usage tracking
  currentUsage: {
    bedsUsed: 0,
    branchesUsed: 0,
  },
  
  // Subscription dates
  subscriptionStartDate: null,
  subscriptionEndDate: null,
  trialEndDate: null,
  
  // Loading states
  loading: false,
  plansLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setCurrentPlan: (state, action) => {
      state.currentPlan = action.payload;
      if (action.payload) {
        state.selectedPlanId = action.payload._id;
        state.restrictions = {
          maxBeds: action.payload.maxBedsAllowed || action.payload.baseBedCount,
          enabledModules: action.payload.modules?.filter(m => m.enabled).map(m => m.moduleName) || [],
          enabledFeatures: action.payload.features?.filter(f => f.enabled).map(f => f.name) || [],
        };
      }
    },
    
    setSubscriptionStatus: (state, action) => {
      state.subscriptionStatus = action.payload;
    },
    
    setCurrentUsage: (state, action) => {
      state.currentUsage = {
        ...state.currentUsage,
        ...action.payload,
      };
    },
    
    updateBedsUsed: (state, action) => {
      state.currentUsage.bedsUsed = action.payload;
    },
    
    clearSubscription: (state) => {
      return initialState;
    },
    
    setSubscriptionDates: (state, action) => {
      state.subscriptionStartDate = action.payload.startDate;
      state.subscriptionEndDate = action.payload.endDate;
      state.trialEndDate = action.payload.trialEndDate;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch user subscription
      .addCase(fetchUserSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlan = action.payload.plan;
        state.selectedPlanId = action.payload.planId;
        state.subscriptionStatus = action.payload.status;
        state.subscriptionStartDate = action.payload.startDate;
        state.subscriptionEndDate = action.payload.endDate;
        state.trialEndDate = action.payload.trialEndDate;
        state.currentUsage = action.payload.usage || state.currentUsage;
        
        // Set restrictions (use backend-provided restrictions if available)
        if (action.payload.restrictions) {
          state.restrictions = {
            maxBeds: action.payload.restrictions.maxBeds,
            enabledModules: action.payload.restrictions.modules?.filter(m => m.enabled).map(m => m.moduleName) || [],
            enabledFeatures: action.payload.restrictions.features?.filter(f => f.enabled).map(f => f.name) || [],
          };
        } else if (action.payload.plan) {
          // Fallback to plan data
          const maxBeds = action.payload.customPricing?.maxBedsAllowed || 
                         action.payload.plan.maxBedsAllowed || 
                         action.payload.plan.baseBedCount;
          state.restrictions = {
            maxBeds: maxBeds,
            enabledModules: action.payload.plan.modules?.filter(m => m.enabled).map(m => m.moduleName) || [],
            enabledFeatures: action.payload.plan.features?.filter(f => f.enabled).map(f => f.name) || [],
          };
        }
      })
      .addCase(fetchUserSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Select subscription plan
      .addCase(selectSubscriptionPlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(selectSubscriptionPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlan = action.payload.plan;
        state.selectedPlanId = action.payload.planId;
        state.subscriptionStatus = action.payload.status;
        state.subscriptionStartDate = action.payload.startDate;
        state.subscriptionEndDate = action.payload.endDate;
        
        // Set restrictions
        if (action.payload.plan) {
          state.restrictions = {
            maxBeds: action.payload.plan.maxBedsAllowed || action.payload.plan.baseBedCount,
            enabledModules: action.payload.plan.modules?.filter(m => m.enabled).map(m => m.moduleName) || [],
            enabledFeatures: action.payload.plan.features?.filter(f => f.enabled).map(f => f.name) || [],
          };
        }
      })
      .addCase(selectSubscriptionPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch available plans
      .addCase(fetchAvailablePlans.pending, (state) => {
        state.plansLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailablePlans.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.availablePlans = action.payload;
        state.plansCacheTime = Date.now(); // Cache timestamp
      })
      .addCase(fetchAvailablePlans.rejected, (state, action) => {
        state.plansLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentPlan,
  setSubscriptionStatus,
  setCurrentUsage,
  updateBedsUsed,
  clearSubscription,
  setSubscriptionDates,
} = subscriptionSlice.actions;

// Selectors
export const selectCurrentPlan = (state) => state.subscription.currentPlan;
export const selectSubscriptionStatus = (state) => state.subscription.subscriptionStatus;
export const selectRestrictions = (state) => state.subscription.restrictions;
export const selectCurrentUsage = (state) => state.subscription.currentUsage;
export const selectAvailablePlans = (state) => state.subscription.availablePlans;
export const selectSubscriptionLoading = (state) => state.subscription.loading;
export const selectPlansLoading = (state) => state.subscription.plansLoading;

// Check if a module is enabled (memoized)
export const selectIsModuleEnabled = (state, moduleName) => {
  return state.subscription.restrictions.enabledModules.includes(moduleName);
};

// Check if a feature is enabled (memoized)
export const selectIsFeatureEnabled = (state, featureName) => {
  return state.subscription.restrictions.enabledFeatures.includes(featureName);
};

// Check if can add more beds
export const selectCanAddBeds = (state) => {
  const { maxBeds } = state.subscription.restrictions;
  const { bedsUsed } = state.subscription.currentUsage;
  return maxBeds === null || bedsUsed < maxBeds;
};

// Get remaining beds
export const selectRemainingBeds = (state) => {
  const { maxBeds } = state.subscription.restrictions;
  const { bedsUsed } = state.subscription.currentUsage;
  if (maxBeds === null) return 'Unlimited';
  return Math.max(0, maxBeds - bedsUsed);
};

export default subscriptionSlice.reducer;
