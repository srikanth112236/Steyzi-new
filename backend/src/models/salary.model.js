const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const salarySchema = new mongoose.Schema({
  maintainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintainer',
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
  month: {
    type: String,
    required: true,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  baseSalary: {
    type: Number,
    required: true,
    min: [0, 'Base salary must be non-negative']
  },
  deductions: {
    other: { type: Number, default: 0, min: 0 }
  },
  bonus: {
    type: Number,
    default: 0,
    min: 0
  },
  overtime: {
    hours: { type: Number, default: 0, min: 0 },
    rate: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 }
  },
  grossSalary: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeductions: {
    type: Number,
    default: 0,
    min: 0
  },
  netSalary: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online_transfer', 'upi', 'cheque', 'card'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online_transfer', 'upi', 'cheque', 'card'],
      required: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentDate: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true
    },
    receiptImage: {
      fileName: String,
      originalName: String,
      filePath: String,
      fileSize: Number,
      mimeType: String
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    paidAt: {
      type: Date,
      default: Date.now
    }
  }],
  transactionId: {
    type: String,
    trim: true
  },
  receiptImage: {
    fileName: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paidAt: {
    type: Date
  },
  editLockExpiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add pagination plugin
salarySchema.plugin(mongoosePaginate);

// Indexes for better query performance
salarySchema.index({ maintainerId: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ pgId: 1, status: 1 });
salarySchema.index({ branchId: 1 });
salarySchema.index({ paymentDate: -1 });
salarySchema.index({ paidBy: 1 });
salarySchema.index({ month: 1, year: 1 });

// Virtual for formatted payment date
salarySchema.virtual('formattedPaymentDate').get(function() {
  return this.paymentDate ? this.paymentDate.toLocaleDateString('en-IN') : null;
});

// Virtual for formatted amounts
salarySchema.virtual('formattedGrossSalary').get(function() {
  return `₹${this.grossSalary.toLocaleString()}`;
});

salarySchema.virtual('formattedNetSalary').get(function() {
  return `₹${this.netSalary.toLocaleString()}`;
});

salarySchema.virtual('formattedPaidAmount').get(function() {
  return `₹${this.paidAmount.toLocaleString()}`;
});

salarySchema.virtual('formattedPendingAmount').get(function() {
  return `₹${this.pendingAmount.toLocaleString()}`;
});

// Virtual for period
salarySchema.virtual('period').get(function() {
  return `${this.month} ${this.year}`;
});

// Method to get salary status badge
salarySchema.methods.getStatusBadge = function() {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
    partially_paid: { color: 'bg-orange-100 text-orange-800', text: 'Partially Paid' },
    overdue: { color: 'bg-red-100 text-red-800', text: 'Overdue' },
    cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
  };
  return statusConfig[this.getCalculatedStatus()] || statusConfig.pending;
};

// Method to get payment method badge
salarySchema.methods.getPaymentMethodBadge = function() {
  const methodConfig = {
    cash: { color: 'bg-green-100 text-green-800', text: 'Cash' },
    online_transfer: { color: 'bg-blue-100 text-blue-800', text: 'Online Transfer' },
    upi: { color: 'bg-purple-100 text-purple-800', text: 'UPI' },
    cheque: { color: 'bg-yellow-100 text-yellow-800', text: 'Cheque' },
    card: { color: 'bg-red-100 text-red-800', text: 'Card' }
  };
  return methodConfig[this.paymentMethod] || methodConfig.cash;
};

// Method to calculate total allowances (always 0 since allowances are removed)
salarySchema.methods.getTotalAllowances = function() {
  return 0;
};

// Method to calculate total deductions
salarySchema.methods.getTotalDeductions = function() {
  return this.deductions.other;
};

// Method to update payment status
salarySchema.methods.updatePaymentStatus = function() {
  // Calculate total paid from payments array
  this.paidAmount = this.payments ? this.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

  if (this.paidAmount >= this.netSalary) {
    this.status = 'paid';
    this.pendingAmount = 0;
    // Set edit lock to expire in 4 hours when fully paid
    if (!this.editLockExpiresAt) {
      this.editLockExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
    }
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
    this.pendingAmount = this.netSalary - this.paidAmount;
  } else {
    this.status = 'pending';
    this.pendingAmount = this.netSalary;
  }
};

// Method to get calculated status including overdue logic
salarySchema.methods.getCalculatedStatus = function() {
  // If already paid or cancelled, return current status
  if (this.status === 'paid' || this.status === 'cancelled') {
    return this.status;
  }

  // If partially paid, return partially paid
  if (this.status === 'partially_paid') {
    return 'partially_paid';
  }

  // Check if salary is overdue
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  const salaryYear = parseInt(this.year);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const salaryMonth = monthNames.indexOf(this.month) + 1;

  // If salary is for future months, it's pending
  if (salaryYear > currentYear || (salaryYear === currentYear && salaryMonth > currentMonth)) {
    return 'pending';
  }

  // If salary is for current month or past months and not paid, it's overdue
  if (salaryYear < currentYear || (salaryYear === currentYear && salaryMonth < currentMonth)) {
    return 'overdue';
  }

  // If salary is for current month and not paid, it's pending
  return 'pending';
};

// Method to check if salary can be edited
salarySchema.methods.canEdit = function() {
  // If not paid, always editable
  if (this.status !== 'paid') {
    return true;
  }

  // If paid, check if edit lock has expired
  if (this.editLockExpiresAt && new Date() > this.editLockExpiresAt) {
    return false; // Edit lock has expired
  }

  return true; // Within edit window
};

// Method to get remaining edit time in minutes
salarySchema.methods.getRemainingEditTime = function() {
  if (this.status !== 'paid' || !this.editLockExpiresAt) {
    return null;
  }

  const now = new Date();
  const remainingMs = this.editLockExpiresAt - now;

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / (1000 * 60)); // Return minutes
};

// Static method to get salary statistics
salarySchema.statics.getSalaryStats = async function(pgId, filters = {}) {
  const matchConditions = { pgId: new mongoose.Types.ObjectId(pgId), isActive: true };

  if (filters.branchId) {
    matchConditions.branchId = new mongoose.Types.ObjectId(filters.branchId);
  }

  if (filters.month && filters.year) {
    matchConditions.month = filters.month;
    matchConditions.year = parseInt(filters.year);
  }

  // Get all salaries and calculate status for each
  const salaries = await this.find(matchConditions);

  // Calculate statistics based on calculated status
  const statsMap = {};

  salaries.forEach(salary => {
    const calculatedStatus = salary.getCalculatedStatus();
    if (!statsMap[calculatedStatus]) {
      statsMap[calculatedStatus] = {
        count: 0,
        totalAmount: 0,
        paidAmount: 0
      };
    }
    statsMap[calculatedStatus].count += 1;
    statsMap[calculatedStatus].totalAmount += salary.netSalary;
    statsMap[calculatedStatus].paidAmount += salary.paidAmount || 0;
  });

  // Convert to array format for consistency
  const stats = Object.keys(statsMap).map(status => ({
    _id: status,
    count: statsMap[status].count,
    totalAmount: statsMap[status].totalAmount,
    paidAmount: statsMap[status].paidAmount
  }));

  const result = {
    totalSalaries: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    partiallyPaidCount: 0,
    partiallyPaidAmount: 0,
    overdueCount: 0,
    overdueAmount: 0
  };

  stats.forEach(stat => {
    result.totalSalaries += stat.count;
    result.totalAmount += stat.totalAmount;
    result.totalPaidAmount += stat.paidAmount;

    if (stat._id === 'pending') {
      result.pendingCount = stat.count;
      result.pendingAmount = stat.totalAmount;
    } else if (stat._id === 'paid') {
      result.paidCount = stat.count;
      result.paidAmount = stat.paidAmount;
    } else if (stat._id === 'partially_paid') {
      result.partiallyPaidCount = stat.count;
      result.partiallyPaidAmount = stat.paidAmount;
    } else if (stat._id === 'overdue') {
      result.overdueCount = stat.count;
      result.overdueAmount = stat.totalAmount;
    }
  });

  return result;
};

// Static method to get monthly salary trends
salarySchema.statics.getMonthlySalaryTrends = async function(pgId, year, filters = {}) {
  const matchConditions = {
    pgId: new mongoose.Types.ObjectId(pgId),
    isActive: true,
    year: year
  };

  if (filters.branchId) {
    matchConditions.branchId = new mongoose.Types.ObjectId(filters.branchId);
  }

  const monthlyData = await this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$month',
        count: { $sum: 1 },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalNetSalary: { $sum: '$netSalary' },
        totalPaidAmount: { $sum: '$paidAmount' },
        totalDeductions: { $sum: '$deductions.other' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return monthlyData;
};

// Static method to get maintainer salary summary
salarySchema.statics.getMaintainerSalarySummary = async function(maintainerId, filters = {}) {
  const matchConditions = { maintainerId: new mongoose.Types.ObjectId(maintainerId), isActive: true };

  if (filters.year) {
    matchConditions.year = parseInt(filters.year);
  }

  const summary = await this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalSalaries: { $sum: 1 },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalNetSalary: { $sum: '$netSalary' },
        totalPaidAmount: { $sum: '$paidAmount' },
        totalPendingAmount: { $sum: '$pendingAmount' },
        avgGrossSalary: { $avg: '$grossSalary' },
        avgNetSalary: { $avg: '$netSalary' }
      }
    }
  ]);

  return summary.length > 0 ? summary[0] : {
    totalSalaries: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    avgGrossSalary: 0,
    avgNetSalary: 0
  };
};

// Pre-validate middleware to calculate totals before validation
salarySchema.pre('validate', function(next) {
  try {
    // Ensure deductions object exists
    if (!this.deductions) {
      this.deductions = { other: 0 };
    }

    // Ensure overtime object exists
    if (!this.overtime) {
      this.overtime = { hours: 0, rate: 0, amount: 0 };
    }

    // Calculate total deductions (only other deductions)
    const totalDeductions = parseFloat(this.deductions.other) || 0;

    // Calculate gross salary (base + bonus + overtime only)
    const baseSalary = parseFloat(this.baseSalary) || 0;
    const bonus = parseFloat(this.bonus) || 0;
    const overtimeAmount = parseFloat(this.overtime.amount) || 0;
    this.grossSalary = baseSalary + bonus + overtimeAmount;

    // Set total deductions (for backward compatibility)
    this.totalDeductions = totalDeductions;

    // Calculate net salary (gross - deductions)
    this.netSalary = this.grossSalary - totalDeductions;

    next();
  } catch (error) {
    console.error('Error in salary pre-validate middleware:', error);
    next(error);
  }
});

// Pre-save middleware to update payment status (runs after validation)
salarySchema.pre('save', function(next) {
  try {
    // Update payment status
    this.updatePaymentStatus();
    next();
  } catch (error) {
    console.error('Error in salary pre-save middleware:', error);
    next(error);
  }
});

module.exports = mongoose.model('Salary', salarySchema);
