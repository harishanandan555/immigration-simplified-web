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
  
  const sections = [
    'Basic Information',
    'Address & Birth',
    'Personal Details',
    'Identification',
    'Family Information',
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
      country: 'United States'
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
    
    // Handle nested object fields
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => {
        const parentValue = prev[parent as keyof typeof prev] as any;
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [child]: grandchild ? {
              ...(parentValue?.[child] || {}),
              [grandchild]: type === 'number' ? Number(value) : value
            } : (type === 'number' ? Number(value) : value)
          }
        };
      });
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: type === 'number' ? Number(value) : value
        };
        
        // Clear spouse data if marital status is changed to single
        if (name === 'maritalStatus' && value === 'single') {
          newData.spouse = {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            nationality: '',
            alienRegistrationNumber: ''
          };
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    // Only allow submission on the last step
    if (currentSection !== sections.length - 1) {
      return;
    }
    
    setLoading(true);

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

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
            onClick={() => setCurrentSection(index)}
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
            Nationality
          </label>
          <input
            type="text"
            id="nationality"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth
        </label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
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
              Street Address
            </label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="address.city"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
              State/Province
            </label>
            <input
              type="text"
              id="address.state"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              id="address.country"
              name="address.country"
              value={formData.address.country}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Place of Birth</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="placeOfBirth.city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="placeOfBirth.city"
              name="placeOfBirth.city"
              value={formData.placeOfBirth.city}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="placeOfBirth.state" className="block text-sm font-medium text-gray-700">
              State/Province
            </label>
            <input
              type="text"
              id="placeOfBirth.state"
              name="placeOfBirth.state"
              value={formData.placeOfBirth.state}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="placeOfBirth.country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              id="placeOfBirth.country"
              name="placeOfBirth.country"
              value={formData.placeOfBirth.country}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
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
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
            Marital Status
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select Marital Status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
            <option value="separated">Separated</option>
            <option value="civil_union">Civil Union</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="immigrationPurpose" className="block text-sm font-medium text-gray-700">
          Immigration Purpose
        </label>
        <select
          id="immigrationPurpose"
          name="immigrationPurpose"
          value={formData.immigrationPurpose}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio/Additional Information
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          placeholder="Tell us about yourself, your background, or any additional information..."
        />
      </div>
    </div>
  );

  const renderIdentification = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Identification Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 leading-5 h-10 flex items-center">
              Passport Number
            </label>
            <input
              type="text"
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-10"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="alienRegistrationNumber" className="block text-sm font-medium text-gray-700 leading-4 h-10 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
              A-Number (Alien Registration)
            </label>
            <input
              type="text"
              id="alienRegistrationNumber"
              name="alienRegistrationNumber"
              value={formData.alienRegistrationNumber}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-10"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="nationalIdNumber" className="block text-sm font-medium text-gray-700">
              National ID Number
            </label>
            <input
              type="text"
              id="nationalIdNumber"
              name="nationalIdNumber"
              value={formData.nationalIdNumber}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFamilyInformation = () => (
    <div className="space-y-6">
      {/* Only show spouse information if not single */}
      {formData.maritalStatus !== 'single' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spouse Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="spouse.firstName" className="block text-sm font-medium text-gray-700">
                Spouse First Name
              </label>
              <input
                type="text"
                id="spouse.firstName"
                name="spouse.firstName"
                value={formData.spouse.firstName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="spouse.lastName" className="block text-sm font-medium text-gray-700">
                Spouse Last Name
              </label>
              <input
                type="text"
                id="spouse.lastName"
                name="spouse.lastName"
                value={formData.spouse.lastName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="spouse.dateOfBirth" className="block text-sm font-medium text-gray-700">
                Spouse Date of Birth
              </label>
              <input
                type="date"
                id="spouse.dateOfBirth"
                name="spouse.dateOfBirth"
                value={formData.spouse.dateOfBirth}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="spouse.nationality" className="block text-sm font-medium text-gray-700">
                Spouse Nationality
              </label>
              <input
                type="text"
                id="spouse.nationality"
                name="spouse.nationality"
                value={formData.spouse.nationality}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="spouse.alienRegistrationNumber" className="block text-sm font-medium text-gray-700">
                Spouse A-Number
              </label>
              <input
                type="text"
                id="spouse.alienRegistrationNumber"
                name="spouse.alienRegistrationNumber"
                value={formData.spouse.alienRegistrationNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      )}

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
        
        {/* Show message for single people */}
        {formData.maritalStatus === 'single' && formData.children.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              Children information is optional. Click "Add Child" if you have children to include.
            </p>
          </div>
        )}
        
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
                  First Name
                </label>
                <input
                  type="text"
                  value={child.firstName}
                  onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={child.lastName}
                  onChange={(e) => updateChild(index, 'lastName', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={child.dateOfBirth}
                  onChange={(e) => updateChild(index, 'dateOfBirth', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nationality
                </label>
                <input
                  type="text"
                  value={child.nationality}
                  onChange={(e) => updateChild(index, 'nationality', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  A-Number
                </label>
                <input
                  type="text"
                  value={child.alienRegistrationNumber}
                  onChange={(e) => updateChild(index, 'alienRegistrationNumber', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        ))}
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
              Current Employer Name
            </label>
            <input
              type="text"
              id="employment.currentEmployer.name"
              name="employment.currentEmployer.name"
              value={formData.employment.currentEmployer.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="employment.jobTitle" className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              id="employment.jobTitle"
              name="employment.jobTitle"
              value={formData.employment.jobTitle}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="employment.employmentStartDate" className="block text-sm font-medium text-gray-700">
              Employment Start Date
            </label>
            <input
              type="date"
              id="employment.employmentStartDate"
              name="employment.employmentStartDate"
              value={formData.employment.employmentStartDate}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="employment.annualIncome" className="block text-sm font-medium text-gray-700">
              Annual Income ($)
            </label>
            <input
              type="number"
              id="employment.annualIncome"
              name="employment.annualIncome"
              value={formData.employment.annualIncome}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-800 mb-2">Employer Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="employment.currentEmployer.address.street" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.street"
                name="employment.currentEmployer.address.street"
                value={formData.employment.currentEmployer.address.street}
                onChange={handleInputChange}
                className="mt-4 block w-328 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.city"
                name="employment.currentEmployer.address.city"
                value={formData.employment.currentEmployer.address.city}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.state"
                name="employment.currentEmployer.address.state"
                value={formData.employment.currentEmployer.address.state}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.zipCode" className="block text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.zipCode"
                name="employment.currentEmployer.address.zipCode"
                value={formData.employment.currentEmployer.address.zipCode}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="employment.currentEmployer.address.country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                id="employment.currentEmployer.address.country"
                name="employment.currentEmployer.address.country"
                value={formData.employment.currentEmployer.address.country}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Education Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="education.highestLevel" className="block text-sm font-medium text-gray-700">
              Highest Education Level
            </label>
            <select
              id="education.highestLevel"
              name="education.highestLevel"
              value={formData.education.highestLevel}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Education Level</option>
              <option value="high_school">High School</option>
              <option value="associate">Associate Degree</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="doctorate">Doctorate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="education.institutionName" className="block text-sm font-medium text-gray-700">
              Institution Name
            </label>
            <input
              type="text"
              id="education.institutionName"
              name="education.institutionName"
              value={formData.education.institutionName}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="education.datesAttended.startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="education.datesAttended.startDate"
              name="education.datesAttended.startDate"
              value={formData.education.datesAttended.startDate}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="education.datesAttended.endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="education.datesAttended.endDate"
              name="education.datesAttended.endDate"
              value={formData.education.datesAttended.endDate}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="education.fieldOfStudy" className="block text-sm font-medium text-gray-700">
              Field of Study
            </label>
            <input
              type="text"
              id="education.fieldOfStudy"
              name="education.fieldOfStudy"
              value={formData.education.fieldOfStudy}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
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
                  Country
                </label>
                <input
                  type="text"
                  value={travel.country}
                  onChange={(e) => updateTravelHistory(index, 'country', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={travel.visitDate}
                  onChange={(e) => updateTravelHistory(index, 'visitDate', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Purpose
                </label>
                <select
                  value={travel.purpose}
                  onChange={(e) => updateTravelHistory(index, 'purpose', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Purpose</option>
                  <option value="tourism">Tourism</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={travel.duration}
                  onChange={(e) => updateTravelHistory(index, 'duration', Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
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
              Annual Income ($)
            </label>
            <input
              type="number"
              id="financialInfo.annualIncome"
              name="financialInfo.annualIncome"
              value={formData.financialInfo.annualIncome}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="financialInfo.sourceOfFunds" className="block text-sm font-medium text-gray-700">
              Source of Funds
            </label>
            <select
              id="financialInfo.sourceOfFunds"
              name="financialInfo.sourceOfFunds"
              value={formData.financialInfo.sourceOfFunds}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Source</option>
              <option value="employment">Employment</option>
              <option value="investment">Investment</option>
              <option value="family">Family</option>
              <option value="savings">Savings</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="financialInfo.bankAccountBalance" className="block text-sm font-medium text-gray-700">
              Bank Account Balance ($)
            </label>
            <input
              type="number"
              id="financialInfo.bankAccountBalance"
              name="financialInfo.bankAccountBalance"
              value={formData.financialInfo.bankAccountBalance}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
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
                Details
              </label>
              <textarea
                id="criminalHistory.details"
                name="criminalHistory.details"
                rows={4}
                value={formData.criminalHistory.details}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Please provide details about your criminal history..."
              />
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
                Details
              </label>
              <textarea
                id="medicalHistory.details"
                name="medicalHistory.details"
                rows={4}
                value={formData.medicalHistory.details}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Please provide details about your medical conditions..."
              />
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
      {currentSection === 4 && renderFamilyInformation()}
      {currentSection === 5 && renderEmploymentAndEducation()}
      {currentSection === 6 && renderTravelAndFinancial()}
      {currentSection === 7 && renderHistoryAndAdditional()}
      
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
              setCurrentSection(Math.min(sections.length - 1, currentSection + 1));
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