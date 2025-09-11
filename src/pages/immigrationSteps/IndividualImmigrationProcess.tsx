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
  HelpCircle,
  FileCheck,
  Home,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import questionnaireService from '../../services/questionnaireService';
import { getFormTemplates, FormTemplate } from '../../controllers/SettingsControllers';
import { 
  renderFormWithData, 
  prepareFormData, 
  validateFormData,
  downloadPdfFile,
  createPdfBlobUrl,
  revokePdfBlobUrl
} from '../../controllers/FormAutoFillControllers';
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
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
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

  // State for form templates from API
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loadingFormTemplates, setLoadingFormTemplates] = useState(false);

  // Add state variables for case management (same as LegalFirmWorkflow)
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

  const [caseData, setCaseData] = useState<Case>({
    id: '',
    clientId: '',
    title: '',
    description: '',
    category: '',
    subcategory: '',
    status: 'draft',
    priority: 'medium',
    assignedForms: [],
    questionnaires: [],
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    visaType: '',
    priorityDate: new Date().toISOString(),
    openDate: new Date().toISOString()
  });

  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [formCaseIds, setFormCaseIds] = useState<FormCaseIds>({});
  const [formDetailsId, setFormDetailsId] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string>('');

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

  // Load available form templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingFormTemplates(true);
      try {
        // You may want to pass userId or params as needed
        const response = await getFormTemplates('');

        setFormTemplates(response.data.templates || []);
      } catch (error) {
        console.error('Error loading form templates:', error);
        setFormTemplates([]);
      }
      setLoadingFormTemplates(false);
    };
    fetchTemplates();
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
          id: caseData.id || generateObjectId(),
          _id: caseData._id || caseData.id || generateObjectId()
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
    const newCase: Case = {
      ...caseData,
      title: `${selectedCategory?.title || 'Immigration'} Case - ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
      description: `Immigration case for ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
      category: selectedCategory?.id || 'immigration',
      subcategory: selectedSubcategory?.id || 'general',
      visaType: formData.immigrationInfo.visaType,
      assignedForms: selectedForms,
      clientId: client.id || client._id || generateObjectId()
    };
    setCaseData(newCase);
    return newCase;
  };

  const steps: ImmigrationStep[] = [
    { id: 'select-form', title: 'Select the Form', description: 'Choose the immigration form to complete', isCompleted: false, isActive: true },
    { id: 'personal-details', title: 'Personal Details', description: 'Basic personal information', isCompleted: false, isActive: false },
    { id: 'case-details', title: 'Case Details', description: 'Immigration case information', isCompleted: false, isActive: false },
    { id: 'form-details', title: 'Form Details', description: 'Complete form information', isCompleted: false, isActive: false },
    { id: 'auto-fill', title: 'Auto-fill Forms', description: 'Generate completed forms', isCompleted: false, isActive: false }
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
      // Update client and case data from form data
      const updatedClient = updateClientFromFormData();
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
          client: updatedClient,
          case: updatedCase,
          selectedForms,
          formCaseIds,
          createdAt: new Date().toISOString(),
          status: 'draft'
        };
        
        localStorage.setItem(`immigration-case-${caseData.id}`, JSON.stringify(caseData));
        toast.success('Case saved locally. Please check your internet connection and try again later.');
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error submitting application. Please try again.');
    }
  };

  // Add form selection handler
  const handleFormSelection = (formName: string) => {
    setSelectedForms([formName]); // Single form selection for now
    // Generate case ID for the selected form
    generateFormCaseIds([formName]);
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

  // Auto-fill forms functionality
  const handleAutoFillWithFormData = async () => {
    try {
      setGeneratingForms(true);
      setGeneratedForms([]);

      // Ensure case data is up to date before proceeding
      const updatedClient = updateClientFromFormData();
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
        <h2 className="text-2xl font-bold text-gray-900">Select Immigration Form</h2>
        <p className="text-gray-600 mt-2">Choose the immigration form you need to complete:</p>
      </div>

      {loadingFormTemplates ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading form templates...</div>
        </div>
      ) : formTemplates.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">No form templates available from API.</div>
          <div className="text-sm text-gray-500 mb-6">Showing default immigration forms instead.</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formData.forms.map((form) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedForms.includes(form.name)
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                onClick={() => handleFormSelection(form.name)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  {form.isRequired && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Required</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{form.description}</p>

                {selectedForms.includes(form.name) && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formTemplates.map((template) => (
            <motion.div
              key={template._id || template.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedForms.includes(template.name)
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              onClick={() => handleFormSelection(template.name)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {template.category}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
              
              {template.metadata?.uscisFormNumber && (
                <div className="text-xs text-gray-500 mb-2">
                  USCIS Form: {template.metadata.uscisFormNumber}
                </div>
              )}
              
              {template.metadata?.estimatedProcessingTime && (
                <div className="text-xs text-gray-500 mb-2">
                  Processing Time: {template.metadata.estimatedProcessingTime}
                </div>
              )}

              {selectedForms.includes(template.name) && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleNext}
                          disabled={selectedForms.length === 0}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${selectedForms.length > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          <span>Next Step</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderPersonalDetailsStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
        <p className="text-gray-600 mt-2">Please provide your basic personal information</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              value={formData.personalInfo.firstName}
              onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              value={formData.personalInfo.lastName}
              onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              value={formData.personalInfo.dateOfBirth}
              onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Place of Birth *</label>
            <input
              type="text"
              value={formData.personalInfo.placeOfBirth}
              onChange={(e) => handlePersonalInfoChange('placeOfBirth', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
            <input
              type="text"
              value={formData.personalInfo.passportNumber}
              onChange={(e) => handlePersonalInfoChange('passportNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.personalInfo.email}
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.personalInfo.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              value={formData.personalInfo.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
            <input
              type="text"
              value={formData.personalInfo.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
            <input
              type="text"
              value={formData.personalInfo.address.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <input
              type="text"
              value={formData.personalInfo.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
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
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span>Next Step</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderCaseDetailsStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Case Details</h2>
        <p className="text-gray-600 mt-2">Provide information about your immigration case</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
          Immigration Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Immigration Status</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Entry</label>
            <input
              type="date"
              value={formData.immigrationInfo.entryDate}
              onChange={(e) => handleImmigrationInfoChange('entryDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Visa Type</label>
            <input
              type="text"
              value={formData.immigrationInfo.visaType}
              onChange={(e) => handleImmigrationInfoChange('visaType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intended Immigration Category</label>
            <select
              value={formData.immigrationInfo.intendedCategory}
              onChange={(e) => handleImmigrationInfoChange('intendedCategory', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select Category</option>
              <option value="family-based">Family-Based</option>
              <option value="employment-based">Employment-Based</option>
              <option value="humanitarian">Humanitarian</option>
              <option value="naturalization">Naturalization</option>
            </select>
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
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span>Next Step</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderFormDetailsStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Form Details</h2>
        <p className="text-gray-600 mt-2">Complete the specific details required for {selectedForms[0]}</p>
      </div>

      {/* Selected Form Template Details */}
      {selectedForms[0] && (() => {
        const selectedTemplate = formTemplates.find(t => t.name === selectedForms[0]);
        return selectedTemplate ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-green-600 mr-2" />
              Selected Form Template: {selectedTemplate.name}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-3">{selectedTemplate.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">{selectedTemplate.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">{selectedTemplate.type}</span>
                  </div>
                  {selectedTemplate.metadata?.uscisFormNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">USCIS Form:</span>
                      <span className="font-medium text-gray-900">{selectedTemplate.metadata.uscisFormNumber}</span>
                    </div>
                  )}
                  {selectedTemplate.metadata?.estimatedProcessingTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Time:</span>
                      <span className="font-medium text-gray-900">{selectedTemplate.metadata.estimatedProcessingTime}</span>
                    </div>
                  )}
                  {selectedTemplate.metadata?.fee && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Filing Fee:</span>
                      <span className="font-medium text-gray-900">${selectedTemplate.metadata.fee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Form Fields ({selectedTemplate.fields.length})</h4>
                <div className="space-y-2 text-sm">
                  {selectedTemplate.fields.slice(0, 5).map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-gray-700">{field.label}</span>
                      <span className={`px-2 py-1 rounded text-xs ${field.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {field.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  ))}
                  {selectedTemplate.fields.length > 5 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{selectedTemplate.fields.length - 5} more fields
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Preview Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="h-5 w-5 text-blue-600 mr-2" />
          Preview of Entered Details
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information Preview */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Personal Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">
                  {formData.personalInfo.firstName} {formData.personalInfo.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date of Birth:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.dateOfBirth || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Place of Birth:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.placeOfBirth || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nationality:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.nationality || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Address Information Preview */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Address Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Street:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.address.street || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">City:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.address.city || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">State:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.address.state || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ZIP Code:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.address.zipCode || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span className="font-medium text-gray-900">{formData.personalInfo.address.country || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Immigration Information Preview */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide mb-3">Immigration Information</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Status:</span>
                <span className="font-medium text-gray-900">{formData.immigrationInfo.currentStatus || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entry Date:</span>
                <span className="font-medium text-gray-900">{formData.immigrationInfo.entryDate || 'Not provided'}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Visa Type:</span>
                <span className="font-medium text-gray-900">{formData.immigrationInfo.visaType || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Intended Category:</span>
                <span className="font-medium text-gray-900">{formData.immigrationInfo.intendedCategory || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Data Preview for Auto-fill */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide mb-3">JSON Data for Auto-fill</h4>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-400 text-sm font-mono">Data that will be sent to auto-fill API</span>
              <button
                onClick={() => {
                  const jsonData = {
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
                    // Case information
                    caseCategory: selectedCategory?.id || 'immigration',
                    caseSubcategory: selectedSubcategory?.id || 'general',
                    caseTitle: caseData.title || `${formData.personalInfo.firstName} ${formData.personalInfo.lastName} Immigration Case`,
                    caseDescription: caseData.description || `Immigration case for ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
                    // Form information
                    selectedForms: selectedForms || [],
                    formCaseIds: formCaseIds || {},
                    // Additional metadata
                    workflowStep: currentStep,
                    timestamp: new Date().toISOString(),
                    autoFillSource: 'IndividualImmigrationProcess'
                  };
                  navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
                  toast.success('JSON data copied to clipboard!');
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Copy JSON
              </button>
            </div>
            <pre className="text-green-400 text-xs overflow-x-auto">
              {JSON.stringify({
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
                // Case information
                caseCategory: selectedCategory?.id || 'immigration',
                caseSubcategory: selectedSubcategory?.id || 'general',
                caseTitle: caseData.title || `${formData.personalInfo.firstName} ${formData.personalInfo.lastName} Immigration Case`,
                caseDescription: caseData.description || `Immigration case for ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
                // Form information
                selectedForms: selectedForms || [],
                formCaseIds: formCaseIds || {},
                // Additional metadata
                workflowStep: currentStep,
                timestamp: new Date().toISOString(),
                autoFillSource: 'IndividualImmigrationProcess'
              }, null, 2)}
            </pre>
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
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span>Next Step</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderAutoFillStep = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Auto-fill Forms</h2>
        <p className="text-gray-600 mt-2">Generate completed forms with your information</p>
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
            className={`px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
              generatingForms
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
          {generatedForms.map((form, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">{form.formName}</h4>
                    <p className="text-sm text-gray-600">
                      {form.status === 'generating' && 'Generating...'}
                      {form.status === 'success' && 'Ready for download'}
                      {form.status === 'error' && `Error: ${form.error}`}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {form.status === 'success' && (
                    <>
                      <button
                        onClick={() => handlePreviewForm(form.formName)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownloadForm(form.formName)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Download
                      </button>
                    </>
                  )}
                  {form.status === 'generating' && (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Generating...
                    </div>
                  )}
                  {form.status === 'error' && (
                    <div className="text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Failed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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
        return renderFormSelectionStep();
      case 1:
        return renderPersonalDetailsStep();
      case 2:
        return renderCaseDetailsStep();
      case 3:
        return renderFormDetailsStep();
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
                  {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
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

