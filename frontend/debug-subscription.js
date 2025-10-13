// Debug script for testing real-time subscription checks
// Run this in the browser console when logged in

console.log('🔍 Starting Subscription Debug Test...');

// Check if subscription manager is available
if (window.subscriptionManager) {
  console.log('✅ Subscription Manager found:', window.subscriptionManager);

  // Test basic functionality
  console.log('📊 Testing subscription functions...');

  console.log('Can add bed:', window.subscriptionManager.canPerformAction('addBed'));
  console.log('Can add branch:', window.subscriptionManager.canPerformAction('addBranch'));
  console.log('Remaining resources:', window.subscriptionManager.getRemainingResources());
  console.log('Subscription summary:', window.subscriptionManager.getSubscriptionSummary());

} else {
  console.log('❌ Subscription Manager not found. Make sure you are logged in.');
}

// Check Redux store
if (window.store) {
  const state = window.store.getState();
  console.log('📦 Redux Auth State:', {
    isAuthenticated: state.auth.isAuthenticated,
    hasSubscription: !!state.auth.subscription,
    subscriptionStatus: state.auth.subscription?.status
  });
}

// Check API calls
console.log('🔗 Testing API calls...');
fetch('/api/users/my-subscription', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('📡 Subscription API Response:', data);
})
.catch(error => {
  console.error('❌ API call failed:', error);
});

// Instructions for testing real-time checks
console.log(`
📋 HOW TO TEST REAL-TIME SUBSCRIPTION CHECKS:

1. **Open Debug Console**: Navigate to /subscription-debug in your app
2. **Check Connection**: Look for green "Connected" status in the header
3. **Wait 5 minutes**: Backend automatically checks subscriptions every 5 minutes
4. **Manual Refresh**: Click "Force Refresh" button to trigger immediate check
5. **Monitor Events**: Real-time events appear in the "Test Results & Events" section
6. **Test Permissions**: Click "Test Permissions" to check module access
7. **Check Resources**: Click "Test Resources" to see usage limits

🔄 WHAT HAPPENS DURING CHECKS:
- Backend queries database for current subscription status
- Checks trial expiration, usage limits, subscription expiry
- Sends WebSocket events for warnings/errors
- Frontend updates UI in real-time
- API middleware blocks restricted actions

⚠️  EXPECTED EVENTS:
- "subscriptionChecked" - When backend validates subscription
- "trialExpiringSoon" - When trial expires in 3 days
- "usageLimitWarning" - When usage reaches 90%
- "subscriptionExpired" - When subscription ends

📊 MONITOR THESE AREAS:
- Browser Console: Subscription-related logs
- Debug Page: Real-time event feed
- Network Tab: API calls to /api/users/my-subscription
- WebSocket Connection: ws://localhost:5000/subscription-updates

🎯 QUICK TEST COMMANDS (in console):
// Force a subscription check
window.subscriptionManager?.forceRefresh();

// Check if connected to WebSocket
window.subscriptionManager?.isUserConnected?.(userId);

// Get current subscription data
window.subscriptionManager?.getSubscriptionSummary();

Happy debugging! 🚀
`);
