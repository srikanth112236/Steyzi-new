const mongoose = require('mongoose');

/**
 * Subscription Activity Log Model
 * Tracks all subscription-related activities for security and compliance
 */
const subscriptionActivitySchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },

  // Activity Details
  activityType: {
    type: String,
    required: [true, 'Activity type is required'],
    enum: [
      'subscription_created',
      'subscription_updated',
      'subscription_cancelled',
      'subscription_renewed',
      'trial_started',
      'trial_expired',
      'payment_successful',
      'payment_failed',
      'usage_limit_exceeded',
      'bed_allocated',
      'bed_deallocated',
      'branch_created',
      'feature_accessed',
      'permission_checked',
      'login_attempt',
      'logout',
      'device_fingerprint_mismatch',
      'ip_blocked',
      'suspicious_activity_detected',
      'high_risk_action_blocked',
      'fraud_attempt_detected',
      'api_key_generated',
      'api_key_revoked',
      'rate_limit_exceeded',
      'access_validation_error',
      'module_access_denied',
      'usage_limit_reached'
    ],
    index: true
  },

  // Activity Description
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Detailed activity data
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Context Information
  ipAddress: {
    type: String,
    index: true
  },

  userAgent: {
    type: String
  },

  deviceFingerprint: {
    type: String,
    index: true
  },

  sessionId: {
    type: String
  },

  // Risk Assessment
  riskScore: {
    type: Number,
    min: [0, 'Risk score cannot be negative'],
    max: [100, 'Risk score cannot exceed 100'],
    default: 0
  },

  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },

  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },

  // Status
  status: {
    type: String,
    enum: ['success', 'failed', 'blocked', 'warning'],
    default: 'success',
    index: true
  },

  // Additional metadata
  resourceType: {
    type: String,
    enum: ['subscription', 'payment', 'bed', 'branch', 'user', 'api_key', 'feature'],
    index: true
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },

  // Compliance tracking
  complianceFlags: [{
    type: String,
    enum: ['gdpr', 'audit_required', 'fraud_alert', 'security_incident']
  }],

  // Geographic information
  geoLocation: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
subscriptionActivitySchema.index({ userId: 1, timestamp: -1 });
subscriptionActivitySchema.index({ activityType: 1, timestamp: -1 });
subscriptionActivitySchema.index({ riskLevel: 1, timestamp: -1 });
subscriptionActivitySchema.index({ status: 1, timestamp: -1 });
subscriptionActivitySchema.index({ ipAddress: 1, timestamp: -1 });
subscriptionActivitySchema.index({ deviceFingerprint: 1, timestamp: -1 });
subscriptionActivitySchema.index({ resourceType: 1, resourceId: 1 });

// Compound indexes for analytics
subscriptionActivitySchema.index({
  userId: 1,
  activityType: 1,
  timestamp: -1
});

subscriptionActivitySchema.index({
  ipAddress: 1,
  userAgent: 1,
  timestamp: -1
});

// Virtual for formatted timestamp
subscriptionActivitySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for time ago
subscriptionActivitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static methods for analytics
subscriptionActivitySchema.statics.getUserActivitySummary = async function(userId, timeRange = '24h') {
  const timeRanges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const startTime = new Date(Date.now() - timeRanges[timeRange]);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' },
        riskLevels: {
          $push: '$riskLevel'
        },
        statuses: {
          $push: '$status'
        }
      }
    },
    {
      $project: {
        activityType: '$_id',
        count: 1,
        lastActivity: 1,
        highRiskCount: {
          $size: {
            $filter: {
              input: '$riskLevels',
              cond: { $in: ['$$this', ['high', 'critical']] }
            }
          }
        },
        failedCount: {
          $size: {
            $filter: {
              input: '$statuses',
              cond: { $eq: ['$$this', 'failed'] }
            }
          }
        }
      }
    }
  ];

  return this.aggregate(pipeline);
};

subscriptionActivitySchema.statics.getSecurityAlerts = async function(timeRange = '24h') {
  const timeRanges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const startTime = new Date(Date.now() - timeRanges[timeRange]);

  return this.find({
    timestamp: { $gte: startTime },
    $or: [
      { riskLevel: { $in: ['high', 'critical'] } },
      { activityType: { $in: ['suspicious_activity_detected', 'fraud_attempt_detected', 'high_risk_action_blocked'] } },
      { status: 'blocked' }
    ]
  })
  .populate('userId', 'firstName lastName email')
  .sort({ timestamp: -1 })
  .limit(100);
};

subscriptionActivitySchema.statics.getFraudIndicators = async function(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const indicators = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        failedActivities: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        highRiskActivities: {
          $sum: { $cond: [{ $in: ['$riskLevel', ['high', 'critical']] }, 1, 0] }
        },
        uniqueIPs: { $addToSet: '$ipAddress' },
        uniqueDevices: { $addToSet: '$deviceFingerprint' },
        activityTypes: { $addToSet: '$activityType' },
        timeRange: {
          $push: {
            hour: { $hour: '$timestamp' },
            day: { $dayOfWeek: '$timestamp' }
          }
        }
      }
    },
    {
      $project: {
        totalActivities: 1,
        failedActivities: 1,
        highRiskActivities: 1,
        uniqueIPCount: { $size: '$uniqueIPs' },
        uniqueDeviceCount: { $size: '$uniqueDevices' },
        activityTypeCount: { $size: '$activityTypes' },
        unusualTimingScore: {
          $sum: {
            $map: {
              input: '$timeRange',
              as: 'time',
              in: {
                $cond: [
                  {
                    $or: [
                      { $lt: ['$$time.hour', 6] },
                      { $gt: ['$$time.hour', 22] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      }
    }
  ]);

  return indicators[0] || {
    totalActivities: 0,
    failedActivities: 0,
    highRiskActivities: 0,
    uniqueIPCount: 0,
    uniqueDeviceCount: 0,
    activityTypeCount: 0,
    unusualTimingScore: 0
  };
};

// Instance methods
subscriptionActivitySchema.methods.isSuspicious = function() {
  return this.riskLevel === 'high' || this.riskLevel === 'critical' ||
         ['suspicious_activity_detected', 'fraud_attempt_detected'].includes(this.activityType);
};

subscriptionActivitySchema.methods.requiresAudit = function() {
  return this.complianceFlags.includes('audit_required') ||
         this.severity === 'critical' ||
         this.status === 'blocked';
};

// Pre-save middleware
subscriptionActivitySchema.pre('save', function(next) {
  // Auto-assign risk level based on activity type and details
  if (this.riskScore >= 80) {
    this.riskLevel = 'critical';
  } else if (this.riskScore >= 60) {
    this.riskLevel = 'high';
  } else if (this.riskScore >= 30) {
    this.riskLevel = 'medium';
  } else {
    this.riskLevel = 'low';
  }

  // Auto-assign severity based on risk level
  if (this.riskLevel === 'critical') {
    this.severity = 'critical';
  } else if (this.riskLevel === 'high') {
    this.severity = 'error';
  } else if (this.riskLevel === 'medium') {
    this.severity = 'warning';
  } else {
    this.severity = 'info';
  }

  next();
});

const SubscriptionActivity = mongoose.model('SubscriptionActivity', subscriptionActivitySchema);

module.exports = SubscriptionActivity;
