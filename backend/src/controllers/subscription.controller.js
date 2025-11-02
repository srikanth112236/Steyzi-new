const subscriptionService = require('../services/subscription.service');
const logger = require('../utils/logger');
const PG = require('../models/pg.model'); // Added missing import for PG model

/**
 * Subscription Controller
 * Handles HTTP requests for subscription management
 */

/**
 * Create new subscription plan
 * @route POST /api/subscriptions
 * @access Superadmin only
 */
exports.createSubscription = async (req, res) => {
    try {
      const result = await subscriptionService.createSubscription(
        req.body,
        req.user._id
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      logger.error('Error in createSubscription controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get all subscription plans
 * @route GET /api/subscriptions
 * @access Superadmin only
 */
exports.getAllSubscriptions = async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        billingCycle: req.query.billingCycle,
        isPopular: req.query.isPopular,
        search: req.query.search,
        pgId: req.query.pgId,
        role: req.user.role,
        userPGId: req.user.pgId,
        userEmail: req.user.email // Add user email for strict filtering
      };

      const result = await subscriptionService.getAllSubscriptions(filters);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getAllSubscriptions controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get subscription plan by ID
 * @route GET /api/subscriptions/:id
 * @access Superadmin only
 */
exports.getSubscriptionById = async (req, res) => {
    try {
      const result = await subscriptionService.getSubscriptionById(req.params.id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getSubscriptionById controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Update subscription plan
 * @route PUT /api/subscriptions/:id
 * @access Superadmin only
 */
exports.updateSubscription = async (req, res) => {
    try {
      const result = await subscriptionService.updateSubscription(
        req.params.id,
        req.body,
        req.user._id
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in updateSubscription controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Delete subscription plan
 * @route DELETE /api/subscriptions/:id
 * @access Superadmin only
 */
exports.deleteSubscription = async (req, res) => {
    try {
      const result = await subscriptionService.deleteSubscription(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in deleteSubscription controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Calculate cost for bed count and branch count
 * @route POST /api/subscriptions/:id/calculate
 * @access Public (for PG owners to view)
 */
exports.calculateCost = async (req, res) => {
    try {
      const { bedCount, branchCount = 1 } = req.body;

      if (!bedCount || bedCount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid bed count is required'
        });
      }

      if (!branchCount || branchCount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid branch count is required'
        });
      }

      const result = await subscriptionService.calculateCost(
        req.params.id,
        parseInt(bedCount),
        parseInt(branchCount)
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in calculateCost controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

/**
 * Get active plans (for PG owners)
 * @route GET /api/subscriptions/active/plans
 * @access Authenticated users
 */
exports.getActivePlans = async (req, res) => {
    try {
      // Extract filtering parameters from query
      const role = req.user.role;
      const userPGId = req.user.pgId;
      const userEmail = req.user.email;

      const result = await subscriptionService.getActivePlans({
        role,
        userPGId,
        userEmail
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getActivePlans controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get popular plans
 * @route GET /api/subscriptions/popular/plans
 * @access Public
 */
exports.getPopularPlans = async (req, res) => {
    try {
      const result = await subscriptionService.getPopularPlans();

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getPopularPlans controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Toggle plan popularity
 * @route PATCH /api/subscriptions/:id/toggle-popular
 * @access Superadmin only
 */
exports.togglePopular = async (req, res) => {
    try {
      const result = await subscriptionService.togglePopular(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in togglePopular controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Toggle plan recommended status
 * @route PATCH /api/subscriptions/:id/toggle-recommended
 * @access Superadmin only
 */
exports.toggleRecommended = async (req, res) => {
    try {
      const result = await subscriptionService.toggleRecommended(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in toggleRecommended controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get subscription statistics
 * @route GET /api/subscriptions/stats/overview
 * @access Superadmin only
 */
exports.getStatistics = async (req, res) => {
    try {
      const result = await subscriptionService.getStatistics();

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getStatistics controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Duplicate subscription plan
 * @route POST /api/subscriptions/:id/duplicate
 * @access Superadmin only
 */
exports.duplicateSubscription = async (req, res) => {
    try {
      const result = await subscriptionService.duplicateSubscription(
        req.params.id,
        req.user._id
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      logger.error('Error in duplicateSubscription controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get PGs for custom plan selection
 * @route GET /api/subscriptions/pgs-for-custom-plans
 * @access Superadmin only
 */
exports.getPGsForCustomPlans = async (req, res) => {
    try {
      const search = req.query.search || '';
      const role = req.user.role;
      const userPGId = req.user.pgId;
      const userEmail = req.user.email;

      // Different filtering logic based on user role
      let query = { isActive: true };
      
      if (role === 'superadmin') {
        // Superadmin sees ALL PGs
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ];
        }
      } else if (role === 'admin') {
        // Admin sees their own PG and PGs with matching email domain
        query.$or = [
          { _id: userPGId }, // Their own PG
          { email: { $regex: `@${userEmail.split('@')[1]}$`, $options: 'i' } } // PGs with same email domain
        ];

        // Apply search if provided
        if (search) {
          query.$or.push(
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          );
        }
      } else {
        // Other roles see only their own PG
        query._id = userPGId;
      }

      const pgs = await PG.find(query)
        .populate('admin', 'firstName lastName email')
        .select('name email phone admin')
        .sort({ name: 1 })
        .limit(50);

      const formattedPGs = pgs.map(pg => ({
        _id: pg._id,
        name: pg.name,
        email: pg.email,
        phone: pg.phone,
        adminName: pg.admin ? `${pg.admin.firstName} ${pg.admin.lastName}` : 'N/A',
        displayText: `${pg.name} - ${pg.email} - ${pg.phone || 'N/A'}`
      }));

      return res.status(200).json({
        success: true,
        data: formattedPGs,
        count: formattedPGs.length
      });
    } catch (error) {
      logger.error('Error fetching PGs for custom plans:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch PGs'
      });
    }
};

/**
 * Request upgrade for custom plan
 * @route POST /api/subscriptions/:id/request-upgrade
 * @access Authenticated users
 */
exports.requestUpgrade = async (req, res) => {
    try {
      const { requestedBeds, requestedBranches, requestMessage } = req.body;

      const result = await subscriptionService.requestUpgrade(
        req.params.id,
        req.user._id,
        { requestedBeds, requestedBranches, requestMessage }
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in requestUpgrade controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get upgrade requests for a plan
 * @route GET /api/subscriptions/:id/upgrade-requests
 * @access Superadmin only
 */
exports.getUpgradeRequests = async (req, res) => {
    try {
      const result = await subscriptionService.getUpgradeRequests(req.params.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getUpgradeRequests controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Respond to upgrade request
 * @route POST /api/subscriptions/:id/upgrade-requests/:requestId/respond
 * @access Superadmin only
 */
exports.respondToUpgradeRequest = async (req, res) => {
    try {
      const { status, responseMessage } = req.body;

      const result = await subscriptionService.respondToUpgradeRequest(
        req.params.id,
        req.params.requestId,
        { status, responseMessage },
        req.user._id
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in respondToUpgradeRequest controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Create payment order
 * @route POST /api/subscriptions/payments/create-order
 * @access Authenticated users
 */
exports.createOrder = async (req, res) => {
    try {
      const { subscriptionId, bedCount, branchCount = 1 } = req.body;

      if (!subscriptionId || !bedCount) {
        return res.status(400).json({
          success: false,
          message: 'Subscription ID and bed count are required'
        });
      }

      const result = await subscriptionService.createPaymentOrder(
        subscriptionId,
        req.user._id,
        parseInt(bedCount),
        parseInt(branchCount)
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      logger.error('Error in createOrder controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Verify payment
 * @route POST /api/subscriptions/payments/verify
 * @access Authenticated users
 */
exports.verifyPayment = async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification details are required'
        });
      }

      const result = await subscriptionService.verifyPayment({
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        userId: req.user._id
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in verifyPayment controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get payment history
 * @route GET /api/subscriptions/payments/history
 * @access Authenticated users
 */
exports.getPaymentHistory = async (req, res) => {
    try {
      const result = await subscriptionService.getPaymentHistory(req.user._id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getPaymentHistory controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Add beds to subscription
 * @route POST /api/subscriptions/payments/add-beds
 * @access Authenticated users
 */
exports.addBeds = async (req, res) => {
    try {
      const { subscriptionId, additionalBeds } = req.body;

      if (!subscriptionId || !additionalBeds || additionalBeds <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Subscription ID and valid additional beds count are required'
        });
      }

      const result = await subscriptionService.addBeds(
        subscriptionId,
        req.user._id,
        parseInt(additionalBeds)
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in addBeds controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Add branches to subscription
 * @route POST /api/subscriptions/payments/add-branches
 * @access Authenticated users
 */
exports.addBranches = async (req, res) => {
    try {
      const { subscriptionId, additionalBranches } = req.body;

      if (!subscriptionId || !additionalBranches || additionalBranches <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Subscription ID and valid additional branches count are required'
        });
      }

      const result = await subscriptionService.addBranches(
        subscriptionId,
        req.user._id,
        parseInt(additionalBranches)
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in addBranches controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Get payment status
 * @route GET /api/subscriptions/payments/:paymentId
 * @access Authenticated users
 */
exports.getPaymentStatus = async (req, res) => {
    try {
      const { paymentId } = req.params;

      const result = await subscriptionService.getPaymentStatus(paymentId, req.user._id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getPaymentStatus controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
};

/**
 * Handle payment webhook
 * @route POST /api/subscriptions/payments/webhook
 * @access Public (webhook endpoint)
 */
/**
 * Handle payment webhook
 * @route POST /api/subscriptions/payments/webhook
 * @access Public (webhook endpoint)
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    // === 1. Verify Signature ===
    if (!signature) {
      logger.warn('Webhook received without signature');
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Invalid webhook signature', {
        received: signature,
        expected: expectedSignature
      });
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // === 2. Process Webhook ===
    logger.info('RAZORPAY SERVICE: Processing webhook...', {
      event: req.body.event,
      paymentId: req.body?.payload?.payment?.entity?.id,
      orderId: req.body?.payload?.order?.entity?.id
    });

    const result = await subscriptionService.handlePaymentWebhook(req.body);

    if (!result.success) {
      logger.error('Webhook processing failed', result);
      return res.status(400).json(result);
    }

    // === 3. Respond ===
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.error('Error in handleWebhook controller:', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};