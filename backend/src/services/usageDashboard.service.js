const { UserSubscription, User, Resident, Room, Payment } = require('../models');
const logger = require('../utils/logger');

/**
 * Usage Dashboard Service
 * Provides real-time usage monitoring and analytics
 */
class UsageDashboardService {
  /**
   * Get comprehensive usage dashboard data for a user
   */
  async getUsageDashboard(userId, timeframe = '30d') {
    try {
      // Get user's subscription
      const subscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] }
      }).populate('subscriptionPlanId');

      if (!subscription) {
        return {
          success: false,
          message: 'No active subscription found'
        };
      }

      // Get usage data
      const usageData = await this.calculateUsageMetrics(userId, timeframe);
      const limitData = await this.getSubscriptionLimits(subscription);
      const trendData = await this.getUsageTrends(userId, timeframe);
      const alerts = await this.generateUsageAlerts(subscription, usageData);

      return {
        success: true,
        data: {
          currentUsage: usageData,
          limits: limitData,
          trends: trendData,
          alerts,
          subscription: {
            planName: subscription.subscriptionPlanId.planName,
            billingCycle: subscription.billingCycle,
            status: subscription.status,
            endDate: subscription.endDate
          },
          utilizationRates: this.calculateUtilizationRates(usageData, limitData)
        }
      };

    } catch (error) {
      logger.error('Usage dashboard error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Calculate current usage metrics
   */
  async calculateUsageMetrics(userId, timeframe) {
    try {
      const startDate = this.getTimeframeStart(timeframe);

      // Count active residents (beds in use)
      const activeResidents = await Resident.countDocuments({
        userId,
        status: { $in: ['active', 'onboarding'] },
        createdAt: { $gte: startDate }
      });

      // Count total rooms
      const totalRooms = await Room.countDocuments({
        userId,
        status: 'active'
      });

      // Count occupied rooms
      const occupiedRooms = await Room.countDocuments({
        userId,
        status: 'active',
        'beds.status': 'occupied'
      });

      // Get bed utilization details
      const rooms = await Room.find({
        userId,
        status: 'active'
      }).select('beds capacity sharingType');

      let totalBeds = 0;
      let occupiedBeds = 0;

      rooms.forEach(room => {
        totalBeds += room.capacity || room.beds?.length || 0;
        occupiedBeds += room.beds?.filter(bed => bed.status === 'occupied').length || 0;
      });

      // Calculate payment metrics
      const payments = await Payment.aggregate([
        {
          $match: {
            userId: this.convertToObjectId(userId),
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]);

      const paymentMetrics = payments[0] || {
        totalAmount: 0,
        transactionCount: 0,
        averageAmount: 0
      };

      return {
        residents: {
          active: activeResidents,
          total: activeResidents // For now, same as active
        },
        rooms: {
          total: totalRooms,
          occupied: occupiedRooms,
          vacant: totalRooms - occupiedRooms,
          occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0
        },
        beds: {
          total: totalBeds,
          occupied: occupiedBeds,
          vacant: totalBeds - occupiedBeds,
          utilizationRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0
        },
        payments: {
          totalAmount: paymentMetrics.totalAmount,
          transactionCount: paymentMetrics.transactionCount,
          averageAmount: paymentMetrics.averageAmount
        },
        timeframe
      };

    } catch (error) {
      logger.error('Usage metrics calculation error:', error);
      throw error;
    }
  }

  /**
   * Get subscription limits
   */
  async getSubscriptionLimits(subscription) {
    const plan = subscription.subscriptionPlanId;

    return {
      beds: {
        allowed: subscription.totalBeds,
        baseIncluded: plan.baseBedCount,
        extraAllowed: Math.max(0, subscription.totalBeds - plan.baseBedCount)
      },
      branches: {
        allowed: plan.allowMultipleBranches ? subscription.totalBranches : 1,
        baseIncluded: plan.branchCount || 1,
        extraAllowed: plan.allowMultipleBranches ?
          Math.max(0, subscription.totalBranches - plan.branchCount) : 0
      },
      modules: plan.modules || [],
      features: plan.features || []
    };
  }

  /**
   * Get usage trends over time
   */
  async getUsageTrends(userId, timeframe) {
    try {
      const periods = this.generateTrendPeriods(timeframe);
      const trends = [];

      for (const period of periods) {
        const usage = await this.calculateUsageMetrics(userId, `${period.days}d`);

        trends.push({
          date: period.date,
          residents: usage.residents.active,
          rooms: usage.rooms.occupied,
          beds: usage.beds.occupied,
          payments: usage.payments.totalAmount
        });
      }

      return trends;

    } catch (error) {
      logger.error('Usage trends error:', error);
      return [];
    }
  }

  /**
   * Generate usage alerts
   */
  async generateUsageAlerts(subscription, usageData) {
    const alerts = [];
    const plan = subscription.subscriptionPlanId;

    // Bed utilization alerts
    const bedUtilization = usageData.beds.utilizationRate;
    if (bedUtilization >= 90) {
      alerts.push({
        type: 'warning',
        severity: 'high',
        title: 'High Bed Utilization',
        message: `Bed utilization is at ${bedUtilization.toFixed(1)}%. Consider adding more beds.`,
        metric: 'beds',
        value: bedUtilization,
        threshold: 90
      });
    } else if (bedUtilization >= 80) {
      alerts.push({
        type: 'info',
        severity: 'medium',
        title: 'Approaching Capacity',
        message: `Bed utilization is at ${bedUtilization.toFixed(1)}%. Monitor closely.`,
        metric: 'beds',
        value: bedUtilization,
        threshold: 80
      });
    }

    // Room occupancy alerts
    const roomOccupancy = usageData.rooms.occupancyRate;
    if (roomOccupancy >= 95) {
      alerts.push({
        type: 'warning',
        severity: 'high',
        title: 'High Room Occupancy',
        message: `Room occupancy is at ${roomOccupancy.toFixed(1)}%. All rooms are nearly full.`,
        metric: 'rooms',
        value: roomOccupancy,
        threshold: 95
      });
    }

    // Payment volume alerts (if unusually low)
    const avgPaymentsPerDay = usageData.payments.transactionCount /
      this.getTimeframeDays(timeframe);

    if (avgPaymentsPerDay < 1 && usageData.residents.active > 5) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        title: 'Low Payment Activity',
        message: 'Payment activity seems lower than expected. Check payment collection.',
        metric: 'payments',
        value: avgPaymentsPerDay,
        threshold: 1
      });
    }

    // Trial expiration warning
    if (subscription.billingCycle === 'trial' && subscription.trialEndDate) {
      const daysLeft = Math.ceil(
        (new Date(subscription.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 3 && daysLeft > 0) {
        alerts.push({
          type: 'warning',
          severity: 'high',
          title: 'Trial Ending Soon',
          message: `Your free trial ends in ${daysLeft} days. Upgrade to avoid service interruption.`,
          metric: 'trial',
          value: daysLeft,
          threshold: 3
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate utilization rates
   */
  calculateUtilizationRates(usageData, limits) {
    return {
      beds: {
        current: usageData.beds.utilizationRate,
        ofLimit: limits.beds.allowed > 0 ?
          (usageData.beds.occupied / limits.beds.allowed) * 100 : 0,
        remaining: limits.beds.allowed - usageData.beds.occupied
      },
      rooms: {
        current: usageData.rooms.occupancyRate,
        ofLimit: limits.branches.allowed > 0 ?
          (usageData.rooms.occupied / limits.branches.allowed) * 100 : 0,
        remaining: limits.branches.allowed - usageData.rooms.occupied
      },
      residents: {
        current: usageData.residents.active,
        capacity: limits.beds.allowed,
        utilization: limits.beds.allowed > 0 ?
          (usageData.residents.active / limits.beds.allowed) * 100 : 0
      }
    };
  }

  /**
   * Get timeframe start date
   */
  getTimeframeStart(timeframe) {
    const now = new Date();
    const match = timeframe.match(/(\d+)([dhm])/);

    if (!match) return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'h': return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - value * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get timeframe in days
   */
  getTimeframeDays(timeframe) {
    const match = timeframe.match(/(\d+)([dhm])/);
    if (!match) return 30;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return value;
      case 'h': return value / 24;
      case 'm': return value / (24 * 60);
      default: return 30;
    }
  }

  /**
   * Generate trend periods
   */
  generateTrendPeriods(timeframe) {
    const days = this.getTimeframeDays(timeframe);
    const periods = [];
    const now = new Date();

    // Generate data points every few days based on timeframe
    const interval = days <= 7 ? 1 : days <= 30 ? 3 : 7;

    for (let i = 0; i < days; i += interval) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      periods.push({
        date: date.toISOString().split('T')[0],
        days: i
      });
    }

    return periods.reverse();
  }

  /**
   * Convert string to ObjectId
   */
  convertToObjectId(id) {
    const mongoose = require('mongoose');
    return new mongoose.Types.ObjectId(id);
  }

  /**
   * Get usage cost breakdown
   */
  async getUsageCostBreakdown(userId, subscription) {
    try {
      const plan = subscription.subscriptionPlanId;
      const currentUsage = await this.calculateUsageMetrics(userId, '30d');

      const breakdown = {
        baseSubscription: plan.basePrice,
        extraBeds: Math.max(0, currentUsage.beds.occupied - plan.baseBedCount) * plan.topUpPricePerBed,
        extraBranches: plan.allowMultipleBranches ?
          Math.max(0, subscription.totalBranches - plan.branchCount) * plan.costPerBranch : 0,
        discounts: plan.billingCycle === 'annual' ?
          (plan.basePrice * 12 * plan.annualDiscount / 100) : 0,
        taxes: 0, // Will be calculated
        total: 0
      };

      // Calculate taxes (18% GST)
      const subtotal = breakdown.baseSubscription + breakdown.extraBeds +
                      breakdown.extraBranches - breakdown.discounts;
      breakdown.taxes = subtotal * 0.18;
      breakdown.total = subtotal + breakdown.taxes;

      return breakdown;

    } catch (error) {
      logger.error('Cost breakdown error:', error);
      return null;
    }
  }
}

module.exports = new UsageDashboardService();
