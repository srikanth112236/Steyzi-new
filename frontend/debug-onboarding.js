// Debug script for onboarding API
async function testOnboardingAPI() {
  try {
    console.log('🔍 Testing onboarding API...');

    // Get token from localStorage (if in browser)
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.log('❌ No access token found');
      return;
    }

    const response = await fetch('http://localhost:5000/api/onboarding/status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('📡 Onboarding API Response:', {
      status: response.status,
      success: data.success,
      data: data.data
    });

    if (data.success && data.data) {
      console.log('📊 Onboarding Data Details:');
      console.log('- isCompleted:', data.data.isCompleted);
      console.log('- currentStep:', data.data.currentStep);
      console.log('- steps count:', data.data.steps?.length);
      console.log('- steps:', data.data.steps?.map(s => ({
        stepId: s.stepId,
        completed: s.completed,
        hasData: !!s.data,
        dataKeys: s.data ? Object.keys(s.data) : [],
        dataSample: s.data ? JSON.stringify(s.data).substring(0, 100) + '...' : null
      })));

      // Check profile step specifically
      const profileStep = data.data.steps?.find(s => s.stepId === 'profile_completion');
      console.log('🎯 Profile step data:', profileStep);
    }

  } catch (error) {
    console.error('❌ Error testing onboarding API:', error);
  }
}

// Run the test
testOnboardingAPI();
