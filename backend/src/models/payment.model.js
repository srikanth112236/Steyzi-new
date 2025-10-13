const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
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
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online_transfer', 'upi', 'card', 'other'],
    default: 'other'
  },
  receiptImage: {
    fileName: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ residentId: 1, month: 1, year: 1 });
paymentSchema.index({ pgId: 1, status: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ markedBy: 1 });

// Ensure no paymentId field exists to prevent duplicate key errors
paymentSchema.index({ _id: 1 }, { unique: true });

// Virtual for formatted payment date
paymentSchema.virtual('formattedPaymentDate').get(function() {
  return this.paymentDate.toLocaleDateString('en-IN');
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString()}`;
});

// Method to get payment status badge
paymentSchema.methods.getStatusBadge = function() {
  const statusConfig = {
    paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
    pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    overdue: { color: 'bg-red-100 text-red-800', text: 'Overdue' },
    cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
  };
  return statusConfig[this.status] || statusConfig.pending;
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(pgId) {
  const stats = await this.aggregate([
    { $match: { pgId: new mongoose.Types.ObjectId(pgId), isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    totalPayments: 0,
    totalAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    overdueCount: 0,
    overdueAmount: 0
  };
  
  stats.forEach(stat => {
    result.totalPayments += stat.count;
    result.totalAmount += stat.totalAmount;
    
    if (stat._id === 'paid') {
      result.paidCount = stat.count;
      result.paidAmount = stat.totalAmount;
    } else if (stat._id === 'pending') {
      result.pendingCount = stat.count;
      result.pendingAmount = stat.totalAmount;
    } else if (stat._id === 'overdue') {
      result.overdueCount = stat.count;
      result.overdueAmount = stat.totalAmount;
    }
  });
  
  return result;
};

// Static method to get monthly payments
paymentSchema.statics.getMonthlyPayments = async function(pgId, year, month) {
  return await this.find({
    pgId: new mongoose.Types.ObjectId(pgId),
    year: year,
    month: month,
    isActive: true
  }).populate('residentId', 'firstName lastName phone email')
    .populate('roomId', 'roomNumber sharingType')
    .populate('markedBy', 'firstName lastName')
    .sort({ paymentDate: -1 });
};

// Pre-save middleware to set month and year and ensure no paymentId field
paymentSchema.pre('save', function(next) {
  if (this.paymentDate) {
    const date = new Date(this.paymentDate);
    this.month = date.toLocaleString('en-US', { month: 'long' });
    this.year = date.getFullYear();
  }
  
  // Ensure no paymentId field exists to prevent duplicate key errors
  if (this.paymentId !== undefined) {
    delete this.paymentId;
  }
  
  next();
});

// Pre-validate middleware to ensure no paymentId field
paymentSchema.pre('validate', function(next) {
  // Remove paymentId field if it exists to prevent duplicate key errors
  if (this.paymentId !== undefined) {
    delete this.paymentId;
  }
  next();
});

// Static method to clean up any existing paymentId fields
paymentSchema.statics.cleanupPaymentIdFields = async function() {
  try {
    // Update all documents to remove paymentId field if it exists
    const result = await this.updateMany(
      { paymentId: { $exists: true } },
      { $unset: { paymentId: 1 } }
    );
    
    console.log(`Cleaned up paymentId fields from ${result.modifiedCount} documents`);
    return result;
  } catch (error) {
    console.error('Error cleaning up paymentId fields:', error);
    throw error;
  }
};

// Static method to drop problematic indexes
paymentSchema.statics.dropProblematicIndexes = async function() {
  try {
    const db = this.db;
    const collection = db.collection('payments');
    
    // Get all indexes
    const indexes = await collection.indexes();
    
    // Find and drop paymentId_1 index if it exists
    const paymentIdIndex = indexes.find(index => index.name === 'paymentId_1');
    if (paymentIdIndex) {
      await collection.dropIndex('paymentId_1');
      console.log('✅ Successfully dropped paymentId_1 index');
    } else {
      console.log('ℹ️ paymentId_1 index not found');
    }
    
    return true;
  } catch (error) {
    console.error('Error dropping problematic indexes:', error);
    throw error;
  }
};

module.exports = mongoose.model('Payment', paymentSchema); 