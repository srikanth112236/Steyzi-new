const axios = require('axios');

async function test() {
  try {
    console.log('🧪 Testing payment link endpoint...');
    const response = await axios.post('https://api.steyzi.com/api/subscription-payments/create-payment-link', {
      subscriptionPlanId: 'test_plan',
      bedCount: 5,
      branchCount: 1,
      billingCycle: 'monthly'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Message:', error.response?.data?.message);
    console.log('❌ Error:', error.response?.data?.error);
  }
}

test();
