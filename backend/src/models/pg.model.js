const mongoose = require('mongoose');

const sharingTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const pgSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    street: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: ''
    },
    landmark: {
      type: String,
      trim: true,
      default: ''
    }
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Sharing Types Configuration
  sharingTypes: [{
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ['1-sharing', '2-sharing', '3-sharing', '4-sharing']
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: [
      'active', 
      'inactive', 
      'maintenance', 
      'suspended', 
      'closed'  
    ],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Sales information (optional - only populated when created by sales users)
  salesManager: {
    type: String,
    trim: true,
    default: ''
  },
  salesStaff: {
    type: String,
    trim: true,
    default: ''
  },
  // Track who added this PG (sales person ID)
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // PG Configuration Status
  isConfigured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
pgSchema.index({ createdBy: 1 });
pgSchema.index({ admin: 1 });
pgSchema.index({ isActive: 1 });

// Pre-save middleware to ensure required fields
pgSchema.pre('save', function(next) {
  if (!this.name || !this.admin || !this.createdBy) {
    return next(new Error('Missing required fields: name, admin, createdBy'));
  }
  next();
});

const PG = mongoose.model('PG', pgSchema);

module.exports = PG; 