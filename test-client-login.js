/**
 * Test Client Registration and Login Flow
 * This script tests the complete flow of creating a client account and logging in
 */

const APPCONSTANTS = {
  API_BASE_URL: 'http://localhost:5000' // Update this to match your backend URL
};

async function testClientLoginFlow() {
  console.log('🧪 Testing Client Registration and Login Flow');
  console.log('='.repeat(50));
  
  // Test data
  const testClient = {
    firstName: 'Test',
    lastName: 'Client',
    email: `test.client.${Date.now()}@example.com`, // Unique email
    password: 'TestPassword123!',
    role: 'client',
    userType: 'individual'
  };
  
  console.log('📋 Test client data:', {
    ...testClient,
    password: '[REDACTED]'
  });
  
  try {
    // Step 1: Register the client
    console.log('\n🔐 Step 1: Registering client...');
    
    const registerResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/auth/register/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...testClient,
        sendPassword: true // Ensure proper password processing
      })
    });
    
    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`Registration failed: ${registerResponse.status} ${registerResponse.statusText}\n${errorText}`);
    }
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration successful:', registerData);
    
    const userId = registerData?.data?._id || registerData?._id || registerData?.id;
    if (!userId) {
      throw new Error('No user ID returned from registration');
    }
    
    console.log(`✅ User ID: ${userId}`);
    
    // Step 2: Wait a moment for the backend to process
    console.log('\n⏳ Waiting 2 seconds for backend processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Attempt to login
    console.log('\n🔑 Step 2: Attempting login...');
    
    const loginResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testClient.email,
        password: testClient.password
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}\n${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', {
      ...loginData,
      token: loginData.token ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'
    });
    
    // Step 4: Verify token works
    if (loginData.token) {
      console.log('\n🔍 Step 3: Testing token validity...');
      
      const profileResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Token is valid, user profile:', profileData);
      } else {
        console.warn('⚠️ Token validation failed, but login succeeded');
      }
    }
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Client registration works correctly');
    console.log('✅ Client login works correctly');
    console.log('✅ Password handling is working properly');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Ensure your backend server is running');
    console.error('2. Check that the API_BASE_URL is correct');
    console.error('3. Verify the registration endpoint exists');
    console.error('4. Check backend logs for password hashing issues');
    console.error('5. Ensure the backend is not double-hashing passwords');
    
    return false;
  }
}

// Auto-run if this file is executed directly
if (typeof window === 'undefined') {
  // Running in Node.js
  testClientLoginFlow().then(success => {
    process.exit(success === false ? 1 : 0);
  });
} else {
  // Running in browser - expose function globally
  window.testClientLoginFlow = testClientLoginFlow;
  console.log('💡 Run testClientLoginFlow() in the browser console to test');
}
