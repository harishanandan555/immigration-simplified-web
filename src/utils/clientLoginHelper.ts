/**
 * Client Login Helper - Utility to help users login with the correct client credentials
 */

export interface ClientCredentials {
  email: string;
  password: string;
  userId?: string;
}

// Store client credentials for easy access
const CLIENT_CREDENTIALS_KEY = 'client_credentials_temp';

/**
 * Store client credentials temporarily for easy login
 */
export const storeClientCredentials = (credentials: ClientCredentials) => {
  localStorage.setItem(CLIENT_CREDENTIALS_KEY, JSON.stringify(credentials));
};

/**
 * Get stored client credentials
 */
export const getStoredClientCredentials = (): ClientCredentials | null => {
  try {
    const stored = localStorage.getItem(CLIENT_CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving stored client credentials:', error);
    return null;
  }
};

/**
 * Clear stored client credentials
 */
export const clearStoredClientCredentials = () => {
  localStorage.removeItem(CLIENT_CREDENTIALS_KEY);
};

/**
 * Check if current user matches expected client for assignment
 */
export const validateCurrentUserForAssignment = (
  currentUserId: string,
  currentUserEmail: string | undefined,
  assignmentClientId: string,
  assignmentClientEmail: string
): { isValid: boolean; reason: string; suggestedCredentials?: ClientCredentials } => {
  
  // Check if user ID matches
  if (currentUserId === assignmentClientId) {
    return { isValid: true, reason: 'User ID matches' };
  }
  
  // Check if email matches (if available)
  if (currentUserEmail && currentUserEmail === assignmentClientEmail) {
    return { isValid: true, reason: 'Email matches' };
  }
  
  // Get stored credentials to suggest
  const storedCredentials = getStoredClientCredentials();
  
  let reason = 'User mismatch: ';
  if (currentUserEmail !== assignmentClientEmail) {
    reason += `Expected email ${assignmentClientEmail}, but logged in as ${currentUserEmail || 'unknown'}. `;
  }
  if (currentUserId !== assignmentClientId) {
    reason += `Expected user ID ${assignmentClientId}, but logged in as ${currentUserId}.`;
  }
  
  return {
    isValid: false,
    reason,
    suggestedCredentials: storedCredentials || {
      email: assignmentClientEmail,
      password: 'Check with your attorney for the password'
    }
  };
};

/**
 * Generate helpful error message for authorization failures
 */
export const generateAuthorizationErrorMessage = (
  assignmentId: string,
  assignmentClientEmail: string,
  currentUserId?: string,
  currentUserEmail?: string
): string => {
  const storedCredentials = getStoredClientCredentials();
  
  let message = `❌ AUTHORIZATION ERROR: Not authorized to submit responses for assignment ${assignmentId}\n\n`;
  
  if (currentUserId && currentUserEmail) {
    message += `🔍 Current User: ${currentUserEmail} (ID: ${currentUserId})\n`;
    message += `🎯 Expected Client: ${assignmentClientEmail}\n\n`;
  }
  
  message += `🔐 This questionnaire was assigned to: ${assignmentClientEmail}\n\n`;
  
  message += `💡 To submit this questionnaire, you need to:\n`;
  message += `1. Log out from your current account\n`;
  message += `2. Go to the Client Login page (/client-login)\n`;
  message += `3. Login with the client credentials:\n`;
  message += `   • Email: ${assignmentClientEmail}\n`;
  
  if (storedCredentials && storedCredentials.email === assignmentClientEmail) {
    message += `   • Password: ${storedCredentials.password}\n\n`;
    message += `💾 Found stored credentials! You can copy the password above.\n`;
  } else {
    message += `   • Password: (the password generated during client creation)\n\n`;
    message += `❓ If you don't have the client login credentials, please contact your attorney.\n`;
  }
  
  return message;
};

/**
 * Auto-logout and redirect to client login with pre-filled email
 */
export const redirectToClientLogin = (clientEmail: string, navigate: (path: string) => void, logout: () => void) => {
  // Store the email for pre-filling
  sessionStorage.setItem('prefill_email', clientEmail);
  
  // Logout current user
  logout();
  
  // Redirect to client login
  navigate('/client-login');
  
};
