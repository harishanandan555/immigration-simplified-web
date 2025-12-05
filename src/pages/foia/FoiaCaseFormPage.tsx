import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createFoiaCase, getFoiaCaseByCaseId, updateFoiaCase, FoiaCaseForm } from '../../controllers/FoiaCaseControllers';
import { useAuth } from '../../controllers/AuthControllers';

const FoiaCaseFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState<FoiaCaseForm>({
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
      mailingProvince: '',
      mailingAddress1: '',
      mailingAddress2: '',
      mailingCity: '',
      mailingZipCode: '',
      mailingPostalCode: '',
      daytimePhone: '',
      mobilePhone: '',
      emailAddress: '',
    },
    family: [
      { firstName: '', lastName: '', relation: 'M' },
      { firstName: '', lastName: '', relation: 'F' }
    ],
    aliases: [],
    requester: {
      firstName: '',
      lastName: '',
      middleName: '',
      mailingCountry: '',
      mailingState: '',
      mailingProvince: '',
      mailingAddress1: '',
      mailingAddress2: '',
      mailingCity: '',
      mailingZipCode: '',
      mailingPostalCode: '',
      daytimePhone: '',
      mobilePhone: '',
      emailAddress: '',
      organization: '',
    },
    receiptNumber: [],
    receiptNumbers: [],
    representiveRoleToSubjectOfRecord: {
      role: '',
      otherExplain: '',
    },
    digitalDelivery: '',
    preferredConsentMethod: '',
    courtProceedings: false,
    recordsRequested: [],
    qualificationsForExpeditedProcessing: {
      physicalThreat: false,
      informPublic: false,
      dueProcess: false,
      mediaInterest: false,
    },
    documents: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      loadExistingCase();
    }
  }, [id, isEditMode]);

  const loadExistingCase = async () => {
    try {
      setLoading(true);
      const response = await getFoiaCaseByCaseId(id!);
      if (response.success && response.data) {
        // Convert the case data to form data format
        // Note: FoiaCase interface only has limited fields, so we only load what's available
        const caseData = response.data;
        setFormData(prev => ({
          ...prev,
          subject: {
            ...prev.subject,
            firstName: caseData.subject.firstName || '',
            lastName: caseData.subject.lastName || '',
          },
          requester: {
            ...prev.requester,
            firstName: caseData.requester.firstName || '',
            lastName: caseData.requester.lastName || '',
            emailAddress: caseData.requester.emailAddress || '',
          },
          recordsRequested: caseData.recordsRequested || [],
        }));
      }
    } catch (err) {
      setError('Failed to load existing case data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.subject.firstName) errors['subject.firstName'] = 'First name is required';
    if (!formData.subject.lastName) errors['subject.lastName'] = 'Last name is required';
    if (!formData.subject.dateOfBirth) errors['subject.dateOfBirth'] = 'Date of birth is required';
    if (!formData.subject.birthCountry) errors['subject.birthCountry'] = 'Birth country is required (3-letter code)';
    if (!formData.subject.mailingCountry) errors['subject.mailingCountry'] = 'Mailing country is required (3-letter code)';
    if (!formData.subject.mailingAddress1) errors['subject.mailingAddress1'] = 'Mailing address is required';
    if (!formData.subject.mailingCity) errors['subject.mailingCity'] = 'Mailing city is required';
    
    // Country code validation - must be 2 uppercase letters (ISO 3166-1 Alpha-2)
    if (formData.subject.birthCountry && (!/^[A-Z]{2}$/.test(formData.subject.birthCountry) || formData.subject.birthCountry !== formData.subject.birthCountry.toUpperCase())) {
      errors['subject.birthCountry'] = 'Birth country must be a 2-character uppercase code (e.g., US, CA, MX)';
    }
    if (formData.subject.mailingCountry && (!/^[A-Z]{2}$/.test(formData.subject.mailingCountry) || formData.subject.mailingCountry !== formData.subject.mailingCountry.toUpperCase())) {
      errors['subject.mailingCountry'] = 'Mailing country must be a 2-character uppercase code (e.g., US, CA, MX)';
    }
    
    // Address validation based on country (US vs non-US)
    const isSubjectUS = formData.subject.mailingCountry === 'US';
    if (isSubjectUS) {
      // US addresses: require state and zipCode, province and postalCode must be empty
      if (!formData.subject.mailingState) errors['subject.mailingState'] = 'State is required for US addresses';
      if (!formData.subject.mailingZipCode) errors['subject.mailingZipCode'] = 'Zip code is required for US addresses';
      if (formData.subject.mailingZipCode && !/^\d{5}(-\d{4})?$/.test(formData.subject.mailingZipCode)) {
        errors['subject.mailingZipCode'] = 'Invalid US zip code format';
      }
      if (formData.subject.mailingProvince) {
        errors['subject.mailingProvince'] = 'Province must be empty for US addresses';
      }
      if (formData.subject.mailingPostalCode) {
        errors['subject.mailingPostalCode'] = 'Postal code must be empty for US addresses';
      }
    } else if (formData.subject.mailingCountry) {
      // Non-US addresses: require province and postalCode, state and zipCode must be empty
      if (!formData.subject.mailingProvince) errors['subject.mailingProvince'] = 'Province is required for non-US addresses';
      if (!formData.subject.mailingPostalCode) errors['subject.mailingPostalCode'] = 'Postal code is required for non-US addresses';
      if (formData.subject.mailingState) {
        errors['subject.mailingState'] = 'State must be empty for non-US addresses';
      }
      if (formData.subject.mailingZipCode) {
        errors['subject.mailingZipCode'] = 'Zip code must be empty for non-US addresses';
      }
    }
    
    if (!formData.requester.firstName) errors['requester.firstName'] = 'Requester first name is required';
    if (!formData.requester.lastName) errors['requester.lastName'] = 'Requester last name is required';
    if (!formData.requester.emailAddress) errors['requester.emailAddress'] = 'Requester email is required';
    if (!formData.requester.mailingCountry) errors['requester.mailingCountry'] = 'Requester mailing country is required';
    if (!formData.requester.mailingAddress1) errors['requester.mailingAddress1'] = 'Requester mailing address is required';
    if (!formData.requester.mailingCity) errors['requester.mailingCity'] = 'Requester mailing city is required';
    
    // Country code validation for requester - must be 2 uppercase letters (ISO 3166-1 Alpha-2)
    if (formData.requester.mailingCountry && (!/^[A-Z]{2}$/.test(formData.requester.mailingCountry) || formData.requester.mailingCountry !== formData.requester.mailingCountry.toUpperCase())) {
      errors['requester.mailingCountry'] = 'Requester mailing country must be a 2-character uppercase code (e.g., US, CA, MX)';
    }
    
    // Address validation for requester based on country (US vs non-US)
    const isRequesterUS = formData.requester.mailingCountry === 'US';
    if (isRequesterUS) {
      // US addresses: require state and zipCode, province and postalCode must be empty
      if (!formData.requester.mailingState) errors['requester.mailingState'] = 'Requester state is required for US addresses';
      if (!formData.requester.mailingZipCode) errors['requester.mailingZipCode'] = 'Requester zip code is required for US addresses';
      if (formData.requester.mailingZipCode && !/^\d{5}(-\d{4})?$/.test(formData.requester.mailingZipCode)) {
        errors['requester.mailingZipCode'] = 'Invalid US zip code format';
      }
      if (formData.requester.mailingProvince) {
        errors['requester.mailingProvince'] = 'Province must be empty for US addresses';
      }
      if (formData.requester.mailingPostalCode) {
        errors['requester.mailingPostalCode'] = 'Postal code must be empty for US addresses';
      }
    } else if (formData.requester.mailingCountry) {
      // Non-US addresses: require province and postalCode, state and zipCode must be empty
      if (!formData.requester.mailingProvince) errors['requester.mailingProvince'] = 'Requester province is required for non-US addresses';
      if (!formData.requester.mailingPostalCode) errors['requester.mailingPostalCode'] = 'Requester postal code is required for non-US addresses';
      if (formData.requester.mailingState) {
        errors['requester.mailingState'] = 'State must be empty for non-US addresses';
      }
      if (formData.requester.mailingZipCode) {
        errors['requester.mailingZipCode'] = 'Zip code must be empty for non-US addresses';
      }
    }

    // Family validation - must include both mother and father, minimum 2 members
    if (formData.family.length < 2) {
      errors['family'] = 'Family must include at least 2 members';
    } else {
      const hasMother = formData.family.some(member => member.relation === 'M');
      const hasFather = formData.family.some(member => member.relation === 'F');
      if (!hasMother) errors['family'] = 'Family must include mother (M) relation';
      if (!hasFather) errors['family'] = 'Family must include father (F) relation';
      
      // Validate maiden name only for mothers
      formData.family.forEach((member, index) => {
        if (member.relation === 'M' && member.maidenName && member.maidenName.trim() === '') {
          // Mother can have maiden name but it's optional
        } else if (member.relation !== 'M' && member.maidenName && member.maidenName.trim() !== '') {
          errors[`family.${index}.maidenName`] = 'Only mothers can have maiden names';
        }
      });
    }

    // Representative role validation
    if (formData.representiveRoleToSubjectOfRecord.role === 'OTHERFAMILY' && 
        !formData.representiveRoleToSubjectOfRecord.otherExplain) {
      errors['representiveRoleToSubjectOfRecord.otherExplain'] = 'Other explanation is required when role is Other Family Member';
    }

    // Records requested validation - minimum 1 record required
    if (formData.recordsRequested.length === 0) {
      errors['recordsRequested'] = 'At least one record must be requested';
    } else {
      formData.recordsRequested.forEach((record, index) => {
        if (record.requestedDocumentType === 'OTH' && !record.otherDescription) {
          errors[`recordsRequested.${index}.otherDescription`] = 'Description is required for Other document type';
        }
        
        // Document types that don't allow document dates
        if (['BIRC', 'PASS', 'NATC', 'LPR'].includes(record.requestedDocumentType) && record.requestedDocumentDate) {
          errors[`recordsRequested.${index}.requestedDocumentDate`] = `${record.requestedDocumentType === 'BIRC' ? 'Birth Certificate' : 
                                                                   record.requestedDocumentType === 'PASS' ? 'Passport' :
                                                                   record.requestedDocumentType === 'NATC' ? 'Naturalization Certificate' :
                                                                   'Permanent Resident Card'} cannot have a document date`;
        }
        
        // Other document types must have description
        if (record.requestedDocumentType === 'OTH' && !record.otherDescription?.trim()) {
          errors[`recordsRequested.${index}.otherDescription`] = 'Description is required for Other document type';
        }
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.subject.emailAddress && !emailRegex.test(formData.subject.emailAddress)) {
      errors['subject.emailAddress'] = 'Invalid email format';
    }
    if (formData.requester.emailAddress && !emailRegex.test(formData.requester.emailAddress)) {
      errors['requester.emailAddress'] = 'Invalid email format';
    }

    // Phone validation (optional but must be in international format if provided)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (formData.subject.daytimePhone && !phoneRegex.test(formData.subject.daytimePhone)) {
      errors['subject.daytimePhone'] = 'Phone must be in international format (+1234567890)';
    }
    if (formData.subject.mobilePhone && !phoneRegex.test(formData.subject.mobilePhone)) {
      errors['subject.mobilePhone'] = 'Phone must be in international format (+1234567890)';
    }
    if (formData.requester.daytimePhone && !phoneRegex.test(formData.requester.daytimePhone)) {
      errors['requester.daytimePhone'] = 'Phone must be in international format (+1234567890)';
    }
    if (formData.requester.mobilePhone && !phoneRegex.test(formData.requester.mobilePhone)) {
      errors['requester.mobilePhone'] = 'Phone must be in international format (+1234567890)';
    }

    // Alien number validation (optional but must be 9 digits if provided)
    if (formData.alienNumber && !/^\d{9}$/.test(formData.alienNumber)) {
      errors['alienNumber'] = 'Alien number must be exactly 9 digits';
    }

    // Receipt number validation (optional but must match pattern if provided)
    const receiptRegex = /^[A-Z]{3}\d{10}$/i;
    
    // Validate primary receipt number
    if (formData.receiptNumber && formData.receiptNumber[0] && !receiptRegex.test(formData.receiptNumber[0])) {
      errors['receiptNumber'] = 'Receipt number must be in format: 3 letters + 10 digits';
    }
    
    // Validate additional receipt numbers
    if (formData.receiptNumbers) {
      formData.receiptNumbers.forEach((number, index) => {
        if (number && !receiptRegex.test(number)) {
          errors[`receiptNumbers.${index}`] = 'Receipt number must be in format: 3 letters + 10 digits';
        }
      });
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

    // Handle country code changes - convert to uppercase and clear conflicting fields
    if (name === 'subject.mailingCountry' || name === 'requester.mailingCountry' || name === 'subject.birthCountry') {
      const upperValue = value.toUpperCase().substring(0, 2);
      const isUS = upperValue === 'US';
      
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => {
          const updated = {
            ...prev,
            [parent]: {
              ...(prev[parent as keyof typeof prev] as Record<string, any>),
              [child]: upperValue
            }
          };
          
          // Clear conflicting address fields when country changes
          if (child === 'mailingCountry') {
            const subjectOrRequester = parent as 'subject' | 'requester';
            if (isUS) {
              // Switching to US: clear province and postalCode
              (updated[subjectOrRequester] as any).mailingProvince = '';
              (updated[subjectOrRequester] as any).mailingPostalCode = '';
            } else {
              // Switching to non-US: clear state and zipCode
              (updated[subjectOrRequester] as any).mailingState = '';
              (updated[subjectOrRequester] as any).mailingZipCode = '';
            }
          }
          
          return updated;
        });
        return;
      }
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
      const currentMember = { ...newFamily[index] };
      
      // Clear maiden name if relation changes from mother to something else
      if (field === 'relation' && currentMember.relation === 'M' && value !== 'M') {
        currentMember.maidenName = '';
      }
      
      newFamily[index] = {
        ...currentMember,
        [field]: value
      };
      
      return {
        ...prev,
        family: newFamily
      };
    });
    
    // Clear maiden name error if relation changes
    if (field === 'relation') {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`family.${index}.maidenName`];
        return newErrors;
      });
    }
  };

  const addFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      family: [...prev.family, { firstName: '', lastName: '', relation: '', maidenName: '' }]
    }));
  };

  const removeFamilyMember = (index: number) => {
    setFormData(prev => {
      // Don't allow removing the first two members (mother and father)
      if (index < 2) {
        return prev;
      }
      return {
        ...prev,
        family: prev.family.filter((_, i) => i !== index)
      };
    });
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
      const currentRecord = { ...newRecords[index] };
      
      // Handle special cases for document type changes
      if (field === 'requestedDocumentType') {
        // Clear document date if switching to document types that don't allow it
        if (['BIRC', 'PASS', 'NATC', 'LPR'].includes(value)) {
          currentRecord.requestedDocumentDate = '';
        }
        // Clear other description if switching away from Other
        if (currentRecord.requestedDocumentType === 'OTH' && value !== 'OTH') {
          currentRecord.otherDescription = '';
        }
        // Clear other description for all non-OTH document types
        if (value !== 'OTH') {
          currentRecord.otherDescription = '';
        }
      }
      
      newRecords[index] = {
        ...currentRecord,
        [field]: value
      };
      
      return {
        ...prev,
        recordsRequested: newRecords
      };
    });
    
    // Clear validation errors for this field
    if (formErrors[`recordsRequested.${index}.${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`recordsRequested.${index}.${field}`];
        return newErrors;
      });
    }
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
      const currentDoc = newDocuments[index] || { content: '', fileName: '' };
      
      if (field === 'file' && value instanceof File) {
        // Only store fileName and content, never store the File object
        newDocuments[index] = {
          content: currentDoc.content || '',
          fileName: value.name
        };
      } else if (field === 'content' || field === 'fileName') {
        // Only allow content and fileName fields
        newDocuments[index] = {
          content: field === 'content' ? (value as string) : currentDoc.content || '',
          fileName: field === 'fileName' ? (value as string) : currentDoc.fileName || ''
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

  // Alien Numbers handlers
  const handleAlienNumberChange = (index: number, value: string) => {
    setFormData(prev => {
      const newAlienNumbers = [...(prev.alienNumbers || [])];
      newAlienNumbers[index] = value;
      return {
        ...prev,
        alienNumbers: newAlienNumbers
      };
    });
  };

  const addAlienNumber = () => {
    setFormData(prev => ({
      ...prev,
      alienNumbers: [...(prev.alienNumbers || []), '']
    }));
  };

  const removeAlienNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      alienNumbers: (prev.alienNumbers || []).filter((_, i) => i !== index)
    }));
  };

  // Receipt Numbers handlers
  const handleReceiptNumberChange = (index: number, value: string) => {
    setFormData(prev => {
      const newReceiptNumbers = [...prev.receiptNumbers];
      newReceiptNumbers[index] = value;
      return {
        ...prev,
        receiptNumbers: newReceiptNumbers
      };
    });
  };

  const addReceiptNumber = () => {
    setFormData(prev => ({
      ...prev,
      receiptNumbers: [...prev.receiptNumbers, '']
    }));
  };

  const removeReceiptNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      receiptNumbers: prev.receiptNumbers.filter((_, i) => i !== index)
    }));
  };

  // Clean form data before submission to remove invalid fields
  const cleanFormDataForSubmission = (data: FoiaCaseForm): FoiaCaseForm => {
    const cleanedData = { ...data };
    
    // Clean records requested - remove invalid fields based on document type
    if (cleanedData.recordsRequested) {
      cleanedData.recordsRequested = cleanedData.recordsRequested.map(record => {
        const cleanedRecord = { ...record };
        
        // Remove document date for types that don't allow it
        if (['BIRC', 'PASS', 'NATC', 'LPR'].includes(cleanedRecord.requestedDocumentType)) {
          delete cleanedRecord.requestedDocumentDate;
        }
        
        // Remove other description for types other than OTH
        if (cleanedRecord.requestedDocumentType !== 'OTH') {
          delete cleanedRecord.otherDescription;
        }
        
        return cleanedRecord;
      });
    }
    
    // Clean documents - remove file property, keep only content and fileName
    if (cleanedData.documents) {
      cleanedData.documents = cleanedData.documents.map(doc => {
        const cleanedDoc: { content: string; fileName: string } = {
          content: doc.content || '',
          fileName: doc.fileName || ''
        };
        return cleanedDoc;
      });
    }
    
    // Clean address fields based on country (US vs non-US)
    // Ensure country codes are uppercase (2 characters - ISO 3166-1 Alpha-2)
    if (cleanedData.subject.birthCountry) {
      cleanedData.subject.birthCountry = cleanedData.subject.birthCountry.toUpperCase().substring(0, 2);
    }
    if (cleanedData.subject.mailingCountry) {
      cleanedData.subject.mailingCountry = cleanedData.subject.mailingCountry.toUpperCase().substring(0, 2);
      const isUS = cleanedData.subject.mailingCountry === 'US';
      
      if (isUS) {
        // For US: keep state and zipCode, delete province and postalCode fields (omit them from payload)
        delete (cleanedData.subject as any).mailingProvince;
        delete (cleanedData.subject as any).mailingPostalCode;
        // Ensure state and zipCode are set (keep existing values or set to empty string)
        if (!cleanedData.subject.mailingState) cleanedData.subject.mailingState = '';
        if (!cleanedData.subject.mailingZipCode) cleanedData.subject.mailingZipCode = '';
      } else {
        // For non-US: keep province and postalCode, delete state and zipCode fields (omit them from payload)
        delete (cleanedData.subject as any).mailingState;
        delete (cleanedData.subject as any).mailingZipCode;
        // Ensure province and postalCode are set (keep existing values or set to empty string)
        if (!cleanedData.subject.mailingProvince) cleanedData.subject.mailingProvince = '';
        if (!cleanedData.subject.mailingPostalCode) cleanedData.subject.mailingPostalCode = '';
      }
    }
    
    if (cleanedData.requester.mailingCountry) {
      cleanedData.requester.mailingCountry = cleanedData.requester.mailingCountry.toUpperCase().substring(0, 2);
      const isUS = cleanedData.requester.mailingCountry === 'US';
      
      if (isUS) {
        // For US: keep state and zipCode, delete province and postalCode fields (omit them from payload)
        delete (cleanedData.requester as any).mailingProvince;
        delete (cleanedData.requester as any).mailingPostalCode;
        // Ensure state and zipCode are set (keep existing values or set to empty string)
        if (!cleanedData.requester.mailingState) cleanedData.requester.mailingState = '';
        if (!cleanedData.requester.mailingZipCode) cleanedData.requester.mailingZipCode = '';
      } else {
        // For non-US: keep province and postalCode, delete state and zipCode fields (omit them from payload)
        delete (cleanedData.requester as any).mailingState;
        delete (cleanedData.requester as any).mailingZipCode;
        // Ensure province and postalCode are set (keep existing values or set to empty string)
        if (!cleanedData.requester.mailingProvince) cleanedData.requester.mailingProvince = '';
        if (!cleanedData.requester.mailingPostalCode) cleanedData.requester.mailingPostalCode = '';
      }
    }
    
    return cleanedData;
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
      if (!user?._id) {
        throw new Error('User ID is required');
      }
      
      // Clean the form data before submission
      const cleanedFormData = cleanFormDataForSubmission(formData);
      
      if (isEditMode && id) {
        // Update existing case
        const response = await updateFoiaCase(id, cleanedFormData);
        if (response.success) {
          toast.success('FOIA case updated successfully');
          navigate('/foia-cases');
        } else {
          throw new Error('Failed to update FOIA case');
        }
      } else {
        // Create new case
        const data = {
          userId: user._id,
          formData: cleanedFormData
        };
        const response = await createFoiaCase(data);
        if (response.success) {
          toast.success('FOIA case created successfully');
          // Store the request number for future status checks
          if (response.data.requestNumber) {
            localStorage.setItem('lastRequestNumber', response.data.requestNumber);
          }
          navigate('/foia-cases');
        } else {
          throw new Error('Failed to create FOIA case');
        }
      }
    } catch (err) {
      // Check if it's a USCIS system error
      if (err instanceof Error && (err as any).isUscisError && err.message === 'USCIS_SYSTEM_UNAVAILABLE') {
        const uscisMessage = 'USCIS system may be down for maintenance';
        setError(uscisMessage);
        toast.error(uscisMessage);
      } else {
        const errorMessage = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} FOIA case. Please try again.`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit FOIA Case' : 'Create New FOIA Case'}
      </h1>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          Loading case data...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alien Numbers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Alien Numbers</h2>
          <p className="text-sm text-gray-600 mb-4">
            Alien numbers are optional but must be exactly 9 digits if provided. Multiple alien numbers can be added if needed.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Alien Number</label>
              <input
                type="text"
                name="alienNumber"
                value={formData.alienNumber}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['alienNumber'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter 9-digit alien number"
              />
              {getError('alienNumber')}
              <p className="mt-1 text-xs text-gray-500">Optional: Must be exactly 9 digits if provided</p>
            </div>
            
            {/* Additional Alien Numbers */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Additional Alien Numbers</h3>
              {formData.alienNumbers?.map((number, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Alien Number {index + 1}</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => handleAlienNumberChange(index, e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter alien number"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAlienNumber(index)}
                    className="mt-6 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAlienNumber}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Alien Number
              </button>
            </div>
          </div>
        </div>

        {/* Subject Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Information</h2>
          <p className="text-sm text-gray-600 mb-4">
            All fields marked with * are required. Subject information must be accurate and complete.
          </p>
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
              <label className="block text-sm font-medium text-gray-700">Birth Country *</label>
              <input
                type="text"
                name="subject.birthCountry"
                value={formData.subject.birthCountry}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['subject.birthCountry'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="e.g., US, CA, MX"
              />
              {getError('subject.birthCountry')}
              <p className="mt-1 text-xs text-gray-500">Required: Use 2-letter uppercase country code (e.g., US, CA, MX)</p>
            </div>
          </div>
        </div>

        {/* Subject Mailing Address */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Mailing Address</h2>
          <p className="text-sm text-gray-600 mb-4">
            All fields marked with * are required. For US addresses (US), State and Zip Code are required. For non-US addresses, Province and Postal Code are required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Country *</label>
              <input
                type="text"
                name="subject.mailingCountry"
                value={formData.subject.mailingCountry}
                onChange={handleInputChange}
                maxLength={2}
                className={`mt-1 block w-full border ${
                  formErrors['subject.mailingCountry'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 uppercase`}
                placeholder="e.g., US, CA, MX"
                style={{ textTransform: 'uppercase' }}
              />
              {getError('subject.mailingCountry')}
              <p className="mt-1 text-xs text-gray-500">Required: Use 2-letter uppercase country code (e.g., US, CA, MX)</p>
            </div>
            {formData.subject.mailingCountry === 'US' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State *</label>
                  <input
                    type="text"
                    name="subject.mailingState"
                    value={formData.subject.mailingState}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      formErrors['subject.mailingState'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., CA, NY, TX"
                  />
                  {getError('subject.mailingState')}
                  <p className="mt-1 text-xs text-gray-500">Required for US addresses: Use 2-letter state code</p>
                </div>
              </>
            ) : formData.subject.mailingCountry ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Province *</label>
                  <input
                    type="text"
                    name="subject.mailingProvince"
                    value={formData.subject.mailingProvince}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      formErrors['subject.mailingProvince'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., Ontario, British Columbia"
                  />
                  {getError('subject.mailingProvince')}
                  <p className="mt-1 text-xs text-gray-500">Required for non-US addresses</p>
                </div>
              </>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 1 *</label>
              <input
                type="text"
                name="subject.mailingAddress1"
                value={formData.subject.mailingAddress1}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['subject.mailingAddress1'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('subject.mailingAddress1')}
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
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                name="subject.mailingCity"
                value={formData.subject.mailingCity}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['subject.mailingCity'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('subject.mailingCity')}
            </div>
            {formData.subject.mailingCountry === 'US' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Zip Code *</label>
                <input
                  type="text"
                  name="subject.mailingZipCode"
                  value={formData.subject.mailingZipCode}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border ${
                    formErrors['subject.mailingZipCode'] ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., 12345 or 12345-6789"
                />
                {getError('subject.mailingZipCode')}
                <p className="mt-1 text-xs text-gray-500">Required for US addresses: Use 5 or 9-digit format</p>
              </div>
            ) : formData.subject.mailingCountry ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code *</label>
                <input
                  type="text"
                  name="subject.mailingPostalCode"
                  value={formData.subject.mailingPostalCode}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border ${
                    formErrors['subject.mailingPostalCode'] ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., K1A 0B1, SW1A 1AA"
                />
                {getError('subject.mailingPostalCode')}
                <p className="mt-1 text-xs text-gray-500">Required for non-US addresses</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Subject Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Contact Information</h2>
          <p className="text-sm text-gray-600 mb-4">
            Email address is required. Phone numbers are optional but must be in international format if provided.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Daytime Phone</label>
              <input
                type="tel"
                name="subject.daytimePhone"
                value={formData.subject.daytimePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890 (international format)"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Use international format (+country code + number)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Phone</label>
              <input
                type="tel"
                name="subject.mobilePhone"
                value={formData.subject.mobilePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890 (international format)"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Use international format (+country code + number)</p>
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
                placeholder="e.g., john.doe@example.com"
              />
              {getError('subject.emailAddress')}
              <p className="mt-1 text-xs text-gray-500">Required: Valid email address</p>
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Family Members</h2>
          <p className="text-sm text-gray-600 mb-4">
            Mother and Father are required. Additional family members can be added below.
          </p>
          {formErrors['family'] && (
            <p className="mb-4 text-sm text-red-600">{formErrors['family']}</p>
          )}
          {formData.family.map((member, index) => (
            <div key={index} className="space-y-4 mb-4 border-b pb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">
                  {index === 0 ? 'Mother (Required)' : index === 1 ? 'Father (Required)' : `Family Member ${index + 1}`}
                </h3>
                {index >= 2 && (
                  <button
                    type="button"
                    onClick={() => removeFamilyMember(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
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
                  <label className="block text-sm font-medium text-gray-700">Relation *</label>
                  <select
                    value={member.relation}
                    onChange={(e) => handleFamilyInputChange(index, 'relation', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={index < 2}
                  >
                    <option value="">Select Relation</option>
                    <option value="M">Mother (M)</option>
                    <option value="F">Father (F)</option>
                    <option value="CHI">Child (CHI)</option>
                    <option value="SPO">Spouse (SPO)</option>
                    <option value="SIB">Sibling (SIB)</option>
                    <option value="OTH">Other (OTH)</option>
                  </select>
                </div>
                {member.relation === 'M' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maiden Name</label>
                    <input
                      type="text"
                      value={member.maidenName || ''}
                      onChange={(e) => handleFamilyInputChange(index, 'maidenName', e.target.value)}
                      className={`mt-1 block w-full border ${
                        formErrors[`family.${index}.maidenName`] ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Optional maiden name"
                    />
                    {formErrors[`family.${index}.maidenName`] && (
                      <p className="mt-1 text-sm text-red-600">{formErrors[`family.${index}.maidenName`]}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Optional: Enter maiden name if applicable</p>
                  </div>
                )}
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
          <p className="text-sm text-gray-600 mb-4">
            Aliases are optional. Add any other names the subject has used or been known by.
          </p>
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
          <p className="text-sm text-gray-600 mb-4">
            All fields marked with * are required. This information will be used for correspondence and delivery. For US addresses (US), State and Zip Code are required. For non-US addresses, Province and Postal Code are required.
          </p>
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
                placeholder="e.g., john.doe@example.com"
              />
              {getError('requester.emailAddress')}
              <p className="mt-1 text-xs text-gray-500">Required: Valid email address</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Daytime Phone</label>
              <input
                type="tel"
                name="requester.daytimePhone"
                value={formData.requester.daytimePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890 (international format)"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Use international format (+country code + number)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Phone</label>
              <input
                type="tel"
                name="requester.mobilePhone"
                value={formData.requester.mobilePhone}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890 (international format)"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: Use international format (+country code + number)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing Address 1 *</label>
              <input
                type="text"
                name="requester.mailingAddress1"
                value={formData.requester.mailingAddress1}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['requester.mailingAddress1'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('requester.mailingAddress1')}
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
              <label className="block text-sm font-medium text-gray-700">Mailing City *</label>
              <input
                type="text"
                name="requester.mailingCity"
                value={formData.requester.mailingCity}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${
                  formErrors['requester.mailingCity'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {getError('requester.mailingCity')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mailing Country *</label>
              <input
                type="text"
                name="requester.mailingCountry"
                value={formData.requester.mailingCountry}
                onChange={handleInputChange}
                maxLength={2}
                className={`mt-1 block w-full border ${
                  formErrors['requester.mailingCountry'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 uppercase`}
                placeholder="e.g., US, CA, MX"
                style={{ textTransform: 'uppercase' }}
              />
              {getError('requester.mailingCountry')}
              <p className="mt-1 text-xs text-gray-500">Required: Use 2-letter uppercase country code (e.g., US, CA, MX)</p>
            </div>
            {formData.requester.mailingCountry === 'US' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mailing State *</label>
                  <input
                    type="text"
                    name="requester.mailingState"
                    value={formData.requester.mailingState}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      formErrors['requester.mailingState'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., CA, NY, TX"
                  />
                  {getError('requester.mailingState')}
                  <p className="mt-1 text-xs text-gray-500">Required for US addresses: Use 2-letter state code</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mailing Zip Code *</label>
                  <input
                    type="text"
                    name="requester.mailingZipCode"
                    value={formData.requester.mailingZipCode}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      formErrors['requester.mailingZipCode'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., 12345 or 12345-6789"
                  />
                  {getError('requester.mailingZipCode')}
                  <p className="mt-1 text-xs text-gray-500">Required for US addresses: Use 5 or 9-digit format</p>
                </div>
              </>
            ) : formData.requester.mailingCountry ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mailing Province *</label>
                  <input
                    type="text"
                    name="requester.mailingProvince"
                    value={formData.requester.mailingProvince}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      formErrors['requester.mailingProvince'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., Ontario, British Columbia"
                  />
                  {getError('requester.mailingProvince')}
                  <p className="mt-1 text-xs text-gray-500">Required for non-US addresses</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mailing Postal Code *</label>
                  <input
                    type="text"
                    name="requester.mailingPostalCode"
                    value={formData.requester.mailingPostalCode}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      formErrors['requester.mailingPostalCode'] ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="e.g., K1A 0B1, SW1A 1AA"
                  />
                  {getError('requester.mailingPostalCode')}
                  <p className="mt-1 text-xs text-gray-500">Required for non-US addresses</p>
                </div>
              </>
            ) : null}
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
          <p className="text-sm text-gray-600 mb-4">
            Receipt numbers are optional but must follow the format: 3 letters + 10 digits (e.g., ABC1234567890).
          </p>
          <div className="space-y-4">
            {/* Primary Receipt Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Receipt Number</label>
              <input
                type="text"
                value={formData.receiptNumber[0] || ''}
                onChange={(e) => {
                  const newReceiptNumbers = [...formData.receiptNumber];
                  if (newReceiptNumbers.length === 0) {
                    newReceiptNumbers.push(e.target.value);
                  } else {
                    newReceiptNumbers[0] = e.target.value;
                  }
                  setFormData(prev => ({ ...prev, receiptNumber: newReceiptNumbers }));
                }}
                className={`mt-1 block w-full border ${
                  formErrors['receiptNumber'] ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="e.g., ABC1234567890"
              />
              {getError('receiptNumber')}
              <p className="mt-1 text-xs text-gray-500">Optional: Format: 3 letters + 10 digits (e.g., ABC1234567890)</p>
            </div>
            
            {/* Additional Receipt Numbers */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Additional Receipt Numbers</h3>
              {formData.receiptNumbers.map((number, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Receipt Number {index + 1}</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => handleReceiptNumberChange(index, e.target.value)}
                      className={`mt-1 block w-full border ${
                        formErrors[`receiptNumbers.${index}`] ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="e.g., ABC1234567890"
                    />
                    {formErrors[`receiptNumbers.${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{formErrors[`receiptNumbers.${index}`]}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Format: 3 letters + 10 digits (e.g., ABC1234567890)</p>
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
              <button
                type="button"
                onClick={addReceiptNumber}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Receipt Number
              </button>
            </div>
          </div>
        </div>

        {/* Representative Role */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Representative Role</h2>
          <p className="text-sm text-gray-600 mb-4">
            Specify your relationship to the subject of the FOIA request. If you are an attorney, select "Attorney". If you are a family member, select "Other Family Member" and provide an explanation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="representiveRoleToSubjectOfRecord.role"
                value={formData.representiveRoleToSubjectOfRecord.role}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Role</option>
                <option value="ATTORNEY">Attorney</option>
                <option value="OTHERFAMILY">Other Family Member</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Other Explanation</label>
              <input
                type="text"
                name="representiveRoleToSubjectOfRecord.otherExplain"
                value={formData.representiveRoleToSubjectOfRecord.otherExplain}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Required if role is Other Family Member"
              />
              {getError('representiveRoleToSubjectOfRecord.otherExplain')}
            </div>
          </div>
        </div>

        {/* Delivery and Consent */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery and Consent</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select your preferred delivery method and consent method for receiving FOIA records.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Digital Delivery</label>
              <select
                name="digitalDelivery"
                value={formData.digitalDelivery}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Delivery Method</option>
                <option value="MY_ACCOUNT">My USCIS Account</option>
                <option value="LEGACY">Legacy System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Consent Method</label>
              <select
                name="preferredConsentMethod"
                value={formData.preferredConsentMethod}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Consent Method</option>
                <option value="NOTARIZED">Notarized</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Court Proceedings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Court Proceedings</h2>
          <p className="text-sm text-gray-600 mb-4">
            Indicate if there are any ongoing or completed court proceedings related to this FOIA request.
          </p>
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
          <p className="text-sm text-gray-600 mb-4">
            At least one record must be requested. Select the document type and provide additional details as needed. 
            Note: Birth Certificates, Passports, Naturalization Certificates, and Permanent Resident Cards do not require document dates.
            Only "Other" document types require a description.
          </p>
          {formErrors['recordsRequested'] && (
            <p className="mb-4 text-sm text-red-600">{formErrors['recordsRequested']}</p>
          )}
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
                  <select
                    value={record.requestedDocumentType}
                    onChange={(e) => handleRecordInputChange(index, 'requestedDocumentType', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Document Type</option>
                    <option value="BIRC">Birth Certificate (BIRC)</option>
                    <option value="PASS">Passport (PASS)</option>
                    <option value="I129">I-129 (Petition for Nonimmigrant Worker)</option>
                    <option value="I90">I-90 (Application to Replace Permanent Resident Card)</option>
                    <option value="I130">I-130 (Petition for Alien Relative)</option>
                    <option value="I140">I-140 (Immigrant Petition for Alien Worker)</option>
                    <option value="I485">I-485 (Application to Register Permanent Residence)</option>
                    <option value="I751">I-751 (Petition to Remove Conditions on Residence)</option>
                    <option value="N400">N-400 (Application for Naturalization)</option>
                    <option value="LABC">Labor Certification (LABC)</option>
                    <option value="NATC">Naturalization Certificate (NATC)</option>
                    <option value="LPR">Permanent Resident Card (LPR)</option>
                    <option value="APPR">Approval Notice (APPR)</option>
                    <option value="I94">I-94 (Arrival/Departure Record)</option>
                    <option value="OAD">Order of Deportation (OAD)</option>
                    <option value="RRUS">Removal Order (RRUS)</option>
                    <option value="OTH">Other (OTH)</option>
                  </select>
                </div>
                {/* Only show description field for Other document type */}
                {record.requestedDocumentType === 'OTH' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={record.otherDescription || ''}
                      onChange={(e) => handleRecordInputChange(index, 'otherDescription', e.target.value)}
                      className={`mt-1 block w-full border ${
                        formErrors[`recordsRequested.${index}.otherDescription`] ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      rows={3}
                      placeholder="Required for Other document type"
                      required={true}
                    />
                    {formErrors[`recordsRequested.${index}.otherDescription`] && (
                      <p className="mt-1 text-sm text-red-600">{formErrors[`recordsRequested.${index}.otherDescription`]}</p>
                    )}
                    <p className="mt-1 text-xs text-red-500">Description is required for Other document type</p>
                  </div>
                )}
                {/* Only show document date for document types that allow it */}
                {!['BIRC', 'PASS', 'NATC', 'LPR'].includes(record.requestedDocumentType) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Document Date</label>
                    <input
                      type="date"
                      value={record.requestedDocumentDate || ''}
                      onChange={(e) => handleRecordInputChange(index, 'requestedDocumentDate', e.target.value)}
                      className={`mt-1 block w-full border ${
                        formErrors[`recordsRequested.${index}.requestedDocumentDate`] ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {formErrors[`recordsRequested.${index}.requestedDocumentDate`] && (
                      <p className="mt-1 text-sm text-red-600">{formErrors[`recordsRequested.${index}.requestedDocumentDate`]}</p>
                    )}
                  </div>
                )}
                
                {/* Show info message for document types that don't allow dates */}
                {['BIRC', 'PASS', 'NATC', 'LPR'].includes(record.requestedDocumentType) && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">
                      Document date is not applicable for {record.requestedDocumentType === 'BIRC' ? 'Birth Certificates' : 
                                                         record.requestedDocumentType === 'PASS' ? 'Passports' :
                                                         record.requestedDocumentType === 'NATC' ? 'Naturalization Certificates' :
                                                         'Permanent Resident Cards'}
                    </p>
                  </div>
                )}
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
          <p className="text-sm text-gray-600 mb-4">
            Check any qualifications that apply to your request for expedited processing. These are optional but can help prioritize your case.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Physical Threat</label>
              <input
                type="checkbox"
                name="qualificationsForExpeditedProcessing.physicalThreat"
                checked={formData.qualificationsForExpeditedProcessing.physicalThreat}
                onChange={(e) => setFormData(prev => ({ ...prev, qualificationsForExpeditedProcessing: { ...prev.qualificationsForExpeditedProcessing, physicalThreat: e.target.checked } }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inform Public</label>
              <input
                type="checkbox"
                name="qualificationsForExpeditedProcessing.informPublic"
                checked={formData.qualificationsForExpeditedProcessing.informPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, qualificationsForExpeditedProcessing: { ...prev.qualificationsForExpeditedProcessing, informPublic: e.target.checked } }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Process</label>
              <input
                type="checkbox"
                name="qualificationsForExpeditedProcessing.dueProcess"
                checked={formData.qualificationsForExpeditedProcessing.dueProcess}
                onChange={(e) => setFormData(prev => ({ ...prev, qualificationsForExpeditedProcessing: { ...prev.qualificationsForExpeditedProcessing, dueProcess: e.target.checked } }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Media Interest</label>
              <input
                type="checkbox"
                name="qualificationsForExpeditedProcessing.mediaInterest"
                checked={formData.qualificationsForExpeditedProcessing.mediaInterest}
                onChange={(e) => setFormData(prev => ({ ...prev, qualificationsForExpeditedProcessing: { ...prev.qualificationsForExpeditedProcessing, mediaInterest: e.target.checked } }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
          <p className="text-sm text-gray-600 mb-4">
            Supporting documents are optional but can help expedite your request. Upload files or provide content descriptions.
          </p>
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
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Update FOIA Case' : 'Create FOIA Case'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoiaCaseFormPage; 