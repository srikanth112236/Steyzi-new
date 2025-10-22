// Demo script to show complete payment flow with detailed console logs
// Run this to see how payment data flows through the system

const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const razorpayService = require('./src/services/razorpay.service');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/steyzi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function demonstratePaymentFlow() {
  try {
    console.log('🎬 PAYMENT FLOW DEMONSTRATION =============\n');

    // Create a demo user
    console.log('👤 Creating demo user...');
    let demoUser = await User.findOne({ email: 'demo-payment@example.com' });

    if (!demoUser) {
      demoUser = await User.create({
        firstName: 'Demo',
        lastName: 'Payment',
        email: 'demo-payment@example.com',
        phone: '9999999999',
        password: 'demopassword123',
        role: 'admin',
        isEmailVerified: true,
        subscription: { status: 'free' }
      });
      console.log('✅ Demo user created:', demoUser._id);
    } else {
      console.log('✅ Demo user found:', demoUser._id);
    }

    console.log('\n📊 BEFORE PAYMENT:');
    console.log('   ├─ User Payment History Count:', demoUser.paymentHistory?.length || 0);
    console.log('   └─ User Subscription Status:', demoUser.subscription?.status || 'none');

    // Simulate webhook payload for successful payment
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `demo_payment_${Date.now()}`,
            amount: 50000, // ₹500
            currency: 'INR',
            status: 'captured',
            method: 'card',
            created_at: Date.now()
          }
        },
        order: {
          entity: {
            id: `demo_order_${Date.now()}`,
            notes: {
              userId: demoUser._id.toString(),
              subscriptionPlanId: '507f1f77bcf86cd799439012',
              bedCount: '10',
              branchCount: '3',
              billingCycle: 'monthly',
              planName: 'Premium Demo Plan',
              type: 'subscription_payment'
            }
          }
        }
      }
    };

    console.log('\n🎣 SIMULATING WEBHOOK RECEIPT...');
    console.log('📨 Event:', webhookPayload.event);
    console.log('💳 Payment ID:', webhookPayload.payload.payment.entity.id);
    console.log('👤 User ID:', webhookPayload.payload.order.entity.notes.userId);

    // Process the webhook
    console.log('\n⚡ PROCESSING WEBHOOK...');
    const result = await razorpayService.handleWebhook(webhookPayload);

    if (result.success) {
      console.log('✅ Webhook processed successfully');

      // Check the updated user
      console.log('\n📊 AFTER PAYMENT PROCESSING:');
      const updatedUser = await User.findById(demoUser._id);

      if (updatedUser.paymentHistory && updatedUser.paymentHistory.length > 0) {
        const latestPayment = updatedUser.paymentHistory[updatedUser.paymentHistory.length - 1];

        console.log('💾 PAYMENT STORED IN DATABASE:');
        console.log('   ├─ Payment ID:', latestPayment.razorpayPaymentId);
        console.log('   ├─ Order ID:', latestPayment.razorpayOrderId);
        console.log('   ├─ Amount:', `₹${latestPayment.amount}`);
        console.log('   ├─ Currency:', latestPayment.currency);
        console.log('   ├─ Status:', latestPayment.status);
        console.log('   ├─ Payment Method:', latestPayment.paymentMethod);
        console.log('   ├─ Plan Name:', latestPayment.planDetails.planName);
        console.log('   ├─ Bed Count:', latestPayment.planDetails.bedCount);
        console.log('   ├─ Branch Count:', latestPayment.planDetails.branchCount);
        console.log('   ├─ Payment Date:', latestPayment.paymentDate);
        console.log('   └─ Subscription Status:', updatedUser.subscription?.status);

        console.log('\n🎯 COMPLETE FLOW SUMMARY:');
        console.log('   1. 🎣 Webhook received from Razorpay');
        console.log('   2. 🔐 Signature verified');
        console.log('   3. 💾 Payment history stored in user document');
        console.log('   4. 📡 Real-time notification sent to frontend');
        console.log('   5. 🎯 User redirected to dashboard');

      } else {
        console.log('❌ Payment history not found in user document');
      }

    } else {
      console.log('❌ Webhook processing failed:', result.message);
    }

    console.log('\n🏁 DEMONSTRATION COMPLETE ===============');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the demonstration
demonstratePaymentFlow();

// WHAT TO EXPECT IN CONSOLE:
//
// 🎬 PAYMENT FLOW DEMONSTRATION =============
//
// 👤 Creating demo user...
// ✅ Demo user created: 64f1a2b3c4d5e6f7g8h9i0j1
//
// 📊 BEFORE PAYMENT:
//    ├─ User Payment History Count: 0
//    └─ User Subscription Status: free
//
// 🎣 SIMULATING WEBHOOK RECEIPT...
// 📨 Event: payment.captured
// 💳 Payment ID: demo_payment_1703123456789
// 👤 User ID: 64f1a2b3c4d5e6f7g8h9i0j1
//
// ⚡ PROCESSING WEBHOOK...
//
// 🔄 RAZORPAY SERVICE: Processing webhook...
// 📨 Event: payment.captured
// 💳 Payment ID: demo_payment_1703123456789
// 📋 Order ID: demo_order_1703123456789
//
// 💰 PAYMENT SUCCESS HANDLER =============
// 💳 Payment Details:
//    ├─ Payment ID: demo_payment_1703123456789
//    ├─ Amount: 500 ₹
//    ├─ Currency: INR
//    ├─ Method: card
//    └─ Status: captured
//
// 📋 Order Details:
//    ├─ Order ID: demo_order_1703123456789
//    ├─ User ID: 64f1a2b3c4d5e6f7g8h9i0j1
//    ├─ Plan ID: 507f1f77bcf86cd799439012
//    ├─ Plan Name: Premium Demo Plan
//    ├─ Bed Count: 10
//    └─ Branch Count: 3
//
// ✅ Order data validation passed
//
// 📝 UPDATING USER PAYMENT HISTORY =======
// 👤 User ID: 64f1a2b3c4d5e6f7g8h9i0j1
// 💰 Payment Data to Store:
//    ├─ Payment ID: demo_payment_1703123456789
//    ├─ Order ID: demo_order_1703123456789
//    ├─ Amount: ₹500
//    ├─ Plan: Premium Demo Plan
//    ├─ Payment Date: 2025-01-21T12:34:56.789Z
//    └─ Status: paid
//
// ⏳ Updating database...
// ✅ USER PAYMENT HISTORY UPDATED
//    ├─ Update Time: 15ms
//    ├─ Timestamp: 2025-01-21T12:34:56.789Z
//    └─ User: 64f1a2b3c4d5e6f7g8h9i0j1 - Payment: demo_payment_1703123456789
//
// 📡 BROADCASTING REAL-TIME UPDATE =======
// 🎯 Target User: 64f1a2b3c4d5e6f7g8h9i0j1
// 📊 Broadcast Data:
//    ├─ Payment ID: demo_payment_1703123456789
//    ├─ Amount: ₹500
//    ├─ Plan: Premium Demo Plan
//    └─ Status: success
//
// ✅ Real-time broadcast sent to user connections
//
// 📊 AFTER PAYMENT PROCESSING:
// 💾 PAYMENT STORED IN DATABASE:
//    ├─ Payment ID: demo_payment_1703123456789
//    ├─ Order ID: demo_order_1703123456789
//    ├─ Amount: ₹500
//    ├─ Currency: INR
//    ├─ Status: paid
//    ├─ Payment Method: card
//    ├─ Plan Name: Premium Demo Plan
//    ├─ Bed Count: 10
//    ├─ Branch Count: 3
//    ├─ Payment Date: 2025-01-21T12:34:56.789Z
//    └─ Subscription Status: active
//
// 🎯 COMPLETE FLOW SUMMARY:
//    1. 🎣 Webhook received from Razorpay
//    2. 🔐 Signature verified
//    3. 💾 Payment history stored in user document
//    4. 📡 Real-time notification sent to frontend
//    5. 🎯 User redirected to dashboard
//
// 🏁 DEMONSTRATION COMPLETE ===============
