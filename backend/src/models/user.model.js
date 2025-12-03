const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Add Onboarding Schema
const userOnboardingSchema = new mongoose.Schema({
  pgCreation: {
    status: { 
      type: String, 
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    pgId: { type: mongoose.Schema.Types.ObjectId, ref: 'PG' },
    completedAt: Date
  },
  branchSetup: {
    status: { 
      type: String, 
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    defaultBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    completedAt: Date
  },
  pgConfiguration: {
    status: { 
      type: String, 
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    sharingTypesConfigured: { type: Boolean, default: false },
    completedAt: Date
  },
  currentOnboardingStep: {
    type: String,
    enum: [
      'pg_creation', 
      'branch_setup', 
      'pg_configuration', 
      'completed'
    ],
    default: 'pg_creation'
  }
}, { _id: false });

// Modify existing user schema to include onboarding
const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },

  // Address
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // Role and Access Control
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user', 'support', 'maintainer'],
    default: 'user'
  },
  maintainerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintainer'
  },
  
  // PG Association (for admin users)
  pgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG'
  },
  
  // Subscription Management
  subscription: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
      strictPopulate: false
    },
    status: {
      type: String,
      enum: ['free', 'trial', 'active', 'expired', 'cancelled'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    trialEndDate: {
      type: Date,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    totalBeds: {
      type: Number,
      default: 1
    },
    totalBranches: {
      type: Number,
      default: 1
    },
    usage: {
      type: {
        bedsUsed: {
          type: Number,
          default: 0
        },
        branchesUsed: {
          type: Number,
          default: 0
        }
      },
      default: () => ({
        bedsUsed: 0,
        branchesUsed: 0
      })
    },
    // Custom pricing for top-up beds
    customPricing: {
      maxBedsAllowed: {
        type: Number,
        default: null
      },
      topUpBeds: {
        type: Number,
        default: 0
      },
      basePrice: {
        type: Number,
        default: 0
      },
      topUpCost: {
        type: Number,
        default: 0
      },
      totalMonthlyPrice: {
        type: Number,
        default: 0
      },
      totalAnnualPrice: {
        type: Number,
        default: 0
      },
      updatedAt: {
        type: Date,
        default: null
      }
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  tokenVersion: {
    type: Number,
    default: 0
  },
  
  // Profile
  avatar: {
    type: String,
    default: null
  },
  
  // Preferences
  language: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  
  // Timestamps
  lastLogin: Date,
  passwordChangedAt: Date,

  // Password management
  forcePasswordChange: {
    type: Boolean,
    default: false
  },
  passwordChanged: {
    type: Boolean,
    default: false
  },
  
  // Sales-specific fields
  salesRole: {
    type: String,
    enum: {
      values: ['sales', 'sub_sales'],
      message: 'salesRole must be either "sales" or "sub_sales"'
    },
    required: false,
    default: undefined,
    validate: {
      validator: function(value) {
        // Allow empty string, null, or undefined for non-sales users
        if (!value || value === '' || value === null || value === undefined) {
          return true;
        }
        // For actual values, must be 'sales' or 'sub_sales'
        return ['sales', 'sub_sales'].includes(value);
      },
      message: 'salesRole must be either "sales" or "sub_sales"'
    }
  },
  parentSalesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  salesUniqueId: {
    type: String,
    unique: true,
    sparse: true
  },
  salesCommissionRate: {
    type: Number,
    default: 0
  },
  salesPerformanceMetrics: {
    totalPGsAdded: {
      type: Number,
      default: 0
    },
    activeSubscriptionPGs: {
      type: Number,
      default: 0
    },
    totalCommissionEarned: {
      type: Number,
      default: 0
    },
    lastPGAddedDate: {
      type: Date,
      default: null
    }
  },
  // PG Configuration Status
  pgConfigured: {
    type: Boolean,
    default: false
  },

  // Payment History
  paymentHistory: [{
    razorpayPaymentId: {
      type: String,
      required: true
    },
    razorpayOrderId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['paid', 'failed', 'pending', 'cancelled'],
      default: 'paid'
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'card', 'netbanking', 'upi', 'wallet'],
      default: 'razorpay'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly'
    },
    planDetails: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
      },
      planName: String,
      bedCount: {
        type: Number,
        default: 1
      },
      branchCount: {
        type: Number,
        default: 1
      }
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    description: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],

  // Default Branch Configuration
  defaultBranch: {
    type: Boolean,
    default: false
  },
  defaultBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },

  // Onboarding
  onboarding: {
    type: userOnboardingSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Compound unique index for phone and pgId
userSchema.index({ phone: 1, pgId: 1 }, { unique: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Ensure password is not already hashed
    const isAlreadyHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
    if (!isAlreadyHashed) {
      // Hash password with cost of 12
      this.password = await bcrypt.hash(this.password, 12);
    }
    this.passwordChangedAt = Date.now() - 1000; // Ensure token is created after password change
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
          process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      type: 'refresh',
      tokenVersion: this.tokenVersion || 0
    },
          process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production',
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
  );
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() }
  });
};

// Method to check password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Static method to cleanup users with invalid salesRole values
userSchema.statics.cleanupInvalidSalesRoles = async function() {
  try {
    const result = await this.updateMany(
      { salesRole: null },
      { $unset: { salesRole: 1 } }
    );

    console.log(`✅ Cleaned up ${result.modifiedCount} users with null salesRole values`);
    return result;
  } catch (error) {
    console.error('Error cleaning up invalid salesRole values:', error);
    throw error;
  }
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 