import { AuthTokenResponse, ApiResponse } from '../types';

// Mock API base URL (in a real app, this would be the actual USCIS API endpoint)
const API_BASE_URL = 'https://api.uscis.gov/v1';
const TOKEN_URL = `${API_BASE_URL}/oauth2/token`;

// Mock client credentials (in a real app, these would be stored securely)
const CLIENT_ID = 'demo-client-id';
const CLIENT_SECRET = 'demo-client-secret';

// Token storage (in-memory for demo purposes)
let authToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get OAuth2 token using client credentials flow
 */
export const getAuthToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken;
  }
  
  // For demo purposes, we'll simulate the token request
  // In a real app, this would be an actual fetch to the token endpoint
  try {
    console.log('Requesting new auth token...');
    
    // Simulate API call
    // In a real app: 
    // const response = await fetch(TOKEN_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams({
    //     grant_type: 'client_credentials',
    //     client_id: CLIENT_ID,
    //     client_secret: CLIENT_SECRET,
    //   }),
    // });
    
    // Simulate successful response
    const tokenResponse: AuthTokenResponse = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLWNsaWVudCIsImlhdCI6MTY5ODc2NTQzOSwiZXhwIjoxNjk4NzY5MDM5fQ.mock-token-signature',
      token_type: 'Bearer',
      expires_in: 3600
    };
    
    // Store the token and its expiry time
    authToken = tokenResponse.access_token;
    tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000);
    
    console.log('Auth token acquired successfully');
    return authToken;
  } catch (error) {
    console.error('Failed to acquire auth token:', error);
    throw new Error('Authentication failed');
  }
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (
  endpoint: string, 
  method: string = 'GET', 
  data?: any
): Promise<ApiResponse> => {
  try {
    // Get the auth token
    const token = await getAuthToken();
    
    // Prepare headers
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // For demo purposes, we'll log the request
    console.log(`Making ${method} request to ${endpoint}`, data ? data : '');
    
    // In a real app, this would be an actual API call:
    // const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    //   method,
    //   headers,
    //   body: data ? JSON.stringify(data) : undefined,
    // });
    // const responseData = await response.json();
    
    // Simulate API response for demo
    let responseData: ApiResponse;
    
    if (endpoint.includes('/cases') && method === 'GET') {
      // Simulate case status lookup
      const caseNumber = endpoint.split('/').pop();
      responseData = simulateCaseStatusResponse(caseNumber || '');
    } else if (endpoint.includes('/applications') && method === 'POST') {
      // Simulate application submission
      responseData = simulateApplicationSubmission(data);
    } else {
      // Generic success response
      responseData = {
        success: true,
        message: 'Operation completed successfully',
        data: { timestamp: new Date().toISOString() }
      };
    }
    
    // Add a small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return responseData;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: 'API request failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Convert a file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Simulation functions for demo purposes
function simulateCaseStatusResponse(caseNumber: string): ApiResponse {
  // Check if case number exists in our simulated database
  if (caseNumber === 'ABC1234567' || caseNumber === 'XYZ9876543') {
    return {
      success: true,
      message: 'Case status retrieved successfully',
      data: {
        caseNumber,
        status: caseNumber === 'ABC1234567' ? 'In Process' : 'Approved',
        lastUpdated: new Date().toISOString(),
        history: [
          {
            date: '2023-10-15T14:32:00Z',
            status: 'Received',
            description: 'We received your Form I-765, Application for Employment Authorization, and sent you a receipt notice.'
          },
          {
            date: '2023-10-30T09:15:00Z',
            status: 'Biometrics Scheduled',
            description: 'We scheduled you for a biometrics appointment.'
          },
          {
            date: '2023-11-10T11:20:00Z',
            status: caseNumber === 'ABC1234567' ? 'In Process' : 'Approved',
            description: caseNumber === 'ABC1234567' 
              ? 'Your case is being actively reviewed. We will notify you of any updates.' 
              : 'We approved your Form I-765, Application for Employment Authorization.'
          }
        ]
      }
    };
  } else {
    return {
      success: false,
      message: 'Case not found',
      error: 'The case number you provided was not found in our system.'
    };
  }
}

function simulateApplicationSubmission(data: any): ApiResponse {
  // Validate the submission data
  if (!data || !data.applicantInfo || !data.caseType) {
    return {
      success: false,
      message: 'Application submission failed',
      error: 'Missing required application data'
    };
  }
  
  // Generate a random case number
  const caseNumber = 'USC' + Math.floor(10000000 + Math.random() * 90000000);
  
  return {
    success: true,
    message: 'Application submitted successfully',
    data: {
      caseNumber,
      submissionDate: new Date().toISOString(),
      estimatedProcessingTime: '90-120 days'
    }
  };
}