import { store } from '../store/store';
import { updateSubscriptionFromManager } from '../store/slices/authSlice';
import logger from '../utils/logging';

class SubscriptionManagerService {
  constructor() {
    // Store current subscription data
    this.subscriptionData = null;
    
    // Event listeners map
    this.eventListeners = new Map();
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
    
    // Return a method to remove the listener
    return () => this.off(event, callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in ${event} event callback:`, error);
        }
      });
    }
  }

  /**
   * Initialize subscription tracking from login response
   * @param {Object} loginResponse - User login response containing subscription info
   */
  initializeSubscriptionTracking(loginResponse) {
    try {
      // Extract subscription data from login response
      const { subscription } = loginResponse.data.user;

      // Update local subscription data
      this.subscriptionData = subscription;

      // Dispatch subscription update to Redux store
      store.dispatch(updateSubscriptionFromManager(subscription));

      // Log subscription initialization
      logger.info('Subscription tracking initialized', { 
        status: subscription?.status || 'No subscription',
        planId: subscription?.planId || 'N/A'
      });

      // Emit initialization event
      this.emit('initialized', subscription);

      // Check and handle subscription status
      this.checkSubscriptionStatus(subscription);
    } catch (error) {
      logger.error('Failed to initialize subscription tracking', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle subscription update from login response or manual refresh
   * @param {Object} subscriptionData - Updated subscription data
   */
  handleSubscriptionUpdate(subscriptionData) {
    try {
      // Update local subscription data
      this.subscriptionData = subscriptionData;

      // Dispatch update to Redux store
      store.dispatch(updateSubscriptionFromManager(subscriptionData));

      // Log subscription update
      logger.info('Subscription updated', { 
        status: subscriptionData?.status || 'No subscription',
        planId: subscriptionData?.planId || 'N/A'
      });

      // Check and handle subscription status
      this.checkSubscriptionStatus(subscriptionData);
    } catch (error) {
      logger.error('Failed to handle subscription update', error);
    }
  }

  /**
   * Check and handle subscription status
   * @param {Object} subscription - Subscription data
   */
  checkSubscriptionStatus(subscription) {
    if (!subscription) {
      logger.warn('No active subscription found');
      this.emit('noSubscription');
      return;
    }

    // Check trial status
    if (subscription.status === 'trial') {
      const daysRemaining = subscription.trialDaysRemaining || 0;
      
      if (daysRemaining <= 0) {
        logger.warn('Trial period has expired');
        this.emit('trialExpired', { subscription });
      } else if (daysRemaining <= 3) {
        logger.info(`Trial period is ending soon. Days remaining: ${daysRemaining}`);
        this.emit('trialExpiringSoon', { 
          subscription, 
          daysRemaining 
        });
      }
    }

    // Check subscription restrictions
    this.validateSubscriptionRestrictions(subscription);
  }

  /**
   * Handle trial expiration
   */
  handleTrialExpiration() {
    // Show modal or notification about trial expiration
    // Potentially redirect to upgrade page
    logger.warn('Trial expired. Redirecting to upgrade page.');
    // Example: window.location.href = '/upgrade';
  }

  /**
   * Show warning about upcoming trial expiration
   * @param {number} daysRemaining - Days remaining in trial
   */
  showTrialExpirationWarning(daysRemaining) {
    // Show notification about trial ending soon
    logger.info(`Trial ending in ${daysRemaining} days`);
    // Example: show toast or modal notification
  }

  /**
   * Validate subscription restrictions
   * @param {Object} subscription - Subscription data
   */
  validateSubscriptionRestrictions(subscription) {
    const { restrictions } = subscription;

    if (!restrictions) {
      logger.warn('No subscription restrictions found');
      return;
    }

    // Check bed and branch usage
    const { 
      maxBeds, 
      maxBranches, 
      modules = [], 
      features = [] 
    } = restrictions;

    // Log current usage
    logger.info('Subscription Restrictions', {
      maxBeds,
      maxBranches,
      moduleCount: modules.length,
      featureCount: features.length
    });

    // Emit events for usage tracking
    this.emit('restrictionsChecked', { 
      maxBeds, 
      maxBranches, 
      modules, 
      features 
    });
  }

  /**
   * Get current subscription data
   * @returns {Object|null} Current subscription data
   */
  getSubscriptionData() {
    return this.subscriptionData;
  }

  /**
   * Get subscription health status
   * @returns {Object|null} Subscription health details
   */
  getSubscriptionHealth() {
    const subscription = store.getState().auth.subscription;
    if (!subscription) return null;

    const now = new Date();
    const trialEndDate = subscription.trialEndDate ? new Date(subscription.trialEndDate) : null;
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;

    // Prepare health issues
    const issues = [];

    // Check trial status
    if (subscription.isTrialActive) {
      const trialDaysRemaining = trialEndDate 
        ? Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24))) 
        : 0;

      if (trialDaysRemaining === 0) {
        issues.push({ 
          type: 'critical', 
          message: 'Trial expired' 
        });
      } else if (trialDaysRemaining <= 3) {
        issues.push({ 
          type: 'warning', 
          message: `Trial expires in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''}` 
        });
      }
    }

    // Check subscription status
    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      issues.push({ 
        type: 'critical', 
        message: 'Subscription not active' 
      });
    }

    // Check usage limits
    const usagePercentage = {
      beds: subscription.restrictions?.maxBeds 
        ? ((subscription.usage?.bedsUsed || 0) / subscription.restrictions.maxBeds) * 100 
        : 0,
      branches: subscription.restrictions?.maxBranches 
        ? ((subscription.usage?.branchesUsed || 0) / subscription.restrictions.maxBranches) * 100 
        : 0
    };

    if (usagePercentage.beds >= 90) {
      issues.push({ 
        type: 'warning', 
        message: 'Approaching bed limit' 
      });
    }

    if (usagePercentage.branches >= 90) {
      issues.push({ 
        type: 'warning', 
        message: 'Approaching branch limit' 
      });
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      summary: {
        status: subscription.status,
        planName: subscription.plan?.planName || 'Free',
        isTrialActive: subscription.isTrialActive,
        trialDaysRemaining: trialEndDate 
          ? Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24))) 
          : 0,
        daysRemaining: endDate 
          ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))) 
          : 0,
        usagePercentage,
        restrictions: subscription.restrictions,
        usage: subscription.usage
      }
    };
  }

  /**
   * Destroy subscription manager
   * Clear all subscription-related data
   */
  destroy() {
    this.subscriptionData = null;
    this.eventListeners.clear();
    logger.info('Subscription Manager destroyed');
  }
}

export default new SubscriptionManagerService();
