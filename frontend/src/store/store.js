import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/ui.slice';
import branchReducer from './slices/branch.slice';
import notificationsReducer from './slices/notifications.slice';
import subscriptionReducer from './slices/subscription.slice';

// Persist configuration with migrations
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'branch', 'subscription'], // Persist auth, branch, and subscription state
  migrate: (state) => {
    // Ensure branch.branches is always an array
    if (state && state.branch) {
      if (!Array.isArray(state.branch.branches)) {
        console.warn('Redux persist: Fixing corrupted branch.branches state');
        state.branch.branches = [];
      }
    }
    return Promise.resolve(state);
  },
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  branch: branchReducer,
  notifications: notificationsReducer,
  subscription: subscriptionReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
const persistor = persistStore(store);

export { store, persistor };
export default store; 