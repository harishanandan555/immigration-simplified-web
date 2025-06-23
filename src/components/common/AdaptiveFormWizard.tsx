import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-react';
import EnhancedFormField from './EnhancedFormField';
import { validateField, validateConsistency, ValidationUtils } from '../../utils/validation';
import { securityManager } from '../../utils/security';
import { formLibrary, FormUtils } from '../../utils/formLibrary';

interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  required?: boolean;
  helpText?: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'number';
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  tooltip?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  validationRules?: string[];
  sensitive?: boolean;
  maskForDisplay?: boolean;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  defaultValue?: any;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

interface AdaptiveFormWizardProps {
  steps: FormStep[];
  initialData?: Record<string, any>;
  onComplete: (data: Record<string, any>) => void;
  onSave?: (data: Record<string, any>) => void;
  formType?: string;
  caseId?: string;
  className?: string;
  showProgress?: boolean;
  allowBackNavigation?: boolean;
  autoSave?: boolean;
  showSmartGuidance?: boolean;
}

const AdaptiveFormWizard: React.FC<AdaptiveFormWizardProps> = ({
  steps,
  initialData = {},
  onComplete,
  onSave,
  formType = '',
  caseId = '',
  className = '',
  showProgress = true,
  allowBackNavigation = true,
  autoSave = true,
  showSmartGuidance = true
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedData, setSavedData] = useState<Record<string, any>>({});
  const [smartGuidance, setSmartGuidance] = useState<string[]>([]);

  // Get active steps based on conditional logic
  const getActiveSteps = useCallback(() => {
    return steps.filter(step => {
      if (!step.conditional) return true;
      
      const { field, value, operator } = step.conditional;
      const fieldValue = formData[field];
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'contains':
          return fieldValue && fieldValue.includes(value);
        case 'greater_than':
          return fieldValue > value;
        case 'less_than':
          return fieldValue < value;
        default:
          return true;
      }
    });
  }, [steps, formData]);

  // Get active fields for current step
  const getActiveFields = useCallback((step: FormStep) => {
    return step.fields.filter(field => {
      if (!field.conditional) return true;
      
      const { field: conditionalField, value, operator } = field.conditional;
      const fieldValue = formData[conditionalField];
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'not_equals':
          return fieldValue !== value;
        case 'contains':
          return fieldValue && fieldValue.includes(value);
        case 'greater_than':
          return fieldValue > value;
        case 'less_than':
          return fieldValue < value;
        default:
          return true;
      }
    });
  }, [formData]);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    const activeSteps = getActiveSteps();
    const currentStepData = activeSteps[currentStep];
    
    if (!currentStepData) return { isValid: true, errors: {} };

    const stepErrors: Record<string, string> = {};
    const activeFields = getActiveFields(currentStepData);

    activeFields.forEach(field => {
      if (field.required && !formData[field.id]) {
        stepErrors[field.id] = `${field.label} is required`;
        return;
      }

      if (formData[field.id] && field.validationRules) {
        const validationResult = validateField(formData[field.id], field.validationRules);
        if (!validationResult.isValid) {
          stepErrors[field.id] = validationResult.errors[0];
        }
      }
    });

    return { isValid: Object.keys(stepErrors).length === 0, errors: stepErrors };
  }, [currentStep, formData, getActiveSteps, getActiveFields]);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    // Auto-save if enabled
    if (autoSave) {
      const newData = { ...formData, [fieldId]: value };
      setSavedData(newData);
      onSave?.(newData);
    }

    // Update smart guidance
    if (showSmartGuidance) {
      updateSmartGuidance(fieldId, value);
    }
  }, [errors, formData, autoSave, onSave, showSmartGuidance]);

  // Update smart guidance based on field changes
  const updateSmartGuidance = useCallback((fieldId: string, value: any) => {
    const guidance: string[] = [];

    // Form-specific guidance
    if (formType === 'I-130' && fieldId === 'relationship') {
      if (value === 'Spouse') {
        guidance.push('For spouse petitions, you\'ll need to provide marriage certificate and evidence of bona fide marriage');
        guidance.push('Consider filing I-485 concurrently if your spouse is in the U.S.');
      } else if (value === 'Child (under 21)') {
        guidance.push('For child petitions, you\'ll need birth certificate and proof of parent-child relationship');
      }
    }

    if (formType === 'I-485' && fieldId === 'currentStatus') {
      if (value === 'B-1/B-2 Visitor') {
        guidance.push('B-1/B-2 visitors typically cannot adjust status. Consider consular processing.');
      } else if (value === 'F-1 Student') {
        guidance.push('F-1 students may be eligible for adjustment if they have an approved immigrant petition');
      }
    }

    if (formType === 'N-400' && fieldId === 'permanentResidentDate') {
      const yearsAsPR = new Date().getFullYear() - new Date(value).getFullYear();
      if (yearsAsPR < 5) {
        guidance.push('You may be eligible for naturalization after 3 years if married to a U.S. citizen');
      }
    }

    // General guidance
    if (fieldId === 'dateOfBirth') {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 18) {
        guidance.push('Minors may have different requirements. Consider consulting with an attorney.');
      }
    }

    if (fieldId === 'alienNumber' && value) {
      guidance.push('Make sure your A-Number is correct. Errors can cause significant delays.');
    }

    setSmartGuidance(guidance);
  }, [formType]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    const validation = validateCurrentStep();
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const activeSteps = getActiveSteps();
    
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    } else {
      // Final validation and submission
      handleSubmit();
    }
  }, [currentStep, validateCurrentStep, getActiveSteps]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  }, [currentStep]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // Final validation
      const activeSteps = getActiveSteps();
      const allErrors: Record<string, string> = {};
      
      activeSteps.forEach(step => {
        const activeFields = getActiveFields(step);
        activeFields.forEach(field => {
          if (field.required && !formData[field.id]) {
            allErrors[field.id] = `${field.label} is required`;
          }
        });
      });

      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        setIsSubmitting(false);
        return;
      }

      // Consistency check
      const consistencyResult = validateConsistency(formData);
      if (!consistencyResult.isValid) {
        setWarnings(prev => ({
          ...prev,
          consistency: consistencyResult.errors.join(', ')
        }));
      }

      // Security logging
      securityManager.logSecurityEvent(
        'current-user',
        'form_submission',
        formType,
        { caseId, stepCount: activeSteps.length },
        '127.0.0.1',
        navigator.userAgent
      );

      // Call completion handler
      await onComplete(formData);
      
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({ ...prev, submission: 'Failed to submit form. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, getActiveSteps, getActiveFields, formType, caseId, onComplete]);

  // Save form data
  const handleSave = useCallback(() => {
    setSavedData(formData);
    onSave?.(formData);
  }, [formData, onSave]);

  // Load saved data
  const handleLoadSaved = useCallback(() => {
    if (Object.keys(savedData).length > 0) {
      setFormData(savedData);
    }
  }, [savedData]);

  // Get progress percentage
  const getProgressPercentage = () => {
    const activeSteps = getActiveSteps();
    return ((currentStep + 1) / activeSteps.length) * 100;
  };

  const activeSteps = getActiveSteps();
  const currentStepData = activeSteps[currentStep];
  const activeFields = currentStepData ? getActiveFields(currentStepData) : [];

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {activeSteps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(getProgressPercentage())}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Smart Guidance */}
      {showSmartGuidance && smartGuidance.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <HelpCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Smart Guidance</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {smartGuidance.map((guidance, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    {guidance}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Current Step */}
      {currentStepData && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">{currentStepData.description}</p>
            {currentStepData.helpText && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="flex items-start">
                  <Info className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                  <p className="text-sm text-gray-700">{currentStepData.helpText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {activeFields.map(field => (
              <EnhancedFormField
                key={field.id}
                id={field.id}
                label={field.label}
                type={field.type}
                value={formData[field.id] || field.defaultValue || ''}
                onChange={(value) => handleFieldChange(field.id, value)}
                placeholder={field.placeholder}
                helperText={field.helperText}
                error={errors[field.id]}
                required={field.required}
                tooltip={field.tooltip}
                options={field.options}
                validationRules={field.validationRules}
                formType={formType}
                sensitive={field.sensitive}
                maskForDisplay={field.maskForDisplay}
                maxLength={field.maxLength}
                minLength={field.minLength}
                pattern={field.pattern}
              />
            ))}
          </div>

          {/* Warnings */}
          {Object.keys(warnings).length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {Object.entries(warnings).map(([key, warning]) => (
                      <li key={key}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <div className="flex space-x-4">
              {allowBackNavigation && currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
              )}
              
              {autoSave && Object.keys(savedData).length > 0 && (
                <button
                  onClick={handleLoadSaved}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700"
                >
                  Load Saved Data
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              {autoSave && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Save Progress
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : currentStep < activeSteps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation */}
      {showProgress && activeSteps.length > 1 && (
        <div className="mt-8">
          <div className="flex justify-center space-x-2">
            {activeSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                title={step.title}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveFormWizard; 