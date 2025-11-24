import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIndividualClient } from '../../controllers/ClientControllers';
import Logo from '../../components/layout/Logo';
import { Shield, Users, Check, ArrowRight, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

type SubscriptionPlan = 'starter' | 'family';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'plan' | 'form'>('plan');
  const [, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const sections = [
    'Basic Information',
    'Address & Birth',
    'Personal Details',
    'Identification',
    'Employment & Education',
    'Travel & Financial',
    'History & Additional'
  ];

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nationality: '',
    dateOfBirth: '',
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    
    // Place of Birth
    placeOfBirth: {
      city: '',
      state: '',
      country: ''
    },
    
    // Personal Information
    gender: '',
    maritalStatus: '',
    immigrationPurpose: '',
    
    // Identification
    passportNumber: '',
    alienRegistrationNumber: '',
    nationalIdNumber: '',
    
    // Spouse Information
    spouse: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      alienRegistrationNumber: ''
    },
    
    // Children Information
    children: [] as Array<{
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      alienRegistrationNumber: ''
    }>,
    
    // Employment Information
    employment: {
      currentEmployer: {
        name: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      },
      jobTitle: '',
      employmentStartDate: '',
      annualIncome: 0
    },
    
    // Education Information
    education: {
      highestLevel: '',
      institutionName: '',
      datesAttended: {
        startDate: '',
        endDate: ''
      },
      fieldOfStudy: ''
    },
    
    // Travel History
    travelHistory: [] as Array<{
      country: '',
      visitDate: '',
      purpose: '',
      duration: 0
    }>,
    
    // Financial Information
    financialInfo: {
      annualIncome: 0,
      sourceOfFunds: '',
      bankAccountBalance: 0
    },
    
    // Criminal History
    criminalHistory: {
      hasCriminalRecord: false,
      details: ''
    },
    
    // Medical History
    medicalHistory: {
      hasMedicalConditions: false,
      details: ''
    },
    
    // Additional Information
    bio: ''
  });

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSubscriptionPlan(plan);
    setStep('form');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Clear error for this field when user types (handles both direct and nested fields)
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Handle nested object fields
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        
        // Recursive function to update nested objects
        const updateNested = (obj: any, keys: string[], value: any, index: number = 0): any => {
          if (index === keys.length - 1) {
            // Last key - set the value
            return { ...obj, [keys[index]]: type === 'number' ? Number(value) : value };
          }
          
          // Not the last key - recurse deeper
          const currentKey = keys[index];
          const currentValue = obj[currentKey] || {};
          return {
            ...obj,
            [currentKey]: updateNested(currentValue, keys, value, index + 1)
          };
        };
        
        return updateNested(newData, parts, value);
      });
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: type === 'number' ? Number(value) : value
        };
        
        // Clear spouse and children data if marital status is changed to single
        if (name === 'maritalStatus' && value === 'single') {
          newData.spouse = {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            nationality: '',
            alienRegistrationNumber: ''
          };
          newData.children = [];
          
          // Clear spouse and children related errors
          setFormErrors(prev => {
            const newErrors = { ...prev };
            Object.keys(newErrors).forEach(key => {
              if (key.startsWith('spouse.') || key.startsWith('children.')) {
                delete newErrors[key];
              }
            });
            return newErrors;
          });
        }
        
        return newData;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof typeof prev] as any;
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [child]: checked
          }
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        alienRegistrationNumber: ''
      }]
    }));
  };

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
    
    // Clear error for this field when user types
    const errorKey = `children.${index}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addTravelHistory = () => {
    setFormData(prev => ({
      ...prev,
      travelHistory: [...prev.travelHistory, {
        country: '',
        visitDate: '',
        purpose: '',
        duration: 0
      }]
    }));
  };

  const removeTravelHistory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      travelHistory: prev.travelHistory.filter((_, i) => i !== index)
    }));
  };

  const updateTravelHistory = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      travelHistory: prev.travelHistory.map((travel, i) => 
        i === index ? { ...travel, [field]: value } : travel
      )
    }));
    
    // Clear error for this field when user types
    const errorKey = `travelHistory.${index}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateCurrentSection = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentSection) {
      case 0: // Basic Information
        if (!formData.firstName?.trim()) errors['firstName'] = 'First name is required';
        if (!formData.lastName?.trim()) errors['lastName'] = 'Last name is required';
        if (!formData.email?.trim()) errors['email'] = 'Email address is required';
        if (!formData.password) errors['password'] = 'Password is required';
        if (formData.password && formData.password.length < 8) errors['password'] = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) errors['confirmPassword'] = 'Passwords do not match';
        if (!formData.dateOfBirth) errors['dateOfBirth'] = 'Date of birth is required';
        if (!formData.phone?.trim()) errors['phone'] = 'Phone number is required';
        if (!formData.nationality?.trim()) errors['nationality'] = 'Nationality is required';
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          errors['email'] = 'Invalid email format';
        }
        
        // Phone validation (must be in international format)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
          errors['phone'] = 'Phone must be in international format (+1234567890)';
        }
        break;

      case 1: // Address & Birth
        if (!formData.address?.street?.trim()) errors['address.street'] = 'Street address is required';
        if (!formData.address?.city?.trim()) errors['address.city'] = 'City is required';
        if (!formData.address?.state?.trim()) errors['address.state'] = 'State/Province is required';
        if (!formData.address?.zipCode?.trim()) errors['address.zipCode'] = 'ZIP/Postal code is required';
        if (!formData.address?.country?.trim()) errors['address.country'] = 'Country is required';
        
        // US-specific validations for zip code format
        if (formData.address?.country === 'United States' || formData.address?.country === 'US') {
          if (formData.address?.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.address.zipCode)) {
            errors['address.zipCode'] = 'Invalid US zip code format (e.g., 12345 or 12345-6789)';
          }
        }
        
        if (!formData.placeOfBirth?.city?.trim()) errors['placeOfBirth.city'] = 'Birth city is required';
        if (!formData.placeOfBirth?.state?.trim()) errors['placeOfBirth.state'] = 'Birth state/province is required';
        if (!formData.placeOfBirth?.country?.trim()) errors['placeOfBirth.country'] = 'Birth country is required';
        break;

      case 2: // Personal Details
        if (!formData.gender) errors['gender'] = 'Gender is required';
        if (!formData.maritalStatus) errors['maritalStatus'] = 'Marital status is required';
        if (!formData.immigrationPurpose) errors['immigrationPurpose'] = 'Immigration purpose is required';
        if (!formData.bio?.trim()) errors['bio'] = 'Bio/Additional information is required';
        
        // Spouse validation (if married)
        if (formData.maritalStatus !== 'single' && formData.maritalStatus !== '') {
          if (!formData.spouse?.firstName?.trim()) errors['spouse.firstName'] = 'Spouse first name is required';
          if (!formData.spouse?.lastName?.trim()) errors['spouse.lastName'] = 'Spouse last name is required';
          if (!formData.spouse?.dateOfBirth) errors['spouse.dateOfBirth'] = 'Spouse date of birth is required';
          if (!formData.spouse?.nationality?.trim()) errors['spouse.nationality'] = 'Spouse nationality is required';
          if (!formData.spouse?.alienRegistrationNumber?.trim()) errors['spouse.alienRegistrationNumber'] = 'Spouse A-Number is required';
          
          if (formData.spouse?.alienRegistrationNumber && !/^\d{9}$/.test(formData.spouse.alienRegistrationNumber)) {
            errors['spouse.alienRegistrationNumber'] = 'Alien registration number must be exactly 9 digits';
          }
        }
        
        // Children validation (only if NOT single)
        if (formData.maritalStatus !== 'single' && formData.maritalStatus !== '') {
          formData.children?.forEach((child, index) => {
            if (!child?.firstName?.trim()) errors[`children.${index}.firstName`] = 'Child first name is required';
            if (!child?.lastName?.trim()) errors[`children.${index}.lastName`] = 'Child last name is required';
            if (!child?.dateOfBirth) errors[`children.${index}.dateOfBirth`] = 'Child date of birth is required';
            if (!child?.nationality?.trim()) errors[`children.${index}.nationality`] = 'Child nationality is required';
            if (!child?.alienRegistrationNumber?.trim()) errors[`children.${index}.alienRegistrationNumber`] = 'Child A-Number is required';
            
            if (child?.alienRegistrationNumber && !/^\d{9}$/.test(child.alienRegistrationNumber)) {
              errors[`children.${index}.alienRegistrationNumber`] = 'Alien registration number must be exactly 9 digits';
            }
          });
        }
        break;

      case 3: // Identification
        if (!formData.passportNumber?.trim()) errors['passportNumber'] = 'Passport number is required';
        if (!formData.alienRegistrationNumber?.trim()) errors['alienRegistrationNumber'] = 'A-Number is required';
        if (!formData.nationalIdNumber?.trim()) errors['nationalIdNumber'] = 'National ID number is required';
        
        if (formData.alienRegistrationNumber && !/^\d{9}$/.test(formData.alienRegistrationNumber)) {
          errors['alienRegistrationNumber'] = 'Alien registration number must be exactly 9 digits';
        }
        break;

      case 4: // Employment & Education
        if (!formData.employment?.currentEmployer?.name?.trim()) errors['employment.currentEmployer.name'] = 'Current employer name is required';
        if (!formData.employment?.jobTitle?.trim()) errors['employment.jobTitle'] = 'Job title is required';
        if (!formData.employment?.employmentStartDate) errors['employment.employmentStartDate'] = 'Employment start date is required';
        if (!formData.employment?.annualIncome || formData.employment.annualIncome <= 0) {
          errors['employment.annualIncome'] = 'Annual income is required and must be greater than 0';
        }
        
        // Employment address validation
        if (!formData.employment?.currentEmployer?.address?.street?.trim()) {
          errors['employment.currentEmployer.address.street'] = 'Employer street address is required';
        }
        if (!formData.employment?.currentEmployer?.address?.city?.trim()) {
          errors['employment.currentEmployer.address.city'] = 'Employer city is required';
        }
        if (!formData.employment?.currentEmployer?.address?.state?.trim()) {
          errors['employment.currentEmployer.address.state'] = 'Employer state is required';
        }
        if (!formData.employment?.currentEmployer?.address?.zipCode?.trim()) {
          errors['employment.currentEmployer.address.zipCode'] = 'Employer zip code is required';
        }
        if (!formData.employment?.currentEmployer?.address?.country?.trim()) {
          errors['employment.currentEmployer.address.country'] = 'Employer country is required';
        }
        
        // US-specific validations for employer address zip code format
        if (formData.employment?.currentEmployer?.address?.country === 'United States' || 
            formData.employment?.currentEmployer?.address?.country === 'US') {
          if (formData.employment?.currentEmployer?.address?.zipCode && 
              !/^\d{5}(-\d{4})?$/.test(formData.employment.currentEmployer.address.zipCode)) {
            errors['employment.currentEmployer.address.zipCode'] = 'Invalid US zip code format';
          }
        }
        
        if (!formData.education?.highestLevel) errors['education.highestLevel'] = 'Highest education level is required';
        if (!formData.education?.institutionName?.trim()) errors['education.institutionName'] = 'Institution name is required';
        if (!formData.education?.datesAttended?.startDate) errors['education.datesAttended.startDate'] = 'Education start date is required';
        if (!formData.education?.datesAttended?.endDate) errors['education.datesAttended.endDate'] = 'Education end date is required';
        if (!formData.education?.fieldOfStudy?.trim()) errors['education.fieldOfStudy'] = 'Field of study is required';
        break;

      case 5: // Travel & Financial
        // Travel history is optional, but if entries exist, they must be valid
        formData.travelHistory?.forEach((travel, index) => {
          if (!travel?.country?.trim()) errors[`travelHistory.${index}.country`] = 'Country is required';
          if (!travel?.visitDate) errors[`travelHistory.${index}.visitDate`] = 'Visit date is required';
          if (!travel?.purpose) errors[`travelHistory.${index}.purpose`] = 'Purpose is required';
          if (travel?.duration === undefined || travel.duration <= 0) {
            errors[`travelHistory.${index}.duration`] = 'Duration is required and must be greater than 0';
          }
        });
        
        if (!formData.financialInfo?.annualIncome || formData.financialInfo.annualIncome <= 0) {
          errors['financialInfo.annualIncome'] = 'Annual income is required and must be greater than 0';
        }
        if (!formData.financialInfo?.sourceOfFunds?.trim()) {
          errors['financialInfo.sourceOfFunds'] = 'Source of funds is required';
        }
        if (!formData.financialInfo?.bankAccountBalance || formData.financialInfo.bankAccountBalance < 0) {
          errors['financialInfo.bankAccountBalance'] = 'Bank account balance is required and cannot be negative';
        }
        break;

      case 6: // History & Additional
        if (formData.criminalHistory?.hasCriminalRecord && !formData.criminalHistory?.details?.trim()) {
          errors['criminalHistory.details'] = 'Criminal history details are required when criminal record is checked';
        }
        if (formData.medicalHistory?.hasMedicalConditions && !formData.medicalHistory?.details?.trim()) {
          errors['medicalHistory.details'] = 'Medical history details are required when medical conditions are checked';
        }
        break;
    }

    // Update form errors - merge current section errors with existing errors
    setFormErrors(prev => {
      const newErrors = { ...prev };
      
      // Clear errors for current section fields before adding new ones
      const sectionFieldPrefixes: Record<number, string[]> = {
        0: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone', 'dateOfBirth'],
        1: ['address.', 'placeOfBirth.'],
        2: ['gender', 'maritalStatus', 'immigrationPurpose', 'spouse.', 'children.'],
        3: ['alienRegistrationNumber'],
        4: ['employment.', 'education.'],
        5: ['travelHistory.', 'financialInfo.'],
        6: ['criminalHistory.', 'medicalHistory.']
      };
      
      const prefixes = sectionFieldPrefixes[currentSection] || [];
      Object.keys(newErrors).forEach(key => {
        if (prefixes.some(prefix => key.startsWith(prefix))) {
          delete newErrors[key];
        }
      });
      
      // Add new errors for current section
      Object.keys(errors).forEach(key => {
        newErrors[key] = errors[key];
      });
      
      return newErrors;
    });

    return Object.keys(errors).length === 0;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic Information - Required fields
    if (!formData.firstName?.trim()) errors['firstName'] = 'First name is required';
    if (!formData.lastName?.trim()) errors['lastName'] = 'Last name is required';
    if (!formData.email?.trim()) errors['email'] = 'Email address is required';
    if (!formData.password) errors['password'] = 'Password is required';
    if (formData.password && formData.password.length < 8) errors['password'] = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) errors['confirmPassword'] = 'Passwords do not match';
    if (!formData.dateOfBirth) errors['dateOfBirth'] = 'Date of birth is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors['email'] = 'Invalid email format';
    }

    // Phone validation (must be in international format)
    if (!formData.phone?.trim()) errors['phone'] = 'Phone number is required';
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors['phone'] = 'Phone must be in international format (+1234567890)';
    }

    // Nationality validation
    if (!formData.nationality?.trim()) errors['nationality'] = 'Nationality is required';

    // Address validation
    if (!formData.address?.street?.trim()) errors['address.street'] = 'Street address is required';
    if (!formData.address?.city?.trim()) errors['address.city'] = 'City is required';
    if (!formData.address?.state?.trim()) errors['address.state'] = 'State/Province is required';
    if (!formData.address?.zipCode?.trim()) errors['address.zipCode'] = 'ZIP/Postal code is required';
    if (!formData.address?.country?.trim()) errors['address.country'] = 'Country is required';
    
    // US-specific validations for zip code format
    if (formData.address?.country === 'United States' || formData.address?.country === 'US') {
      if (formData.address?.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.address.zipCode)) {
        errors['address.zipCode'] = 'Invalid US zip code format (e.g., 12345 or 12345-6789)';
      }
    }

    // Place of Birth validation
    if (!formData.placeOfBirth?.city?.trim()) errors['placeOfBirth.city'] = 'Birth city is required';
    if (!formData.placeOfBirth?.state?.trim()) errors['placeOfBirth.state'] = 'Birth state/province is required';
    if (!formData.placeOfBirth?.country?.trim()) errors['placeOfBirth.country'] = 'Birth country is required';

    // Personal Details validation
    if (!formData.gender) errors['gender'] = 'Gender is required';
    if (!formData.maritalStatus) errors['maritalStatus'] = 'Marital status is required';
    if (!formData.immigrationPurpose) errors['immigrationPurpose'] = 'Immigration purpose is required';
    if (!formData.bio?.trim()) errors['bio'] = 'Bio/Additional information is required';

    // Spouse validation (if married)
    if (formData.maritalStatus !== 'single' && formData.maritalStatus !== '') {
      if (!formData.spouse?.firstName?.trim()) errors['spouse.firstName'] = 'Spouse first name is required';
      if (!formData.spouse?.lastName?.trim()) errors['spouse.lastName'] = 'Spouse last name is required';
      if (!formData.spouse?.dateOfBirth) errors['spouse.dateOfBirth'] = 'Spouse date of birth is required';
      if (!formData.spouse?.nationality?.trim()) errors['spouse.nationality'] = 'Spouse nationality is required';
      if (!formData.spouse?.alienRegistrationNumber?.trim()) errors['spouse.alienRegistrationNumber'] = 'Spouse A-Number is required';
      
      // Alien registration number validation (must be 9 digits)
      if (formData.spouse?.alienRegistrationNumber && !/^\d{9}$/.test(formData.spouse.alienRegistrationNumber)) {
        errors['spouse.alienRegistrationNumber'] = 'Alien registration number must be exactly 9 digits';
      }
    }

    // Children validation (only if NOT single)
    if (formData.maritalStatus !== 'single' && formData.maritalStatus !== '') {
      formData.children?.forEach((child, index) => {
        if (!child?.firstName?.trim()) errors[`children.${index}.firstName`] = 'Child first name is required';
        if (!child?.lastName?.trim()) errors[`children.${index}.lastName`] = 'Child last name is required';
        if (!child?.dateOfBirth) errors[`children.${index}.dateOfBirth`] = 'Child date of birth is required';
        if (!child?.nationality?.trim()) errors[`children.${index}.nationality`] = 'Child nationality is required';
        if (!child?.alienRegistrationNumber?.trim()) errors[`children.${index}.alienRegistrationNumber`] = 'Child A-Number is required';
        
        // Alien registration number validation (must be 9 digits)
        if (child?.alienRegistrationNumber && !/^\d{9}$/.test(child.alienRegistrationNumber)) {
          errors[`children.${index}.alienRegistrationNumber`] = 'Alien registration number must be exactly 9 digits';
        }
      });
    }

    // Identification validation
    if (!formData.passportNumber?.trim()) errors['passportNumber'] = 'Passport number is required';
    if (!formData.alienRegistrationNumber?.trim()) errors['alienRegistrationNumber'] = 'A-Number is required';
    if (!formData.nationalIdNumber?.trim()) errors['nationalIdNumber'] = 'National ID number is required';
    
    // Alien registration number validation (must be 9 digits)
    if (formData.alienRegistrationNumber && !/^\d{9}$/.test(formData.alienRegistrationNumber)) {
      errors['alienRegistrationNumber'] = 'Alien registration number must be exactly 9 digits';
    }

    // Employment validation
    if (!formData.employment?.currentEmployer?.name?.trim()) errors['employment.currentEmployer.name'] = 'Current employer name is required';
    if (!formData.employment?.jobTitle?.trim()) errors['employment.jobTitle'] = 'Job title is required';
    if (!formData.employment?.employmentStartDate) errors['employment.employmentStartDate'] = 'Employment start date is required';
    if (!formData.employment?.annualIncome || formData.employment.annualIncome <= 0) {
      errors['employment.annualIncome'] = 'Annual income is required and must be greater than 0';
    }
    
    // Employment address validation
    if (!formData.employment?.currentEmployer?.address?.street?.trim()) {
      errors['employment.currentEmployer.address.street'] = 'Employer street address is required';
    }
    if (!formData.employment?.currentEmployer?.address?.city?.trim()) {
      errors['employment.currentEmployer.address.city'] = 'Employer city is required';
    }
    if (!formData.employment?.currentEmployer?.address?.state?.trim()) {
      errors['employment.currentEmployer.address.state'] = 'Employer state is required';
    }
    if (!formData.employment?.currentEmployer?.address?.zipCode?.trim()) {
      errors['employment.currentEmployer.address.zipCode'] = 'Employer zip code is required';
    }
    if (!formData.employment?.currentEmployer?.address?.country?.trim()) {
      errors['employment.currentEmployer.address.country'] = 'Employer country is required';
    }
    
    // US-specific validations for employer address zip code format
    if (formData.employment?.currentEmployer?.address?.country === 'United States' || 
        formData.employment?.currentEmployer?.address?.country === 'US') {
      if (formData.employment?.currentEmployer?.address?.zipCode && 
          !/^\d{5}(-\d{4})?$/.test(formData.employment.currentEmployer.address.zipCode)) {
        errors['employment.currentEmployer.address.zipCode'] = 'Invalid US zip code format';
      }
    }

    // Education validation
    if (!formData.education?.highestLevel) errors['education.highestLevel'] = 'Highest education level is required';
    if (!formData.education?.institutionName?.trim()) errors['education.institutionName'] = 'Institution name is required';
    if (!formData.education?.datesAttended?.startDate) errors['education.datesAttended.startDate'] = 'Education start date is required';
    if (!formData.education?.datesAttended?.endDate) errors['education.datesAttended.endDate'] = 'Education end date is required';
    if (!formData.education?.fieldOfStudy?.trim()) errors['education.fieldOfStudy'] = 'Field of study is required';

    // Travel History validation (optional - only validate entries if they exist)
    formData.travelHistory?.forEach((travel, index) => {
      if (!travel?.country?.trim()) errors[`travelHistory.${index}.country`] = 'Country is required';
      if (!travel?.visitDate) errors[`travelHistory.${index}.visitDate`] = 'Visit date is required';
      if (!travel?.purpose) errors[`travelHistory.${index}.purpose`] = 'Purpose is required';
      if (travel?.duration === undefined || travel.duration <= 0) {
        errors[`travelHistory.${index}.duration`] = 'Duration is required and must be greater than 0';
      }
    });

    // Financial Information validation
    if (!formData.financialInfo?.annualIncome || formData.financialInfo.annualIncome <= 0) {
      errors['financialInfo.annualIncome'] = 'Annual income is required and must be greater than 0';
    }
    if (!formData.financialInfo?.sourceOfFunds?.trim()) {
      errors['financialInfo.sourceOfFunds'] = 'Source of funds is required';
    }
    if (!formData.financialInfo?.bankAccountBalance || formData.financialInfo.bankAccountBalance < 0) {
      errors['financialInfo.bankAccountBalance'] = 'Bank account balance is required and cannot be negative';
    }

    // Criminal History validation
    if (formData.criminalHistory?.hasCriminalRecord && !formData.criminalHistory?.details?.trim()) {
      errors['criminalHistory.details'] = 'Criminal history details are required when criminal record is checked';
    }

    // Medical History validation
    if (formData.medicalHistory?.hasMedicalConditions && !formData.medicalHistory?.details?.trim()) {
      errors['medicalHistory.details'] = 'Medical history details are required when medical conditions are checked';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    // Only allow submission on the last step
    if (currentSection !== sections.length - 1) {
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    
    setLoading(true);

    try {

      // Create individual client
      const clientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        nationality: formData.nationality,
        address: formData.address,
        role: 'client' as const,
        userType: 'individualUser' as const,
        attorneyIds: [],
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        maritalStatus: formData.maritalStatus as 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'civil_union',
        immigrationPurpose: formData.immigrationPurpose as 'family_reunification' | 'employment' | 'education' | 'asylum' | 'investment' | 'diversity_lottery' | 'other',
        passportNumber: formData.passportNumber,
        alienRegistrationNumber: formData.alienRegistrationNumber,
        nationalIdNumber: formData.nationalIdNumber,
        spouse: formData.spouse,
        children: formData.children,
        employment: formData.employment,
        education: {
          ...formData.education,
          highestLevel: formData.education.highestLevel as 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctorate' | 'other' | undefined
        },
        travelHistory: formData.travelHistory.map(travel => ({
          ...travel,
          purpose: travel.purpose as 'tourism' | 'business' | 'education' | 'family' | 'other'
        })),
        financialInfo: {
          ...formData.financialInfo,
          sourceOfFunds: formData.financialInfo.sourceOfFunds as 'employment' | 'investment' | 'family' | 'savings' | 'other' | undefined
        },
        criminalHistory: formData.criminalHistory,
        medicalHistory: formData.medicalHistory,
        bio: formData.bio,
        status: 'Active' as const,
        active: true
      };

      await createIndividualClient(clientData);

      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add error display helper
  const getError = (fieldName: string) => {
    return formErrors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{formErrors[fieldName]}</p>
    ) : null;
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handlePlanSelect('starter')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Starter</h3>
          <p className="text-gray-600 text-center mb-4">
            Single user subscription
          </p>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Basic form filling
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Document upload
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Email support
            </li>
          </ul>
        </button>

        <button
          onClick={() => handlePlanSelect('family')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Family</h3>
          <p className="text-gray-600 text-center mb-4">
            Up to 5 users
          </p>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              All Starter features
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Multiple user accounts
            </li>
            <li className="flex items-center text-gray-600">
              <Check className="h-5 w-5 text-primary-600 mr-2" />
              Priority support
            </li>
          </ul>
        </button>
      </div>
    </div>
  );

  const renderSectionNavigation = () => (
    <div className="mb-8 bg-white sticky top-0 z-10 pb-4 border-b border-gray-200 -mx-8 px-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {sections[currentSection]}
        </h2>
        <div className="text-sm text-gray-500 font-medium">
          Step {currentSection + 1} of {sections.length}
        </div>
      </div>
      
      <div className="flex space-x-2 mb-6">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              // Allow backward navigation without validation
              if (index <= currentSection) {
                setCurrentSection(index);
              } else {
                // Validate current section before moving forward
                if (validateCurrentSection()) {
                  setCurrentSection(index);
                } else {
                  toast.error('Please fix the errors in the current section before proceeding');
                  // Scroll to first error
                  const firstErrorField = Object.keys(formErrors).find(key => {
                    const sectionFieldPrefixes: Record<number, string[]> = {
                      0: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone', 'dateOfBirth', 'nationality'],
                      1: ['address.', 'placeOfBirth.'],
                      2: ['gender', 'maritalStatus', 'immigrationPurpose', 'spouse.', 'children.', 'bio'],
                      3: ['passportNumber', 'alienRegistrationNumber', 'nationalIdNumber'],
                      4: ['employment.', 'education.'],
                      5: ['travelHistory', 'travelHistory.', 'financialInfo.'],
                      6: ['criminalHistory.', 'medicalHistory.']
                    };
                    const prefixes = sectionFieldPrefixes[currentSection] || [];
                    return prefixes.some(prefix => key.startsWith(prefix));
                  });
                  
                  if (firstErrorField) {
                    const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
                    if (errorElement) {
                      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      (errorElement as HTMLElement).focus();
                    }
                  }
                }
              }
            }}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              index === currentSection
                ? 'bg-primary-600 text-white'
                : index < currentSection
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['firstName'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          />
          {getError('firstName')}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['lastName'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          />
          {getError('lastName')}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            formErrors['email'] ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
        />
        {getError('email')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['password'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          />
          {getError('password')}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['confirmPassword'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          />
          {getError('confirmPassword')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['phone'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            placeholder="+1234567890 (international format)"
          />
          {getError('phone')}
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
            Nationality *
          </label>
          <input
            type="text"
            id="nationality"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['nationality'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          />
          {getError('nationality')}
        </div>
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth *
        </label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            formErrors['dateOfBirth'] ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
        />
        {getError('dateOfBirth')}
      </div>
    </div>
  );

  const renderAddressAndBirth = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
              Street Address *
            </label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['address.street'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('address.street')}
          </div>
          <div>
            <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              id="address.city"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['address.city'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('address.city')}
          </div>
          <div>
            <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
              State/Province *
            </label>
            <input
              type="text"
              id="address.state"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['address.state'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('address.state')}
          </div>
          <div>
            <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700">
              ZIP/Postal Code *
            </label>
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['address.zipCode'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('address.zipCode')}
          </div>
          <div>
            <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
              Country *
            </label>
            <input
              type="text"
              id="address.country"
              name="address.country"
              value={formData.address.country}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['address.country'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('address.country')}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Place of Birth</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="placeOfBirth.city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              id="placeOfBirth.city"
              name="placeOfBirth.city"
              value={formData.placeOfBirth.city}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['placeOfBirth.city'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('placeOfBirth.city')}
          </div>
          <div>
            <label htmlFor="placeOfBirth.state" className="block text-sm font-medium text-gray-700">
              State/Province *
            </label>
            <input
              type="text"
              id="placeOfBirth.state"
              name="placeOfBirth.state"
              value={formData.placeOfBirth.state}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['placeOfBirth.state'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('placeOfBirth.state')}
          </div>
          <div>
            <label htmlFor="placeOfBirth.country" className="block text-sm font-medium text-gray-700">
              Country *
            </label>
            <input
              type="text"
              id="placeOfBirth.country"
              name="placeOfBirth.country"
              value={formData.placeOfBirth.country}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['placeOfBirth.country'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('placeOfBirth.country')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonalDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Gender *
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['gender'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          {getError('gender')}
        </div>

        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
            Marital Status *
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              formErrors['maritalStatus'] ? 'border-red-300' : 'border-gray-300'
            } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          >
            <option value="">Select Marital Status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
            <option value="separated">Separated</option>
            <option value="civil_union">Civil Union</option>
          </select>
          {getError('maritalStatus')}
        </div>
      </div>

      <div>
        <label htmlFor="immigrationPurpose" className="block text-sm font-medium text-gray-700">
          Immigration Purpose *
        </label>
        <select
          id="immigrationPurpose"
          name="immigrationPurpose"
          value={formData.immigrationPurpose}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            formErrors['immigrationPurpose'] ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
        >
          <option value="">Select Immigration Purpose</option>
          <option value="family_reunification">Family Reunification</option>
          <option value="employment">Employment</option>
          <option value="education">Education</option>
          <option value="asylum">Asylum</option>
          <option value="investment">Investment</option>
          <option value="diversity_lottery">Diversity Lottery</option>
          <option value="other">Other</option>
        </select>
        {getError('immigrationPurpose')}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio/Additional Information *
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            formErrors['bio'] ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
          placeholder="Tell us about yourself, your background, or any additional information..."
        />
        {getError('bio')}
      </div>

      {/* Family Information */}
      {/* Only show spouse information if not single */}
      {formData.maritalStatus !== 'single' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spouse Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="spouse.firstName" className="block text-sm font-medium text-gray-700">
                Spouse First Name *
              </label>
              <input
                type="text"
                id="spouse.firstName"
                name="spouse.firstName"
                value={formData.spouse.firstName}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['spouse.firstName'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('spouse.firstName')}
            </div>
            <div>
              <label htmlFor="spouse.lastName" className="block text-sm font-medium text-gray-700">
                Spouse Last Name *
              </label>
              <input
                type="text"
                id="spouse.lastName"
                name="spouse.lastName"
                value={formData.spouse.lastName}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['spouse.lastName'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('spouse.lastName')}
            </div>
            <div>
              <label htmlFor="spouse.dateOfBirth" className="block text-sm font-medium text-gray-700">
                Spouse Date of Birth *
              </label>
              <input
                type="date"
                id="spouse.dateOfBirth"
                name="spouse.dateOfBirth"
                value={formData.spouse.dateOfBirth}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['spouse.dateOfBirth'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('spouse.dateOfBirth')}
            </div>
            <div>
              <label htmlFor="spouse.nationality" className="block text-sm font-medium text-gray-700">
                Spouse Nationality *
              </label>
              <input
                type="text"
                id="spouse.nationality"
                name="spouse.nationality"
                value={formData.spouse.nationality}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['spouse.nationality'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('spouse.nationality')}
            </div>
            <div>
              <label htmlFor="spouse.alienRegistrationNumber" className="block text-sm font-medium text-gray-700">
                Spouse A-Number *
              </label>
              <input
                type="text"
                id="spouse.alienRegistrationNumber"
                name="spouse.alienRegistrationNumber"
                value={formData.spouse.alienRegistrationNumber}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['spouse.alienRegistrationNumber'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="9 digits"
              />
              {getError('spouse.alienRegistrationNumber')}
            </div>
          </div>
        </div>
      )}

      {formData.maritalStatus !== 'single' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Children Information</h3>
            <button
              type="button"
              onClick={addChild}
              className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Child
            </button>
          </div>
          
          {formData.children.map((child, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-800">Child {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeChild(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  value={child.firstName}
                  onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`children.${index}.firstName`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {formErrors[`children.${index}.firstName`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`children.${index}.firstName`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={child.lastName}
                  onChange={(e) => updateChild(index, 'lastName', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`children.${index}.lastName`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {formErrors[`children.${index}.lastName`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`children.${index}.lastName`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={child.dateOfBirth}
                  onChange={(e) => updateChild(index, 'dateOfBirth', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`children.${index}.dateOfBirth`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {formErrors[`children.${index}.dateOfBirth`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`children.${index}.dateOfBirth`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nationality *
                </label>
                <input
                  type="text"
                  value={child.nationality}
                  onChange={(e) => updateChild(index, 'nationality', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`children.${index}.nationality`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {formErrors[`children.${index}.nationality`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`children.${index}.nationality`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  A-Number *
                </label>
                <input
                  type="text"
                  value={child.alienRegistrationNumber}
                  onChange={(e) => updateChild(index, 'alienRegistrationNumber', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`children.${index}.alienRegistrationNumber`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                  placeholder="9 digits"
                />
                {formErrors[`children.${index}.alienRegistrationNumber`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`children.${index}.alienRegistrationNumber`]}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );

  const renderIdentification = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Identification Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 leading-5 h-10 flex items-center">
              Passport Number *
            </label>
            <input
              type="text"
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border ${
                formErrors['passportNumber'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-10`}
            />
            {getError('passportNumber')}
          </div>
          <div className="space-y-1">
            <label htmlFor="alienRegistrationNumber" className="block text-sm font-medium text-gray-700 leading-4 h-10 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
              A-Number (Alien Registration) *
            </label>
            <input
              type="text"
              id="alienRegistrationNumber"
              name="alienRegistrationNumber"
              value={formData.alienRegistrationNumber}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border ${
                formErrors['alienRegistrationNumber'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-10`}
              placeholder="9 digits"
            />
            {getError('alienRegistrationNumber')}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="nationalIdNumber" className="block text-sm font-medium text-gray-700">
              National ID Number *
            </label>
            <input
              type="text"
              id="nationalIdNumber"
              name="nationalIdNumber"
              value={formData.nationalIdNumber}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['nationalIdNumber'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('nationalIdNumber')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmploymentAndEducation = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="employment.currentEmployer.name" className="block text-sm font-medium text-gray-700">
              Current Employer Name *
            </label>
            <input
              type="text"
              id="employment.currentEmployer.name"
              name="employment.currentEmployer.name"
              value={formData.employment.currentEmployer.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['employment.currentEmployer.name'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('employment.currentEmployer.name')}
          </div>
          <div>
            <label htmlFor="employment.jobTitle" className="block text-sm font-medium text-gray-700">
              Job Title *
            </label>
            <input
              type="text"
              id="employment.jobTitle"
              name="employment.jobTitle"
              value={formData.employment.jobTitle}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['employment.jobTitle'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('employment.jobTitle')}
          </div>
          <div>
            <label htmlFor="employment.employmentStartDate" className="block text-sm font-medium text-gray-700">
              Employment Start Date *
            </label>
            <input
              type="date"
              id="employment.employmentStartDate"
              name="employment.employmentStartDate"
              value={formData.employment.employmentStartDate}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['employment.employmentStartDate'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('employment.employmentStartDate')}
          </div>
          <div>
            <label htmlFor="employment.annualIncome" className="block text-sm font-medium text-gray-700">
              Annual Income ($) *
            </label>
            <input
              type="number"
              id="employment.annualIncome"
              name="employment.annualIncome"
              value={formData.employment.annualIncome}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['employment.annualIncome'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('employment.annualIncome')}
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-800 mb-2">Employer Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="employment.currentEmployer.address.street" className="block text-sm font-medium text-gray-700">
                Street Address *
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.street"
                name="employment.currentEmployer.address.street"
                value={formData.employment.currentEmployer.address.street}
                onChange={handleInputChange}
                className={`mt-4 block w-328 px-3 py-2 border ${
                  formErrors['employment.currentEmployer.address.street'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('employment.currentEmployer.address.street')}
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.city" className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.city"
                name="employment.currentEmployer.address.city"
                value={formData.employment.currentEmployer.address.city}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['employment.currentEmployer.address.city'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('employment.currentEmployer.address.city')}
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.state" className="block text-sm font-medium text-gray-700">
                State *
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.state"
                name="employment.currentEmployer.address.state"
                value={formData.employment.currentEmployer.address.state}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['employment.currentEmployer.address.state'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('employment.currentEmployer.address.state')}
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.zipCode" className="block text-sm font-medium text-gray-700">
                ZIP Code *
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.zipCode"
                name="employment.currentEmployer.address.zipCode"
                value={formData.employment.currentEmployer.address.zipCode}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['employment.currentEmployer.address.zipCode'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('employment.currentEmployer.address.zipCode')}
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.country" className="block text-sm font-medium text-gray-700">
                Country *
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.country"
                name="employment.currentEmployer.address.country"
                value={formData.employment.currentEmployer.address.country}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['employment.currentEmployer.address.country'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {getError('employment.currentEmployer.address.country')}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Education Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="education.highestLevel" className="block text-sm font-medium text-gray-700">
              Highest Education Level *
            </label>
            <select
              id="education.highestLevel"
              name="education.highestLevel"
              value={formData.education.highestLevel}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['education.highestLevel'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            >
              <option value="">Select Education Level</option>
              <option value="high_school">High School</option>
              <option value="associate">Associate Degree</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="doctorate">Doctorate</option>
              <option value="other">Other</option>
            </select>
            {getError('education.highestLevel')}
          </div>
          <div>
            <label htmlFor="education.institutionName" className="block text-sm font-medium text-gray-700">
              Institution Name *
            </label>
            <input
              type="text"
              id="education.institutionName"
              name="education.institutionName"
              value={formData.education.institutionName}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['education.institutionName'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('education.institutionName')}
          </div>
          <div>
            <label htmlFor="education.datesAttended.startDate" className="block text-sm font-medium text-gray-700">
              Start Date *
            </label>
            <input
              type="date"
              id="education.datesAttended.startDate"
              name="education.datesAttended.startDate"
              value={formData.education.datesAttended.startDate}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['education.datesAttended.startDate'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('education.datesAttended.startDate')}
          </div>
          <div>
            <label htmlFor="education.datesAttended.endDate" className="block text-sm font-medium text-gray-700">
              End Date *
            </label>
            <input
              type="date"
              id="education.datesAttended.endDate"
              name="education.datesAttended.endDate"
              value={formData.education.datesAttended.endDate}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['education.datesAttended.endDate'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('education.datesAttended.endDate')}
          </div>
          <div>
            <label htmlFor="education.fieldOfStudy" className="block text-sm font-medium text-gray-700">
              Field of Study *
            </label>
            <input
              type="text"
              id="education.fieldOfStudy"
              name="education.fieldOfStudy"
              value={formData.education.fieldOfStudy}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['education.fieldOfStudy'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('education.fieldOfStudy')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTravelAndFinancial = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Travel History</h3>
          <button
            type="button"
            onClick={addTravelHistory}
            className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Travel Record
          </button>
        </div>
        
        {formErrors['travelHistory'] && (
          <p className="mb-4 text-sm text-red-600">{formErrors['travelHistory']}</p>
        )}
        
        {formData.travelHistory.map((travel, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-800">Travel Record {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeTravelHistory(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  type="text"
                  value={travel.country}
                  onChange={(e) => updateTravelHistory(index, 'country', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`travelHistory.${index}.country`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {formErrors[`travelHistory.${index}.country`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`travelHistory.${index}.country`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Visit Date *
                </label>
                <input
                  type="date"
                  value={travel.visitDate}
                  onChange={(e) => updateTravelHistory(index, 'visitDate', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`travelHistory.${index}.visitDate`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {formErrors[`travelHistory.${index}.visitDate`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`travelHistory.${index}.visitDate`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Purpose *
                </label>
                <select
                  value={travel.purpose}
                  onChange={(e) => updateTravelHistory(index, 'purpose', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`travelHistory.${index}.purpose`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                >
                  <option value="">Select Purpose</option>
                  <option value="tourism">Tourism</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
                {formErrors[`travelHistory.${index}.purpose`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`travelHistory.${index}.purpose`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  value={travel.duration}
                  onChange={(e) => updateTravelHistory(index, 'duration', Number(e.target.value))}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    formErrors[`travelHistory.${index}.duration`] ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {formErrors[`travelHistory.${index}.duration`] && (
                  <p className="mt-1 text-sm text-red-600">{formErrors[`travelHistory.${index}.duration`]}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="financialInfo.annualIncome" className="block text-sm font-medium text-gray-700">
              Annual Income ($) *
            </label>
            <input
              type="number"
              id="financialInfo.annualIncome"
              name="financialInfo.annualIncome"
              value={formData.financialInfo.annualIncome}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['financialInfo.annualIncome'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('financialInfo.annualIncome')}
          </div>
          <div>
            <label htmlFor="financialInfo.sourceOfFunds" className="block text-sm font-medium text-gray-700">
              Source of Funds *
            </label>
            <select
              id="financialInfo.sourceOfFunds"
              name="financialInfo.sourceOfFunds"
              value={formData.financialInfo.sourceOfFunds}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['financialInfo.sourceOfFunds'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            >
              <option value="">Select Source</option>
              <option value="employment">Employment</option>
              <option value="investment">Investment</option>
              <option value="family">Family</option>
              <option value="savings">Savings</option>
              <option value="other">Other</option>
            </select>
            {getError('financialInfo.sourceOfFunds')}
          </div>
          <div>
            <label htmlFor="financialInfo.bankAccountBalance" className="block text-sm font-medium text-gray-700">
              Bank Account Balance ($) *
            </label>
            <input
              type="number"
              id="financialInfo.bankAccountBalance"
              name="financialInfo.bankAccountBalance"
              value={formData.financialInfo.bankAccountBalance}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                formErrors['financialInfo.bankAccountBalance'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            />
            {getError('financialInfo.bankAccountBalance')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryAndAdditional = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Criminal History</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="criminalHistory.hasCriminalRecord"
              name="criminalHistory.hasCriminalRecord"
              checked={formData.criminalHistory.hasCriminalRecord}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="criminalHistory.hasCriminalRecord" className="ml-2 block text-sm text-gray-900">
              I have a criminal record
            </label>
          </div>
          {formData.criminalHistory.hasCriminalRecord && (
            <div>
              <label htmlFor="criminalHistory.details" className="block text-sm font-medium text-gray-700">
                Details *
              </label>
              <textarea
                id="criminalHistory.details"
                name="criminalHistory.details"
                rows={4}
                value={formData.criminalHistory.details}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['criminalHistory.details'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Please provide details about your criminal history..."
              />
              {getError('criminalHistory.details')}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="medicalHistory.hasMedicalConditions"
              name="medicalHistory.hasMedicalConditions"
              checked={formData.medicalHistory.hasMedicalConditions}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="medicalHistory.hasMedicalConditions" className="ml-2 block text-sm text-gray-900">
              I have medical conditions
            </label>
          </div>
          {formData.medicalHistory.hasMedicalConditions && (
            <div>
              <label htmlFor="medicalHistory.details" className="block text-sm font-medium text-gray-700">
                Details *
              </label>
              <textarea
                id="medicalHistory.details"
                name="medicalHistory.details"
                rows={4}
                value={formData.medicalHistory.details}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  formErrors['medicalHistory.details'] ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Please provide details about your medical conditions..."
              />
              {getError('medicalHistory.details')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRegistrationForm = () => (
    <form 
      onSubmit={handleSubmit} 
      onKeyDown={(e) => {
        // Prevent form submission on Enter key unless it's the submit button
        if (e.key === 'Enter' && e.target !== e.currentTarget.querySelector('button[type="submit"]')) {
          e.preventDefault();
        }
      }}
      className="space-y-6"
    >
      {renderSectionNavigation()}
      
      {currentSection === 0 && renderBasicInformation()}
      {currentSection === 1 && renderAddressAndBirth()}
      {currentSection === 2 && renderPersonalDetails()}
      {currentSection === 3 && renderIdentification()}
      {currentSection === 4 && renderEmploymentAndEducation()}
      {currentSection === 5 && renderTravelAndFinancial()}
      {currentSection === 6 && renderHistoryAndAdditional()}
      
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {currentSection < sections.length - 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Validate current section before moving forward
              if (validateCurrentSection()) {
                setCurrentSection(Math.min(sections.length - 1, currentSection + 1));
              } else {
                // Scroll to first error in current section
                const firstErrorField = Object.keys(formErrors).find(key => {
                  const sectionFieldPrefixes: Record<number, string[]> = {
                    0: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone', 'dateOfBirth', 'nationality'],
                    1: ['address.', 'placeOfBirth.'],
                    2: ['gender', 'maritalStatus', 'immigrationPurpose', 'spouse.', 'children.', 'bio'],
                    3: ['passportNumber', 'alienRegistrationNumber', 'nationalIdNumber'],
                    4: ['employment.', 'education.'],
                    5: ['travelHistory', 'travelHistory.', 'financialInfo.'],
                    6: ['criminalHistory.', 'medicalHistory.']
                  };
                  const prefixes = sectionFieldPrefixes[currentSection] || [];
                  return prefixes.some(prefix => key.startsWith(prefix));
                });
                
                if (firstErrorField) {
                  const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
                  if (errorElement) {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    (errorElement as HTMLElement).focus();
                  }
                }
                toast.error('Please fix the errors in the current section before proceeding');
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            onClick={() => {
              // The form submission will be handled by the form's onSubmit
            }}
            className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:flex-1 p-12 items-start border-r border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold mb-8 flex items-center text-gray-900">
              <Shield className="mr-3 h-8 w-8 text-primary-600" />
              Why Choose Immigration-Simplified?
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Error Prevention
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our intelligent system prevents common mistakes and ensures accuracy in your applications.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Time Savings
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Automate repetitive tasks and focus on what matters most - your immigration journey.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  Smart Form Library
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Access the latest USCIS forms instantly. Our library updates automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 p-8 min-h-screen overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-block p-3 rounded-full bg-primary-50 mb-4">
                <Logo className="h-12 w-12 text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Immigration-Simplified
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                by Efile legal
              </p>
            </div>

            {step === 'plan' && renderPlanSelection()}
            {step === 'form' && renderRegistrationForm()}

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 