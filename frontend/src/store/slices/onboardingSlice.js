import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { logOnboardingEvent } from '../../utils/logging';
import { getApiBaseUrl } from '../../utils/apiUrl';

const API_BASE = getApiBaseUrl();

// Async thunks for onboarding steps
export const fetchOnboardingStatus = createAsyncThunk(
  'onboarding/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/onboarding/status`);
      logOnboardingEvent('fetch_status_success', response.data);
      return response.data.onboardingStatus;
    } catch (error) {
      logOnboardingEvent('fetch_status_failed', { error: error.message });
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch onboarding status');
    }
  }
);

export const progressPGCreation = createAsyncThunk(
  'onboarding/progressPGCreation',
  async (pgData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/onboarding/pg-creation`, pgData);
      logOnboardingEvent('pg_creation_success', response.data);
      return response.data.onboardingStatus;
    } catch (error) {
      logOnboardingEvent('pg_creation_failed', { 
        error: error.message, 
        pgData 
      });
      return rejectWithValue(error.response?.data?.message || 'Failed to create PG');
    }
  }
);

export const progressBranchSetup = createAsyncThunk(
  'onboarding/progressBranchSetup',
  async (branchData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/onboarding/branch-setup`, branchData);
      logOnboardingEvent('branch_setup_success', response.data);
      return response.data.onboardingStatus;
    } catch (error) {
      logOnboardingEvent('branch_setup_failed', { 
        error: error.message, 
        branchData 
      });
      return rejectWithValue(error.response?.data?.message || 'Failed to set up branch');
    }
  }
);

export const progressPGConfiguration = createAsyncThunk(
  'onboarding/progressPGConfiguration',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/onboarding/pg-configuration`, configData);
      logOnboardingEvent('pg_configuration_success', response.data);
      return response.data.onboardingStatus;
    } catch (error) {
      logOnboardingEvent('pg_configuration_failed', { 
        error: error.message, 
        configData 
      });
      return rejectWithValue(error.response?.data?.message || 'Failed to configure PG');
    }
  }
);

// Onboarding Slice
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    currentStep: 'pg_creation',
    status: {
      pgCreation: 'not_started',
      branchSetup: 'not_started',
      pgConfiguration: 'not_started'
    },
    isLoading: false,
    error: null
  },
  reducers: {
    // Add reset action to clear onboarding state
    resetOnboarding: (state) => {
      state.currentStep = 'pg_creation';
      state.status = {
        pgCreation: 'not_started',
        branchSetup: 'not_started',
        pgConfiguration: 'not_started'
      };
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Onboarding Status
    builder.addCase(fetchOnboardingStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchOnboardingStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentStep = action.payload.currentOnboardingStep;
      state.status = {
        pgCreation: action.payload.pgCreation.status,
        branchSetup: action.payload.branchSetup.status,
        pgConfiguration: action.payload.pgConfiguration.status
      };
    });
    builder.addCase(fetchOnboardingStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // PG Creation
    builder.addCase(progressPGCreation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(progressPGCreation.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentStep = action.payload.currentOnboardingStep;
      state.status.pgCreation = action.payload.pgCreation.status;
    });
    builder.addCase(progressPGCreation.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Branch Setup
    builder.addCase(progressBranchSetup.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(progressBranchSetup.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentStep = action.payload.currentOnboardingStep;
      state.status.branchSetup = action.payload.branchSetup.status;
    });
    builder.addCase(progressBranchSetup.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // PG Configuration
    builder.addCase(progressPGConfiguration.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(progressPGConfiguration.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentStep = action.payload.currentOnboardingStep;
      state.status.pgConfiguration = action.payload.pgConfiguration.status;
    });
    builder.addCase(progressPGConfiguration.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  }
});

export const { resetOnboarding } = onboardingSlice.actions;
export default onboardingSlice.reducer;
