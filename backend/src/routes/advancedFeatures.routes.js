const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const invoiceService = require('../services/invoice.service');
const revenueForecastingService = require('../services/revenueForecasting.service');
const usageDashboardService = require('../services/usageDashboard.service');
const costCalculatorService = require('../services/costCalculator.service');
const logger = require('../utils/logger');

/**
 * Advanced Features Routes
 * Invoice generation, revenue forecasting, usage monitoring, cost calculation
 */

// Invoice Routes
router.post('/invoices/generate/:subscriptionId', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { billingPeriod } = req.body;

    const result = await invoiceService.generateInvoice(subscriptionId, billingPeriod);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Invoice generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate invoice'
    });
  }
});

router.post('/invoices/send/:subscriptionId', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { billingPeriod } = req.body;

    const result = await invoiceService.generateAndSendInvoice(subscriptionId, billingPeriod);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Invoice send error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send invoice'
    });
  }
});

// Revenue Forecasting Routes
router.get('/revenue/forecast', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const { timeframe = 12, forecastType = 'realistic' } = req.query;

    const result = await revenueForecastingService.generateRevenueForecast(
      parseInt(timeframe),
      forecastType
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Revenue forecast error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate revenue forecast'
    });
  }
});

router.get('/revenue/insights', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const result = await revenueForecastingService.getRevenueInsights();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('Revenue insights error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get revenue insights'
    });
  }
});

// Usage Dashboard Routes
router.get('/usage/dashboard', authenticate, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const userId = req.user._id;

    const result = await usageDashboardService.getUsageDashboard(userId, timeframe);

    if (!result.success) {
      return res.status(result.message.includes('subscription') ? 403 : 400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('Usage dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load usage dashboard'
    });
  }
});

router.get('/usage/cost-breakdown', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's subscription
    const { UserSubscription } = require('../models');
    const subscription = await UserSubscription.findOne({
      userId,
      status: { $in: ['active', 'trial'] }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const breakdown = await usageDashboardService.getUsageCostBreakdown(userId, subscription);

    return res.status(200).json({
      success: true,
      data: breakdown
    });

  } catch (error) {
    logger.error('Cost breakdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get cost breakdown'
    });
  }
});

// Cost Calculator Routes
router.post('/cost/calculate', authenticate, async (req, res) => {
  try {
    const { planId, configuration } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    const result = await costCalculatorService.calculatePlanCost(planId, configuration);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Cost calculation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate cost'
    });
  }
});

router.post('/cost/compare', authenticate, async (req, res) => {
  try {
    const { planIds, configuration } = req.body;

    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one plan ID is required'
      });
    }

    const result = await costCalculatorService.comparePlans(planIds, configuration);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Plan comparison error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compare plans'
    });
  }
});

router.get('/cost/current', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await costCalculatorService.getCurrentUsageCost(userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Current cost error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get current cost'
    });
  }
});

router.post('/cost/upgrade', authenticate, async (req, res) => {
  try {
    const { currentPlanId, targetPlanId, configuration } = req.body;

    const result = await costCalculatorService.calculateUpgradeCost(
      currentPlanId,
      targetPlanId,
      configuration
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.upgrade
    });

  } catch (error) {
    logger.error('Upgrade cost calculation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate upgrade cost'
    });
  }
});

router.get('/cost/optimization', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await costCalculatorService.getCostOptimization(userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Cost optimization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get cost optimization'
    });
  }
});

router.get('/cost/tiers', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { beds, branches, billingCycle } = req.query;

    const currentUsage = {
      beds: beds ? parseInt(beds) : undefined,
      branches: branches ? parseInt(branches) : undefined,
      billingCycle: billingCycle || 'monthly'
    };

    const result = await costCalculatorService.getPricingTiers(userId, currentUsage);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Pricing tiers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pricing tiers'
    });
  }
});

router.post('/cost/scaling', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { scenarios } = req.body;

    const result = await costCalculatorService.getScalingProjections(userId, scenarios);

    if (!result.success) {
      return res.status(403).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Scaling projections error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get scaling projections'
    });
  }
});

module.exports = router;
