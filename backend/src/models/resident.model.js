const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
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
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  alternatePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  
  // Address Information
  permanentAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Pincode must be 6 digits']
    }
  },
  
  // Work Details (Optional)
  workDetails: {
    company: {
      type: String
    },
    designation: {
      type: String
    },
    workAddress: {
      type: String
    },
    workPhone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    workEmail: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    salary: {
      type: Number,
      min: [0, 'Salary cannot be negative']
    },
    joiningDate: {
      type: Date
    }
  },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    address: {
      type: String,
      required: [true, 'Emergency contact address is required']
    }
  },
  
  // PG Association
  pgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: [true, 'PG ID is required']
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch ID is required']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  
  // Room Assignment
  roomNumber: {
    type: String
  },
  bedNumber: {
    type: String,
    trim: true
  },
  
  // Sharing Type and Cost
  sharingType: {
    type: String,
    enum: ['1-sharing', '2-sharing', '3-sharing', '4-sharing']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  
  // Status and Dates
  status: {
    type: String,
    enum: ['active', 'inactive', 'moved_out', 'pending', 'notice_period'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  lastPaymentDate: {
    type: Date
  },
  
  // Payment Information
  advancePayment: {
    amount: {
      type: Number,
      min: [0, 'Advance amount cannot be negative'],
      default: 0
    },
    date: {
      type: Date
    },
    receiptNumber: {
      type: String,
      trim: true
    }
  },
  rentPayment: {
    amount: {
      type: Number,
      min: [0, 'Rent amount cannot be negative'],
      default: 0
    },
    date: {
      type: Date
    },
    receiptNumber: {
      type: String,
      trim: true
    }
  },
  totalAmountPaid: {
    type: Number,
    min: [0, 'Total amount cannot be negative'],
    default: 0
  },
  checkInDate: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOutDate: {
    type: Date
  },
  contractStartDate: {
    type: Date,
    required: [true, 'Contract start date is required']
  },
  contractEndDate: {
    type: Date
  },
  
  // Vacation Fields
  vacationDate: {
    type: Date
  },
  noticeDays: {
    type: Number,
    min: [1, 'Notice days must be at least 1'],
    max: [90, 'Notice days cannot exceed 90']
  },
  
  // Documents (Optional)
  documents: {
    idProof: {
      type: String // File path
    },
    addressProof: {
      type: String // File path
    },
    workId: {
      type: String // File path
    },
    photo: {
      type: String // File path
    }
  },
  
  // Additional Information
  dietaryRestrictions: {
    type: String,
    maxlength: [200, 'Dietary restrictions cannot exceed 200 characters']
  },
  medicalConditions: {
    type: String,
    maxlength: [500, 'Medical conditions cannot exceed 500 characters']
  },
  specialRequirements: {
    type: String,
    maxlength: [500, 'Special requirements cannot exceed 500 characters']
  },
  
  // Notes and Comments
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Room Switching History
  switchHistory: [{
    fromRoom: {
      type: String,
      required: true
    },
    fromBed: {
      type: String,
      required: true
    },
    toRoom: {
      type: String,
      required: true
    },
    toBed: {
      type: String,
      required: true
    },
    switchDate: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
residentSchema.index({ pgId: 1, branchId: 1, isActive: 1 });
residentSchema.index({ email: 1 });
residentSchema.index({ phone: 1 });
residentSchema.index({ status: 1 });
residentSchema.index({ roomId: 1 });
residentSchema.index({ createdBy: 1 });

// Virtual for full name
residentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
residentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for duration of stay
residentSchema.virtual('stayDuration').get(function() {
  if (!this.checkInDate) return null;
  const today = new Date();
  const checkIn = new Date(this.checkInDate);
  const diffTime = Math.abs(today - checkIn);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for payment history
residentSchema.virtual('paymentHistory', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'residentId',
  justOne: false
});

// Pre-save middleware
residentSchema.pre('save', function(next) {
  // Update the updatedBy field
  this.updatedBy = this.createdBy;
  next();
});

// Static method to get residents by PG
residentSchema.statics.getResidentsByPG = function(pgId, filters = {}) {
  const query = { pgId, isActive: true, ...filters };
  return this.find(query)
    .populate('roomId', 'roomNumber floorId')
    .populate('branchId', 'name')
    .sort({ createdAt: -1 });
};

// Static method to get residents by room
residentSchema.statics.getResidentsByRoom = function(roomId) {
  return this.find({ roomId, isActive: true })
    .populate('roomId', 'roomNumber')
    .sort({ createdAt: -1 });
};

// Static method to get active residents count
residentSchema.statics.getActiveResidentsCount = function(pgId) {
  return this.countDocuments({ pgId, status: 'active', isActive: true });
};

// Instance method to check if resident can be assigned to room
residentSchema.methods.canAssignToRoom = function(roomId, bedNumber) {
  // Check if room and bed are available
  return this.model('Resident').findOne({
    roomId,
    bedNumber,
    status: 'active',
    isActive: true
  }).then(existingResident => {
    return !existingResident || existingResident._id.equals(this._id);
  });
};

const Resident = mongoose.model('Resident', residentSchema);

module.exports = Resident; 