const mongoose = require('mongoose');

const paymentInfoSchema = new mongoose.Schema({
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
  // UPI Information
  upiId: {
    type: String,
    required: true,
    trim: true
  },
  upiName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Bank Account Information
  accountHolderName: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  
  // Additional Payment Details
  gpayNumber: {
    type: String,
    trim: true
  },
  paytmNumber: {
    type: String,
    trim: true
  },
  phonepeNumber: {
    type: String,
    trim: true
  },
  
  // QR Code for payments
  qrCodeImagePath: {
    type: String,
    trim: true
  },
  
  // Payment Instructions
  paymentInstructions: {
    type: String,
    trim: true,
    default: 'Please make payment and upload screenshot for verification.'
  },
  
  // Pricing Information
  perDayCost: {
    type: Number,
    default: 0,
    min: [0, 'Per day cost cannot be negative']
  },
  advanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Advance amount cannot be negative']
  },
  
  // PG Rules
  pgRules: [{
    type: String,
    trim: true
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Audit fields
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

// Indexes
paymentInfoSchema.index({ pgId: 1, branchId: 1 });
paymentInfoSchema.index({ upiId: 1 });
paymentInfoSchema.index({ isActive: 1 });

// Ensure only one active payment info per branch
paymentInfoSchema.index({ branchId: 1, isActive: 1 }, { 
  unique: true, 
  partialFilterExpression: { isActive: true } 
});

module.exports = mongoose.model('PaymentInfo', paymentInfoSchema); 