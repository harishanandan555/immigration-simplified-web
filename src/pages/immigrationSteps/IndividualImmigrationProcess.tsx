import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  Heart,
  FileText,
  Upload,
  User,
  MapPin,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  AlertCircle,
  Info,
  ChevronRight,
  Star,
  Clock,
  HelpCircle,
  FileCheck,
  X
} from 'lucide-react';
import questionnaireService from '../../services/questionnaireService';
import { getFormTemplates, FormTemplate } from '../../controllers/SettingsControllers';
import {
  renderFormWithData,
  prepareFormData,
  downloadPdfFile,
  createPdfBlobUrl,
  revokePdfBlobUrl
} from '../../controllers/FormAutoFillControllers';
import {
  getPersonalDetails,
  updatePersonalDetails,
  getAvailableForms,
  selectForms,
  createCase,
  getFormReview,
  autoFillForms,
  getWorkflow,
  getAllWorkflows,
  downloadPdf,
  downloadMultiplePdfs,
  type PersonalDetails,
  type AvailableForm,
  type FormSelectionResponse,
  type CaseDetails,
  type Case as WorkflowCase,
  type FormReviewResponse,
  type AutoFillResponse,
  type StepProgress
} from '../../controllers/IndividualFormFilingController';
import api from '../../utils/api';
import { generateObjectId } from '../../utils/idValidation';
import { toast } from 'react-hot-toast';

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

// Add interfaces for case management (same as LegalFirmWorkflow)
interface Client {
  id?: string;
  _id?: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    aptSuiteFlr?: string;
    aptNumber?: string;
    city: string;
    state: string;
    zipCode: string;
    province?: string;
    postalCode?: string;
    country: string;
  };
  status?: string;
}

interface Case {
  id: string;
  _id?: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: 'draft' | 'in-progress' | 'review' | 'completed' | 'Active' | 'Pending' | 'Closed' | 'On Hold';
  priority: 'low' | 'medium' | 'high' | 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedForms: string[];
  questionnaires: string[];
  createdAt: string;
  dueDate: string;
  visaType?: string;
  priorityDate?: string;
  type?: string;
  assignedTo?: string;
  assignedAttorney?: string;
  courtLocation?: string;
  judge?: string;
  openDate?: string;
  startDate?: string;
  expectedClosureDate?: string;
  formCaseIds?: Record<string, string>;
}

interface FormCaseIds {
  [key: string]: string;
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
  stepNumber: number;
}

interface FormData {
  personalInfo: {
    // Basic Information
    firstName: string;
    lastName: string;
    name?: string;
    email: string;
    phone: string;
    
    // Personal Details
    dateOfBirth: string;
    nationality: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    placeOfBirth: {
      city: string;
      state: string;
      country: string;
    };
    gender: string;
    maritalStatus: string;
    immigrationPurpose: string;
    
    // Identification Numbers
    passportNumber: string;
    alienRegistrationNumber: string;
    nationalIdNumber: string;
    ssn: string;
    
    // Family Information
    spouse: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      nationality?: string;
      alienRegistrationNumber?: string;
    };
    children: Array<{
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      nationality?: string;
      alienRegistrationNumber?: string;
    }>;
    
    // Employment Information
    employment: {
      currentEmployer: {
        name?: string;
        address: {
          street?: string;
          city?: string;
          state?: string;
          zipCode?: string;
          country?: string;
        };
      };
      jobTitle?: string;
      employmentStartDate?: string;
      annualIncome?: number;
    };
    
    // Education Information
    education: {
      highestLevel?: string;
      institutionName?: string;
      datesAttended: {
        startDate?: string;
        endDate?: string;
      };
      fieldOfStudy?: string;
    };
    
    // Travel History
    travelHistory: Array<{
      country?: string;
      visitDate?: string;
      purpose?: string;
      duration?: number;
    }>;
    
    // Financial Information
    financialInfo: {
      annualIncome?: number;
      sourceOfFunds?: string;
      bankAccountBalance?: number;
    };
    
    // Background Information
    criminalHistory: {
      hasCriminalRecord?: boolean;
      details?: string;
    };
    medicalHistory: {
      hasMedicalConditions?: boolean;
      details?: string;
    };
    
    documents: Array<{
      name?: string;
      path?: string;
      uploadedAt?: string;
      category?: string;
    }>;
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
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ImmigrationCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ImmigrationSubcategory | null>(null);
  const [questionnaireStep, setQuestionnaireStep] = useState<'category' | 'subcategory' | 'confirmation'>('category');

  // Individual Form Filing Workflow State
  const [workflowId, setWorkflowId] = useState<string>('');
  const [workflowStatus, setWorkflowStatus] = useState<string>('draft');
  const [stepsProgress, setStepsProgress] = useState<StepProgress[]>([]);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [availableForms, setAvailableForms] = useState<AvailableForm[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [caseData, setCaseData] = useState<WorkflowCase | null>(null);
  const [formReview, setFormReview] = useState<FormReviewResponse | null>(null);
  const [autoFillResults, setAutoFillResults] = useState<AutoFillResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Legacy form data for backward compatibility
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      // Basic Information
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: '',
      
      // Personal Details
      dateOfBirth: '',
      nationality: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      placeOfBirth: {
        city: '',
        state: '',
        country: ''
      },
      gender: '',
      maritalStatus: '',
      immigrationPurpose: '',
      
      // Identification Numbers
      passportNumber: '',
      alienRegistrationNumber: '',
      nationalIdNumber: '',
      ssn: '',
      
      // Family Information
      spouse: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        alienRegistrationNumber: ''
      },
      children: [],
      
      // Employment Information
      employment: {
        currentEmployer: {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States'
          }
        },
        jobTitle: '',
        employmentStartDate: '',
        annualIncome: undefined
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
      travelHistory: [],
      
      // Financial Information
      financialInfo: {
        annualIncome: undefined,
        sourceOfFunds: '',
        bankAccountBalance: undefined
      },
      
      // Background Information
      criminalHistory: {
        hasCriminalRecord: false,
        details: ''
      },
      medicalHistory: {
        hasMedicalConditions: false,
        details: ''
      },
      
      documents: []
    },
    immigrationInfo: {
      currentStatus: '',
      entryDate: '',
      visaType: '',
      intendedCategory: '',
      familyMembers: []
    },
    documents: [],
    forms: []
  });

  // State for custom questionnaires
  const [showCustomQuestionnaire, setShowCustomQuestionnaire] = useState(false);
  const [selectedCustomQuestionnaire, setSelectedCustomQuestionnaire] = useState<LoadedQuestionnaire | null>(null);
  const [customQuestionnaireAnswers, setCustomQuestionnaireAnswers] = useState<Record<string, any>>({});
  const [customQuestionnaires, setCustomQuestionnaires] = useState<LoadedQuestionnaire[]>([]);

  // State for form templates from API
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loadingFormTemplates, setLoadingFormTemplates] = useState(false);

  // Legacy state for backward compatibility
  const [client, setClient] = useState<Client>({
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      aptSuiteFlr: '',
      aptNumber: '',
      city: '',
      state: '',
      zipCode: '',
      province: '',
      postalCode: '',
      country: 'United States'
    },
    status: 'active'
  });

  const [formCaseIds, setFormCaseIds] = useState<FormCaseIds>({});

  // State for auto-fill forms functionality
  const [generatedForms, setGeneratedForms] = useState<Array<{
    formName: string;
    templateId: string;
    blob: Blob;
    downloadUrl: string;
    fileName: string;
    status: 'generating' | 'success' | 'error';
    error?: string;
  }>>([]);
  const [generatingForms, setGeneratingForms] = useState(false);
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});
  

  // Load custom questionnaires from API
  useEffect(() => {
    const loadCustomQuestionnaires = async () => {
      try {

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
        // Loading completed
      }
    };

    loadCustomQuestionnaires();
  }, []);

  // Load personal details on component mount
  useEffect(() => {
    const loadPersonalDetails = async () => {
      try {
        setLoading(true);
        const details = await getPersonalDetails();
        setPersonalDetails(details);

        // Update legacy form data for backward compatibility
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            // Basic Information
            firstName: details.firstName || '',
            lastName: details.lastName || '',
            name: details.name || `${details.firstName || ''} ${details.lastName || ''}`.trim(),
            email: details.email || '',
            phone: details.phone || '',
            
            // Personal Details
            dateOfBirth: details.dateOfBirth || '',
            nationality: details.nationality || '',
            address: {
              street: details.address?.street || '',
              city: details.address?.city || '',
              state: details.address?.state || '',
              zipCode: details.address?.zipCode || '',
              country: details.address?.country || 'United States'
            },
            placeOfBirth: {
              city: details.placeOfBirth?.city || '',
              state: details.placeOfBirth?.state || '',
              country: details.placeOfBirth?.country || ''
            },
            gender: details.gender || '',
            maritalStatus: details.maritalStatus || '',
            immigrationPurpose: details.immigrationPurpose || '',
            
            // Identification Numbers
            passportNumber: details.passportNumber || '',
            alienRegistrationNumber: details.alienRegistrationNumber || '',
            nationalIdNumber: details.nationalIdNumber || '',
            ssn: details.ssn || '',
            
            // Family Information
            spouse: {
              firstName: details.spouse?.firstName || '',
              lastName: details.spouse?.lastName || '',
              dateOfBirth: details.spouse?.dateOfBirth || '',
              nationality: details.spouse?.nationality || '',
              alienRegistrationNumber: details.spouse?.alienRegistrationNumber || ''
            },
            children: details.children || [],
            
            // Employment Information
            employment: {
              currentEmployer: {
                name: details.employment?.currentEmployer?.name || '',
                address: {
                  street: details.employment?.currentEmployer?.address?.street || '',
                  city: details.employment?.currentEmployer?.address?.city || '',
                  state: details.employment?.currentEmployer?.address?.state || '',
                  zipCode: details.employment?.currentEmployer?.address?.zipCode || '',
                  country: details.employment?.currentEmployer?.address?.country || 'United States'
                }
              },
              jobTitle: details.employment?.jobTitle || '',
              employmentStartDate: details.employment?.employmentStartDate || '',
              annualIncome: details.employment?.annualIncome || undefined
            },
            
            // Education Information
            education: {
              highestLevel: details.education?.highestLevel || '',
              institutionName: details.education?.institutionName || '',
              datesAttended: {
                startDate: details.education?.datesAttended?.startDate || '',
                endDate: details.education?.datesAttended?.endDate || ''
              },
              fieldOfStudy: details.education?.fieldOfStudy || ''
            },
            
            // Travel History
            travelHistory: details.travelHistory || [],
            
            // Financial Information
            financialInfo: {
              annualIncome: details.financialInfo?.annualIncome || undefined,
              sourceOfFunds: details.financialInfo?.sourceOfFunds || '',
              bankAccountBalance: details.financialInfo?.bankAccountBalance || undefined
            },
            
            // Background Information
            criminalHistory: {
              hasCriminalRecord: details.criminalHistory?.hasCriminalRecord || false,
              details: details.criminalHistory?.details || ''
            },
            medicalHistory: {
              hasMedicalConditions: details.medicalHistory?.hasMedicalConditions || false,
              details: details.medicalHistory?.details || ''
            },
            
            documents: details.documents || []
          }
        }));
      } catch (error) {
        console.error('Error loading personal details:', error);
        toast.error('Failed to load personal details');
      } finally {
        setLoading(false);
      }
    };

    loadPersonalDetails();
  }, []);

  // Load available forms
  useEffect(() => {
    const loadAvailableForms = async () => {
      try {
        setLoading(true);
        const response = await getAvailableForms({
          page: 1,
          limit: 50
        });
        setAvailableForms(response.forms || []);
      } catch (error) {
        console.error('Error loading available forms:', error);
        toast.error('Failed to load available forms');
      } finally {
        setLoading(false);
      }
    };

    loadAvailableForms();
  }, []);

  // Sync client and case data when form data changes
  useEffect(() => {
    if (formData.personalInfo.firstName && formData.personalInfo.lastName) {
      updateClientFromFormData();
    }
  }, [formData.personalInfo]);

  useEffect(() => {
    if (selectedCategory && selectedSubcategory && formData.personalInfo.firstName) {
      updateCaseFromFormData();
    }
  }, [selectedCategory, selectedSubcategory, selectedForms]);

  // Add case creation functions (same as LegalFirmWorkflow)
  const saveWorkflowProgress = async () => {
    try {
      // Prepare comprehensive workflow data
      const workflowData = {
        // Workflow metadata
        workflowId: workflowId || `workflow_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentStep,
        status: 'in-progress',

        // Client information
        client: {
          ...client,
          // Explicitly include all name fields
          firstName: client.firstName,
          middleName: client.middleName || '',
          lastName: client.lastName,
          name: client.name, // Full name
          // Explicitly include complete address information
          address: {
            street: client.address?.street || '',
            aptSuiteFlr: client.address?.aptSuiteFlr || '',
            aptNumber: client.address?.aptNumber || '',
            city: client.address?.city || '',
            state: client.address?.state || '',
            zipCode: client.address?.zipCode || '',
            province: client.address?.province || '',
            postalCode: client.address?.postalCode || '',
            country: client.address?.country || 'United States'
          }
        },

        // Case details
        case: {
          ...caseData,
          // Ensure we have valid IDs
          id: caseData?.id || generateObjectId(),
          _id: caseData?._id || caseData?.id || generateObjectId()
        },

        // Selected forms and case IDs
        selectedForms,
        formCaseIds,
        formTemplates: formTemplates.filter(template => selectedForms.includes(template.name)),

        // Workflow steps progress
        stepsProgress: [
          { title: 'Personal Information', status: 'completed', index: 0 },
          { title: 'Immigration Details', status: 'completed', index: 1 },
          { title: 'Document Upload', status: 'completed', index: 2 },
          { title: 'Form Selection', status: 'completed', index: 3 },
          { title: 'Review & Submit', status: 'current', index: 4 }
        ]
      };

      // Check if we should save to API
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Save to API only
          const response = await api.post('/api/v1/workflows/progress', workflowData);

          // Store the workflow ID from API response
          if (response.data?.workflowId) {
            workflowData.workflowId = response.data.workflowId;
            setWorkflowId(response.data.workflowId);
          }

          // Workflow progress saved to server
          toast.success('Workflow progress saved successfully');
          return workflowData;

        } catch (apiError: any) {
          // Check if it's a 404 (endpoint doesn't exist)
          if (apiError.response?.status === 404) {
            toast.error('Workflow save endpoint not available', { duration: 3000 });
          } else {
            toast.error('Failed to save workflow progress to server', { duration: 3000 });
          }
          throw apiError;
        }
      } else {
        toast.error('Authentication required to save workflow');
        throw new Error('No authentication token available');
      }

    } catch (error) {
      toast.error('Failed to save workflow progress');
      throw error;
    }
  };

  // Function to generate form case IDs
  const generateFormCaseIds = (forms: string[]) => {
    const newFormCaseIds: FormCaseIds = {};
    forms.forEach(form => {
      // Generate USCIS-style case ID (MSC + 9 digits)
      const timestamp = Date.now().toString();
      const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const caseId = `MSC${timestamp.slice(-3)}${randomDigits}`;
      newFormCaseIds[form] = caseId;
    });
    setFormCaseIds(newFormCaseIds);
    return newFormCaseIds;
  };

  // Function to update client data from form data
  const updateClientFromFormData = () => {
    const newClient: Client = {
      ...client,
      name: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim(),
      firstName: formData.personalInfo.firstName,
      lastName: formData.personalInfo.lastName,
      email: formData.personalInfo.email,
      phone: formData.personalInfo.phone,
      dateOfBirth: formData.personalInfo.dateOfBirth,
      nationality: formData.personalInfo.nationality,
      address: {
        street: formData.personalInfo.address.street,
        city: formData.personalInfo.address.city,
        state: formData.personalInfo.address.state,
        zipCode: formData.personalInfo.address.zipCode,
        country: formData.personalInfo.address.country
      }
    };
    setClient(newClient);
    return newClient;
  };

  // Function to update case data from form data
  const updateCaseFromFormData = () => {
    const newCase: WorkflowCase = {
      id: caseData?.id || generateObjectId(),
      _id: caseData?._id || caseData?.id || generateObjectId(),
      caseNumber: caseData?.caseNumber || `CASE-${Date.now()}`,
      title: `${selectedCategory?.title || 'Immigration'} Case - ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
      description: `Immigration case for ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
      category: selectedCategory?.id || 'immigration',
      subcategory: selectedSubcategory?.id || 'general',
      status: 'draft',
      priority: 'medium',
      assignedForms: selectedForms,
      questionnaires: [],
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      visaType: formData.immigrationInfo.visaType,
      priorityDate: new Date().toISOString(),
      openDate: new Date().toISOString(),
      clientId: client.id || client._id || generateObjectId(),
      formCaseIds: {}
    };
    setCaseData(newCase);
    return newCase;
  };

  const steps: ImmigrationStep[] = [
    { id: 'personal-details', title: 'Personal Details', description: 'Fetch/update personal information', isCompleted: false, isActive: true, stepNumber: 1 },
    { id: 'form-selection', title: 'Form Selection', description: 'Select USCIS forms to file', isCompleted: false, isActive: false, stepNumber: 2 },
    { id: 'create-case', title: 'Create Case', description: 'Create a case for the workflow', isCompleted: false, isActive: false, stepNumber: 3 },
    { id: 'form-review', title: 'Form Review', description: 'Review form details and field mappings', isCompleted: false, isActive: false, stepNumber: 4 },
    { id: 'auto-fill-forms', title: 'Auto-fill Forms', description: 'Generate filled PDF forms', isCompleted: false, isActive: false, stepNumber: 5 }
  ];

  // Step 1: Personal Details - Update function (separate from navigation)
  const handleUpdatePersonalDetails = async () => {
    try {
      setLoading(true);

      // Update personal details
      const updatedDetails: Partial<PersonalDetails> = {
        // Basic Information
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        name: formData.personalInfo.name || `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim(),
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone,
        
        // Personal Details
        dateOfBirth: formData.personalInfo.dateOfBirth,
        nationality: formData.personalInfo.nationality,
        address: {
          street: formData.personalInfo.address.street,
          city: formData.personalInfo.address.city,
          state: formData.personalInfo.address.state,
          zipCode: formData.personalInfo.address.zipCode,
          country: formData.personalInfo.address.country
        },
        placeOfBirth: {
          city: formData.personalInfo.placeOfBirth.city,
          state: formData.personalInfo.placeOfBirth.state,
          country: formData.personalInfo.placeOfBirth.country
        },
        gender: formData.personalInfo.gender as any,
        maritalStatus: formData.personalInfo.maritalStatus as any,
        immigrationPurpose: formData.personalInfo.immigrationPurpose as any,
        
        // Identification Numbers
        passportNumber: formData.personalInfo.passportNumber,
        alienRegistrationNumber: formData.personalInfo.alienRegistrationNumber,
        nationalIdNumber: formData.personalInfo.nationalIdNumber,
        ssn: formData.personalInfo.ssn,
        
        // Family Information
        spouse: formData.personalInfo.spouse,
        children: formData.personalInfo.children,
        
        // Employment Information
        employment: {
          ...formData.personalInfo.employment,
          annualIncome: formData.personalInfo.employment.annualIncome || undefined
        },
        
        // Education Information
        education: {
          ...formData.personalInfo.education,
          highestLevel: formData.personalInfo.education.highestLevel as any
        },
        
        // Travel History
        travelHistory: formData.personalInfo.travelHistory.map(travel => ({
          ...travel,
          purpose: travel.purpose as any
        })),
        
        // Financial Information
        financialInfo: {
          ...formData.personalInfo.financialInfo,
          annualIncome: formData.personalInfo.financialInfo.annualIncome || undefined,
          sourceOfFunds: formData.personalInfo.financialInfo.sourceOfFunds as any,
          bankAccountBalance: formData.personalInfo.financialInfo.bankAccountBalance || undefined
        },
        
        // Background Information
        criminalHistory: formData.personalInfo.criminalHistory,
        medicalHistory: formData.personalInfo.medicalHistory,
        
        documents: formData.personalInfo.documents
      };

      await updatePersonalDetails(updatedDetails);
      setPersonalDetails(prev => ({ ...prev, ...updatedDetails } as PersonalDetails));

      toast.success('Personal details updated successfully');
    } catch (error) {
      console.error('Error updating personal details:', error);
      toast.error('Failed to update personal details');
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive form validation
  const validatePersonalDetails = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic Information Validation
    if (!formData.personalInfo.firstName.trim()) {
      errors['firstName'] = 'First name is required';
    }
    if (!formData.personalInfo.lastName.trim()) {
      errors['lastName'] = 'Last name is required';
    }
    if (!formData.personalInfo.email.trim()) {
      errors['email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)) {
      errors['email'] = 'Please enter a valid email address';
    }
    if (!formData.personalInfo.phone.trim()) {
      errors['phone'] = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.personalInfo.phone)) {
      errors['phone'] = 'Please enter a valid phone number';
    }

    // Personal Details Validation
    if (!formData.personalInfo.dateOfBirth) {
      errors['dateOfBirth'] = 'Date of birth is required';
    }
    if (!formData.personalInfo.nationality.trim()) {
      errors['nationality'] = 'Nationality is required';
    }

    // Place of Birth Validation
    if (!formData.personalInfo.placeOfBirth.city.trim()) {
      errors['placeOfBirth.city'] = 'Place of birth city is required';
    }
    if (!formData.personalInfo.placeOfBirth.country.trim()) {
      errors['placeOfBirth.country'] = 'Place of birth country is required';
    }

    // Address Validation
    if (!formData.personalInfo.address.street.trim()) {
      errors['address.street'] = 'Street address is required';
    }
    if (!formData.personalInfo.address.city.trim()) {
      errors['address.city'] = 'City is required';
    }
    if (!formData.personalInfo.address.state.trim()) {
      errors['address.state'] = 'State is required';
    }
    if (!formData.personalInfo.address.zipCode.trim()) {
      errors['address.zipCode'] = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.personalInfo.address.zipCode)) {
      errors['address.zipCode'] = 'Please enter a valid ZIP code (12345 or 12345-6789)';
    }
    if (!formData.personalInfo.address.country.trim()) {
      errors['address.country'] = 'Country is required';
    }

    // Gender and Marital Status Validation
    if (!formData.personalInfo.gender) {
      errors['gender'] = 'Gender is required';
    }
    if (!formData.personalInfo.maritalStatus) {
      errors['maritalStatus'] = 'Marital status is required';
    }

    // Identification Numbers Validation
    if (formData.personalInfo.ssn && !/^\d{3}-\d{2}-\d{4}$/.test(formData.personalInfo.ssn)) {
      errors['ssn'] = 'SSN must be in format XXX-XX-XXXX';
    }
    if (formData.personalInfo.passportNumber && !/^[A-Z0-9]{6,12}$/.test(formData.personalInfo.passportNumber)) {
      errors['passportNumber'] = 'Passport number must be 6-12 alphanumeric characters';
    }
    if (formData.personalInfo.alienRegistrationNumber && !/^A\d{8,9}$/.test(formData.personalInfo.alienRegistrationNumber)) {
      errors['alienRegistrationNumber'] = 'Alien Registration Number must start with A followed by 8-9 digits';
    }
    if (formData.personalInfo.nationalIdNumber && !/^[A-Z0-9]{5,20}$/.test(formData.personalInfo.nationalIdNumber)) {
      errors['nationalIdNumber'] = 'National ID number must be 5-20 alphanumeric characters';
    }

    // Family Information Validation
    if (formData.personalInfo.spouse.firstName && !formData.personalInfo.spouse.lastName) {
      errors['spouse.lastName'] = 'Spouse last name is required if first name is provided';
    }
    if (formData.personalInfo.spouse.lastName && !formData.personalInfo.spouse.firstName) {
      errors['spouse.firstName'] = 'Spouse first name is required if last name is provided';
    }

    // Children Validation
    formData.personalInfo.children.forEach((child, index) => {
      if (child.firstName && !child.lastName) {
        errors[`children.${index}.lastName`] = `Child ${index + 1} last name is required if first name is provided`;
      }
      if (child.lastName && !child.firstName) {
        errors[`children.${index}.firstName`] = `Child ${index + 1} first name is required if last name is provided`;
      }
    });

    // Employment Information Validation
    if (formData.personalInfo.employment.currentEmployer.name && !formData.personalInfo.employment.jobTitle) {
      errors['employment.jobTitle'] = 'Job title is required if employer name is provided';
    }
    if (formData.personalInfo.employment.annualIncome && formData.personalInfo.employment.annualIncome < 0) {
      errors['employment.annualIncome'] = 'Annual income cannot be negative';
    }

    // Education Information Validation
    if (formData.personalInfo.education.institutionName && !formData.personalInfo.education.highestLevel) {
      errors['education.highestLevel'] = 'Education level is required if institution name is provided';
    }

    // Financial Information Validation
    if (formData.personalInfo.financialInfo.annualIncome && formData.personalInfo.financialInfo.annualIncome < 0) {
      errors['financialInfo.annualIncome'] = 'Annual income cannot be negative';
    }
    if (formData.personalInfo.financialInfo.bankAccountBalance && formData.personalInfo.financialInfo.bankAccountBalance < 0) {
      errors['financialInfo.bankAccountBalance'] = 'Bank account balance cannot be negative';
    }

    // Travel History Validation
    formData.personalInfo.travelHistory.forEach((travel, index) => {
      if (travel.country && !travel.visitDate) {
        errors[`travelHistory.${index}.visitDate`] = `Visit date is required for travel entry ${index + 1}`;
      }
      if (travel.visitDate && !travel.country) {
        errors[`travelHistory.${index}.country`] = `Country is required for travel entry ${index + 1}`;
      }
      if (travel.duration && travel.duration < 0) {
        errors[`travelHistory.${index}.duration`] = `Duration cannot be negative for travel entry ${index + 1}`;
      }
    });

    // Background Information Validation
    if (formData.personalInfo.criminalHistory.hasCriminalRecord && !formData.personalInfo.criminalHistory.details?.trim()) {
      errors['criminalHistory.details'] = 'Criminal history details are required when criminal record is indicated';
    }
    if (formData.personalInfo.medicalHistory.hasMedicalConditions && !formData.personalInfo.medicalHistory.details?.trim()) {
      errors['medicalHistory.details'] = 'Medical condition details are required when medical conditions are indicated';
    }

    // Set form errors for display
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add error display helper
  const getError = (fieldName: string) => {
    return formErrors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{formErrors[fieldName]}</p>
    ) : null;
  };

  // Step 1: Personal Details - Next function (navigation only)
  const handlePersonalDetailsNext = () => {
    const isValid = validatePersonalDetails();
    
    if (!isValid) {
      toast.error('Please fix the form errors before proceeding');
      return;
    }

    // Move to next step
    setCurrentStep(1);
    updateStepProgress(1, true);
  };

  // Step 2: Form Selection
  const handleFormSelectionNext = async () => {
    try {
      setLoading(true);

      if (selectedForms.length === 0) {
        toast.error('Please select at least one form');
        return;
      }

      const response = await selectForms(selectedForms);
      setWorkflowId(response.workflowId);
      setStepsProgress(response.stepsProgress);
      setWorkflowStatus(response.status);

      // Move to next step
      setCurrentStep(2);
      updateStepProgress(2, true);

      toast.success('Forms selected successfully');
    } catch (error) {
      console.error('Error selecting forms:', error);
      toast.error('Failed to select forms');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create Case
  const handleCreateCaseNext = async () => {
    try {
      setLoading(true);

      if (!workflowId) {
        toast.error('Workflow ID not found');
        return;
      }

      const caseDetailsData: CaseDetails = {
        type: selectedCategory?.title || 'Immigration',
        title: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName} Immigration Case`,
        description: `Immigration case for ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
        category: selectedCategory?.id || 'immigration',
        subcategory: selectedSubcategory?.id || 'general',
        visaType: formData.immigrationInfo.visaType,
        priority: 'High',
        priorityDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months from now
      };

      const response = await createCase(workflowId, caseDetailsData);
      setCaseData(response.case);
      setStepsProgress(response.stepsProgress);

      // Move to next step
      setCurrentStep(3);
      updateStepProgress(3, true);

      toast.success('Case created successfully');
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Form Review
  const handleFormReviewNext = async () => {
    try {
      setLoading(true);

      if (!workflowId) {
        toast.error('Workflow ID not found');
        return;
      }

      const response = await getFormReview(workflowId);
      setFormReview(response);
      setStepsProgress(response.stepsProgress);

      // Move to next step
      setCurrentStep(4);
      updateStepProgress(4, true);

      toast.success('Form review completed');
    } catch (error) {
      console.error('Error getting form review:', error);
      toast.error('Failed to load form review');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Auto-fill Forms
  const handleAutoFillForms = async () => {
    try {
      setLoading(true);

      if (!workflowId) {
        toast.error('Workflow ID not found');
        return;
      }

      const response = await autoFillForms(workflowId, {
        additionalInfo: {
          petitioner_relationship: 'self',
          beneficiary_country: formData.personalInfo.nationality
        }
      }, true);

      setAutoFillResults(response);
      setStepsProgress(response.stepsProgress);
      setWorkflowStatus(response.status);

      // Convert API response to generatedForms format for preview functionality
      const newGeneratedForms = response.results.generatedPdfs.map((pdf, index) => {
        // Convert base64 string to blob
        const byteCharacters = atob(pdf.pdfBuffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        return {
          formName: pdf.formNumber,
          templateId: pdf.formNumber.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          blob: blob,
          downloadUrl: createPdfBlobUrl(blob),
          fileName: pdf.fileName,
          status: 'success' as const
        };
      });

      setGeneratedForms(newGeneratedForms);

      toast.success('Forms generated successfully');
    } catch (error) {
      console.error('Error auto-filling forms:', error);
      toast.error('Failed to generate forms');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill forms functionality
  const handleAutoFillWithFormData = async () => {
    try {
      setGeneratingForms(true);
      setGeneratedForms([]);

      // Ensure case data is up to date before proceeding
      updateClientFromFormData();
      const updatedCase = updateCaseFromFormData();

      // Prepare comprehensive form data from all collected information
      const autoFillData = {
        // Client information
        clientFirstName: formData.personalInfo.firstName || '',
        clientLastName: formData.personalInfo.lastName || '',
        clientEmail: formData.personalInfo.email || '',
        clientPhone: formData.personalInfo.phone || '',
        clientDateOfBirth: formData.personalInfo.dateOfBirth || '',
        clientNationality: formData.personalInfo.nationality || '',
        clientPlaceOfBirth: formData.personalInfo.placeOfBirth || '',
        clientPassportNumber: formData.personalInfo.passportNumber || '',

        // Client address
        clientStreet: formData.personalInfo.address.street || '',
        clientCity: formData.personalInfo.address.city || '',
        clientState: formData.personalInfo.address.state || '',
        clientZipCode: formData.personalInfo.address.zipCode || '',
        clientCountry: formData.personalInfo.address.country || 'United States',

        // Immigration information
        currentStatus: formData.immigrationInfo.currentStatus || '',
        entryDate: formData.immigrationInfo.entryDate || '',
        visaType: formData.immigrationInfo.visaType || '',
        intendedCategory: formData.immigrationInfo.intendedCategory || '',

        // Case information - use updated case data and provide fallbacks
        caseCategory: selectedCategory?.id || updatedCase.category || 'immigration',
        caseSubcategory: selectedSubcategory?.id || updatedCase.subcategory || 'general',
        caseTitle: updatedCase.title || `${formData.personalInfo.firstName} ${formData.personalInfo.lastName} Immigration Case`,
        caseDescription: updatedCase.description || `Immigration case for ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,

        // Form information
        selectedForms: selectedForms || [],
        formCaseIds: formCaseIds || {},

        // Additional metadata
        workflowStep: currentStep,
        timestamp: new Date().toISOString(),
        autoFillSource: 'IndividualImmigrationProcess'
      };

      // Custom validation - only require essential fields
      const missingFields = [];

      if (!autoFillData.clientFirstName) missingFields.push('First Name');
      if (!autoFillData.clientLastName) missingFields.push('Last Name');
      if (!autoFillData.clientEmail) missingFields.push('Email');
      if (!autoFillData.clientPhone) missingFields.push('Phone');
      if (!autoFillData.clientStreet) missingFields.push('Street Address');
      if (!autoFillData.clientCity) missingFields.push('City');
      if (!autoFillData.clientState) missingFields.push('State');
      if (!autoFillData.clientZipCode) missingFields.push('ZIP Code');

      if (missingFields.length > 0) {
        toast.error(`Please complete the following required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Prepare the data for the API
      const preparedData = prepareFormData(autoFillData);

      // Generate forms for each selected form
      const newGeneratedForms = [];

      for (const formName of selectedForms) {
        try {
          // For now, we'll use a template ID based on the form name
          // In a real implementation, you'd map form names to actual template IDs
          const templateId = formName.toLowerCase().replace(/[^a-z0-9]/g, '-');

          // Add a placeholder for generating status
          newGeneratedForms.push({
            formName,
            templateId,
            blob: new Blob(),
            downloadUrl: '',
            fileName: `${formName}_${new Date().toISOString().split('T')[0]}.pdf`,
            status: 'generating' as const
          });

          // Call renderFormWithData
          const response = await renderFormWithData(templateId, preparedData);

          if (response.data) {
            // Create download URL
            const downloadUrl = createPdfBlobUrl(response.data);
            const fileName = `${formName}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Update the form with success status
            const formIndex: number = newGeneratedForms.findIndex(f => f.formName === formName);
            if (formIndex !== -1) {
              newGeneratedForms[formIndex] = {
                formName,
                templateId,
                blob: response.data,
                downloadUrl,
                fileName,
                status: 'success' as const
              };
            }

            toast.success(`${formName} generated successfully!`);
          }
        } catch (error) {
          // Update the form with error status
          const formIndex: number = newGeneratedForms.findIndex(f => f.formName === formName);
          if (formIndex !== -1) {
            newGeneratedForms[formIndex] = {
              formName,
              templateId: '',
              blob: new Blob(),
              downloadUrl: '',
              fileName: '',
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }

          toast.error(`Failed to generate ${formName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setGeneratedForms(newGeneratedForms);

      if (newGeneratedForms.some(f => f.status === 'success')) {
        toast.success('Forms generated successfully!');
      }

    } catch (error) {
      toast.error('Failed to generate forms. Please try again.');
    } finally {
      setGeneratingForms(false);
    }
  };

  // Helper function to update step progress
  const updateStepProgress = (stepNumber: number, completed: boolean) => {
    setStepsProgress(prev =>
      prev.map(step =>
        step.step === stepNumber
          ? { ...step, completed, completedAt: completed ? new Date().toISOString() : undefined }
          : step
      )
    );
  };

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

  const handlePersonalInfoChange = (field: string, value: any) => {
    // Clear error for this field when user types
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    setFormData(prev => {
      const newFormData = {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value
        }
      };

      // Clear spouse and children data if marital status changes to single
      if (field === 'maritalStatus' && value === 'single') {
        newFormData.personalInfo.spouse = {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          nationality: '',
          alienRegistrationNumber: ''
        };
        newFormData.personalInfo.children = [];
      }

      return newFormData;
    });
  };

  const handleAddressChange = (field: string, value: string) => {
    // Clear error for this field when user types
    if (formErrors[`address.${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`address.${field}`];
        return newErrors;
      });
    }

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

  // New handler functions for additional fields

  const handlePlaceOfBirthChange = (field: string, value: string) => {
    // Clear error for this field when user types
    if (formErrors[`placeOfBirth.${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`placeOfBirth.${field}`];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        placeOfBirth: {
          ...prev.personalInfo.placeOfBirth,
          [field]: value
        }
      }
    }));
  };

  const handleSpouseChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        spouse: {
          ...prev.personalInfo.spouse,
          [field]: value
        }
      }
    }));
  };

  const handleChildChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        children: prev.personalInfo.children.map((child, i) => 
          i === index ? { ...child, [field]: value } : child
        )
      }
    }));
  };

  const handleAddChild = () => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        children: [
          ...prev.personalInfo.children,
          {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            nationality: '',
            alienRegistrationNumber: ''
          }
        ]
      }
    }));
  };

  const handleRemoveChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        children: prev.personalInfo.children.filter((_, i) => i !== index)
      }
    }));
  };

  const handleEmploymentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        employment: {
          ...prev.personalInfo.employment,
          [field]: value
        }
      }
    }));
  };

  const handleEmployerAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        employment: {
          ...prev.personalInfo.employment,
          currentEmployer: {
            ...prev.personalInfo.employment.currentEmployer,
            address: {
              ...prev.personalInfo.employment.currentEmployer.address,
              [field]: value
            }
          }
        }
      }
    }));
  };

  const handleEducationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        education: {
          ...prev.personalInfo.education,
          [field]: value
        }
      }
    }));
  };

  const handleEducationDatesChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        education: {
          ...prev.personalInfo.education,
          datesAttended: {
            ...prev.personalInfo.education.datesAttended,
            [field]: value
          }
        }
      }
    }));
  };

  const handleTravelHistoryChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        travelHistory: prev.personalInfo.travelHistory.map((travel, i) => 
          i === index ? { ...travel, [field]: value } : travel
        )
      }
    }));
  };

  const handleAddTravelHistory = () => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        travelHistory: [
          ...prev.personalInfo.travelHistory,
          {
            country: '',
            visitDate: '',
            purpose: '',
            duration: undefined
          }
        ]
      }
    }));
  };

  const handleRemoveTravelHistory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        travelHistory: prev.personalInfo.travelHistory.filter((_, i) => i !== index)
      }
    }));
  };

  const handleFinancialInfoChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        financialInfo: {
          ...prev.personalInfo.financialInfo,
          [field]: value
        }
      }
    }));
  };

  const handleCriminalHistoryChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        criminalHistory: {
          ...prev.personalInfo.criminalHistory,
          [field]: value
        }
      }
    }));
  };

  const handleMedicalHistoryChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        medicalHistory: {
          ...prev.personalInfo.medicalHistory,
          [field]: value
        }
      }
    }));
  };


  const handleSubmit = async () => {
    try {
      // Update client and case data from form data
      updateClientFromFormData();
      const updatedCase = updateCaseFromFormData();

      // Generate form case IDs if forms are selected
      if (selectedForms.length > 0) {
        generateFormCaseIds(selectedForms);
      }

      // Save workflow progress to backend
      try {
        await saveWorkflowProgress();

        toast.success('Immigration case created successfully!');

        // Navigate to case details or dashboard
        navigate('/cases');

      } catch (error) {
        console.error('Error saving to backend:', error);
        // Fallback to local storage if API fails
        const caseData = {
          id: generateObjectId(),
          client: client,
          case: updatedCase,
          selectedForms,
          formCaseIds,
          createdAt: new Date().toISOString(),
          status: 'draft'
        };

        localStorage.setItem(`immigration-case-${caseData?.id || generateObjectId()}`, JSON.stringify(caseData));
        toast.success('Case saved locally. Please check your internet connection and try again later.');
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error submitting application. Please try again.');
    }
  };

  // Form selection handler for new workflow
  const handleFormSelection = (formNumber: string) => {
    setSelectedForms(prev => {
      if (prev.includes(formNumber)) {
        return prev.filter(f => f !== formNumber);
      } else {
        return [...prev, formNumber];
      }
    });
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
        await questionnaireService.submitQuestionnaireResponse(
          selectedCustomQuestionnaire.id,
          {
            responses: customQuestionnaireAnswers,
            auto_save: false
          }
        );


      } else {

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
      console.error('Failed to submit questionnaire: ' + error.message);
    }
  };

  // Function to download a specific form
  const handleDownloadForm = (formName: string) => {
    const form = generatedForms.find(f => f.formName === formName);
    if (form && form.status === 'success') {
      downloadPdfFile(form.blob, form.fileName);
    }
  };

  // Function to preview a specific form
  const handlePreviewForm = (formName: string) => {
    setShowPreview(prev => ({
      ...prev,
      [formName]: !prev[formName]
    }));
  };

  // Function to close preview
  const handleClosePreview = (formName: string) => {
    setShowPreview(prev => ({
      ...prev,
      [formName]: false
    }));
  };

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      generatedForms.forEach(form => {
        if (form.downloadUrl) {
          revokePdfBlobUrl(form.downloadUrl);
        }
      });
      
    };
  }, [generatedForms]);

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
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${field.eligibility_impact === 'high' ? 'bg-red-100 text-red-800' :
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${category.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
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

  const renderFormSelectionStep = () => (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Select USCIS Forms</h2>
        <p className="text-gray-600 mt-2">Choose the immigration forms you need to file:</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-gray-500 mt-4">Loading available forms...</div>
        </div>
      ) : availableForms.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">No forms available at the moment.</div>
          <div className="text-sm text-gray-500">Please try again later or contact support.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableForms.map((form) => (
            <motion.div
              key={form.formNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedForms.includes(form.formNumber)
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              onClick={() => handleFormSelection(form.formNumber)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {form.category}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.formNumber}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{form.title}</p>
              <p className="text-xs text-gray-500 mb-2">{form.description}</p>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{form.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee:</span>
                  <span className="font-medium">${(form.fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${form.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                    {form.status}
                  </span>
                </div>
              </div>

              {selectedForms.includes(form.formNumber) && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                </div>
              )}

            </motion.div>
          ))}
        </div>
      )}


      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Previous</span>
        </button>
        <button
          onClick={handleFormSelectionNext}
          disabled={selectedForms.length === 0 || loading}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${selectedForms.length > 0 && !loading
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Next Step</span>
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPersonalDetailsStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
        <p className="text-gray-600 mt-2">Please provide your comprehensive personal information</p>
      </div>

      {/* Basic Information Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          Basic Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              value={formData.personalInfo.firstName}
              onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['firstName'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('firstName')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              value={formData.personalInfo.lastName}
              onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['lastName'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('lastName')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.personalInfo.email}
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['email'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('email')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.personalInfo.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['phone'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('phone')}
          </div>
        </div>
      </div>

      {/* Personal Details Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          Personal Details
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              value={formData.personalInfo.dateOfBirth}
              onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['dateOfBirth'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('dateOfBirth')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
            <input
              type="text"
              value={formData.personalInfo.nationality}
              onChange={(e) => handlePersonalInfoChange('nationality', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['nationality'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('nationality')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={formData.personalInfo.gender}
              onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['gender'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
            <select
              value={formData.personalInfo.maritalStatus}
              onChange={(e) => handlePersonalInfoChange('maritalStatus', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['maritalStatus'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Immigration Purpose</label>
            <select
              value={formData.personalInfo.immigrationPurpose}
              onChange={(e) => handlePersonalInfoChange('immigrationPurpose', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
        </div>
      </div>

      {/* Address Information Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          Address Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
            <input
              type="text"
              value={formData.personalInfo.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['address.street'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('address.street')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              value={formData.personalInfo.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['address.city'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('address.city')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
            <input
              type="text"
              value={formData.personalInfo.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['address.state'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('address.state')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
            <input
              type="text"
              value={formData.personalInfo.address.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['address.zipCode'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('address.zipCode')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <input
              type="text"
              value={formData.personalInfo.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['address.country'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              required
            />
            {getError('address.country')}
          </div>
        </div>
      </div>

      {/* Place of Birth Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          Place of Birth
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={formData.personalInfo.placeOfBirth.city}
              onChange={(e) => handlePlaceOfBirthChange('city', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['placeOfBirth.city'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
            {getError('placeOfBirth.city')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={formData.personalInfo.placeOfBirth.state}
              onChange={(e) => handlePlaceOfBirthChange('state', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              value={formData.personalInfo.placeOfBirth.country}
              onChange={(e) => handlePlaceOfBirthChange('country', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['placeOfBirth.country'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
            {getError('placeOfBirth.country')}
          </div>
        </div>
      </div>

      {/* Identification Numbers Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          Identification Numbers
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
            <input
              type="text"
              value={formData.personalInfo.passportNumber}
              onChange={(e) => handlePersonalInfoChange('passportNumber', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['passportNumber'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
            {getError('passportNumber')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alien Registration Number (A-Number)</label>
            <input
              type="text"
              value={formData.personalInfo.alienRegistrationNumber}
              onChange={(e) => handlePersonalInfoChange('alienRegistrationNumber', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['alienRegistrationNumber'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
            {getError('alienRegistrationNumber')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number</label>
            <input
              type="text"
              value={formData.personalInfo.nationalIdNumber}
              onChange={(e) => handlePersonalInfoChange('nationalIdNumber', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['nationalIdNumber'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
            {getError('nationalIdNumber')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Security Number (SSN)</label>
            <input
              type="text"
              value={formData.personalInfo.ssn}
              onChange={(e) => handlePersonalInfoChange('ssn', e.target.value)}
              className={`w-full px-4 py-3 border ${
                formErrors['ssn'] ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              placeholder="XXX-XX-XXXX"
            />
            {getError('ssn')}
          </div>
        </div>
      </div>

      {/* Family Information Section - Only show if not single */}
      {formData.personalInfo.maritalStatus && formData.personalInfo.maritalStatus !== 'single' ? (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            Family Information
          </h3>
          
          {/* Spouse Information - Only show if married, civil_union, or separated */}
          {(formData.personalInfo.maritalStatus === 'married' || 
            formData.personalInfo.maritalStatus === 'civil_union' || 
            formData.personalInfo.maritalStatus === 'separated') && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">Spouse Information</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.personalInfo.spouse.firstName}
                    onChange={(e) => handleSpouseChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.personalInfo.spouse.lastName}
                    onChange={(e) => handleSpouseChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.personalInfo.spouse.dateOfBirth}
                    onChange={(e) => handleSpouseChange('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                  <input
                    type="text"
                    value={formData.personalInfo.spouse.nationality}
                    onChange={(e) => handleSpouseChange('nationality', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alien Registration Number</label>
                  <input
                    type="text"
                    value={formData.personalInfo.spouse.alienRegistrationNumber}
                    onChange={(e) => handleSpouseChange('alienRegistrationNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Children Information - Show for married, civil_union, separated, divorced, widowed */}
          {(formData.personalInfo.maritalStatus === 'married' || 
            formData.personalInfo.maritalStatus === 'civil_union' || 
            formData.personalInfo.maritalStatus === 'separated' ||
            formData.personalInfo.maritalStatus === 'divorced' ||
            formData.personalInfo.maritalStatus === 'widowed') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-800">Children Information</h4>
                <button
                  type="button"
                  onClick={handleAddChild}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Child
                </button>
              </div>
              {formData.personalInfo.children.map((child, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700">Child {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => handleRemoveChild(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={child.firstName}
                        onChange={(e) => handleChildChange(index, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={child.lastName}
                        onChange={(e) => handleChildChange(index, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={child.dateOfBirth}
                        onChange={(e) => handleChildChange(index, 'dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={child.nationality}
                        onChange={(e) => handleChildChange(index, 'nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alien Registration Number</label>
                      <input
                        type="text"
                        value={child.alienRegistrationNumber}
                        onChange={(e) => handleChildChange(index, 'alienRegistrationNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : formData.personalInfo.maritalStatus === 'single' ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Family Information</h3>
              <p className="text-sm text-gray-600 mt-1">
                Family information is not required for single individuals. This section will appear if you change your marital status.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Travel History Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          Travel History
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">List your travel history to other countries</p>
            <button
              type="button"
              onClick={handleAddTravelHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add Travel Entry
            </button>
          </div>
          {formData.personalInfo.travelHistory.map((travel, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700">Travel Entry {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => handleRemoveTravelHistory(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={travel.country || ''}
                    onChange={(e) => handleTravelHistoryChange(index, 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Country visited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                  <input
                    type="date"
                    value={travel.visitDate || ''}
                    onChange={(e) => handleTravelHistoryChange(index, 'visitDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <select
                    value={travel.purpose || ''}
                    onChange={(e) => handleTravelHistoryChange(index, 'purpose', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={travel.duration || ''}
                    onChange={(e) => handleTravelHistoryChange(index, 'duration', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of days"
                  />
                </div>
              </div>
            </div>
          ))}
          {formData.personalInfo.travelHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No travel history added yet</p>
              <p className="text-sm">Click "Add Travel Entry" to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="h-5 w-5 text-blue-600 mr-2" />
          Documents
        </h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Passport, Birth Certificate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                <option value="">Select Category</option>
                <option value="identity">Identity Documents</option>
                <option value="immigration">Immigration Documents</option>
                <option value="education">Education Records</option>
                <option value="employment">Employment Records</option>
                <option value="financial">Financial Documents</option>
                <option value="medical">Medical Records</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add Document
            </button>
          </div>
        </div>
      </div>


      {/* Emergency Contact Information */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
          Emergency Contact Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Full name of emergency contact"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="child">Child</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Emergency contact phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Emergency contact email"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Emergency contact address"
            />
          </div>
        </div>
      </div>

      {/* Employment Information Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
          Employment Information
        </h3>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Employer</label>
              <input
                type="text"
                value={formData.personalInfo.employment.currentEmployer.name || ''}
                onChange={(e) => handleEmploymentChange('currentEmployer', { ...formData.personalInfo.employment.currentEmployer, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.personalInfo.employment.jobTitle || ''}
                onChange={(e) => handleEmploymentChange('jobTitle', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Your job title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Start Date</label>
              <input
                type="date"
                value={formData.personalInfo.employment.employmentStartDate || ''}
                onChange={(e) => handleEmploymentChange('employmentStartDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
              <input
                type="number"
                value={formData.personalInfo.employment.annualIncome || ''}
                onChange={(e) => handleEmploymentChange('annualIncome', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Annual salary"
              />
            </div>
          </div>
          
          {/* Employer Address */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Employer Address</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={formData.personalInfo.employment.currentEmployer.address.street || ''}
                  onChange={(e) => handleEmployerAddressChange('street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Employer street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.personalInfo.employment.currentEmployer.address.city || ''}
                  onChange={(e) => handleEmployerAddressChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.personalInfo.employment.currentEmployer.address.state || ''}
                  onChange={(e) => handleEmployerAddressChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.personalInfo.employment.currentEmployer.address.zipCode || ''}
                  onChange={(e) => handleEmployerAddressChange('zipCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="ZIP Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.personalInfo.employment.currentEmployer.address.country || ''}
                  onChange={(e) => handleEmployerAddressChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Information Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          Education Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Highest Education Level</label>
            <select
              value={formData.personalInfo.education.highestLevel || ''}
              onChange={(e) => handleEducationChange('highestLevel', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
            <input
              type="text"
              value={formData.personalInfo.education.institutionName || ''}
              onChange={(e) => handleEducationChange('institutionName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="University or school name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={formData.personalInfo.education.datesAttended.startDate || ''}
              onChange={(e) => handleEducationDatesChange('startDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={formData.personalInfo.education.datesAttended.endDate || ''}
              onChange={(e) => handleEducationDatesChange('endDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
            <input
              type="text"
              value={formData.personalInfo.education.fieldOfStudy || ''}
              onChange={(e) => handleEducationChange('fieldOfStudy', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Computer Science, Business Administration"
            />
          </div>
        </div>
      </div>

      {/* Financial Information Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="h-5 w-5 text-blue-600 mr-2" />
          Financial Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
            <input
              type="number"
              value={formData.personalInfo.financialInfo.annualIncome || ''}
              onChange={(e) => handleFinancialInfoChange('annualIncome', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Annual income amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source of Funds</label>
            <select
              value={formData.personalInfo.financialInfo.sourceOfFunds || ''}
              onChange={(e) => handleFinancialInfoChange('sourceOfFunds', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Balance</label>
            <input
              type="number"
              value={formData.personalInfo.financialInfo.bankAccountBalance || ''}
              onChange={(e) => handleFinancialInfoChange('bankAccountBalance', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Current bank balance"
            />
          </div>
        </div>
      </div>

      {/* Background Information Section */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
          Background Information
        </h3>
        <div className="space-y-6">
          {/* Criminal History */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Criminal History</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasCriminalRecord"
                  checked={formData.personalInfo.criminalHistory.hasCriminalRecord || false}
                  onChange={(e) => handleCriminalHistoryChange('hasCriminalRecord', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasCriminalRecord" className="ml-2 text-sm font-medium text-gray-700">
                  I have a criminal record
                </label>
              </div>
              {formData.personalInfo.criminalHistory.hasCriminalRecord && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Criminal Record Details</label>
                  <textarea
                    value={formData.personalInfo.criminalHistory.details || ''}
                    onChange={(e) => handleCriminalHistoryChange('details', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Please provide details about your criminal record..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Medical History */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Medical History</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasMedicalConditions"
                  checked={formData.personalInfo.medicalHistory.hasMedicalConditions || false}
                  onChange={(e) => handleMedicalHistoryChange('hasMedicalConditions', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasMedicalConditions" className="ml-2 text-sm font-medium text-gray-700">
                  I have medical conditions
                </label>
              </div>
              {formData.personalInfo.medicalHistory.hasMedicalConditions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical Condition Details</label>
                  <textarea
                    value={formData.personalInfo.medicalHistory.details || ''}
                    onChange={(e) => handleMedicalHistoryChange('details', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Please provide details about your medical conditions..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handleUpdatePersonalDetails}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${loading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Update Details</span>
            </>
          )}
        </button>
        <button
          onClick={handlePersonalDetailsNext}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span>Next Step</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderCreateCaseStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Create Case</h2>
        <p className="text-gray-600 mt-2">Create a case for your immigration workflow</p>
      </div>

      {/* Selected Forms Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          Selected Forms
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {selectedForms.map((formNumber) => {
            const form = availableForms.find(f => f.formNumber === formNumber);
            return (
              <div key={formNumber} className="flex items-center p-3 bg-white rounded-lg border border-blue-200">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">{formNumber}</div>
                  <div className="text-sm text-gray-600">{form?.title || 'Form'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Case Details Form */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
          Case Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
            <select
              value={selectedCategory?.id || ''}
              onChange={(e) => {
                const category = immigrationCategories.find(c => c.id === e.target.value);
                setSelectedCategory(category || null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select Category</option>
              {immigrationCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value="High"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled
            >
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
            <select
              value={formData.immigrationInfo.currentStatus}
              onChange={(e) => handleImmigrationInfoChange('currentStatus', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Visa Type</label>
            <input
              type="text"
              value={formData.immigrationInfo.visaType}
              onChange={(e) => handleImmigrationInfoChange('visaType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., H-1B, F-1, etc."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Previous</span>
        </button>
        <button
          onClick={handleCreateCaseNext}
          disabled={loading}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${loading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Case...</span>
            </>
          ) : (
            <>
              <span>Next Step</span>
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderFormReviewStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Form Review</h2>
        <p className="text-gray-600 mt-2">Review form details and field mappings for your selected forms</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-gray-500 mt-4">Loading form review...</div>
        </div>
      ) : formReview ? (
        <div className="space-y-6">
          {/* Form Details */}
          {formReview.formDetails.map((formDetail, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{formDetail.formNumber}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {formDetail.uscisForm.category}
                </span>
              </div>

              <p className="text-gray-600 mb-4">{formDetail.uscisForm.title}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Form Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Form Number:</span>
                      <span className="font-medium">{formDetail.uscisForm.formNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{formDetail.uscisForm.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Filing Fee:</span>
                      <span className="font-medium">${formDetail.uscisForm.fee ? formDetail.uscisForm.fee.toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Field Mapping</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Fields:</span>
                      <span className="font-medium">{formDetail.pdfTemplate.totalFields}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mapped Fields:</span>
                      <span className="font-medium text-green-600">{formDetail.pdfTemplate.mappedFields}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mapping Rate:</span>
                      <span className="font-medium text-green-600">
                        {Math.round((formDetail.pdfTemplate.mappedFields / formDetail.pdfTemplate.totalFields) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field Mapping Details */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Field Mappings</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formDetail.pdfTemplate.fieldMapping.slice(0, 10).map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <span className="text-gray-700">{field.displayName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">{field.parameterName}</span>
                        {field.required && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Required</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {formDetail.pdfTemplate.fieldMapping.length > 10 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{formDetail.pdfTemplate.fieldMapping.length - 10} more fields
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Data Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              Data Preview
            </h3>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(formReview.dataPreview, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">No form review data available</div>
          <div className="text-sm text-gray-500">Please complete the previous steps first</div>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Previous</span>
        </button>
        <button
          onClick={handleFormReviewNext}
          disabled={loading}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${loading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading Review...</span>
            </>
          ) : (
            <>
              <span>Next Step</span>
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderAutoFillStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Auto-fill Forms</h2>
        <p className="text-gray-600 mt-2">Generate filled PDF forms with your information</p>
      </div>

      {/* Auto-fill Action Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <FileCheck className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Generate Forms</h3>
            <p className="text-gray-600">Click the button below to auto-fill your {selectedForms[0]} form with all the information you've provided.</p>
          </div>
        </div>

        {/* Data Summary */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-2">Data Summary</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Client:</span>
              <span className="ml-2 font-medium">
                {formData.personalInfo.firstName} {formData.personalInfo.lastName}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium">
                {selectedCategory?.title || 'Immigration'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Subcategory:</span>
              <span className="ml-2 font-medium">
                {selectedSubcategory?.title || 'General'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Form:</span>
              <span className="ml-2 font-medium">{selectedForms[0]}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleAutoFillWithFormData}
            disabled={generatingForms}
            className={`px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${generatingForms
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
          >
            {generatingForms ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Forms...</span>
              </>
            ) : (
              <>
                <FileCheck className="h-5 w-5" />
                <span>Auto Generate Forms</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Forms Display */}
      {generatedForms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Generated Forms</h3>
          
          {/* Results Summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">Generation Complete</h4>
                <p className="text-sm text-green-700">
                  Successfully generated {generatedForms.filter(f => f.status === 'success').length} form(s)
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {generatedForms.filter(f => f.status === 'success').length}
                </div>
                <div className="text-xs text-green-600">Forms Generated</div>
              </div>
            </div>
          </div>

          {/* Generated PDFs */}
          {generatedForms.map((form, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">{form.formName}</h4>
                    <p className="text-sm text-gray-600">
                      {form.fileName} {form.status === 'success' && form.blob.size > 0 && `(${(form.blob.size / 1024).toFixed(1)} KB)`}
                    </p>
                    {form.status === 'generating' && (
                      <div className="flex items-center text-blue-600 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Generating...
                      </div>
                    )}
                    {form.status === 'error' && (
                      <div className="text-red-600 text-sm">
                        Error: {form.error || 'Unknown error'}
                      </div>
                    )}
                  </div>
                </div>
                {form.status === 'success' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handlePreviewForm(form.formName)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleDownloadForm(form.formName)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Failed Forms */}
          {generatedForms.filter(f => f.status === 'error').length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="font-medium text-red-900 mb-2">Failed Forms</h4>
              <div className="space-y-1">
                {generatedForms.filter(f => f.status === 'error').map((form, index) => (
                  <div key={index} className="text-sm text-red-700">
                    {form.formName} - {form.error || 'Failed to generate'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF Preview Modal */}
      {Object.entries(showPreview).map(([formName, isVisible]) => {
        if (!isVisible) return null;
        const form = generatedForms.find(f => f.formName === formName);
        if (!form || form.status !== 'success') return null;

        return (
          <div key={formName} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Preview: {form.formName}</h3>
                <button
                  onClick={() => handleClosePreview(formName)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="overflow-auto max-h-[70vh]">
                <iframe
                  src={form.downloadUrl}
                  className="w-full h-96 border border-gray-200 rounded"
                  title={`Preview of ${form.formName}`}
                />
              </div>
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  onClick={() => handleClosePreview(formName)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadForm(formName)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Next Steps */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            Generate your forms using the auto-fill feature above
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            Preview the completed forms for accuracy
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            Download and print the forms
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            Sign where required and gather supporting documents
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            Submit to USCIS or appropriate authority
          </li>
        </ul>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Previous</span>
        </button>
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span>Complete Process</span>
          <CheckCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalDetailsStep();
      case 1:
        return renderFormSelectionStep();
      case 2:
        return renderCreateCaseStep();
      case 3:
        return renderFormReviewStep();
      case 4:
        return renderAutoFillStep();
      default:
        return null;
    }
  };

  // Show questionnaire first, then form steps
  if (showQuestionnaire) {
    return renderQuestionnaire();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matching LegalFirmWorkflow style */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-center h-16">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">
                Individual Immigration Process
              </h1>
              <p className="text-sm text-gray-500">
                Personal immigration application and form filing
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps - Enhanced styling */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${index <= currentStep
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-500'
                  }`}>
                  {index < currentStep ? <CheckCircle className="h-5 w-5" /> : step.stepNumber}
                </div>
                <span className={`ml-3 text-sm font-medium transition-colors duration-300 ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 transition-colors duration-300 ${index < currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content - Enhanced card styling */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualImmigrationProcess;

