/**
 * Payment Configuration System
 * Provides centralized configuration for different payment scenarios
 */

export const PAYMENT_TYPES = {
  SUBSCRIPTION: 'subscription',
  ADDON: 'addon',
  PREMIUM: 'premium',
  DONATION: 'donation',
  CUSTOM: 'custom',
  RESERVATION: 'reservation',
  FEE: 'fee',
  PENALTY: 'penalty'
};

export const PAYMENT_FREQUENCIES = {
  ONE_TIME: 'one_time',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
  CUSTOM: 'custom'
};

export const PAYMENT_METHODS = {
  CARD: 'card',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
  UPI: 'upi',
  EMI: 'emi',
  PAYLATER: 'paylater',
  BANK_TRANSFER: 'bank_transfer'
};

export const CURRENCIES = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR'
};

/**
 * Payment configuration templates for different scenarios
 */
export const PAYMENT_CONFIGS = {
  // Subscription payments
  [PAYMENT_TYPES.SUBSCRIPTION]: {
    type: PAYMENT_TYPES.SUBSCRIPTION,
    theme: { color: '#3B82F6', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: true, max_count: 3 },
      timeout: 300,
      remember_customer: true,
      confirm_close: true
    },
    validation: {
      minAmount: 100, // ₹1.00 in paise
      maxAmount: 10000000, // ₹1,00,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR]
    },
    metadata: {
      category: 'subscription',
      priority: 'high'
    }
  },

  // Add-on payments (beds, branches, features)
  [PAYMENT_TYPES.ADDON]: {
    type: PAYMENT_TYPES.ADDON,
    theme: { color: '#10B981', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: true, max_count: 2 },
      timeout: 240,
      remember_customer: true,
      confirm_close: true
    },
    validation: {
      minAmount: 500, // ₹5.00 in paise
      maxAmount: 5000000, // ₹50,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR]
    },
    metadata: {
      category: 'addon',
      priority: 'medium'
    }
  },

  // Premium feature payments
  [PAYMENT_TYPES.PREMIUM]: {
    type: PAYMENT_TYPES.PREMIUM,
    theme: { color: '#F59E0B', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: true, max_count: 5 },
      timeout: 600,
      remember_customer: true,
      confirm_close: true,
      allowedPaymentMethods: [PAYMENT_METHODS.CARD, PAYMENT_METHODS.NETBANKING, PAYMENT_METHODS.UPI]
    },
    validation: {
      minAmount: 1000, // ₹10.00 in paise
      maxAmount: 10000000, // ₹1,00,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR, CURRENCIES.USD]
    },
    metadata: {
      category: 'premium',
      priority: 'high'
    }
  },

  // Donation payments
  [PAYMENT_TYPES.DONATION]: {
    type: PAYMENT_TYPES.DONATION,
    theme: { color: '#EF4444', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: false },
      timeout: 180,
      remember_customer: false,
      confirm_close: true
    },
    validation: {
      minAmount: 100, // ₹1.00 in paise
      maxAmount: 10000000, // ₹1,00,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR, CURRENCIES.USD, CURRENCIES.EUR]
    },
    metadata: {
      category: 'donation',
      priority: 'low'
    }
  },

  // Custom payments
  [PAYMENT_TYPES.CUSTOM]: {
    type: PAYMENT_TYPES.CUSTOM,
    theme: { color: '#8B5CF6', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: true, max_count: 3 },
      timeout: 300,
      remember_customer: false,
      confirm_close: true
    },
    validation: {
      minAmount: 100, // ₹1.00 in paise
      maxAmount: 5000000, // ₹50,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR, CURRENCIES.USD, CURRENCIES.EUR]
    },
    metadata: {
      category: 'custom',
      priority: 'medium'
    }
  },

  // Reservation payments
  [PAYMENT_TYPES.RESERVATION]: {
    type: PAYMENT_TYPES.RESERVATION,
    theme: { color: '#06B6D4', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: true, max_count: 2 },
      timeout: 240,
      remember_customer: true,
      confirm_close: true
    },
    validation: {
      minAmount: 1000, // ₹10.00 in paise
      maxAmount: 1000000, // ₹10,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR]
    },
    metadata: {
      category: 'reservation',
      priority: 'medium'
    }
  },

  // Fee payments
  [PAYMENT_TYPES.FEE]: {
    type: PAYMENT_TYPES.FEE,
    theme: { color: '#84CC16', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: true, max_count: 3 },
      timeout: 300,
      remember_customer: true,
      confirm_close: true
    },
    validation: {
      minAmount: 500, // ₹5.00 in paise
      maxAmount: 500000, // ₹5,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR]
    },
    metadata: {
      category: 'fee',
      priority: 'medium'
    }
  },

  // Penalty payments
  [PAYMENT_TYPES.PENALTY]: {
    type: PAYMENT_TYPES.PENALTY,
    theme: { color: '#F97316', backdropColor: '#ffffff' },
    checkoutOptions: {
      retry: { enabled: false },
      timeout: 180,
      remember_customer: true,
      confirm_close: true
    },
    validation: {
      minAmount: 100, // ₹1.00 in paise
      maxAmount: 100000, // ₹1,000.00 in paise
      allowedCurrencies: [CURRENCIES.INR]
    },
    metadata: {
      category: 'penalty',
      priority: 'high'
    }
  }
};

/**
 * Create a payment configuration based on type and customizations
 */
export const createPaymentConfig = (type, customConfig = {}) => {
  const baseConfig = PAYMENT_CONFIGS[type];

  if (!baseConfig) {
    throw new Error(`Unknown payment type: ${type}`);
  }

  return {
    ...baseConfig,
    ...customConfig,
    // Deep merge checkout options
    checkoutOptions: {
      ...baseConfig.checkoutOptions,
      ...customConfig.checkoutOptions
    },
    // Deep merge validation
    validation: {
      ...baseConfig.validation,
      ...customConfig.validation
    },
    // Deep merge metadata
    metadata: {
      ...baseConfig.metadata,
      ...customConfig.metadata
    }
  };
};

/**
 * Validate payment configuration
 */
export const validatePaymentConfig = (config) => {
  const errors = [];

  // Required fields
  if (!config.type) {
    errors.push('Payment type is required');
  }

  if (!config.amount || config.amount <= 0) {
    errors.push('Valid amount is required');
  }

  // Type-specific validation
  const typeConfig = PAYMENT_CONFIGS[config.type];
  if (typeConfig) {
    // Amount validation
    if (config.amount < typeConfig.validation.minAmount) {
      errors.push(`Amount must be at least ${formatAmount(typeConfig.validation.minAmount)}`);
    }

    if (config.amount > typeConfig.validation.maxAmount) {
      errors.push(`Amount cannot exceed ${formatAmount(typeConfig.validation.maxAmount)}`);
    }

    // Currency validation
    if (config.currency && !typeConfig.validation.allowedCurrencies.includes(config.currency)) {
      errors.push(`Currency ${config.currency} is not allowed for ${config.type} payments`);
    }
  }

  // Prefill validation
  if (config.prefill) {
    if (config.prefill.email && !isValidEmail(config.prefill.email)) {
      errors.push('Invalid email format');
    }

    if (config.prefill.contact && !isValidPhone(config.prefill.contact)) {
      errors.push('Invalid phone number format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format amount for display
 */
export const formatAmount = (amount, currency = CURRENCIES.INR) => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  });
  return formatter.format(amount / 100); // Convert from paise to rupees
};

/**
 * Get payment method display information
 */
export const getPaymentMethodInfo = (method) => {
  const methods = {
    [PAYMENT_METHODS.CARD]: { name: 'Credit/Debit Card', icon: '💳', color: 'blue' },
    [PAYMENT_METHODS.NETBANKING]: { name: 'Net Banking', icon: '🏦', color: 'green' },
    [PAYMENT_METHODS.WALLET]: { name: 'Wallet', icon: '📱', color: 'purple' },
    [PAYMENT_METHODS.UPI]: { name: 'UPI', icon: '📲', color: 'orange' },
    [PAYMENT_METHODS.EMI]: { name: 'EMI', icon: '💰', color: 'red' },
    [PAYMENT_METHODS.PAYLATER]: { name: 'Pay Later', icon: '📅', color: 'yellow' },
    [PAYMENT_METHODS.BANK_TRANSFER]: { name: 'Bank Transfer', icon: '🏦', color: 'gray' }
  };

  return methods[method] || { name: method, icon: '💳', color: 'gray' };
};

/**
 * Calculate fees and totals
 */
export const calculatePaymentFees = (amount, type, frequency = PAYMENT_FREQUENCIES.ONE_TIME) => {
  const baseAmount = amount;

  // Razorpay fee calculation (approximate)
  // 2% + ₹3.5 for INR transactions
  const razorpayFee = Math.round((baseAmount * 0.02) + 350);

  // Platform fee (if any)
  const platformFee = 0; // No platform fee for now

  const totalAmount = baseAmount + razorpayFee + platformFee;

  // Calculate recurring totals if applicable
  let recurringTotal = totalAmount;
  if (frequency !== PAYMENT_FREQUENCIES.ONE_TIME) {
    const periods = {
      [PAYMENT_FREQUENCIES.MONTHLY]: 12,
      [PAYMENT_FREQUENCIES.QUARTERLY]: 4,
      [PAYMENT_FREQUENCIES.ANNUAL]: 1
    };

    const periodsPerYear = periods[frequency] || 1;
    recurringTotal = totalAmount * periodsPerYear;
  }

  return {
    baseAmount,
    razorpayFee,
    platformFee,
    totalAmount,
    recurringTotal,
    breakdown: {
      amount: baseAmount,
      fees: razorpayFee + platformFee,
      total: totalAmount
    }
  };
};

/**
 * Create subscription payment config
 */
export const createSubscriptionPayment = (planDetails, userDetails, customConfig = {}) => {
  const {
    planId,
    planName,
    bedCount,
    branchCount,
    billingCycle,
    amount,
    currency = CURRENCIES.INR
  } = planDetails;

  return createPaymentConfig(PAYMENT_TYPES.SUBSCRIPTION, {
    amount,
    currency,
    description: `Subscription: ${planName}`,
    prefill: {
      name: `${userDetails.firstName} ${userDetails.lastName}`,
      email: userDetails.email,
      contact: userDetails.phone
    },
    metadata: {
      planId,
      planName,
      bedCount,
      branchCount,
      billingCycle,
      userId: userDetails._id
    },
    ...customConfig
  });
};

/**
 * Create addon payment config
 */
export const createAddonPayment = (addonDetails, userDetails, customConfig = {}) => {
  const {
    addonType,
    quantity,
    amount,
    currency = CURRENCIES.INR,
    description
  } = addonDetails;

  return createPaymentConfig(PAYMENT_TYPES.ADDON, {
    amount,
    currency,
    description: description || `${addonType} addon (${quantity})`,
    prefill: {
      name: `${userDetails.firstName} ${userDetails.lastName}`,
      email: userDetails.email,
      contact: userDetails.phone
    },
    metadata: {
      addonType,
      quantity,
      userId: userDetails._id
    },
    ...customConfig
  });
};

/**
 * Create custom payment config
 */
export const createCustomPayment = (paymentDetails, userDetails = {}, customConfig = {}) => {
  const {
    amount,
    currency = CURRENCIES.INR,
    description,
    type = PAYMENT_TYPES.CUSTOM
  } = paymentDetails;

  return createPaymentConfig(type, {
    amount,
    currency,
    description: description || 'Custom payment',
    prefill: userDetails ? {
      name: `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim(),
      email: userDetails.email,
      contact: userDetails.phone
    } : {},
    metadata: {
      customPayment: true,
      userId: userDetails?._id
    },
    ...customConfig
  });
};

/**
 * Utility functions
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Get payment type display name
 */
export const getPaymentTypeDisplayName = (type) => {
  const names = {
    [PAYMENT_TYPES.SUBSCRIPTION]: 'Subscription',
    [PAYMENT_TYPES.ADDON]: 'Add-on',
    [PAYMENT_TYPES.PREMIUM]: 'Premium',
    [PAYMENT_TYPES.DONATION]: 'Donation',
    [PAYMENT_TYPES.CUSTOM]: 'Custom',
    [PAYMENT_TYPES.RESERVATION]: 'Reservation',
    [PAYMENT_TYPES.FEE]: 'Fee',
    [PAYMENT_TYPES.PENALTY]: 'Penalty'
  };

  return names[type] || 'Payment';
};

/**
 * Export default configuration
 */
export default {
  PAYMENT_TYPES,
  PAYMENT_FREQUENCIES,
  PAYMENT_METHODS,
  CURRENCIES,
  PAYMENT_CONFIGS,
  createPaymentConfig,
  validatePaymentConfig,
  formatAmount,
  getPaymentMethodInfo,
  calculatePaymentFees,
  createSubscriptionPayment,
  createAddonPayment,
  createCustomPayment,
  getPaymentTypeDisplayName
};
