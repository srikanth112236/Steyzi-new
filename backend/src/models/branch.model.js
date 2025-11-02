const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  pgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: true
  },
  maintainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintainer',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits']
    },
    landmark: {
      type: String,
      trim: true
    }
  },
  contact: {
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, 'Phone number must be 10 digits']
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    alternatePhone: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, 'Alternate phone number must be 10 digits']
    }
  },
  capacity: {
    totalRooms: {
      type: Number,
      default: 0,
      min: [0, 'Total rooms cannot be negative']
    },
    totalBeds: {
      type: Number,
      default: 0,
      min: [0, 'Total beds cannot be negative']
    },
    availableRooms: {
      type: Number,
      default: 0,
      min: [0, 'Available rooms cannot be negative']
    }
  },
  amenities: [{
    type: String,
    enum: ['WiFi', 'AC', 'Food', 'Cleaning', 'Security', 'Parking', 'Gym', 'TV', 'Refrigerator', 'Geyser', 'Furnished']
  }],
  sharingTypes: [{
    type: {
      type: String,
      required: true,
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
      min: [0, 'Cost cannot be negative']
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'full'],
    default: 'active'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries (NO unique constraints on isDefault)
branchSchema.index({ pgId: 1, isActive: 1 });
branchSchema.index({ pgId: 1, isDefault: 1, isActive: 1 });
branchSchema.index({ createdBy: 1 });
branchSchema.index({ status: 1 });
branchSchema.index({ maintainerId: 1 });

// Virtual for full address
branchSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
});

// Virtual for occupancy rate
branchSchema.virtual('occupancyRate').get(function() {
  if (this.capacity.totalRooms === 0) return 0;
  const occupied = this.capacity.totalRooms - this.capacity.availableRooms;
  return Math.round((occupied / this.capacity.totalRooms) * 100);
});

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch; 