const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Subscription Plan Schema
 * Manages subscription plans with bed-based pricing and top-up support
 */
const subscriptionSchema = new mongoose.Schema({
  // Basic Details
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Plan name must be at least 3 characters'],
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  planDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    required: [true, 'Billing cycle is required'],
    default: 'monthly'
  },

  // Pricing Details
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  annualDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },

  // Bed Management
  baseBedCount: {
    type: Number,
    required: [true, 'Base bed count is required'],
    min: [1, 'Must have at least 1 bed'],
    max: [10000, 'Bed count cannot exceed 10000']
  },
  topUpPricePerBed: {
    type: Number,
    required: [true, 'Top-up price per bed is required'],
    min: [0, 'Top-up price cannot be negative']
  },
  maxBedsAllowed: {
    type: Number,
    default: null, // null means unlimited
    min: [1, 'Max beds must be at least 1']
  },

  // Multiple Branch Support
  allowMultipleBranches: {
    type: Boolean,
    default: false,
    description: 'Whether this plan allows creating multiple branches'
  },
  branchCount: {
    type: Number,
    default: 1,
    min: [1, 'Must have at least 1 branch'],
    max: [50, 'Branch count cannot exceed 50']
  },
  bedsPerBranch: {
    type: Number,
    default: null, // null means same as baseBedCount
    min: [1, 'Must have at least 1 bed per branch'],
    max: [10000, 'Bed count per branch cannot exceed 10000']
  },
  costPerBranch: {
    type: Number,
    default: 0,
    min: [0, 'Branch cost cannot be negative']
  },

  // Features and Modules
  features: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  modules: [{
    moduleName: {
      type: String,
      required: true,
      enum: [
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
      ]
    },
    enabled: {
      type: Boolean,
      default: true
    },
    limit: {
      type: Number,
      default: null // null means unlimited
    },
    permissions: {
      type: Map,
      of: {
        create: { type: Boolean, default: true },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
        delete: { type: Boolean, default: true }
      },
      default: function() {
        const moduleName = this.moduleName;
        const defaultPermissions = new Map();

        // Define submodules for each module
        const moduleSubmodules = {
          resident_management: ['residents', 'onboarding', 'offboarding', 'room_switching', 'moved_out'],
          payment_tracking: ['payments', 'payment_history', 'payment_reports'],
          room_allocation: ['rooms', 'room_availability', 'room_assignments'],
          qr_code_payments: ['qr_generation', 'qr_scanning', 'payment_processing'],
          ticket_system: ['tickets', 'ticket_categories', 'ticket_priorities'],
          analytics_reports: ['dashboard', 'reports', 'charts', 'exports'],
          bulk_upload: ['file_upload', 'data_validation', 'bulk_import'],
          email_notifications: ['email_templates', 'email_sending', 'email_history'],
          sms_notifications: ['sms_templates', 'sms_sending', 'sms_history'],
          multi_branch: ['branch_management', 'branch_switching', 'branch_reports'],
          custom_reports: ['report_builder', 'custom_queries', 'report_scheduling'],
          api_access: ['api_keys', 'api_endpoints', 'api_logs'],
          mobile_app: ['mobile_sync', 'push_notifications', 'offline_mode'],
          advanced_analytics: ['advanced_charts', 'predictive_analytics', 'data_insights']
        };

        // Set default permissions for all submodules of this module
        if (moduleSubmodules[moduleName]) {
          moduleSubmodules[moduleName].forEach(submodule => {
            defaultPermissions.set(submodule, {
              create: true,
              read: true,
              update: true,
              delete: true
            });
          });
        }

        return defaultPermissions;
      }
    }
  }],

  // Plan Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isRecommended: {
    type: Boolean,
    default: false
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional Settings
  trialPeriodDays: {
    type: Number,
    default: 0,
    min: [0, 'Trial period cannot be negative']
  },
  setupFee: {
    type: Number,
    default: 0,
    min: [0, 'Setup fee cannot be negative']
  },
  
  // Usage Tracking
  subscribedCount: {
    type: Number,
    default: 0,
    min: [0, 'Subscribed count cannot be negative']
  },

  // Custom Plan Support
  isCustomPlan: {
    type: Boolean,
    default: false,
    description: 'Whether this is a custom plan created for a specific PG'
  },
  assignedPG: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    default: null,
    description: 'PG this custom plan is assigned to (null for global plans)'
  },
  assignedPGEmail: {
    type: String,
    default: null,
    description: 'Email of the PG this custom plan is assigned to'
  },
  requestedUpgrades: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedBeds: {
      type: Number,
      required: true,
      min: [1, 'Requested beds must be at least 1']
    },
    requestedBranches: {
      type: Number,
      default: 1,
      min: [1, 'Requested branches must be at least 1']
    },
    requestMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Request message cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date,
      default: null
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Response message cannot exceed 500 characters']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating annual price
subscriptionSchema.virtual('annualPrice').get(function() {
  if (this.billingCycle === 'annual') {
    const monthlyEquivalent = this.basePrice * 12;
    const discount = (monthlyEquivalent * this.annualDiscount) / 100;
    return monthlyEquivalent - discount;
  }
  return null;
});

// Virtual for effective monthly price (for annual plans)
subscriptionSchema.virtual('effectiveMonthlyPrice').get(function() {
  if (this.billingCycle === 'annual' && this.annualPrice) {
    return this.annualPrice / 12;
  }
  return this.basePrice;
});

// Method to calculate total cost for given bed count and branch count
subscriptionSchema.methods.calculateTotalCost = function(bedCount, branchCount = 1) {
  if (bedCount <= 0) {
    throw new Error('Bed count must be positive');
  }

  if (branchCount <= 0) {
    throw new Error('Branch count must be positive');
  }

  // Allow bed top-up - only validate base bed count
  if (bedCount < this.baseBedCount) {
    throw new Error(`Bed count cannot be less than base bed count (${this.baseBedCount})`);
  }

  // Check if multiple branches are allowed
  if (branchCount > 1 && !this.allowMultipleBranches) {
    throw new Error('This plan does not allow multiple branches');
  }

  // Check if branch count exceeds allowed limit
  if (this.allowMultipleBranches && branchCount > this.branchCount) {
    throw new Error(`Branch count exceeds maximum allowed (${this.branchCount})`);
  }

  let totalCost = this.basePrice;
  let extraBeds = 0;
  let topUpCost = 0;
  let extraBranches = 0;
  let branchCost = 0;

  // Calculate extra beds and top-up cost
  if (bedCount > this.baseBedCount) {
    extraBeds = bedCount - this.baseBedCount;
    topUpCost = extraBeds * this.topUpPricePerBed;
    totalCost += topUpCost;
  }

  // Calculate branch costs (additional branches beyond the first)
  if (branchCount > 1) {
    extraBranches = branchCount - 1;
    branchCost = extraBranches * this.costPerBranch;
    totalCost += branchCost;
  }

  // Apply annual discount if applicable
  if (this.billingCycle === 'annual') {
    const annualTotal = totalCost * 12;
    const discount = (annualTotal * this.annualDiscount) / 100;
    totalCost = (annualTotal - discount) / 12; // Return monthly equivalent
  }

  return {
    basePrice: this.basePrice,
    baseBedCount: this.baseBedCount,
    requestedBeds: bedCount,
    requestedBranches: branchCount,
    extraBeds,
    topUpPricePerBed: this.topUpPricePerBed,
    topUpCost,
    extraBranches,
    costPerBranch: this.costPerBranch,
    branchCost,
    totalMonthlyPrice: this.billingCycle === 'monthly' ? totalCost : totalCost,
    totalAnnualPrice: this.billingCycle === 'annual' ? totalCost * 12 : totalCost * 12,
    billingCycle: this.billingCycle,
    discount: this.billingCycle === 'annual' ? this.annualDiscount : 0,
    allowMultipleBranches: this.allowMultipleBranches,
    maxBranches: this.branchCount
  };
};

// Method to check if a feature is enabled
subscriptionSchema.methods.hasFeature = function(featureName) {
  return this.features.some(f => f.name === featureName && f.enabled);
};

// Method to check if a module is enabled
subscriptionSchema.methods.hasModule = function(moduleName) {
  return this.modules.some(m => m.moduleName === moduleName && m.enabled);
};

// Static method to get active plans
subscriptionSchema.statics.getActivePlans = function() {
  return this.find({ status: 'active' }).sort({ basePrice: 1 });
};

// Static method to get popular plans
subscriptionSchema.statics.getPopularPlans = function() {
  return this.find({ status: 'active', isPopular: true }).sort({ subscribedCount: -1 });
};

// Indexes for better query performance
subscriptionSchema.index({ status: 1, billingCycle: 1 });
subscriptionSchema.index({ planName: 1 });
subscriptionSchema.index({ basePrice: 1 });
subscriptionSchema.index({ isPopular: 1, isRecommended: 1 });
subscriptionSchema.index({ isCustomPlan: 1, assignedPG: 1 }); // For custom plans

// Add index for custom plan filtering
subscriptionSchema.index({ isCustomPlan: 1, assignedPG: 1 }); // For custom plans

// Static method to find custom plans for a specific PG
subscriptionSchema.statics.findCustomPlans = async function(pgId, userEmail) {
  return this.find({
    $or: [
      { isCustomPlan: false }, // Global plans
      { 
        isCustomPlan: true, 
        $or: [
          { assignedPG: pgId },
          { assignedPGEmail: userEmail }
        ]
      }
    ]
  }).populate('assignedPG', 'name email');
};

// Pre-save middleware to validate
subscriptionSchema.pre('save', function(next) {
  // Ensure maxBedsAllowed is greater than baseBedCount
  if (this.maxBedsAllowed && this.maxBedsAllowed < this.baseBedCount) {
    return next(new Error('Maximum beds allowed cannot be less than base bed count'));
  }

  // Ensure bedsPerBranch is set if allowMultipleBranches is true
  if (this.allowMultipleBranches && !this.bedsPerBranch) {
    this.bedsPerBranch = this.baseBedCount; // Default to base bed count
  }

  // Validate branch count is at least 1
  if (this.branchCount < 1) {
    return next(new Error('Branch count must be at least 1'));
  }

  // If multiple branches are disabled, reset branch fields to defaults
  if (!this.allowMultipleBranches) {
    this.branchCount = 1;
    this.costPerBranch = 0;
    this.bedsPerBranch = null;
  }

  next();
});

// Static method to get active plans (including trial plan for eligible users)
subscriptionSchema.statics.getActivePlans = async function(userId = null, userPGId = null, userRole = null) {
  // Fallback logging if logger is not available
  const log = (level, message, ...args) => {
    if (logger && typeof logger[level] === 'function') {
      logger[level](message, ...args);
    } else {
      console[level](message, ...args);
    }
  };

  try {
    let query = { status: 'active' };

    // Logging for debugging
    log('info', `Fetching plans - User Role: ${userRole}, PG ID: ${userPGId}, User ID: ${userId}`);

    // Always include global plans
    const globalPlansQuery = { isCustomPlan: false };

    // If a specific role is provided, add custom plan filtering
    if (userRole === 'superadmin') {
      // Superadmin sees all plans
      log('info', 'Superadmin - Showing all plans');
    } else if (userRole === 'admin' || userRole === 'user') {
      // For admin and user roles, apply strict custom plan filtering
      if (userPGId) {
        query.$or = [
          globalPlansQuery,
          { 
            isCustomPlan: true, 
            assignedPG: userPGId 
          }
        ];
        log('info', `Filtering plans for PG ${userPGId} - Showing global and matching custom plans`);
      } else {
        // Without PG, show only global plans
        query = globalPlansQuery;
        log('info', 'No PG assigned - Showing only global plans');
      }
    }

    const plans = await this.find(query)
      .populate('assignedPG', 'name') // Populate PG name for custom plans
      .sort({ basePrice: 1, createdAt: -1 });

    log('info', `Found ${plans.length} plans matching the query`);

    // Always include the Free Trial Plan at the beginning (only for non-superadmin or if it's global)
    const trialPlan = await this.findOne({
      planName: 'Free Trial Plan',
      status: 'active',
      $or: [
        { isCustomPlan: false },
        ...(userPGId ? [{ isCustomPlan: true, assignedPG: userPGId }] : [])
      ]
    });

    if (trialPlan) {
      // Add trial plan at the beginning of the array
      plans.unshift(trialPlan);
      log('info', 'Added trial plan to the beginning of plans');
    }

    return plans;
  } catch (error) {
    log('error', 'Error fetching active plans:', error);
    throw error;
  }
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
