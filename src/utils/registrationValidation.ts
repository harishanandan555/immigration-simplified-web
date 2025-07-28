/**
 * Enhanced Password Security for Frontend
 * Ensures passwords are handled correctly before sending to backend
 */

import { isLikelyHashed } from './passwordSecurity';

/**
 * Validates and prepares password data for backend registration
 */
export const preparePasswordForRegistration = (password: string): {
  isValid: boolean;
  cleanPassword: string;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if password is empty
  if (!password || password.trim().length === 0) {
    errors.push('Password cannot be empty');
    return { isValid: false, cleanPassword: '', errors, warnings };
  }
  
  // Critical check: ensure password is not already hashed
  if (isLikelyHashed(password)) {
    errors.push('CRITICAL: Password appears to be already hashed! This will cause login failures.');
    errors.push('Passwords must be sent as plain text to the backend for proper hashing.');
    return { isValid: false, cleanPassword: '', errors, warnings };
  }
  
  // Check password strength requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    warnings.push('Password should contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    warnings.push('Password should contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    warnings.push('Password should contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    warnings.push('Password should contain at least one special character');
  }
  
  // Clean the password (trim whitespace)
  const cleanPassword = password.trim();
  
  return {
    isValid: errors.length === 0,
    cleanPassword,
    errors,
    warnings
  };
};

/**
 * Pre-registration validation hook
 */
export const validateRegistrationData = (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanData: typeof userData;
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate email
  if (!userData.email || !userData.email.includes('@')) {
    errors.push('Valid email address is required');
  }
  
  // Validate names
  if (!userData.firstName || userData.firstName.trim().length === 0) {
    errors.push('First name is required');
  }
  
  if (!userData.lastName || userData.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }
  
  // Validate password using the dedicated function
  const passwordValidation = preparePasswordForRegistration(userData.password);
  
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }
  
  warnings.push(...passwordValidation.warnings);
  
  // Clean the data
  const cleanData = {
    email: userData.email.trim().toLowerCase(),
    password: passwordValidation.cleanPassword,
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim()
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanData
  };
};
