import api from '../utils/api';
import { PasswordSecurityGuard } from '../utils/passwordSecurity';
import { validateRegistrationData } from '../utils/registrationValidation';

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
 * @param sendPassword Whether to send the password via email (default: true)
 * @returns The created user object with ID
 */
export const createClientUserAccount = async (userData: ClientUserRegistration, sendPassword: boolean = true): Promise<{ _id: string }> => {
  let validationResult: any = null;
  
  try {
    console.log('🚀 Creating client account with data:', { ...userData, password: '[REDACTED]' });
    console.log('📧 Send password via email:', sendPassword);
    
    // Enhanced validation using the new validation system
    validationResult = validateRegistrationData({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    });
    
    if (!validationResult.isValid) {
      console.error('❌ Registration validation failed:', validationResult.errors);
      throw new Error(`Registration validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ Registration validation warnings:', validationResult.warnings);
    }
    
    // Use the cleaned data for the request
    const requestData = {
      ...userData,
      email: validationResult.cleanData.email,
      password: validationResult.cleanData.password,
      firstName: validationResult.cleanData.firstName,
      lastName: validationResult.cleanData.lastName,
      sendPassword: sendPassword
    };
    
    console.log('🔐 Sending registration request to backend with clean data...');
    const response = await api.post('/api/v1/auth/register/user', requestData);
    
    console.log('✅ Client account creation response:', response.data);
    
    // Record successful registration
    const securityGuard = PasswordSecurityGuard.getInstance();
    securityGuard.recordRegistrationAttempt(validationResult.cleanData.email, true);
    
    // Extract client user ID from response - check multiple possible response structures
    const clientUserId = response.data?.data?._id || response.data?._id || response.data?.id;
    
    if (!clientUserId) {
      console.warn('❌ Client account created but could not extract user ID from response:', response.data);
      throw new Error('Could not extract user ID from response');
    }
    
    console.log('✅ Successfully extracted client user ID:', clientUserId);
    
    if (sendPassword) {
      try {
        // Try to send welcome email, but don't fail if endpoint doesn't exist
        await api.post('/api/v1/auth/welcome-email', {
          email: validationResult.cleanData.email,
          password: validationResult.cleanData.password,
          name: `${validationResult.cleanData.firstName} ${validationResult.cleanData.lastName}`
        }).catch(emailError => {
          // Log but don't throw - this allows the account creation to succeed even if email fails
          console.warn('📧 Welcome email could not be sent:', emailError.message);
        });
      } catch (emailError) {
        console.warn('📧 Welcome email sending failed:', emailError);
      }
      console.log('📧 Attempted to send password email to:', validationResult.cleanData.email);
    }
    
    return { _id: clientUserId };
  } catch (error: any) {
    console.error('❌ Error creating client account:', error);
    
    // Record failed registration
    const securityGuard = PasswordSecurityGuard.getInstance();
    securityGuard.recordRegistrationAttempt(validationResult?.cleanData?.email || userData.email, false);
    
    // Extract detailed error information for better debugging and user feedback
    const errorData = error.response?.data;
    const errorMessage = errorData?.error?.message || 
                        errorData?.message || 
                        errorData?.error || 
                        'Failed to create client account';
    
    console.error('❌ Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: errorData,
      message: errorMessage
    });
    
    // If the user already exists, this is not necessarily a fatal error
    // Return null or handle gracefully for existing users
    if (errorMessage.toLowerCase().includes('user already exists') || 
        errorMessage.toLowerCase().includes('already exists')) {
      console.log('🔄 User already exists, continuing with workflow...');
      
      // Try to fetch the existing user ID if possible
      try {
        // We could potentially make a call to get user by email here
        // For now, return a special indicator that user exists
        return { _id: 'existing_user' };
      } catch (fetchError) {
        console.warn('Could not fetch existing user ID, continuing without user ID');
        return { _id: 'existing_user' };
      }
    }
    
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
