import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import { validateField, getSmartSuggestions, ValidationUtils } from '../../utils/validation';
import { securityManager } from '../../utils/security';
import { createDebouncedValidator } from '../../utils/validation';

interface EnhancedFormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio' | 'number' | 'password';
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  tooltip?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  validationRules?: string[];
  formType?: string;
  sensitive?: boolean;
  maskForDisplay?: boolean;
  consistencyCheck?: boolean;
  realTimeValidation?: boolean;
  showSuggestions?: boolean;
  autoComplete?: string;
  step?: number;
  min?: number;
  max?: number;
}

const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  helperText,
  error: externalError,
  required = false,
  disabled = false,
  className = '',
  tooltip,
  options = [],
  rows = 4,
  maxLength,
  minLength,
  pattern,
  validationRules = [],
  formType = '',
  sensitive = false,
  maskForDisplay = false,
  consistencyCheck = true,
  realTimeValidation = true,
  showSuggestions = true,
  autoComplete,
  step,
  min,
  max
}) => {
  const [internalError, setInternalError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Get validation rules for this field
  const getFieldValidationRules = useCallback(() => {
    const baseRules = ValidationUtils.RULES[id] || [];
    const customRules = validationRules.map(rule => ({
      type: 'custom' as const,
      message: rule,
      customValidator: () => true // Placeholder
    }));
    return [...baseRules, ...customRules];
  }, [id, validationRules]);

  // Real-time validation with debouncing
  const debouncedValidation = useCallback(
    createDebouncedValidator((fieldValue: any) => {
      if (!realTimeValidation || !fieldValue) return;

      setIsValidating(true);
      
      // Perform validation
      const rules = getFieldValidationRules();
      const validationResult = validateField(fieldValue, rules);
      
      if (!validationResult.isValid) {
        setInternalError(validationResult.errors[0]);
      } else {
        setInternalError('');
      }

      // Get smart suggestions
      if (showSuggestions) {
        const fieldSuggestions = getSmartSuggestions(id, fieldValue, formType);
        setSuggestions(fieldSuggestions);
      }

      setIsValidating(false);
    }, 500),
    [realTimeValidation, getFieldValidationRules, showSuggestions, formType]
  );

  // Handle value changes
  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);
    
    if (realTimeValidation) {
      debouncedValidation(newValue);
    }
  }, [onChange, realTimeValidation, debouncedValidation]);

  // Handle field blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Final validation on blur
    if (value) {
      const rules = getFieldValidationRules();
      const validationResult = validateField(value, rules);
      
      if (!validationResult.isValid) {
        setInternalError(validationResult.errors[0]);
      } else {
        setInternalError('');
      }
    }
    
    onBlur?.();
  }, [value, getFieldValidationRules, onBlur]);

  // Handle field focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setInternalError(''); // Clear error on focus
  }, []);

  // Security logging
  useEffect(() => {
    if (sensitive && value) {
      securityManager.logSecurityEvent(
        'current-user', // Replace with actual user ID
        'sensitive_field_access',
        id,
        { fieldType: type, masked: maskForDisplay },
        '127.0.0.1', // Replace with actual IP
        navigator.userAgent
      );
    }
  }, [sensitive, value, id, type, maskForDisplay]);

  // Get display value (masked if sensitive)
  const getDisplayValue = () => {
    if (!value) return '';
    
    if (maskForDisplay && sensitive) {
      return securityManager.getServices().dataProtection.maskSensitiveData(
        value.toString(),
        id.includes('ssn') ? 'ssn' : 
        id.includes('alien') ? 'alien_number' : 
        id.includes('passport') ? 'passport' : 
        id.includes('phone') ? 'phone' : 
        id.includes('email') ? 'email' : 'ssn'
      );
    }
    
    return value;
  };

  // Render input based on type
  const renderInput = () => {
    const commonProps = {
      id,
      value: getDisplayValue(),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        handleChange(e.target.value);
      },
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder,
      disabled,
      autoComplete,
      className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500 ${
        (externalError || internalError) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 text-gray-500' : ''} ${className}`,
      required,
      maxLength,
      minLength,
      pattern
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  {...commonProps}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <input
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            step={step}
            min={min}
            max={max}
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  const error = externalError || internalError;
  const showSuggestionsList = suggestions.length > 0 && isFocused && showSuggestions;

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {tooltip && (
          <div className="relative ml-1">
            <Info
              className="w-4 h-4 text-gray-400 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className="absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-800 rounded-md shadow-lg -left-32 top-6">
                {tooltip}
              </div>
            )}
          </div>
        )}
        {sensitive && (
          <div className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
            Sensitive
          </div>
        )}
      </div>

      {renderInput()}

      {/* Validation Status */}
      {isValidating && (
        <div className="flex items-center mt-1">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-xs text-gray-500">Validating...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center mt-1">
          <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {!error && value && !isValidating && (
        <div className="flex items-center mt-1">
          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
          <p className="text-xs text-green-500">Valid</p>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}

      {/* Smart Suggestions */}
      {showSuggestionsList && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs font-medium text-blue-800 mb-1">Suggestions:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Character Count */}
      {maxLength && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {value?.toString().length || 0} / {maxLength} characters
          </span>
          {value && value.toString().length > maxLength * 0.9 && (
            <span className="text-xs text-orange-500">
              Approaching limit
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedFormField; 