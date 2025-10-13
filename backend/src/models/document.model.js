const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    required: true,
    enum: [
      'allocation_letter',
      'id_proof',
      'address_proof',
      'income_proof',
      'rent_agreement',
      'medical_certificate',
      'character_certificate',
      'college_id',
      'office_id',
      'other'
    ]
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  previewData: {
    type: String, // Base64 encoded preview for images/PDFs
    default: null
  },
  isPreviewAvailable: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    description: String,
    tags: [String],
    expiryDate: Date,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationNotes: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
documentSchema.index({ residentId: 1, documentType: 1 });
documentSchema.index({ branchId: 1, isActive: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ 'metadata.verificationStatus': 1 });

// Virtual for document type display name
documentSchema.virtual('documentTypeDisplay').get(function() {
  const typeMap = {
    'allocation_letter': 'Allocation Letter',
    'id_proof': 'ID Proof',
    'address_proof': 'Address Proof',
    'income_proof': 'Income Proof',
    'rent_agreement': 'Rent Agreement',
    'medical_certificate': 'Medical Certificate',
    'character_certificate': 'Character Certificate',
    'college_id': 'College ID',
    'office_id': 'Office ID',
    'other': 'Other Document'
  };
  return typeMap[this.documentType] || this.documentType;
});

// Virtual for file size in human readable format
documentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for verification status color
documentSchema.virtual('verificationStatusColor').get(function() {
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'verified': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800'
  };
  return statusColors[this.metadata?.verificationStatus] || 'bg-gray-100 text-gray-800';
});

// Method to increment download count
documentSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to generate preview data
documentSchema.methods.generatePreview = async function() {
  // This would be implemented based on file type
  // For now, we'll set a flag indicating preview is available
  this.isPreviewAvailable = true;
  return this.save();
};

// Static method to get documents by resident
documentSchema.statics.getByResident = function(residentId, options = {}) {
  const query = { residentId, isActive: true };
  
  if (options.documentType) {
    query.documentType = options.documentType;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get document statistics
documentSchema.statics.getStats = function(residentId) {
  return this.aggregate([
    { $match: { residentId: new mongoose.Types.ObjectId(residentId), isActive: true } },
    {
      $group: {
        _id: '$documentType',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    }
  ]);
};

module.exports = mongoose.model('Document', documentSchema); 