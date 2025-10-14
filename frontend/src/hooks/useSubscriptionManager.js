import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import subscriptionManager from '../services/subscriptionManager.service';
import logger from '../utils/logging';

/**
 * Custom hook for managing subscription state and events
 * @returns {Object} Subscription management utilities
 */
export const useSubscriptionManager = () => {
  // Get subscription from Redux store
  const subscription = useSelector(state => state.auth.subscription);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  // Local state for subscription events
  const [subscriptionEvent, setSubscriptionEvent] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);

  // Callback to handle subscription events
  const handleSubscriptionEvent = useCallback((eventType, eventData) => {
    logger.info(`Subscription Event: ${eventType}`, eventData);
    setSubscriptionEvent({ type: eventType, data: eventData });
  }, []);

  // Callback to handle subscription errors
  const handleSubscriptionError = useCallback((error) => {
    logger.error('Subscription Error', error);
    setSubscriptionError(error);
  }, []);

  // Effect to set up and clean up subscription event listeners
  useEffect(() => {
    // Only set up listeners if authenticated
    if (!isAuthenticated) return;

    // Event listeners
    const listeners = [
      subscriptionManager.on('initialized', (data) => 
        handleSubscriptionEvent('initialized', data)
      ),
      subscriptionManager.on('trialExpiringSoon', (data) => 
        handleSubscriptionEvent('trialExpiringSoon', data)
      ),
      subscriptionManager.on('trialExpired', (data) => 
        handleSubscriptionEvent('trialExpired', data)
      ),
      subscriptionManager.on('noSubscription', () => 
        handleSubscriptionEvent('noSubscription', null)
      ),
      subscriptionManager.on('restrictionsChecked', (data) => 
        handleSubscriptionEvent('restrictionsChecked', data)
      ),
      subscriptionManager.on('error', (error) => 
        handleSubscriptionError(error)
      )
    ];

    // Cleanup function
    return () => {
      // Remove all event listeners
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, [isAuthenticated, handleSubscriptionEvent, handleSubscriptionError]);

  // Methods to interact with subscription
  const methods = {
    /**
     * Check if a specific action is allowed based on subscription
     * @param {string} action - Action to check
     * @param {Object} context - Additional context for the action
     * @returns {boolean} Whether the action is allowed
     */
    canPerformAction: (action, context = {}) => {
      if (!subscription) return false;

      switch (action) {
        case 'addBed':
          return subscription.restrictions?.maxBeds > 
            (subscription.usage?.bedsUsed || 0);
        
        case 'addBranch':
          return subscription.restrictions?.maxBranches > 
            (subscription.usage?.branchesUsed || 0);
        
        case 'accessModule':
          return subscription.restrictions?.modules?.some(
            module => module.name === context.moduleName
          );
        
        default:
          return true;
      }
    },

    /**
     * Check if rooms can be added based on subscription
     * @param {number} roomsToAdd - Number of rooms to add
     * @returns {Object} Room addition validation result
     */
    canAddRooms: (roomsToAdd = 1) => {
      if (!subscription?.restrictions) return { 
        allowed: false, 
        message: 'No subscription restrictions found' 
      };

      const maxAllowedRooms = subscription.restrictions.maxRooms || 5;
      const currentRooms = subscription.usage?.roomsUsed || 0;

      return {
        allowed: currentRooms + roomsToAdd <= maxAllowedRooms,
        currentRooms,
        maxAllowedRooms,
        remainingRooms: maxAllowedRooms - (currentRooms + roomsToAdd),
        requiresUpgrade: currentRooms + roomsToAdd > maxAllowedRooms
      };
    },

  /**
   * Get remaining resources
     * @returns {Object} Remaining resources
     */
    getRemainingResources: () => {
      if (!subscription?.restrictions || !subscription?.usage) return {};

      return {
        beds: Math.max(0, subscription.restrictions.maxBeds - 
          (subscription.usage.bedsUsed || 0)),
        branches: Math.max(0, subscription.restrictions.maxBranches - 
          (subscription.usage.branchesUsed || 0)),
        rooms: Math.max(0, subscription.restrictions.maxRooms - 
          (subscription.usage.roomsUsed || 0))
      };
    },

    /**
     * Get subscription summary
     * @returns {Object} Subscription summary
     */
    getSubscriptionSummary: () => {
      if (!subscription) return null;

      return {
        status: subscription.status,
        planName: subscription.plan?.planName || 'Free',
        isTrialActive: subscription.isTrialActive,
        trialDaysRemaining: subscription.trialDaysRemaining || 0,
        restrictions: subscription.restrictions,
        usage: subscription.usage
      };
    },

  /**
   * Get subscription health status
     * @returns {Object|null} Subscription health details
   */
    getSubscriptionHealth: () => {
    return subscriptionManager.getSubscriptionHealth();
    },

    /**
     * Force refresh of subscription data
     * @returns {Promise<void>}
     */
    forceRefresh: async () => {
      try {
        // If you have a method to refresh subscription in the future
        logger.info('Forcing subscription data refresh');
        // Placeholder for future implementation
      } catch (error) {
        logger.error('Failed to refresh subscription data', error);
      }
    }
  };

  // Make subscription manager globally available for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.subscriptionManager = {
        ...methods,
        on: (event, callback) => subscriptionManager.on(event, callback),
        off: (event, callback) => subscriptionManager.off(event, callback)
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.subscriptionManager;
      }
    };
  }, [methods]);

  return {
    subscription,
    subscriptionEvent,
    subscriptionError,
    ...methods
  };
};

export default useSubscriptionManager;
