const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'view',
      'create',
      'update',
      'delete',
      'login',
      'logout',
      'export',
      'import',
      'approve',
      'reject',
      'book',
      'cancel',
      'complete',
      'assign',
      'unassign',
      'configure',
      'generate',
      'upload',
      'download',
      'error',
      'branch_create',
      'branch_update',
      'branch_delete',
      'pg_configure',
      'other'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['superadmin', 'admin', 'support', 'user']
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'user',
      'branch',
      'room',
      'bed',
      'resident',
      'payment',
      'ticket',
      'document',
      'report',
      'settings',
      'notification',
      'activity',
      'other'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  entityName: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: true,
    enum: [
      'authentication',
      'navigation',
      'user',
      'branch',
      'room',
      'resident',
      'payment',
      'ticket',
      'document',
      'report',
      'settings',
      'notification',
      'system',
      'error',
      'management',
      'other'
    ]
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'success', 'info', 'warning', 'error'],
    default: 'completed'
  },
  metadata: {
    method: String,
    path: String,
    query: Object,
    params: Object,
    body: Object,
    response: Object,
    userAgent: String,
    ip: String,
    additionalInfo: Object
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activitySchema.index({ timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ branchId: 1, timestamp: -1 });
activitySchema.index({ userRole: 1, timestamp: -1 });
activitySchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
activitySchema.index({ category: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ status: 1, timestamp: -1 });

// Text index for search
activitySchema.index({
  title: 'text',
  description: 'text',
  entityName: 'text',
  userEmail: 'text'
});

// Pre-save middleware to ensure data consistency
activitySchema.pre('save', function(next) {
  // Set default status based on type if not explicitly set
  if (!this.status) {
    switch (this.type) {
      case 'error':
        this.status = 'error';
        break;
      case 'create':
      case 'update':
      case 'delete':
        this.status = 'success';
        break;
      default:
        this.status = 'info';
    }
  }

  // Set priority based on type and category if not explicitly set
  if (!this.priority) {
    if (this.type === 'error' || this.category === 'error') {
      this.priority = 'high';
    } else if (this.category === 'payment' || this.category === 'resident') {
      this.priority = 'high';
    } else {
      this.priority = 'normal';
    }
  }

  next();
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;