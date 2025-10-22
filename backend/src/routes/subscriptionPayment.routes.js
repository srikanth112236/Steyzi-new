const express = require('express');
const router = express.Router();
const subscriptionPaymentController = require('../controllers/subscriptionPayment.controller');
const paymentStatusController = require('../controllers/paymentStatus.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Subscription Payment Routes
 * Handles Razorpay payment operations for subscriptions
 */

// All routes require authentication
router.use(authenticate);

// Create payment order
router.post('/create-order', subscriptionPaymentController.createOrder);

// Create payment link
router.post('/create-payment-link', subscriptionPaymentController.createPaymentLink);

// Verify payment
router.post('/verify', subscriptionPaymentController.verifyPayment);

// Get payment history
router.get('/history', subscriptionPaymentController.getPaymentHistory);

// Add beds to subscription
router.post('/add-beds', subscriptionPaymentController.addBeds);

// Add branches to subscription
router.post('/add-branches', subscriptionPaymentController.addBranches);

// Get payment status
router.get('/:paymentId', subscriptionPaymentController.getPaymentStatus);

// Request subscription upgrade
router.post('/request-upgrade', subscriptionPaymentController.requestUpgrade);

// Dynamic payment routes
router.post('/create-dynamic-order', subscriptionPaymentController.createDynamicOrder);
router.post('/verify-dynamic', subscriptionPaymentController.verifyDynamicPayment);
router.post('/create-dynamic-payment-link', subscriptionPaymentController.createDynamicPaymentLink);

// Payment analytics
router.get('/analytics', subscriptionPaymentController.getPaymentAnalytics);

// Payment status SSE endpoint
router.get('/status', paymentStatusController.getPaymentStatusStream);

// Webhook endpoint (public - for Razorpay)
router.post('/webhook', subscriptionPaymentController.handleWebhook);

module.exports = router;
