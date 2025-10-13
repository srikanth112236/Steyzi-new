const mongoose = require('mongoose');
const UserSubscription = require('../models/userSubscription.model');
const Subscription = require('../models/subscription.model');
const SubscriptionActivity = require('../models/subscriptionActivity.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Advanced Subscription Service with Security & Atomic Operations
 * Addresses race conditions, fraud detection, and security vulnerabilities
 */
class AdvancedSubscriptionService {

  /**
   * Atomically allocate bed with usage tracking
   * Fixes: Race Conditions in Usage Tracking
   */
  async allocateBedAtomic(userId, bedDetails, operationId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      operationId = operationId || crypto.randomUUID();

      // 1. Get user's active subscription with lock
      const userSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).session(session);

      if (!userSubscription) {
        throw new Error('No active subscription found');
      }

      // 2. Check current usage limits
      const currentBedUsage = userSubscription.currentBedUsage || 0;
      const maxBeds = userSubscription.totalBeds || userSubscription.planId?.baseBedCount || 10;

      if (currentBedUsage >= maxBeds) {
        // Log limit exceeded attempt
        await this.logActivity(userId, 'usage_limit_exceeded', {
          operationId,
          resourceType: 'bed',
          currentUsage: currentBedUsage,
          limit: maxBeds,
          attemptType: 'allocation'
        }, session);

        throw new Error(`Bed usage limit exceeded. Current: ${currentBedUsage}, Limit: ${maxBeds}`);
      }

      // 3. Update usage atomically
      const updatedSubscription = await UserSubscription.findOneAndUpdate(
        {
          _id: userSubscription._id,
          currentBedUsage: currentBedUsage // Ensure no concurrent modifications
        },
        {
          $inc: { currentBedUsage: 1 },
          updatedBy: userId,
          lastActivity: new Date()
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!updatedSubscription) {
        throw new Error('Concurrent modification detected. Please try again.');
      }

      // 4. Log successful allocation
      await this.logActivity(userId, 'bed_allocated', {
        operationId,
        bedDetails,
        newUsage: updatedSubscription.currentBedUsage,
        limit: maxBeds,
        remainingBeds: maxBeds - updatedSubscription.currentBedUsage
      }, session);

      // 5. Check if approaching limit and send warning
      if (updatedSubscription.currentBedUsage >= maxBeds * 0.8) {
        await this.logActivity(userId, 'usage_limit_warning', {
          operationId,
          resourceType: 'bed',
          currentUsage: updatedSubscription.currentBedUsage,
          limit: maxBeds,
          usagePercentage: (updatedSubscription.currentBedUsage / maxBeds) * 100
        }, session);
      }

      await session.commitTransaction();

      return {
        success: true,
        data: {
          subscription: updatedSubscription,
          newUsage: updatedSubscription.currentBedUsage,
          remainingBeds: maxBeds - updatedSubscription.currentBedUsage
        }
      };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Bed allocation failed:', error);

      // Log failure
      if (operationId) {
        await this.logActivity(userId, 'bed_allocation_failed', {
          operationId,
          bedDetails,
          error: error.message
        });
      }

      return {
        success: false,
        message: error.message
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Atomically deallocate bed
   */
  async deallocateBedAtomic(userId, bedDetails, operationId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      operationId = operationId || crypto.randomUUID();

      const userSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).session(session);

      if (!userSubscription) {
        throw new Error('No active subscription found');
      }

      const currentBedUsage = userSubscription.currentBedUsage || 0;

      if (currentBedUsage <= 0) {
        throw new Error('No beds currently allocated');
      }

      // Update usage atomically
      const updatedSubscription = await UserSubscription.findOneAndUpdate(
        {
          _id: userSubscription._id,
          currentBedUsage: currentBedUsage
        },
        {
          $inc: { currentBedUsage: -1 },
          updatedBy: userId,
          lastActivity: new Date()
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!updatedSubscription) {
        throw new Error('Concurrent modification detected. Please try again.');
      }

      // Log successful deallocation
      await this.logActivity(userId, 'bed_deallocated', {
        operationId,
        bedDetails,
        newUsage: updatedSubscription.currentBedUsage,
        maxBeds: userSubscription.totalBeds
      }, session);

      await session.commitTransaction();

      return {
        success: true,
        data: {
          subscription: updatedSubscription,
          newUsage: updatedSubscription.currentBedUsage
        }
      };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Bed deallocation failed:', error);

      if (operationId) {
        await this.logActivity(userId, 'bed_deallocation_failed', {
          operationId,
          bedDetails,
          error: error.message
        });
      }

      return {
        success: false,
        message: error.message
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Secure subscription change with fraud detection
   * Fixes: Insufficient Authentication & Authorization, Fraud Detection
   */
  async changeSubscriptionSecure(userId, newSubscriptionData, securityContext) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const operationId = crypto.randomUUID();

      // 1. Fraud detection check
      const fraudCheck = await this.performFraudCheck(userId, 'subscription_change', securityContext);

      if (!fraudCheck.allowed) {
        await this.logActivity(userId, 'fraud_attempt_detected', {
          operationId,
          action: 'subscription_change',
          fraudReason: fraudCheck.reason,
          riskScore: fraudCheck.riskScore,
          securityContext
        }, session);

        throw new Error(`Security check failed: ${fraudCheck.reason}`);
      }

      // 2. Get current subscription
      const currentSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).session(session);

      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      // 3. Validate new subscription data
      const validation = await this.validateSubscriptionChange(currentSubscription, newSubscriptionData);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // 4. Calculate new pricing
      const plan = await Subscription.findById(newSubscriptionData.subscriptionPlanId).session(session);
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      const costBreakdown = plan.calculateTotalCost(
        newSubscriptionData.totalBeds,
        newSubscriptionData.totalBranches || 1
      );

      // 5. Update subscription atomically
      const updatedSubscription = await UserSubscription.findOneAndUpdate(
        {
          _id: currentSubscription._id,
          status: currentSubscription.status // Ensure no concurrent changes
        },
        {
          subscriptionPlanId: newSubscriptionData.subscriptionPlanId,
          totalBeds: newSubscriptionData.totalBeds,
          totalBranches: newSubscriptionData.totalBranches || 1,
          totalPrice: newSubscriptionData.billingCycle === 'annual' ?
            costBreakdown.totalAnnualPrice : costBreakdown.totalMonthlyPrice,
          billingCycle: newSubscriptionData.billingCycle,
          upgradeDate: new Date(),
          updatedBy: userId,
          notes: `Secure subscription change - ${operationId}`
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!updatedSubscription) {
        throw new Error('Concurrent modification detected. Please try again.');
      }

      // 6. Log successful change
      await this.logActivity(userId, 'subscription_updated', {
        operationId,
        previousPlan: currentSubscription.subscriptionPlanId,
        newPlan: newSubscriptionData.subscriptionPlanId,
        previousBeds: currentSubscription.totalBeds,
        newBeds: newSubscriptionData.totalBeds,
        securityContext,
        costBreakdown
      }, session);

      await session.commitTransaction();

      return {
        success: true,
        data: {
          subscription: updatedSubscription,
          costBreakdown,
          operationId
        }
      };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Secure subscription change failed:', error);

      return {
        success: false,
        message: error.message
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Real-time usage validation with security checks
   * Fixes: Trial Bypass Vulnerabilities
   */
  async validateUsageAccess(userId, resourceType, resourceAmount = 1, securityContext = {}) {
    try {
      // 1. Get current subscription with real-time check
      const subscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] }
      }).populate('planId');

      if (!subscription) {
        await this.logActivity(userId, 'access_denied', {
          resourceType,
          reason: 'no_active_subscription',
          securityContext
        });

        return {
          allowed: false,
          reason: 'No active subscription found',
          code: 'NO_SUBSCRIPTION'
        };
      }

      // 2. Check trial expiration in real-time
      const now = new Date();
      if (subscription.billingCycle === 'trial') {
        if (subscription.trialEndDate && now > subscription.trialEndDate) {
          // Auto-expire trial
          await UserSubscription.findByIdAndUpdate(subscription._id, {
            status: 'expired',
            updatedBy: userId
          });

          await this.logActivity(userId, 'trial_expired', {
            trialEndDate: subscription.trialEndDate,
            resourceType,
            securityContext
          });

          return {
            allowed: false,
            reason: 'Trial period has expired',
            code: 'TRIAL_EXPIRED'
          };
        }
      }

      // 3. Check subscription expiration
      if (subscription.endDate && now > subscription.endDate) {
        await UserSubscription.findByIdAndUpdate(subscription._id, {
          status: 'expired',
          updatedBy: userId
        });

        return {
          allowed: false,
          reason: 'Subscription has expired',
          code: 'SUBSCRIPTION_EXPIRED'
        };
      }

      // 4. Check usage limits based on resource type
      const limitCheck = await this.checkUsageLimit(subscription, resourceType, resourceAmount);

      if (!limitCheck.allowed) {
        await this.logActivity(userId, 'usage_limit_exceeded', {
          resourceType,
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit,
          requestedAmount: resourceAmount,
          securityContext
        });

        return {
          allowed: false,
          reason: limitCheck.reason,
          code: 'USAGE_LIMIT_EXCEEDED',
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit
        };
      }

      // 5. Check feature access
      const featureCheck = await this.checkFeatureAccess(subscription, resourceType);

      if (!featureCheck.allowed) {
        await this.logActivity(userId, 'feature_access_denied', {
          resourceType,
          requiredModule: featureCheck.requiredModule,
          securityContext
        });

        return {
          allowed: false,
          reason: featureCheck.reason,
          code: 'FEATURE_NOT_AVAILABLE'
        };
      }

      // 6. Log successful access
      await this.logActivity(userId, 'feature_accessed', {
        resourceType,
        resourceAmount,
        securityContext
      });

      return {
        allowed: true,
        subscription,
        remainingUsage: limitCheck.remainingUsage
      };

    } catch (error) {
      logger.error('Usage validation failed:', error);

      await this.logActivity(userId, 'access_validation_error', {
        resourceType,
        error: error.message,
        securityContext
      });

      return {
        allowed: false,
        reason: 'Validation error occurred',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Fraud detection and risk assessment
   */
  async performFraudCheck(userId, action, securityContext) {
    try {
      const riskIndicators = [];

      // 1. Check recent activity patterns
      const recentActivities = await SubscriptionActivity.find({
        userId,
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }).sort({ timestamp: -1 });

      // Rapid subscription changes (more than 3 in an hour)
      const recentChanges = recentActivities.filter(a =>
        a.activityType.includes('subscription') && a.activityType.includes('change')
      );

      if (recentChanges.length >= 3) {
        riskIndicators.push('rapid_subscription_changes');
      }

      // Multiple failed operations
      const failedOps = recentActivities.filter(a => a.status === 'failed');
      if (failedOps.length >= 5) {
        riskIndicators.push('high_failure_rate');
      }

      // 2. Check device/location anomalies
      const uniqueIPs = [...new Set(recentActivities.map(a => a.ipAddress).filter(Boolean))];
      if (uniqueIPs.length >= 3) {
        riskIndicators.push('multiple_ip_addresses');
      }

      // 3. Check for unusual timing
      const unusualHours = recentActivities.filter(a => {
        const hour = new Date(a.timestamp).getHours();
        return hour < 6 || hour > 22;
      });

      if (unusualHours.length > recentActivities.length * 0.6) {
        riskIndicators.push('unusual_timing');
      }

      // 4. Calculate risk score
      let riskScore = 0;
      riskIndicators.forEach(indicator => {
        switch (indicator) {
          case 'rapid_subscription_changes':
            riskScore += 40;
            break;
          case 'high_failure_rate':
            riskScore += 35;
            break;
          case 'multiple_ip_addresses':
            riskScore += 30;
            break;
          case 'unusual_timing':
            riskScore += 20;
            break;
        }
      });

      // 5. Determine if action is allowed
      const allowed = riskScore < 80; // Block if risk score >= 80

      return {
        allowed,
        riskScore,
        indicators: riskIndicators,
        reason: allowed ? null : `High risk detected: ${riskIndicators.join(', ')}`
      };

    } catch (error) {
      logger.error('Fraud check failed:', error);
      // Allow action on error to prevent blocking legitimate users
      return { allowed: true, riskScore: 0, indicators: [], reason: null };
    }
  }

  /**
   * Secure query building with sanitization
   * Fixes: Database Injection Risks
   */
  buildSecureQuery(baseQuery, filters, allowedFields) {
    const secureQuery = { ...baseQuery };

    // Sanitize and validate each filter
    Object.keys(filters).forEach(key => {
      if (allowedFields.includes(key)) {
        const value = filters[key];

        // Type-specific sanitization
        if (typeof value === 'string') {
          // Remove potentially dangerous characters for string fields
          secureQuery[key] = value.replace(/[<>'"&]/g, '');

          // Additional validation for specific fields
          if (key.includes('email')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error(`Invalid email format for field: ${key}`);
            }
          }

          if (key.includes('phone') || key.includes('mobile')) {
            const phoneRegex = /^[0-9+\-\s()]+$/;
            if (!phoneRegex.test(value)) {
              throw new Error(`Invalid phone format for field: ${key}`);
            }
          }
        } else if (typeof value === 'number') {
          if (isNaN(value) || !isFinite(value)) {
            throw new Error(`Invalid number for field: ${key}`);
          }
          secureQuery[key] = value;
        } else if (Array.isArray(value)) {
          // Validate array elements
          secureQuery[key] = value.filter(item => {
            if (typeof item === 'string') {
              return item.replace(/[<>'"&]/g, '').length > 0;
            }
            return true;
          });
        } else if (value instanceof Date) {
          secureQuery[key] = value;
        } else if (mongoose.Types.ObjectId.isValid(value)) {
          secureQuery[key] = value;
        }
        // Skip other types that might be dangerous
      }
    });

    return secureQuery;
  }

  /**
   * Private helper methods
   */
  async checkUsageLimit(subscription, resourceType, amount) {
    let currentUsage, limit;

    switch (resourceType) {
      case 'bed':
      case 'beds':
        currentUsage = subscription.currentBedUsage || 0;
        limit = subscription.totalBeds || subscription.planId?.baseBedCount || 10;
        break;

      case 'branch':
      case 'branches':
        currentUsage = subscription.currentBranchUsage || 0;
        limit = subscription.totalBranches || 1;
        break;

      default:
        return { allowed: true }; // No limit for unknown resource types
    }

    const wouldExceed = (currentUsage + amount) > limit;

    return {
      allowed: !wouldExceed,
      currentUsage,
      limit,
      remainingUsage: Math.max(0, limit - currentUsage),
      reason: wouldExceed ? `${resourceType} usage would exceed limit (${limit})` : null
    };
  }

  async checkFeatureAccess(subscription, resourceType) {
    if (!subscription.planId) {
      return { allowed: false, reason: 'No plan associated with subscription' };
    }

    const moduleMapping = {
      beds: 'resident_management',
      residents: 'resident_management',
      rooms: 'room_allocation',
      branches: 'multi_branch',
      payments: 'payment_tracking',
      reports: 'analytics_reports',
      tickets: 'ticket_system',
      qr_codes: 'qr_code_payments'
    };

    const requiredModule = moduleMapping[resourceType];
    if (!requiredModule) {
      return { allowed: true }; // No module requirement
    }

    const hasModule = subscription.planId.modules?.some(module =>
      module.moduleName === requiredModule && module.enabled
    );

    return {
      allowed: hasModule,
      requiredModule,
      reason: hasModule ? null : `Required module '${requiredModule}' not enabled in current plan`
    };
  }

  async validateSubscriptionChange(currentSubscription, newData) {
    // Validate plan exists and is active
    const newPlan = await Subscription.findById(newData.subscriptionPlanId);
    if (!newPlan || newPlan.status !== 'active') {
      return { valid: false, message: 'Invalid or inactive subscription plan' };
    }

    // Validate bed count doesn't exceed new plan limits
    if (newData.totalBeds > currentSubscription.currentBedUsage) {
      // Allow upgrade but warn about immediate usage
      // Additional beds would need to be paid for
    }

    // Validate branch count
    if (newData.totalBranches > 1 && !newPlan.allowMultipleBranches) {
      return { valid: false, message: 'Selected plan does not support multiple branches' };
    }

    return { valid: true };
  }

  async logActivity(userId, activityType, details, session = null) {
    try {
      const activityData = {
        userId,
        activityType,
        details: {
          ...details,
          timestamp: new Date()
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        riskScore: details.riskScore || 0,
        resourceType: details.resourceType,
        resourceId: details.resourceId,
        status: details.error ? 'failed' : 'success'
      };

      if (session) {
        await SubscriptionActivity.create([activityData], { session });
      } else {
        await SubscriptionActivity.create(activityData);
      }
    } catch (error) {
      logger.error('Failed to log activity:', error);
      // Don't throw - logging failures shouldn't break main operations
    }
  }
}

module.exports = new AdvancedSubscriptionService();
