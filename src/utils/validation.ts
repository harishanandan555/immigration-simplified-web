export const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
  return acceptedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Convert file to base64 string
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

// Enhanced validation for immigration forms
export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'date' | 'ssn' | 'alienNumber' | 'passport' | 'zipCode' | 'custom';
  message: string;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  minLength?: number;
  maxLength?: number;
  minDate?: Date;
  maxDate?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  SSN: /^\d{3}-?\d{2}-?\d{4}$/,
  ALIEN_NUMBER: /^A\d{9}$/,
  PASSPORT: /^[A-Z0-9]{6,9}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  USCIS_RECEIPT: /^[A-Z]{3}\d{10}$/,
  EMPLOYMENT_AUTHORIZATION: /^[A-Z]{3}\d{10}$/,
  NATURALIZATION_CERTIFICATE: /^[A-Z]{2}\d{8}$/,
  GREEN_CARD: /^[A-Z]{3}\d{10}$/
};

// Validation rules for common immigration fields
export const IMMIGRATION_VALIDATION_RULES: Record<string, ValidationRule[]> = {
  firstName: [
    { type: 'required', message: 'First name is required' },
    { type: 'custom', message: 'First name must be at least 2 characters', minLength: 2 },
    { type: 'custom', message: 'First name cannot contain numbers or special characters', 
      pattern: /^[A-Za-z\s\-'\.]+$/ }
  ],
  lastName: [
    { type: 'required', message: 'Last name is required' },
    { type: 'custom', message: 'Last name must be at least 2 characters', minLength: 2 },
    { type: 'custom', message: 'Last name cannot contain numbers or special characters', 
      pattern: /^[A-Za-z\s\-'\.]+$/ }
  ],
  email: [
    { type: 'required', message: 'Email address is required' },
    { type: 'email', message: 'Please ebnter a valid email address' }
  ],
  phone: [
    { type: 'required', message: 'Phone number is required' },
    { type: 'phone', message: 'Please enter a valid phone number' }
  ],
  dateOfBirth: [
    { type: 'required', message: 'Date of birth is required' },
    { type: 'date', message: 'Please enter a valid date' },
    { type: 'custom', message: 'Date of birth cannot be in the future', 
      customValidator: (value) => new Date(value) <= new Date() },
    { type: 'custom', message: 'Applicant must be at least 18 years old for most applications', 
      customValidator: (value) => {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age >= 18;
      }}
  ],
  alienNumber: [
    { type: 'custom', message: 'Alien number must be in format A123456789', 
      pattern: VALIDATION_PATTERNS.ALIEN_NUMBER }
  ],
  ssn: [
    { type: 'custom', message: 'SSN must be in format 123-45-6789', 
      pattern: VALIDATION_PATTERNS.SSN }
  ],
  passportNumber: [
    { type: 'custom', message: 'Passport number must be 6-9 alphanumeric characters', 
      pattern: VALIDATION_PATTERNS.PASSPORT }
  ],
  zipCode: [
    { type: 'custom', message: 'ZIP code must be in format 12345 or 12345-6789', 
      pattern: VALIDATION_PATTERNS.ZIP_CODE }
  ],
  uscisReceiptNumber: [
    { type: 'custom', message: 'USCIS receipt number must be in format ABC1234567890', 
      pattern: VALIDATION_PATTERNS.USCIS_RECEIPT }
  ]
};

// Enhanced validation function
export const validateField = (value: any, rules: ValidationRule[]): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  for (const rule of rules) {
    let isValid = true;

    switch (rule.type) {
      case 'required':
        isValid = value !== null && value !== undefined && value.toString().trim() !== '';
        break;
      
      case 'email':
        isValid = VALIDATION_PATTERNS.EMAIL.test(value);
        break;
      
      case 'phone':
        isValid = VALIDATION_PATTERNS.PHONE.test(value.replace(/[\s\-\(\)]/g, ''));
        break;
      
      case 'date':
        isValid = VALIDATION_PATTERNS.DATE.test(value) && !isNaN(Date.parse(value));
        break;
      
      case 'ssn':
        isValid = VALIDATION_PATTERNS.SSN.test(value);
        break;
      
      case 'alienNumber':
        isValid = VALIDATION_PATTERNS.ALIEN_NUMBER.test(value);
        break;
      
      case 'passport':
        isValid = VALIDATION_PATTERNS.PASSPORT.test(value);
        break;
      
      case 'zipCode':
        isValid = VALIDATION_PATTERNS.ZIP_CODE.test(value);
        break;
      
      case 'custom':
        if (rule.pattern) {
          isValid = rule.pattern.test(value);
        } else if (rule.customValidator) {
          isValid = rule.customValidator(value);
        }
        if (rule.minLength && value.length < rule.minLength) {
          isValid = false;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          isValid = false;
        }
        if (rule.minDate && new Date(value) < rule.minDate) {
          isValid = false;
        }
        if (rule.maxDate && new Date(value) > rule.maxDate) {
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      result.isValid = false;
      result.errors.push(rule.message);
    }
  }

  return result;
};

// Consistency checking across forms
export interface ConsistencyCheck {
  field1: string;
  field2: string;
  type: 'exact' | 'format' | 'logic' | 'date' | 'relationship';
  message: string;
  validator: (value1: any, value2: any) => boolean;
}

export const CONSISTENCY_CHECKS: ConsistencyCheck[] = [
  {
    field1: 'dateOfBirth',
    field2: 'entryDate',
    type: 'date',
    message: 'Entry date cannot be before date of birth',
    validator: (dob, entryDate) => new Date(entryDate) >= new Date(dob)
  },
  {
    field1: 'entryDate',
    field2: 'currentDate',
    type: 'date',
    message: 'Entry date cannot be in the future',
    validator: (entryDate, currentDate) => new Date(entryDate) <= new Date(currentDate)
  },
  {
    field1: 'firstName',
    field2: 'lastName',
    type: 'exact',
    message: 'First name and last name cannot be identical',
    validator: (firstName, lastName) => firstName.toLowerCase() !== lastName.toLowerCase()
  },
  {
    field1: 'email',
    field2: 'confirmEmail',
    type: 'exact',
    message: 'Email addresses must match',
    validator: (email, confirmEmail) => email === confirmEmail
  },
  {
    field1: 'passportNumber',
    field2: 'passportCountry',
    type: 'logic',
    message: 'Passport country must be specified when passport number is provided',
    validator: (passportNumber, passportCountry) => !passportNumber || passportCountry
  }
];

// Cross-reference validation
export const validateConsistency = (formData: Record<string, any>): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  for (const check of CONSISTENCY_CHECKS) {
    const value1 = formData[check.field1];
    const value2 = check.field2 === 'currentDate' ? new Date() : formData[check.field2];
    
    if (value1 && value2 && !check.validator(value1, value2)) {
      result.isValid = false;
      result.errors.push(check.message);
    }
  }

  return result;
};

// Smart suggestions based on common errors
export const getSmartSuggestions = (fieldName: string, value: any, formNumber: string): string[] => {
  const suggestions: string[] = [];

  switch (fieldName) {
    case 'alienNumber':
      if (value && !value.startsWith('A')) {
        suggestions.push('Alien numbers typically start with "A" followed by 9 digits');
      }
      if (value && value.length !== 10) {
        suggestions.push('Alien numbers should be exactly 10 characters (A + 9 digits)');
      }
      break;
    
    case 'ssn':
      if (value && !value.includes('-')) {
        suggestions.push('SSN should be formatted as XXX-XX-XXXX');
      }
      if (value && value.replace(/\D/g, '').length !== 9) {
        suggestions.push('SSN should contain exactly 9 digits');
      }
      break;
    
    case 'passportNumber':
      if (value && value.length < 6) {
        suggestions.push('Passport numbers are typically 6-9 characters long');
      }
      break;
    
    case 'dateOfBirth':
      if (value) {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        if (age < 18 && formType === 'naturalization') {
          suggestions.push('Most naturalization applicants must be at least 18 years old');
        }
      }
      break;
    
    case 'email':
      if (value && !value.includes('@')) {
        suggestions.push('Email addresses must contain an @ symbol');
      }
      if (value && !value.includes('.')) {
        suggestions.push('Email addresses must contain a domain (e.g., .com, .org)');
      }
      break;
  }

  return suggestions;
};

// Form-specific validation rules
export const getFormValidationRules = (formNumber: string): Record<string, ValidationRule[]> => {
  const baseRules = IMMIGRATION_VALIDATION_RULES;
  
  switch (formNumber) {
    case 'I-130':
      return {
        ...baseRules,
        petitionerName: [
          { type: 'required', message: 'Petitioner name is required' },
          { type: 'custom', message: 'Petitioner name must be at least 2 characters', minLength: 2 }
        ],
        beneficiaryName: [
          { type: 'required', message: 'Beneficiary name is required' },
          { type: 'custom', message: 'Beneficiary name must be at least 2 characters', minLength: 2 }
        ],
        marriageDate: [
          { type: 'required', message: 'Marriage date is required' },
          { type: 'date', message: 'Please enter a valid marriage date' },
          { type: 'custom', message: 'Marriage date cannot be in the future', 
            customValidator: (value) => new Date(value) <= new Date() }
        ]
      };
    
    case 'I-485':
      return {
        ...baseRules,
        currentStatus: [
          { type: 'required', message: 'Current immigration status is required' }
        ],
        lastEntryDate: [
          { type: 'required', message: 'Last entry date is required' },
          { type: 'date', message: 'Please enter a valid entry date' }
        ],
        lastEntryPort: [
          { type: 'required', message: 'Last entry port is required' }
        ]
      };
    
    case 'N-400':
      return {
        ...baseRules,
        permanentResidentDate: [
          { type: 'required', message: 'Permanent resident date is required' },
          { type: 'date', message: 'Please enter a valid date' },
          { type: 'custom', message: 'Must have been a permanent resident for at least 5 years (or 3 years if married to US citizen)', 
            customValidator: (value) => {
              const yearsAsPR = new Date().getFullYear() - new Date(value).getFullYear();
              return yearsAsPR >= 3; // Conservative check
            }}
        ],
        physicalPresence: [
          { type: 'required', message: 'Physical presence information is required' }
        ]
      };
    
    default:
      return baseRules;
  }
};

// Real-time validation with debouncing
export const createDebouncedValidator = (callback: (value: any) => void, delay: number = 500) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: any) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(value), delay);
  };
};

// Export validation utilities
export const ValidationUtils = {
  validateField,
  validateConsistency,
  getSmartSuggestions,
  getFormValidationRules,
  createDebouncedValidator,
  PATTERNS: VALIDATION_PATTERNS,
  RULES: IMMIGRATION_VALIDATION_RULES
}; 
