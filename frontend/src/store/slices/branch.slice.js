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
      return data.data || [];
    } catch (error) {
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
      state.branches = action.payload || [];
    },
    clearBranches: (state) => {
      state.branches = [];
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
        state.branches = action.payload || [];
        state.lastLoadedAt = Date.now();
        // Auto-select default branch if none selected
        if (!state.selectedBranch && state.branches.length > 0) {
          const defaultBranch = state.branches.find((b) => b.isDefault);
          state.selectedBranch = defaultBranch || state.branches[0];
        } else if (
          state.selectedBranch &&
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
  clearBranches,
} = branchSlice.actions;

export const selectBranchState = (state) => state.branch;
export const selectSelectedBranch = (state) => state.branch.selectedBranch;
export const selectBranches = (state) => state.branch.branches;

export default branchSlice.reducer; 