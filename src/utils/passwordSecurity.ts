/**
 * Password Security Utilities
 * Provides safeguards against password hashing issues and ensures secure password handling
 */

/**
 * Password validation rules
 */
export interface PasswordValidationRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: string[];
}

/**
 * Default password validation rules
 */
export const DEFAULT_PASSWORD_RULES: PasswordValidationRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: ['password', '123456', 'qwerty', 'admin']
};

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong'
}

/**
 * Validates password strength and compliance with rules
 */
export const validatePassword = (password: string, rules: PasswordValidationRules = DEFAULT_PASSWORD_RULES) => {
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters long`);
  }
  
  // Check uppercase requirement
  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check lowercase requirement
  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check numbers requirement
  if (rules.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check special characters requirement
  if (rules.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check forbidden patterns
  const lowerPassword = password.toLowerCase();
  for (const pattern of rules.forbiddenPatterns) {
    if (lowerPassword.includes(pattern.toLowerCase())) {
      errors.push(`Password cannot contain "${pattern}"`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculates password strength
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  
  // Pattern complexity
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/^(.{1,3})\1+$/.test(password)) score -= 2; // Repeated patterns
  
  if (score <= 2) return PasswordStrength.WEAK;
  if (score <= 4) return PasswordStrength.MEDIUM;
  if (score <= 6) return PasswordStrength.STRONG;
  return PasswordStrength.VERY_STRONG;
};

/**
 * Generates a secure random password
 */
export const generateSecurePassword = (
  length: number = 12,
  includeSymbols: boolean = true
): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let charset = lowercase + uppercase + numbers;
  if (includeSymbols) {
    charset += symbols;
  }
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * CRITICAL: This function should NEVER be used in production!
 * It's only for detecting if a password might be hashed already
 * 
 * WARNING: Do not use this to validate actual hashes, only for detection
 */
export const isLikelyHashed = (password: string): boolean => {
  // Common hash patterns (DO NOT use for validation!)
  const hashPatterns = [
    /^\$2[aby]\$\d{2}\$/, // bcrypt
    /^[a-f0-9]{64}$/, // SHA256
    /^[a-f0-9]{40}$/, // SHA1
    /^[a-f0-9]{32}$/, // MD5
    /^\$argon2/, // Argon2
    /^\$scrypt/, // scrypt
  ];
  
  return hashPatterns.some(pattern => pattern.test(password));
};

/**
 * Secure password handling safeguards
 */
export class PasswordSecurityGuard {
  private static instance: PasswordSecurityGuard;
  private registrationAttempts: Map<string, number> = new Map();
  private readonly maxAttempts = 5;
  private readonly attemptWindow = 15 * 60 * 1000; // 15 minutes
  
  static getInstance(): PasswordSecurityGuard {
    if (!PasswordSecurityGuard.instance) {
      PasswordSecurityGuard.instance = new PasswordSecurityGuard();
    }
    return PasswordSecurityGuard.instance;
  }
  
  /**
   * Validates that we're using the correct registration flow
   */
  validateRegistrationFlow(email: string, password: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if password looks like it might already be hashed
    if (isLikelyHashed(password)) {
      errors.push('CRITICAL: Password appears to be already hashed! This will cause login issues.');
      warnings.push('Ensure passwords are sent as plain text to the registration endpoint');
    }
    
    // Check for empty or invalid password
    if (!password || password.trim().length === 0) {
      errors.push('Password cannot be empty');
    }
    
    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
    
    if (validation.strength === PasswordStrength.WEAK) {
      warnings.push('Password is weak, consider using a stronger password');
    }
    
    // Check rate limiting
    const currentAttempts = this.registrationAttempts.get(email) || 0;
    
    if (currentAttempts >= this.maxAttempts) {
      errors.push('Too many registration attempts. Please try again later.');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Records a registration attempt
   */
  recordRegistrationAttempt(email: string, success: boolean): void {
    if (success) {
      this.registrationAttempts.delete(email);
    } else {
      const current = this.registrationAttempts.get(email) || 0;
      this.registrationAttempts.set(email, current + 1);
      
      // Clean up old attempts
      setTimeout(() => {
        this.registrationAttempts.delete(email);
      }, this.attemptWindow);
    }
  }
  
  /**
   * Validates that we're sending to the correct endpoint
   */
  validateEndpoint(endpoint: string): boolean {
    const allowedEndpoints = [
      '/api/v1/auth/register/user',
      '/api/v1/auth/register',
      '/api/v1/users/register'
    ];
    
    return allowedEndpoints.some(allowed => endpoint.includes(allowed));
  }
}

/**
 * Hook for React components to use password security
 */
export const usePasswordSecurity = () => {
  const guard = PasswordSecurityGuard.getInstance();
  
  return {
    validatePassword,
    calculatePasswordStrength,
    generateSecurePassword,
    validateRegistrationFlow: guard.validateRegistrationFlow.bind(guard),
    recordRegistrationAttempt: guard.recordRegistrationAttempt.bind(guard),
    validateEndpoint: guard.validateEndpoint.bind(guard)
  };
};
