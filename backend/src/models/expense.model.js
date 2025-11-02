const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  // Expense details
  type: {
    type: String,
    required: [true, 'Expense type is required'],
    enum: ['server', 'maintenance', 'office', 'utilities', 'marketing', 'software', 'hardware', 'travel', 'miscellaneous'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Expense amount cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    validate: {
      validator: function(value) {
        // Cannot be a future date
        return value <= new Date();
      },
      message: 'Expense date cannot be in the future'
    }
  },
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: false,
    trim: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Receipt or document (optional)
  receipt: {
    type: String, // URL or path to receipt file
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
expenseSchema.index({ date: -1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ createdAt: -1 });

// Pre-save middleware to update updatedAt
expenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
