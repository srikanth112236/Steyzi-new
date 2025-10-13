const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  pgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PG',
    required: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  publicUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsed: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
qrCodeSchema.index({ pgId: 1, isActive: 1 });
qrCodeSchema.index({ qrCode: 1 }, { unique: true });

// Virtual for full URL
qrCodeSchema.virtual('fullUrl').get(function() {
  return `${process.env.FRONTEND_URL || 'https://a2abd294ffa2.ngrok-free.app'}/public/${this.publicUrl}`;
});

// Method to generate QR code
qrCodeSchema.methods.generateQRCode = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
};

// Method to increment usage
qrCodeSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('QRCode', qrCodeSchema); 