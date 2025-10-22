import api from './api';
import toast from 'react-hot-toast';

/**
 * Dynamic Razorpay Payment Service
 * Enhanced service for handling various payment scenarios with dynamic configuration
 */
class RazorpayPaymentService {
  constructor() {
    this.config = {
      key: null,
      theme: {
        color: '#3B82F6',
        backdropColor: '#ffffff'
      },
      retryAttempts: 3,
      retryDelay: 1000
    };
    this.paymentCallbacks = {};
  }

  /**
   * Configure the payment service with custom settings
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Set payment callbacks for different events
   */
  setCallbacks(callbacks) {
    this.paymentCallbacks = { ...this.paymentCallbacks, ...callbacks };
    return this;
  }

  /**
   * Initialize Razorpay with dynamic configuration
   */
  async initializeRazorpay(options) {
    return new Promise((resolve, reject) => {
      try {
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK not loaded. Please check your internet connection.');
        }

        // Merge with default config
        const checkoutOptions = {
          key: this.config.key || options.key,
          amount: options.amount,
          currency: options.currency || 'INR',
          name: options.name || 'PG Maintenance System',
          description: options.description || 'Payment',
          order_id: options.orderId,
          prefill: {
            name: options.prefill?.name,
            email: options.prefill?.email,
            contact: options.prefill?.contact
          },
          notes: options.notes || {},
          theme: {
            color: options.theme?.color || this.config.theme.color,
            backdrop_color: options.theme?.backdropColor || this.config.theme.backdropColor
          },
          modal: {
            confirm_close: options.confirmClose || true,
            ondismiss: () => {
              this.paymentCallbacks.onDismiss?.();
              resolve({
                success: false,
                cancelled: true,
                message: 'Payment cancelled by user'
              });
            },
            escape: options.allowEscape !== false,
            animation: options.animation !== false
          },
          retry: {
            enabled: options.retry !== false,
            max_count: options.maxRetryCount || 3
          },
          timeout: options.timeout || 300,
          remember_customer: options.rememberCustomer !== false,
          ...options.additionalOptions
        };

        // Add payment method restrictions if specified
        if (options.allowedPaymentMethods) {
          checkoutOptions.method = options.allowedPaymentMethods;
        }

        const rzp = new window.Razorpay(checkoutOptions);

        // Add event listeners
        if (this.paymentCallbacks.onSuccess) {
          rzp.on('payment.success', (response) => {
            this.paymentCallbacks.onSuccess(response);
          });
        }

        if (this.paymentCallbacks.onError) {
          rzp.on('payment.error', (response) => {
            this.paymentCallbacks.onError(response);
          });
        }

        // Open the payment modal
        rzp.open();

        resolve({
          success: true,
          razorpayInstance: rzp,
          options: checkoutOptions
        });

      } catch (error) {
        console.error('Error initializing Razorpay:', error);
        reject(error);
      }
    });
  }
  /**
   * Create dynamic payment order with flexible configuration
   */
  async createDynamicOrder(orderData) {
    try {
      const response = await api.post('/subscription-payments/create-dynamic-order', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating dynamic order:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process payment with dynamic configuration
   */
  async processDynamicPayment(paymentConfig) {
    try {
      const {
        type, // 'subscription', 'addon', 'custom', 'donation', etc.
        amount,
        currency = 'INR',
        description,
        prefill,
        metadata = {},
        callbacks = {},
        options = {}
      } = paymentConfig;

      // Set callbacks for this payment
      this.setCallbacks(callbacks);

      // Create order based on type
      let orderData = {
        type,
        amount,
        currency,
        description,
        metadata,
        ...options.orderData
      };

      // Add type-specific data
      switch (type) {
        case 'subscription':
          orderData = {
            ...orderData,
            subscriptionPlanId: paymentConfig.subscriptionPlanId,
            bedCount: paymentConfig.bedCount,
            branchCount: paymentConfig.branchCount,
            billingCycle: paymentConfig.billingCycle
          };
          break;

        case 'addon':
          orderData = {
            ...orderData,
            addonType: paymentConfig.addonType, // 'beds', 'branches', 'features'
            quantity: paymentConfig.quantity,
            targetSubscriptionId: paymentConfig.targetSubscriptionId
          };
          break;

        case 'custom':
          orderData = {
            ...orderData,
            customData: paymentConfig.customData
          };
          break;

        default:
          orderData = {
            ...orderData,
            customFields: paymentConfig.customFields || {}
          };
      }

      // Create order
      const orderResult = await this.createDynamicOrder(orderData);

      if (!orderResult.success) {
        throw new Error(orderResult.message);
      }

      // Initialize Razorpay with enhanced options
      const razorpayOptions = {
        key: orderResult.data.key,
        amount: orderResult.data.amount,
        currency: orderResult.data.currency,
        orderId: orderResult.data.orderId,
        name: paymentConfig.name || 'PG Maintenance System',
        description: description || orderResult.data.description,
        prefill: prefill || {},
        notes: {
          type,
          ...metadata,
          ...orderResult.data.notes
        },
        theme: paymentConfig.theme || this.config.theme,
        ...options.checkoutOptions
      };

      const paymentResult = await this.initializeRazorpay(razorpayOptions);

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Verify payment
      const verificationData = {
        orderId: razorpayOptions.orderId,
        paymentId: paymentResult.data?.razorpay_payment_id,
        signature: paymentResult.data?.razorpay_signature,
        type,
        metadata
      };

      const verificationResult = await this.verifyDynamicPayment(verificationData);

      return {
        success: true,
        data: {
          ...verificationResult.data,
          orderId: razorpayOptions.orderId,
          paymentId: paymentResult.data?.razorpay_payment_id
        }
      };

    } catch (error) {
      console.error('Error processing dynamic payment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify dynamic payment
   */
  async verifyDynamicPayment(verificationData) {
    try {
      const response = await api.post('/subscription-payments/verify-dynamic', verificationData);
      return response.data;
    } catch (error) {
      console.error('Error verifying dynamic payment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create Razorpay order for subscription payment
   */
  async createOrder(orderData) {
    try {
      const response = await api.post('/subscription-payments/create-order', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create payment link for subscription
   */
  async createPaymentLink(paymentLinkData) {
    try {
      const response = await api.post('/subscription-payments/create-payment-link', paymentLinkData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(paymentData) {
    try {
      const response = await api.post('/subscription-payments/verify', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(page = 1, limit = 10) {
    try {
      const response = await api.get(`/subscription-payments/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await api.get(`/subscription-payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Add beds to subscription
   */
  async addBeds(additionalBeds, newMaxBeds) {
    try {
      const response = await api.post('/subscription-payments/add-beds', {
        additionalBeds,
        newMaxBeds
      });
      return response.data;
    } catch (error) {
      console.error('Error adding beds:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Add branches to subscription
   */
  async addBranches(additionalBranches, newMaxBranches) {
    try {
      const response = await api.post('/subscription-payments/add-branches', {
        additionalBranches,
        newMaxBranches
      });
      return response.data;
    } catch (error) {
      console.error('Error adding branches:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Request subscription upgrade
   */
  async requestUpgrade(requestData) {
    try {
      const response = await api.post('/subscription-payments/request-upgrade', requestData);
      return response.data;
    } catch (error) {
      console.error('Error requesting upgrade:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Initialize Razorpay checkout
   */
  initializeRazorpay(options) {
    return new Promise((resolve, reject) => {
      try {
        const rzp = new window.Razorpay({
          key: options.key,
          amount: options.amount,
          currency: options.currency || 'INR',
          name: options.name || 'PG Maintenance System',
          description: options.description || 'Subscription Payment',
          order_id: options.orderId,
          handler: function (response) {
            resolve({
              success: true,
              data: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              }
            });
          },
          modal: {
            ondismiss: function() {
            resolve({
              success: false,
              cancelled: true,
              message: 'Payment cancelled by user'
            });
          }
        },
          prefill: {
            name: options.prefill?.name,
            email: options.prefill?.email,
            contact: options.prefill?.contact
          },
          theme: {
            color: options.theme?.color || '#3B82F6',
            backdrop_color: options.theme?.backdropColor || '#ffffff'
          }
        });

        rzp.open();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process payment flow
   */
  async processPayment(subscriptionPlanId, bedCount, branchCount, billingCycle, userDetails) {
    try {
      // Step 1: Create order
      const orderData = {
        subscriptionPlanId,
        bedCount,
        branchCount,
        billingCycle
      };

      const orderResponse = await this.createOrder(orderData);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      // Step 2: Initialize Razorpay checkout
      const checkoutOptions = {
        key: orderResponse.data.key,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        orderId: orderResponse.data.orderId,
        name: 'PG Maintenance System',
        description: `Subscription: ${orderResponse.data.planDetails.planName}`,
        prefill: {
          name: userDetails.firstName + ' ' + userDetails.lastName,
          email: userDetails.email,
          contact: userDetails.phone
        },
        theme: {
          color: '#3B82F6'
        }
      };

      const paymentResponse = await this.initializeRazorpay(checkoutOptions);

      if (!paymentResponse.success) {
        return paymentResponse;
      }

      // Step 3: Verify payment
      const verificationData = {
        razorpay_order_id: paymentResponse.data.razorpay_order_id,
        razorpay_payment_id: paymentResponse.data.razorpay_payment_id,
        razorpay_signature: paymentResponse.data.razorpay_signature,
        subscriptionPlanId,
        bedCount,
        branchCount,
        billingCycle
      };

      const verificationResponse = await this.verifyPayment(verificationData);

      return verificationResponse;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process bed addition payment
   */
  async processBedAddition(additionalBeds, newMaxBeds) {
    try {
      // Create order for bed addition
      const orderResponse = await this.addBeds(additionalBeds, newMaxBeds);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      // Initialize Razorpay checkout
      const checkoutOptions = {
        key: orderResponse.data.key,
        amount: orderResponse.data.amount,
        currency: 'INR',
        orderId: orderResponse.data.orderId,
        name: 'PG Maintenance System',
        description: `Add ${additionalBeds} beds to subscription`,
        theme: {
          color: '#3B82F6'
        }
      };

      const paymentResponse = await this.initializeRazorpay(checkoutOptions);

      if (!paymentResponse.success) {
        return paymentResponse;
      }

      // Verify payment
      const verificationData = {
        razorpay_order_id: paymentResponse.data.razorpay_order_id,
        razorpay_payment_id: paymentResponse.data.razorpay_payment_id,
        razorpay_signature: paymentResponse.data.razorpay_signature
      };

      const verificationResponse = await this.verifyPayment(verificationData);
      return verificationResponse;
    } catch (error) {
      console.error('Error processing bed addition:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process branch addition payment
   */
  async processBranchAddition(additionalBranches, newMaxBranches) {
    try {
      // Create order for branch addition
      const orderResponse = await this.addBranches(additionalBranches, newMaxBranches);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      // Initialize Razorpay checkout
      const checkoutOptions = {
        key: orderResponse.data.key,
        amount: orderResponse.data.amount,
        currency: 'INR',
        orderId: orderResponse.data.orderId,
        name: 'PG Maintenance System',
        description: `Add ${additionalBranches} branch(es) to subscription`,
        theme: {
          color: '#3B82F6'
        }
      };

      const paymentResponse = await this.initializeRazorpay(checkoutOptions);

      if (!paymentResponse.success) {
        return paymentResponse;
      }

      // Verify payment
      const verificationData = {
        razorpay_order_id: paymentResponse.data.razorpay_order_id,
        razorpay_payment_id: paymentResponse.data.razorpay_payment_id,
        razorpay_signature: paymentResponse.data.razorpay_signature
      };

      const verificationResponse = await this.verifyPayment(verificationData);
      return verificationResponse;
    } catch (error) {
      console.error('Error processing branch addition:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors
   */
  handleError(error) {
    const errorMessage = error.response?.data?.message || error.message || 'Payment operation failed';
    return new Error(errorMessage);
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Create payment link for various payment types
   */
  async createDynamicPaymentLink(paymentLinkData) {
    try {
      const response = await api.post('/subscription-payments/create-dynamic-payment-link', paymentLinkData);
      return response.data;
    } catch (error) {
      console.error('Error creating dynamic payment link:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get payment configuration presets for different scenarios
   */
  getPaymentPresets() {
    return {
      subscription: {
        type: 'subscription',
        theme: { color: '#3B82F6' },
        options: {
          checkoutOptions: {
            retry: { enabled: true, max_count: 3 },
            timeout: 300,
            remember_customer: true
          }
        }
      },
      addon: {
        type: 'addon',
        theme: { color: '#10B981' },
        options: {
          checkoutOptions: {
            retry: { enabled: true, max_count: 2 },
            timeout: 240
          }
        }
      },
      premium: {
        type: 'premium',
        theme: { color: '#F59E0B' },
        options: {
          checkoutOptions: {
            retry: { enabled: true, max_count: 5 },
            timeout: 600,
            allowedPaymentMethods: ['card', 'netbanking', 'upi']
          }
        }
      },
      donation: {
        type: 'donation',
        theme: { color: '#EF4444' },
        options: {
          checkoutOptions: {
            retry: { enabled: false },
            timeout: 180
          }
        }
      }
    };
  }

  /**
   * Quick payment method for common scenarios
   */
  async quickPay(presetType, config) {
    const presets = this.getPaymentPresets();
    const preset = presets[presetType];

    if (!preset) {
      throw new Error(`Unknown preset type: ${presetType}`);
    }

    const paymentConfig = {
      ...preset,
      ...config,
      options: {
        ...preset.options,
        ...config.options
      }
    };

    return this.processDynamicPayment(paymentConfig);
  }

  /**
   * Batch payment processing for multiple items
   */
  async processBatchPayments(paymentConfigs) {
    const results = [];
    const errors = [];

    for (let i = 0; i < paymentConfigs.length; i++) {
      try {
        const result = await this.processDynamicPayment(paymentConfigs[i]);
        results.push({
          index: i,
          success: true,
          data: result.data
        });
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          config: paymentConfigs[i]
        });
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: paymentConfigs.length,
        successful: results.filter(r => r.success).length,
        failed: errors.length
      }
    };
  }

  /**
   * Get payment analytics and insights
   */
  async getPaymentAnalytics(filters = {}) {
    try {
      const response = await api.get('/subscription-payments/analytics', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Retry failed payment with exponential backoff
   */
  async retryPayment(orderId, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const orderResult = await api.get(`/subscription-payments/order/${orderId}`);
        if (orderResult.data.success) {
          return orderResult.data;
        }
      } catch (error) {
        console.warn(`Payment retry attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    throw new Error(`Payment retry failed after ${maxRetries} attempts`);
  }

  /**
   * Validate payment configuration
   */
  validatePaymentConfig(config) {
    const required = ['type', 'amount'];
    const missing = required.filter(field => !config[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (config.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (config.currency && !['INR', 'USD', 'EUR'].includes(config.currency)) {
      throw new Error('Unsupported currency');
    }

    return true;
  }

  /**
   * Get payment method name from Razorpay method code
   */
  getPaymentMethodName(method) {
    const methods = {
      'card': 'Credit/Debit Card',
      'netbanking': 'Net Banking',
      'wallet': 'Wallet',
      'upi': 'UPI',
      'emi': 'EMI',
      'paylater': 'Pay Later',
      'bank_transfer': 'Bank Transfer'
    };
    return methods[method] || method;
  }

  /**
   * Format payment amount with currency
   */
  formatAmount(amount, currency = 'INR') {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    });
    return formatter.format(amount / 100); // Convert from paise to rupees
  }

  /**
   * Get supported payment methods
   */
  getSupportedMethods() {
    return [
      { code: 'card', name: 'Credit/Debit Card', icon: '💳' },
      { code: 'netbanking', name: 'Net Banking', icon: '🏦' },
      { code: 'wallet', name: 'Wallet', icon: '📱' },
      { code: 'upi', name: 'UPI', icon: '📲' },
      { code: 'emi', name: 'EMI', icon: '💰' },
      { code: 'paylater', name: 'Pay Later', icon: '📅' }
    ];
  }
}

const razorpayPaymentService = new RazorpayPaymentService();
export default razorpayPaymentService;
