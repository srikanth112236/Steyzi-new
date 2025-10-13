const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: true,
    trim: true
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  occupiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    default: null
  },
  occupiedAt: {
    type: Date,
    default: null
  },
  reservation: {
    bedNumber: String,
    currentResidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident'
    },
    newResidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident'
    },
    expectedAvailabilityDate: Date,
    reservationDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    }
  }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  pgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  floorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
    required: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  numberOfBeds: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  beds: {
    type: [bedSchema],
    default: []
  },
  sharingType: {
    type: String,
    required: true,
    enum: ['1-sharing', '2-sharing', '3-sharing', '4-sharing']
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },

  isOccupied: {
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

// Index for efficient queries
roomSchema.index({ pgId: 1, branchId: 1, floorId: 1, isActive: 1 });
roomSchema.index({ roomNumber: 1, branchId: 1 });
roomSchema.index({ createdBy: 1 });

// Virtual for available beds count
roomSchema.virtual('availableBeds').get(function() {
  return this.beds.filter(bed => !bed.isOccupied).length;
});

// Virtual for occupied beds count
roomSchema.virtual('occupiedBeds').get(function() {
  return this.beds.filter(bed => bed.isOccupied).length;
});

// Method to initialize beds when room is created
roomSchema.methods.initializeBeds = function(customBedNumbers = []) {
  this.beds = [];
  
  // If custom bed numbers are provided, use them
  if (customBedNumbers && customBedNumbers.length > 0) {
    for (let i = 0; i < this.numberOfBeds; i++) {
      const bedNumber = customBedNumbers[i] || String(i + 1);
      this.beds.push({
        bedNumber: String(bedNumber),
        isOccupied: false,
        occupiedBy: null,
        occupiedAt: null
      });
    }
  } else {
    // Auto-generate bed numbers as strings ("1", "2", "3"...)
    for (let i = 1; i <= this.numberOfBeds; i++) {
      this.beds.push({
        bedNumber: String(i),
        isOccupied: false,
        occupiedBy: null,
        occupiedAt: null
      });
    }
  }
  return this;
};

// Method to get available beds
roomSchema.methods.getAvailableBeds = function() {
  return this.beds.filter(bed => !bed.isOccupied);
};

// Method to get occupied beds
roomSchema.methods.getOccupiedBeds = function() {
  return this.beds.filter(bed => bed.isOccupied);
};

// Method to assign bed to resident
roomSchema.methods.assignBed = function(bedNumber, residentId) {
  const bed = this.beds.find(b => String(b.bedNumber) === String(bedNumber));
  if (bed && !bed.isOccupied) {
    bed.isOccupied = true;
    bed.occupiedBy = residentId;
    bed.occupiedAt = new Date();
    this.isOccupied = this.beds.every(b => b.isOccupied);
    return true;
  }
  return false;
};

// Method to unassign bed
roomSchema.methods.unassignBed = function(bedNumber) {
  const bed = this.beds.find(b => String(b.bedNumber) === String(bedNumber));
  if (bed && bed.isOccupied) {
    bed.isOccupied = false;
    bed.occupiedBy = null;
    bed.occupiedAt = null;
    this.isOccupied = this.beds.every(b => b.isOccupied);
    return true;
  }
  return false;
};

// Ensure unique room numbers within a branch
roomSchema.index({ roomNumber: 1, branchId: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 