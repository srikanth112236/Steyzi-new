# 🔧 Razorpay Payment Setup Guide

## 🚨 Current Issue: 500 Internal Server Error

You're getting a `500 Internal Server Error` with message `"Failed to create payment link"` because **Razorpay credentials are not configured**.

## 📋 Required Environment Variables

Create a `.env` file in the `backend/` directory with these variables:

```env
# Razorpay Configuration (REQUIRED for payments)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Other required variables
MONGODB_URI=mongodb+srv://username:password@cluster0.mf6rtcj.mongodb.net/pg_maintenance?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
```

## 🔑 How to Get Razorpay Credentials

### 1. Sign up/Login to Razorpay Dashboard
- Go to [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/)
- Create a new account or login to existing one

### 2. Get API Keys
- Navigate to **Settings → API Keys**
- Copy your **Key ID** and **Key Secret**
- For testing, use the **Test Mode** credentials

### 3. Webhook Secret (Optional for testing)
- Go to **Settings → Webhooks**
- Create a new webhook for your endpoint
- Copy the **Webhook Secret**

## 🧪 Test the Fix

1. **Create `.env` file** in `backend/` directory
2. **Add your Razorpay credentials**
3. **Restart the backend server**
4. **Test the payment link creation**

## 🐛 Debug Script

Run this test script to verify the setup:

```bash
cd Steyzi-new/backend
node test-payment-link.js
```

## 📊 Expected Response After Fix

Once configured correctly, you should get:

```json
{
  "success": true,
  "data": {
    "paymentLinkId": "plink_xyz123",
    "short_url": "https://rzp.io/i/xyz123",
    "amount": 100000,
    "currency": "INR",
    "status": "created"
  }
}
```

## 🎯 Next Steps

1. ✅ Configure Razorpay credentials
2. ✅ Test payment link creation
3. ✅ Implement payment verification
4. ✅ Add webhook handling (optional)

---

**Note:** For production, make sure to use **Live Mode** credentials and properly configure webhooks for automatic payment verification.
