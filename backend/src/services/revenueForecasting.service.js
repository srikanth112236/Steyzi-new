const { UserSubscription, Subscription, Payment, User } = require('../models');
const logger = require('../utils/logger');

/**
 * Revenue Forecasting Service
 * Provides predictive revenue modeling and analytics
 */
class RevenueForecastingService {
  /**
   * Generate revenue forecast for given time period
   */
  async generateRevenueForecast(timeframe = 12, forecastType = 'conservative') {
    try {
      // Get historical data for the last 12 months
      const historicalData = await this.getHistoricalRevenueData(12);

      // Get current active subscriptions
      const activeSubscriptions = await this.getActiveSubscriptionsData();

      // Apply forecasting model
      const forecast = this.applyForecastingModel(historicalData, activeSubscriptions, timeframe, forecastType);

      // Calculate confidence intervals
      const confidenceIntervals = this.calculateConfidenceIntervals(forecast, historicalData);

      return {
        success: true,
        forecast,
        confidenceIntervals,
        historicalData,
        metadata: {
          timeframe,
          forecastType,
          generatedAt: new Date(),
          modelUsed: 'linear_regression_with_seasonal_adjustment'
        }
      };

    } catch (error) {
      logger.error('Revenue forecasting error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get historical revenue data for analysis
   */
  async getHistoricalRevenueData(months = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const revenueData = [];

      for (let i = 0; i < months; i++) {
        const monthStart = new Date(startDate);
        monthStart.setMonth(startDate.getMonth() + i);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1);

        // Get payments for this month
        const payments = await Payment.aggregate([
          {
            $match: {
              createdAt: { $gte: monthStart, $lt: monthEnd },
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              transactionCount: { $sum: 1 },
              uniqueUsers: { $addToSet: '$residentId' }
            }
          }
        ]);

        const monthData = payments[0] || { totalRevenue: 0, transactionCount: 0, uniqueUsers: [] };

        revenueData.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          revenue: monthData.totalRevenue,
          transactions: monthData.transactionCount,
          uniqueUsers: monthData.uniqueUsers.length,
          averageTransaction: monthData.transactionCount > 0 ?
            monthData.totalRevenue / monthData.transactionCount : 0
        });
      }

      return revenueData;

    } catch (error) {
      logger.error('Historical data fetch error:', error);
      throw error;
    }
  }

  /**
   * Get current active subscriptions data
   */
  async getActiveSubscriptionsData() {
    try {
      const subscriptions = await UserSubscription.find({
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).populate('subscriptionPlanId userId');

      const planStats = {};
      let totalMRR = 0;
      let totalARR = 0;

      for (const sub of subscriptions) {
        const planId = sub.subscriptionPlanId._id.toString();
        const plan = sub.subscriptionPlanId;

        if (!planStats[planId]) {
          planStats[planId] = {
            planName: plan.planName,
            subscriberCount: 0,
            monthlyRevenue: 0,
            annualRevenue: 0,
            churnRate: 0,
            averageLifetime: 0
          };
        }

        planStats[planId].subscriberCount++;

        // Calculate revenue based on billing cycle
        if (plan.billingCycle === 'monthly') {
          const monthlyAmount = plan.basePrice +
            (Math.max(0, sub.totalBeds - plan.baseBedCount) * plan.topUpPricePerBed);
          planStats[planId].monthlyRevenue += monthlyAmount;
          totalMRR += monthlyAmount;
        } else if (plan.billingCycle === 'annual') {
          const annualAmount = (plan.basePrice +
            (Math.max(0, sub.totalBeds - plan.baseBedCount) * plan.topUpPricePerBed)) * 12;
          const discount = (annualAmount * plan.annualDiscount) / 100;
          const finalAnnual = annualAmount - discount;
          planStats[planId].annualRevenue += finalAnnual;
          totalARR += finalAnnual;
        }
      }

      return {
        totalSubscriptions: subscriptions.length,
        planStats,
        totalMRR,
        totalARR,
        averageRevenuePerUser: subscriptions.length > 0 ?
          (totalMRR + totalARR/12) / subscriptions.length : 0
      };

    } catch (error) {
      logger.error('Active subscriptions data error:', error);
      throw error;
    }
  }

  /**
   * Apply forecasting model to predict future revenue
   */
  applyForecastingModel(historicalData, subscriptionData, timeframe, forecastType) {
    const forecast = [];
    const lastMonthRevenue = historicalData[historicalData.length - 1]?.revenue || 0;

    // Calculate growth rates and seasonal factors
    const growthRate = this.calculateGrowthRate(historicalData);
    const seasonalFactors = this.calculateSeasonalFactors(historicalData);

    // Apply forecasting logic based on type
    let baseGrowthRate = growthRate;

    switch (forecastType) {
      case 'conservative':
        baseGrowthRate = Math.min(growthRate, 0.05); // Max 5% growth
        break;
      case 'optimistic':
        baseGrowthRate = Math.max(growthRate, 0.15); // Min 15% growth
        break;
      case 'aggressive':
        baseGrowthRate = growthRate * 1.5; // 1.5x current growth
        break;
      default:
        // realistic - use actual growth rate
        break;
    }

    // Generate forecast for each month
    for (let i = 1; i <= timeframe; i++) {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i);

      const month = forecastDate.getMonth();
      const seasonalFactor = seasonalFactors[month] || 1.0;

      // Calculate predicted revenue with seasonal adjustment
      let predictedRevenue = lastMonthRevenue * Math.pow(1 + baseGrowthRate, i) * seasonalFactor;

      // Add new subscription revenue estimation
      const newSubscriberRevenue = this.estimateNewSubscriberRevenue(subscriptionData, i);

      predictedRevenue += newSubscriberRevenue;

      // Apply churn factor (assume some subscribers will cancel)
      const churnFactor = Math.pow(0.98, i); // 2% monthly churn
      predictedRevenue *= churnFactor;

      forecast.push({
        month: forecastDate.toISOString().slice(0, 7),
        predictedRevenue: Math.round(predictedRevenue),
        growthRate: baseGrowthRate,
        seasonalFactor,
        newSubscriberRevenue: Math.round(newSubscriberRevenue),
        confidence: this.calculateConfidence(i, forecastType)
      });
    }

    return forecast;
  }

  /**
   * Calculate growth rate from historical data
   */
  calculateGrowthRate(historicalData) {
    if (historicalData.length < 2) return 0.1; // Default 10% growth

    const revenues = historicalData.map(d => d.revenue);
    const growthRates = [];

    for (let i = 1; i < revenues.length; i++) {
      if (revenues[i-1] > 0) {
        growthRates.push((revenues[i] - revenues[i-1]) / revenues[i-1]);
      }
    }

    // Return average growth rate, with bounds
    const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    return Math.max(-0.2, Math.min(0.5, avgGrowth)); // Bound between -20% and 50%
  }

  /**
   * Calculate seasonal factors based on historical data
   */
  calculateSeasonalFactors(historicalData) {
    const monthlyRevenues = {};
    const monthlyCounts = {};

    // Group by month
    historicalData.forEach(data => {
      const month = new Date(data.month + '-01').getMonth();
      monthlyRevenues[month] = (monthlyRevenues[month] || 0) + data.revenue;
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    // Calculate average revenue per month
    const avgMonthlyRevenue = Object.keys(monthlyRevenues).reduce((sum, month) => {
      return sum + (monthlyRevenues[month] / monthlyCounts[month]);
    }, 0) / 12;

    // Calculate seasonal factors
    const seasonalFactors = {};
    Object.keys(monthlyRevenues).forEach(month => {
      const avgRevenue = monthlyRevenues[month] / monthlyCounts[month];
      seasonalFactors[month] = avgRevenue / avgMonthlyRevenue;
    });

    return seasonalFactors;
  }

  /**
   * Estimate revenue from new subscribers
   */
  estimateNewSubscriberRevenue(subscriptionData, monthsAhead) {
    // Estimate new subscribers based on current growth
    const estimatedNewSubscribers = Math.max(1, subscriptionData.totalSubscriptions * 0.02 * monthsAhead);

    // Average revenue per new subscriber
    const avgRevenuePerUser = subscriptionData.averageRevenuePerUser;

    return estimatedNewSubscribers * avgRevenuePerUser;
  }

  /**
   * Calculate confidence intervals for forecast
   */
  calculateConfidenceIntervals(forecast, historicalData) {
    // Calculate standard deviation of historical growth rates
    const revenues = historicalData.map(d => d.revenue);
    const growthRates = [];

    for (let i = 1; i < revenues.length; i++) {
      if (revenues[i-1] > 0) {
        growthRates.push((revenues[i] - revenues[i-1]) / revenues[i-1]);
      }
    }

    const stdDev = this.calculateStandardDeviation(growthRates);

    return forecast.map((month, index) => ({
      month: month.month,
      lowerBound: Math.round(month.predictedRevenue * (1 - stdDev * 2)),
      upperBound: Math.round(month.predictedRevenue * (1 + stdDev * 2)),
      confidenceLevel: Math.max(60, 95 - (index * 5)) // Decreasing confidence over time
    }));
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate confidence level for forecast
   */
  calculateConfidence(monthsAhead, forecastType) {
    // Base confidence decreases with time and forecast type
    let baseConfidence = 95;

    // Reduce confidence for longer forecasts
    baseConfidence -= monthsAhead * 2;

    // Adjust based on forecast type
    switch (forecastType) {
      case 'conservative':
        baseConfidence += 5;
        break;
      case 'optimistic':
        baseConfidence -= 10;
        break;
      case 'aggressive':
        baseConfidence -= 15;
        break;
    }

    return Math.max(50, Math.min(98, baseConfidence));
  }

  /**
   * Get revenue insights and recommendations
   */
  async getRevenueInsights() {
    try {
      const forecast = await this.generateRevenueForecast(6, 'realistic');
      const subscriptions = await this.getActiveSubscriptionsData();

      const insights = {
        currentMRR: subscriptions.totalMRR,
        currentARR: subscriptions.totalARR,
        projectedRevenue6Months: forecast.forecast.slice(0, 6).reduce((sum, month) => sum + month.predictedRevenue, 0),
        projectedRevenue12Months: forecast.forecast.reduce((sum, month) => sum + month.predictedRevenue, 0),
        topPerformingPlans: Object.values(subscriptions.planStats)
          .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
          .slice(0, 3),
        growthRate: forecast.forecast[0]?.growthRate || 0,
        recommendations: this.generateRecommendations(forecast, subscriptions)
      };

      return {
        success: true,
        data: insights
      };

    } catch (error) {
      logger.error('Revenue insights error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  generateRecommendations(forecast, subscriptions) {
    const recommendations = [];

    // Growth rate analysis
    const avgGrowth = forecast.forecast.reduce((sum, month) => sum + month.growthRate, 0) / forecast.forecast.length;

    if (avgGrowth > 0.1) {
      recommendations.push({
        type: 'positive',
        title: 'Strong Growth Trajectory',
        description: `Revenue is growing at ${(avgGrowth * 100).toFixed(1)}% monthly. Consider expanding marketing efforts.`,
        priority: 'high'
      });
    } else if (avgGrowth < 0.02) {
      recommendations.push({
        type: 'warning',
        title: 'Slow Growth Detected',
        description: 'Revenue growth is below 2%. Consider pricing strategy review or new feature development.',
        priority: 'high'
      });
    }

    // Plan performance analysis
    const plans = Object.values(subscriptions.planStats);
    const lowPerformingPlans = plans.filter(plan => plan.subscriberCount < 5);

    if (lowPerformingPlans.length > 0) {
      recommendations.push({
        type: 'action',
        title: 'Optimize Underperforming Plans',
        description: `${lowPerformingPlans.length} plans have fewer than 5 subscribers. Consider repositioning or sunsetting.`,
        priority: 'medium'
      });
    }

    // Seasonal analysis
    const seasonalFactors = this.calculateSeasonalFactors(forecast.metadata?.historicalData || []);
    const highSeasonMonths = Object.entries(seasonalFactors)
      .filter(([_, factor]) => factor > 1.2)
      .map(([month, _]) => new Date(2024, parseInt(month)).toLocaleString('default', { month: 'long' }));

    if (highSeasonMonths.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Seasonal Revenue Patterns',
        description: `Higher revenue expected in: ${highSeasonMonths.join(', ')}. Plan marketing campaigns accordingly.`,
        priority: 'low'
      });
    }

    return recommendations;
  }
}

module.exports = new RevenueForecastingService();
