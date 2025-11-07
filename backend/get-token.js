const axios = require('axios');

async function getToken() {
  try {
    console.log('🔑 Getting JWT token...');

    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testpgonee@gmail.com',
      password: 'Admin@123'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.success) {
      const token = response.data.data.tokens.accessToken;
      console.log('✅ Token obtained:', token.substring(0, 50) + '...');
      return token;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error details:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
    return null;
  }
}

async function testPaymentEndpoint(token) {
  try {
    console.log('💳 Testing payment link endpoint with auth...');

    const response = await axios.post('http://localhost:5000/api/subscription-payments/create-payment-link', {
      subscriptionPlanId: '672f6a9d5c5a9b2d8f8e4a12', // Use a valid plan ID if available
      bedCount: 5,
      branchCount: 1,
      billingCycle: 'monthly'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Payment link created successfully!');
    console.log('📄 Response:', response.data);

  } catch (error) {
    console.log('❌ Payment endpoint error:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Error:', error.response?.data?.error);
  }
}

async function main() {
  const token = await getToken();
  if (token) {
    await testPaymentEndpoint(token);
  }
}

main();
