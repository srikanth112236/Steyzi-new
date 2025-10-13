import api from './api';
import { store } from '../store/store';
import { updateSubscriptionFromManager } from '../store/slices/authSlice';

/**
 * Subscription Manager Service
 * Handles periodic subscription checks, real-time updates, and subscription state management
 */
class SubscriptionManagerService {
  constructor() {
    this.checkInterval = null;
    this.checkIntervalTime = 5 * 60 * 1000; // 5 minutes
    this.isChecking = false;
    this.lastCheckTime = null;
    this.eventListeners = new Map();
    this.webSocket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize subscription manager
   */
  initialize() {
    console.log('🚀 Initializing Subscription Manager');

    // Start periodic checks
    this.startPeriodicChecks();

    // Setup WebSocket connection for real-time updates
    this.setupWebSocketConnection();

    // Listen for auth changes
    this.setupAuthListeners();

    // Initial subscription check
    this.checkSubscriptionStatus();
  }

  /**
   * Start periodic subscription checks
   */
  startPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkSubscriptionStatus();
    }, this.checkIntervalTime);

    console.log(`⏰ Started periodic subscription checks every ${this.checkIntervalTime / 1000} seconds`);
  }

  /**
   * Stop periodic checks
   */
  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏸️ Stopped periodic subscription checks');
    }
  }

  /**
   * Get current user from localStorage
   * @returns {Object|null} User object or null
   */
  getCurrentUserFromStorage() {
    try {
      // First, try to get user from Redux persist storage
      const persistedStateStr = localStorage.getItem('persist:root');
      if (persistedStateStr) {
        const persistedState = JSON.parse(persistedStateStr);
        const authStateStr = persistedState.auth;
        if (authStateStr) {
          const authState = JSON.parse(authStateStr);
          if (authState.user) {
            return authState.user;
          }
        }
      }

      // Fallback to direct localStorage
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error retrieving user from storage:', error);
      return null;
    }
  }

  /**
   * Setup WebSocket connection for real-time subscription updates
   */
  setupWebSocketConnection() {
    // Ensure user and token are available before connecting
    const user = this.getCurrentUserFromStorage();
    const token = localStorage.getItem('accessToken');

    if (!user || !token) {
      console.warn('🚫 Cannot establish WebSocket: Missing user or token', {
        userExists: !!user,
        tokenExists: !!token
      });
      return null;
    }

    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:5000'}/subscription-updates?token=${token}&userId=${user._id}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('🔌 Subscription WebSocket connection established');
        this.isUserConnected = true;
        this.emitEvent('connectionEstablished', { userId: user._id });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (parseError) {
          console.error('❌ Error parsing WebSocket message:', parseError);
        }
      };

      socket.onerror = (error) => {
        console.error('❌ Subscription WebSocket error:', error);
        this.isUserConnected = false;
        this.emitEvent('connectionError', { error });
      };

      socket.onclose = (event) => {
        console.log('🔌 Subscription WebSocket connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        this.isUserConnected = false;

        // Attempt reconnection after a delay if not cleanly closed
        if (!event.wasClean) {
          setTimeout(() => {
            console.log('🔄 Attempting WebSocket reconnection...');
            this.setupWebSocketConnection();
          }, 5000);
        }
      };

      return socket;
    } catch (error) {
      console.error('❌ Failed to establish WebSocket connection:', error);
      this.emitEvent('connectionError', { error });
      return null;
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  handleWebSocketReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`🔄 Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

      setTimeout(() => {
        this.setupWebSocketConnection();
      }, delay);
    } else {
      console.error('❌ Max WebSocket reconnection attempts reached');
    }
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(data) {
    console.log('📡 Received subscription WebSocket message:', data);

    switch (data.type) {
      case 'SUBSCRIPTION_UPDATED':
        this.handleSubscriptionUpdate(data.payload);
        break;
      case 'TRIAL_EXPIRING':
        this.handleTrialExpiring(data.payload);
        break;
      case 'TRIAL_EXPIRED':
        this.handleTrialExpired(data.payload);
        break;
      case 'USAGE_LIMIT_WARNING':
        this.handleUsageLimitWarning(data.payload);
        break;
      case 'SUBSCRIPTION_EXPIRED':
        this.handleSubscriptionExpired(data.payload);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  /**
   * Setup auth state listeners
   */
  setupAuthListeners() {
    // Listen for auth state changes
    let currentAuthState = store.getState().auth.isAuthenticated;

    const unsubscribe = store.subscribe(() => {
      const newAuthState = store.getState().auth.isAuthenticated;

      if (currentAuthState !== newAuthState) {
        currentAuthState = newAuthState;

        if (newAuthState) {
          // User logged in - start checks and WebSocket
          this.startPeriodicChecks();
          this.setupWebSocketConnection();
          this.checkSubscriptionStatus();
        } else {
          // User logged out - stop checks and close WebSocket
          this.stopPeriodicChecks();
          this.closeWebSocketConnection();
        }
      }
    });

    // Store unsubscribe function for cleanup
    this.authUnsubscribe = unsubscribe;
  }

  /**
   * Close WebSocket connection
   */
  closeWebSocketConnection() {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
      console.log('🔌 Closed subscription WebSocket connection');
    }
  }

  /**
   * Check current subscription status
   */
  async checkSubscriptionStatus(force = false) {
    if (this.isChecking && !force) {
      console.log('⏳ Subscription check already in progress');
      return;
    }

    // Check if user is authenticated
    const state = store.getState();
    if (!state.auth.isAuthenticated || !state.auth.user) {
      console.log('❌ User not authenticated, skipping subscription check');
      return;
    }

    // Rate limiting - don't check too frequently unless forced
    const timeSinceLastCheck = this.lastCheckTime ? Date.now() - this.lastCheckTime : Infinity;
    if (!force && timeSinceLastCheck < 60000) { // 1 minute minimum between checks
      console.log('⏰ Skipping subscription check - too soon since last check');
      return;
    }

    this.isChecking = true;
    this.lastCheckTime = Date.now();

    try {
      console.log('🔍 Checking subscription status...', {
        force,
        lastCheckTime: this.lastCheckTime,
        userId: state.auth.user._id,
        isAuthenticated: state.auth.isAuthenticated
      });

      const startTime = Date.now();
      const response = await api.get('/users/my-subscription');
      const responseTime = Date.now() - startTime;

      console.log(`📡 Subscription API response (${responseTime}ms):`, {
        success: response.data.success,
        status: response.status,
        hasData: !!response.data.data
      });

      if (response.data.success) {
        const subscriptionData = response.data.data;

        console.log('📊 Subscription data received:', {
          status: subscriptionData.status,
          isTrialActive: subscriptionData.isTrialActive,
          trialDaysRemaining: subscriptionData.trialDaysRemaining,
          usage: subscriptionData.usage,
          restrictions: subscriptionData.restrictions
        });

        // Update subscription in Redux store
        store.dispatch(updateSubscriptionFromManager(subscriptionData));

        // Check for critical subscription states
        this.checkSubscriptionHealth(subscriptionData);

        console.log('✅ Subscription status updated successfully');
        this.emitEvent('subscriptionChecked', { subscription: subscriptionData });

      } else {
        console.error('❌ Failed to fetch subscription:', response.data.message);
        this.emitEvent('subscriptionCheckFailed', { error: response.data.message });
      }

    } catch (error) {
      console.error('❌ Subscription check failed:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url
      });
      this.emitEvent('subscriptionCheckFailed', { error: error.message });

      // If it's an auth error, don't retry
      if (error.response?.status === 401) {
        console.log('🚫 Auth error detected, stopping periodic checks');
        this.stopPeriodicChecks();
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check subscription health and emit warnings
   */
  checkSubscriptionHealth(subscription) {
    if (!subscription) return;

    const now = new Date();
    const trialEndDate = subscription.trialEndDate ? new Date(subscription.trialEndDate) : null;
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;

    // Check trial expiration
    if (subscription.isTrialActive && trialEndDate) {
      const daysUntilExpiry = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 0) {
        this.emitEvent('trialExpired', { subscription, daysRemaining: 0 });
      } else if (daysUntilExpiry <= 3) {
        this.emitEvent('trialExpiringSoon', { subscription, daysRemaining: daysUntilExpiry });
      }
    }

    // Check subscription expiration
    if (subscription.status === 'active' && endDate) {
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 0) {
        this.emitEvent('subscriptionExpired', { subscription, daysRemaining: 0 });
      } else if (daysUntilExpiry <= 7) {
        this.emitEvent('subscriptionExpiringSoon', { subscription, daysRemaining: daysUntilExpiry });
      }
    }

    // Check usage limits
    if (subscription.restrictions) {
      const { maxBeds, maxBranches } = subscription.restrictions;
      const { bedsUsed, branchesUsed } = subscription.usage || {};

      if (maxBeds && bedsUsed >= maxBeds * 0.9) {
        this.emitEvent('bedLimitWarning', {
          current: bedsUsed,
          limit: maxBeds,
          percentage: (bedsUsed / maxBeds) * 100
        });
      }

      if (maxBranches && branchesUsed >= maxBranches * 0.9) {
        this.emitEvent('branchLimitWarning', {
          current: branchesUsed,
          limit: maxBranches,
          percentage: (branchesUsed / maxBranches) * 100
        });
      }
    }
  }

  /**
   * Handle subscription update from WebSocket
   */
  handleSubscriptionUpdate(subscription) {
    console.log('🔄 Subscription updated via WebSocket:', subscription);
    store.dispatch(updateSubscriptionFromManager(subscription));
    this.emitEvent('subscriptionUpdated', { subscription });
  }

  /**
   * Handle trial expiring warning
   */
  handleTrialExpiring(data) {
    console.log('⚠️ Trial expiring soon:', data);
    this.emitEvent('trialExpiringSoon', data);
  }

  /**
   * Handle trial expired
   */
  handleTrialExpired(data) {
    console.log('❌ Trial expired:', data);
    this.emitEvent('trialExpired', data);
  }

  /**
   * Handle usage limit warning
   */
  handleUsageLimitWarning(data) {
    console.log('⚠️ Usage limit warning:', data);
    this.emitEvent('usageLimitWarning', data);
  }

  /**
   * Handle subscription expired
   */
  handleSubscriptionExpired(data) {
    console.log('❌ Subscription expired:', data);
    this.emitEvent('subscriptionExpired', data);
  }

  /**
   * Check if user can perform an action based on subscription
   */
  canPerformAction(action, context = {}) {
    const state = store.getState();
    const subscription = state.auth.subscription;

    if (!subscription) return false;

    // Check if subscription is active
    if (!['active', 'trial'].includes(subscription.status)) {
      return false;
    }

    // Check trial expiration
    if (subscription.isTrialActive && subscription.trialEndDate) {
      const trialEnd = new Date(subscription.trialEndDate);
      if (trialEnd <= new Date()) {
        return false;
      }
    }

    // Check subscription expiration
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      if (endDate <= new Date()) {
        return false;
      }
    }

    // Check specific action permissions
    switch (action) {
      case 'addBed':
        return this.canAddBed(context);

      case 'addBranch':
        return this.canAddBranch(context);

      case 'accessModule':
        return this.canAccessModule(context.module, context.submodule, context.permission);

      case 'accessFeature':
        return this.canAccessFeature(context.feature);

      default:
        return true;
    }
  }

  /**
   * Check if user can add a bed
   */
  canAddBed(context = {}) {
    const subscription = store.getState().auth.subscription;
    if (!subscription?.restrictions) return false;

    const { maxBeds } = subscription.restrictions;
    const { bedsUsed } = subscription.usage || {};

    const additionalBeds = context.additionalBeds || 1;
    return (bedsUsed + additionalBeds) <= maxBeds;
  }

  /**
   * Check if user can add a branch
   */
  canAddBranch(context = {}) {
    const subscription = store.getState().auth.subscription;
    if (!subscription?.restrictions) return false;

    const { maxBranches } = subscription.restrictions;
    const { branchesUsed } = subscription.usage || {};

    const additionalBranches = context.additionalBranches || 1;
    return (branchesUsed + additionalBranches) <= maxBranches;
  }

  /**
   * Check if user can access a specific module
   */
  canAccessModule(moduleName, submoduleName = null, permission = null) {
    const subscription = store.getState().auth.subscription;
    if (!subscription?.restrictions?.modules) return false;

    const module = subscription.restrictions.modules.find(m => m.moduleName === moduleName);
    if (!module || !module.enabled) return false;

    // If checking submodule permission
    if (submoduleName && permission) {
      const submodule = module.permissions[submoduleName];
      return submodule && submodule[permission] === true;
    }

    return true;
  }

  /**
   * Check if user can access a specific feature
   */
  canAccessFeature(featureName) {
    const subscription = store.getState().auth.subscription;
    if (!subscription?.restrictions?.features) return false;

    return subscription.restrictions.features.some(f => f.name === featureName && f.enabled);
  }

  /**
   * Get remaining resources
   */
  getRemainingResources() {
    const subscription = store.getState().auth.subscription;
    if (!subscription?.restrictions || !subscription?.usage) return {};

    const { maxBeds, maxBranches } = subscription.restrictions;
    const { bedsUsed, branchesUsed } = subscription.usage;

    return {
      beds: Math.max(0, maxBeds - bedsUsed),
      branches: Math.max(0, maxBranches - branchesUsed)
    };
  }

  /**
   * Get subscription status summary
   */
  getSubscriptionSummary() {
    const subscription = store.getState().auth.subscription;
    if (!subscription) return null;

    const now = new Date();
    const trialEndDate = subscription.trialEndDate ? new Date(subscription.trialEndDate) : null;
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;

    return {
      status: subscription.status,
      planName: subscription.plan?.planName || 'Free',
      isTrialActive: subscription.isTrialActive,
      trialDaysRemaining: trialEndDate ? Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24))) : 0,
      daysRemaining: endDate ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))) : 0,
      usagePercentage: {
        beds: subscription.restrictions?.maxBeds ?
          ((subscription.usage?.bedsUsed || 0) / subscription.restrictions.maxBeds) * 100 : 0,
        branches: subscription.restrictions?.maxBranches ?
          ((subscription.usage?.branchesUsed || 0) / subscription.restrictions.maxBranches) * 100 : 0
      },
      restrictions: subscription.restrictions,
      usage: subscription.usage
    };
  }

  /**
   * Get subscription health status
   */
  getSubscriptionHealth() {
    const subscription = store.getState().auth.subscription;
    if (!subscription) return null;

    const summary = this.getSubscriptionSummary();
    if (!summary) return null;

    const issues = [];

    // Check trial status
    if (summary.isTrialActive) {
      if (summary.trialDaysRemaining === 0) {
        issues.push({ type: 'critical', message: 'Trial expired' });
      } else if (summary.trialDaysRemaining <= 3) {
        issues.push({ type: 'warning', message: `Trial expires in ${summary.trialDaysRemaining} days` });
      }
    }

    // Check subscription status
    if (summary.status !== 'active' && summary.status !== 'trial') {
      issues.push({ type: 'critical', message: 'Subscription not active' });
    }

    // Check usage limits
    if (summary.usagePercentage.beds >= 90) {
      issues.push({ type: 'warning', message: 'Approaching bed limit' });
    }

    if (summary.usagePercentage.branches >= 90) {
      issues.push({ type: 'warning', message: 'Approaching branch limit' });
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      summary
    };
  }

  /**
   * Event system for subscription events
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event callback:`, error);
        }
      });
    }
  }

  /**
   * Force refresh subscription data
   */
  async forceRefresh() {
    console.log('🔄 Force refreshing subscription data');
    await this.checkSubscriptionStatus(true);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopPeriodicChecks();
    this.closeWebSocketConnection();

    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }

    this.eventListeners.clear();
    console.log('🗑️ Subscription Manager destroyed');
  }
}

// Create singleton instance
const subscriptionManager = new SubscriptionManagerService();

export default subscriptionManager;
