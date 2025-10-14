const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize, superadminOnly } = require('../middleware/auth.middleware');
const { validateSubscription, validateCalculation } = require('../middleware/subscriptionValidator.middleware');
const {
  enhancedAuthMiddleware,
  atomicUsageMiddleware,
  fraudDetectionMiddleware,
  secureQueryMiddleware,
  subscriptionRateLimit
} = require('../middleware/advancedSecurity.middleware');
const SubscriptionService = require('../services/subscription.service');
const logger = require('../utils/logger');

/**
 * Subscription Routes
 * All routes require authentication
 * Most routes restricted to Superadmin only
 */

// Public/Authenticated routes with enhanced security
router.get('/active/plans',
  authenticate,
  fraudDetectionMiddleware,
  secureQueryMiddleware(['role', 'userEmail']),
  subscriptionController.getActivePlans
);

router.get('/popular/plans',
  authenticate,
  subscriptionController.getPopularPlans
);

router.post('/:id/calculate',
  validateCalculation,
  authenticate,
  subscriptionRateLimit,
  fraudDetectionMiddleware,
  subscriptionController.calculateCost
);

// PG selection for custom plans (Superadmin only) with enhanced auth
router.get('/pgs-for-custom-plans',
  authenticate,
  superadminOnly,
  enhancedAuthMiddleware({ requireMFA: true }),
  subscriptionController.getPGsForCustomPlans
);

// Upgrade requests with security checks
router.post('/:id/request-upgrade',
  authenticate,
  enhancedAuthMiddleware({ suspiciousActivityDetection: true }),
  fraudDetectionMiddleware,
  subscriptionController.requestUpgrade
);

router.get('/:id/upgrade-requests',
  authenticate,
  superadminOnly,
  enhancedAuthMiddleware({ requireMFA: true }),
  subscriptionController.getUpgradeRequests
);

router.post('/:id/upgrade-requests/:requestId/respond',
  authenticate,
  superadminOnly,
  enhancedAuthMiddleware({ requireMFA: true }),
  subscriptionController.respondToUpgradeRequest
);

// Statistics (Superadmin only) with enhanced security
router.get('/stats/overview',
  authenticate,
  superadminOnly,
  enhancedAuthMiddleware({ requireMFA: true }),
  subscriptionController.getStatistics
);

// CRUD operations (Superadmin only) with comprehensive security
router.route('/')
  .get(
    authenticate,
    superadminOnly,
    enhancedAuthMiddleware({ requireMFA: true }),
    secureQueryMiddleware(['status', 'billingCycle', 'isPopular', 'search', 'pgId', 'role', 'userPGId']),
    subscriptionController.getAllSubscriptions
  )
  .post(
    authenticate,
    superadminOnly,
    enhancedAuthMiddleware({ requireMFA: true }),
    fraudDetectionMiddleware,
    validateSubscription,
    subscriptionController.createSubscription
  );

router.route('/:id')
  .get(
    authenticate,
    superadminOnly,
    enhancedAuthMiddleware({ requireMFA: true }),
    subscriptionController.getSubscriptionById
  )
  .put(
    authenticate,
    superadminOnly,
    enhancedAuthMiddleware({ requireMFA: true }),
    fraudDetectionMiddleware,
    validateSubscription,
    subscriptionController.updateSubscription
  )
  .delete(
    authenticate,
    superadminOnly,
    enhancedAuthMiddleware({ requireMFA: true }),
    subscriptionController.deleteSubscription
  );

// Special actions (Superadmin only) with enhanced security
router.post('/:id/duplicate',
  authenticate,
  superadminOnly,
  enhancedAuthMiddleware({ requireMFA: true }),
  subscriptionController.duplicateSubscription
);

router.patch('/:id/toggle-popular',
  authenticate,
  superadminOnly,
  enhancedAuthMiddleware({ requireMFA: true }),
  subscriptionController.togglePopular
);

router.patch('/:id/toggle-recommended',
  authenticate,
  superadminOnly,
  enhancedAuthMiddleware({ requireMFA: true }),
  subscriptionController.toggleRecommended
);

// Add route to fetch custom plans for a specific PG
router.get('/custom/:pgId', 
  authenticate, 
  authorize(['superadmin', 'admin']), 
  async (req, res) => {
    try {
      const { pgId } = req.params;
      
      const customPlans = await SubscriptionService.findCustomPlans(pgId);
      
      res.json({
        success: true,
        data: customPlans
      });
    } catch (error) {
      logger.error('Error fetching custom plans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch custom plans'
      });
    }
});

/**
 * @route   GET /api/subscriptions/updates
 * @desc    Fetch current subscription updates
 * @access  Private
 */
router.get('/updates', authenticate, async (req, res) => {
  try {
    // Get user's active subscription
    const subscriptionResult = await SubscriptionService.getUserActiveSubscription(req.user._id);

    if (!subscriptionResult.success) {
      logger.log('warn', 'No active subscription found', { 
        userId: req.user._id 
      });

      return res.status(200).json({
        success: true,
        message: 'No active subscription',
        subscription: null
      });
    }

    // Log subscription update fetch
    logger.log('info', 'Fetched subscription updates', { 
      userId: req.user._id,
      subscriptionId: subscriptionResult.data._id
    });

    return res.status(200).json({
      success: true,
      subscription: subscriptionResult.data
    });
  } catch (error) {
    logger.log('error', 'Error fetching subscription updates', { 
      userId: req.user._id,
      error: error.message 
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription updates',
      error: error.message
    });
  }
});

module.exports = router;
