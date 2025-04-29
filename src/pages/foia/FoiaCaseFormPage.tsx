import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { createFoiaCase, FoiaCaseForm } from '../../controllers/FoiaCaseControllers';
import { toast } from 'react-hot-toast';

const FoiaCaseFormPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FoiaCaseForm>({
    userId: '',
    alienNumber: '',
    alienNumbers: [],
    subject: {
      firstName: '',
      lastName: '',
      middleName: '',
      entryFirstName: '',
      entryLastName: '',
      entryMiddleName: '',
      dateOfBirth: '',
      birthCountry: '',
      mailingCountry: '',
      mailingState: '',
      mailingAddress1: '',
      mailingAddress2: '',
      mailingCity: '',
      mailingZipCode: '',
      mailingProvince: '',
      mailingPostalCode: '',
      daytimePhone: '',
      mobilePhone: '',
      emailAddress: '',
    },
    family: [],
    aliases: [],
    requester: {
      firstName: '',
      lastName: '',
      middleName: '',
      mailingCountry: '',
      mailingState: '',
      mailingAddress1: '',
      mailingAddress2: '',
      mailingCity: '',
      mailingZipCode: '',
      mailingProvince: '',
      mailingPostalCode: '',
      daytimePhone: '',
      mobilePhone: '',
      emailAddress: '',
      organization: '',
    },
    receiptNumber: [''],
    receiptNumbers: [''],
    representiveRoleToSubjectOfRecord: {
      role: '',
      otherExplain: '',
    },
    digitalDelivery: '',
    preferredConsentMethod: '',
    courtProceedings: false,
    recordsRequested: [],
    qualificationsForExpeditedProcessing: {
      physicalThreat: '',
      informPublic: '',
      dueProcess: '',
      mediaInterest: '',
    },
    documents: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.subject.firstName) errors['subject.firstName'] = 'First name is required';
    if (!formData.subject.lastName) errors['subject.lastName'] = 'Last name is required';
    if (!formData.subject.dateOfBirth) errors['subject.dateOfBirth'] = 'Date of birth is required';
    if (!formData.subject.emailAddress) errors['subject.emailAddress'] = 'Email is required';
    if (!formData.requester.firstName) errors['requester.firstName'] = 'Requester first name is required';
    if (!formData.requester.lastName) errors['requester.lastName'] = 'Requester last name is required';
    if (!formData.requester.emailAddress) errors['requester.emailAddress'] = 'Requester email is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.subject.emailAddress && !emailRegex.test(formData.subject.emailAddress)) {
      errors['subject.emailAddress'] = 'Invalid email format';
    }
    if (formData.requester.emailAddress && !emailRegex.test(formData.requester.emailAddress)) {
      errors['requester.emailAddress'] = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFamilyInputChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newFamily = [...prev.family];
      newFamily[index] = {
        ...newFamily[index],
        [field]: value
      };
      return {
        ...prev,
        family: newFamily
      };
    });
  };

  const addFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      family: [...prev.family, { firstName: '', lastName: '', relation: '' }]
    }));
  };

  const removeFamilyMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      family: prev.family.filter((_, i) => i !== index)
    }));
  };

  const handleAliasInputChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newAliases = [...prev.aliases];
      newAliases[index] = {
        ...newAliases[index],
        [field]: value
      };
      return {
        ...prev,
        aliases: newAliases
      };
    });
  };

  const addAlias = () => {
    setFormData(prev => ({
      ...prev,
      aliases: [...prev.aliases, { firstName: '', lastName: '', middleName: '' }]
    }));
  };

  const removeAlias = (index: number) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases.filter((_, i) => i !== index)
    }));
  };

  const handleRecordInputChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newRecords = [...prev.recordsRequested];
      newRecords[index] = {
        ...newRecords[index],
        [field]: value
      };
      return {
        ...prev,
        recordsRequested: newRecords
      };
    });
  };

  const addRecord = () => {
    setFormData(prev => ({
      ...prev,
      recordsRequested: [...prev.recordsRequested, { requestedDocumentType: '', otherDescription: '', requestedDocumentDate: '' }]
    }));
  };

  const removeRecord = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recordsRequested: prev.recordsRequested.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentInputChange = (index: number, field: string, value: string | File) => {
    setFormData(prev => {
      const newDocuments = [...prev.documents];
      if (field === 'file' && value instanceof File) {
        newDocuments[index] = {
          ...newDocuments[index],
          fileName: value.name,
          content: '' // You might want to read the file content here
        };
      } else {
        newDocuments[index] = {
          ...newDocuments[index],
          [field]: value
        };
      }
      return {
        ...prev,
        documents: newDocuments
      };
    });
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { content: '', fileName: '' }]
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Receipt Numbers handlers
  const handleReceiptNumberChange = (index: number, value: string) => {
    setFormData(prev => {
      const newReceiptNumbers = [...prev.receiptNumber];
      newReceiptNumbers[index] = value;
      return {
        ...prev,
        receiptNumber: newReceiptNumbers
      };
    });
  };

  const addReceiptNumber = () => {
    setFormData(prev => ({
      ...prev,
      receiptNumber: [...prev.receiptNumber, '']
    }));
  };

  const removeReceiptNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      receiptNumber: prev.receiptNumber.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setSaving(true);

    try {
      const response = await createFoiaCase(formData);
      if (response.status === 201) {
        toast.success('FOIA case created successfully');
        navigate('/foia-cases');
      } else {
        throw new Error('Failed to create FOIA case');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create FOIA case. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Add error display helper
  const getError = (fieldName: string) => {
    return formErrors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{formErrors[fieldName]}</p>
    ) : null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/foia-cases')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to FOIA Cases
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New FOIA Case</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alien Numbers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Alien Numbers</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Alien Number</label>
              <input
                type="text"
                name="alienNumber"
                value={formData.alienNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Subject Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                name="subject.firstName"
                value={formData.subject.firstName}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['subject.firstName'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('subject.firstName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                name="subject.lastName"
                value={formData.subject.lastName}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['subject.lastName'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('subject.lastName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                name="subject.middleName"
                value={formData.subject.middleName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entry First Name</label>
              <input
                type="text"
                name="subject.entryFirstName"
                value={formData.subject.entryFirstName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entry Last Name</label>
              <input
                type="text"
                name="subject.entryLastName"
                value={formData.subject.entryLastName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entry Middle Name</label>
              <input
                type="text"
                name="subject.entryMiddleName"
                value={formData.subject.entryMiddleName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input
                type="date"
                name="subject.dateOfBirth"
                value={formData.subject.dateOfBirth}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['subject.dateOfBirth'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('subject.dateOfBirth')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Birth Country</label>
              <input
                type="text"
                name="subject.birthCountry"
                value={formData.subject.birthCountry}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Subject Mailing Address */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Mailing Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="subject.mailingCountry"
                value={formData.subject.mailingCountry}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="subject.mailingState"
                value={formData.subject.mailingState}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
              <input
                type="text"
                name="subject.mailingAddress1"
                value={formData.subject.mailingAddress1}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
              <input
                type="text"
                name="subject.mailingAddress2"
                value={formData.subject.mailingAddress2}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="subject.mailingCity"
                value={formData.subject.mailingCity}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zip Code</label>
              <input
                type="text"
                name="subject.mailingZipCode"
                value={formData.subject.mailingZipCode}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Province</label>
              <input
                type="text"
                name="subject.mailingProvince"
                value={formData.subject.mailingProvince || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                name="subject.mailingPostalCode"
                value={formData.subject.mailingPostalCode || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Subject Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Daytime Phone</label>
              <input
                type="tel"
                name="subject.daytimePhone"
                value={formData.subject.daytimePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Phone</label>
              <input
                type="tel"
                name="subject.mobilePhone"
                value={formData.subject.mobilePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                name="subject.emailAddress"
                value={formData.subject.emailAddress}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['subject.emailAddress'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('subject.emailAddress')}
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Family Members</h2>
          {formData.family.map((member, index) => (
            <div key={index} className="space-y-4 mb-4 border-b pb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Family Member {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeFamilyMember(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={member.firstName}
                    onChange={(e) => handleFamilyInputChange(index, 'firstName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={member.lastName}
                    onChange={(e) => handleFamilyInputChange(index, 'lastName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                  <input
                    type="text"
                    value={member.middleName || ''}
                    onChange={(e) => handleFamilyInputChange(index, 'middleName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relation</label>
                  <input
                    type="text"
                    value={member.relation}
                    onChange={(e) => handleFamilyInputChange(index, 'relation', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maiden Name</label>
                  <input
                    type="text"
                    value={member.maidenName || ''}
                    onChange={(e) => handleFamilyInputChange(index, 'maidenName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFamilyMember}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Family Member
          </button>
        </div>

        {/* Aliases */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Aliases</h2>
          {formData.aliases.map((alias, index) => (
            <div key={index} className="space-y-4 mb-4 border-b pb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Alias {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeAlias(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={alias.firstName}
                    onChange={(e) => handleAliasInputChange(index, 'firstName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={alias.lastName}
                    onChange={(e) => handleAliasInputChange(index, 'lastName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                  <input
                    type="text"
                    value={alias.middleName || ''}
                    onChange={(e) => handleAliasInputChange(index, 'middleName', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addAlias}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Alias
          </button>
        </div>

        {/* Requester Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Requester Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                name="requester.firstName"
                value={formData.requester.firstName}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['requester.firstName'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('requester.firstName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                name="requester.lastName"
                value={formData.requester.lastName}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['requester.lastName'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('requester.lastName')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                type="text"
                name="requester.middleName"
                value={formData.requester.middleName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                name="requester.emailAddress"
                value={formData.requester.emailAddress}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['requester.emailAddress'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('requester.emailAddress')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Daytime Phone</label>
              <input
                type="tel"
                name="requester.daytimePhone"
                value={formData.requester.daytimePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Phone</label>
              <input
                type="tel"
                name="requester.mobilePhone"
                value={formData.requester.mobilePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing Address 1</label>
              <input
                type="text"
                name="requester.mailingAddress1"
                value={formData.requester.mailingAddress1}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing Address 2</label>
              <input
                type="text"
                name="requester.mailingAddress2"
                value={formData.requester.mailingAddress2}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing City</label>
              <input
                type="text"
                name="requester.mailingCity"
                value={formData.requester.mailingCity}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing State</label>
              <input
                type="text"
                name="requester.mailingState"
                value={formData.requester.mailingState}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing Country</label>
              <input
                type="text"
                name="requester.mailingCountry"
                value={formData.requester.mailingCountry}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing Zip Code</label>
              <input
                type="text"
                name="requester.mailingZipCode"
                value={formData.requester.mailingZipCode}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <input
                type="text"
                name="requester.organization"
                value={formData.requester.organization}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Receipt Numbers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Receipt Numbers</h2>
          <div className="space-y-4">
            {formData.receiptNumber.map((number, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Receipt Number {index + 1}</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => handleReceiptNumberChange(index, e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeReceiptNumber(index)}
                  className="mt-6 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addReceiptNumber}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Receipt Number
          </button>
        </div>

        {/* Representative Role */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Representative Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <input
                type="text"
                name="representiveRoleToSubjectOfRecord.role"
                value={formData.representiveRoleToSubjectOfRecord.role}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Other Explanation</label>
              <input
                type="text"
                name="representiveRoleToSubjectOfRecord.otherExplain"
                value={formData.representiveRoleToSubjectOfRecord.otherExplain}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Delivery and Consent */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery and Consent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Digital Delivery</label>
              <input
                type="text"
                name="digitalDelivery"
                value={formData.digitalDelivery}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Consent Method</label>
              <input
                type="text"
                name="preferredConsentMethod"
                value={formData.preferredConsentMethod}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Court Proceedings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Court Proceedings</h2>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="courtProceedings"
              checked={formData.courtProceedings}
              onChange={(e) => setFormData(prev => ({ ...prev, courtProceedings: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Are there any court proceedings related to this request?
            </label>
          </div>
        </div>

        {/* Records Requested */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Records Requested</h2>
          {formData.recordsRequested.map((record, index) => (
            <div key={index} className="space-y-4 mb-4 border-b pb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Record Request {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeRecord(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <input
                    type="text"
                    value={record.requestedDocumentType}
                    onChange={(e) => handleRecordInputChange(index, 'requestedDocumentType', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={record.otherDescription || ''}
                    onChange={(e) => handleRecordInputChange(index, 'otherDescription', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Date</label>
                  <input
                    type="date"
                    value={record.requestedDocumentDate || ''}
                    onChange={(e) => handleRecordInputChange(index, 'requestedDocumentDate', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addRecord}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Record Request
          </button>
        </div>

        {/* Expedited Processing Qualifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Expedited Processing Qualifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Physical Threat</label>
              <input
                type="text"
                name="qualificationsForExpeditedProcessing.physicalThreat"
                value={formData.qualificationsForExpeditedProcessing.physicalThreat}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inform Public</label>
              <input
                type="text"
                name="qualificationsForExpeditedProcessing.informPublic"
                value={formData.qualificationsForExpeditedProcessing.informPublic}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Process</label>
              <input
                type="text"
                name="qualificationsForExpeditedProcessing.dueProcess"
                value={formData.qualificationsForExpeditedProcessing.dueProcess}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Media Interest</label>
              <input
                type="text"
                name="qualificationsForExpeditedProcessing.mediaInterest"
                value={formData.qualificationsForExpeditedProcessing.mediaInterest}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
          {formData.documents.map((doc, index) => (
            <div key={index} className="space-y-4 mb-4 border-b pb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Document {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">File</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleDocumentInputChange(index, 'file', file);
                      }
                    }}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {doc.fileName && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected file: {doc.fileName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    value={doc.content}
                    onChange={(e) => handleDocumentInputChange(index, 'content', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addDocument}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Document
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 mr-2">
                  <LoadingSpinner />
                </div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create FOIA Case
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoiaCaseFormPage; 