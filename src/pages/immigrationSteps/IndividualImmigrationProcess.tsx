import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Heart,
  Shield,
  Plane,
  Building,
  FileText,
  Upload,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Download,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Trash2,
  Star,
  Clock,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import questionnaireService from '../../services/questionnaireService';

// Immigration Process Categories
interface ImmigrationCategory {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  forms: string[];
  documents: string[];
  subcategories: ImmigrationSubcategory[];
}

interface ImmigrationSubcategory {
  id: string;
  title: string;
  description: string;
  forms: string[];
  documents: string[];
  eligibilityRequirements: string[];
  processingTime: string;
}

// Add interface for loaded questionnaires near the top
interface LoadedQuestionnaire {
  id: string;
  title: string;
  description: string;
  category: string;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
    help_text?: string;
    eligibility_impact?: 'high' | 'medium' | 'low';
  }>;
}

// Define immigration categories and subcategories
const immigrationCategories: ImmigrationCategory[] = [
  {
    id: 'family-based',
    title: 'Family-Based Immigration',
    description: 'Obtain permanent residence through family relationships',
    icon: <Users className="h-8 w-8" />,
    estimatedTime: '12-24 months',
    difficulty: 'Medium',
    forms: ['I-130', 'I-485', 'I-864'],
    documents: ['Marriage Certificate', 'Birth Certificate', 'Passport'],
    subcategories: [
      {
        id: 'spouse-citizen',
        title: 'Spouse of U.S. Citizen',
        description: 'Marriage-based green card for spouse of U.S. citizen',
        forms: ['I-130', 'I-485', 'I-864', 'I-693', 'I-765', 'I-131'],
        documents: [
          'Marriage Certificate',
          'Birth Certificate',
          'Passport & I-94',
          'Joint Financial Documents',
          'Photos Together',
          'Sponsor\'s Proof of Citizenship',
          'Tax Returns (3 years)',
          'Employment Authorization (if applicable)'
        ],
        eligibilityRequirements: [
          'Legal marriage to U.S. citizen',
          'Marriage entered in good faith',
          'Sponsor meets income requirements',
          'No criminal inadmissibility issues'
        ],
        processingTime: '8-15 months'
      },
      {
        id: 'parent-citizen',
        title: 'Parent of U.S. Citizen (21+)',
        description: 'Immediate relative petition for parent',
        forms: ['I-130', 'I-485', 'I-864', 'I-693'],
        documents: [
          'Birth Certificate (petitioner)',
          'Birth Certificate (parent)',
          'Passport',
          'Proof of U.S. Citizenship',
          'Financial Support Documents'
        ],
        eligibilityRequirements: [
          'U.S. citizen petitioner must be 21+',
          'Biological or legal parent relationship',
          'Financial sponsor available'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'child-citizen',
        title: 'Child of U.S. Citizen (Under 21)',
        description: 'Unmarried child under 21 of U.S. citizen',
        forms: ['I-130', 'I-485', 'I-864', 'I-693'],
        documents: [
          'Birth Certificate',
          'Passport',
          'Parent\'s Proof of Citizenship',
          'School Records',
          'Medical Records'
        ],
        eligibilityRequirements: [
          'Unmarried and under 21',
          'Biological or legally adopted child',
          'Financial sponsor available'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'sibling-citizen',
        title: 'Brother/Sister of U.S. Citizen',
        description: 'Family preference category F4',
        forms: ['I-130'],
        documents: [
          'Birth Certificates (both siblings)',
          'Parent\'s Marriage Certificate',
          'Proof of U.S. Citizenship'
        ],
        eligibilityRequirements: [
          'U.S. citizen petitioner must be 21+',
          'Same parents (biological or adopted)',
          'Long wait times (10+ years)'
        ],
        processingTime: '10-15 years'
      }
    ]
  },
  {
    id: 'employment-based',
    title: 'Employment-Based Immigration',
    description: 'Work visas and employment green cards',
    icon: <Briefcase className="h-8 w-8" />,
    estimatedTime: '6-24 months',
    difficulty: 'Hard',
    forms: ['I-140', 'I-485', 'ETA-9089'],
    documents: ['Degree Certificate', 'Employment Letter', 'Labor Certification'],
    subcategories: [
      {
        id: 'eb1-extraordinary',
        title: 'EB-1A Extraordinary Ability',
        description: 'Outstanding individuals in sciences, arts, education, business, or athletics',
        forms: ['I-140', 'I-485', 'I-765', 'I-131'],
        documents: [
          'Evidence of Extraordinary Ability',
          'Awards and Recognition',
          'Publications',
          'Media Coverage',
          'Expert Opinion Letters',
          'Employment Records'
        ],
        eligibilityRequirements: [
          'National or international acclaim',
          'Recognition by peers',
          'Sustained national/international acclaim',
          'Evidence of achievements'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'eb2-advanced',
        title: 'EB-2 Advanced Degree',
        description: 'Professionals with advanced degrees or exceptional ability',
        forms: ['I-140', 'I-485', 'ETA-9089', 'I-765', 'I-131'],
        documents: [
          'Advanced Degree Certificate',
          'Labor Certification',
          'Employment Offer',
          'Academic Transcripts',
          'Professional Licenses'
        ],
        eligibilityRequirements: [
          'Advanced degree (Master\'s+) or bachelor\'s + 5 years experience',
          'Job offer from U.S. employer',
          'Labor certification (unless NIW)',
          'Meets prevailing wage'
        ],
        processingTime: '12-18 months'
      },
      {
        id: 'eb3-skilled',
        title: 'EB-3 Skilled Workers',
        description: 'Skilled workers, professionals, and other workers',
        forms: ['I-140', 'I-485', 'ETA-9089', 'I-765'],
        documents: [
          'Education Records',
          'Work Experience Letters',
          'Skills Certificates',
          'Labor Certification',
          'Job Offer Letter'
        ],
        eligibilityRequirements: [
          'Bachelor\'s degree or 2+ years work experience',
          'Job offer from U.S. employer',
          'Labor certification approved',
          'Meets job requirements'
        ],
        processingTime: '18-24 months'
      }
    ]
  },
  {
    id: 'humanitarian',
    title: 'Humanitarian Relief',
    description: 'Asylum, refugee status, and special programs',
    icon: <Heart className="h-8 w-8" />,
    estimatedTime: '6-36 months',
    difficulty: 'Hard',
    forms: ['I-589', 'I-765'],
    documents: ['Identity Documents', 'Evidence of Persecution'],
    subcategories: [
      {
        id: 'asylum',
        title: 'Asylum Application',
        description: 'Protection for those persecuted in their home country',
        forms: ['I-589', 'I-765', 'I-131'],
        documents: [
          'Identity Documents',
          'Evidence of Persecution',
          'Country Conditions Reports',
          'Personal Statement',
          'Supporting Affidavits',
          'Medical Records (if applicable)',
          'Police Reports'
        ],
        eligibilityRequirements: [
          'Physically present in the U.S.',
          'Apply within 1 year of arrival (with exceptions)',
          'Well-founded fear of persecution',
          'Persecution based on protected ground',
          'Unable/unwilling to return home'
        ],
        processingTime: '6-24 months'
      },
      {
        id: 'u-visa',
        title: 'U Visa (Crime Victims)',
        description: 'For victims of certain crimes who assist law enforcement',
        forms: ['I-918', 'I-765'],
        documents: [
          'Law Enforcement Certification',
          'Evidence of Crime',
          'Medical Records',
          'Court Documents',
          'Personal Statement'
        ],
        eligibilityRequirements: [
          'Victim of qualifying crime',
          'Substantial physical/mental abuse',
          'Helpful/likely to help law enforcement',
          'Crime occurred in U.S.'
        ],
        processingTime: '12-36 months'
      }
    ]
  },
  {
    id: 'citizenship',
    title: 'Citizenship & Naturalization',
    description: 'Become a U.S. citizen through naturalization',
    icon: <Star className="h-8 w-8" />,
    estimatedTime: '8-12 months',
    difficulty: 'Medium',
    forms: ['N-400'],
    documents: ['Green Card', 'Tax Returns', 'Travel Records'],
    subcategories: [
      {
        id: 'naturalization-5year',
        title: '5-Year Naturalization Rule',
        description: 'Standard naturalization after 5 years as permanent resident',
        forms: ['N-400'],
        documents: [
          'Green Card',
          'Tax Returns (5 years)',
          'Travel Records',
          'Selective Service Registration',
          'Court Records (if applicable)'
        ],
        eligibilityRequirements: [
          'Permanent resident for 5+ years',
          'Physical presence in U.S. (30+ months)',
          'Good moral character',
          'English and civics knowledge',
          'Attachment to U.S. Constitution'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'naturalization-3year',
        title: '3-Year Rule (Spouse of Citizen)',
        description: 'Naturalization after 3 years for spouse of U.S. citizen',
        forms: ['N-400'],
        documents: [
          'Green Card',
          'Marriage Certificate',
          'Spouse\'s Proof of Citizenship',
          'Tax Returns (3 years)',
          'Joint Documents'
        ],
        eligibilityRequirements: [
          'Married to U.S. citizen for 3+ years',
          'Permanent resident for 3+ years',
          'Living in marital union',
          'Spouse has been citizen for 3+ years',
          'Good moral character'
        ],
        processingTime: '8-12 months'
      }
    ]
  },
  {
    id: 'temporary-visas',
    title: 'Temporary Visas & Status',
    description: 'Work authorization, travel documents, and temporary status',
    icon: <Clock className="h-8 w-8" />,
    estimatedTime: '3-8 months',
    difficulty: 'Easy',
    forms: ['I-765', 'I-131'],
    documents: ['Passport', 'I-94', 'Supporting Documents'],
    subcategories: [
      {
        id: 'work-authorization',
        title: 'Work Authorization (EAD)',
        description: 'Employment authorization document',
        forms: ['I-765'],
        documents: [
          'Copy of I-94',
          'Passport Bio Page',
          'Evidence of Eligibility',
          'Pending Application Receipt'
        ],
        eligibilityRequirements: [
          'Eligible category (pending AOS, asylum, etc.)',
          'Valid underlying petition',
          'Proper supporting documentation'
        ],
        processingTime: '3-6 months'
      },
      {
        id: 'advance-parole',
        title: 'Advance Parole (Travel Document)',
        description: 'Permission to re-enter U.S. while application pending',
        forms: ['I-131'],
        documents: [
          'Copy of Passport',
          'Pending Application Receipt',
          'Travel Itinerary',
          'Emergency Documentation (if applicable)'
        ],
        eligibilityRequirements: [
          'Pending adjustment of status',
          'Valid reason for travel',
          'Proper supporting documentation'
        ],
        processingTime: '3-6 months'
      }
    ]
  }
];

interface ImmigrationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface FormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;
    passportNumber: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  immigrationInfo: {
    currentStatus: string;
    entryDate: string;
    visaType: string;
    intendedCategory: string;
    familyMembers: Array<{
      name: string;
      relationship: string;
      age: number;
      status: string;
    }>;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    isRequired: boolean;
    isUploaded: boolean;
    file?: File;
  }>;
  forms: Array<{
    id: string;
    name: string;
    description: string;
    isCompleted: boolean;
    isRequired: boolean;
  }>;
}

const IndividualImmigrationProcess: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ImmigrationCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ImmigrationSubcategory | null>(null);
  const [questionnaireStep, setQuestionnaireStep] = useState<'category' | 'subcategory' | 'confirmation'>('category');
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      placeOfBirth: '',
      nationality: '',
      passportNumber: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    immigrationInfo: {
      currentStatus: '',
      entryDate: '',
      visaType: '',
      intendedCategory: '',
      familyMembers: []
    },
    documents: [
      { id: '1', name: 'Passport', type: 'identity', isRequired: true, isUploaded: false },
      { id: '2', name: 'Birth Certificate', type: 'identity', isRequired: true, isUploaded: false },
      { id: '3', name: 'Marriage Certificate', type: 'family', isRequired: false, isUploaded: false },
      { id: '4', name: 'Employment Records', type: 'employment', isRequired: false, isUploaded: false },
      { id: '5', name: 'Financial Documents', type: 'financial', isRequired: true, isUploaded: false },
      { id: '6', name: 'Medical Records', type: 'medical', isRequired: true, isUploaded: false }
    ],
    forms: [
      { id: '1', name: 'I-130', description: 'Petition for Alien Relative', isCompleted: false, isRequired: true },
      { id: '2', name: 'I-485', description: 'Application to Register Permanent Residence', isCompleted: false, isRequired: true },
      { id: '3', name: 'I-864', description: 'Affidavit of Support', isCompleted: false, isRequired: true },
      { id: '4', name: 'I-693', description: 'Report of Medical Examination', isCompleted: false, isRequired: true },
      { id: '5', name: 'I-765', description: 'Application for Employment Authorization', isCompleted: false, isRequired: false },
      { id: '6', name: 'I-131', description: 'Application for Travel Document', isCompleted: false, isRequired: false }
    ]
  });

  // State for custom questionnaires
  const [showCustomQuestionnaire, setShowCustomQuestionnaire] = useState(false);
  const [selectedCustomQuestionnaire, setSelectedCustomQuestionnaire] = useState<LoadedQuestionnaire | null>(null);
  const [customQuestionnaireAnswers, setCustomQuestionnaireAnswers] = useState<Record<string, any>>({});
  const [customQuestionnaires, setCustomQuestionnaires] = useState<LoadedQuestionnaire[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);

  // Load custom questionnaires from API
  useEffect(() => {
    const loadCustomQuestionnaires = async () => {
      try {
        setLoadingQuestionnaires(true);
        
        // Check if API is available
        const isAPIAvailable = await questionnaireService.isAPIAvailable();
        
        if (isAPIAvailable) {
          // Load from API
          const response = await questionnaireService.getQuestionnaires({
            is_active: true,
            limit: 50
          });
          
          // Convert API questionnaires to local format
          const convertedQuestionnaires: LoadedQuestionnaire[] = response.questionnaires.map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            category: q.category,
            fields: q.fields.map(field => ({
              id: field.id,
              type: field.type,
              label: field.label,
              required: field.required,
              options: field.options,
              help_text: field.help_text,
              eligibility_impact: field.eligibility_impact
            }))
          }));
          
          setCustomQuestionnaires(convertedQuestionnaires);
          
          // Also make available globally for other components
          (window as any).getImmigrationQuestionnaires = () => convertedQuestionnaires;
          (window as any).getQuestionnaireByCategory = (category: string) => 
            convertedQuestionnaires.filter(q => q.category === category);
        } else {
          // Fallback to localStorage
          try {
            const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
            if (savedQuestionnaires) {
              const localQuestionnaires = JSON.parse(savedQuestionnaires);
              
              // Convert local format to LoadedQuestionnaire format
              const convertedLocal: LoadedQuestionnaire[] = localQuestionnaires.map((q: any) => ({
                id: q.id,
                title: q.title || q.name,
                description: q.description,
                category: q.category,
                fields: q.fields?.map((field: any) => ({
                  id: field.id,
                  type: field.type,
                  label: field.label,
                  required: field.required,
                  options: field.options,
                  help_text: field.help_text || field.helpText,
                  eligibility_impact: field.eligibility_impact || field.eligibilityImpact
                })) || []
              }));
              
              setCustomQuestionnaires(convertedLocal);
              
              (window as any).getImmigrationQuestionnaires = () => convertedLocal;
              (window as any).getQuestionnaireByCategory = (category: string) => 
                convertedLocal.filter(q => q.category === category);
            }
          } catch (localError) {
            console.error('Error loading from localStorage:', localError);
            setCustomQuestionnaires([]);
          }
        }
          
      } catch (error) {
        console.error('Error loading questionnaires:', error);
        // Fallback to empty array on error
        setCustomQuestionnaires([]);
        
        // Try localStorage as final fallback
        try {
          const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
          if (savedQuestionnaires) {
            const localQuestionnaires = JSON.parse(savedQuestionnaires);
            const convertedLocal: LoadedQuestionnaire[] = localQuestionnaires.map((q: any) => ({
              id: q.id,
              title: q.title || q.name,
              description: q.description,
              category: q.category,
              fields: q.fields?.map((field: any) => ({
                id: field.id,
                type: field.type,
                label: field.label,
                required: field.required,
                options: field.options,
                help_text: field.help_text || field.helpText,
                eligibility_impact: field.eligibility_impact || field.eligibilityImpact
              })) || []
            }));
            setCustomQuestionnaires(convertedLocal);
          }
        } catch (fallbackError) {
          console.error('Final fallback failed:', fallbackError);
        }
      } finally {
        setLoadingQuestionnaires(false);
      }
    };

    loadCustomQuestionnaires();
  }, []);

  const steps: ImmigrationStep[] = [
    { id: 'personal', title: 'Personal Information', description: 'Basic personal details', isCompleted: false, isActive: true },
    { id: 'immigration', title: 'Immigration Details', description: 'Current status and intentions', isCompleted: false, isActive: false },
    { id: 'documents', title: 'Document Upload', description: 'Required documents and forms', isCompleted: false, isActive: false },
    { id: 'review', title: 'Review & Submit', description: 'Final review and submission', isCompleted: false, isActive: false }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Mark current step as completed
      steps[currentStep].isCompleted = true;
      steps[currentStep + 1].isActive = true;
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        address: {
          ...prev.personalInfo.address,
          [field]: value
        }
      }
    }));
  };

  const handleImmigrationInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      immigrationInfo: {
        ...prev.immigrationInfo,
        [field]: value
      }
    }));
  };

  const handleFileUpload = (documentId: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, isUploaded: true, file }
          : doc
      )
    }));
  };

  const handleRemoveFile = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, isUploaded: false, file: undefined }
          : doc
      )
    }));
  };

  const handleFormToggle = (formId: string) => {
    setFormData(prev => ({
      ...prev,
      forms: prev.forms.map(form =>
        form.id === formId
          ? { ...form, isCompleted: !form.isCompleted }
          : form
      )
    }));
  };

  const handleSubmit = async () => {
    try {
      // Here you would submit the form data to your backend
      console.log('Submitting form data:', formData);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting application. Please try again.');
    }
  };

  // Questionnaire handlers
  const handleCategorySelection = (category: ImmigrationCategory) => {
    setSelectedCategory(category);
    if (category.subcategories.length > 0) {
      setQuestionnaireStep('subcategory');
    } else {
      setQuestionnaireStep('confirmation');
    }
  };

  const handleSubcategorySelection = (subcategory: ImmigrationSubcategory) => {
    setSelectedSubcategory(subcategory);
    setQuestionnaireStep('confirmation');
  };

  const handleCustomQuestionnaireSelect = (questionnaire: LoadedQuestionnaire) => {
    setSelectedCustomQuestionnaire(questionnaire);
    setShowCustomQuestionnaire(true);
    setCustomQuestionnaireAnswers({});
  };

  const handleCustomQuestionnaireAnswer = (questionId: string, answer: any) => {
    setCustomQuestionnaireAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleCustomQuestionnaireSubmit = async () => {
    if (!selectedCustomQuestionnaire) return;

    try {
      // Check if API is available
      const isAPIAvailable = await questionnaireService.isAPIAvailable();
      
      if (isAPIAvailable) {
        // Submit via API
        const response = await questionnaireService.submitQuestionnaireResponse(
          selectedCustomQuestionnaire.id,
          {
            responses: customQuestionnaireAnswers,
            auto_save: false
          }
        );

        console.log('Assessment results:', response.assessment_results);
        
        if (response.assessment_results) {
          // Show results to user
          alert(`Assessment completed!\n\nEligibility Score: ${response.assessment_results.eligibility_score}\n\nRecommended Forms: ${response.assessment_results.recommended_forms.join(', ')}\n\nNext Steps:\n${response.assessment_results.next_steps.join('\n')}`);
        }
      } else {
        // Offline mode - just log the answers
        console.log('Custom questionnaire answers (offline):', customQuestionnaireAnswers);
        alert('Questionnaire completed offline. Answers have been saved locally.');
        
        // Save to localStorage for later sync
        const offlineResponses = JSON.parse(localStorage.getItem('offline-questionnaire-responses') || '[]');
        offlineResponses.push({
          questionnaire_id: selectedCustomQuestionnaire.id,
          responses: customQuestionnaireAnswers,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('offline-questionnaire-responses', JSON.stringify(offlineResponses));
      }

      setShowCustomQuestionnaire(false);
      setShowQuestionnaire(false);
    } catch (error: any) {
      console.error('Error submitting questionnaire:', error);
      alert('Failed to submit questionnaire: ' + error.message);
    }
  };

  // Add the missing renderCustomQuestionnaire function
  const renderCustomQuestionnaire = () => {
    if (!selectedCustomQuestionnaire) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowCustomQuestionnaire(false)}
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors mb-4 mx-auto"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Categories
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {selectedCustomQuestionnaire.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {selectedCustomQuestionnaire.description}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              {selectedCustomQuestionnaire.fields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.help_text && (
                    <p className="text-sm text-gray-500">{field.help_text}</p>
                  )}

                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={customQuestionnaireAnswers[field.id] || ''}
                      onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={customQuestionnaireAnswers[field.id] || ''}
                      onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {field.options.map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'yesno' && (
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={field.id}
                          value="yes"
                          checked={customQuestionnaireAnswers[field.id] === 'yes'}
                          onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={field.id}
                          value="no"
                          checked={customQuestionnaireAnswers[field.id] === 'no'}
                          onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  )}

                  {field.eligibility_impact && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      field.eligibility_impact === 'high' ? 'bg-red-100 text-red-800' :
                      field.eligibility_impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {field.eligibility_impact} impact
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => setShowCustomQuestionnaire(false)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomQuestionnaireSubmit}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Functions
  const renderQuestionnaire = () => {
    if (showCustomQuestionnaire) {
      return renderCustomQuestionnaire();
    }

    if (questionnaireStep === 'category') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Immigration Category Selection
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the immigration category that best fits your situation. 
                We'll guide you through the specific requirements and forms needed.
              </p>
            </div>

            {/* Custom Questionnaires Section */}
            {customQuestionnaires.length > 0 && (
              <div className="mb-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Custom Assessment Questionnaires
                  </h2>
                  <p className="text-gray-600">
                    Complete a custom questionnaire designed by our attorneys for your specific situation.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {customQuestionnaires.map((questionnaire) => (
                    <motion.div
                      key={questionnaire.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500"
                      onClick={() => handleCustomQuestionnaireSelect(questionnaire)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-purple-500 text-2xl">
                          <HelpCircle className="h-8 w-8" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Custom
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {questionnaire.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {questionnaire.description || 'Custom questionnaire to assess your immigration situation.'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          {questionnaire.fields.length} question(s)
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="h-4 w-4 mr-2" />
                          {questionnaire.category.charAt(0).toUpperCase() + questionnaire.category.slice(1).replace('-', ' ')}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-purple-600 font-medium">Start Assessment</span>
                        <ArrowRight className="h-5 w-5 text-purple-600" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center text-gray-500">
                    <div className="h-px bg-gray-300 flex-1 mr-4"></div>
                    <span className="text-sm">OR</span>
                    <div className="h-px bg-gray-300 flex-1 ml-4"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {immigrationCategories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => handleCategorySelection(category)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-blue-500 text-3xl">
                      {category.icon}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        category.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        category.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {category.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {category.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {category.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      {category.estimatedTime}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-2" />
                      {category.forms.length} form(s)
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Upload className="h-4 w-4 mr-2" />
                      {category.documents.length} document(s)
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium">Learn More</span>
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (questionnaireStep === 'subcategory' && selectedCategory) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <button
                onClick={() => setQuestionnaireStep('category')}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4 mx-auto"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Categories
              </button>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedCategory.title}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Choose the specific subcategory that applies to your situation
              </p>
            </div>

            <div className="space-y-6">
              {selectedCategory.subcategories.map((subcategory) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => handleSubcategorySelection(subcategory)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {subcategory.title}
                    </h3>
                    <span className="text-blue-600 font-medium text-sm">
                      {subcategory.processingTime}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {subcategory.description}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Forms:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {subcategory.forms.map((form, idx) => (
                          <li key={idx}>{form}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Documents:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {subcategory.documents.slice(0, 3).map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                        {subcategory.documents.length > 3 && (
                          <li className="text-gray-500">+{subcategory.documents.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium">Select This Option</span>
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (questionnaireStep === 'confirmation' && selectedCategory && selectedSubcategory) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Selection Confirmed
              </h1>
              <p className="text-lg text-gray-600">
                You've selected: <span className="font-semibold">{selectedSubcategory.title}</span>
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Your Immigration Process Summary
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Forms You'll Need to Complete:</h3>
                  <div className="space-y-3">
                    {selectedSubcategory.forms.map((form, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="text-gray-900 font-medium">{form}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Documents to Prepare:</h3>
                  <div className="space-y-3">
                    {selectedSubcategory.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-green-50 rounded-lg">
                        <Upload className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-900">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Eligibility Requirements:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {selectedSubcategory.eligibilityRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setQuestionnaireStep('subcategory')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => setShowQuestionnaire(false)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                Start Application
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderPersonalInfoStep = () => (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={formData.personalInfo.firstName}
            onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.personalInfo.lastName}
            onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
          <input
            type="date"
            value={formData.personalInfo.dateOfBirth}
            onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Place of Birth *</label>
          <input
            type="text"
            value={formData.personalInfo.placeOfBirth}
            onChange={(e) => handlePersonalInfoChange('placeOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="City, Country"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
          <input
            type="text"
            value={formData.personalInfo.nationality}
            onChange={(e) => handlePersonalInfoChange('nationality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
          <input
            type="text"
            value={formData.personalInfo.passportNumber}
            onChange={(e) => handlePersonalInfoChange('passportNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={formData.personalInfo.email}
            onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.personalInfo.phone}
            onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
            <input
              type="text"
              value={formData.personalInfo.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              value={formData.personalInfo.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
            <input
              type="text"
              value={formData.personalInfo.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
            <input
              type="text"
              value={formData.personalInfo.address.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <input
              type="text"
              value={formData.personalInfo.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <div></div>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          Next Step
          <ChevronRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderImmigrationInfoStep = () => (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Immigration Information</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Immigration Status</label>
          <select
            value={formData.immigrationInfo.currentStatus}
            onChange={(e) => handleImmigrationInfoChange('currentStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            <option value="F-1">F-1 Student</option>
            <option value="H-1B">H-1B Worker</option>
            <option value="L-1">L-1 Intracompany Transfer</option>
            <option value="B-1/B-2">B-1/B-2 Visitor</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Entry</label>
          <input
            type="date"
            value={formData.immigrationInfo.entryDate}
            onChange={(e) => handleImmigrationInfoChange('entryDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Visa Type</label>
          <input
            type="text"
            value={formData.immigrationInfo.visaType}
            onChange={(e) => handleImmigrationInfoChange('visaType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Intended Immigration Category</label>
          <select
            value={formData.immigrationInfo.intendedCategory}
            onChange={(e) => handleImmigrationInfoChange('intendedCategory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            <option value="family-based">Family-Based</option>
            <option value="employment-based">Employment-Based</option>
            <option value="humanitarian">Humanitarian</option>
            <option value="naturalization">Naturalization</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          Next Step
          <ChevronRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Document Upload</h2>
      <div className="space-y-6">
        {formData.documents.map((doc) => (
          <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium text-gray-900">{doc.name}</span>
                {doc.isRequired && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Required</span>
                )}
              </div>
              {doc.isUploaded && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{doc.type}</p>
            <div className="flex items-center space-x-3">
              {doc.isUploaded ? (
                <>
                  <span className="text-sm text-green-600">✓ Uploaded</span>
                  <button
                    onClick={() => handleRemoveFile(doc.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(doc.id, file);
                  }}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Forms</h3>
        <div className="space-y-3">
          {formData.forms.map((form) => (
            <div key={form.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">{form.name}</span>
                <p className="text-sm text-gray-600">{form.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                {form.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <button
                  onClick={() => handleFormToggle(form.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    form.isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {form.isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          Review & Submit
          <ChevronRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review Your Application</h2>
      
      <div className="space-y-6">
        {/* Personal Information Review */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{formData.personalInfo.firstName} {formData.personalInfo.lastName}</span>
            </div>
            <div>
              <span className="text-gray-600">Date of Birth:</span>
              <span className="ml-2 font-medium">{formData.personalInfo.dateOfBirth}</span>
            </div>
            <div>
              <span className="text-gray-600">Place of Birth:</span>
              <span className="ml-2 font-medium">{formData.personalInfo.placeOfBirth}</span>
            </div>
            <div>
              <span className="text-gray-600">Nationality:</span>
              <span className="ml-2 font-medium">{formData.personalInfo.nationality}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{formData.personalInfo.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="ml-2 font-medium">{formData.personalInfo.phone}</span>
            </div>
          </div>
        </div>

        {/* Immigration Information Review */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Immigration Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Status:</span>
              <span className="ml-2 font-medium">{formData.immigrationInfo.currentStatus}</span>
            </div>
            <div>
              <span className="text-gray-600">Entry Date:</span>
              <span className="ml-2 font-medium">{formData.immigrationInfo.entryDate}</span>
            </div>
            <div>
              <span className="text-gray-600">Visa Type:</span>
              <span className="ml-2 font-medium">{formData.immigrationInfo.visaType}</span>
            </div>
            <div>
              <span className="text-gray-600">Intended Category:</span>
              <span className="ml-2 font-medium">{formData.immigrationInfo.intendedCategory}</span>
            </div>
          </div>
        </div>

        {/* Documents Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
          <div className="space-y-2">
            {formData.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{doc.name}</span>
                <span className={`text-sm ${doc.isUploaded ? 'text-green-600' : 'text-red-600'}`}>
                  {doc.isUploaded ? '✓ Uploaded' : '✗ Missing'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Forms Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Forms</h3>
          <div className="space-y-2">
            {formData.forms.map((form) => (
              <div key={form.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{form.name}</span>
                <span className={`text-sm ${form.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                  {form.isCompleted ? '✓ Completed' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>
        <button
          onClick={handleSubmit}
          className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          Submit Application
          <CheckCircle className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderImmigrationInfoStep();
      case 2:
        return renderDocumentsStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Show questionnaire first, then form steps
  if (showQuestionnaire) {
    return renderQuestionnaire();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/immigration-process')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Process Selection
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Individual Immigration Process
              </h1>
              <p className="text-sm text-gray-500">
                Personal immigration application and form filing
              </p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default IndividualImmigrationProcess;

