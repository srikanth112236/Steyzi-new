const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SalesManagerSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },

  // Role and permissions
  role: {
    type: String,
    default: 'sales_manager',
    enum: ['sales_manager']
  },

  // Authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Sales Performance
  performanceMetrics: {
    totalSubSalesStaff: {
      type: Number,
      default: 0
    },
    totalPGsAdded: {
      type: Number,
      default: 0
    },
    activeSubscriptionPGs: {
      type: Number,
      default: 0
    },
    totalCommissionGenerated: {
      type: Number,
      default: 0
    }
  },

  // Commission Settings (set by superadmin)
  commissionRate: {
    type: Number,
    required: [true, 'Commission rate is required'],
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%'],
    default: 10 // Default 10%
  },

  // Account Management
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  forcePasswordChange: {
    type: Boolean,
    default: true // Force password change on first login
  },
  passwordChanged: {
    type: Boolean,
    default: false // Track if password has been changed at least once
  },

  // Unique Identifier
  salesUniqueId: {
    type: String,
    unique: true,
    required: true
  },

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Password hashing middleware
SalesManagerSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  // Hash password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
SalesManagerSchema.methods.correctPassword = async function(
  candidatePassword, 
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Virtual for full name
SalesManagerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const SalesManager = mongoose.model('SalesManager', SalesManagerSchema);

module.exports = SalesManager;
