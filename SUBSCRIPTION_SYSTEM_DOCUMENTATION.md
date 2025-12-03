# Subscription System Documentation

## Overview
This document explains how the subscription system works in the Steyzi application, including free trial activation, post-trial flow, and admin management.

---

## Table of Contents
1. [Free Trial System](#free-trial-system)
2. [How Admin Makes Subscription Free Trial](#how-admin-makes-subscription-free-trial)
3. [Post-Free Trial Flow](#post-free-trial-flow)
4. [Subscription Management](#subscription-management)
5. [Key Components](#key-components)
6. [Current Issues & Improvements Needed](#current-issues--improvements-needed)

---

## Free Trial System

### Trial Plan Details
- **Duration**: 7 days (configured in code, but plan mentions 14 days - **INCONSISTENCY**)
- **Bed Limit**: 30 beds
- **Branch Limit**: 2 branches
- **Price**: ₹0 (Free)
- **Status**: Full access to all modules during trial

### Trial Plan Features
The Free Trial Plan includes access to ALL modules:
- Resident Management (full CRUD)
- Payment Tracking
- Room Allocation
- QR Code Payments
- Support Tickets
- Analytics & Reports
- Bulk Upload
- Email & SMS Notifications
- Multi-Branch Management (up to 2 branches)
- Custom Reports

---

## How Admin Makes Subscription Free Trial

### Method 1: Automatic Activation (During Login)
**Location**: `backend/src/services/auth.service.js`

When an admin user logs in:
1. System checks if user has an active subscription
2. If no active subscription found:
   - Checks if user had a trial before
   - If no previous trial, automatically activates free trial
   - Trial is activated via `SubscriptionManagementService.activateFreeTrial()`

**Code Flow**:
```javascript
// In auth.service.js login method
if (!activeSubscription) {
  // Check if user had trial before
  const previousTrials = await UserSubscription.find({
    userId: user._id,
    billingCycle: 'trial'
  });
  
  // Only activate if no previous trial
  if (previousTrials.length === 0) {
    const trialResult = await SubscriptionManagementService.activateFreeTrial(user._id, user._id);
  }
}
```

### Method 2: Manual Activation by Superadmin
**Location**: `backend/src/controllers/subscriptionManagement.controller.js`

Superadmin can manually activate free trial for any user:
- **Endpoint**: `POST /subscription-management/users/:userId/activate-trial`
- **Required Role**: Superadmin
- **Controller**: `activateFreeTrial()`

**Frontend**: Users can also activate their own trial via the `FreeTrialModal` component.

### Method 3: User Self-Activation
**Location**: `frontend/src/components/common/FreeTrialModal.jsx`

Users can activate their own free trial:
1. Modal appears when user has no active subscription
2. User clicks "Activate My Free Trial"
3. Calls `subscriptionService.activateFreeTrial(userId)`
4. Backend validates eligibility and activates trial

---

## Post-Free Trial Flow

### Trial Expiration Check
**Location**: `backend/src/middleware/advancedSecurity.middleware.js`

Real-time trial expiration check happens on every request:
1. Middleware checks if subscription is trial type
2. Compares `trialEndDate` with current date
3. If expired:
   - Updates subscription status to 'expired'
   - Blocks access with 403 error
   - Returns message: "Your free trial has expired. Please upgrade to continue using the service."

**Code**:
```javascript
if (subscription.billingCycle === 'trial') {
  const trialEndDate = new Date(subscription.trialEndDate);
  if (now > trialEndDate) {
    await SubscriptionManagementService.updateSubscriptionStatus(
      subscription._id,
      'expired',
      'Trial period ended'
    );
    return res.status(403).json({
      success: false,
      message: 'Your free trial has expired. Please upgrade to continue using the service.',
      trialExpired: true,
      upgradeRequired: true
    });
  }
}
```

### After Trial Expires

#### Option 1: Automatic Limited Plan Assignment
**Location**: `backend/src/services/subscriptionManagement.service.js`

When trial expires, system can automatically assign a "Trial Expired Plan":
- **Method**: `handleTrialExpiration()`
- **Plan**: "Trial Expired Plan" (limited access)
- **Status**: System automatically applies this plan
- **Note**: This requires the "Trial Expired Plan" to exist in the database

**Flow**:
1. Trial expiration detected
2. System finds "Trial Expired Plan"
3. Cancels old trial subscription
4. Creates new subscription with limited plan
5. User gets restricted access

#### Option 2: User Must Upgrade
If no "Trial Expired Plan" exists:
- User sees trial expired modal
- Must manually select and pay for a paid plan
- Access is blocked until subscription is activated

### Trial Expiration Handling
**Location**: `backend/src/services/subscriptionManagement.service.js`

**Method**: `checkAndHandleTrialExpirations()`
- Runs periodically (can be scheduled via cron)
- Finds all expired trials
- Automatically handles expiration for each user
- Assigns limited plan or blocks access

---

## Subscription Management

### Superadmin Subscription Management

#### 1. Subscribe User to Plan
**Endpoint**: `POST /subscription-management/users/:userId/subscribe`
**Required Role**: Superadmin

**Request Body**:
```json
{
  "subscriptionPlanId": "plan_id",
  "billingCycle": "monthly" | "annual" | "trial",
  "totalBeds": 30,
  "totalBranches": 2,
  "paymentStatus": "completed" | "pending",
  "notes": "Optional notes"
}
```

**Process**:
1. Validates subscription plan exists
2. Calculates dates based on billing cycle:
   - Trial: 7 days from start
   - Monthly: 1 month from start
   - Annual: 1 year from start
3. Calculates total price (base + bed top-up if needed)
4. Creates `UserSubscription` record
5. Updates user's subscription field
6. Updates plan's subscribed count
7. Awards commission if applicable (for sales staff)

#### 2. Change User Subscription (Upgrade/Downgrade)
**Endpoint**: `PUT /subscription-management/users/:userId/change-subscription`
**Required Role**: Superadmin

**Process**:
1. Finds current active subscription
2. Cancels current subscription
3. Creates new subscription with new plan
4. Links new subscription to previous one
5. Updates plan counts

#### 3. Cancel Subscription
**Endpoint**: `POST /subscription-management/users/:userId/cancel-subscription`
**Required Role**: Superadmin

**Process**:
1. Finds active subscription
2. Sets status to 'cancelled'
3. Sets autoRenew to false
4. Updates user subscription status
5. Decrements plan subscribed count

#### 4. Extend Subscription
**Endpoint**: `POST /subscription-management/:subscriptionId/extend`
**Required Role**: Superadmin

**Process**:
1. Finds subscription by ID
2. Extends endDate by specified days
3. Updates user's subscription endDate

---

## Key Components

### Backend Models

#### 1. Subscription Model (`subscription.model.js`)
- Defines subscription plans
- Contains pricing, bed limits, modules, features
- Supports custom plans for specific PGs

#### 2. UserSubscription Model (`userSubscription.model.js`)
- Tracks user's subscription history
- Stores subscription details (dates, pricing, status)
- Virtual fields: `daysRemaining`, `trialDaysRemaining`, `isExpiringSoon`

### Backend Services

#### 1. SubscriptionManagementService
**Main Methods**:
- `subscribeUser()` - Create/activate subscription
- `activateFreeTrial()` - Activate free trial for user
- `changeUserSubscription()` - Upgrade/downgrade
- `cancelUserSubscription()` - Cancel subscription
- `checkAndHandleTrialExpirations()` - Handle expired trials
- `validateUsageAccess()` - Real-time usage validation

#### 2. AuthService
- Automatically activates free trial during login if eligible

### Frontend Components

#### 1. FreeTrialModal (`FreeTrialModal.jsx`)
- Shows trial activation UI
- Handles trial activation
- Displays trial features and benefits

#### 2. TrialExpiredModal (`TrialExpiredModal.jsx`)
- Shows when trial expires
- Prompts user to upgrade

#### 3. SubscriptionUpgradeModal (`SubscriptionUpgradeModal.jsx`)
- Shows upgrade prompts during trial
- Appears when trial is expiring soon

### Middleware

#### 1. AdvancedSecurityMiddleware (`advancedSecurity.middleware.js`)
- Real-time trial expiration check
- Blocks access if trial expired
- Validates subscription status on every request

#### 2. SubscriptionMiddleware (`subscription.middleware.js`)
- Validates subscription before allowing access
- Checks bed/branch limits

---

## Current Issues & Improvements Needed

### 🔴 Critical Issues

1. **Trial Duration Inconsistency**
   - Code sets trial to **7 days** (line 49 in subscriptionManagement.service.js)
   - Plan description mentions **14 days**
   - UI shows **14-day trial**
   - **Fix**: Standardize to one duration (recommend 14 days)

2. **Trial Expired Plan Missing**
   - Code references "Trial Expired Plan" but it may not exist
   - Users get blocked instead of getting limited access
   - **Fix**: Create default "Trial Expired Plan" or handle gracefully

3. **No Automatic Trial Expiration Job**
   - `checkAndHandleTrialExpirations()` exists but not scheduled
   - Relies on real-time checks only
   - **Fix**: Add cron job to run daily

### ⚠️ Medium Priority Issues

4. **Trial Activation Logic**
   - Multiple places can activate trial (login, manual, self)
   - No centralized eligibility check
   - **Fix**: Create unified eligibility service

5. **Payment Status for Trial**
   - Trial subscriptions marked as 'completed' payment
   - Could be confusing in reports
   - **Fix**: Use 'trial' payment status or separate field

6. **Trial Extension Not Available**
   - No way to extend trial period
   - **Fix**: Add trial extension feature for superadmin

### 💡 Enhancement Opportunities

7. **Trial Reminder Emails**
   - Email service has trial expiration emails but may not be triggered
   - **Fix**: Integrate with expiration check

8. **Trial Analytics**
   - No tracking of trial-to-paid conversion
   - **Fix**: Add conversion tracking

9. **Trial Customization**
   - Trial duration is hardcoded
   - **Fix**: Make configurable per plan or globally

10. **Better Trial Expiration UX**
    - Users get blocked immediately
    - **Fix**: Add grace period or better messaging

---

## Data Flow Diagrams

### Free Trial Activation Flow
```
User Login
    ↓
Check Active Subscription?
    ↓ No
Check Previous Trials?
    ↓ None Found
Activate Free Trial
    ↓
Create UserSubscription (billingCycle: 'trial')
    ↓
Set trialEndDate = startDate + 7 days
    ↓
Update User.subscription field
    ↓
Return Success
```

### Trial Expiration Flow
```
Request Made
    ↓
Middleware Checks Subscription
    ↓
Is billingCycle === 'trial'?
    ↓ Yes
Is trialEndDate < now?
    ↓ Yes
Update Status to 'expired'
    ↓
Block Access (403)
    ↓
Show Trial Expired Modal (Frontend)
    ↓
User Must Upgrade
```

### Post-Trial Upgrade Flow
```
Trial Expired
    ↓
User Selects Paid Plan
    ↓
Payment Processing (Razorpay)
    ↓
Payment Success
    ↓
Create New Subscription (billingCycle: 'monthly'/'annual')
    ↓
Cancel Old Trial Subscription
    ↓
Activate New Subscription
    ↓
Grant Full Access
```

---

## API Endpoints Reference

### Subscription Management (Superadmin Only)
- `POST /subscription-management/users/:userId/subscribe` - Subscribe user
- `PUT /subscription-management/users/:userId/change-subscription` - Change subscription
- `POST /subscription-management/users/:userId/cancel-subscription` - Cancel subscription
- `POST /subscription-management/users/:userId/activate-trial` - Activate free trial
- `GET /subscription-management/subscribers` - Get all subscribers
- `GET /subscription-management/users/:userId/history` - Get subscription history
- `POST /subscription-management/:subscriptionId/extend` - Extend subscription

### User Subscription (Admin/User)
- `POST /users/subscription/select` - Select subscription plan
- `GET /users/subscription/current` - Get current subscription

---

## Configuration

### Trial Configuration
Currently hardcoded in:
- `backend/src/services/subscriptionManagement.service.js` (line 47-50)
  - Trial duration: 7 days
  - Bed limit: 30 (from plan)
  - Branch limit: 2 (from plan)

### Recommended Configuration File
Create `config/subscription.config.js`:
```javascript
module.exports = {
  trial: {
    durationDays: 14, // Standardize to 14 days
    bedLimit: 30,
    branchLimit: 2,
    autoActivate: true,
    allowExtension: false
  },
  expiration: {
    gracePeriodDays: 0,
    autoAssignLimitedPlan: true,
    limitedPlanName: 'Trial Expired Plan'
  }
};
```

---

## Testing Checklist

- [ ] Trial activation on first login
- [ ] Trial not activated if previous trial exists
- [ ] Trial expiration blocks access
- [ ] Trial expiration assigns limited plan (if exists)
- [ ] Superadmin can manually activate trial
- [ ] Superadmin can subscribe user to paid plan
- [ ] Subscription upgrade works correctly
- [ ] Subscription cancellation works
- [ ] Trial countdown displays correctly
- [ ] Trial expiration modal shows at right time

---

## Next Steps for Improvement

1. **Standardize Trial Duration**: Change 7 days to 14 days everywhere
2. **Create Trial Expired Plan**: Add default limited plan for expired trials
3. **Add Cron Job**: Schedule daily trial expiration check
4. **Improve Error Handling**: Better messages for trial expiration
5. **Add Analytics**: Track trial-to-paid conversion
6. **Configuration Management**: Move hardcoded values to config file
7. **Email Integration**: Ensure trial expiration emails are sent
8. **Grace Period**: Consider adding grace period after trial expires

---

## Questions to Clarify

1. Should trial duration be 7 or 14 days?
2. Should expired trial users get limited plan or be completely blocked?
3. Should superadmin be able to extend trial periods?
4. Should there be a grace period after trial expires?
5. Should trial-to-paid conversion be tracked?

---

*Last Updated: Based on codebase analysis*
*Version: 1.0*

