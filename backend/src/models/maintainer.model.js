const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const maintainerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  pgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: true
  },
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
  specialization: {
    type: [String],
    enum: ['maintenance', 'housekeeping', 'security', 'general'],
    default: ['general']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  contactDetails: {
    primaryPhone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    alternatePhone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add pagination plugin
maintainerSchema.plugin(mongoosePaginate);

// Virtual to get assigned branch count
maintainerSchema.virtual('assignedBranchCount').get(function() {
  return this.branches.length;
});

// Indexing for performance
maintainerSchema.index({ user: 1 });
maintainerSchema.index({ status: 1 });
maintainerSchema.index({ branches: 1 });
maintainerSchema.index({ pgId: 1 });

const Maintainer = mongoose.model('Maintainer', maintainerSchema);

module.exports = Maintainer;
