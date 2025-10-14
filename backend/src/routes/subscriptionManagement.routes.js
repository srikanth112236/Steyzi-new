const express = require('express');
const router = express.Router();
const SubscriptionManagementController = require('../controllers/subscriptionManagement.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Subscription Management Routes
 * All routes require superadmin role
 */

// Subscribe user to a plan
router.post('/users/:userId/subscribe',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.subscribeUser
);

// Change user subscription (upgrade/downgrade)
router.put('/users/:userId/change-subscription',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.changeUserSubscription
);

// Cancel user subscription
router.post('/users/:userId/cancel-subscription',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.cancelUserSubscription
);

// Get all subscribers with filters
router.get('/subscribers',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.getAllSubscribers
);

// Get subscription history for a user
router.get('/users/:userId/history',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.getUserSubscriptionHistory
);

// Get subscription statistics
router.get('/stats',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.getSubscriptionStats
);

// Update subscription usage
router.put('/users/:userId/usage',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.updateSubscriptionUsage
);

// Extend subscription
router.post('/:subscriptionId/extend',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.extendSubscription
);

// Get subscriptions expiring soon
router.get('/expiring-soon',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.getExpiringSoonSubscriptions
);

// Get active subscriptions count by plan
router.get('/active-by-plan',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.getActiveSubscriptionsByPlan
);

// Activate free trial for user
router.post('/users/:userId/activate-trial',
  authenticate,
  (req, res, next) => {
    // Allow superadmin to activate anyone's trial, or allow users to activate their own trial
    if (req.user.role === 'superadmin' || req.user._id.toString() === req.params.userId) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  },
  SubscriptionManagementController.activateFreeTrial
);

// Check and handle trial expirations
router.post('/check-trial-expirations',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.checkTrialExpirations
);

// Migrate existing subscriptions to user.subscription field
router.post('/migrate-subscriptions',
  authenticate,
  authorize('superadmin'),
  SubscriptionManagementController.migrateExistingSubscriptions
);

module.exports = router;
