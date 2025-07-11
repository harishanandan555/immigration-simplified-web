// Debug script to test the questionnaire API connection and functionality
console.log('=== Debugging Questionnaire API ===');

// 1. Check the API base URL
const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || 
                  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
                    ? "http://localhost:5005"
                    : "https://immigration-simplified-api.onrender.com";
console.log('API Base URL:', apiBaseUrl);

// 2. Check if auth token is available
const checkAuthToken = () => {
  const token = localStorage.getItem('auth_token') || 
                sessionStorage.getItem('auth_token') ||
                localStorage.getItem('access_token') ||
                sessionStorage.getItem('access_token');
  
  if (token) {
    console.log('Auth token found:', token.substring(0, 10) + '...');
    return token;
  } else {
    console.error('No auth token found. User needs to log in.');
    return null;
  }
};

// 3. Test API connectivity
const testApiConnectivity = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1`);
    console.log('API connectivity test status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API connectivity test response:', data);
      return true;
    } else {
      console.error('API connectivity test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('API connectivity test failed with error:', error);
    return false;
  }
};

// 4. Test authentication
const testAuthentication = async (token) => {
  if (!token) return false;
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Authentication test status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Authenticated user:', data);
      return true;
    } else {
      console.error('Authentication test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Authentication test failed with error:', error);
    return false;
  }
};

// 5. Test questionnaire creation
const testQuestionnaireCreation = async (token) => {
  if (!token) return false;
  
  const testQuestionnaire = {
    title: `Debug Test Questionnaire ${new Date().toISOString()}`,
    description: 'Created for debugging API connectivity',
    category: 'assessment',
    fields: [
      {
        id: `field_${Date.now()}_1`,
        type: 'text',
        label: 'Debug Test Field',
        required: true,
        order: 0
      }
    ],
    settings: {
      show_progress_bar: true,
      allow_back_navigation: true,
      auto_save: true,
      show_results: true,
      theme: 'default'
    },
    is_active: true
  };
  
  try {
    console.log('Attempting to create test questionnaire:', testQuestionnaire);
    
    const response = await fetch(`${apiBaseUrl}/api/v1/questionnaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testQuestionnaire)
    });
    
    console.log('Questionnaire creation test status:', response.status);
    
    // Get full response text for analysis
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response:', responseData);
    } catch (e) {
      console.error('Could not parse response as JSON');
    }
    
    if (response.ok) {
      console.log('Questionnaire created successfully with ID:', responseData?.id);
      return true;
    } else {
      console.error('Questionnaire creation failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Questionnaire creation failed with error:', error);
    return false;
  }
};

// Run the tests
const runTests = async () => {
  const token = checkAuthToken();
  const isApiConnected = await testApiConnectivity();
  
  if (!isApiConnected) {
    console.error('API is not accessible. Check server status and network connectivity.');
    return;
  }
  
  const isAuthenticated = await testAuthentication(token);
  
  if (!isAuthenticated) {
    console.error('Not authenticated. Please log in first.');
    return;
  }
  
  await testQuestionnaireCreation(token);
};

// Execute tests when debug button is clicked
export const runDebugTests = runTests;

// Also run immediately when loaded in development
if (import.meta.env.DEV) {
  runTests();
}
