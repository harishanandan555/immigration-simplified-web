import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, ArrowRight, Download, Info, User, Mail, Phone, MapPin, Calendar, Eye, Edit, Save, ArrowLeft, Plus, Target, Book, Loader } from 'lucide-react';

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
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  maritalStatus: string;
  ssn: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: {
    street: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  alienNumber: string;
  uscisOnlineAccountNumber: string;
  passportNumber: string;
  passportCountry: string;
  passportExpiryDate: string;
  entryDate: string;
  entryPort: string;
  visaCategory: string;
  currentStatus: string;
  employerName: string;
  employerAddress: string;
  jobTitle: string;
  employmentStartDate: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    address: string;
  };
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
    description: 'Obtain permanent residence through family relationships (I-130, I-485, I-864)',
    forms: ['I-130', 'I-485', 'I-864'],
    documents: ['passport', 'birth-certificate', 'marriage-certificate', 'i-94'],
    estimatedTime: '12-24 months',
    category: 'family-based'
  },
  {
    id: 'work-authorization',
    name: 'Work Authorization (I-765)',
    description: 'Apply for employment authorization document while your petition is pending',
    forms: ['I-765'],
    documents: ['passport', 'i-94', 'pending-petition'],
    estimatedTime: '3-6 months',
    category: 'employment-based'
  },
  {
    id: 'naturalization',
    name: 'U.S. Citizenship (N-400)',
    description: 'Apply for U.S. citizenship through naturalization process',
    forms: ['N-400'],
    documents: ['green-card', 'tax-returns', 'travel-records'],
    estimatedTime: '8-12 months',
    category: 'naturalization'
  },
  {
    id: 'travel-document',
    name: 'Travel Document (I-131)',
    description: 'Apply for advance parole to travel while your petition is pending',
    forms: ['I-131'],
    documents: ['passport', 'pending-petition', 'travel-itinerary'],
    estimatedTime: '3-6 months',
    category: 'humanitarian'
  }
];

const EnhancedIndividualFormFiling: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'goal-selection' | 'process-selection' | 'questionnaire' | 'preview' | 'submit'>('goal-selection');
  const [selectedProcess, setSelectedProcess] = useState<ImmigrationProcess | null>(null);
  const [formProgress, setFormProgress] = useState<number>(0);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
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
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});


  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      setIsAutoSaving(true);
      localStorage.setItem('individualFormProgress', JSON.stringify({
        currentStep,
        selectedProcess,
        commonInfo,
        uploadedFiles: {} // Don't save files to localStorage
      }));
      setTimeout(() => setIsAutoSaving(false), 1000);
    };

    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [commonInfo, currentStep, selectedProcess]);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem('individualFormProgress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.commonInfo) setCommonInfo(data.commonInfo);
        if (data.selectedProcess) setSelectedProcess(data.selectedProcess);
        if (data.currentStep) setCurrentStep(data.currentStep);
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, []);

  // Calculate form progress
  useEffect(() => {
    const totalFields = 8; // Key required fields
    const filledFields = [
      commonInfo.firstName,
      commonInfo.lastName,
      commonInfo.dateOfBirth,
      commonInfo.email,
      commonInfo.phone,
      commonInfo.placeOfBirth,
      commonInfo.passportNumber,
      commonInfo.currentStatus
    ].filter(field => field && field.trim() !== '').length;

    setFormProgress(Math.round((filledFields / totalFields) * 100));
  }, [commonInfo]);

  const handleProcessSelection = (process: ImmigrationProcess) => {
    setSelectedProcess(process);
    setCurrentStep('process-selection');
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
            onClick={() => {
              handleProcessSelection(process);
            }}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{process.name}</h3>
              <p className="text-gray-600 mb-3">{process.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">
                  {process.category.replace('-', ' ')}
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
      <div className="text-center mb-8">
        <Book className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Select Your Immigration Process</h1>
        <p className="text-lg text-gray-600">Choose the specific process that matches your situation</p>
      </div>

      {selectedProcess ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Selected: {selectedProcess.name}</h2>
          <p className="text-gray-600 mb-4">{selectedProcess.description}</p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Forms Required:</span>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                {selectedProcess.forms.map((form, idx) => (
                  <li key={idx}>{form}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium text-gray-700">Documents Needed:</span>
              <ul className="list-disc list-inside text-gray-600 mt-1">
                {selectedProcess.documents.map((doc, idx) => (
                  <li key={idx} className="capitalize">{doc.replace('-', ' ')}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-medium text-gray-700">Estimated Time:</span>
              <p className="text-gray-600 mt-1">{selectedProcess.estimatedTime}</p>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep('goal-selection')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Goals
            </button>
            <button
              onClick={() => setCurrentStep('questionnaire')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              Continue to Questionnaire
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">No process selected. Please choose one below:</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {immigrationProcesses.map((process) => (
              <div
                key={process.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all"
                onClick={() => {
                  handleProcessSelection(process);
                }}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{process.name}</h3>
                  <p className="text-gray-600 mb-3">{process.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">
                      {process.category.replace('-', ' ')}
                    </span>
                    <span>Est. {process.estimatedTime}</span>
                  </div>
                </div>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Select This Process</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderQuestionnaire = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Information</h1>
        <p className="text-lg text-gray-600">We'll use this information to pre-fill your forms</p>
        
        {/* Progress Bar */}
        <div className="mt-6 bg-gray-200 rounded-full h-2 max-w-md mx-auto">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{formProgress}% Complete</p>
        
        {/* Auto-save indicator */}
        {isAutoSaving && (
          <div className="flex items-center justify-center mt-2 text-green-600">
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-sm">Auto-saving...</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="space-y-8">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Personal Information
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={commonInfo.firstName}
                  onChange={(e) => handleCommonInfoChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                <input
                  type="text"
                  value={commonInfo.middleName}
                  onChange={(e) => handleCommonInfoChange('middleName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={commonInfo.lastName}
                  onChange={(e) => handleCommonInfoChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={commonInfo.dateOfBirth}
                  onChange={(e) => handleCommonInfoChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Place of Birth *</label>
                <input
                  type="text"
                  value={commonInfo.placeOfBirth}
                  onChange={(e) => handleCommonInfoChange('placeOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Country"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={commonInfo.gender}
                  onChange={(e) => handleCommonInfoChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={commonInfo.email}
                  onChange={(e) => handleCommonInfoChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={commonInfo.phone}
                  onChange={(e) => handleCommonInfoChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Address Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={commonInfo.address.street}
                  onChange={(e) => handleCommonInfoChange('address.street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={commonInfo.address.city}
                  onChange={(e) => handleCommonInfoChange('address.city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={commonInfo.address.state}
                  onChange={(e) => handleCommonInfoChange('address.state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Immigration Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Immigration Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status *</label>
                <input
                  type="text"
                  value={commonInfo.currentStatus}
                  onChange={(e) => handleCommonInfoChange('currentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., F-1, H-1B, Tourist"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number *</label>
                <input
                  type="text"
                  value={commonInfo.passportNumber}
                  onChange={(e) => handleCommonInfoChange('passportNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Missing Information Alert */}
        {missingInfo.length > 0 && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Missing Required Information:</span>
            </div>
            <ul className="list-disc list-inside text-yellow-700 mt-2">
              {missingInfo.map((field, idx) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep('process-selection')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <button
            onClick={handlePreview}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
      <div className="text-center mb-8">
        <Eye className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Review Your Information</h1>
        <p className="text-lg text-gray-600">Make sure everything looks correct before generating your forms</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Name:</span> <span className="font-medium">{commonInfo.firstName} {commonInfo.middleName} {commonInfo.lastName}</span></div>
              <div><span className="text-gray-600">Date of Birth:</span> <span className="font-medium">{commonInfo.dateOfBirth}</span></div>
              <div><span className="text-gray-600">Place of Birth:</span> <span className="font-medium">{commonInfo.placeOfBirth}</span></div>
              <div><span className="text-gray-600">Gender:</span> <span className="font-medium">{commonInfo.gender}</span></div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Email:</span> <span className="font-medium">{commonInfo.email}</span></div>
              <div><span className="text-gray-600">Phone:</span> <span className="font-medium">{commonInfo.phone}</span></div>
              <div><span className="text-gray-600">Address:</span> <span className="font-medium">{commonInfo.address.street}, {commonInfo.address.city}, {commonInfo.address.state}</span></div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Immigration Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Current Status:</span> <span className="font-medium">{commonInfo.currentStatus}</span></div>
              <div><span className="text-gray-600">Passport Number:</span> <span className="font-medium">{commonInfo.passportNumber}</span></div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Process</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Process:</span> <span className="font-medium">{selectedProcess?.name}</span></div>
              <div><span className="text-gray-600">Category:</span> <span className="font-medium capitalize">{selectedProcess?.category.replace('-', ' ')}</span></div>
              <div><span className="text-gray-600">Est. Time:</span> <span className="font-medium">{selectedProcess?.estimatedTime}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setCurrentStep('questionnaire')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Information
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Forms
        </button>
        <button
          onClick={() => setCurrentStep('submit')}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          Submit for Review
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderSubmit = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Submit for Professional Review</h1>
        <p className="text-lg text-gray-600">Get your forms reviewed by an immigration attorney</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Your forms will be reviewed by a licensed immigration attorney
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                You'll receive detailed feedback within 24-48 hours
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Any corrections or suggestions will be highlighted
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Final forms will be ready for USCIS submission
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Fee: $99</h3>
            <p className="text-gray-700">This includes professional review, corrections, and filing guidance. Much less expensive than traditional attorney consultation fees.</p>
          </div>
        </div>

        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => setCurrentStep('preview')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Preview
          </button>
          <button
            onClick={handleSubmitToAdvisor}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Submit for Review ($99)
          </button>
        </div>
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
                <span className="font-medium">1. Goal Selection</span>
              </div>
              <div className={`flex items-center ${currentStep === 'process-selection' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Book className="h-5 w-5 mr-2" />
                <span className="font-medium">2. Process Selection</span>
              </div>
              <div className={`flex items-center ${currentStep === 'questionnaire' ? 'text-blue-600' : 'text-gray-400'}`}>
                <FileText className="h-5 w-5 mr-2" />
                <span className="font-medium">3. Questionnaire</span>
              </div>
              <div className={`flex items-center ${currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Eye className="h-5 w-5 mr-2" />
                <span className="font-medium">4. Preview</span>
              </div>
              <div className={`flex items-center ${currentStep === 'submit' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Upload className="h-5 w-5 mr-2" />
                <span className="font-medium">5. Submit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-yellow-800">
            Debug: Current Step = {currentStep} | Selected Process = {selectedProcess?.name || 'None'}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-screen">
        {currentStep === 'goal-selection' && renderGoalSelection()}
        {currentStep === 'process-selection' && renderProcessSelection()}
        {currentStep === 'questionnaire' && renderQuestionnaire()}
        {currentStep === 'preview' && renderPreview()}
        {currentStep === 'submit' && renderSubmit()}
        
        {/* Fallback content */}
        {!['goal-selection', 'process-selection', 'questionnaire', 'preview', 'submit'].includes(currentStep) && (
          <div className="max-w-4xl mx-auto p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Current step "{currentStep}" is not recognized.</p>
            <button
              onClick={() => setCurrentStep('goal-selection')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset to Goal Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedIndividualFormFiling;
