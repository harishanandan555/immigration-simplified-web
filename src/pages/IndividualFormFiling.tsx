import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, ArrowRight, Download, Info, User, Mail, Phone, MapPin, Calendar, Eye, Edit, Save, ArrowLeft, Plus, Target, Book } from 'lucide-react';
import MultiSelect from '../components/common/MultiSelect';
import FileUpload from '../components/common/FileUpload';

interface Form {
  id: string;
  name: string;
  description: string;
  requirements: string;
  category: string;
  filingFee?: string;
  processingTime?: string;
}

// Immigration Process Types
interface ImmigrationProcess {
  id: string;
  name: string;
  description: string;
  forms: string[];
  documents: string[];
  estimatedTime: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'naturalization';
}

interface CommonInfo {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  maritalStatus: string;
  ssn: string;
  
  // Contact Information
  email: string;
  phone: string;
  alternatePhone: string;
  
  // Address Information
  address: {
    street: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Immigration Information
  alienNumber: string;
  uscisOnlineAccountNumber: string;
  passportNumber: string;
  passportCountry: string;
  passportExpiryDate: string;
  entryDate: string;
  entryPort: string;
  visaCategory: string;
  currentStatus: string;
  
  // Employment Information
  employerName: string;
  employerAddress: string;
  jobTitle: string;
  employmentStartDate: string;
  
  // Additional Information
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    address: string;
  };
  
  // Legal Representation
  hasAttorney: boolean;
  attorneyName: string;
  attorneyAddress: string;
  attorneyPhone: string;
  attorneyEmail: string;
  g28Submitted: boolean;
}

const immigrationProcesses: ImmigrationProcess[] = [
  {
    id: 'family-greencard',
    name: 'Family-based Green Card',
    description: 'Obtain permanent residence through family relationships',
    forms: ['I-130', 'I-485', 'I-864'],
    documents: ['passport', 'birth-certificate', 'marriage-certificate', 'i-94'],
    estimatedTime: '12-24 months',
    category: 'family-based'
  },
  {
    id: 'work-authorization',
    name: 'Work Authorization (EAD)',
    description: 'Apply for employment authorization document',
    forms: ['I-765'],
    documents: ['passport', 'i-94', 'pending-petition'],
    estimatedTime: '3-6 months',
    category: 'employment-based'
  },
  {
    id: 'naturalization',
    name: 'U.S. Citizenship (Naturalization)',
    description: 'Apply for U.S. citizenship through naturalization',
    forms: ['N-400'],
    documents: ['green-card', 'tax-returns', 'travel-records'],
    estimatedTime: '8-12 months',
    category: 'naturalization'
  },
  {
    id: 'travel-document',
    name: 'Travel Document (Advance Parole)',
    description: 'Apply for advance parole to travel while petition is pending',
    forms: ['I-131'],
    documents: ['passport', 'pending-petition', 'travel-itinerary'],
    estimatedTime: '3-6 months',
    category: 'humanitarian'
  }
];

const availableForms: Form[] = [
  {
    id: 'I-130',
    name: 'I-130 Petition for Alien Relative',
    description: 'Petition to establish a relationship between a U.S. citizen/permanent resident and an alien relative',
    requirements: 'Must have qualifying family relationship',
    category: 'Family-Based Immigration',
    filingFee: '$535',
    processingTime: '6-12 months'
  },
  {
    id: 'I-485',
    name: 'I-485 Application to Register Permanent Residence or Adjust Status',
    description: 'Application for adjustment of status to permanent resident',
    requirements: 'Must have approved immigrant petition and be eligible',
    category: 'Adjustment of Status',
    filingFee: '$1,225',
    processingTime: '8-14 months'
  },
  {
    id: 'I-765',
    name: 'I-765 Application for Employment Authorization',
    description: 'Application for employment authorization document (EAD)',
    requirements: 'Must have pending application or eligible status',
    category: 'Employment Authorization',
    filingFee: '$410',
    processingTime: '3-6 months'
  },
  {
    id: 'I-131',
    name: 'I-131 Application for Travel Document',
    description: 'Application for advance parole or refugee travel document',
    requirements: 'Must have pending application or refugee status',
    category: 'Travel Documents',
    filingFee: '$575',
    processingTime: '3-6 months'
  },
  {
    id: 'I-864',
    name: 'I-864 Affidavit of Support Under Section 213A of the INA',
    description: 'Affidavit of support for family-based immigrants',
    requirements: 'Must meet income requirements and be willing to support',
    category: 'Affidavit of Support',
    filingFee: 'No fee',
    processingTime: 'Varies'
  },
  {
    id: 'N-400',
    name: 'N-400 Application for Naturalization',
    description: 'Application for U.S. citizenship',
    requirements: 'Must meet residency and other requirements',
    category: 'Naturalization',
    filingFee: '$640',
    processingTime: '8-12 months'
  }
];

interface FilingData {
  [key: string]: {
    [field: string]: any;
  };
}

const IndividualFormFiling: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'goal-selection' | 'process-selection' | 'questionnaire' | 'preview' | 'submit'>('goal-selection');
  const [selectedProcess, setSelectedProcess] = useState<ImmigrationProcess | null>(null);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [formProgress, setFormProgress] = useState<Record<string, number>>({});
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [commonInfo, setCommonInfo] = useState<CommonInfo>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    gender: '',
    maritalStatus: '',
    ssn: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: {
      street: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    alienNumber: '',
    uscisOnlineAccountNumber: '',
    passportNumber: '',
    passportCountry: '',
    passportExpiryDate: '',
    entryDate: '',
    entryPort: '',
    visaCategory: '',
    currentStatus: '',
    employerName: '',
    employerAddress: '',
    jobTitle: '',
    employmentStartDate: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      address: ''
    },
    hasAttorney: false,
    attorneyName: '',
    attorneyAddress: '',
    attorneyPhone: '',
    attorneyEmail: '',
    g28Submitted: false
  });
  const [filingData, setFilingData] = useState<FilingData>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});

  const handleProcessSelection = (process: ImmigrationProcess) => {
    setSelectedProcess(process);
    setSelectedForms(process.forms);
    setCurrentStep('questionnaire');
  };

  const handleCommonInfoChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCommonInfo(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CommonInfo] as any),
          [child]: value
        }
      }));
    } else {
      setCommonInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Auto-save progress
    localStorage.setItem('individualFormProgress', JSON.stringify({ commonInfo, filingData }));
  };

  const handleFilingDataChange = (formId: string, field: string, value: string) => {
    setFilingData(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: value
      }
    }));
    
    // Auto-save progress
    localStorage.setItem('individualFormProgress', JSON.stringify({ commonInfo, filingData }));
  };

  const validateCompletion = () => {
    const missing = [];
    if (!commonInfo.firstName) missing.push('First Name');
    if (!commonInfo.lastName) missing.push('Last Name');
    if (!commonInfo.dateOfBirth) missing.push('Date of Birth');
    if (!commonInfo.email) missing.push('Email');
    if (!commonInfo.phone) missing.push('Phone');
    
    setMissingInfo(missing);
    return missing.length === 0;
  };

  const handlePreview = () => {
    if (validateCompletion()) {
      setCurrentStep('preview');
    }
  };

  const handleDownloadPDF = () => {
  };

  const handleSubmitToAdvisor = () => {
  };

  const renderGoalSelection = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">What's Your Immigration Goal?</h1>
        <p className="text-lg text-gray-600">Tell us what you're trying to achieve, and we'll guide you through the process</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {immigrationProcesses.map((process) => (
          <div
            key={process.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all"
            onClick={() => setCurrentStep('process-selection')}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{process.name}</h3>
              <p className="text-gray-600 mb-3">{process.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {process.category.replace('-', ' ').toUpperCase()}
                </span>
                <span>Est. {process.estimatedTime}</span>
              </div>
            </div>
            <div className="flex items-center text-blue-600 font-medium">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProcessSelection = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => setCurrentStep('goal-selection')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Goals
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Select Your Immigration Process</h1>
        <p className="text-lg text-gray-600">Choose the specific process that matches your situation</p>
      </div>

      <div className="grid gap-6">
        {immigrationProcesses.map((process) => (
          <div
            key={process.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all"
            onClick={() => handleProcessSelection(process)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{process.name}</h3>
                <p className="text-gray-600 mb-4">{process.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Required Forms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {process.forms.map((form) => (
                        <span key={form} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {form}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Required Documents:</h4>
                    <div className="flex flex-wrap gap-2">
                      {process.documents.slice(0, 3).map((doc) => (
                        <span key={doc} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                          {doc.replace('-', ' ')}
                        </span>
                      ))}
                      {process.documents.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                          +{process.documents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {process.estimatedTime}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuestionnaire = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => setCurrentStep('process-selection')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Process Selection
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fill Your Forms</h1>
            <p className="text-lg text-gray-600">
              Complete the step-by-step questionnaire for: <strong>{selectedProcess?.name}</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Progress Auto-Saved</div>
            <div className="flex items-center">
              <Save className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 text-sm">Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Form Completion</span>
          <span className="text-sm font-medium text-gray-700">75%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              value={commonInfo.firstName}
              onChange={(e) => handleCommonInfoChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              value={commonInfo.lastName}
              onChange={(e) => handleCommonInfoChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              value={commonInfo.dateOfBirth}
              onChange={(e) => handleCommonInfoChange('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={commonInfo.email}
              onChange={(e) => handleCommonInfoChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={commonInfo.phone}
              onChange={(e) => handleCommonInfoChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country of Birth</label>
            <input
              type="text"
              value={commonInfo.placeOfBirth}
              onChange={(e) => handleCommonInfoChange('placeOfBirth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Country where you were born"
            />
          </div>
        </div>

        {/* Document Upload Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {selectedProcess?.documents.map((doc) => (
              <div key={doc} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 capitalize">{doc.replace('-', ' ')}</h4>
                  <span className="text-sm text-gray-500">Required</span>
                </div>
                <FileUpload
                  id={`upload-${doc}`}
                  label={`Upload ${doc.replace('-', ' ')}`}
                  onChange={(file, base64) => {
                    setUploadedFiles(prev => ({
                      ...prev,
                      [doc]: [...(prev[doc] || []), file]
                    }));
                  }}
                  acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep('process-selection')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handlePreview}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            Preview Forms
            <Eye className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => setCurrentStep('questionnaire')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questionnaire
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Preview Your Forms</h1>
        <p className="text-lg text-gray-600">Review your completed forms before submission</p>
      </div>

      {/* Completion Status */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Form Completion Status</h2>
          <div className="flex items-center">
            {missingInfo.length === 0 ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-600 font-medium">Complete</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-600 font-medium">Incomplete</span>
              </>
            )}
          </div>
        </div>

        {missingInfo.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-800 mb-2">Missing Information:</h3>
            <ul className="list-disc list-inside text-yellow-700">
              {missingInfo.map((info) => (
                <li key={info}>{info}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {selectedForms.map((formId) => {
            const form = availableForms.find(f => f.id === formId);
            return (
              <div key={formId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{form?.name}</h3>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Pre-filled and ready for review</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Preview */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Preview</h2>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Preview</h3>
            <p className="text-gray-600 mb-4">Your forms have been auto-filled with the information you provided</p>
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center mx-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('questionnaire')}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Information
        </button>
        <button
          onClick={() => setCurrentStep('submit')}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          disabled={missingInfo.length > 0}
        >
          Continue to Submit
        </button>
      </div>
    </div>
  );

  const renderSubmit = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => setCurrentStep('preview')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Preview
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Submit Your Forms</h1>
        <p className="text-lg text-gray-600">Choose how you'd like to proceed with your completed forms</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Download & File Manually</h2>
          <p className="text-gray-600 mb-6">
            Download your completed forms and file them yourself with USCIS
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Pre-filled PDF forms ready to print
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Filing instructions included
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Forms saved to your dashboard
            </li>
          </ul>
          <button
            onClick={handleDownloadPDF}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Forms
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Send to Legal Advisor</h2>
          <p className="text-gray-600 mb-6">
            Have a legal professional review your forms before filing
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Professional review and validation
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Guidance on filing procedures
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Support throughout the process
            </li>
          </ul>
          <button
            onClick={handleSubmitToAdvisor}
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 flex items-center justify-center"
          >
            <User className="h-5 w-5 mr-2" />
            Send to Advisor
          </button>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
        <ul className="space-y-1 text-blue-800">
          <li>• Your completed forms will be saved to your dashboard</li>
          <li>• You'll receive filing instructions and next steps</li>
          <li>• Track your application status and deadlines</li>
          <li>• Access your forms anytime for future reference</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center ${currentStep === 'goal-selection' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Target className="h-5 w-5 mr-2" />
                <span className="font-medium">Goal Selection</span>
              </div>
              <div className={`flex items-center ${currentStep === 'process-selection' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Book className="h-5 w-5 mr-2" />
                <span className="font-medium">Process Selection</span>
              </div>
              <div className={`flex items-center ${currentStep === 'questionnaire' ? 'text-blue-600' : 'text-gray-400'}`}>
                <FileText className="h-5 w-5 mr-2" />
                <span className="font-medium">Questionnaire</span>
              </div>
              <div className={`flex items-center ${currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Eye className="h-5 w-5 mr-2" />
                <span className="font-medium">Preview</span>
              </div>
              <div className={`flex items-center ${currentStep === 'submit' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Upload className="h-5 w-5 mr-2" />
                <span className="font-medium">Submit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'goal-selection' && renderGoalSelection()}
      {currentStep === 'process-selection' && renderProcessSelection()}
      {currentStep === 'questionnaire' && renderQuestionnaire()}
      {currentStep === 'preview' && renderPreview()}
      {currentStep === 'submit' && renderSubmit()}
    </div>
  );
};

export default IndividualFormFiling; 