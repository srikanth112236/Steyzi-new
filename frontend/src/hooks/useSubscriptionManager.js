import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import subscriptionManager from '../services/subscriptionManager.service';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing subscription state and events
 * Provides real-time subscription monitoring, warnings, and permission checks
 * @param {boolean} enabled - Whether to enable the subscription manager (default: true)
 */
export const useSubscriptionManager = (enabled = true) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [subscriptionEvents, setSubscriptionEvents] = useState([]);
  const subscription = useSelector(state => state.auth.subscription);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const eventHistoryRef = useRef([]);

  // Maximum events to keep in history
  const MAX_EVENT_HISTORY = 50;

  /**
   * Add event to history
   */
  const addEventToHistory = useCallback((event, data) => {
    const eventEntry = {
      id: Date.now() + Math.random(),
      type: event,
      data,
      timestamp: new Date().toISOString()
    };

    eventHistoryRef.current = [eventEntry, ...eventHistoryRef.current].slice(0, MAX_EVENT_HISTORY);
    setSubscriptionEvents([...eventHistoryRef.current]);
  }, []);

  /**
   * Initialize subscription manager
   */
  useEffect(() => {
    if (enabled && isAuthenticated && !isInitialized) {
      console.log('🚀 Initializing subscription manager hook');

      // Setup event listeners
      subscriptionManager.on('subscriptionChecked', (data) => {
        addEventToHistory('subscriptionChecked', data);
      });

      subscriptionManager.on('subscriptionCheckFailed', (data) => {
        addEventToHistory('subscriptionCheckFailed', data);
        console.error('Subscription check failed:', data.error);
      });

      subscriptionManager.on('subscriptionUpdated', (data) => {
        addEventToHistory('subscriptionUpdated', data);
        toast.success('Subscription updated successfully');
      });

      subscriptionManager.on('trialExpiringSoon', (data) => {
        addEventToHistory('trialExpiringSoon', data);
        toast.warning(
          `Your trial expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}. Upgrade now to continue using all features.`,
          { duration: 8000 }
        );
      });

      subscriptionManager.on('trialExpired', (data) => {
        addEventToHistory('trialExpired', data);
        toast.error(
          'Your trial has expired. Please upgrade your plan to continue using the service.',
          { duration: 10000 }
        );
      });

      subscriptionManager.on('subscriptionExpired', (data) => {
        addEventToHistory('subscriptionExpired', data);
        toast.error(
          'Your subscription has expired. Please renew to continue using the service.',
          { duration: 10000 }
        );
      });

      subscriptionManager.on('bedLimitWarning', (data) => {
        addEventToHistory('bedLimitWarning', data);
        const remainingBeds = data.limit - data.current;
        toast.warning(
          `You're approaching your bed limit (${data.current}/${data.limit}). ${remainingBeds} beds remaining.`,
          { duration: 6000 }
        );
      });

      subscriptionManager.on('branchLimitWarning', (data) => {
        addEventToHistory('branchLimitWarning', data);
        const remainingBranches = data.limit - data.current;
        toast.warning(
          `You're approaching your branch limit (${data.current}/${data.limit}). ${remainingBranches} branches remaining.`,
          { duration: 6000 }
        );
      });

      // Initialize the manager
      subscriptionManager.initialize();
      setIsInitialized(true);
    }

    // Cleanup when user logs out or when disabled
    return () => {
      if ((!enabled || !isAuthenticated) && isInitialized) {
        console.log('🗑️ Cleaning up subscription manager hook');
        subscriptionManager.destroy();
        setIsInitialized(false);
        eventHistoryRef.current = [];
        setSubscriptionEvents([]);
      }
    };
  }, [enabled, isAuthenticated, isInitialized, addEventToHistory]);

  /**
   * Check if user can perform an action
   */
  const canPerformAction = useCallback((action, context = {}) => {
    return subscriptionManager.canPerformAction(action, context);
  }, []);

  /**
   * Check if user can add beds
   */
  const canAddBed = useCallback((additionalBeds = 1) => {
    return subscriptionManager.canAddBed({ additionalBeds });
  }, []);

  /**
   * Check if user can add branches
   */
  const canAddBranch = useCallback((additionalBranches = 1) => {
    return subscriptionManager.canAddBranch({ additionalBranches });
  }, []);

  /**
   * Check if user can access a module
   */
  const canAccessModule = useCallback((moduleName, submoduleName = null, permission = null) => {
    return subscriptionManager.canAccessModule(moduleName, submoduleName, permission);
  }, []);

  /**
   * Check if user can access a feature
   */
  const canAccessFeature = useCallback((featureName) => {
    return subscriptionManager.canAccessFeature(featureName);
  }, []);

  /**
   * Get remaining resources
   */
  const getRemainingResources = useCallback(() => {
    return subscriptionManager.getRemainingResources();
  }, []);

  /**
   * Get subscription status summary
   */
  const getSubscriptionSummary = useCallback(() => {
    return subscriptionManager.getSubscriptionSummary();
  }, []);

  /**
   * Force refresh subscription data
   */
  const forceRefresh = useCallback(async () => {
    try {
      await subscriptionManager.forceRefresh();
      toast.success('Subscription data refreshed');
    } catch (error) {
      toast.error('Failed to refresh subscription data');
      console.error('Force refresh failed:', error);
    }
  }, []);

  /**
   * Get subscription health status
   */
  const getSubscriptionHealth = useCallback(() => {
    return subscriptionManager.getSubscriptionHealth();
  }, [subscription]);

  /**
   * Clear event history
   */
  const clearEventHistory = useCallback(() => {
    eventHistoryRef.current = [];
    setSubscriptionEvents([]);
  }, []);

  /**
   * Get recent events
   */
  const getRecentEvents = useCallback((limit = 10) => {
    return eventHistoryRef.current.slice(0, limit);
  }, []);

  /**
   * Event listener functions
   */
  const on = useCallback((event, callback) => {
    return subscriptionManager.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    return subscriptionManager.off(event, callback);
  }, []);

  // Make subscription manager globally available for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.subscriptionManager = {
        canPerformAction,
        canAddBed,
        canAddBranch,
        canAccessModule,
        getRemainingResources,
        getSubscriptionSummary,
        getSubscriptionHealth,
        forceRefresh,
        getRecentEvents,
        on: (event, callback) => subscriptionManager.on(event, callback),
        off: (event, callback) => subscriptionManager.off(event, callback)
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.subscriptionManager;
      }
    };
  }, [canPerformAction, canAddBed, canAddBranch, canAccessModule, getRemainingResources, getSubscriptionSummary, getSubscriptionHealth, forceRefresh, getRecentEvents, on, off]);

  return {
    // State
    subscription,
    isInitialized,
    subscriptionEvents,

    // Permission checks
    canPerformAction,
    canAddBed,
    canAddBranch,
    canAccessModule,
    canAccessFeature,

    // Resource information
    getRemainingResources,
    getSubscriptionSummary,
    getSubscriptionHealth,

    // Actions
    forceRefresh,
    clearEventHistory,
    getRecentEvents,

    // Event management
    on,
    off
  };
};

export default useSubscriptionManager;
