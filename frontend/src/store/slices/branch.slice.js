import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunk to load branches for the current admin
export const fetchBranches = createAsyncThunk(
  'branch/fetchBranches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/branches');
      const data = response.data;
      if (!data?.success) {
        return rejectWithValue(data?.message || 'Failed to fetch branches');
      }
      // Handle different response structures
      const branches = data.data?.branches || data.data || [];
      return Array.isArray(branches) ? branches : [];
    } catch (error) {
      // Check if it's a connection error (backend not running)
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED') || 
          error.message?.includes('Failed to fetch') || error.response?.status === 500) {
        return rejectWithValue('Unable to connect to API server. Please check your connection.');
      }
      return rejectWithValue(error?.response?.data?.message || error.message || 'Failed to fetch branches');
    }
  }
);

const initialState = {
  branches: [],
  selectedBranch: null,
  loading: false,
  error: null,
  lastLoadedAt: null,
};

const branchSlice = createSlice({
  name: 'branch',
  initialState,
  reducers: {
    setSelectedBranch: (state, action) => {
      state.selectedBranch = action.payload;
    },
    clearSelectedBranch: (state) => {
      state.selectedBranch = null;
    },
    setBranches: (state, action) => {
      state.branches = Array.isArray(action.payload) ? action.payload : [];
    },
    addBranch: (state, action) => {
      // Add a new branch to the branches array if it doesn't already exist
      const newBranch = action.payload;
      if (newBranch && newBranch._id) {
        const exists = state.branches.some(b => b._id === newBranch._id);
        if (!exists) {
          state.branches = [...state.branches, newBranch];
          // Auto-select the new branch if it's the default or if no branch is selected
          if (newBranch.isDefault || !state.selectedBranch) {
            state.selectedBranch = newBranch;
          }
        }
      }
    },
    clearBranches: (state) => {
      state.branches = [];
    },
    initializeBranches: (state) => {
      // Ensure branches is always an array on initialization
      if (!Array.isArray(state.branches)) {
        console.warn('Branch slice: Initializing branches as empty array');
        state.branches = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.branches = Array.isArray(action.payload) ? action.payload : [];
        state.lastLoadedAt = Date.now();
        // Auto-select default branch if none selected
        if (!state.selectedBranch && state.branches.length > 0) {
          const defaultBranch = state.branches.find((b) => b.isDefault);
          state.selectedBranch = defaultBranch || state.branches[0];
        } else if (
          state.selectedBranch &&
          Array.isArray(state.branches) &&
          !state.branches.find((b) => b._id === state.selectedBranch._id)
        ) {
          // Previously selected branch no longer available; reset
          const defaultBranch = state.branches.find((b) => b.isDefault);
          state.selectedBranch = defaultBranch || state.branches[0] || null;
        }
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch branches';
      });
  },
});

export const {
  setSelectedBranch,
  clearSelectedBranch,
  setBranches,
  addBranch,
  clearBranches,
  initializeBranches,
} = branchSlice.actions;

export const selectBranchState = (state) => state.branch;
export const selectSelectedBranch = (state) => state.branch.selectedBranch;
export const selectBranches = (state) => state.branch.branches;

export default branchSlice.reducer; 