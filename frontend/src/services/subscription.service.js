import api from './api';

/**
 * Subscription Service
 * Handles all subscription-related API calls
 */
class SubscriptionService {
  /**
   * Get all subscription plans
   * @param {Object} filters - Filters for fetching subscriptions
   * @param {string} [filters.status] - Subscription status filter
   * @param {string} [filters.billingCycle] - Billing cycle filter
   * @param {boolean} [filters.isPopular] - Popular plans filter
   * @param {string} [filters.search] - Search term
   * @param {string} [filters.pgId] - PG ID for custom plan filtering
   * @param {string} [filters.role] - User role for filtering
   * @param {string} [filters.userEmail] - User's email for strict custom plan filtering
   * @returns {Promise<Object>} Subscription plans
   */
  async getAllSubscriptions(filters = {}) {
    try {
      // Construct query parameters
      const params = new URLSearchParams();
      
      // Add standard filters
      if (filters.status) params.append('status', filters.status);
      if (filters.billingCycle) params.append('billingCycle', filters.billingCycle);
      if (filters.isPopular !== undefined) params.append('isPopular', filters.isPopular);
      if (filters.search) params.append('search', filters.search);
      
      // Add custom plan filters
      if (filters.pgId) params.append('pgId', filters.pgId);
      if (filters.role) params.append('role', filters.role);
      
      // Fetch subscriptions
      const response = await api.get(`/subscriptions?${params.toString()}`);
      
      // Ensure response has expected structure
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to fetch subscriptions');
      }
      
      return {
        success: true,
        data: response.data.data,
        count: response.data.count || response.data.data.length
      };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch subscription plans'
      };
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create new subscription plan
   */
  async createSubscription(subscriptionData) {
    try {
      // Validate custom plan requirements
      if (subscriptionData.isCustomPlan && !subscriptionData.assignedPG) {
        throw new Error('Custom plans must be assigned to a specific PG');
      }
      
      const response = await api.post('/subscriptions', subscriptionData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create subscription'
      };
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(subscriptionId, subscriptionData) {
    try {
      const response = await api.put(`/subscriptions/${subscriptionId}`, subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete subscription plan
   */
  async deleteSubscription(subscriptionId) {
    try {
      const response = await api.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Calculate cost for bed count and branch count
   */
  async calculateCost(subscriptionId, bedCount, branchCount = 1) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/calculate`, {
        bedCount,
        branchCount
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating cost:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get active plans
   * @param {Object} [userContext] - Optional user context for filtering
   * @param {string} [userContext.role] - User's role
   * @param {string} [userContext.email] - User's email
   * @returns {Promise<Object>} Active subscription plans
   */
  async getActivePlans(userContext = {}) {
    try {
      // Construct query parameters
      const params = new URLSearchParams();
      
      // Add user context for filtering if provided
      if (userContext.role) params.append('role', userContext.role);
      if (userContext.email) params.append('userEmail', userContext.email);
      
      // Fetch active plans with optional filtering
      const response = await api.get(`/subscriptions/active/plans?${params.toString()}`);
      
      // Ensure response has expected structure
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to fetch active plans');
      }
      
      return {
        success: true,
        data: response.data.data,
        count: response.data.count || response.data.data.length
      };
    } catch (error) {
      console.error('Error fetching active plans:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch active plans'
      };
    }
  }

  /**
   * Get popular plans
   */
  async getPopularPlans() {
    try {
      const response = await api.get('/subscriptions/popular/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching popular plans:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Toggle plan popularity
   */
  async togglePopular(subscriptionId) {
    try {
      const response = await api.patch(`/subscriptions/${subscriptionId}/toggle-popular`);
      return response.data;
    } catch (error) {
      console.error('Error toggling popularity:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Toggle plan recommended status
   */
  async toggleRecommended(subscriptionId) {
    try {
      const response = await api.patch(`/subscriptions/${subscriptionId}/toggle-recommended`);
      return response.data;
    } catch (error) {
      console.error('Error toggling recommended:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get subscription statistics
   */
  async getStatistics() {
    try {
      const response = await api.get('/subscriptions/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Duplicate subscription plan
   */
  async duplicateSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Error duplicating subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get subscription management statistics
   */
  async getSubscriptionManagementStats() {
    try {
      const response = await api.get('/subscription-management/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription management stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user subscription history
   */
  async getUserSubscriptionHistory(userId) {
    try {
      const response = await api.get(`/subscription-management/users/${userId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user subscription history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all subscribers
   */
  async getAllSubscribers(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.billingCycle) params.append('billingCycle', filters.billingCycle);
      if (filters.subscriptionPlanId) params.append('subscriptionPlanId', filters.subscriptionPlanId);
      if (filters.userRole) params.append('userRole', filters.userRole);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/subscription-management/subscribers?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Subscribe user to plan
   */
  async subscribeUser(userId, subscriptionData) {
    try {
      const response = await api.post(`/subscription-management/users/${userId}/subscribe`, subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Error subscribing user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Change user subscription
   */
  async changeUserSubscription(userId, subscriptionData) {
    try {
      const response = await api.put(`/subscription-management/users/${userId}/change-subscription`, subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Error changing subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelUserSubscription(userId, cancellationReason = '') {
    try {
      const response = await api.post(`/subscription-management/users/${userId}/cancel-subscription`, {
        cancellationReason
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user subscription history
   */
  async getUserSubscriptionHistory(userId) {
    try {
      const response = await api.get(`/subscription-management/users/${userId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user subscription history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get active subscriptions by plan
   */
  async getActiveSubscriptionsByPlan() {
    try {
      const response = await api.get('/subscription-management/active-by-plan');
      return response.data;
    } catch (error) {
      console.error('Error fetching active subscriptions by plan:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get PGs for custom plan selection
   * @param {string} [search=''] - Optional search term
   * @param {Object} [options={}] - Additional filtering options
   * @param {string} [options.role] - User role for filtering
   * @param {string} [options.userPGId] - User's PG ID for filtering
   * @returns {Promise<Object>} PGs for custom plan selection
   */
  async getPGsForCustomPlans(search = '', options = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add search term if provided
      if (search) params.append('search', search);
      
      // Add role-based filtering
      if (options.role) params.append('role', options.role);
      if (options.userPGId) params.append('userPGId', options.userPGId);
      
      const response = await api.get(`/subscriptions/pgs-for-custom-plans?${params.toString()}`);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to fetch PGs');
      }
      
      return {
        success: true,
        data: response.data.data,
        count: response.data.count || response.data.data.length
      };
    } catch (error) {
      console.error('Error fetching PGs for custom plans:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch PGs for custom plans'
      };
    }
  }

  /**
   * Add branches to subscription
   */
  async addBranchesToSubscription(additionalBranches, newMaxBranches) {
    try {
      const response = await api.post('/users/subscription/add-branches', {
        additionalBranches,
        newMaxBranches
      });
      return response.data;
    } catch (error) {
      console.error('Error adding branches to subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Request upgrade for custom plan
   */
  async requestUpgrade(planId, upgradeData) {
    try {
      const response = await api.post(`/subscriptions/${planId}/request-upgrade`, upgradeData);
      return response.data;
    } catch (error) {
      console.error('Error requesting upgrade:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get upgrade requests for a plan (superadmin only)
   */
  async getUpgradeRequests(planId) {
    try {
      const response = await api.get(`/subscriptions/${planId}/upgrade-requests`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upgrade requests:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Respond to upgrade request (superadmin only)
   */
  async respondToUpgradeRequest(planId, requestId, responseData) {
    try {
      const response = await api.post(`/subscriptions/${planId}/upgrade-requests/${requestId}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error('Error responding to upgrade request:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update subscription usage
   */
  async updateSubscriptionUsage(userId, usageData) {
    try {
      const response = await api.put(`/subscription-management/users/${userId}/usage`, usageData);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription usage:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Extend subscription
   */
  async extendSubscription(subscriptionId, extensionDays) {
    try {
      const response = await api.post(`/subscription-management/${subscriptionId}/extend`, {
        extensionDays
      });
      return response.data;
    } catch (error) {
      console.error('Error extending subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get subscriptions expiring soon
   */
  async getExpiringSoonSubscriptions(daysAhead = 7) {
    try {
      const response = await api.get(`/subscription-management/expiring-soon?days=${daysAhead}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring subscriptions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors || []
      };
    }
    return {
      success: false,
      message: error.message || 'Network error occurred'
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get available modules
   */
  getAvailableModules() {
    return [
      { value: 'resident_management', label: 'Resident Management', icon: '👥' },
      { value: 'payment_tracking', label: 'Payment Tracking', icon: '💰' },
      { value: 'room_allocation', label: 'Room Allocation', icon: '🏠' },
      { value: 'qr_code_payments', label: 'QR Code Payments', icon: '📱' },
      { value: 'ticket_system', label: 'Support Tickets', icon: '🎫' },
      { value: 'analytics_reports', label: 'Analytics & Reports', icon: '📊' },
      { value: 'bulk_upload', label: 'Bulk Upload', icon: '📤' },
      { value: 'email_notifications', label: 'Email Notifications', icon: '📧' },
      { value: 'sms_notifications', label: 'SMS Notifications', icon: '💬' },
      { value: 'multi_branch', label: 'Multi-Branch Support', icon: '🏢' },
      { value: 'custom_reports', label: 'Custom Reports', icon: '📝' },
      { value: 'api_access', label: 'API Access', icon: '🔌' },
      { value: 'mobile_app', label: 'Mobile App Access', icon: '📲' },
      { value: 'advanced_analytics', label: 'Advanced Analytics', icon: '📈' }
    ];
  }

  /**
   * Get billing cycle options
   */
  getBillingCycles() {
    return [
      { value: 'monthly', label: 'Monthly', icon: '📅' },
      { value: 'annual', label: 'Annual', icon: '📆' }
    ];
  }

  /**
   * Activate free trial for user
   */
  async activateFreeTrial(userId) {
    try {
      const response = await api.post(`/subscription-management/users/${userId}/activate-trial`);
      return response.data;
    } catch (error) {
      console.error('Error activating free trial:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get status options
   */
  getStatusOptions() {
    return [
      { value: 'active', label: 'Active', color: 'green' },
      { value: 'inactive', label: 'Inactive', color: 'gray' },
      { value: 'archived', label: 'Archived', color: 'red' }
    ];
  }

  /**
   * Find custom plans for a specific PG
   */
  async findCustomPlans(pgId) {
    try {
      const response = await api.get(`/subscriptions/custom/${pgId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching custom plans:', error);
      return {
        success: false,
        message: 'Failed to fetch custom plans'
      };
    }
  }
}

export default new SubscriptionService();
