import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Shield, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar,
  MapPin,
  Briefcase,
  Heart,
  GraduationCap,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Save,
  Download,
  Upload,
  Clock,
  Star,
  Info
} from 'lucide-react';

interface EnhancedImmigrationWizardProps {
  formType: string;
  caseId?: string;
  initialData?: Record<string, any>;
  onComplete?: (data: Record<string, any>) => void;
  onSave?: (data: Record<string, any>) => void;
  className?: string;
}

interface EligibilityCriteria {
  id: string;
  question: string;
  required: boolean;
  type: 'yes-no' | 'text' | 'select' | 'date';
  options?: string[];
  validation?: (value: any) => boolean;
  errorMessage?: string;
}

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: string;
  tips: string[];
}

interface FormSection {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'file';
  required: boolean;
  validation?: (value: any) => boolean;
  errorMessage?: string;
  options?: string[];
  placeholder?: string;
}

const EnhancedImmigrationWizard: React.FC<EnhancedImmigrationWizardProps> = ({
  formType,
  caseId = '',
  initialData = {},
  onComplete,
  onSave,
  className = ''
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [eligibilityAnswers, setEligibilityAnswers] = useState<Record<string, any>>({});
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File[]>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // I-485 Specific Eligibility Criteria
  const eligibilityCriteria: EligibilityCriteria[] = [
    {
      id: 'lawful_entry',
      question: 'Did you enter the United States lawfully?',
      required: true,
      type: 'yes-no',
      validation: (value) => value === 'yes',
      errorMessage: 'Lawful entry is required for most adjustment of status applications'
    },
    {
      id: 'approved_petition',
      question: 'Do you have an approved immigrant petition (I-130, I-140, etc.)?',
      required: true,
      type: 'yes-no',
      validation: (value) => value === 'yes',
      errorMessage: 'An approved immigrant petition is required for adjustment of status'
    },
    {
      id: 'visa_available',
      question: 'Is a visa number immediately available for your category?',
      required: true,
      type: 'yes-no',
      validation: (value) => value === 'yes',
      errorMessage: 'A visa number must be immediately available'
    },
    {
      id: 'maintained_status',
      question: 'Have you maintained lawful status in the United States?',
      required: false,
      type: 'yes-no'
    },
    {
      id: 'criminal_history',
      question: 'Do you have any criminal convictions or arrests?',
      required: true,
      type: 'yes-no'
    },
    {
      id: 'medical_exam',
      question: 'Have you completed a medical examination by a civil surgeon?',
      required: true,
      type: 'yes-no',
      validation: (value) => value === 'yes',
      errorMessage: 'Medical examination is required for adjustment of status'
    }
  ];

  // I-485 Document Requirements
  const documentRequirements: DocumentRequirement[] = [
    {
      id: 'passport',
      name: 'Valid Passport',
      description: 'Current passport with valid visa or entry stamp',
      required: true,
      category: 'Identity',
      tips: ['Must be current and valid', 'Include all pages', 'Show entry stamp']
    },
    {
      id: 'birth_certificate',
      name: 'Birth Certificate',
      description: 'Official birth certificate with translation if not in English',
      required: true,
      category: 'Identity',
      tips: ['Must be official government document', 'Include certified translation', 'Show both parents\' names']
    },
    {
      id: 'marriage_certificate',
      name: 'Marriage Certificate (if applicable)',
      description: 'Current marriage certificate if married',
      required: false,
      category: 'Family',
      tips: ['Must be official government document', 'Include certified translation', 'Show marriage date and location']
    },
    {
      id: 'i130_approval',
      name: 'I-130 Approval Notice',
      description: 'Approval notice for immigrant petition',
      required: true,
      category: 'Petition',
      tips: ['Must be original or certified copy', 'Show approval date', 'Include receipt number']
    },
    {
      id: 'medical_exam',
      name: 'Medical Examination Results',
      description: 'I-693 Report of Medical Examination',
      required: true,
      category: 'Medical',
      tips: ['Must be completed by civil surgeon', 'Sealed envelope required', 'Valid for 2 years']
    },
    {
      id: 'financial_support',
      name: 'Affidavit of Support',
      description: 'I-864 Affidavit of Support with supporting documents',
      required: true,
      category: 'Financial',
      tips: ['Must meet income requirements', 'Include tax returns', 'Include employment verification']
    },
    {
      id: 'police_certificates',
      name: 'Police Certificates',
      description: 'Police certificates from all countries where you lived for 6+ months',
      required: true,
      category: 'Background',
      tips: ['Must be from each country', 'Include certified translations', 'Valid for 1 year']
    },
    {
      id: 'photos',
      name: 'Passport Photos',
      description: 'Two identical passport-style photographs',
      required: true,
      category: 'Identity',
      tips: ['Taken within 30 days', '2x2 inches', 'White background', 'Neutral expression']
    }
  ];

  // I-485 Form Sections
  const formSections: FormSection[] = [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Basic personal and contact information',
      fields: [
        { id: 'full_name', label: 'Full Name (as shown on passport)', type: 'text', required: true },
        { id: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
        { id: 'place_of_birth', label: 'Place of Birth (City, Country)', type: 'text', required: true },
        { id: 'nationality', label: 'Nationality', type: 'text', required: true },
        { id: 'race', label: 'Race/Ethnicity', type: 'select', required: false, options: ['White', 'Black', 'Asian', 'Hispanic', 'Other'] },
        { id: 'eye_color', label: 'Eye Color', type: 'select', required: true, options: ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Other'] },
        { id: 'hair_color', label: 'Hair Color', type: 'select', required: true, options: ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'Other'] },
        { id: 'height', label: 'Height (feet and inches)', type: 'text', required: true, placeholder: 'e.g., 5\'8"' },
        { id: 'weight', label: 'Weight (pounds)', type: 'text', required: true, placeholder: 'e.g., 150' }
      ]
    },
    {
      id: 'address_info',
      title: 'Address Information',
      description: 'Current and previous addresses',
      fields: [
        { id: 'current_address', label: 'Current Address', type: 'textarea', required: true, placeholder: 'Street, City, State, ZIP Code' },
        { id: 'address_from', label: 'Lived at current address since', type: 'date', required: true },
        { id: 'previous_addresses', label: 'Previous Addresses (last 5 years)', type: 'textarea', required: true, placeholder: 'List all addresses with dates' }
      ]
    },
    {
      id: 'immigration_info',
      title: 'Immigration Information',
      description: 'Immigration history and status',
      fields: [
        { id: 'alien_number', label: 'Alien Number (A-Number)', type: 'text', required: false, placeholder: 'A123456789' },
        { id: 'uscis_number', label: 'USCIS Number', type: 'text', required: false, placeholder: '123456789' },
        { id: 'entry_date', label: 'Date of Last Entry to U.S.', type: 'date', required: true },
        { id: 'entry_place', label: 'Place of Last Entry', type: 'text', required: true, placeholder: 'City, State' },
        { id: 'entry_status', label: 'Status at Last Entry', type: 'select', required: true, options: ['B-1/B-2', 'F-1', 'H-1B', 'L-1', 'Other'] },
        { id: 'current_status', label: 'Current Immigration Status', type: 'select', required: true, options: ['B-1/B-2', 'F-1', 'H-1B', 'L-1', 'Other'] },
        { id: 'i94_number', label: 'I-94 Number', type: 'text', required: false, placeholder: '1234567890123' }
      ]
    },
    {
      id: 'employment_info',
      title: 'Employment Information',
      description: 'Current and previous employment',
      fields: [
        { id: 'current_employer', label: 'Current Employer', type: 'text', required: false },
        { id: 'employer_address', label: 'Employer Address', type: 'textarea', required: false },
        { id: 'job_title', label: 'Job Title', type: 'text', required: false },
        { id: 'employment_start', label: 'Employment Start Date', type: 'date', required: false },
        { id: 'previous_employers', label: 'Previous Employers (last 5 years)', type: 'textarea', required: false, placeholder: 'List employers with dates and addresses' }
      ]
    },
    {
      id: 'family_info',
      title: 'Family Information',
      description: 'Information about family members',
      fields: [
        { id: 'spouse_name', label: 'Spouse Name', type: 'text', required: false },
        { id: 'spouse_birth_date', label: 'Spouse Date of Birth', type: 'date', required: false },
        { id: 'spouse_birth_place', label: 'Spouse Place of Birth', type: 'text', required: false },
        { id: 'spouse_nationality', label: 'Spouse Nationality', type: 'text', required: false },
        { id: 'children', label: 'Children Information', type: 'textarea', required: false, placeholder: 'List all children with names, birth dates, and places of birth' }
      ]
    }
  ];

  const steps = [
    { id: 1, name: 'Eligibility Assessment', icon: CheckCircle },
    { id: 2, name: 'Document Preparation', icon: FileText },
    { id: 3, name: 'Form Completion', icon: User },
    { id: 4, name: 'Review & Validation', icon: Shield },
    { id: 5, name: 'Submission', icon: Upload }
  ];

  // Check eligibility based on answers
  useEffect(() => {
    if (Object.keys(eligibilityAnswers).length > 0) {
      const requiredCriteria = eligibilityCriteria.filter(criteria => criteria.required);
      const allRequiredMet = requiredCriteria.every(criteria => {
        const answer = eligibilityAnswers[criteria.id];
        return criteria.validation ? criteria.validation(answer) : answer === 'yes';
      });
      setIsEligible(allRequiredMet);
    }
  }, [eligibilityAnswers]);

  const handleEligibilityAnswer = (questionId: string, answer: any) => {
    setEligibilityAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFormDataChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleFileUpload = (documentId: string, files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedDocuments(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), ...fileArray]
    }));
  };

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: // Eligibility
        eligibilityCriteria.forEach(criteria => {
          if (criteria.required && !eligibilityAnswers[criteria.id]) {
            errors[criteria.id] = 'This question is required';
          } else if (criteria.validation && eligibilityAnswers[criteria.id]) {
            if (!criteria.validation(eligibilityAnswers[criteria.id])) {
              errors[criteria.id] = criteria.errorMessage || 'Invalid answer';
            }
          }
        });
        break;
      
      case 2: // Form Completion
        formSections.forEach(section => {
          section.fields.forEach(field => {
            if (field.required && !formData[field.id]) {
              errors[field.id] = 'This field is required';
            }
          });
        });
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        formType,
        eligibilityAnswers,
        formData,
        uploadedDocuments: Object.keys(uploadedDocuments)
      });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onComplete) {
        onComplete({
          formType,
          eligibilityAnswers,
          formData,
          uploadedDocuments: Object.keys(uploadedDocuments)
        });
      }
      
      // Navigate to success page or dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Eligibility Assessment</h2>
              <p className="text-gray-600">Let's determine if you're eligible for {formType} Adjustment of Status</p>
            </div>

            <div className="space-y-6">
              {eligibilityCriteria.map((criteria) => (
                <div key={criteria.id} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {criteria.question}
                        {criteria.required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      
                      {criteria.type === 'yes-no' && (
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={criteria.id}
                              value="yes"
                              checked={eligibilityAnswers[criteria.id] === 'yes'}
                              onChange={(e) => handleEligibilityAnswer(criteria.id, e.target.value)}
                              className="mr-2"
                            />
                            Yes
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={criteria.id}
                              value="no"
                              checked={eligibilityAnswers[criteria.id] === 'no'}
                              onChange={(e) => handleEligibilityAnswer(criteria.id, e.target.value)}
                              className="mr-2"
                            />
                            No
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {validationErrors[criteria.id] && (
                    <div className="mt-2 flex items-center text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{validationErrors[criteria.id]}</span>
                    </div>
                  )}
                </div>
              ))}

              {isEligible !== null && (
                <div className={`p-6 rounded-lg border ${
                  isEligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {isEligible ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                    )}
                    <h3 className={`font-medium ${
                      isEligible ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isEligible ? 'You appear to be eligible!' : 'Eligibility concerns detected'}
                    </h3>
                  </div>
                  <p className={`mt-2 text-sm ${
                    isEligible ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {isEligible 
                      ? 'Based on your answers, you appear to meet the basic eligibility requirements for I-485 adjustment of status.'
                      : 'Some of your answers indicate potential eligibility issues. Please consult with an immigration attorney.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Preparation</h2>
              <p className="text-gray-600">Gather all required documents for your {formType} application</p>
            </div>

            <div className="grid gap-6">
              {documentRequirements.map((doc) => (
                <div key={doc.id} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {doc.name}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          doc.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{doc.description}</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Tips:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {doc.tips.map((tip, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => e.target.files && handleFileUpload(doc.id, e.target.files)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>

                      {uploadedDocuments[doc.id] && uploadedDocuments[doc.id].length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Uploaded files:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {uploadedDocuments[doc.id].map((file, index) => (
                              <li key={index} className="flex items-center justify-between">
                                <span>{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Completion</h2>
              <p className="text-gray-600">Complete all required sections of the {formType} form</p>
            </div>

            <div className="space-y-8">
              {formSections.map((section) => (
                <div key={section.id} className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-gray-600 mb-6">{section.description}</p>
                  
                  <div className="grid gap-6">
                    {section.fields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        )}
                        
                        {field.type === 'email' && (
                          <input
                            type="email"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        )}
                        
                        {field.type === 'tel' && (
                          <input
                            type="tel"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        )}
                        
                        {field.type === 'date' && (
                          <input
                            type="date"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        )}
                        
                        {field.type === 'select' && (
                          <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === 'textarea' && (
                          <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFormDataChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              validationErrors[field.id] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        )}
                        
                        {validationErrors[field.id] && (
                          <div className="mt-1 flex items-center text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">{validationErrors[field.id]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Validation</h2>
              <p className="text-gray-600">Review your information and validate all requirements</p>
            </div>

            <div className="space-y-6">
              {/* Eligibility Summary */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Assessment</h3>
                <div className="grid gap-4">
                  {eligibilityCriteria.map((criteria) => (
                    <div key={criteria.id} className="flex items-center justify-between">
                      <span className="text-gray-700">{criteria.question}</span>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          eligibilityAnswers[criteria.id] === 'yes' 
                            ? 'bg-green-100 text-green-800' 
                            : eligibilityAnswers[criteria.id] === 'no'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {eligibilityAnswers[criteria.id] || 'Not answered'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Summary */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Checklist</h3>
                <div className="grid gap-4">
                  {documentRequirements.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-700">{doc.name}</span>
                        {doc.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="flex items-center">
                        {uploadedDocuments[doc.id] && uploadedDocuments[doc.id].length > 0 ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">{uploadedDocuments[doc.id].length} file(s)</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Not uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Data Summary */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Information</h3>
                <div className="grid gap-4">
                  {formSections.map((section) => (
                    <div key={section.id}>
                      <h4 className="font-medium text-gray-800 mb-2">{section.title}</h4>
                      <div className="grid gap-2">
                        {section.fields.map((field) => (
                          <div key={field.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{field.label}:</span>
                            <span className="text-gray-900">
                              {formData[field.id] || 'Not provided'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Submit</h2>
              <p className="text-gray-600">Review your application and submit to USCIS</p>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Complete</h3>
                <p className="text-gray-600">
                  Your {formType} application has been prepared and is ready for submission.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Form Type</span>
                  <span className="font-medium">{formType}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Eligibility Status</span>
                  <span className={`font-medium ${isEligible ? 'text-green-600' : 'text-red-600'}`}>
                    {isEligible ? 'Eligible' : 'Review Required'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Documents Uploaded</span>
                  <span className="font-medium">
                    {Object.keys(uploadedDocuments).length} of {documentRequirements.filter(d => d.required).length} required
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Form Completion</span>
                  <span className="font-medium">
                    {Object.keys(formData).length} fields completed
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Next Steps</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Review all information for accuracy</li>
                  <li>• Print and sign the completed forms</li>
                  <li>• Include all required documents</li>
                  <li>• Mail to the appropriate USCIS address</li>
                  <li>• Keep copies of everything for your records</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Enhanced Immigration Wizard - {formType}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      currentStep >= index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{step.name}</div>
                    <div className="text-xs text-gray-500">Step {step.id}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-16 h-0.5 bg-gray-200 mx-4 relative">
                      <div
                        className={`absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ${
                          currentStep > index ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-2 rounded-md ${
              currentStep === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex space-x-4">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex items-center px-6 py-2 rounded-md ${
                  isLoading
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedImmigrationWizard; 