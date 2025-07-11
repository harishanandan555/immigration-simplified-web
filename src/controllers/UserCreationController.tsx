import api from '../utils/api';

export interface ClientUserRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  userType?: string;
  companyId?: string;
  attorneyId?: string;
}

/**
 * Create a new user account for a client
 * @param userData The user registration data
 * @returns The created user object with ID
 */
export const createClientUserAccount = async (userData: ClientUserRegistration): Promise<{ _id: string }> => {
  try {
    const response = await api.post('/api/v1/auth/register/user', userData);
    
    // Extract client user ID from response - check multiple possible response structures
    const clientUserId = response.data?.data?._id || response.data?._id || response.data?.id;
    
    if (!clientUserId) {
      console.warn('Client account created but could not extract user ID from response:', response.data);
      throw new Error('Could not extract user ID from response');
    }
    
    return { _id: clientUserId };
  } catch (error: any) {
    console.error('Error creating client account:', error);
    
    // Extract detailed error information for better debugging and user feedback
    const errorData = error.response?.data;
    const errorMessage = errorData?.error?.message || 
                        errorData?.message || 
                        errorData?.error || 
                        'Failed to create client account';
    
    throw new Error(errorMessage);
  }
};

/**
 * Generate a secure password for client accounts
 * @returns A randomly generated secure password
 */
export const generateSecurePassword = (): string => {
  // Characters to include in the password
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specials = '!@#$%^&*()-_=+';
  
  // Combine all character sets
  const allChars = lowercase + uppercase + numbers + specials;
  
  // Generate a random password of length 10
  let password = '';
  
  // Ensure at least one character from each set for security requirements
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specials[Math.floor(Math.random() * specials.length)];
  
  // Add remaining random characters
  for (let i = 0; i < 6; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable pattern
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};
