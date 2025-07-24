import React, { useState, useEffect } from 'react';
import { usePasswordSecurity, PasswordStrength } from '../../utils/passwordSecurity';

interface SecurePasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[], warnings: string[]) => void;
  placeholder?: string;
  required?: boolean;
  showStrengthIndicator?: boolean;
  showGenerateButton?: boolean;
  className?: string;
}

const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter password",
  required = false,
  showStrengthIndicator = true,
  showGenerateButton = true,
  className = ""
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    strength: PasswordStrength;
  } | null>(null);

  const { 
    validatePassword, 
    generateSecurePassword
  } = usePasswordSecurity();

  useEffect(() => {
    if (value) {
      const result = validatePassword(value);
      setValidationResult({
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.strength === PasswordStrength.WEAK ? ['Password is weak'] : [],
        strength: result.strength
      });
      
      if (onValidationChange) {
        onValidationChange(
          result.isValid, 
          result.errors, 
          result.strength === PasswordStrength.WEAK ? ['Password is weak'] : []
        );
      }
    } else {
      setValidationResult(null);
      if (onValidationChange) {
        onValidationChange(false, required ? ['Password is required'] : [], []);
      }
    }
  }, [value, validatePassword, onValidationChange, required]);

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(12, true);
    onChange(newPassword);
  };

  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK: return 'bg-red-500';
      case PasswordStrength.MEDIUM: return 'bg-yellow-500';
      case PasswordStrength.STRONG: return 'bg-blue-500';
      case PasswordStrength.VERY_STRONG: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthWidth = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK: return 'w-1/4';
      case PasswordStrength.MEDIUM: return 'w-2/4';
      case PasswordStrength.STRONG: return 'w-3/4';
      case PasswordStrength.VERY_STRONG: return 'w-full';
      default: return 'w-0';
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20 ${className}`}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {showGenerateButton && (
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              title="Generate secure password"
            >
              Gen
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-500 hover:text-gray-700"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Password Strength Indicator */}
      {showStrengthIndicator && value && validationResult && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Password Strength:</span>
            <span className={`font-medium capitalize ${
              validationResult.strength === PasswordStrength.WEAK ? 'text-red-600' :
              validationResult.strength === PasswordStrength.MEDIUM ? 'text-yellow-600' :
              validationResult.strength === PasswordStrength.STRONG ? 'text-blue-600' :
              'text-green-600'
            }`}>
              {validationResult.strength.replace('_', ' ')}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validationResult.strength)} ${getStrengthWidth(validationResult.strength)}`}
            />
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationResult && validationResult.errors.length > 0 && (
        <div className="space-y-1">
          {validationResult.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Validation Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <div className="space-y-1">
          {validationResult.warnings.map((warning, index) => (
            <p key={index} className="text-sm text-yellow-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Password Requirements Help */}
      {!validationResult?.isValid && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Password must contain:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>At least 8 characters</li>
            <li>One uppercase letter (A-Z)</li>
            <li>One lowercase letter (a-z)</li>
            <li>One number (0-9)</li>
            <li>One special character (!@#$%^&*)</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SecurePasswordInput;
