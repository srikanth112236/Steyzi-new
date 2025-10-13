import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationsService from '../../services/notifications.service';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params, thunkAPI) => {
  const res = await notificationsService.list(params);
  return res.data;
});

export const markRead = createAsyncThunk('notifications/markRead', async (id, thunkAPI) => {
  const res = await notificationsService.markRead(id);
  return res.data;
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async (params, thunkAPI) => {
  const res = await notificationsService.markAllRead(params);
  return res.data;
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    loading: false,
    error: null
  },
  reducers: {
    pushNotification(state, action) {
      state.items = [action.payload, ...state.items].slice(0, 20);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(markRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex(n => n._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items = state.items.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
      });
  }
});

export const { pushNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer; 