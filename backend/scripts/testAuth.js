const axios = require('axios');
const BASE_URL = 'http://localhost:8000/api';

async function testAuth() {
  console.log('🔐 Testing Authentication Endpoints\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test_${Date.now()}@example.com`,
      password: 'password123'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful');
    console.log('Response structure:', {
      success: registerResponse.data.success,
      hasToken: !!registerResponse.data.token,
      hasUser: !!registerResponse.data.user,
      userEmail: registerResponse.data.user?.email
    });

    const token = registerResponse.data.token;
    const userEmail = registerResponse.data.user.email;

    // Test 2: Login with the same user
    console.log('\n2. Testing user login...');
    const loginData = {
      email: userEmail,
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful');
    console.log('Response structure:', {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.token,
      hasUser: !!loginResponse.data.user,
      userEmail: loginResponse.data.user?.email
    });

    // Test 3: Get user profile
    console.log('\n3. Testing get user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Profile retrieval successful');
    console.log('Response structure:', {
      success: profileResponse.data.success,
      hasUser: !!profileResponse.data.user,
      userEmail: profileResponse.data.user?.email
    });

    // Test 4: Test invalid login
    console.log('\n4. Testing invalid login...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: userEmail,
        password: 'wrongpassword'
      });
      console.log('❌ Invalid login should have failed!');
    } catch (error) {
      console.log('✅ Invalid login properly rejected');
      console.log('Error message:', error.response?.data?.error);
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAuth();