const { Subscription, UserSubscription } = require('../models');
const logger = require('../utils/logger');

/**
 * Cost Calculator Service
 * Provides dynamic pricing calculations and cost comparisons
 */
class CostCalculatorService {
  /**
   * Calculate cost for a specific plan configuration
   */
  async calculatePlanCost(planId, configuration = {}) {
    try {
      const plan = await Subscription.findById(planId);

      if (!plan) {
        return {
          success: false,
          message: 'Plan not found'
        };
      }

      const {
        beds = plan.baseBedCount,
        branches = plan.branchCount || 1,
        billingCycle = plan.billingCycle
      } = configuration;

      // Base calculations
      const basePrice = plan.basePrice;
      const extraBeds = Math.max(0, beds - plan.baseBedCount);
      const extraBedCost = extraBeds * plan.topUpPricePerBed;

      // Branch calculations
      let branchCost = 0;
      if (plan.allowMultipleBranches) {
        const extraBranches = Math.max(0, branches - plan.branchCount);
        branchCost = extraBranches * plan.costPerBranch;
      }

      // Billing cycle adjustments
      let finalPrice = basePrice + extraBedCost + branchCost;
      let annualDiscount = 0;

      if (billingCycle === 'annual') {
        annualDiscount = (finalPrice * 12 * plan.annualDiscount) / 100;
        finalPrice = (finalPrice * 12) - annualDiscount;
      }

      // Taxes
      const subtotal = finalPrice;
      const taxRate = 18; // GST 18%
      const taxAmount = subtotal * (taxRate / 100);
      const totalPrice = subtotal + taxAmount;

      // Setup fee (if applicable)
      const setupFee = plan.setupFee || 0;

      return {
        success: true,
        calculation: {
          basePrice,
          extraBeds,
          extraBedCost,
          branches,
          branchCost,
          subtotal: finalPrice,
          annualDiscount,
          taxRate,
          taxAmount,
          setupFee,
          totalPrice: totalPrice + setupFee,
          monthlyEquivalent: billingCycle === 'annual' ? totalPrice / 12 : totalPrice,
          savings: annualDiscount
        },
        plan: {
          name: plan.planName,
          billingCycle: billingCycle,
          features: plan.modules?.length || 0
        }
      };

    } catch (error) {
      logger.error('Plan cost calculation error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Compare multiple plans
   */
  async comparePlans(planIds, configuration = {}) {
    try {
      const comparisons = [];

      for (const planId of planIds) {
        const result = await this.calculatePlanCost(planId, configuration);
        if (result.success) {
          comparisons.push(result);
        }
      }

      // Sort by total price (lowest first)
      comparisons.sort((a, b) => a.calculation.totalPrice - b.calculation.totalPrice);

      return {
        success: true,
        comparisons,
        bestValue: comparisons[0],
        configuration
      };

    } catch (error) {
      logger.error('Plan comparison error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get cost breakdown for user's current usage
   */
  async getCurrentUsageCost(userId) {
    try {
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

      const configuration = {
        beds: subscription.totalBeds,
        branches: subscription.totalBranches,
        billingCycle: subscription.billingCycle
      };

      return await this.calculatePlanCost(subscription.subscriptionPlanId._id, configuration);

    } catch (error) {
      logger.error('Current usage cost error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Calculate upgrade/downgrade cost differences
   */
  async calculateUpgradeCost(currentPlanId, targetPlanId, configuration = {}) {
    try {
      const [currentResult, targetResult] = await Promise.all([
        this.calculatePlanCost(currentPlanId, configuration),
        this.calculatePlanCost(targetPlanId, configuration)
      ]);

      if (!currentResult.success || !targetResult.success) {
        return {
          success: false,
          message: 'Failed to calculate upgrade costs'
        };
      }

      const currentCost = currentResult.calculation;
      const targetCost = targetResult.calculation;

      const difference = targetCost.totalPrice - currentCost.totalPrice;
      const monthlyDifference = targetCost.monthlyEquivalent - currentCost.monthlyEquivalent;

      return {
        success: true,
        upgrade: {
          from: currentResult.plan,
          to: targetResult.plan,
          currentCost,
          targetCost,
          priceDifference: difference,
          monthlyDifference,
          isUpgrade: difference > 0,
          savings: difference < 0 ? Math.abs(difference) : 0,
          additionalCost: difference > 0 ? difference : 0
        }
      };

    } catch (error) {
      logger.error('Upgrade cost calculation error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimization(userId) {
    try {
      const currentCost = await this.getCurrentUsageCost(userId);

      if (!currentCost.success) {
        return currentCost;
      }

      const recommendations = [];

      // Check if annual billing would save money
      const monthlyConfig = { ...currentCost.calculation };
      const annualConfig = {
        beds: currentCost.calculation.extraBeds + currentCost.plan.baseBedCount,
        branches: currentCost.calculation.branches,
        billingCycle: 'annual'
      };

      const annualCost = await this.calculatePlanCost(
        currentCost.plan.id,
        annualConfig
      );

      if (annualCost.success) {
        const monthlyTotal = currentCost.calculation.totalPrice * 12;
        const annualTotal = annualCost.calculation.totalPrice;
        const savings = monthlyTotal - annualTotal;

        if (savings > 0) {
          recommendations.push({
            type: 'billing_cycle',
            title: 'Switch to Annual Billing',
            description: `Save ₹${savings.toLocaleString()} annually by switching to annual billing`,
            potentialSavings: savings,
            priority: 'high'
          });
        }
      }

      // Check if reducing beds would save money
      const currentBeds = currentCost.calculation.extraBeds + currentCost.plan.baseBedCount;
      if (currentBeds > currentCost.plan.baseBedCount) {
        const reducedBedConfig = {
          beds: Math.max(currentCost.plan.baseBedCount, currentBeds - 1),
          branches: currentCost.calculation.branches,
          billingCycle: currentCost.calculation.billingCycle
        };

        const reducedCost = await this.calculatePlanCost(
          currentCost.plan.id,
          reducedBedConfig
        );

        if (reducedCost.success) {
          const savings = currentCost.calculation.totalPrice - reducedCost.calculation.totalPrice;
          if (savings > 0) {
            recommendations.push({
              type: 'bed_optimization',
              title: 'Optimize Bed Count',
              description: `Reduce bed count by 1 to save ₹${savings.toLocaleString()} per ${currentCost.calculation.billingCycle}`,
              potentialSavings: savings,
              priority: 'medium'
            });
          }
        }
      }

      return {
        success: true,
        currentCost: currentCost.calculation,
        recommendations,
        totalPotentialSavings: recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0)
      };

    } catch (error) {
      logger.error('Cost optimization error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get pricing tiers and recommendations
   */
  async getPricingTiers(userId, currentUsage = {}) {
    try {
      const allPlans = await Subscription.find({
        status: 'active',
        isCustomPlan: false
      }).sort({ basePrice: 1 });

      const tiers = [];

      for (const plan of allPlans) {
        const costResult = await this.calculatePlanCost(plan._id, {
          beds: currentUsage.beds || plan.baseBedCount,
          branches: currentUsage.branches || 1,
          billingCycle: currentUsage.billingCycle || 'monthly'
        });

        if (costResult.success) {
          tiers.push({
            id: plan._id,
            name: plan.planName,
            tier: this.getPlanTier(plan.basePrice),
            cost: costResult.calculation,
            features: plan.modules?.length || 0,
            recommended: this.isRecommendedForUsage(plan, currentUsage)
          });
        }
      }

      // Sort by total price
      tiers.sort((a, b) => a.cost.totalPrice - b.cost.totalPrice);

      return {
        success: true,
        tiers,
        recommendedTier: tiers.find(tier => tier.recommended)
      };

    } catch (error) {
      logger.error('Pricing tiers error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Determine plan tier based on price
   */
  getPlanTier(price) {
    if (price < 1000) return 'basic';
    if (price < 2500) return 'standard';
    if (price < 5000) return 'professional';
    return 'enterprise';
  }

  /**
   * Check if plan is recommended for current usage
   */
  isRecommendedForUsage(plan, usage) {
    if (!usage.beds) return plan.isRecommended;

    const bedsNeeded = usage.beds;
    const planCapacity = plan.baseBedCount + Math.floor(plan.maxBedsAllowed - plan.baseBedCount) * 0.8;

    // Recommend if plan can handle 80% of required capacity
    return bedsNeeded <= planCapacity && bedsNeeded >= plan.baseBedCount * 0.7;
  }

  /**
   * Get cost projections for scaling
   */
  async getScalingProjections(userId, scenarios = []) {
    try {
      const currentCost = await this.getCurrentUsageCost(userId);

      if (!currentCost.success) {
        return currentCost;
      }

      const projections = [];

      for (const scenario of scenarios) {
        const projectedCost = await this.calculatePlanCost(
          currentCost.plan.id,
          {
            beds: scenario.beds || currentCost.calculation.extraBeds + currentCost.plan.baseBedCount,
            branches: scenario.branches || currentCost.calculation.branches,
            billingCycle: scenario.billingCycle || currentCost.calculation.billingCycle
          }
        );

        if (projectedCost.success) {
          projections.push({
            scenario: scenario.name,
            currentCost: currentCost.calculation.totalPrice,
            projectedCost: projectedCost.calculation.totalPrice,
            difference: projectedCost.calculation.totalPrice - currentCost.calculation.totalPrice,
            monthlyImpact: projectedCost.calculation.monthlyEquivalent - currentCost.calculation.monthlyEquivalent
          });
        }
      }

      return {
        success: true,
        currentCost: currentCost.calculation,
        projections
      };

    } catch (error) {
      logger.error('Scaling projections error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Calculate break-even point for plan changes
   */
  calculateBreakEven(currentCost, newCost, timeframe = 'monthly') {
    const difference = newCost.totalPrice - currentCost.totalPrice;

    if (difference <= 0) {
      return {
        breakEvenPeriod: 0,
        message: 'No break-even period - new plan is cheaper'
      };
    }

    let breakEvenMonths;

    if (timeframe === 'annual') {
      breakEvenMonths = difference / Math.abs(newCost.monthlyEquivalent - currentCost.monthlyEquivalent);
    } else {
      breakEvenMonths = difference / Math.abs(newCost.monthlyEquivalent - currentCost.monthlyEquivalent);
    }

    return {
      breakEvenMonths: Math.ceil(breakEvenMonths),
      breakEvenCost: difference,
      monthlySavings: currentCost.monthlyEquivalent - newCost.monthlyEquivalent,
      message: `Break-even in ${Math.ceil(breakEvenMonths)} months`
    };
  }
}

module.exports = new CostCalculatorService();
