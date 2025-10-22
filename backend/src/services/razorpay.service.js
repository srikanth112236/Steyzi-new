const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');
const UserSubscription = require('../models/userSubscription.model');
const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const paymentStatusController = require('../controllers/paymentStatus.controller');

class RazorpayService {
  constructor() {
    // TEMPORARY: Hardcoded credentials for testing
    const keyId = 'rzp_test_RW92VTqFXf9aR4';
    const keySecret = 'EuzFveZEGHiU6I6UEPQClauq'; // Your provided secret key

    console.log('🔧 Using temporary hardcoded Razorpay credentials for testing');
    console.log('⚠️  REMEMBER: Add proper credentials to .env file later!');

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * Create a Razorpay order for subscription payment
   */
  async createOrder(orderData) {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const {
        userId,
        subscriptionPlanId,
        bedCount,
        branchCount,
        billingCycle,
        amount,
        currency = 'INR',
        receipt
      } = orderData;

      // Validate required fields
      if (!userId || !subscriptionPlanId || !amount || !billingCycle) {
        throw new Error('Missing required fields: userId, subscriptionPlanId, amount, billingCycle');
      }

      // Get subscription plan details for plan name
      const subscriptionPlan = await Subscription.findById(subscriptionPlanId);
      if (!subscriptionPlan) {
        throw new Error('Subscription plan not found');
      }

      // Create Razorpay order
      const orderOptions = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `subscription_${userId}_${Date.now()}`,
        notes: {
          userId,
          subscriptionPlanId,
          bedCount: bedCount || 1,
          branchCount: branchCount || 1,
          billingCycle,
          planName: subscriptionPlan.planName,
          type: 'subscription_payment'
        }
      };

      logger.info('Creating Razorpay order:', {
        userId,
        amount: orderOptions.amount,
        currency,
        receipt: orderOptions.receipt
      });

      const order = await this.razorpay.orders.create(orderOptions);

      logger.info('Razorpay order created successfully:', {
        orderId: order.id,
        amount: order.amount,
        status: order.status
      });

      return {
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status
        }
      };
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      return {
        success: false,
        message: 'Failed to create payment order',
        error: error.message
      };
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyPaymentSignature(orderData) {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay || !process.env.RAZORPAY_KEY_SECRET) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = orderData;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Missing required payment verification fields');
      }

      // Create the signature string
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      // Verify signature
      const isValidSignature = expectedSignature === razorpay_signature;

      if (!isValidSignature) {
        logger.warn('Invalid payment signature:', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          expectedSignature,
          receivedSignature: razorpay_signature
        });
        return {
          success: false,
          message: 'Invalid payment signature'
        };
      }

      logger.info('Payment signature verified successfully:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });

      return {
        success: true,
        data: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          isValid: true
        }
      };
    } catch (error) {
      logger.error('Error verifying payment signature:', error);
      return {
        success: false,
        message: 'Payment verification failed',
        error: error.message
      };
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async fetchPayment(paymentId) {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const payment = await this.razorpay.payments.fetch(paymentId);

      logger.info('Payment details fetched:', {
        paymentId,
        amount: payment.amount,
        status: payment.status,
        method: payment.method
      });

      return {
        success: true,
        data: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          captured: payment.captured,
          description: payment.description,
          created_at: payment.created_at,
          notes: payment.notes
        }
      };
    } catch (error) {
      logger.error('Error fetching payment details:', error);
      return {
        success: false,
        message: 'Failed to fetch payment details',
        error: error.message
      };
    }
  }

  /**
   * Process successful subscription payment
   */
  async processSubscriptionPayment(userId, paymentData) {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        subscriptionPlanId,
        bedCount,
        branchCount,
        billingCycle
      } = paymentData;

      // Find the subscription plan
      const subscriptionPlan = await Subscription.findById(subscriptionPlanId);
      if (!subscriptionPlan) {
        throw new Error('Subscription plan not found');
      }

      // Calculate dates
      const now = new Date();
      let endDate = new Date(now);

      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (billingCycle === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Calculate total price
      let totalPrice = subscriptionPlan.basePrice;
      if (bedCount > subscriptionPlan.baseBedCount) {
        const extraBeds = bedCount - subscriptionPlan.baseBedCount;
        totalPrice += extraBeds * subscriptionPlan.topUpPricePerBed;
      }

      if (branchCount > 1) {
        const extraBranches = branchCount - 1;
        totalPrice += extraBranches * subscriptionPlan.costPerBranch;
      }

      // Apply annual discount if applicable
      if (billingCycle === 'annual' && subscriptionPlan.annualDiscount > 0) {
        const annualTotal = totalPrice * 12;
        const discount = (annualTotal * subscriptionPlan.annualDiscount) / 100;
        totalPrice = (annualTotal - discount) / 12;
      }

      // Find existing subscription for the user
      const existingSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trial'] }
      }).sort({ createdAt: -1 });

      // Create or update subscription
      const subscriptionData = {
        userId,
        subscriptionPlanId,
        billingCycle,
        startDate: now,
        endDate,
        basePrice: subscriptionPlan.basePrice,
        totalBeds: bedCount,
        totalBranches: branchCount,
        totalPrice,
        status: 'active',
        paymentStatus: 'completed',
        paymentId: razorpayPaymentId,
        createdBy: userId,
        paymentHistory: [{
          razorpayOrderId,
          razorpayPaymentId,
          amount: totalPrice,
          currency: 'INR',
          status: 'paid',
          paymentMethod: 'razorpay',
          billingCycle,
          planDetails: {
            planId: subscriptionPlanId,
            planName: subscriptionPlan.planName,
            bedCount,
            branchCount
          }
        }]
      };

      if (existingSubscription) {
        // Update existing subscription
        existingSubscription.subscriptionPlanId = subscriptionPlanId;
        existingSubscription.billingCycle = billingCycle;
        existingSubscription.endDate = endDate;
        existingSubscription.totalBeds = bedCount;
        existingSubscription.totalBranches = branchCount;
        existingSubscription.totalPrice = totalPrice;
        existingSubscription.status = 'active';
        existingSubscription.paymentStatus = 'completed';
        existingSubscription.paymentId = razorpayPaymentId;
        existingSubscription.paymentHistory = subscriptionData.paymentHistory;
        existingSubscription.updatedAt = now;

        await existingSubscription.save();
      } else {
        // Create new subscription
        const newSubscription = new UserSubscription(subscriptionData);
        await newSubscription.save();
      }

      // Update plan's subscribed count
      subscriptionPlan.subscribedCount += 1;
      await subscriptionPlan.save();

      logger.info('Subscription payment processed successfully:', {
        userId,
        subscriptionId: existingSubscription ? existingSubscription._id : 'new',
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        amount: totalPrice
      });

      return {
        success: true,
        message: 'Subscription payment processed successfully',
        data: {
          subscriptionId: existingSubscription ? existingSubscription._id : newSubscription._id,
          amount: totalPrice,
          endDate
        }
      };
    } catch (error) {
      logger.error('Error processing subscription payment:', error);
      return {
        success: false,
        message: 'Failed to process subscription payment',
        error: error.message
      };
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(webhookData) {
    try {
      const { event, payload } = webhookData;

      console.log('\n🔄 RAZORPAY SERVICE: Processing webhook...');
      console.log('📨 Event:', event);
      console.log('💳 Payment ID:', payload?.payment?.entity?.id);
      console.log('📋 Order ID:', payload?.order?.entity?.id);

      logger.info('Processing Razorpay webhook:', { event, paymentId: payload?.payment?.entity?.id });

      switch (event) {
        case 'payment.authorized':
        case 'payment.captured':
          console.log('✅ Processing payment success...');
          return await this.handlePaymentSuccess(payload);
        case 'payment.failed':
          console.log('❌ Processing payment failure...');
          return await this.handlePaymentFailure(payload);
        default:
          console.log('⚠️ Unhandled webhook event:', event);
          logger.info('Unhandled webhook event:', event);
          return { success: true, message: 'Webhook received' };
      }
    } catch (error) {
      console.log('💥 WEBHOOK ERROR:', error.message);
      logger.error('Error handling webhook:', error);
      return {
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      };
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(payload) {
    try {
      const payment = payload.payment.entity;
      const order = payload.order.entity;

      console.log('\n💰 PAYMENT SUCCESS HANDLER =============');
      console.log('💳 Payment Details:');
      console.log('   ├─ Payment ID:', payment.id);
      console.log('   ├─ Amount:', payment.amount / 100, '₹');
      console.log('   ├─ Currency:', payment.currency);
      console.log('   ├─ Method:', payment.method);
      console.log('   └─ Status:', payment.status);

      console.log('📋 Order Details:');
      console.log('   ├─ Order ID:', order.id);
      console.log('   ├─ User ID:', order.notes.userId);
      console.log('   ├─ Plan ID:', order.notes.subscriptionPlanId);
      console.log('   ├─ Plan Name:', order.notes.planName);
      console.log('   ├─ Bed Count:', order.notes.bedCount);
      console.log('   └─ Branch Count:', order.notes.branchCount);

      // Find subscription by order notes
      const userId = order.notes.userId;
      const subscriptionPlanId = order.notes.subscriptionPlanId;

      if (!userId || !subscriptionPlanId) {
        console.log('❌ Missing required data in order notes');
        logger.error('Missing userId or subscriptionPlanId in order notes');
        return { success: false, message: 'Invalid order data' };
      }

      console.log('✅ Order data validation passed');

      // Process the subscription payment
      const result = await this.processSubscriptionPayment(userId, {
        razorpayOrderId: order.id,
        razorpayPaymentId: payment.id,
        subscriptionPlanId,
        bedCount: parseInt(order.notes.bedCount) || 1,
        branchCount: parseInt(order.notes.branchCount) || 1,
        billingCycle: order.notes.billingCycle
      });

      if (result.success) {
        logger.info('Payment success webhook processed:', {
          paymentId: payment.id,
          orderId: order.id,
          userId
        });

        // Update user's payment history
        try {
          const paymentHistoryEntry = {
            razorpayPaymentId: payment.id,
            razorpayOrderId: order.id,
            amount: payment.amount / 100, // Convert from paise to rupees
            currency: payment.currency,
            status: 'paid',
            paymentMethod: payment.method || 'razorpay',
            billingCycle: order.notes.billingCycle,
            planDetails: {
              planId: subscriptionPlanId,
              planName: order.notes.planName,
              bedCount: parseInt(order.notes.bedCount) || 1,
              branchCount: parseInt(order.notes.branchCount) || 1
            },
            paymentDate: new Date(),
            description: `Subscription payment - ${order.notes.planName}`,
            metadata: {
              orderNotes: order.notes,
              paymentEntity: {
                id: payment.id,
                method: payment.method,
                status: payment.status,
                created_at: payment.created_at
              }
            }
          };

          // Update user's payment history IMMEDIATELY upon webhook
          console.log('\n📝 UPDATING USER PAYMENT HISTORY =======');
          console.log('👤 User ID:', userId);
          console.log('💰 Payment Data to Store:');
          console.log('   ├─ Payment ID:', paymentHistoryEntry.razorpayPaymentId);
          console.log('   ├─ Order ID:', paymentHistoryEntry.razorpayOrderId);
          console.log('   ├─ Amount:', `₹${paymentHistoryEntry.amount}`);
          console.log('   ├─ Plan:', paymentHistoryEntry.planDetails.planName);
          console.log('   ├─ Payment Date:', paymentHistoryEntry.paymentDate);
          console.log('   └─ Status:', paymentHistoryEntry.status);

          const updateStartTime = Date.now();
          console.log('⏳ Updating database...');

          await User.findByIdAndUpdate(
            userId,
            {
              $push: { paymentHistory: paymentHistoryEntry },
              $set: { 'subscription.status': 'active' } // Ensure subscription status is active
            },
            { new: true }
          );
          const updateEndTime = Date.now();

          console.log('✅ USER PAYMENT HISTORY UPDATED');
          console.log(`   ├─ Update Time: ${updateEndTime - updateStartTime}ms`);
          console.log(`   ├─ Timestamp: ${new Date().toISOString()}`);
          console.log(`   └─ User: ${userId} - Payment: ${payment.id}`);

          logger.info('✅ User payment history updated IMMEDIATELY:', {
            userId,
            paymentId: payment.id,
            amount: paymentHistoryEntry.amount,
            updateTime: `${updateEndTime - updateStartTime}ms`,
            timestamp: new Date().toISOString()
          });

          // Broadcast payment success to connected clients
          console.log('\n📡 BROADCASTING REAL-TIME UPDATE =======');
          console.log('🎯 Target User:', userId);
          console.log('📊 Broadcast Data:');
          console.log('   ├─ Payment ID:', payment.id);
          console.log('   ├─ Amount:', `₹${paymentHistoryEntry.amount}`);
          console.log('   ├─ Plan:', order.notes.planName);
          console.log('   └─ Status: success');

          paymentStatusController.broadcastPaymentSuccess(userId, {
            paymentId: payment.id,
            orderId: order.id,
            amount: paymentHistoryEntry.amount,
            currency: payment.currency,
            subscriptionPlanId,
            planName: order.notes.planName,
            bedCount: parseInt(order.notes.bedCount) || 1,
            branchCount: parseInt(order.notes.branchCount) || 1,
            billingCycle: order.notes.billingCycle
          });

          console.log('✅ Real-time broadcast sent to user connections');

        } catch (updateError) {
          logger.error('Error updating user payment history:', {
            userId,
            paymentId: payment.id,
            error: updateError.message
          });
          // Don't fail the webhook if user update fails, just log it
        }
      }

      return result;
    } catch (error) {
      logger.error('Error handling payment success webhook:', error);
      return {
        success: false,
        message: 'Failed to process payment success',
        error: error.message
      };
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailure(payload) {
    try {
      const payment = payload.payment.entity;
      const order = payload.order.entity;

      logger.warn('Payment failed:', {
        paymentId: payment.id,
        orderId: order.id,
        reason: payment.error_reason
      });

      // TODO: Update subscription status to failed if exists
      // This would depend on your business logic

      // Broadcast payment failure to connected clients
      paymentStatusController.broadcastPaymentFailure(userId, {
        paymentId: payment.id,
        orderId: order.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        error: payment.error_reason || 'Payment failed'
      });

      return {
        success: true,
        message: 'Payment failure recorded',
        data: {
          paymentId: payment.id,
          orderId: order.id,
          reason: payment.error_reason
        }
      };
    } catch (error) {
      logger.error('Error handling payment failure webhook:', error);
      return {
        success: false,
        message: 'Failed to process payment failure',
        error: error.message
      };
    }
  }

  /**
   * Process addon payment (beds, branches, features)
   */
  async processAddonPayment(userId, paymentData) {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        addonType,
        quantity,
        targetSubscriptionId
      } = paymentData;

      // Find the target subscription
      let subscription;
      if (targetSubscriptionId) {
        subscription = await UserSubscription.findById(targetSubscriptionId);
      } else {
        // Find active subscription for the user
        subscription = await UserSubscription.findOne({
          userId,
          status: { $in: ['active', 'trial'] }
        }).sort({ createdAt: -1 });
      }

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Process based on addon type
      switch (addonType) {
        case 'beds':
          subscription.totalBeds += quantity;
          break;
        case 'branches':
          subscription.totalBranches += quantity;
          break;
        case 'features':
          // Handle feature addons
          if (!subscription.addonFeatures) {
            subscription.addonFeatures = [];
          }
          subscription.addonFeatures.push(...quantity); // quantity could be array of feature names
          break;
        default:
          throw new Error(`Unknown addon type: ${addonType}`);
      }

      // Add payment to history
      subscription.paymentHistory.push({
        razorpayOrderId,
        razorpayPaymentId,
        amount: 0, // This should be calculated based on addon pricing
        currency: 'INR',
        status: 'paid',
        paymentMethod: 'razorpay',
        addonDetails: {
          type: addonType,
          quantity
        }
      });

      subscription.updatedAt = new Date();
      await subscription.save();

      logger.info('Addon payment processed successfully:', {
        userId,
        subscriptionId: subscription._id,
        addonType,
        quantity,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId
      });

      return {
        success: true,
        message: `${addonType} addon payment processed successfully`,
        data: {
          subscriptionId: subscription._id,
          addonType,
          quantity,
          newTotal: addonType === 'beds' ? subscription.totalBeds :
                   addonType === 'branches' ? subscription.totalBranches : null
        }
      };
    } catch (error) {
      logger.error('Error processing addon payment:', error);
      return {
        success: false,
        message: 'Failed to process addon payment',
        error: error.message
      };
    }
  }

  /**
   * Process custom payment (donations, fees, penalties, etc.)
   */
  async processCustomPayment(userId, paymentData) {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        type,
        amount,
        metadata = {}
      } = paymentData;

      // Create a payment record (you might want to create a separate Payment model for this)
      const paymentRecord = {
        userId,
        razorpayOrderId,
        razorpayPaymentId,
        type,
        amount,
        currency: 'INR',
        status: 'paid',
        paymentMethod: 'razorpay',
        metadata,
        createdAt: new Date()
      };

      // Here you would typically save to a Payment collection
      // For now, we'll just log it
      logger.info('Custom payment processed successfully:', {
        userId,
        type,
        amount,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        metadata
      });

      // You could also update user balance, credits, etc. based on payment type
      // For example:
      // if (type === 'donation') {
      //   // Add donation credits
      // } else if (type === 'fee') {
      //   // Process fee payment
      // }

      return {
        success: true,
        message: `${type} payment processed successfully`,
        data: {
          paymentId: razorpayPaymentId,
          type,
          amount,
          metadata
        }
      };
    } catch (error) {
      logger.error('Error processing custom payment:', error);
      return {
        success: false,
        message: 'Failed to process custom payment',
        error: error.message
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount = null, notes = '') {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const refundOptions = {
        payment_id: paymentId,
        notes: notes || 'Subscription refund'
      };

      if (amount) {
        refundOptions.amount = Math.round(amount * 100); // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);

      logger.info('Payment refund initiated:', {
        paymentId,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status
      });

      return {
        success: true,
        data: {
          refundId: refund.id,
          amount: refund.amount,
          status: refund.status,
          created_at: refund.created_at
        }
      };
    } catch (error) {
      logger.error('Error initiating refund:', error);
      return {
        success: false,
        message: 'Failed to initiate refund',
        error: error.message
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        success: true,
        data: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: payment.created_at
        }
      };
    } catch (error) {
      logger.error('Error fetching payment status:', error);
      return {
        success: false,
        message: 'Failed to fetch payment status',
        error: error.message
      };
    }
  }

  /**
   * Create payment link for subscription
   */
  async createPaymentLink(paymentLinkData) {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const {
        userId,
        subscriptionPlanId,
        bedCount,
        branchCount,
        billingCycle,
        amount,
        currency = 'INR',
        customer,
        callback_url,
        callback_method = 'get'
      } = paymentLinkData;

      // Validate required fields
      if (!userId || !subscriptionPlanId || !amount || !billingCycle) {
        throw new Error('Missing required fields: userId, subscriptionPlanId, amount, billingCycle');
      }

      // Get subscription plan details for plan name
      const subscriptionPlan = await Subscription.findById(subscriptionPlanId);
      if (!subscriptionPlan) {
        throw new Error('Subscription plan not found');
      }

      // Create payment link options
      const paymentLinkOptions = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: currency,
        reference_id: `sub_${userId.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
        customer: {
          name: customer?.name,
          email: customer?.email,
          contact: customer?.contact
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        notes: {
          userId,
          subscriptionPlanId,
          bedCount: bedCount || 1,
          branchCount: branchCount || 1,
          billingCycle,
          planName: subscriptionPlan.planName,
          type: 'subscription_payment'
        },
        callback_url: callback_url,
        callback_method: callback_method
      };

      logger.info('Creating Razorpay payment link:', {
        userId,
        amount: paymentLinkOptions.amount,
        currency,
        reference_id: paymentLinkOptions.reference_id
      });

      const paymentLink = await this.razorpay.paymentLink.create(paymentLinkOptions);

      logger.info('Razorpay payment link created successfully:', {
        paymentLinkId: paymentLink.id,
        short_url: paymentLink.short_url,
        amount: paymentLink.amount,
        status: paymentLink.status
      });

      // Console log the payment link URL for debugging
      console.log('Generated Payment Link URL:', paymentLink.short_url);

      return {
        success: true,
        data: {
          paymentLinkId: paymentLink.id,
          short_url: paymentLink.short_url,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          reference_id: paymentLink.reference_id,
          status: paymentLink.status,
          created_at: paymentLink.created_at
        }
      };
    } catch (error) {
      // Log detailed error information
      console.log('🔴 RAZORPAY PAYMENT LINK ERROR DETAILS:');
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Error statusCode:', error.statusCode);
      console.log('Error type:', error.type);
      console.log('Error stack:', error.stack);
      console.log('Full error object:', JSON.stringify(error, null, 2));

      logger.error('Error creating Razorpay payment link:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        type: error.type,
        stack: error.stack
      });

      // Provide detailed error information for debugging
      let errorMessage = 'Failed to create payment link';
      let errorDetails = error.message;

      if (error.code) {
        errorMessage += ` (${error.code})`;
      }

      // Check for common Razorpay errors
      if (error.message?.includes('Invalid API Key')) {
        errorMessage = 'Invalid Razorpay API credentials. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Razorpay authentication failed. Please verify your API keys';
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        errorMessage = 'Network error connecting to Razorpay. Please check your internet connection';
      }

      return {
        success: false,
        message: errorMessage,
        error: errorDetails,
        debug: {
          code: error.code,
          statusCode: error.statusCode,
          type: error.type,
          fullMessage: error.message
        }
      };
    }
  }

  /**
   * Fetch payment link details
   */
  async fetchPaymentLink(paymentLinkId) {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const paymentLink = await this.razorpay.paymentLink.fetch(paymentLinkId);

      return {
        success: true,
        data: {
          id: paymentLink.id,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          status: paymentLink.status,
          short_url: paymentLink.short_url,
          reference_id: paymentLink.reference_id,
          created_at: paymentLink.created_at,
          updated_at: paymentLink.updated_at
        }
      };
    } catch (error) {
      logger.error('Error fetching payment link:', error);
      return {
        success: false,
        message: 'Failed to fetch payment link',
        error: error.message
      };
    }
  }

  /**
   * Cancel payment link
   */
  async cancelPaymentLink(paymentLinkId) {
    try {
      // Check if Razorpay is configured
      if (!this.razorpay) {
        return {
          success: false,
          message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file'
        };
      }

      const paymentLink = await this.razorpay.paymentLink.cancel(paymentLinkId);

      return {
        success: true,
        data: {
          id: paymentLink.id,
          status: paymentLink.status,
          cancelled_at: paymentLink.cancelled_at
        }
      };
    } catch (error) {
      logger.error('Error cancelling payment link:', error);
      return {
        success: false,
        message: 'Failed to cancel payment link',
        error: error.message
      };
    }
  }
}

module.exports = new RazorpayService();
