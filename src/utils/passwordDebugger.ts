/**
 * Password Debugging Utilities
 * Helps diagnose password-related login issues
 */

import { isLikelyHashed } from './passwordSecurity';

export interface PasswordDebugInfo {
  isPlainText: boolean;
  isLikelyHashed: boolean;
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
  recommendations: string[];
}

/**
 * Analyze a password for debugging purposes
 */
export const analyzePassword = (password: string): PasswordDebugInfo => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Basic checks
  const isPlainText = !isLikelyHashed(password);
  const isHashLike = isLikelyHashed(password);
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Detect potential issues
  if (isHashLike) {
    issues.push('Password appears to be already hashed');
    recommendations.push('Ensure you are sending plain text passwords to the registration endpoint');
    recommendations.push('Check that the frontend is not pre-hashing passwords');
  }
  
  if (length < 8) {
    issues.push('Password is too short');
    recommendations.push('Use at least 8 characters');
  }
  
  if (!hasUppercase && !isHashLike) {
    issues.push('Missing uppercase letters');
    recommendations.push('Add at least one uppercase letter');
  }
  
  if (!hasLowercase && !isHashLike) {
    issues.push('Missing lowercase letters');
    recommendations.push('Add at least one lowercase letter');
  }
  
  if (!hasNumbers && !isHashLike) {
    issues.push('Missing numbers');
    recommendations.push('Add at least one number');
  }
  
  if (!hasSpecialChars && !isHashLike) {
    issues.push('Missing special characters');
    recommendations.push('Add at least one special character (!@#$%^&* etc.)');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (isHashLike) {
    strength = 'strong'; // Assume hashes are strong (but shouldn't be sent as passwords)
  } else {
    const strengthScore = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars, length >= 12].filter(Boolean).length;
    if (strengthScore >= 4) strength = 'strong';
    else if (strengthScore >= 2) strength = 'medium';
  }
  
  return {
    isPlainText,
    isLikelyHashed: isHashLike,
    length,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSpecialChars,
    strength,
    issues,
    recommendations
  };
};

/**
 * Debug a login failure
 */
export const debugLoginFailure = (email: string, password: string, error: any) => {
  console.group('🔍 Password Login Debug Information');
  
  const passwordAnalysis = analyzePassword(password);
  
  console.log('📧 Email:', email);
  console.log('🔐 Password Analysis:', passwordAnalysis);
  console.log('❌ Login Error:', error);
  
  // Specific debugging for password issues
  if (passwordAnalysis.isLikelyHashed) {
    console.error('🚨 CRITICAL: Password appears to be hashed!');
    console.error('   This is the most common cause of login failures.');
    console.error('   The password should be sent as plain text to the backend.');
    console.error('   The backend will handle the hashing.');
  }
  
  if (passwordAnalysis.issues.length > 0) {
    console.warn('⚠️ Password Issues Found:');
    passwordAnalysis.issues.forEach(issue => console.warn(`   - ${issue}`));
  }
  
  if (passwordAnalysis.recommendations.length > 0) {
    console.info('💡 Recommendations:');
    passwordAnalysis.recommendations.forEach(rec => console.info(`   - ${rec}`));
  }
  
  // Check for common error patterns
  if (error?.response?.status === 401) {
    console.error('🚫 401 Unauthorized Error - Possible causes:');
    console.error('   - Incorrect email or password');
    console.error('   - Password was hashed on frontend before sending');
    console.error('   - Backend is double-hashing passwords');
    console.error('   - User account not properly created');
  }
  
  if (error?.response?.status === 404) {
    console.error('🚫 404 Not Found Error - Possible causes:');
    console.error('   - Login endpoint does not exist');
    console.error('   - API server is not running');
    console.error('   - Incorrect API base URL');
  }
  
  if (error?.response?.status === 500) {
    console.error('🚫 500 Server Error - Possible causes:');
    console.error('   - Database connection issues');
    console.error('   - Backend error in password verification');
    console.error('   - Missing password hashing library');
  }
  
  console.groupEnd();
};

/**
 * Test password before registration
 */
export const validatePasswordForRegistration = (password: string): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const analysis = analyzePassword(password);
  
  const criticalIssues = analysis.issues.filter(issue => 
    issue.includes('hashed') || issue.includes('too short')
  );
  
  return {
    isValid: criticalIssues.length === 0,
    issues: analysis.issues,
    recommendations: analysis.recommendations
  };
};

/**
 * Hook for React components
 */
export const usePasswordDebugger = () => {
  return {
    analyzePassword,
    debugLoginFailure,
    validatePasswordForRegistration
  };
};
