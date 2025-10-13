const SubscriptionActivity = require('../models/subscriptionActivity.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const emailService = require('./email.service');

/**
 * Security Monitoring Service
 * Monitors suspicious activities and provides security alerts
 */
class SecurityMonitoringService {

  /**
   * Monitor user activities for security threats
   */
  async monitorUserActivity(userId, activityData) {
    try {
      const recentActivities = await SubscriptionActivity.find({
        userId,
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }).sort({ timestamp: -1 });

      // Check for various security patterns
      const alerts = await this.analyzeSecurityPatterns(userId, recentActivities, activityData);

      // Send alerts if any critical issues detected
      if (alerts.length > 0) {
        await this.sendSecurityAlerts(userId, alerts);
      }

      return { alertsTriggered: alerts.length };
    } catch (error) {
      logger.error('Security monitoring failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Analyze security patterns in user activities
   */
  async analyzeSecurityPatterns(userId, activities, currentActivity) {
    const alerts = [];

    // 1. Rapid Fire Actions (potential automation/scripting)
    const recentActions = activities.filter(a =>
      a.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    if (recentActions.length > 20) {
      alerts.push({
        type: 'RAPID_ACTIONS',
        severity: 'HIGH',
        message: `User performed ${recentActions.length} actions in 5 minutes`,
        details: { actionCount: recentActions.length, timeWindow: '5m' }
      });
    }

    // 2. Failed Authentication Attempts
    const failedAuthAttempts = activities.filter(a =>
      (a.activityType === 'login_attempt' && a.status === 'failed') ||
      (a.activityType === 'payment_failed')
    ).length;

    if (failedAuthAttempts > 5) {
      alerts.push({
        type: 'MULTIPLE_FAILED_ATTEMPTS',
        severity: 'MEDIUM',
        message: `${failedAuthAttempts} failed authentication/payment attempts detected`,
        details: { failedAttempts: failedAuthAttempts }
      });
    }

    // 3. Unusual Geographic Activity
    const uniqueIPs = [...new Set(activities.map(a => a.ipAddress).filter(Boolean))];
    const uniqueLocations = await this.getLocationData(uniqueIPs);

    if (uniqueLocations.length > 3) {
      alerts.push({
        type: 'GEOGRAPHIC_ANOMALY',
        severity: 'HIGH',
        message: `Activity detected from ${uniqueLocations.length} different locations`,
        details: { locations: uniqueLocations, ipCount: uniqueIPs.length }
      });
    }

    // 4. Unusual Timing Patterns
    const unusualHoursActivities = activities.filter(a => {
      const hour = new Date(a.timestamp).getHours();
      return hour < 5 || hour > 22; // Outside 5 AM - 10 PM
    });

    if (unusualHoursActivities.length > activities.length * 0.4) {
      alerts.push({
        type: 'UNUSUAL_TIMING',
        severity: 'MEDIUM',
        message: `${Math.round((unusualHoursActivities.length / activities.length) * 100)}% of activities during unusual hours`,
        details: {
          unusualCount: unusualHoursActivities.length,
          totalCount: activities.length,
          percentage: Math.round((unusualHoursActivities.length / activities.length) * 100)
        }
      });
    }

    // 5. Subscription Abuse Patterns
    const subscriptionChanges = activities.filter(a =>
      a.activityType.includes('subscription') && a.activityType.includes('change')
    );

    if (subscriptionChanges.length > 3) {
      alerts.push({
        type: 'SUBSCRIPTION_ABUSE',
        severity: 'CRITICAL',
        message: `${subscriptionChanges.length} subscription changes detected in short time`,
        details: { changeCount: subscriptionChanges.length }
      });
    }

    // 6. Device Fingerprint Changes
    const uniqueDevices = [...new Set(activities.map(a => a.deviceFingerprint).filter(Boolean))];
    if (uniqueDevices.length > 2) {
      alerts.push({
        type: 'DEVICE_FINGERPRINT_CHANGE',
        severity: 'HIGH',
        message: `Activity from ${uniqueDevices.length} different devices detected`,
        details: { deviceCount: uniqueDevices.length }
      });
    }

    return alerts;
  }

  /**
   * Get location data from IP addresses
   */
  async getLocationData(ipAddresses) {
    // This would integrate with a GeoIP service like MaxMind
    // For now, return mock data
    const locations = [];

    for (const ip of ipAddresses.slice(0, 5)) { // Limit to first 5 IPs
      try {
        // In production, this would call a GeoIP service
        const location = await this.lookupIPAddress(ip);
        if (location && !locations.find(l => l.city === location.city)) {
          locations.push(location);
        }
      } catch (error) {
        logger.error(`Failed to lookup IP ${ip}:`, error);
      }
    }

    return locations;
  }

  /**
   * Mock IP lookup function - replace with real GeoIP service
   */
  async lookupIPAddress(ipAddress) {
    // This is a mock implementation
    // In production, integrate with MaxMind GeoIP2 or similar service
    return {
      ip: ipAddress,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      coordinates: { lat: 0, lng: 0 }
    };
  }

  /**
   * Send security alerts
   */
  async sendSecurityAlerts(userId, alerts) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
      const highAlerts = alerts.filter(a => a.severity === 'HIGH');

      // Send immediate alerts for critical/high severity
      if (criticalAlerts.length > 0 || highAlerts.length > 0) {
        await this.sendImmediateAlert(user, [...criticalAlerts, ...highAlerts]);
      }

      // Log all alerts
      for (const alert of alerts) {
        await SubscriptionActivity.create({
          userId,
          activityType: 'security_alert',
          description: alert.message,
          details: alert.details,
          riskLevel: alert.severity.toLowerCase(),
          severity: alert.severity.toLowerCase(),
          status: 'warning'
        });
      }

      logger.warn('Security alerts triggered', {
        userId,
        userEmail: user.email,
        alertCount: alerts.length,
        criticalCount: criticalAlerts.length,
        highCount: highAlerts.length
      });

    } catch (error) {
      logger.error('Failed to send security alerts:', error);
    }
  }

  /**
   * Send immediate security alert
   */
  async sendImmediateAlert(user, alerts) {
    try {
      // Email alert to user
      if (user.email) {
        await this.sendSecurityEmail(user.email, alerts);
      }

      // Alert administrators
      await this.alertAdministrators(user, alerts);

      // Log critical security events
      logger.error('CRITICAL SECURITY ALERT', {
        userId: user._id,
        userEmail: user.email,
        alerts: alerts.map(a => ({ type: a.type, severity: a.severity, message: a.message }))
      });

    } catch (error) {
      logger.error('Failed to send immediate alert:', error);
    }
  }

  /**
   * Send security email alert
   */
  async sendSecurityEmail(userEmail, alerts) {
    try {
      const alertSummary = alerts.map(alert =>
        `• ${alert.severity}: ${alert.message}`
      ).join('\n');

      const emailData = {
        to: userEmail,
        subject: '🚨 Security Alert - Suspicious Activity Detected',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Security Alert</h2>
            <p>We detected suspicious activity on your account. For your security, we've temporarily restricted some actions.</p>

            <h3>Detected Issues:</h3>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-line;">${alertSummary}</div>

            <p>If this was you, please verify your account by:</p>
            <ol>
              <li>Changing your password immediately</li>
              <li>Reviewing recent account activity</li>
              <li>Contacting support if you notice any unauthorized access</li>
            </ol>

            <p>If this wasn't you, please contact our support team immediately.</p>

            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              This is an automated security notification. Please do not reply to this email.
            </p>
          </div>
        `
      };

      await emailService.sendEmail(emailData);

    } catch (error) {
      logger.error('Failed to send security email:', error);
    }
  }

  /**
   * Alert system administrators
   */
  async alertAdministrators(user, alerts) {
    try {
      // Find all superadmin users
      const admins = await User.find({ role: 'superadmin' });

      for (const admin of admins) {
        if (admin.email) {
          await this.sendAdminAlert(admin.email, user, alerts);
        }
      }
    } catch (error) {
      logger.error('Failed to alert administrators:', error);
    }
  }

  /**
   * Send alert to administrator
   */
  async sendAdminAlert(adminEmail, user, alerts) {
    try {
      const alertSummary = alerts.map(alert =>
        `• ${alert.severity}: ${alert.message}`
      ).join('\n');

      const emailData = {
        to: adminEmail,
        subject: '🚨 ADMIN ALERT - Security Threat Detected',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Security Threat Detected</h2>

            <h3>User Information:</h3>
            <ul>
              <li><strong>User ID:</strong> ${user._id}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
              <li><strong>Role:</strong> ${user.role}</li>
            </ul>

            <h3>Security Alerts:</h3>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-line;">${alertSummary}</div>

            <h3>Recommended Actions:</h3>
            <ul>
              <li>Review user's recent activity logs</li>
              <li>Check for unauthorized access patterns</li>
              <li>Consider temporarily suspending the account if threat level is critical</li>
              <li>Contact the user to verify the activity</li>
            </ul>

            <p>Please investigate this security incident promptly.</p>
          </div>
        `
      };

      await emailService.sendEmail(emailData);

    } catch (error) {
      logger.error('Failed to send admin alert:', error);
    }
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(timeRange = '24h') {
    try {
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const startTime = new Date(Date.now() - timeRanges[timeRange]);

      const [
        securityAlerts,
        blockedActivities,
        suspiciousUsers
      ] = await Promise.all([
        // Get security alerts
        SubscriptionActivity.find({
          activityType: 'security_alert',
          timestamp: { $gte: startTime }
        }).countDocuments(),

        // Get blocked activities
        SubscriptionActivity.find({
          status: 'blocked',
          timestamp: { $gte: startTime }
        }).countDocuments(),

        // Get users with high risk scores
        SubscriptionActivity.distinct('userId', {
          riskLevel: { $in: ['high', 'critical'] },
          timestamp: { $gte: startTime }
        })
      ]);

      // Get top security threats
      const topThreats = await SubscriptionActivity.aggregate([
        {
          $match: {
            activityType: 'security_alert',
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: '$details.type',
            count: { $sum: 1 },
            severity: { $first: '$severity' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return {
        summary: {
          securityAlerts,
          blockedActivities,
          suspiciousUsers: suspiciousUsers.length
        },
        topThreats,
        timeRange
      };

    } catch (error) {
      logger.error('Failed to get security dashboard:', error);
      return { error: error.message };
    }
  }

  /**
   * Get security trends for charts
   */
  async getSecurityTrends(period = '7d') {
    try {
      const timeRanges = {
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const startTime = new Date(Date.now() - timeRanges[period]);
      const endTime = new Date();

      // Generate hourly/daily buckets
      const bucketSize = period === '1d' ? 'hour' : 'day';
      const buckets = [];

      let currentTime = new Date(startTime);
      while (currentTime <= endTime) {
        buckets.push({
          date: new Date(currentTime),
          activities: 0,
          alerts: 0,
          blocked: 0,
          failed: 0
        });

        if (bucketSize === 'hour') {
          currentTime.setHours(currentTime.getHours() + 1);
        } else {
          currentTime.setDate(currentTime.getDate() + 1);
        }
      }

      // Aggregate data by time bucket
      for (const bucket of buckets) {
        const nextBucket = new Date(bucket.date);
        if (bucketSize === 'hour') {
          nextBucket.setHours(nextBucket.getHours() + 1);
        } else {
          nextBucket.setDate(nextBucket.getDate() + 1);
        }

        const activities = await SubscriptionActivity.find({
          timestamp: {
            $gte: bucket.date,
            $lt: nextBucket
          }
        });

        bucket.activities = activities.length;
        bucket.alerts = activities.filter(a => a.activityType === 'security_alert').length;
        bucket.blocked = activities.filter(a => a.status === 'blocked').length;
        bucket.failed = activities.filter(a => a.status === 'failed').length;
      }

      return {
        period,
        data: buckets.map(bucket => ({
          date: bucket.date.toISOString(),
          activities: bucket.activities,
          alerts: bucket.alerts,
          blocked: bucket.blocked,
          failed: bucket.failed
        }))
      };

    } catch (error) {
      logger.error('Failed to get security trends:', error);
      return { error: error.message };
    }
  }

  /**
   * Get security alerts with pagination
   */
  async getSecurityAlerts(timeRange = '24h', page = 1, limit = 50) {
    try {
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const startTime = new Date(Date.now() - timeRanges[timeRange]);
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = {
        $or: [
          { riskLevel: { $in: ['high', 'critical'] } },
          { activityType: { $in: ['suspicious_activity_detected', 'fraud_attempt_detected', 'high_risk_action_blocked'] } },
          { status: 'blocked' }
        ],
        timestamp: { $gte: startTime }
      };

      const [alerts, total] = await Promise.all([
        SubscriptionActivity.find(query)
          .populate('userId', 'firstName lastName email')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        SubscriptionActivity.countDocuments(query)
      ]);

      return {
        alerts,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      };

    } catch (error) {
      logger.error('Failed to get security alerts:', error);
      throw error;
    }
  }

  /**
   * Manually trigger security check for a user
   */
  async triggerSecurityCheck(userId, reason = 'manual_check') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const activities = await SubscriptionActivity.find({
        userId,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).sort({ timestamp: -1 });

      const alerts = await this.analyzeSecurityPatterns(userId, activities, {
        type: 'manual_check',
        reason
      });

      if (alerts.length > 0) {
        await this.sendSecurityAlerts(userId, alerts);
        return { alertsTriggered: alerts.length, alerts };
      }

      return { alertsTriggered: 0, message: 'No security issues detected' };

    } catch (error) {
      logger.error('Manual security check failed:', error);
      return { error: error.message };
    }
  }
}

module.exports = new SecurityMonitoringService();
