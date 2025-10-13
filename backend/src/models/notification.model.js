const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  pgId: { type: mongoose.Schema.Types.ObjectId, ref: 'PG', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roleScope: { type: String, enum: ['admin', 'superadmin', 'support', 'all'], default: 'admin' },
  type: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  data: { type: Object },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isArchived: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

notificationSchema.index({ pgId: 1, createdAt: -1 });
notificationSchema.index({ branchId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 