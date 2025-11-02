const express = require('express');
const router = express.Router();
const SecurityMonitoringService = require('../services/securityMonitoring.service');
const SubscriptionActivity = require('../models/subscriptionActivity.model');
const User = require('../models/user.model');
const { authenticate, authorize, superadminOnly } = require('../middleware/auth.middleware');
const { trackAdminActivity } = require('../middleware/adminActivity.middleware');
const logger = require('../utils/logger');

/**
 * Security Routes
 * All routes require superadmin authentication
 */

/**
 * Get security dashboard data
 * @route GET /api/security/dashboard
 * @access Superadmin only
 */
router.get('/dashboard', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    const dashboardData = await SecurityMonitoringService.getSecurityDashboard(timeRange);

    if (dashboardData.error) {
      return res.status(400).json({
        success: false,
        message: dashboardData.error
      });
    }

    return res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Security dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load security dashboard'
    });
  }
});

/**
 * Get security alerts
 * @route GET /api/security/alerts
 * @access Superadmin only
 */
router.get('/alerts', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const { timeRange = '24h', page = 1, limit = 50 } = req.query;

    const result = await SecurityMonitoringService.getSecurityAlerts(timeRange, page, limit);

    return res.status(200).json({
      success: true,
      data: result.alerts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });

  } catch (error) {
    logger.error('Security alerts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load security alerts'
    });
  }
});

/**
 * Get user security profile
 * @route GET /api/security/users/:userId/profile
 * @access Superadmin only
 */
router.get('/users/:userId/profile', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('firstName lastName email role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get fraud indicators
    const fraudIndicators = await SecurityMonitoringService.getFraudIndicators(userId);

    // Get recent activities
    const recentActivities = await SubscriptionActivity.find({
      userId,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .sort({ timestamp: -1 })
    .limit(20)
    .select('activityType description riskLevel riskScore status timestamp ipAddress userAgent')
    .lean();

    // Get security summary
    const securitySummary = {
      totalActivities: fraudIndicators.totalActivities,
      highRiskActivities: fraudIndicators.highRiskActivities,
      failedActivities: fraudIndicators.failedActivities,
      uniqueIPCount: fraudIndicators.uniqueIPCount,
      uniqueDeviceCount: fraudIndicators.uniqueDeviceCount,
      unusualTimingScore: fraudIndicators.unusualTimingScore,
      riskLevel: fraudIndicators.highRiskActivities > 0 ? 'high' :
                 fraudIndicators.failedActivities > 5 ? 'medium' : 'low'
    };

    return res.status(200).json({
      success: true,
      data: {
        user,
        securitySummary,
        recentActivities,
        fraudIndicators
      }
    });

  } catch (error) {
    logger.error('User security profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load user security profile'
    });
  }
});

/**
 * Trigger manual security check for user
 * @route POST /api/security/users/:userId/check
 * @access Superadmin only
 */
router.post('/users/:userId/check', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'manual_admin_check' } = req.body;

    const result = await SecurityMonitoringService.triggerSecurityCheck(userId, reason);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Manual security check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform security check'
    });
  }
});

/**
 * Get security activity logs
 * @route GET /api/security/activity-logs
 * @access Superadmin only
 */
router.get('/activity-logs', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      activityType,
      riskLevel,
      status,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {};

    if (userId) query.userId = userId;
    if (activityType) query.activityType = activityType;
    if (riskLevel) query.riskLevel = riskLevel;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      SubscriptionActivity.find(query)
        .populate('userId', 'firstName lastName email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SubscriptionActivity.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Activity logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load activity logs'
    });
  }
});

/**
 * Get security metrics
 * @route GET /api/security/metrics
 * @access Superadmin only
 */
router.get('/metrics', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Calculate time range
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(Date.now() - timeRanges[timeRange]);

    // Get various security metrics
    const [
      totalActivities,
      securityAlerts,
      blockedActivities,
      criticalAlerts,
      highRiskUsers,
      failedAuthAttempts,
      suspiciousIPs
    ] = await Promise.all([
      // Total activities
      SubscriptionActivity.countDocuments({
        timestamp: { $gte: startTime }
      }),

      // Security alerts
      SubscriptionActivity.countDocuments({
        activityType: 'security_alert',
        timestamp: { $gte: startTime }
      }),

      // Blocked activities
      SubscriptionActivity.countDocuments({
        status: 'blocked',
        timestamp: { $gte: startTime }
      }),

      // Critical alerts
      SubscriptionActivity.countDocuments({
        riskLevel: 'critical',
        timestamp: { $gte: startTime }
      }),

      // High risk users
      SubscriptionActivity.distinct('userId', {
        riskLevel: { $in: ['high', 'critical'] },
        timestamp: { $gte: startTime }
      }),

      // Failed authentication attempts
      SubscriptionActivity.countDocuments({
        activityType: { $in: ['login_attempt', 'payment_failed'] },
        status: 'failed',
        timestamp: { $gte: startTime }
      }),

      // Suspicious IPs
      SubscriptionActivity.distinct('ipAddress', {
        riskLevel: { $in: ['high', 'critical'] },
        timestamp: { $gte: startTime }
      })
    ]);

    const metrics = {
      summary: {
        totalActivities,
        securityAlerts,
        blockedActivities,
        criticalAlerts,
        highRiskUsers: highRiskUsers.length,
        failedAuthAttempts,
        suspiciousIPs: suspiciousIPs.length
      },
      timeRange,
      calculatedAt: new Date()
    };

    return res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Security metrics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load security metrics'
    });
  }
});

/**
 * Get security trends
 * @route GET /api/security/trends
 * @access Superadmin only
 */
router.get('/trends', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Get trends data for charts
    const trends = await SecurityMonitoringService.getSecurityTrends(period);

    return res.status(200).json({
      success: true,
      data: trends
    });

  } catch (error) {
    logger.error('Security trends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load security trends'
    });
  }
});

module.exports = router;
