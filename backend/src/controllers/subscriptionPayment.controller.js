const crypto = require('crypto');
const razorpayService = require('../services/razorpay.service');
const subscriptionService = require('../services/subscription.service');
const subscriptionManagementService = require('../services/subscriptionManagement.service');
const logger = require('../utils/logger');

/**
 * Subscription Payment Controller
 * Handles Razorpay payment operations for subscriptions
 */

/**
 * Create Razorpay order for subscription payment
 * @route POST /api/subscription-payments/create-order
 * @access Private (Admin/Superadmin)
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      subscriptionPlanId,
      bedCount,
      branchCount,
      billingCycle
    } = req.body;

    // Validate required fields
    if (!subscriptionPlanId || !bedCount || !branchCount || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subscriptionPlanId, bedCount, branchCount, billingCycle'
      });
    }

    // Get subscription plan details
    const planResult = await subscriptionService.getSubscriptionById(subscriptionPlanId);
    if (!planResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const plan = planResult.data;

    // Calculate total amount
    const costResult = plan.calculateTotalCost(bedCount, branchCount);
    const totalAmount = costResult.totalMonthlyPrice;

    // Create Razorpay order
    const orderData = {
      userId: req.user._id,
      subscriptionPlanId,
      bedCount,
      branchCount,
      billingCycle,
      amount: totalAmount,
      currency: 'INR'
    };

    const orderResult = await razorpayService.createOrder(orderData);

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    logger.info('Subscription payment order created:', {
      userId: req.user._id,
      orderId: orderResult.data.orderId,
      amount: totalAmount,
      planId: subscriptionPlanId
    });

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.data.orderId,
        amount: orderResult.data.amount,
        currency: orderResult.data.currency,
        key: process.env.RAZORPAY_KEY_ID,
        planDetails: {
          planName: plan.planName,
          bedCount,
          branchCount,
          billingCycle,
          totalAmount
        }
      }
    });
  } catch (error) {
    logger.error('Error creating subscription payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Verify Razorpay subscription payment
 * @route POST /api/subscription-payments/verify
 * @access Private (Admin/Superadmin)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionPlanId,
      bedCount,
      branchCount,
      billingCycle
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields'
      });
    }

    // Verify payment signature
    const verificationResult = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
        error: verificationResult.message
      });
    }

    // Fetch payment details from Razorpay
    const paymentResult = await razorpayService.fetchPayment(razorpay_payment_id);
    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details',
        error: paymentResult.error
      });
    }

    // Process subscription payment
    const paymentData = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      subscriptionPlanId: subscriptionPlanId || req.user.subscription?.planId,
      bedCount: bedCount || 1,
      branchCount: branchCount || 1,
      billingCycle: billingCycle || 'monthly'
    };

    const subscriptionResult = await razorpayService.processSubscriptionPayment(req.user._id, paymentData);

    if (!subscriptionResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Payment verified but subscription processing failed',
        error: subscriptionResult.error
      });
    }

    logger.info('Subscription payment verified and processed:', {
      userId: req.user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      subscriptionId: subscriptionResult.data.subscriptionId
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      data: {
        subscriptionId: subscriptionResult.data.subscriptionId,
        amount: subscriptionResult.data.amount,
        endDate: subscriptionResult.data.endDate,
        paymentDetails: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: paymentResult.data.amount,
          method: paymentResult.data.method
        }
      }
    });
  } catch (error) {
    logger.error('Error verifying subscription payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

/**
 * Handle Razorpay webhook for subscription payments
 * @route POST /api/subscription-payments/webhook
 * @access Public (Razorpay webhook)
 */
/**
 * Handle payment webhook
 * @route POST /api/subscriptions/payments/webhook
 * @access Public (webhook endpoint)
 */
exports.handleWebhook = async (req, res) => {
  console.log('🎣 WEBHOOK RECEIVED! ===========================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📡 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));

  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    console.log('🔐 Verifying webhook signature...');

    // === 1. Verify Signature ===
    if (!signature) {
      console.log('❌ ERROR: Webhook received without signature');
      logger.warn('Webhook received without signature');
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    console.log('✅ Signature present:', signature.substring(0, 20) + '...');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    console.log('🔍 Expected signature:', expectedSignature.substring(0, 20) + '...');
    console.log('🔍 Signature match:', signature === expectedSignature ? '✅ YES' : '❌ NO');

    if (signature !== expectedSignature) {
      console.log('❌ ERROR: Invalid webhook signature!');
      logger.warn('Invalid webhook signature', {
        received: signature,
        expected: expectedSignature
      });
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    console.log('✅ Signature verified successfully!');

    // === 2. Process Webhook ===
    const event = req.body.event;
    const paymentId = req.body?.payload?.payment?.entity?.id;
    const orderId = req.body?.payload?.order?.entity?.id;

    console.log('🚀 Processing webhook event:', event);
    console.log('💳 Payment ID:', paymentId || 'N/A');
    console.log('📋 Order ID:', orderId || 'N/A');

    logger.info('RAZORPAY SERVICE: Processing webhook...', {
      event: event,
      paymentId: paymentId,
      orderId: orderId
    });

    console.log('🔄 Calling subscription service to handle webhook...');
    const result = await subscriptionService.handlePaymentWebhook(req.body);

    console.log('📊 Webhook processing result:', result);

    if (!result.success) {
      console.log('❌ ERROR: Webhook processing failed!');
      logger.error('Webhook processing failed', result);
      return res.status(400).json(result);
    }

    console.log('✅ SUCCESS: Webhook processed successfully!');

    // === 3. Respond ===
    console.log('📤 Sending 200 response to Razorpay...');
    const response = {
      success: true,
      message: 'Webhook processed successfully',
      event: event,
      paymentId: paymentId
    };
    console.log('📤 Response:', JSON.stringify(response, null, 2));
    console.log('🎉 WEBHOOK PROCESSING COMPLETED! ===========================================\n');

    return res.status(200).json(response);
  } catch (error) {
    console.log('💥 ERROR: Exception in webhook handler!');
    console.log('❌ Error message:', error.message);
    console.log('❌ Error stack:', error.stack);

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
/**
 * Get user's subscription payment history
 * @route GET /api/subscription-payments/history
 * @access Private (Admin/Superadmin)
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's subscription history with payment details
    const subscriptionHistory = await subscriptionManagementService.getUserSubscriptionHistory(userId);

    if (!subscriptionHistory.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: subscriptionHistory.error
      });
    }

    // Extract and flatten payment history
    const allPayments = [];
    subscriptionHistory.data.forEach(subscription => {
      if (subscription.paymentHistory && subscription.paymentHistory.length > 0) {
        subscription.paymentHistory.forEach(payment => {
          allPayments.push({
            ...payment,
            subscriptionId: subscription._id,
            subscriptionPlanId: subscription.subscriptionPlanId,
            billingCycle: subscription.billingCycle,
            subscriptionStatus: subscription.status,
            subscriptionStartDate: subscription.startDate,
            subscriptionEndDate: subscription.endDate
          });
        });
      }
    });

    // Sort by payment date (most recent first)
    allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = allPayments.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(allPayments.length / limit),
          totalPayments: allPayments.length,
          hasNextPage: endIndex < allPayments.length,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching subscription payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

/**
 * Add beds to existing subscription
 * @route POST /api/subscription-payments/add-beds
 * @access Private (Admin/Superadmin)
 */
exports.addBeds = async (req, res) => {
  try {
    const { additionalBeds, newMaxBeds } = req.body;
    const userId = req.user._id;

    if (!additionalBeds || !newMaxBeds) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: additionalBeds, newMaxBeds'
      });
    }

    // Calculate additional cost
    const currentSubscription = await subscriptionService.getUserSubscription(userId);
    if (!currentSubscription.success || !currentSubscription.data) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const subscription = currentSubscription.data;
    const plan = subscription.subscriptionPlanId;
    const additionalCost = additionalBeds * plan.topUpPricePerBed;

    // Create Razorpay order for additional beds
    const orderData = {
      userId,
      subscriptionPlanId: plan._id,
      bedCount: newMaxBeds,
      branchCount: subscription.totalBranches,
      billingCycle: subscription.billingCycle,
      amount: additionalCost,
      receipt: `bed_topup_${userId}_${Date.now()}`
    };

    const orderResult = await razorpayService.createOrder(orderData);

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order for bed addition',
        error: orderResult.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Payment order created for bed addition',
      data: {
        orderId: orderResult.data.orderId,
        amount: orderResult.data.amount,
        additionalBeds,
        additionalCost,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    logger.error('Error adding beds to subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add beds',
      error: error.message
    });
  }
};

/**
 * Add branches to existing subscription
 * @route POST /api/subscription-payments/add-branches
 * @access Private (Admin/Superadmin)
 */
exports.addBranches = async (req, res) => {
  try {
    const { additionalBranches, newMaxBranches } = req.body;
    const userId = req.user._id;

    if (!additionalBranches || !newMaxBranches) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: additionalBranches, newMaxBranches'
      });
    }

    // Calculate additional cost
    const currentSubscription = await subscriptionService.getUserSubscription(userId);
    if (!currentSubscription.success || !currentSubscription.data) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const subscription = currentSubscription.data;
    const plan = subscription.subscriptionPlanId;
    const additionalCost = additionalBranches * plan.costPerBranch;

    // Create Razorpay order for additional branches
    const orderData = {
      userId,
      subscriptionPlanId: plan._id,
      bedCount: subscription.totalBeds,
      branchCount: newMaxBranches,
      billingCycle: subscription.billingCycle,
      amount: additionalCost,
      receipt: `branch_topup_${userId}_${Date.now()}`
    };

    const orderResult = await razorpayService.createOrder(orderData);

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order for branch addition',
        error: orderResult.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Payment order created for branch addition',
      data: {
        orderId: orderResult.data.orderId,
        amount: orderResult.data.amount,
        additionalBranches,
        additionalCost,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    logger.error('Error adding branches to subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add branches',
      error: error.message
    });
  }
};

/**
 * Get subscription payment status
 * @route GET /api/subscription-payments/:paymentId
 * @access Private (Admin/Superadmin)
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentResult = await razorpayService.getPaymentStatus(paymentId);

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment status',
        error: paymentResult.error
      });
    }

    return res.status(200).json({
      success: true,
      data: paymentResult.data
    });
  } catch (error) {
    logger.error('Error fetching subscription payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
};

/**
 * Create payment link for subscription
 * @route POST /api/subscription-payments/create-payment-link
 * @access Private (Admin/Superadmin)
 */
exports.createPaymentLink = async (req, res) => {
  try {
    const {
      subscriptionPlanId,
      bedCount,
      branchCount,
      billingCycle,
      callback_url,
      amount // Allow frontend to send calculated amount directly
    } = req.body;

    // Validate required fields
    if (!subscriptionPlanId || !bedCount || !branchCount || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subscriptionPlanId, bedCount, branchCount, billingCycle'
      });
    }

    let totalAmount;
    let plan = null;

    if (amount) {
      // Use amount provided by frontend (dynamic calculation)
      totalAmount = amount;
      console.log('Using frontend-calculated amount:', totalAmount);
    } else {
      // Fallback to backend calculation
      console.log('Calculating amount on backend...');

      // Get subscription plan details
      const planResult = await subscriptionService.getSubscriptionById(subscriptionPlanId);
      if (!planResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      plan = planResult.data;

      // Calculate total amount
      const costResult = plan.calculateTotalCost(bedCount, branchCount);
      totalAmount = costResult.totalMonthlyPrice;

      console.log('Backend calculated amount:', totalAmount);
    }

    // If plan is not set (frontend provided amount), fetch it for response data
    if (!plan) {
      const planResult = await subscriptionService.getSubscriptionById(subscriptionPlanId);
      if (planResult.success) {
        plan = planResult.data;
      }
    }

    // Create payment link data
    const paymentLinkData = {
      userId: req.user._id,
      subscriptionPlanId,
      bedCount,
      branchCount,
      billingCycle,
      amount: totalAmount,
      customer: {
        name: req.user.firstName + ' ' + req.user.lastName,
        email: req.user.email,
        contact: req.user.phone
      },
      callback_url: callback_url || `${process.env.FRONTEND_URL}/payment/callback`
    };

    const paymentLinkResult = await razorpayService.createPaymentLink(paymentLinkData);

    if (!paymentLinkResult.success) {
      return res.status(500).json({
        success: false,
        message: paymentLinkResult.message || 'Failed to create payment link',
        error: paymentLinkResult.error,
        debug: paymentLinkResult.debug
      });
    }

    logger.info('Subscription payment link created:', {
      userId: req.user._id,
      paymentLinkId: paymentLinkResult.data.paymentLinkId,
      amount: totalAmount,
      planId: subscriptionPlanId
    });

    return res.status(201).json({
      success: true,
      message: 'Payment link created successfully',
      data: {
        paymentLinkId: paymentLinkResult.data.paymentLinkId,
        payment_url: paymentLinkResult.data.short_url,
        amount: paymentLinkResult.data.amount,
        currency: paymentLinkResult.data.currency,
        reference_id: paymentLinkResult.data.reference_id,
        planDetails: {
          planName: plan?.planName || 'Unknown Plan',
          bedCount,
          branchCount,
          billingCycle,
          totalAmount
        }
      }
    });
  } catch (error) {
    logger.error('Error creating subscription payment link:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Request subscription upgrade
 * @route POST /api/subscription-payments/request-upgrade
 * @access Private (Admin/Superadmin)
 */
exports.requestUpgrade = async (req, res) => {
  try {
    const { requestedBeds, requestedBranches, requestMessage } = req.body;
    const userId = req.user._id;

    if (!requestedBeds || !requestedBranches) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: requestedBeds, requestedBranches'
      });
    }

    // Get current subscription
    const currentSubscription = await subscriptionService.getUserSubscription(userId);
    if (!currentSubscription.success || !currentSubscription.data) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const subscription = currentSubscription.data;
    const upgradeResult = await subscriptionService.requestUpgrade(subscription._id, {
      userId,
      requestedBeds,
      requestedBranches,
      requestMessage
    });

    if (!upgradeResult.success) {
      return res.status(400).json({
        success: false,
        message: upgradeResult.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Upgrade request submitted successfully',
      data: upgradeResult.data
    });
  } catch (error) {
    logger.error('Error requesting subscription upgrade:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit upgrade request',
      error: error.message
    });
  }
};

/**
 * Create dynamic payment order for various payment types
 * @route POST /api/subscription-payments/create-dynamic-order
 * @access Private (Admin/Superadmin)
 */
exports.createDynamicOrder = async (req, res) => {
  try {
    const {
      type,
      amount,
      currency = 'INR',
      description,
      metadata = {},
      subscriptionPlanId,
      bedCount,
      branchCount,
      billingCycle,
      addonType,
      quantity,
      targetSubscriptionId,
      customData,
      customFields = {}
    } = req.body;

    // Validate required fields
    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, amount, description'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Type-specific validation
    let orderData = {
      userId: req.user._id,
      type,
      amount,
      currency,
      description,
      metadata: {
        ...metadata,
        paymentType: type,
        userId: req.user._id
      }
    };

    // Add type-specific data
    switch (type) {
      case 'subscription':
        if (!subscriptionPlanId || !bedCount || !branchCount || !billingCycle) {
          return res.status(400).json({
            success: false,
            message: 'Missing subscription fields: subscriptionPlanId, bedCount, branchCount, billingCycle'
          });
        }
        orderData = {
          ...orderData,
          subscriptionPlanId,
          bedCount,
          branchCount,
          billingCycle
        };
        break;

      case 'addon':
        if (!addonType || !quantity) {
          return res.status(400).json({
            success: false,
            message: 'Missing addon fields: addonType, quantity'
          });
        }
        orderData = {
          ...orderData,
          addonType,
          quantity,
          targetSubscriptionId
        };
        break;

      case 'custom':
        if (customData) {
          orderData.customData = customData;
        }
        break;

      default:
        // For other types, add custom fields
        orderData.customFields = customFields;
    }

    const orderResult = await razorpayService.createOrder(orderData);

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    logger.info('Dynamic payment order created:', {
      userId: req.user._id,
      type,
      orderId: orderResult.data.orderId,
      amount,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.data.orderId,
        amount: orderResult.data.amount,
        currency: orderResult.data.currency,
        key: process.env.RAZORPAY_KEY_ID,
        type,
        description,
        metadata: orderData.metadata
      }
    });
  } catch (error) {
    logger.error('Error creating dynamic payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Verify dynamic payment
 * @route POST /api/subscription-payments/verify-dynamic
 * @access Private (Admin/Superadmin)
 */
exports.verifyDynamicPayment = async (req, res) => {
  try {
    const {
      orderId,
      paymentId,
      signature,
      type,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !signature || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields'
      });
    }

    // Verify payment signature
    const verificationResult = razorpayService.verifyPaymentSignature({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    });

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
        error: verificationResult.message
      });
    }

    // Fetch payment details from Razorpay
    const paymentResult = await razorpayService.fetchPayment(paymentId);
    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details',
        error: paymentResult.error
      });
    }

    // Process payment based on type
    let processingResult;

    switch (type) {
      case 'subscription':
        processingResult = await razorpayService.processSubscriptionPayment(req.user._id, {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          subscriptionPlanId: metadata.planId || req.user.subscription?.planId,
          bedCount: metadata.bedCount || 1,
          branchCount: metadata.branchCount || 1,
          billingCycle: metadata.billingCycle || 'monthly'
        });
        break;

      case 'addon':
        // Handle addon payment (beds, branches, etc.)
        processingResult = await razorpayService.processAddonPayment(req.user._id, {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          addonType: metadata.addonType,
          quantity: metadata.quantity,
          targetSubscriptionId: metadata.targetSubscriptionId
        });
        break;

      case 'custom':
      case 'donation':
      case 'fee':
      case 'penalty':
        // Handle custom payments
        processingResult = await razorpayService.processCustomPayment(req.user._id, {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          type,
          amount: paymentResult.data.amount,
          metadata
        });
        break;

      default:
        // Generic payment processing
        processingResult = {
          success: true,
          message: 'Payment verified successfully',
          data: {
            orderId,
            paymentId,
            amount: paymentResult.data.amount,
            type
          }
        };
    }

    if (!processingResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Payment verified but processing failed',
        error: processingResult.error
      });
    }

    logger.info('Dynamic payment verified and processed:', {
      userId: req.user._id,
      orderId,
      paymentId,
      type,
      amount: paymentResult.data.amount
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and processed successfully',
      data: {
        orderId,
        paymentId,
        amount: paymentResult.data.amount,
        currency: paymentResult.data.currency,
        method: paymentResult.data.method,
        type,
        processingResult: processingResult.data
      }
    });
  } catch (error) {
    logger.error('Error verifying dynamic payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

/**
 * Create dynamic payment link
 * @route POST /api/subscription-payments/create-dynamic-payment-link
 * @access Private (Admin/Superadmin)
 */
exports.createDynamicPaymentLink = async (req, res) => {
  try {
    const {
      type,
      amount,
      currency = 'INR',
      description,
      customer,
      callback_url,
      callback_method = 'get',
      metadata = {},
      expire_by,
      reminder_enable = true
    } = req.body;

    // Validate required fields
    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, amount, description'
      });
    }

    const paymentLinkData = {
      userId: req.user._id,
      type,
      amount,
      currency,
      description,
      customer: customer || {
        name: req.user.firstName + ' ' + req.user.lastName,
        email: req.user.email,
        contact: req.user.phone
      },
      callback_url: callback_url || `${process.env.FRONTEND_URL}/payment/callback`,
      callback_method,
      notes: {
        type,
        userId: req.user._id,
        ...metadata
      }
    };

    if (expire_by) {
      paymentLinkData.expire_by = expire_by;
    }

    const paymentLinkResult = await razorpayService.createPaymentLink(paymentLinkData);

    if (!paymentLinkResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment link',
        error: paymentLinkResult.error
      });
    }

    logger.info('Dynamic payment link created:', {
      userId: req.user._id,
      type,
      paymentLinkId: paymentLinkResult.data.paymentLinkId,
      amount,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Payment link created successfully',
      data: paymentLinkResult.data
    });
  } catch (error) {
    logger.error('Error creating dynamic payment link:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get payment analytics
 * @route GET /api/subscription-payments/analytics
 * @access Private (Admin/Superadmin)
 */
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type,
      status,
      paymentMethod
    } = req.query;

    // This would typically aggregate data from payment records
    // For now, return mock analytics data
    const analytics = {
      totalPayments: 0,
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
      paymentMethods: {},
      typeBreakdown: {},
      dailyStats: [],
      monthlyStats: []
    };

    // Get user's payment history
    const userId = req.user._id;
    const subscriptionHistory = await subscriptionManagementService.getUserSubscriptionHistory(userId);

    if (subscriptionHistory.success && subscriptionHistory.data) {
      let totalPayments = 0;
      let totalAmount = 0;
      let successfulPayments = 0;
      const paymentMethods = {};
      const typeBreakdown = {};

      subscriptionHistory.data.forEach(subscription => {
        if (subscription.paymentHistory && subscription.paymentHistory.length > 0) {
          subscription.paymentHistory.forEach(payment => {
            totalPayments++;
            totalAmount += payment.amount || 0;

            if (payment.status === 'paid' || payment.status === 'completed') {
              successfulPayments++;
            }

            // Count payment methods
            const method = payment.paymentMethod || 'unknown';
            paymentMethods[method] = (paymentMethods[method] || 0) + 1;

            // Count payment types
            const paymentType = payment.planDetails?.type || 'subscription';
            typeBreakdown[paymentType] = (typeBreakdown[paymentType] || 0) + 1;
          });
        }
      });

      analytics.totalPayments = totalPayments;
      analytics.totalAmount = totalAmount;
      analytics.successfulPayments = successfulPayments;
      analytics.failedPayments = totalPayments - successfulPayments;
      analytics.paymentMethods = paymentMethods;
      analytics.typeBreakdown = typeBreakdown;
    }

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error fetching payment analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics',
      error: error.message
    });
  }
};