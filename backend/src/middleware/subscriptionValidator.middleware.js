const Joi = require('joi');

/**
 * Subscription Validation Middleware
 * Validates subscription-related requests
 */

// Available modules list
const AVAILABLE_MODULES = [
  'resident_management',
  'payment_tracking',
  'room_allocation',
  'qr_code_payments',
  'ticket_system',
  'analytics_reports',
  'bulk_upload',
  'email_notifications',
  'sms_notifications',
  'multi_branch',
  'custom_reports',
  'api_access',
  'mobile_app',
  'advanced_analytics'
];

// Subscription creation/update schema
const subscriptionSchema = Joi.object({
  // Basic Details
  planName: Joi.string().min(3).max(100).required()
    .messages({
      'string.base': 'Plan name must be a string',
      'string.empty': 'Plan name is required',
      'string.min': 'Plan name must be at least 3 characters',
      'string.max': 'Plan name cannot exceed 100 characters'
    }),
  planDescription: Joi.string().max(500).allow('').optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  billingCycle: Joi.string().valid('monthly', 'annual').required()
    .messages({
      'any.only': 'Billing cycle must be either monthly or annual'
    }),

  // Pricing
  basePrice: Joi.number().min(0).required()
    .messages({
      'number.base': 'Base price must be a number',
      'number.min': 'Base price cannot be negative'
    }),
  annualDiscount: Joi.number().min(0).max(100).default(0)
    .messages({
      'number.min': 'Discount cannot be negative',
      'number.max': 'Discount cannot exceed 100%'
    }),

  // Bed Management
  baseBedCount: Joi.number().integer().min(1).max(10000).required()
    .messages({
      'number.base': 'Base bed count must be a number',
      'number.integer': 'Base bed count must be an integer',
      'number.min': 'Must have at least 1 bed',
      'number.max': 'Bed count cannot exceed 10000'
    }),
  topUpPricePerBed: Joi.number().min(0).required()
    .messages({
      'number.base': 'Top-up price must be a number',
      'number.min': 'Top-up price cannot be negative'
    }),
  maxBedsAllowed: Joi.number().integer().min(1).allow(null).optional()
    .messages({
      'number.min': 'Max beds must be at least 1'
    }),

  // Multiple Branch Support
  allowMultipleBranches: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'Allow multiple branches must be a boolean'
    }),
  branchCount: Joi.number().integer().min(1).max(50).default(1)
    .messages({
      'number.base': 'Branch count must be a number',
      'number.integer': 'Branch count must be an integer',
      'number.min': 'Branch count must be at least 1',
      'number.max': 'Branch count cannot exceed 50'
    }),
  bedsPerBranch: Joi.number().integer().min(1).max(10000).allow(null).optional()
    .messages({
      'number.base': 'Beds per branch must be a number',
      'number.integer': 'Beds per branch must be an integer',
      'number.min': 'Beds per branch must be at least 1',
      'number.max': 'Beds per branch cannot exceed 10000'
    }),
  costPerBranch: Joi.number().min(0).default(0)
    .messages({
      'number.base': 'Cost per branch must be a number',
      'number.min': 'Cost per branch cannot be negative'
    }),

  // Features
  features: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow('').optional(),
      enabled: Joi.boolean().default(true)
    })
  ).optional(),

  // Modules
  modules: Joi.array().items(
    Joi.object({
      moduleName: Joi.string().valid(...AVAILABLE_MODULES).required(),
      enabled: Joi.boolean().default(true),
      limit: Joi.number().integer().min(1).allow(null).optional(),
      permissions: Joi.object().pattern(
        Joi.string(), // submodule name
        Joi.object({
          create: Joi.boolean().default(true),
          read: Joi.boolean().default(true),
          update: Joi.boolean().default(true),
          delete: Joi.boolean().default(true)
        })
      ).optional()
    })
  ).optional(),

  // Status
  status: Joi.string().valid('active', 'inactive', 'archived').default('active'),
  isPopular: Joi.boolean().default(false),
  isRecommended: Joi.boolean().default(false),

  // Additional Settings
  trialPeriodDays: Joi.number().integer().min(0).default(0),
  setupFee: Joi.number().min(0).default(0)
});

// Cost calculation schema
const calculationSchema = Joi.object({
  bedCount: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Bed count must be a number',
      'number.integer': 'Bed count must be an integer',
      'number.min': 'Bed count must be at least 1',
      'any.required': 'Bed count is required'
    }),
  branchCount: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Branch count must be a number',
      'number.integer': 'Branch count must be an integer',
      'number.min': 'Branch count must be at least 1'
    })
});

/**
 * Validate subscription data
 */
const validateSubscription = (req, res, next) => {
  const { error, value } = subscriptionSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: false, // Keep unknown fields (like branch fields)
    allowUnknown: true    // Allow unknown fields
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Custom validation: maxBedsAllowed should be >= baseBedCount
  if (value.maxBedsAllowed && value.maxBedsAllowed < value.baseBedCount) {
    return res.status(400).json({
      success: false,
      message: 'Maximum beds allowed cannot be less than base bed count'
    });
  }

  req.body = value;
  next();
};

/**
 * Validate cost calculation request
 */
const validateCalculation = (req, res, next) => {
  const { error, value } = calculationSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateSubscription,
  validateCalculation,
  AVAILABLE_MODULES
};
