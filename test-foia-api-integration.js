// FOIA API Integration Test Suite
// This file tests the FOIA API endpoints and response handling

const API_BASE_URL = 'http://localhost:5005/api/v1/foia-cases';
const TEST_TOKEN = 'your-test-jwt-token-here';

// Test data for creating a FOIA case
const testFoiaCaseData = {
  subject: {
    firstName: "John",
    lastName: "Doe",
    middleName: "James",
    entryFirstName: "John",
    entryLastName: "Doe",
    entryMiddleName: "James",
    dateOfBirth: "1980-01-01",
    birthCountry: "US",
    mailingCountry: "US",
    mailingState: "NY",
    mailingAddress1: "500 Broadway Ave",
    mailingAddress2: "Apt. 1",
    mailingCity: "New York",
    mailingZipCode: "10001",
    daytimePhone: "+15558889999",
    mobilePhone: "+15558889999",
    emailAddress: "john.doe@example.com"
  },
  family: [
    {
      firstName: "Jane",
      lastName: "Doe",
      middleName: "Alice",
      relation: "M",
      maidenName: "Smith"
    },
    {
      firstName: "Robert",
      lastName: "Doe",
      middleName: "Michael",
      relation: "F"
    }
  ],
  requester: {
    firstName: "Jane",
    lastName: "Attorney",
    middleName: "Legal",
    mailingCountry: "US",
    mailingState: "NY",
    mailingAddress1: "100 Legal St",
    mailingAddress2: "Suite 200",
    mailingCity: "New York",
    mailingZipCode: "10001",
    emailAddress: "jane.attorney@lawfirm.com",
    organization: "Immigration Law Offices"
  },
  recordsRequested: [
    {
      requestedDocumentType: "I130"
    },
    {
      requestedDocumentType: "I485"
    }
  ]
};

// Test headers
const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test 1: Create FOIA Case
async function testCreateFoiaCase() {
  console.log('🧪 Testing: Create FOIA Case');
  
  try {
    const response = await fetch(`${API_BASE_URL}/case`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testFoiaCaseData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Create FOIA Case: SUCCESS');
      console.log('   Request Number:', result.data.requestNumber);
      console.log('   Case ID:', result.data.caseId);
      console.log('   Status:', result.data.status);
      return result.data.requestNumber;
    } else {
      console.log('❌ Create FOIA Case: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Create FOIA Case: ERROR');
    console.log('   Error:', error.message);
    return null;
  }
}

// Test 2: Get Case Status
async function testGetCaseStatus(requestNumber) {
  console.log('🧪 Testing: Get Case Status');
  
  if (!requestNumber) {
    console.log('   Skipped: No request number available');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/case-status/${requestNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Get Case Status: SUCCESS');
      console.log('   Request Number:', result.data.requestNumber);
      console.log('   Status:', result.data.status?.display || result.data.status);
      console.log('   Estimated Completion:', result.data.estCompletionDate);
      console.log('   Subject Name:', result.data.subjectName);
    } else {
      console.log('❌ Get Case Status: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.message);
    }
  } catch (error) {
    console.log('❌ Get Case Status: ERROR');
    console.log('   Error:', error.message);
  }
}

// Test 3: Get User's FOIA Cases
async function testGetUserFoiaCases() {
  console.log('🧪 Testing: Get User FOIA Cases');
  
  try {
    const response = await fetch(`${API_BASE_URL}/cases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Get User FOIA Cases: SUCCESS');
      console.log('   Total Cases:', result.count);
      console.log('   Cases:', result.data.length);
      if (result.data.length > 0) {
        console.log('   First Case:', {
          id: result.data[0]._id,
          subject: result.data[0].subject,
          status: result.data[0].status
        });
      }
    } else {
      console.log('❌ Get User FOIA Cases: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.message);
    }
  } catch (error) {
    console.log('❌ Get User FOIA Cases: ERROR');
    console.log('   Error:', error.message);
  }
}

// Test 4: Test Error Handling
async function testErrorHandling() {
  console.log('🧪 Testing: Error Handling');
  
  // Test 1: Invalid request number
  try {
    const response = await fetch(`${API_BASE_URL}/case-status/invalid-request`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    const result = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Invalid Request Number: SUCCESS (Expected 400)');
      console.log('   Error Message:', result.message);
    } else {
      console.log('❌ Invalid Request Number: UNEXPECTED RESPONSE');
      console.log('   Status:', response.status);
      console.log('   Response:', result);
    }
  } catch (error) {
    console.log('❌ Invalid Request Number: ERROR');
    console.log('   Error:', error.message);
  }
  
  // Test 2: Missing authentication
  try {
    const response = await fetch(`${API_BASE_URL}/case-status/test-123`, {
      method: 'GET'
      // No Authorization header
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Missing Authentication: SUCCESS (Expected 401)');
      console.log('   Error Message:', result.message);
    } else {
      console.log('❌ Missing Authentication: UNEXPECTED RESPONSE');
      console.log('   Status:', response.status);
      console.log('   Response:', result);
    }
  } catch (error) {
    console.log('❌ Missing Authentication: ERROR');
    console.log('   Error:', error.message);
  }
}

// Test 5: Test USCIS System Error Simulation
async function testUscisSystemError() {
  console.log('🧪 Testing: USCIS System Error Handling');
  
  // This test simulates what happens when USCIS system is down
  // In a real scenario, this would be handled by the backend
  
  console.log('   Note: USCIS system errors are handled by the backend');
  console.log('   Frontend should display appropriate error messages');
  console.log('   and provide retry options for temporary issues');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting FOIA API Integration Tests\n');
  
  // Test 1: Create a case
  const requestNumber = await testCreateFoiaCase();
  console.log('');
  
  // Test 2: Get status of created case
  await testGetCaseStatus(requestNumber);
  console.log('');
  
  // Test 3: Get all user cases
  await testGetUserFoiaCases();
  console.log('');
  
  // Test 4: Test error handling
  await testErrorHandling();
  console.log('');
  
  // Test 5: Test USCIS system error handling
  await testUscisSystemError();
  console.log('');
  
  console.log('🏁 FOIA API Integration Tests Complete');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runAllTests().catch(console.error);
} else {
  // Browser environment
  console.log('🌐 Running in browser environment');
  console.log('   Set TEST_TOKEN and run runAllTests() in console');
  
  // Make function available globally for browser testing
  window.runAllTests = runAllTests;
  window.testCreateFoiaCase = testCreateFoiaCase;
  window.testGetCaseStatus = testGetCaseStatus;
  window.testGetUserFoiaCases = testGetUserFoiaCases;
  window.testErrorHandling = testErrorHandling;
}

// Export functions for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCreateFoiaCase,
    testGetCaseStatus,
    testGetUserFoiaCases,
    testErrorHandling,
    testUscisSystemError,
    runAllTests
  };
}
