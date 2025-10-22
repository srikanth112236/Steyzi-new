# Dynamic Razorpay Integration Guide

This comprehensive guide covers the enhanced Razorpay integration system implemented in Steyzi, providing dynamic payment processing capabilities for various scenarios.

## 🚀 Overview

The dynamic Razorpay integration provides:
- **Flexible Payment Types**: Support for subscriptions, addons, donations, custom payments, and more
- **Dynamic Configuration**: Runtime payment configuration without code changes
- **Enhanced UX**: Better user experience with configurable themes and retry mechanisms
- **Batch Processing**: Handle multiple payments simultaneously
- **Analytics**: Comprehensive payment analytics and reporting
- **Webhook Security**: Enhanced webhook handling with signature verification

## 📦 Installation & Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Frontend URL for callbacks
FRONTEND_URL=http://localhost:3000
```

### 2. Dependencies

The system uses:
- `razorpay` (backend)
- Existing axios setup for API calls

## 🏗️ Architecture

### Frontend Components

#### 1. Enhanced Razorpay Service (`razorpayPayment.service.js`)

```javascript
import razorpayPaymentService from '../../services/razorpayPayment.service';

// Configure service
razorpayPaymentService.configure({
  key: 'your_razorpay_key',
  theme: { color: '#3B82F6' },
  retryAttempts: 3
});

// Set callbacks
razorpayPaymentService.setCallbacks({
  onSuccess: (response) => console.log('Payment successful', response),
  onError: (error) => console.log('Payment failed', error),
  onDismiss: () => console.log('Payment dismissed')
});
```

#### 2. Payment Configuration System (`paymentConfig.js`)

```javascript
import {
  createSubscriptionPayment,
  createAddonPayment,
  createCustomPayment,
  PAYMENT_TYPES
} from '../../utils/paymentConfig';

// Create subscription payment
const subscriptionConfig = createSubscriptionPayment(planDetails, userDetails, {
  theme: { color: '#10B981' }
});

// Create addon payment
const addonConfig = createAddonPayment(addonDetails, userDetails);

// Create custom payment
const customConfig = createCustomPayment({
  amount: 100000, // ₹1000 in paise
  description: 'Custom service payment',
  type: PAYMENT_TYPES.FEE
}, userDetails);
```

#### 3. Dynamic Payment Modal (`DynamicPaymentModal.jsx`)

```jsx
import DynamicPaymentModal from '../common/DynamicPaymentModal';

const [showPayment, setShowPayment] = useState(false);
const [paymentConfig, setPaymentConfig] = useState(null);

// Trigger payment
const handlePayment = (config) => {
  setPaymentConfig(config);
  setShowPayment(true);
};

// Modal component
<DynamicPaymentModal
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  paymentConfig={paymentConfig}
  onSuccess={(result) => {
    console.log('Payment successful:', result);
    // Handle success
  }}
  onError={(error) => {
    console.log('Payment failed:', error);
    // Handle error
  }}
  title="Complete Your Payment"
  subtitle="Secure payment powered by Razorpay"
/>
```

### Backend Components

#### 1. Enhanced Razorpay Service (`razorpay.service.js`)

```javascript
const razorpayService = require('../services/razorpay.service');

// Create dynamic order
const orderResult = await razorpayService.createOrder({
  userId: req.user._id,
  type: 'subscription',
  amount: 500000, // ₹5000
  subscriptionPlanId: 'plan_id',
  bedCount: 50,
  branchCount: 2,
  billingCycle: 'monthly'
});

// Process addon payment
const addonResult = await razorpayService.processAddonPayment(userId, {
  addonType: 'beds',
  quantity: 10,
  razorpayOrderId: 'order_id',
  razorpayPaymentId: 'payment_id'
});
```

#### 2. New API Endpoints

##### Create Dynamic Order
```http
POST /api/subscription-payments/create-dynamic-order
Content-Type: application/json

{
  "type": "subscription",
  "amount": 500000,
  "description": "Premium Plan",
  "subscriptionPlanId": "plan_id",
  "bedCount": 50,
  "branchCount": 2,
  "billingCycle": "monthly"
}
```

##### Verify Dynamic Payment
```http
POST /api/subscription-payments/verify-dynamic
Content-Type: application/json

{
  "orderId": "order_xyz",
  "paymentId": "pay_abc",
  "signature": "signature_here",
  "type": "subscription",
  "metadata": {}
}
```

##### Create Payment Link
```http
POST /api/subscription-payments/create-dynamic-payment-link
Content-Type: application/json

{
  "type": "subscription",
  "amount": 100000,
  "description": "Monthly subscription",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "9876543210"
  }
}
```

##### Get Payment Analytics
```http
GET /api/subscription-payments/analytics?startDate=2024-01-01&endDate=2024-12-31
```

## 💳 Payment Types

### 1. Subscription Payments
```javascript
const config = createSubscriptionPayment({
  planId: 'premium_plan',
  planName: 'Premium Plan',
  bedCount: 50,
  branchCount: 2,
  billingCycle: 'monthly',
  amount: 500000
}, userDetails);
```

### 2. Addon Payments
```javascript
const config = createAddonPayment({
  addonType: 'beds', // 'beds', 'branches', 'features'
  quantity: 10,
  amount: 100000,
  description: 'Add 10 beds'
}, userDetails);
```

### 3. Custom Payments
```javascript
const config = createCustomPayment({
  amount: 250000,
  description: 'Custom service fee',
  type: PAYMENT_TYPES.FEE
}, userDetails, {
  theme: { color: '#F59E0B' }
});
```

### 4. Donation Payments
```javascript
const config = createCustomPayment({
  amount: 100000,
  description: 'Support our platform',
  type: PAYMENT_TYPES.DONATION
}, userDetails);
```

## 🎨 Customization Options

### Theme Configuration
```javascript
const customTheme = {
  color: '#3B82F6',        // Primary color
  backdropColor: '#ffffff' // Modal background
};
```

### Checkout Options
```javascript
const checkoutOptions = {
  retry: { enabled: true, max_count: 3 },
  timeout: 300,              // seconds
  remember_customer: true,
  confirm_close: true,
  allowedPaymentMethods: ['card', 'netbanking', 'upi']
};
```

### Callbacks
```javascript
const callbacks = {
  onSuccess: (response) => {
    // Payment successful
    console.log('Payment ID:', response.razorpay_payment_id);
  },
  onError: (error) => {
    // Payment failed
    console.error('Payment error:', error);
  },
  onDismiss: () => {
    // Payment modal dismissed
    console.log('Payment cancelled');
  }
};
```

## 🔄 Quick Pay Methods

### Using Presets
```javascript
// Quick subscription payment
await razorpayPaymentService.quickPay('subscription', {
  amount: 100000,
  description: 'Monthly subscription',
  prefill: userDetails
});

// Quick addon payment
await razorpayPaymentService.quickPay('addon', {
  amount: 50000,
  description: 'Add beds',
  addonType: 'beds',
  quantity: 5
});
```

### Batch Payments
```javascript
const batchConfigs = [
  {
    type: PAYMENT_TYPES.CUSTOM,
    amount: 100000,
    description: 'Payment 1'
  },
  {
    type: PAYMENT_TYPES.CUSTOM,
    amount: 200000,
    description: 'Payment 2'
  }
];

const results = await razorpayPaymentService.processBatchPayments(batchConfigs);
console.log('Batch results:', results);
```

## 📊 Analytics & Reporting

### Get Payment Analytics
```javascript
const analytics = await razorpayPaymentService.getPaymentAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  type: 'subscription'
});

console.log('Total payments:', analytics.totalPayments);
console.log('Success rate:', analytics.successfulPayments / analytics.totalPayments);
```

### Payment Analytics Structure
```javascript
{
  totalPayments: 150,
  totalAmount: 7500000,    // in paise
  successfulPayments: 142,
  failedPayments: 8,
  paymentMethods: {
    card: 85,
    upi: 45,
    netbanking: 20
  },
  typeBreakdown: {
    subscription: 120,
    addon: 20,
    donation: 10
  }
}
```

## 🔐 Security Features

### Webhook Verification
```javascript
// Automatic signature verification in webhook handler
app.post('/api/subscription-payments/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  // Signature is automatically verified in the service
});
```

### Payment Validation
```javascript
// Validate payment configuration
const isValid = razorpayPaymentService.validatePaymentConfig(config);
if (!isValid) {
  console.error('Invalid payment configuration');
}
```

## 🧪 Testing Examples

### Complete Payment Flow
```javascript
// 1. Create payment configuration
const paymentConfig = createSubscriptionPayment(planDetails, userDetails);

// 2. Process payment
try {
  const result = await razorpayPaymentService.processDynamicPayment({
    ...paymentConfig,
    callbacks: {
      onSuccess: (response) => {
        toast.success('Payment successful!');
        // Update UI, refresh data, etc.
      },
      onError: (error) => {
        toast.error('Payment failed. Please try again.');
      }
    }
  });
} catch (error) {
  console.error('Payment processing error:', error);
}
```

### Using the Payment Modal
```jsx
const PaymentButton = ({ config }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Pay Now
      </button>

      <DynamicPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        paymentConfig={config}
        onSuccess={(result) => {
          // Handle success
          setShowModal(false);
        }}
        onError={(error) => {
          // Handle error
        }}
      />
    </>
  );
};
```

## 🐛 Error Handling

### Common Error Scenarios
```javascript
try {
  const result = await razorpayPaymentService.processDynamicPayment(config);
} catch (error) {
  switch (error.code) {
    case 'CONFIG_INVALID':
      // Handle configuration errors
      break;
    case 'PAYMENT_FAILED':
      // Handle payment failures
      break;
    case 'NETWORK_ERROR':
      // Handle network issues
      break;
    default:
      // Handle unknown errors
      break;
  }
}
```

### Retry Mechanisms
```javascript
// Automatic retry with exponential backoff
const result = await razorpayPaymentService.retryPayment(orderId, 3);
```

## 📈 Performance Optimization

### Caching
```javascript
// Cache payment configurations
const cachedConfig = useMemo(() => createPaymentConfig(type, customConfig), [type, customConfig]);
```

### Lazy Loading
```javascript
// Lazy load Razorpay SDK
const loadRazorpay = () => import('razorpay');
```

## 🔧 Configuration Presets

### Available Presets
```javascript
const presets = razorpayPaymentService.getPaymentPresets();

console.log('Available presets:', Object.keys(presets));
// ['subscription', 'addon', 'premium', 'donation']
```

### Custom Presets
```javascript
// Add custom preset
razorpayPaymentService.configure({
  customPresets: {
    vip: {
      type: PAYMENT_TYPES.PREMIUM,
      theme: { color: '#8B5CF6' },
      checkoutOptions: {
        timeout: 600,
        allowedPaymentMethods: ['card']
      }
    }
  }
});
```

## 📋 Migration Guide

### From Old Implementation

1. **Update imports**:
```javascript
// Old
import razorpayService from '../../services/razorpayPayment.service';

// New
import razorpayPaymentService from '../../services/razorpayPayment.service';
import { createSubscriptionPayment } from '../../utils/paymentConfig';
```

2. **Update payment calls**:
```javascript
// Old
const result = await razorpayService.processPayment(planId, bedCount, branchCount, billingCycle, userDetails);

// New
const config = createSubscriptionPayment(planDetails, userDetails);
const result = await razorpayPaymentService.processDynamicPayment(config);
```

3. **Update modal usage**:
```javascript
// Old
// Custom modal implementation

// New
<DynamicPaymentModal
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  paymentConfig={paymentConfig}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

## 🎯 Best Practices

1. **Always validate configurations** before processing payments
2. **Implement proper error handling** with user-friendly messages
3. **Use appropriate payment types** for different scenarios
4. **Configure webhooks** for server-side payment verification
5. **Test thoroughly** in sandbox mode before production
6. **Monitor payment analytics** regularly
7. **Implement retry mechanisms** for failed payments
8. **Store payment metadata** for better tracking

## 🆘 Troubleshooting

### Common Issues

1. **Razorpay SDK not loading**
   - Check internet connection
   - Verify script loading in `main.jsx`

2. **Payment modal not appearing**
   - Verify payment configuration
   - Check for JavaScript errors in console

3. **Webhook signature verification failing**
   - Ensure `RAZORPAY_WEBHOOK_SECRET` is correctly set
   - Verify webhook endpoint is publicly accessible

4. **Payment verification failing**
   - Check order ID and payment ID are correct
   - Verify Razorpay credentials

### Debug Mode
```javascript
// Enable debug logging
razorpayPaymentService.configure({
  debug: true,
  logLevel: 'verbose'
});
```

## 📚 Additional Resources

- [Razorpay Documentation](https://docs.razorpay.com/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Payment Gateway Best Practices](https://razorpay.com/best-practices/)

---

## 🎉 Conclusion

The dynamic Razorpay integration provides a robust, flexible, and user-friendly payment system that can handle various payment scenarios with ease. The modular architecture allows for easy customization and extension while maintaining security and reliability.

For questions or issues, please refer to the troubleshooting section or contact the development team.
