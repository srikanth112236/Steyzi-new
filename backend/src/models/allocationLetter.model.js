const mongoose = require('mongoose');

const allocationLetterSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  allocationData: {
    resident: {
      firstName: String,
      lastName: String,
      phone: String,
      email: String,
      _id: mongoose.Schema.Types.ObjectId
    },
    sharingType: {
      id: String,
      name: String,
      cost: Number
    },
    room: {
      _id: mongoose.Schema.Types.ObjectId,
      roomNumber: String,
      floor: {
        name: String
      }
    },
    bedNumber: String,
    onboardingDate: Date,
    allocationDate: Date
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date,
    default: null
  },
  previewData: {
    type: String, // Base64 encoded PDF data for preview
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
allocationLetterSchema.index({ residentId: 1, createdAt: -1 });
allocationLetterSchema.index({ generatedBy: 1, createdAt: -1 });
allocationLetterSchema.index({ status: 1 });

// Virtual for full resident name
allocationLetterSchema.virtual('residentFullName').get(function() {
  if (this.allocationData && this.allocationData.resident) {
    return `${this.allocationData.resident.firstName} ${this.allocationData.resident.lastName}`;
  }
  return 'Unknown';
});

// Method to increment download count
allocationLetterSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Method to get formatted allocation details
allocationLetterSchema.methods.getFormattedDetails = function() {
  return {
    _id: this._id,
    fileName: this.fileName,
    residentName: this.residentFullName,
    roomNumber: this.allocationData?.room?.roomNumber,
    bedNumber: this.allocationData?.bedNumber,
    monthlyRent: this.allocationData?.sharingType?.cost,
    onboardingDate: this.allocationData?.onboardingDate,
    generatedOn: this.createdAt,
    downloadCount: this.downloadCount,
    lastDownloaded: this.lastDownloaded,
    previewData: this.previewData,
    allocationData: this.allocationData
  };
};

module.exports = mongoose.model('AllocationLetter', allocationLetterSchema); 