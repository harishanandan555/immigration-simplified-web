import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, ArrowRight, Download, Info, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
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

const availableForms: Form[] = [
  // Family-Based Immigration Forms
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
    id: 'I-693',
    name: 'I-693 Report of Medical Examination and Vaccination Record',
    description: 'Medical examination results for immigration purposes',
    requirements: 'Must be completed by a civil surgeon',
    category: 'Medical Examination',
    filingFee: 'Varies by doctor',
    processingTime: 'Same day'
  },
  {
    id: 'N-400',
    name: 'N-400 Application for Naturalization',
    description: 'Application for U.S. citizenship',
    requirements: 'Must meet residency and other requirements',
    category: 'Naturalization',
    filingFee: '$640',
    processingTime: '8-12 months'
  },
  {
    id: 'I-751',
    name: 'I-751 Petition to Remove Conditions on Residence',
    description: 'Petition to remove conditions on conditional permanent residence',
    requirements: 'Must be filed within 90 days before conditional residence expires',
    category: 'Removal of Conditions',
    filingFee: '$595',
    processingTime: '12-18 months'
  },
  {
    id: 'I-140',
    name: 'I-140 Immigrant Petition for Alien Worker',
    description: 'Petition for employment-based immigrant visa',
    requirements: 'Must have job offer and meet category requirements',
    category: 'Employment-Based Immigration',
    filingFee: '$700',
    processingTime: '6-12 months'
  },
  {
    id: 'I-589',
    name: 'I-589 Application for Asylum and for Withholding of Removal',
    description: 'Application for asylum or withholding of removal',
    requirements: 'Must file within one year of arrival or meet exception',
    category: 'Asylum',
    filingFee: 'No fee',
    processingTime: 'Varies'
  }
];

interface FilingData {
  [key: string]: {
    filingDate: string;
    priorityDate: string;
    receiptNumber: string;
    status: string;
    notes: string;
  };
}

const IndividualFormFiling: React.FC = () => {
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
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
  const [currentStep, setCurrentStep] = useState<'selection' | 'common-info' | 'details' | 'documents' | 'review'>('selection');

  const handleFormSelection = (selected: string[]) => {
    setSelectedForms(selected);
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

  const handleFilingDataChange = (formId: string, field: string, value: string) => {
    setFilingData(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (formId: string, file: File, base64Content: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [formId]: [...(prev[formId] || []), file]
    }));
  };

  const getSelectedFormDetails = () => {
    return availableForms.filter(form => selectedForms.includes(form.id));
  };

  const renderSelectionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Individual Form Filing</h1>
        <p className="mt-2 text-lg text-gray-600">Select the forms you want to file individually</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <MultiSelect
          id="form-selection"
          label="Select Forms to File"
          options={availableForms.map(form => ({
            value: form.id,
            label: form.name,
            description: `${form.description} (${form.category})`
          }))}
          selectedValues={selectedForms}
          onChange={handleFormSelection}
          placeholder="Choose forms to file..."
          helperText="Select one or more forms to file individually"
        />

        {selectedForms.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Forms</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {getSelectedFormDetails().map(form => (
                <div key={form.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{form.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Filing Fee:</span>
                          <span className="font-medium">{form.filingFee}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Processing Time:</span>
                          <span className="font-medium">{form.processingTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {form.category}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <Info className="w-3 h-3 mr-1" />
                      Requirements: {form.requirements}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={() => setCurrentStep('common-info')}
            disabled={selectedForms.length === 0}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue to Personal Information
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCommonInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
        <p className="mt-2 text-gray-600">Provide your personal information that will be used across all forms</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                value={commonInfo.firstName}
                onChange={(e) => handleCommonInfoChange('firstName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                value={commonInfo.middleName}
                onChange={(e) => handleCommonInfoChange('middleName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                value={commonInfo.lastName}
                onChange={(e) => handleCommonInfoChange('lastName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input
                type="date"
                value={commonInfo.dateOfBirth}
                onChange={(e) => handleCommonInfoChange('dateOfBirth', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Place of Birth *</label>
              <input
                type="text"
                value={commonInfo.placeOfBirth}
                onChange={(e) => handleCommonInfoChange('placeOfBirth', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="City, Country"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select
                value={commonInfo.gender}
                onChange={(e) => handleCommonInfoChange('gender', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marital Status *</label>
              <select
                value={commonInfo.maritalStatus}
                onChange={(e) => handleCommonInfoChange('maritalStatus', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Social Security Number</label>
              <input
                type="text"
                value={commonInfo.ssn}
                onChange={(e) => handleCommonInfoChange('ssn', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="XXX-XX-XXXX"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                value={commonInfo.email}
                onChange={(e) => handleCommonInfoChange('email', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                value={commonInfo.phone}
                onChange={(e) => handleCommonInfoChange('phone', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Alternate Phone</label>
              <input
                type="tel"
                value={commonInfo.alternatePhone}
                onChange={(e) => handleCommonInfoChange('alternatePhone', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Current Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address *</label>
              <input
                type="text"
                value={commonInfo.address.street}
                onChange={(e) => handleCommonInfoChange('address.street', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apartment/Suite</label>
              <input
                type="text"
                value={commonInfo.address.apartment}
                onChange={(e) => handleCommonInfoChange('address.apartment', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                value={commonInfo.address.city}
                onChange={(e) => handleCommonInfoChange('address.city', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State *</label>
              <input
                type="text"
                value={commonInfo.address.state}
                onChange={(e) => handleCommonInfoChange('address.state', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code *</label>
              <input
                type="text"
                value={commonInfo.address.zipCode}
                onChange={(e) => handleCommonInfoChange('address.zipCode', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country *</label>
              <input
                type="text"
                value={commonInfo.address.country}
                onChange={(e) => handleCommonInfoChange('address.country', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Immigration Information */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Immigration Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Alien Number (A-Number)</label>
              <input
                type="text"
                value={commonInfo.alienNumber}
                onChange={(e) => handleCommonInfoChange('alienNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="A123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">USCIS Online Account Number</label>
              <input
                type="text"
                value={commonInfo.uscisOnlineAccountNumber}
                onChange={(e) => handleCommonInfoChange('uscisOnlineAccountNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passport Number</label>
              <input
                type="text"
                value={commonInfo.passportNumber}
                onChange={(e) => handleCommonInfoChange('passportNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passport Country</label>
              <input
                type="text"
                value={commonInfo.passportCountry}
                onChange={(e) => handleCommonInfoChange('passportCountry', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passport Expiry Date</label>
              <input
                type="date"
                value={commonInfo.passportExpiryDate}
                onChange={(e) => handleCommonInfoChange('passportExpiryDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Entry to U.S.</label>
              <input
                type="date"
                value={commonInfo.entryDate}
                onChange={(e) => handleCommonInfoChange('entryDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port of Entry</label>
              <input
                type="text"
                value={commonInfo.entryPort}
                onChange={(e) => handleCommonInfoChange('entryPort', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., JFK Airport"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Visa Category</label>
              <input
                type="text"
                value={commonInfo.visaCategory}
                onChange={(e) => handleCommonInfoChange('visaCategory', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., H-1B, F-1, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Immigration Status</label>
              <select
                value={commonInfo.currentStatus}
                onChange={(e) => handleCommonInfoChange('currentStatus', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Status</option>
                <option value="U.S. Citizen">U.S. Citizen</option>
                <option value="Lawful Permanent Resident">Lawful Permanent Resident</option>
                <option value="Nonimmigrant">Nonimmigrant</option>
                <option value="Asylee">Asylee</option>
                <option value="Refugee">Refugee</option>
                <option value="Undocumented">Undocumented</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Employer</label>
              <input
                type="text"
                value={commonInfo.employerName}
                onChange={(e) => handleCommonInfoChange('employerName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                value={commonInfo.jobTitle}
                onChange={(e) => handleCommonInfoChange('jobTitle', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Employment Start Date</label>
              <input
                type="date"
                value={commonInfo.employmentStartDate}
                onChange={(e) => handleCommonInfoChange('employmentStartDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Employer Address</label>
              <input
                type="text"
                value={commonInfo.employerAddress}
                onChange={(e) => handleCommonInfoChange('employerAddress', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
              <input
                type="text"
                value={commonInfo.emergencyContact.name}
                onChange={(e) => handleCommonInfoChange('emergencyContact.name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship</label>
              <input
                type="text"
                value={commonInfo.emergencyContact.relationship}
                onChange={(e) => handleCommonInfoChange('emergencyContact.relationship', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Spouse, Parent, Friend"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
              <input
                type="tel"
                value={commonInfo.emergencyContact.phone}
                onChange={(e) => handleCommonInfoChange('emergencyContact.phone', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Address</label>
              <input
                type="text"
                value={commonInfo.emergencyContact.address}
                onChange={(e) => handleCommonInfoChange('emergencyContact.address', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Legal Representation */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Legal Representation</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasAttorney"
                checked={commonInfo.hasAttorney}
                onChange={(e) => handleCommonInfoChange('hasAttorney', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasAttorney" className="ml-2 block text-sm text-gray-900">
                I have an attorney or accredited representative
              </label>
            </div>
            
            {commonInfo.hasAttorney && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attorney Name</label>
                  <input
                    type="text"
                    value={commonInfo.attorneyName}
                    onChange={(e) => handleCommonInfoChange('attorneyName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attorney Phone</label>
                  <input
                    type="tel"
                    value={commonInfo.attorneyPhone}
                    onChange={(e) => handleCommonInfoChange('attorneyPhone', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attorney Email</label>
                  <input
                    type="email"
                    value={commonInfo.attorneyEmail}
                    onChange={(e) => handleCommonInfoChange('attorneyEmail', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attorney Address</label>
                  <input
                    type="text"
                    value={commonInfo.attorneyAddress}
                    onChange={(e) => handleCommonInfoChange('attorneyAddress', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="g28Submitted"
                    checked={commonInfo.g28Submitted}
                    onChange={(e) => handleCommonInfoChange('g28Submitted', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="g28Submitted" className="ml-2 block text-sm text-gray-900">
                    G-28 Notice of Entry of Appearance will be submitted
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep('selection')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Form Selection
          </button>
          <button
            onClick={() => setCurrentStep('details')}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Continue to Form Details
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Form Details</h2>
        <p className="mt-2 text-gray-600">Provide filing details for each selected form</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        {getSelectedFormDetails().map(form => (
          <div key={form.id} className="mb-8 last:mb-0">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{form.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Filing Date</label>
                <input
                  type="date"
                  value={filingData[form.id]?.filingDate || ''}
                  onChange={(e) => handleFilingDataChange(form.id, 'filingDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority Date</label>
                <input
                  type="date"
                  value={filingData[form.id]?.priorityDate || ''}
                  onChange={(e) => handleFilingDataChange(form.id, 'priorityDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Receipt Number</label>
                <input
                  type="text"
                  value={filingData[form.id]?.receiptNumber || ''}
                  onChange={(e) => handleFilingDataChange(form.id, 'receiptNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter receipt number if available"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filingData[form.id]?.status || ''}
                  onChange={(e) => handleFilingDataChange(form.id, 'status', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Denied">Denied</option>
                  <option value="RFE">Request for Evidence</option>
                  <option value="Interview">Interview Scheduled</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={filingData[form.id]?.notes || ''}
                onChange={(e) => handleFilingDataChange(form.id, 'notes', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep('common-info')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Personal Information
          </button>
          <button
            onClick={() => setCurrentStep('documents')}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Continue to Documents
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Document Upload</h2>
        <p className="mt-2 text-gray-600">Upload supporting documents for each form</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        {getSelectedFormDetails().map(form => (
          <div key={form.id} className="mb-8 last:mb-0">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{form.name}</h3>
            <div className="space-y-4">
              <FileUpload
                id={`${form.id}-documents`}
                label="Supporting Documents"
                onChange={(file, base64Content) => handleFileUpload(form.id, file, base64Content)}
                helperText="Upload supporting documents for this form (PDF, JPEG, PNG - max 5MB each)"
                acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
                maxSizeMB={5}
              />
              
              {uploadedFiles[form.id]?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                  <ul className="space-y-2">
                    {uploadedFiles[form.id]?.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep('details')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Form Details
          </button>
          <button
            onClick={() => setCurrentStep('review')}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Continue to Review
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Review & Submit</h2>
        <p className="mt-2 text-gray-600">Review all information before submitting your forms</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        {/* Personal Information Review */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Name:</span> {commonInfo.firstName} {commonInfo.middleName} {commonInfo.lastName}</div>
                <div><span className="font-medium">Date of Birth:</span> {commonInfo.dateOfBirth}</div>
                <div><span className="font-medium">Place of Birth:</span> {commonInfo.placeOfBirth}</div>
                <div><span className="font-medium">Gender:</span> {commonInfo.gender}</div>
                <div><span className="font-medium">Marital Status:</span> {commonInfo.maritalStatus}</div>
                {commonInfo.ssn && <div><span className="font-medium">SSN:</span> {commonInfo.ssn}</div>}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Email:</span> {commonInfo.email}</div>
                <div><span className="font-medium">Phone:</span> {commonInfo.phone}</div>
                {commonInfo.alternatePhone && <div><span className="font-medium">Alternate Phone:</span> {commonInfo.alternatePhone}</div>}
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current Address</h4>
              <div className="space-y-1 text-sm">
                <div>{commonInfo.address.street}</div>
                {commonInfo.address.apartment && <div>Apt/Suite: {commonInfo.address.apartment}</div>}
                <div>{commonInfo.address.city}, {commonInfo.address.state} {commonInfo.address.zipCode}</div>
                <div>{commonInfo.address.country}</div>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Immigration Information</h4>
              <div className="space-y-1 text-sm">
                {commonInfo.alienNumber && <div><span className="font-medium">Alien Number:</span> {commonInfo.alienNumber}</div>}
                {commonInfo.uscisOnlineAccountNumber && <div><span className="font-medium">USCIS Account:</span> {commonInfo.uscisOnlineAccountNumber}</div>}
                {commonInfo.passportNumber && <div><span className="font-medium">Passport:</span> {commonInfo.passportNumber} ({commonInfo.passportCountry})</div>}
                {commonInfo.entryDate && <div><span className="font-medium">Entry Date:</span> {commonInfo.entryDate}</div>}
                {commonInfo.visaCategory && <div><span className="font-medium">Visa Category:</span> {commonInfo.visaCategory}</div>}
                {commonInfo.currentStatus && <div><span className="font-medium">Current Status:</span> {commonInfo.currentStatus}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information Review */}
        {(commonInfo.employerName || commonInfo.jobTitle) && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {commonInfo.employerName && <div><span className="font-medium">Employer:</span> {commonInfo.employerName}</div>}
                {commonInfo.jobTitle && <div><span className="font-medium">Job Title:</span> {commonInfo.jobTitle}</div>}
                {commonInfo.employmentStartDate && <div><span className="font-medium">Start Date:</span> {commonInfo.employmentStartDate}</div>}
                {commonInfo.employerAddress && <div><span className="font-medium">Employer Address:</span> {commonInfo.employerAddress}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contact Review */}
        {(commonInfo.emergencyContact.name || commonInfo.emergencyContact.phone) && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {commonInfo.emergencyContact.name && <div><span className="font-medium">Name:</span> {commonInfo.emergencyContact.name}</div>}
                {commonInfo.emergencyContact.relationship && <div><span className="font-medium">Relationship:</span> {commonInfo.emergencyContact.relationship}</div>}
                {commonInfo.emergencyContact.phone && <div><span className="font-medium">Phone:</span> {commonInfo.emergencyContact.phone}</div>}
                {commonInfo.emergencyContact.address && <div><span className="font-medium">Address:</span> {commonInfo.emergencyContact.address}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Legal Representation Review */}
        {commonInfo.hasAttorney && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Legal Representation</h3>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {commonInfo.attorneyName && <div><span className="font-medium">Attorney Name:</span> {commonInfo.attorneyName}</div>}
                {commonInfo.attorneyPhone && <div><span className="font-medium">Attorney Phone:</span> {commonInfo.attorneyPhone}</div>}
                {commonInfo.attorneyEmail && <div><span className="font-medium">Attorney Email:</span> {commonInfo.attorneyEmail}</div>}
                {commonInfo.attorneyAddress && <div><span className="font-medium">Attorney Address:</span> {commonInfo.attorneyAddress}</div>}
                <div><span className="font-medium">G-28 Submitted:</span> {commonInfo.g28Submitted ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Forms Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Forms Summary</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {getSelectedFormDetails().map(form => (
              <div key={form.id} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900">{form.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Filing Fee:</span>
                    <span className="font-medium">{form.filingFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium">{filingData[form.id]?.status || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Documents:</span>
                    <span className="font-medium">{uploadedFiles[form.id]?.length || 0} files</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Filing Data */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Filing Data</h3>
          <pre className="mt-2 p-4 bg-gray-100 rounded-md text-xs overflow-auto max-h-96">
            {JSON.stringify({
              personalInformation: commonInfo,
              selectedForms: getSelectedFormDetails().map(f => ({ id: f.id, name: f.name })),
              filingData,
              uploadedDocuments: Object.entries(uploadedFiles).map(([formId, files]) => ({
                formId,
                files: files.map(f => f.name)
              }))
            }, null, 2)}
          </pre>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep('documents')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Documents
          </button>
          <button
            onClick={() => {
              // Handle form submission
              alert('Forms submitted successfully!');
            }}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Submit Forms
            <CheckCircle className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Individual Form Filing</h1>
              <p className="text-sm text-gray-500">File USCIS forms individually</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${currentStep === 'selection' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${currentStep === 'common-info' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${currentStep === 'details' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${currentStep === 'documents' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${currentStep === 'review' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              </div>
              <div className="text-xs text-gray-500">
                Step {currentStep === 'selection' ? '1' : currentStep === 'common-info' ? '2' : currentStep === 'details' ? '3' : currentStep === 'documents' ? '4' : '5'} of 5
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === 'selection' && renderSelectionStep()}
        {currentStep === 'common-info' && renderCommonInfoStep()}
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'documents' && renderDocumentsStep()}
        {currentStep === 'review' && renderReviewStep()}
      </div>
    </div>
  );
};

export default IndividualFormFiling; 