const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Floor name cannot exceed 50 characters']
  },

  totalRooms: {
    type: Number,
    required: true,
    min: [1, 'Total rooms must be at least 1'],
    max: [100, 'Total rooms cannot exceed 100']
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
floorSchema.index({ pgId: 1, branchId: 1, isActive: 1 });
floorSchema.index({ createdBy: 1 });

// Ensure unique floor names within a branch
floorSchema.index({ branchId: 1, name: 1 }, { unique: true });

const Floor = mongoose.model('Floor', floorSchema);

module.exports = Floor; 