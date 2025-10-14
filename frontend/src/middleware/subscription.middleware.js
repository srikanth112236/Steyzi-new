import { store } from '../store/store';
import subscriptionManager from '../services/subscriptionManager.service';
import toast from 'react-hot-toast';

/**
 * Subscription Middleware
 * Intercepts API calls and checks subscription permissions before allowing requests
 */

// API endpoints that require specific permissions
const PERMISSION_REQUIREMENTS = {
  // Resident management
  '/api/residents': {
    POST: { module: 'resident_management', submodule: 'residents', permission: 'create' },
    PUT: { module: 'resident_management', submodule: 'residents', permission: 'update' },
    DELETE: { module: 'resident_management', submodule: 'residents', permission: 'delete' }
  },
  '/api/offboarding': {
    POST: { module: 'resident_management', submodule: 'offboarding', permission: 'create' }
  },
  '/api/room-switching': {
    POST: { module: 'resident_management', submodule: 'room_switching', permission: 'create' }
  },

  // Payment tracking
  '/api/payments': {
    POST: { module: 'payment_tracking', submodule: 'payments', permission: 'create' },
    PUT: { module: 'payment_tracking', submodule: 'payments', permission: 'update' }
  },

  // Room allocation
  '/api/rooms': {
    POST: { module: 'room_allocation', submodule: 'rooms', permission: 'create' },
    PUT: { module: 'room_allocation', submodule: 'rooms', permission: 'update' },
    DELETE: { module: 'room_allocation', submodule: 'rooms', permission: 'delete' }
  },
  '/api/floors': {
    POST: { module: 'room_allocation', submodule: 'rooms', permission: 'create' }
  },

  // QR Code payments
  '/api/qr-codes': {
    POST: { module: 'qr_code_payments', submodule: 'qr_generation', permission: 'create' }
  },

  // Ticket system
  '/api/tickets': {
    POST: { module: 'ticket_system', submodule: 'tickets', permission: 'create' },
    PUT: { module: 'ticket_system', submodule: 'tickets', permission: 'update' }
  },

  // Reports
  '/api/reports': {
    GET: { module: 'analytics_reports', submodule: 'reports', permission: 'read' }
  },

  // Bulk upload
  '/api/pg/bulk-upload': {
    POST: { module: 'bulk_upload', submodule: 'bulk_import', permission: 'create' }
  },

  // Branches (multi-branch feature)
  '/api/branches': {
    POST: { module: 'multi_branch', submodule: 'branch_management', permission: 'create' },
    PUT: { module: 'multi_branch', submodule: 'branch_management', permission: 'update' },
    DELETE: { module: 'multi_branch', submodule: 'branch_management', permission: 'delete' }
  }
};

// Resource limits to check
const RESOURCE_CHECKS = {
  beds: (method, url, data) => {
    if (method === 'POST' && url.includes('/api/residents')) {
      // Check if adding a resident would exceed bed limit
      return subscriptionManager.canPerformAction('addBed', { additionalBeds: 1 });
    }
    return true;
  },

  branches: (method, url, data) => {
    if (method === 'POST' && url.includes('/api/branches')) {
      // Check if adding a branch would exceed branch limit
      return subscriptionManager.canPerformAction('addBranch', { additionalBranches: 1 });
    }
    return true;
  }
};

/**
 * Check if request is allowed based on subscription
 */
const checkSubscriptionPermission = (url, method, data = null) => {
  const state = store.getState();
  const subscription = state.auth.subscription;
  const userRole = state.auth.user?.role;

  // Allow auth and trial activation requests for all subscription statuses
  console.log('🔍 Subscription middleware checking URL:', url);
  if (url.includes('/auth/') || url.includes('/activate-trial')) {
    console.log('✅ Allowing request:', url);
    return { allowed: true };
  }

  // Completely bypass subscription checks for superadmin and other privileged roles
  const bypassRoles = ['superadmin', 'support', 'sales', 'sub_sales'];
  if (bypassRoles.includes(userRole)) {
    console.log(`🎉 Bypassing ALL subscription checks for role: ${userRole}`);
    return { allowed: true };
  }

  // If no subscription, block all other requests
  if (!subscription) {
    console.log('🔍 No subscription found, checking allowed endpoints for URL:', url);
    const allowedEndpoints = [
      '/auth/login',
      '/auth/logout',
      '/auth/refresh',
      '/users/my-subscription'
    ];
    if (!allowedEndpoints.some(endpoint => url.includes(endpoint))) {
      console.log('❌ Blocking request - no subscription and not in allowed endpoints');
      return {
        allowed: false,
        reason: 'No active subscription found'
      };
    }
    console.log('✅ Allowing request - no subscription but in allowed endpoints');
    return { allowed: true };
  }

  console.log('🔍 Checking subscription status:', subscription.status, 'for URL:', url);
  // Check subscription status for non-auth/trial requests
  if (!['active', 'trial'].includes(subscription.status)) {
    console.log('❌ Blocking request - subscription status:', subscription.status);
    return {
      allowed: false,
      reason: `Subscription status: ${subscription.status}`
    };
  }
  console.log('✅ Allowing request - valid subscription status');

  // Check trial expiration
  if (subscription.isTrialActive && subscription.trialEndDate) {
    const trialEnd = new Date(subscription.trialEndDate);
    if (trialEnd <= new Date()) {
      return {
        allowed: false,
        reason: 'Trial period has expired'
      };
    }
  }

  // Check subscription expiration
  if (subscription.endDate) {
    const endDate = new Date(subscription.endDate);
    if (endDate <= new Date()) {
      return {
        allowed: false,
        reason: 'Subscription has expired'
      };
    }
  }

  // Check specific endpoint permissions
  const endpointPermissions = getEndpointPermissions(url, method);
  if (endpointPermissions) {
    const hasPermission = subscriptionManager.canAccessModule(
      endpointPermissions.module,
      endpointPermissions.submodule,
      endpointPermissions.permission
    );

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Insufficient permissions for ${endpointPermissions.module}`
      };
    }
  }

  // Check resource limits
  for (const [resource, checkFn] of Object.entries(RESOURCE_CHECKS)) {
    const resourceAllowed = checkFn(method, url, data);
    if (!resourceAllowed) {
      const remaining = subscriptionManager.getRemainingResources();
      return {
        allowed: false,
        reason: `Would exceed ${resource} limit. Remaining: ${remaining[resource] || 0}`
      };
    }
  }

  return { allowed: true };
};

/**
 * Get required permissions for an endpoint
 */
const getEndpointPermissions = (url, method) => {
  // Clean URL (remove query parameters and IDs)
  const cleanUrl = url.split('?')[0].split('/').slice(0, 4).join('/');

  // Check exact matches first
  if (PERMISSION_REQUIREMENTS[cleanUrl] && PERMISSION_REQUIREMENTS[cleanUrl][method]) {
    return PERMISSION_REQUIREMENTS[cleanUrl][method];
  }

  // Check pattern matches
  for (const [pattern, methods] of Object.entries(PERMISSION_REQUIREMENTS)) {
    if (cleanUrl.includes(pattern) && methods[method]) {
      return methods[method];
    }
  }

  return null;
};

/**
 * Subscription middleware wrapper for API calls
 */
export const withSubscriptionCheck = (apiCall) => {
  return async (...args) => {
    const [url, config = {}] = args;
    const method = (config.method || 'GET').toUpperCase();

    // Check subscription permissions
    const permissionCheck = checkSubscriptionPermission(url, method, config.data);

    if (!permissionCheck.allowed) {
      const error = new Error(`Subscription restriction: ${permissionCheck.reason}`);

      // Show user-friendly error message
      toast.error(`Access denied: ${permissionCheck.reason}`, {
        duration: 6000,
        action: {
          label: 'Upgrade Plan',
          onClick: () => {
            // Navigate to subscription page or show upgrade modal
            console.log('Navigate to upgrade page');
          }
        }
      });

      throw error;
    }

    // Permission check passed, proceed with API call
    return apiCall(...args);
  };
};

/**
 * Axios interceptor for subscription checks
 */
export const createSubscriptionInterceptor = (axiosInstance) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const permissionCheck = checkSubscriptionPermission(config.url, config.method, config.data);

      if (!permissionCheck.allowed) {
        const error = new Error(`Subscription restriction: ${permissionCheck.reason}`);

        // Show user-friendly error message
        toast.error(`Access denied: ${permissionCheck.reason}`, {
          duration: 6000,
          action: {
            label: 'Upgrade Plan',
            onClick: () => {
              // Could dispatch an action to show upgrade modal
              console.log('Navigate to upgrade page');
            }
          }
        });

        return Promise.reject(error);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor (optional - for usage tracking)
  axiosInstance.interceptors.response.use(
    (response) => {
      // Track API usage for analytics
      const state = store.getState();
      if (state.auth.isAuthenticated) {
        // Could track usage here for analytics
        // trackApiUsage(response.config.url, response.config.method);
      }

      return response;
    },
    (error) => {
      // Handle subscription-related errors
      if (error.response?.status === 403 && error.response?.data?.message?.includes('subscription')) {
        toast.error('Subscription access denied. Please check your plan limits.', {
          duration: 6000
        });
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

/**
 * React hook for subscription-aware API calls
 */
export const useSubscriptionAwareApi = () => {
  const makeApiCall = async (apiCall, ...args) => {
    const [url, config = {}] = args;
    const method = (config.method || 'GET').toUpperCase();

    // Check permissions before making the call
    const permissionCheck = checkSubscriptionPermission(url, method, config.data);

    if (!permissionCheck.allowed) {
      toast.error(`Access denied: ${permissionCheck.reason}`, {
        duration: 6000,
        action: {
          label: 'Upgrade Plan',
          onClick: () => {
            // Navigate to upgrade page
            console.log('Navigate to upgrade page');
          }
        }
      });

      throw new Error(`Subscription restriction: ${permissionCheck.reason}`);
    }

    // Make the API call
    return apiCall(...args);
  };

  return { makeApiCall };
};

/**
 * Utility function to check if user can perform action
 */
export const canPerformAction = (action, context = {}) => {
  return subscriptionManager.canPerformAction(action, context);
};

/**
 * Utility function to check remaining resources
 */
export const getRemainingResources = () => {
  return subscriptionManager.getRemainingResources();
};

/**
 * Utility function to get subscription summary
 */
export const getSubscriptionSummary = () => {
  return subscriptionManager.getSubscriptionSummary();
};

export default {
  withSubscriptionCheck,
  createSubscriptionInterceptor,
  useSubscriptionAwareApi,
  canPerformAction,
  getRemainingResources,
  getSubscriptionSummary
};
