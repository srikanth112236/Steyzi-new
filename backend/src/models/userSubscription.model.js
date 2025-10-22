const mongoose = require('mongoose');

/**
 * User Subscription History Model
 * Tracks subscription history for users/admins/pg-admins
 */
const userSubscriptionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },

  // Subscription Plan Reference
  subscriptionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: [true, 'Subscription plan ID is required'],
    index: true
  },

  // Subscription Details
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual', 'trial'],
    required: [true, 'Billing cycle is required']
  },

  // Dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    index: true
  },
  trialEndDate: {
    type: Date,
    default: null
  },

  // Pricing at time of subscription
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  totalBeds: {
    type: Number,
    required: [true, 'Total beds is required'],
    min: [1, 'Must have at least 1 bed']
  },
  totalBranches: {
    type: Number,
    default: 1,
    min: [1, 'Must have at least 1 branch']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'trial', 'upgraded', 'downgraded'],
    default: 'active',
    index: true
  },

  // Payment Details
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    default: null
  },

  // Payment History (for subscription payments)
  paymentHistory: [{
    razorpayOrderId: {
      type: String,
      required: true
    },
    razorpayPaymentId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'netbanking', 'wallet', 'upi'],
      required: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      required: true
    },
    planDetails: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
      },
      planName: String,
      bedCount: Number,
      branchCount: Number
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },

  // Cancellation details
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },

  // Upgrade/Downgrade tracking
  previousSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    default: null
  },
  upgradeDate: {
    type: Date,
    default: null
  },

  // Usage tracking
  currentBedUsage: {
    type: Number,
    default: 0,
    min: [0, 'Bed usage cannot be negative']
  },
  currentBranchUsage: {
    type: Number,
    default: 1,
    min: [1, 'Branch usage must be at least 1']
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

  // Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subscription duration in days
userSubscriptionSchema.virtual('durationDays').get(function() {
  if (this.startDate && this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for days remaining
userSubscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.billingCycle === 'trial' && this.trialEndDate) {
    const now = new Date();
    const daysLeft = Math.ceil((this.trialEndDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  } else if (this.endDate) {
    const now = new Date();
    const daysLeft = Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  }
  return 0;
});

// Virtual for trial days remaining
userSubscriptionSchema.virtual('trialDaysRemaining').get(function() {
  if (this.billingCycle === 'trial' && this.trialEndDate) {
    const now = new Date();
    const daysLeft = Math.ceil((this.trialEndDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  }
  return 0;
});

// Virtual for subscription health
userSubscriptionSchema.virtual('isExpiringSoon').get(function() {
  return this.daysRemaining <= 7 && this.daysRemaining > 0;
});

// Virtual for subscription health
userSubscriptionSchema.virtual('isExpired').get(function() {
  return this.endDate && new Date() > this.endDate;
});

// Virtual for trial status
userSubscriptionSchema.virtual('isTrialActive').get(function() {
  return this.billingCycle === 'trial' && this.trialEndDate && new Date() <= this.trialEndDate;
});

// Method to calculate renewal date
userSubscriptionSchema.methods.getRenewalDate = function() {
  if (!this.endDate) return null;

  const renewalDate = new Date(this.endDate);

  if (this.billingCycle === 'monthly') {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  } else if (this.billingCycle === 'annual') {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  }

  return renewalDate;
};

// Method to extend subscription
userSubscriptionSchema.methods.extendSubscription = function(extensionDays) {
  if (!this.endDate) {
    this.endDate = new Date();
  }

  this.endDate = new Date(this.endDate.getTime() + (extensionDays * 24 * 60 * 60 * 1000));
  this.updatedAt = new Date();

  return this.save();
};

// Method to cancel subscription
userSubscriptionSchema.methods.cancelSubscription = function(reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.autoRenew = false;
  this.updatedAt = new Date();

  return this.save();
};

// Static method to get active subscriptions for a user
userSubscriptionSchema.statics.getActiveSubscriptionsForUser = function(userId) {
  return this.find({
    userId,
    status: { $in: ['active', 'trial'] },
    endDate: { $gt: new Date() }
  }).populate('subscriptionPlanId').sort({ createdAt: -1 });
};

// Static method to get subscription history for a user
userSubscriptionSchema.statics.getSubscriptionHistoryForUser = function(userId) {
  return this.find({ userId })
    .populate('subscriptionPlanId')
    .populate('previousSubscriptionId')
    .sort({ createdAt: -1 });
};

// Static method to get all active subscriptions
userSubscriptionSchema.statics.getAllActiveSubscriptions = function() {
  return this.find({
    status: { $in: ['active', 'trial'] },
    endDate: { $gt: new Date() }
  }).populate('userId', 'firstName lastName email role pgId')
    .populate('subscriptionPlanId')
    .sort({ createdAt: -1 });
};

// Static method to get subscriptions expiring soon
userSubscriptionSchema.statics.getExpiringSoonSubscriptions = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    status: { $in: ['active', 'trial'] },
    endDate: { $lte: futureDate, $gt: new Date() }
  }).populate('userId', 'firstName lastName email role pgId')
    .populate('subscriptionPlanId')
    .sort({ endDate: 1 });
};

// Static method to get subscription statistics
userSubscriptionSchema.statics.getSubscriptionStats = async function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get status-based stats with revenue from active subscriptions only
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
      }
    }
  ]);

  // Get billing cycle stats with revenue from active subscriptions only
  const billingCycleStats = await this.aggregate([
    {
      $group: {
        _id: '$billingCycle',
        count: { $sum: 1 },
        totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
      }
    }
  ]);

  // Calculate revenue by billing cycle from active subscriptions only
  const revenueByBillingCycle = await this.aggregate([
    {
      $match: {
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$billingCycle',
        totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
      }
    }
  ]);

  // Get expiring soon (next 30 days) and expired this month
  const expiringSoon = await this.aggregate([
    {
      $match: {
        status: 'active',
        endDate: {
          $gte: now,
          $lte: thirtyDaysFromNow
        }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    }
  ]);

  const expiredThisMonth = await this.aggregate([
    {
      $match: {
        status: { $in: ['expired', 'cancelled'] },
        endDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    }
  ]);

  // Get trial-specific stats
  const trialStats = await this.aggregate([
    {
      $match: {
        billingCycle: 'trial'
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const trialExpiredThisMonth = await this.aggregate([
    {
      $match: {
        billingCycle: 'trial',
        status: { $in: ['expired', 'cancelled'] },
        endDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    }
  ]);

  // Extract individual counts
  const monthlyStats = billingCycleStats.find(s => s._id === 'monthly') || { count: 0, totalRevenue: 0 };
  const annualStats = billingCycleStats.find(s => s._id === 'annual') || { count: 0, totalRevenue: 0 };
  const trialBillingStats = billingCycleStats.find(s => s._id === 'trial') || { count: 0, totalRevenue: 0 };

  // Extract revenue by billing cycle from active subscriptions
  const monthlyRevenueStats = revenueByBillingCycle.find(s => s._id === 'monthly') || { totalRevenue: 0 };
  const annualRevenueStats = revenueByBillingCycle.find(s => s._id === 'annual') || { totalRevenue: 0 };
  const trialRevenueStats = revenueByBillingCycle.find(s => s._id === 'trial') || { totalRevenue: 0 };

  const trialActiveCount = trialStats.find(s => s._id === 'active')?.count || 0;
  const trialExpiredCount = trialExpiredThisMonth[0]?.count || 0;

  return {
    byStatus: stats,
    byBillingCycle: billingCycleStats,

    // Formatted data for frontend stats cards
    totalActive: stats.find(s => s._id === 'active')?.count || 0,
    totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0), // Revenue from active subscriptions only

    // Billing cycle counts (current active subscriptions)
    monthlyCount: monthlyStats.count,
    annualCount: annualStats.count,

    // Revenue breakdown from active subscriptions only
    monthlyRevenue: monthlyRevenueStats.totalRevenue, // Revenue from currently active monthly subscriptions
    annualRevenue: annualRevenueStats.totalRevenue, // Revenue from currently active annual subscriptions

    // Trial stats
    trialActiveCount: trialActiveCount,
    trialExpiredCount: trialExpiredCount,

    // Expiring and expired stats
    expiringSoonCount: expiringSoon[0]?.count || 0,
    expiredCount: expiredThisMonth[0]?.count || 0
  };
};

// Indexes for better query performance
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ subscriptionPlanId: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1, status: 1 });
userSubscriptionSchema.index({ startDate: 1 });
userSubscriptionSchema.index({ billingCycle: 1 });
userSubscriptionSchema.index({ status: 1, endDate: 1 });

// Pre-save middleware to validate dates
userSubscriptionSchema.pre('save', function(next) {
  // Ensure end date is after start date
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }

  // Ensure trial end date is set for trial subscriptions
  if (this.billingCycle === 'trial' && !this.trialEndDate) {
    return next(new Error('Trial end date is required for trial subscriptions'));
  }

  // Validate bed and branch usage (only if defined)
  if (this.currentBedUsage && this.currentBedUsage > this.totalBeds) {
    return next(new Error('Current bed usage cannot exceed total beds'));
  }

  if (this.currentBranchUsage && this.currentBranchUsage > this.totalBranches) {
    return next(new Error('Current branch usage cannot exceed total branches'));
  }

  next();
});

// Handle model registration (avoid re-registration error)
let UserSubscription;
try {
  UserSubscription = mongoose.model('UserSubscription');
} catch (error) {
  UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
}

module.exports = UserSubscription;
