import React, { useState, useEffect } from 'react';
import {
  Users, FileText, ClipboardList, Send, Download, CheckCircle,
  ArrowRight, ArrowLeft, User, Briefcase,
  MessageSquare, FileCheck, AlertCircle, Info as InfoIcon,
  Loader, Loader2, Check, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { AUTH_END_POINTS } from '../utils/constants';

import { validateMongoObjectId, isValidMongoObjectId, generateObjectId } from '../utils/idValidation';
import {
  generateMultipleCaseIdsFromAPI
} from '../utils/caseIdGenerator';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import PdfEditor from '../components/pdf/PdfEditor';
import {
  
  getQuestionnaires
} from '../controllers/QuestionnaireControllers';
import {
  prepareFormData,
  downloadPdfFile,
  createPdfBlobUrl,
  revokePdfBlobUrl
} from '../controllers/FormAutoFillControllers';

import {
  submitQuestionnaireResponses,
  normalizeQuestionnaireStructure
} from '../controllers/QuestionnaireResponseControllers';
import {
  generateSecurePassword
} from '../controllers/UserCreationController';
import { getCompanyClients as fetchClientsFromAPI, createCompanyClient, Client as APIClient } from '../controllers/ClientControllers';
import { createEnhancedCase, EnhancedCaseData } from '../controllers/CaseControllers';
import { 
  getAnvilTemplatesList, 
  fillPdfTemplateBlob, 
  getTemplateIdsByFormNumber,
  saveEditedPdf,
  getPdfPreviewBlob
} from '../controllers/AnvilControllers';
import { FormTemplate } from '../controllers/SettingsControllers';
import { checkEmailExists } from '../controllers/AuthControllers';
import { 
  LEGAL_WORKFLOW_ENDPOINTS,
  FORM_TEMPLATE_CATEGORIES,
  FORM_TEMPLATE_TYPES,
  FORM_TEMPLATE_STATUS
} from '../utils/constants';
import {
  getWorkflowProgress,
  saveWorkflowProgress,
  fetchWorkflows,
  fetchWorkflowsForClientSearch,
  getWorkflowsByClient,
  createQuestionnaireAssignment,
  generateMultipleCaseIds,
  validateFormData,
  formatCaseId,
  isApiEndpointAvailable,
  Case,
  QuestionnaireAssignment
} from '../controllers/LegalFirmWorkflowController';

// Extend APIClient with optional _id field and name parts
type Client = APIClient & {
  _id?: string;
  firstName?: string;
  lastName?: string;
};

const IMMIGRATION_CATEGORIES = [
  {
    id: 'family-based',
    name: 'Family-Based Immigration',
    subcategories: [
      { id: 'spouse-citizen', name: 'Spouse of U.S. Citizen', forms: ['I-130', 'I-485', 'I-864'] },
      { id: 'parent-citizen', name: 'Parent of U.S. Citizen (21+)', forms: ['I-130', 'I-485', 'I-864'] },
      { id: 'child-citizen', name: 'Child of U.S. Citizen (Under 21)', forms: ['I-130', 'I-485', 'I-864'] },
      { id: 'sibling-citizen', name: 'Brother/Sister of U.S. Citizen', forms: ['I-130'] }
    ]
  },
  {
    id: 'employment-based',
    name: 'Employment-Based Immigration',
    subcategories: [
      { id: 'eb1-extraordinary', name: 'EB-1A Extraordinary Ability', forms: ['I-140', 'I-485'] },
      { id: 'eb2-advanced', name: 'EB-2 Advanced Degree', forms: ['I-140', 'I-485', 'ETA-9089'] },
      { id: 'eb3-skilled', name: 'EB-3 Skilled Workers', forms: ['I-140', 'I-485', 'ETA-9089'] }
    ]
  },
  {
    id: 'humanitarian',
    name: 'Humanitarian Relief',
    subcategories: [
      { id: 'asylum', name: 'Asylum Application', forms: ['I-589', 'I-765'] },
      { id: 'u-visa', name: 'U Visa (Crime Victims)', forms: ['I-918', 'I-765'] }
    ]
  },
  {
    id: 'citizenship',
    name: 'Citizenship & Naturalization',
    subcategories: [
      { id: 'naturalization-5year', name: '5-Year Naturalization Rule', forms: ['N-400'] },
      { id: 'naturalization-3year', name: '3-Year Rule (Spouse of Citizen)', forms: ['N-400'] }
    ]
  },
  {
    id: 'temporary-visas',
    name: 'Temporary Visas & Status',
    subcategories: [
      { id: 'work-authorization', name: 'Work Authorization (EAD)', forms: ['I-765'] },
      { id: 'advance-parole', name: 'Advance Parole (Travel Document)', forms: ['I-131'] }
    ]
  },
  {
    id: 'nonimmigrant-work',
    name: 'Non-immigrant Work Visas',
    subcategories: [
      { id: 'h1b-specialty', name: 'H-1B Specialty Occupation', forms: ['I-129', 'DS-160'] },
      { id: 'l1-intracompany', name: 'L-1 Intracompany Transfer', forms: ['I-129', 'DS-160'] },
      { id: 'o1-extraordinary', name: 'O-1 Extraordinary Ability', forms: ['I-129', 'DS-160'] },
      { id: 'tn-nafta', name: 'TN NAFTA Professional', forms: ['DS-160'] }
    ]
  },
  {
    id: 'student-exchange',
    name: 'Student & Exchange Visas',
    subcategories: [
      { id: 'f1-student', name: 'F-1 Student Visa', forms: ['DS-160', 'I-20'] },
      { id: 'j1-exchange', name: 'J-1 Exchange Visitor', forms: ['DS-160', 'DS-2019'] },
      { id: 'm1-vocational', name: 'M-1 Vocational Student', forms: ['DS-160', 'I-20'] }
    ]
  },
  {
    id: 'business-tourism',
    name: 'Business & Tourism Visas',
    subcategories: [
      { id: 'b1-business', name: 'B-1 Business Visitor', forms: ['DS-160'] },
      { id: 'b2-tourism', name: 'B-2 Tourist Visitor', forms: ['DS-160'] }
    ]
  }
];

const NEW_WORKFLOW_STEPS = [
  { id: 'start', title: 'Start', icon: User, description: 'New or existing client' },
  { id: 'client', title: 'Create Client', icon: Users, description: 'Add new client information' },
  { id: 'case', title: 'Create Case', icon: Briefcase, description: 'Set up case details and category' },
  { id: 'forms', title: 'Select Forms', icon: FileText, description: 'Choose required forms for filing' },
  { id: 'questionnaire', title: 'Assign Questions', icon: ClipboardList, description: 'Send questionnaire to client' }
];

const EXIST_WORKFLOW_STEPS = [
  { id: 'answers', title: 'Review Responses', icon: MessageSquare, description: 'Review existing client responses' },
  { id: 'all-details', title: 'All Details Summary', icon: ClipboardList, description: 'Complete workflow details overview' },
  { id: 'auto-fill', title: 'Auto-fill Forms', icon: FileCheck, description: 'Generate completed forms' }
];

const LegalFirmWorkflow: React.FC = (): React.ReactElement => {
  // const navigate = useNavigate(); // Not used in current implementation
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // IMMEDIATE DEBUG LOGGING FOR URL PARAMETERS



  // Client data
  const [client, setClient] = useState<any>({
    id: '',
    clientId: '', // MongoDB ObjectId reference to DEFAULT_IMS_Client
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      aptSuiteFlr: '',
      aptNumber: '',
      city: '',
      state: '',
      zipCode: '',
      province: '',
      postalCode: '',
      country: '',
    },
    dateOfBirth: '',
    nationality: '',
    // Immigration-specific fields
    alienRegistrationNumber: '',
    uscisOnlineAccountNumber: '',
    socialSecurityNumber: '',
    status: 'active',
    createdAt: ''
  });

  // DEBUG: Log client state at render level
  

  // Existing clients (from API)
  const [existingClients, setExistingClients] = useState<Client[]>([]);
  const [selectedExistingClientId, setSelectedExistingClientId] = useState(''); // Note: Now stores client email, not ID
  const [fetchingClients, setFetchingClients] = useState(false);

  // Case data
  const [caseData, setCaseData] = useState<Case>({
    id: '',
    clientId: '',
    title: '',
    description: '',
    category: '',
    subcategory: '',
    type: 'Family-Based', // Default case type
    status: 'draft',
    priority: 'medium',
    assignedForms: [],
    questionnaires: [],
    createdAt: '',
    dueDate: '',
    startDate: '',
    expectedClosureDate: '',
    assignedAttorney: '',
    formCaseIds: {} // Initialize formCaseIds as empty object
  });

  // Selected forms and questionnaires
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>('');
  // Form templates from backend
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loadingFormTemplates, setLoadingFormTemplates] = useState(false);

  // Case IDs for each selected form
  const [formCaseIds, setFormCaseIds] = useState<Record<string, string>>({});
  const [generatingCaseIds, setGeneratingCaseIds] = useState(false);

  // Questionnaire assignment and responses
  const [questionnaireAssignment, setQuestionnaireAssignment] = useState<QuestionnaireAssignment | null>(null);
  const [clientResponses, setClientResponses] = useState<Record<string, any>>({});

  // Form details
  // const [formDetails] = useState<FormData[]>([]);

  // State for client credentials
  const [clientCredentials, setClientCredentials] = useState({
    email: '',  // Will be populated with client.email when needed
    password: '',
    createAccount: false
  });

  // State for existing client response reuse functionality
  const [existingQuestionnaireResponses, setExistingQuestionnaireResponses] = useState<any[]>([]);
  const [selectedExistingResponse, setSelectedExistingResponse] = useState<string>('');
  const [useExistingResponse, setUseExistingResponse] = useState(false);
  const [, setIsExistingResponse] = useState(false);
  const [, setLoadingExistingResponses] = useState(false);
  
  // State for tracking submission completion
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);

  // State for form details ID (backend integration)
  // const [formDetailsId, setFormDetailsId] = useState<string | null>(null);

  // State for auto-fill data from API
  // const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [autoFillEnabled] = useState(false);
  // const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  // State to track if we're in view/edit mode from QuestionnaireResponses
  const [isViewEditMode] = useState(false);

  // State to track if this is a new response or existing response
  // const [isNewResponse, setIsNewResponse] = useState(true);
  const [isExistResponse, setIsExistResponse] = useState(false);

  // State for auto-generated forms
  const [generatedForms, setGeneratedForms] = useState<Array<{
    formName: string;
    templateId: string;
    blob: Blob; 
    downloadUrl: string;
    fileName: string;
    pdfId?: string;
    status: 'generating' | 'success' | 'error';
    error?: string;
    filledPercentage?: number;
    unfilledFields?: Record<string, any>;
    metadata?: {
      filename: string;
      fileSize: number;
      contentType: string;
      createdAt: string;
      validationDetails: {
        totalFields: number;
        filledFields: number;
        unfilledFieldsCount: number;
        openaiValidationUsed: boolean;
      };
    };
  }>>([]);
  const [generatingForms, setGeneratingForms] = useState(false);
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});
  const [showUnfilledFields, setShowUnfilledFields] = useState<Record<string, boolean>>({});
  const [showEditor, setShowEditor] = useState<Record<string, boolean>>({});
  
  // State for PDF preview data
  const [pdfPreviewData, setPdfPreviewData] = useState<Record<string, {
    blob: Blob;
    metadata: any;
    pdfId: string;
  }>>({});
  const [loadingPreview, setLoadingPreview] = useState<Record<string, boolean>>({});

  // State for complete workflow details from API
  const [completeWorkflowDetails, setCompleteWorkflowDetails] = useState<any>(null);
  const [loadingWorkflowDetails, setLoadingWorkflowDetails] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

  // Function to fetch complete workflow details using getWorkflowProgress
  const fetchCompleteWorkflowDetails = async (workflowId: string) => {
    console.log('🔄 Fetching complete workflow details for ID:', workflowId);
    setLoadingWorkflowDetails(true);
    
    try {
      console.log('📞 Calling getWorkflowProgress API with workflowId:', workflowId);
      const workflowData = await getWorkflowProgress(workflowId);
      
      // DETAILED CONSOLE OUTPUT FOR DEBUGGING
      console.log('✅ RAW WORKFLOW DATA RECEIVED:');
      console.log('================================');
      console.log('Full Workflow Data Object:', workflowData);
      console.log('================================');
      
      // Log specific sections
     
      
      console.log('================================');
      console.log('END OF WORKFLOW DATA CONSOLE OUTPUT');
      console.log('================================');
      
      setCompleteWorkflowDetails(workflowData);
      setCurrentWorkflowId(workflowId);
      
      // Auto-populate component state with fetched workflow data
      console.log('🔄 About to populate component state from workflow data...');
      await populateStateFromWorkflowProgress(workflowData);
      
      console.log('🎯 Workflow details fetched successfully - data populated to component state');
      
    } catch (error) {
      console.error('❌ Error fetching complete workflow details:', error);
      console.error('❌ Error details:', {
        workflowId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      setCompleteWorkflowDetails(null);
      toast.error('Failed to load workflow details. Please check console for details.');
    } finally {
      setLoadingWorkflowDetails(false);
    }
  };

  // New method to populate component state from workflow progress data
  const populateStateFromWorkflowProgress = async (workflowData: any) => {
    console.log('🔄 Populating component state from workflow progress data...');
    
    try {
      // Populate client data
      if (workflowData?.client) {
        // Clean client address to remove MongoDB metadata
        let cleanAddress = {};
        if (workflowData.client.address && typeof workflowData.client.address === 'object') {
          const addr = workflowData.client.address;
          cleanAddress = {
            street: addr.street || '',
            aptSuiteFlr: addr.aptSuiteFlr || '',
            aptNumber: addr.aptNumber || '',
            city: addr.city || '',
            state: addr.state || '',
            zipCode: addr.zipCode || '',
            province: addr.province || '',
            postalCode: addr.postalCode || '',
            country: addr.country || '',
          };
        }
        
        const clientData = {
          id: workflowData.client._id || workflowData.client.clientId || '',
          clientId: workflowData.client.clientId || workflowData.client._id || '',
          _id: workflowData.client._id || workflowData.client.clientId || '',
          name: workflowData.client.name || `${workflowData.client.firstName || ''} ${workflowData.client.lastName || ''}`.trim(),
          firstName: workflowData.client.firstName || '',
          middleName: workflowData.client.middleName || '',
          lastName: workflowData.client.lastName || '',
          email: workflowData.client.email || '',
          phone: workflowData.client.phone || '',
          dateOfBirth: workflowData.client.dateOfBirth || '',
          nationality: workflowData.client.nationality || '',
          address: cleanAddress,
          alienRegistrationNumber: workflowData.client.alienRegistrationNumber || '',
          uscisOnlineAccountNumber: workflowData.client.uscisOnlineAccountNumber || '',
          socialSecurityNumber: workflowData.client.socialSecurityNumber || '',
          status: 'active',
          createdAt: workflowData.client.createdAt || new Date().toISOString(),
          isExistingClient: true,
          hasUserAccount: true,
          role: workflowData.client.role || 'client',
          userType: workflowData.client.userType || 'client'
        };
        
        setClient(clientData);
        console.log('✅ Client data populated from workflow progress (cleaned):', clientData);
      }
      
      // Populate case data
      if (workflowData?.case) {
        const caseInfo = {
          id: workflowData.case._id || workflowData.case.id || '',
          _id: workflowData.case._id || workflowData.case.id || '',
          clientId: workflowData.client?._id || workflowData.client?.id || '',
          title: workflowData.case.title || 'Case',
          description: workflowData.case.description || '',
          category: workflowData.case.category || 'family-based',
          subcategory: workflowData.case.subcategory || '',
          status: workflowData.case.status || 'draft',
          priority: workflowData.case.priority || 'medium',
          assignedForms: Array.isArray(workflowData.case.assignedForms) ? workflowData.case.assignedForms : [],
          questionnaires: Array.isArray(workflowData.case.questionnaires) ? workflowData.case.questionnaires : [],
          createdAt: workflowData.case.createdAt || workflowData.case.openDate || new Date().toISOString(),
          dueDate: workflowData.case.dueDate || '',
          startDate: workflowData.case.startDate || workflowData.case.openDate || '',
          expectedClosureDate: workflowData.case.expectedClosureDate || workflowData.case.dueDate || '',
          assignedAttorney: workflowData.case.assignedAttorney || '',
          visaType: workflowData.case.visaType || '',
          priorityDate: workflowData.case.priorityDate || ''
        };
        
        setCaseData(caseInfo);
        console.log('✅ Case data populated from workflow progress (cleaned):', caseInfo);
      }
      
      // Populate selected forms
      if (workflowData?.selectedForms && Array.isArray(workflowData.selectedForms)) {
        setSelectedForms(workflowData.selectedForms);
        console.log('✅ Selected forms populated from workflow progress:', workflowData.selectedForms);
      }
      
      // Populate form case IDs
      if (workflowData?.formCaseIds) {
        // Clean the formCaseIds object to remove MongoDB schema metadata
        const cleanFormCaseIds: Record<string, string> = {};
        if (typeof workflowData.formCaseIds === 'object') {
          for (const [key, value] of Object.entries(workflowData.formCaseIds)) {
            // Only include string keys and values, skip MongoDB metadata
            if (typeof key === 'string' && !key.startsWith('$') && typeof value === 'string') {
              cleanFormCaseIds[key] = value;
            }
          }
        }
        setFormCaseIds(cleanFormCaseIds);
        console.log('✅ Form case IDs populated from workflow progress (cleaned):', cleanFormCaseIds);
      }
      
      // Populate questionnaire assignment and responses
      if (workflowData?.questionnaireAssignment) {
        // Create assignment object with data from multiple sources
        const assignment = {
          id: workflowData.questionnaireAssignment.assignment_id || '',
          caseId: workflowData.case?._id || workflowData.case?.id || '',
          clientId: workflowData.client?._id || workflowData.client?.id || '',
          questionnaireId: workflowData.questionnaireAssignment.questionnaire_id || '',
          questionnaireName: workflowData.questionnaireAssignment.questionnaire_title || 'Workflow Questionnaire',
          status: (workflowData.clientResponses?.submitted_at || workflowData.questionnaireAssignment.submitted_at) ? 'completed' as const : 'pending' as const,
          assignedAt: new Date().toISOString(),
          completedAt: workflowData.clientResponses?.submitted_at || workflowData.questionnaireAssignment.submitted_at || undefined,
          responses: workflowData.clientResponses?.responses || workflowData.questionnaireAssignment.responses || {},
          formCaseIds: workflowData.formCaseIds || {},
          selectedForms: workflowData.selectedForms || [],
          formCaseIdGenerated: workflowData.questionnaireAssignment.formCaseIdGenerated || '',
          notes: workflowData.clientResponses?.notes || workflowData.questionnaireAssignment.notes || '',
          responseId: workflowData.clientResponses?.response_id || undefined
        };
        
        setQuestionnaireAssignment(assignment);
        
        // Ensure selectedQuestionnaire is always a string ID, not an object
        const questionnaireId = workflowData.questionnaireAssignment.questionnaire_id || '';
        setSelectedQuestionnaire(questionnaireId);
        
        // Set client responses if available
        if (workflowData.questionnaireAssignment.responses) {
          // Clean the responses object to ensure it's a plain object without MongoDB metadata
          const cleanResponses: Record<string, any> = {};
          for (const [key, value] of Object.entries(workflowData.questionnaireAssignment.responses)) {
            // Only include proper response keys, skip MongoDB metadata
            if (typeof key === 'string' && !key.startsWith('$') && key !== '__v') {
              cleanResponses[key] = value;
            }
          }
          setClientResponses(cleanResponses);
          console.log('✅ Client responses populated from workflow progress (cleaned):', {
            responseCount: Object.keys(cleanResponses).length,
            responseKeys: Object.keys(cleanResponses).slice(0, 10) // Show first 10 keys
          });
        }
        
        console.log('✅ Questionnaire assignment populated from workflow progress:', assignment);
      }
      
      // Also check for clientResponses directly in the workflow data
      if (workflowData?.clientResponses?.responses) {
        console.log('🔍 Found clientResponses.responses - processing...');
        
        // Clean the responses object to ensure it's a plain object without MongoDB metadata
        const cleanClientResponses: Record<string, any> = {};
        for (const [key, value] of Object.entries(workflowData.clientResponses.responses)) {
          // Only include proper response keys, skip MongoDB metadata
          if (typeof key === 'string' && !key.startsWith('$') && key !== '__v') {
            cleanClientResponses[key] = value;
          }
        }
        
        // Merge with existing responses or use as primary source
        setClientResponses(prev => {
          const merged = { ...prev, ...cleanClientResponses };
          console.log('✅ Client responses populated from clientResponses data:', {
            responseCount: Object.keys(merged).length,
            responseKeys: Object.keys(merged).slice(0, 10),
            source: 'clientResponses'
          });
          return merged;
        });
      }
      
      // Set workflow mode based on data availability
      // Check multiple possible locations for responses
      const hasResponses = (
        (workflowData?.questionnaireAssignment?.responses && Object.keys(workflowData.questionnaireAssignment.responses).length > 0) ||
        (workflowData?.clientResponses?.responses && Object.keys(workflowData.clientResponses.responses).length > 0) ||
        (workflowData?.clientResponses && workflowData.clientResponses.submitted_at) // Check if response was submitted
      );
      
      console.log('🔍 Checking for existing responses:', {
        questionnaireAssignmentResponses: workflowData?.questionnaireAssignment?.responses,
        clientResponsesResponses: workflowData?.clientResponses?.responses,
        clientResponsesSubmittedAt: workflowData?.clientResponses?.submitted_at,
        hasResponses,
        workflowDataKeys: Object.keys(workflowData || {}),
      });
      
      if (hasResponses) {
        console.log('✅ SETTING EXISTING RESPONSE MODE');
        console.log('🔧 Before state changes:', { 
          currentIsExistResponse: isExistResponse, 
          currentStep: currentStep 
        });
        
        setIsExistResponse(true);
        setCurrentStep(0); // Start at Review Responses step for existing data
        
        console.log('✅ Set to existing response mode - starting at Review Responses step');
        console.log('📋 Response data found:', {
          questionnaireResponses: workflowData?.questionnaireAssignment?.responses,
          clientResponses: workflowData?.clientResponses?.responses,
          responseCount: Object.keys(workflowData?.clientResponses?.responses || {}).length,
          submittedAt: workflowData?.clientResponses?.submitted_at
        });
        
        // Force trigger re-render by logging state after update
        setTimeout(() => {
          console.log('🔧 After state changes (delayed check):', { 
            isExistResponse, 
            currentStep 
          });
        }, 100);
      } else {
        console.log('ℹ️ No existing responses found - continuing with current workflow flow');
      }
      
      console.log('✅ Component state population completed successfully');
      
    } catch (error) {
      console.error('❌ Error populating component state from workflow progress:', error);
      console.error('❌ State population error details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to get the appropriate workflow steps based on response type
  const getWorkflowSteps = () => {
    console.log('🔍 getWorkflowSteps called:', { 
      isExistResponse, 
      currentStep,
      stepsToReturn: isExistResponse ? 'EXIST_WORKFLOW_STEPS' : 'NEW_WORKFLOW_STEPS'
    });
    
    if (isExistResponse) {
      console.log('✅ Returning EXIST_WORKFLOW_STEPS:', EXIST_WORKFLOW_STEPS);
      return EXIST_WORKFLOW_STEPS;
    }
    
    console.log('✅ Returning NEW_WORKFLOW_STEPS:', NEW_WORKFLOW_STEPS);
    return NEW_WORKFLOW_STEPS;
  };

  // Load available questionnaires
  useEffect(() => {
    const loadQuestionnairesAndCheckPrefilledData = async () => {
      await loadQuestionnaires();
    };
    loadQuestionnairesAndCheckPrefilledData();
  }, []);

  // Monitor isExistResponse state changes for debugging
  useEffect(() => {
    console.log('🔍 isExistResponse state changed:', { 
      isExistResponse, 
      currentStep,
      timestamp: new Date().toISOString()
    });
  }, [isExistResponse, currentStep]);

  // Load available workflows for auto-fill on component mount
  useEffect(() => {
    const loadWorkflowsForAutoFill = async () => {
      await fetchWorkflowsFromAPI();
    };

    // Load workflows after a brief delay to allow other data to load first
    setTimeout(loadWorkflowsForAutoFill, 1000);
  }, []);

  // Monitor client state changes for debugging
  useEffect(() => {

  }, [client.isExistingClient, client.hasUserAccount, client.clientId, client.email]);

  // Emergency safety check to fix undefined flags for existing clients
  useEffect(() => {
    // EMERGENCY SAFETY CHECK: If we have a client email and it's from selectedExistingClientId, force the flags
    const isDefinitelyExistingClient = (
      selectedExistingClientId && 
      client.email && 
      client.email === selectedExistingClientId
    );
    
    if (isDefinitelyExistingClient && (client.isExistingClient !== true || client.hasUserAccount !== true)) {
      console.log('🚨 DEBUG: EMERGENCY SAFETY - Detected existing client with undefined flags, FORCING correction:', {
        selectedExistingClientId,
        clientEmail: client.email,
        emailMatch: client.email === selectedExistingClientId,
        currentFlags: {
          isExistingClient: client.isExistingClient,
          hasUserAccount: client.hasUserAccount
        },
        forcingToTrue: true
      });
      
      // Force update the client state immediately
      setClient((prev: any) => ({
        ...prev,
        isExistingClient: true,
        hasUserAccount: true,
        role: prev.role || 'client',
        userType: prev.userType || 'companyClient'
      }));
    }
  }, [selectedExistingClientId, client.email, client.isExistingClient, client.hasUserAccount]);

  // Function to fetch client details - clean implementation following controller pattern
  const fetchClientDetails = async (clientId?: string): Promise<{
    success: boolean;
    client?: any;
    error?: string;
  }> => {
    const targetClientId = clientId || selectedExistingClientId;
    
    if (!targetClientId) {
      console.log('🔍 fetchClientDetails: No client ID provided, skipping fetch');
      return { success: false, error: 'No client ID provided' };
    }

    console.log('🔄 fetchClientDetails: Starting client details fetch for:', targetClientId);
    setLoading(true);
    
    try {
      // Step 1: Fetch client details directly from workflow API
      let fullClient = null;
      
      console.log('🔄 fetchClientDetails: Fetching workflows for client:', targetClientId);
      
      const workflowResult = await getWorkflowsByClient(targetClientId, {
        page: 1,
        limit: 5,
      
      });

      console.log("WORKFLOW RESULT", workflowResult)
      
      // Step 2: Extract client data from workflow API response
      if (workflowResult.success && workflowResult.data.length > 0) {
        // Find the most recent workflow with client data
        const workflowWithClient = workflowResult.data.find(workflow => 
          workflow.client && (
            workflow.clientId === targetClientId || 
            workflow.client?.email === targetClientId
          )
        );
        
        if (workflowWithClient && workflowWithClient.client) {
          fullClient = workflowWithClient.client;
          console.log('✅ fetchClientDetails: Found client in workflow data:', {
            workflowId: workflowWithClient.workflowId || workflowWithClient._id,
            clientName: fullClient.name || `${fullClient.firstName} ${fullClient.lastName}`,
            clientEmail: fullClient.email,
            clientObjectId: fullClient._id,
            clientClientId: fullClient.clientId,
            clientId: fullClient.id
          });
        }
      }
      
      if (workflowResult.error) {
        console.error('❌ fetchClientDetails: API error:', workflowResult.error);
      }
      
      // Step 3: Final fallback - try general workflow search
      if (!fullClient) {
        console.log('🔄 fetchClientDetails: Trying fallback workflow search');
        
        try {
          const workflows = await fetchWorkflowsForClientSearch();
          const workflowWithClient = workflows.find(w => 
            w.clientId === targetClientId || 
            w.client?.email === targetClientId
          );
          
          if (workflowWithClient && workflowWithClient.client) {
            fullClient = workflowWithClient.client;
            console.log('✅ fetchClientDetails: Found client via fallback method');
          }
        } catch (fallbackError) {
          console.warn('⚠️ fetchClientDetails: Fallback method failed:', fallbackError);
        }
      }
      
      // Step 4: Process and return result
      if (!fullClient) {
        const errorMsg = 'Client not found in any data source';
        console.error('❌ fetchClientDetails:', errorMsg);
        toast.error('Unable to retrieve client details. Please try again.');
        return { success: false, error: errorMsg };
      }
      
      // Step 5: Process client data and update component state
      const processedClient = processClientData(fullClient, targetClientId);
      
      // Update component state
      setClient(processedClient);
      setCaseData(prev => ({ ...prev, clientId: targetClientId }));
      
      // Fetch additional client data (questionnaire responses) using the actual client ObjectId
      const clientObjectId = processedClient.clientId || processedClient._id || processedClient.id;
      if (clientObjectId && clientObjectId !== targetClientId) {
        console.log('🔄 fetchClientDetails: Using client ObjectId for questionnaire responses:', clientObjectId);
        await fetchExistingQuestionnaireResponses(clientObjectId);
      } else {
        console.log('⚠️ fetchClientDetails: No valid ObjectId found for questionnaire responses, skipping');
      }
      
      const clientName = processedClient.name || 'Client';
      console.log('✅ fetchClientDetails: Successfully loaded client details');
      toast.success(`Client ${clientName} details loaded successfully`);
      
      return { 
        success: true, 
        client: processedClient 
      };
      
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to fetch client details';
      console.error('❌ fetchClientDetails: Unexpected error:', {
        error: errorMsg,
        stack: error.stack,
        targetClientId
      });
      
      toast.error('Failed to load client details. Please try again.');
      
      return { 
        success: false, 
        error: errorMsg 
      };
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process raw client data into component format
  const processClientData = (rawClient: any, targetClientId: string) => {
    // Generate client name from available fields
    let name = '';
    if (rawClient.name) {
      name = rawClient.name;
    } else if (rawClient.firstName || rawClient.lastName) {
      name = `${rawClient.firstName || ''} ${rawClient.lastName || ''}`.trim();
    } else if (rawClient.fullName) {
      name = rawClient.fullName;
    } else {
      name = 'Unnamed Client';
    }
    
    // Extract the actual MongoDB ObjectId from the client data
    const objectId = rawClient._id || rawClient.clientId || rawClient.id;
    const isValidObjectId = objectId && /^[0-9a-fA-F]{24}$/.test(objectId);
    
    console.log('🔍 processClientData: Client ID extraction:', {
      rawClientId: rawClient._id,
      rawClientClientId: rawClient.clientId,
      rawClientId2: rawClient.id,
      extractedObjectId: objectId,
      isValidObjectId,
      targetClientId,
      clientEmail: rawClient.email
    });
    
    // Return processed client object
    return {
      _id: isValidObjectId ? objectId : targetClientId,
      id: isValidObjectId ? objectId : targetClientId,
      clientId: isValidObjectId ? objectId : targetClientId,
      name: name,
      firstName: rawClient.firstName || '',
      middleName: rawClient.middleName || '',
      lastName: rawClient.lastName || '',
      email: rawClient.email || targetClientId,
      phone: rawClient.phone || '',
      dateOfBirth: rawClient.dateOfBirth || '',
      nationality: rawClient.nationality || '',
      alienRegistrationNumber: rawClient.alienRegistrationNumber || '',
      uscisOnlineAccountNumber: rawClient.uscisOnlineAccountNumber || '',
      socialSecurityNumber: rawClient.socialSecurityNumber || '',
      address: {
        street: rawClient.address?.street || '',
        aptSuiteFlr: rawClient.address?.aptSuiteFlr || '',
        aptNumber: rawClient.address?.aptNumber || '',
        city: rawClient.address?.city || '',
        state: rawClient.address?.state || rawClient.address?.province || '',
        province: rawClient.address?.province || rawClient.address?.state || '',
        zipCode: rawClient.address?.zipCode || rawClient.address?.postalCode || '',
        postalCode: rawClient.address?.postalCode || rawClient.address?.zipCode || '',
        country: rawClient.address?.country || ''
      },
      isExistingClient: true,
      hasUserAccount: true,
      role: rawClient.role || 'client',
      userType: rawClient.userType || 'companyClient'
    };
  };

  // Fetch client details when selectedExistingClientId changes
  useEffect(() => {
    if (selectedExistingClientId) {
      fetchClientDetails();
    }
  }, [selectedExistingClientId]);

  // Load workflow data when existing client reaches Create Client step (step 1)
  useEffect(() => {
    const loadWorkflowDataForExistingClient = async () => {
      console.log('🔍 DEBUG: useEffect triggered - checking conditions for workflow loading:', {
        currentStep,
        selectedExistingClientId,
        clientIsExistingClient: client.isExistingClient,
        clientEmail: client.email,
        clientName: client.name,
        allConditionsMet: currentStep === 1 && selectedExistingClientId && client.isExistingClient
      });
      
      // Only load workflow data when reaching step 1 (Create Client) for existing clients
      if (currentStep === 1 && selectedExistingClientId && client.isExistingClient) {
        console.log('🔄 DEBUG: All conditions met - Existing client reached Create Client step - loading workflow data from DB');
        
        // Add a small delay to ensure the client state is fully updated
        setTimeout(async () => {
          try {
            // Find and load workflow data for this existing client
            const workflowLoaded = await findAndAutoFillWorkflow(client.email, selectedExistingClientId);
            console.log('🔍 DEBUG: Workflow load result:', { workflowLoaded });
            if (workflowLoaded) {
              console.log('✅ DEBUG: Workflow data loaded for existing client on Create Client step');
              // toast.success(`Complete workflow data loaded for ${client.name}`);
            } else {
              console.log('⚠️ DEBUG: No workflow data found for existing client');
              // toast(`Client details ready for ${client.name} - no previous workflow found`);
            }
          } catch (error) {
            console.error('❌ DEBUG: Failed to load workflow data for existing client:', error);
            toast.error('Failed to load workflow data');
          }
        }, 100); // Small delay to ensure state is updated
      } else {
        console.log('⚠️ DEBUG: Conditions not met for workflow data loading');
      }
    };

    loadWorkflowDataForExistingClient();
  }, [currentStep, selectedExistingClientId, client.isExistingClient, client.email, client.name]);

  // Function to resume workflow from saved progress
  const resumeWorkflow = async (workflowId: string) => {
    try {

      let workflowData = null;

      // Try to load from API only
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const workflowDataFromAPI = await getWorkflowProgress(workflowId);
          workflowData = workflowDataFromAPI.data || workflowDataFromAPI;
        } catch (apiError: any) {
          // Failed to load workflow from server
        }
      } else {
        // Authentication required to resume workflow
      }

      if (!workflowData) {
        return false;
      }

      // Restore workflow state
      if (workflowData.client) {
        setClient(workflowData.client);
      }

      if (workflowData.case) {
        setCaseData(workflowData.case);
      }

      if (workflowData.selectedForms) {
        setSelectedForms(workflowData.selectedForms);
      }

      if (workflowData.formCaseIds) {
        setFormCaseIds(workflowData.formCaseIds);
      }

      if (workflowData.selectedQuestionnaire) {
        // Ensure selectedQuestionnaire is always a string ID, not an object
        const questionnaireId = typeof workflowData.selectedQuestionnaire === 'string' 
          ? workflowData.selectedQuestionnaire 
          : workflowData.selectedQuestionnaire?._id || workflowData.selectedQuestionnaire?.id || '';
        setSelectedQuestionnaire(questionnaireId);
      }

      if (workflowData.clientCredentials) {
        setClientCredentials({
          ...clientCredentials,
          email: workflowData.clientCredentials.email || '',
          createAccount: workflowData.clientCredentials.createAccount || false
          // Don't restore password for security
        });
      }

      // Set current step
      if (typeof workflowData.currentStep === 'number') {
        setCurrentStep(workflowData.currentStep);
      }

      return true;

    } catch (error) {
      return false;
    }
  };

  // Check for workflow resumption on component mount
  useEffect(() => {
    const checkForWorkflowResumption = () => {
      // Check URL parameters for workflow resumption
      const urlParams = new URLSearchParams(window.location.search);
      const resumeWorkflowId = urlParams.get('resumeWorkflow');
      const fromQuestionnaireResponses = urlParams.get('fromQuestionnaireResponses');

      // Check if coming from questionnaire responses (existing response)
      if (fromQuestionnaireResponses === 'true') {
        setIsExistResponse(true);
        // setIsNewResponse(false);
        setCurrentStep(0); // Start at the first step of existing response workflow
      }

      if (resumeWorkflowId) {

        resumeWorkflow(resumeWorkflowId);

        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('resumeWorkflow');
        window.history.replaceState({}, '', url);
      }

      // Removed sessionStorage workflow resumption - API only workflow management
    };

    // Delay check to allow questionnaires to load first
    setTimeout(checkForWorkflowResumption, 1000);
  }, []);

  // Load workflow data from sessionStorage ONLY when coming from QuestionnaireResponses
  useEffect(() => {
    console.log('🔄 useEffect for workflow loading triggered');
    
    // Check URL parameters first to determine if we're coming from QuestionnaireResponses
    const urlParams = new URLSearchParams(window.location.search);
    const fromQuestionnaireResponses = urlParams.get('fromQuestionnaireResponses') === 'true';
    const workflowId = urlParams.get('workflowId');
    
    console.log('🔍 URL Parameters Analysis:', {
      fromQuestionnaireResponses,
      workflowId,
      hasWorkflowId: !!workflowId,
      timestamp: new Date().toISOString(),
      fullURL: window.location.href,
      searchParams: window.location.search
    });
    
    if (!fromQuestionnaireResponses) {
      console.log('🚫 Not from QuestionnaireResponses - starting with clean workflow (New/Existing Client)');
      // Ensure we start from the beginning for normal access
      setCurrentStep(0);
      setIsExistResponse(false);
      // Clean up any existing sessionStorage data to prevent confusion
      sessionStorage.removeItem('legalFirmWorkflowData');
      return;
    }
    
    console.log('🔗 Navigated from QuestionnaireResponses - processing workflow data');
    console.log('🆔 Workflow ID from URL:', workflowId);
    
    // PRIORITY 1: If we have a workflowId from URL, use API to fetch complete workflow details
    if (workflowId) {
      console.log('✅ Found workflowId in URL - using API to fetch complete workflow details');
      console.log('📋 WorkflowId Details:', {
        workflowId,
        length: workflowId.length,
        isValidFormat: /^[0-9a-fA-F]{24}$/.test(workflowId) || workflowId.length > 10,
        timestamp: new Date().toISOString()
      });
      
      console.log('🚀 About to call fetchCompleteWorkflowDetails...');
      
      // Fetch workflow progress from API - this will populate all component state
      fetchCompleteWorkflowDetails(workflowId)
        .then(() => {
          console.log('🎯 Workflow details fetched successfully from API');
          // Clear sessionStorage since we have fresh API data
          sessionStorage.removeItem('legalFirmWorkflowData');
        })
        .catch((error) => {
          console.error('❌ Failed to fetch workflow from API, falling back to sessionStorage:', error);
          // If API fails, fallback to sessionStorage
          loadWorkflowFromSessionStorage();
        });
      
      return; // Don't process sessionStorage if we have workflowId
    }
    
    // PRIORITY 2: Fallback to sessionStorage if no workflowId in URL
    console.log('⚠️ No workflowId in URL - falling back to sessionStorage data');
    
    // Define the sessionStorage loading function
    function loadWorkflowFromSessionStorage() {
      try {
        const storedData = sessionStorage.getItem('legalFirmWorkflowData');
        if (storedData) {
          const workflowData = JSON.parse(storedData);
          console.log('🔄 Loading workflow data from sessionStorage:', workflowData);
          
          // Load client data
          if (workflowData.workflowClient || workflowData.clientName) {
            const clientData = {
              id: workflowData.clientId || '',
              _id: workflowData.clientId || '',
              name: workflowData.clientName || `${workflowData.workflowClient?.firstName || ''} ${workflowData.workflowClient?.lastName || ''}`.trim(),
              firstName: workflowData.workflowClient?.firstName || workflowData.clientName?.split(' ')[0] || '',
              lastName: workflowData.workflowClient?.lastName || workflowData.clientName?.split(' ').slice(1).join(' ') || '',
              email: workflowData.clientEmail || workflowData.workflowClient?.email || '',
              phone: workflowData.workflowClient?.phone || '',
              dateOfBirth: workflowData.workflowClient?.dateOfBirth || '',
              nationality: workflowData.workflowClient?.nationality || '',
              address: workflowData.workflowClient?.address || {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
              },
              isExistingClient: true,
              hasUserAccount: true
            };
            setClient(clientData);
            console.log('✅ Loaded client data:', clientData);
          }
          
          // Load case data
          if (workflowData.workflowCase) {
            const caseInfo = {
              id: workflowData.workflowCase.id || workflowData.workflowCase._id || '',
              _id: workflowData.workflowCase._id || workflowData.workflowCase.id || '',
              clientId: workflowData.clientId || '',
              title: workflowData.workflowCase.title || 'Case',
              description: workflowData.workflowCase.description || '',
              category: workflowData.workflowCase.category || 'family-based',
              subcategory: workflowData.workflowCase.subcategory || '',
              status: workflowData.workflowCase.status || 'draft',
              priority: workflowData.workflowCase.priority || 'medium',
              assignedForms: [],
              questionnaires: [],
              createdAt: workflowData.workflowCase.openDate || new Date().toISOString(),
              dueDate: workflowData.workflowCase.dueDate || '',
              startDate: workflowData.workflowCase.openDate || '',
              expectedClosureDate: workflowData.workflowCase.dueDate || '',
              assignedAttorney: ''
            };
            setCaseData(caseInfo);
            console.log('✅ Loaded case data:', caseInfo);
          }
          
          // Load selected forms
          if (workflowData.selectedForms && Array.isArray(workflowData.selectedForms)) {
            setSelectedForms(workflowData.selectedForms);
            console.log('✅ Loaded selected forms:', workflowData.selectedForms);
          }
          
          // Load form case IDs
          if (workflowData.formCaseIds) {
            setFormCaseIds(workflowData.formCaseIds);
            console.log('✅ Loaded form case IDs:', workflowData.formCaseIds);
          }
          
          // Load questionnaire assignment
          if (workflowData.questionnaireId) {
            // Ensure questionnaireId is a string
            const questionnaireId = typeof workflowData.questionnaireId === 'string' 
              ? workflowData.questionnaireId 
              : workflowData.questionnaireId?._id || workflowData.questionnaireId?.id || '';
              
            const assignment = {
              id: workflowData.originalAssignmentId || '',
              caseId: workflowData.workflowCase?.id || workflowData.workflowCase?._id || '',
              questionnaireId: questionnaireId,
              questionnaireName: workflowData.questionnaireTitle || 'Workflow Questionnaire',
              clientId: workflowData.clientId,
              status: 'completed' as const,
              assignedAt: new Date().toISOString(),
              responses: workflowData.existingResponses || workflowData.questionnaireAssignment?.responses || {}
            };
            setQuestionnaireAssignment(assignment);
            setSelectedQuestionnaire(questionnaireId);
            console.log('✅ Loaded questionnaire assignment:', assignment);
          }
          
          // Load existing responses - THIS IS THE KEY PART
          if (workflowData.existingResponses || workflowData.questionnaireAssignment?.responses) {
            const responses = workflowData.existingResponses || workflowData.questionnaireAssignment?.responses || {};
            setClientResponses(responses);
            console.log('✅ Loaded client responses:', responses);
            console.log('🔍 Response keys:', Object.keys(responses));
            console.log('🔍 Response values sample:', Object.entries(responses).slice(0, 3));
          }
          
          // Set the workflow to existing response mode and go to Review Responses step
          if (workflowData.mode === 'edit' || workflowData.existingResponses) {
            setIsExistResponse(true);
            // Set target step if specified, otherwise default to Review Responses (step 0)
            const targetStep = workflowData.targetStep !== undefined ? workflowData.targetStep : 0;
            setCurrentStep(targetStep);
            console.log('✅ Set to existing response mode - target step:', targetStep);
          } else {
            // Set target step if specified for non-edit mode
            if (workflowData.targetStep !== undefined) {
              setCurrentStep(workflowData.targetStep);
              console.log('✅ Set target step:', workflowData.targetStep);
            }
          }
          
          // Clean up sessionStorage after loading
          // sessionStorage.removeItem('legalFirmWorkflowData');
          console.log('🧹 Workflow data loaded from sessionStorage');
        } else {
          console.log('⚠️ No workflow data found in sessionStorage despite coming from QuestionnaireResponses');
        }
      } catch (error) {
        console.error('❌ Error loading workflow data from sessionStorage:', error);
      }
    }
    
    // Call the sessionStorage loading function
    loadWorkflowFromSessionStorage();
    
    // Also try again after a small delay to ensure data is available
    setTimeout(loadWorkflowFromSessionStorage, 500);
  }, []);

  // Removed sessionStorage workflow data loading - API only workflow management

  // Load available form templates for Select Forms screen
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingFormTemplates(true);
      try {
        const response = await getAnvilTemplatesList();
        const templates = response.data?.data?.templates || [];
        
        // Map the Anvil templates response to FormTemplate structure
        const mappedTemplates: FormTemplate[] = templates.map((template: any) => ({
          _id: template.templateId,
          name: template.formNumber,
          formNumber: template.formNumber,
          description: template.description || '',
          category: 'USCIS' as keyof typeof FORM_TEMPLATE_CATEGORIES,
          type: 'uscis' as keyof typeof FORM_TEMPLATE_TYPES,
          status: template.isActive ? 'active' as keyof typeof FORM_TEMPLATE_STATUS : 'inactive' as keyof typeof FORM_TEMPLATE_STATUS,
          fields: [], // Empty fields array for now
          version: '1.0',
          effectiveDate: template.createdAt || new Date().toISOString(),
          expirationDate: template.expirationDate,
          isActive: template.isActive || false,
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: template.createdAt || new Date().toISOString(),
          updatedAt: template.updatedAt || new Date().toISOString(),
          metadata: {
            uscisFormNumber: template.formNumber,
            templateId: template.templateId,
            isFieldsValidated: template.isFieldsValidated,
            instructions: template.description
          }
        }));
        
        setFormTemplates(mappedTemplates);
      } catch (error) {
        setFormTemplates([]);
      }
      setLoadingFormTemplates(false);
    };
    fetchTemplates();
  }, []);

  // Load existing clients from API on mount (for start step)
  useEffect(() => {
    const loadClients = async () => {
      setFetchingClients(true);

      // Note: token can be used for API auth if needed

      try {
        const apiResponse = await fetchClientsFromAPI();
        const apiClients = apiResponse?.clients || [];

        // If no clients returned from regular API, try to get them from workflows
        if (!apiClients || apiClients.length === 0) {
          const workflowClients = await fetchClientsFromWorkflows();
          
          if (workflowClients.length > 0) {
            setExistingClients(workflowClients);
            return;
          } else {
            setExistingClients([]);
            return;
          }
        }

        // Filter clients to only include role "client" (no userType check for now)
        const filteredClients = apiClients?.filter((client: any) => {
          

          // Must have exact role "client" only
          const hasValidRole = client.role === 'client';

          if (!hasValidRole) {
            return false;
          }

          return true;
        }) || [];


        // If no clients pass the filter, try workflows as backup
        if (filteredClients.length === 0) {
          const workflowClients = await fetchClientsFromWorkflows();
          
          if (workflowClients.length > 0) {
            setExistingClients(workflowClients);
            return;
          }
        }

        // Make sure each client has a valid MongoDB ObjectId
        const validatedClients = filteredClients.map((client: any) => {
          // If client already has a valid ObjectId, use it
          if (client._id && isValidMongoObjectId(client._id)) {
            return {
              ...client,
              id: client._id // Ensure id is also set to the valid ObjectId
            };
          }

          // If client has id but not _id, check if id is valid
          if (client.clientId && isValidMongoObjectId(client.clientId)) {
            return {
              ...client,
              _id: client.clientId // Set _id to the valid ObjectId
            };
          }

          // Otherwise, generate a new valid ObjectId
          const validId = generateObjectId();
          
          return {
            ...client,
            id: validId,
            _id: validId
          };
        });

        setExistingClients(validatedClients);
      } catch (err) {
        console.error('❌ Error loading clients from API:', err);

        // API-only mode - no fallback available
        setExistingClients([]);
      } finally {
        setFetchingClients(false);
      }
    };
    loadClients();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      
      const response = await getQuestionnaires();

      // Questionnaires loaded successfully from API
      if (response.questionnaires && response.questionnaires.length > 0) {
        // Questionnaires loaded successfully from API
      }

      // Normalize questionnaire data to ensure consistent structure
      const normalizedQuestionnaires = response.questionnaires.map((q: any) => {
        // Special handling for API response format
        if (q.id && q.id.startsWith('q_') && q.fields) {
          // Found API questionnaire with q_ prefix
        }
        return normalizeQuestionnaireStructure(q);
      });

      setAvailableQuestionnaires(normalizedQuestionnaires);
    } catch (error) {
      // Load demo questionnaires in case of error
      const demoQuestionnaires = [
        {
          _id: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId for demo
          title: 'I-130 Family Petition Questionnaire',
          category: 'FAMILY_BASED',
          description: 'Basic information needed for family-based petitions',
          fields: [
            { id: 'fullName', type: 'text', label: 'Full Name', required: true },
            { id: 'birthDate', type: 'date', label: 'Date of Birth', required: true },
            { id: 'birthCountry', type: 'text', label: 'Country of Birth', required: true },
            {
              id: 'relationship', type: 'select', label: 'Relationship to Petitioner', required: true,
              options: ['Spouse', 'Parent', 'Child', 'Sibling']
            }
          ]
        },
        {
          _id: '507f1f77bcf86cd799439012', // Valid MongoDB ObjectId for demo
          title: 'I-485 Adjustment of Status',
          category: 'FAMILY_BASED',
          description: 'Information required for adjustment of status applications',
          fields: [
            { id: 'usEntry', type: 'date', label: 'Date of Last Entry to US', required: true },
            { id: 'i94Number', type: 'text', label: 'I-94 Number', required: true },
            { id: 'currentStatus', type: 'text', label: 'Current Immigration Status', required: true }
          ]
        }
      ];

      setAvailableQuestionnaires(demoQuestionnaires);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const workflowSteps = getWorkflowSteps();
    const nextStep = currentStep + 1;

    if (nextStep < workflowSteps.length) {
      setCurrentStep(nextStep);

      // Check if we're moving to the "Collect Answers" step (typically step 4)
      const nextStepConfig = workflowSteps[nextStep];
      if (nextStepConfig?.id === 'answers' && autoFillEnabled) {
        // Trigger auto-fill with a slight delay to allow step transition
        setTimeout(async () => {
          try {
            const clientEmail = client.email || clientCredentials.email;
            await findAndAutoFillWorkflow(clientEmail);
          } catch (error) {
            console.error('❌ DEBUG: Error in delayed auto-fill:', error);
          }
        }, 500);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Find the handleClientSubmit function and update it to check for existing clients

  const handleClientSubmit = async () => {

    // Check if this is an existing client - if so, skip all account creation
    const isExistingClientWithAccount = client.isExistingClient || client.hasUserAccount;
    
    if (isExistingClientWithAccount) {
      console.log('✅ DEBUG: Existing client detected in handleClientSubmit - skipping all account creation steps:', {
        clientId: client.clientId,
        clientName: client.name,
        clientEmail: client.email,
        isExistingClient: client.isExistingClient,
        hasUserAccount: client.hasUserAccount
      });
      
      // For existing clients, just proceed to next step without creating any account
      handleNext();
      return client.clientId || client._id; // Return existing client ID
    }

    // Ensure client has first and last name
    if (!client.firstName || client.firstName.trim() === '') {
      toast.error('First name is required');
      return;
    }

    if (!client.lastName || client.lastName.trim() === '') {
      toast.error('Last name is required');
      return;
    }

    // Validate email
    if (!client.email || !client.email.includes('@')) {
      toast.error('Valid email address is required');
      return;
    }

    // Validate required address fields
    if (!client.address?.city || client.address.city.trim() === '') {
      toast.error('City is required');
      return;
    }

    if (!client.address?.state || client.address.state.trim() === '') {
      toast.error('State/Province is required');
      return;
    }

    if (!client.address?.zipCode || client.address.zipCode.trim() === '') {
      toast.error('ZIP/Postal Code is required');
      return;
    }

    if (!client.address?.country || client.address.country.trim() === '') {
      toast.error('Country is required');
      return;
    }

    // Update the name field from firstName, middleName, and lastName
    const fullName = `${client.firstName} ${client.middleName || ''} ${client.lastName}`.trim().replace(/\s+/g, ' ');
    setClient((prev: any) => ({ ...prev, name: fullName }));

    // Only proceed with user account creation if password is provided (from questionnaire assignment screen)
    if (!client.password) {

      toast.error('Password is required for user account creation. Please set a password in the questionnaire assignment screen.');
      return null;
    }

    // Use the email and password from questionnaire assignment screen or generated password
    const clientEmail = client.email;
    const clientPassword = client.password;




    return await createClientAccountWithCredentials(clientEmail, clientPassword);
  };

  // Update the createClientAccountWithCredentials function to check for existing users


  // Helper function to create client account with provided credentials
  const createClientAccountWithCredentials = async (clientEmail: string, clientPassword: string) => {
    // Validate client name fields are available
    if (!client.firstName?.trim() || !client.lastName?.trim()) {
      throw new Error('Client first name and last name are required');
    }

    try {


      // First, check if user already exists by email
      let existingUserId = null;
      try {
        const emailCheckResult = await checkEmailExists(clientEmail);
        if (emailCheckResult.exists) {
          existingUserId = emailCheckResult.userId;


          // Check if this user has the correct role
          if (emailCheckResult.role === 'client' && emailCheckResult.userType === 'individualUser') {


            // Update client object with existing user ID
            const updatedClient = {
              ...client,
              id: existingUserId,
              _id: existingUserId,
              firstName: client.firstName,
              middleName: client.middleName || '',
              lastName: client.lastName,
              name: client.name,
              email: clientEmail,
              userId: existingUserId,
              hasUserAccount: true,
              existingUser: true
            };
            setClient(updatedClient);

            handleNext();

            return existingUserId;
          } else {

            toast.error(`A user with email ${clientEmail} already exists but has a different role. Please use a different email.`);
            return null;
          }
        }
      } catch (checkError: any) {
        // If endpoint doesn't exist or returns 404, continue with creation
        if (checkError.response?.status === 404) {

        } else {

        }
      }

      // If no existing user found, create new account


      // Generate a valid MongoDB ObjectId for the client
      const clientId = generateObjectId();
      const updatedClient = {
        ...client,
        id: clientId,
        clientId: clientId, // MongoDB ObjectId reference to DEFAULT_IMS_Client
        _id: clientId, // Add both id and _id for compatibility
        firstName: client.firstName, // Use the actual client fields
        middleName: client.middleName || '',
        lastName: client.lastName,
        email: clientEmail, // Use the specific email
        password: clientPassword, // Use the specific password
        createdAt: new Date().toISOString()
      };
      setClient(updatedClient);

      try {
        // Get current attorney information from API instead of localStorage
        const getCurrentAttorneyInfo = async () => {
          try {
            // Try to get current user profile from API first
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('No authentication token found');
            }

            // Make direct API call to get current user profile using proper endpoint
            const response = await api.get(AUTH_END_POINTS.PROFILE_GET, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            const currentUser = response.data?.data || response.data;
            console.log('🔍 DEBUG: Current user from API:', currentUser);

            return {
              attorneyId: currentUser._id || currentUser.id,
              companyId: currentUser.companyId,
              user: currentUser
            };
          } catch (apiError: any) {
            console.warn('⚠️ Failed to get attorney info from API, falling back to localStorage:', apiError.message);
            
            // Fallback to localStorage if API fails
            const storedUser = localStorage.getItem('user');
            const storedCompanyId = localStorage.getItem('companyId');
            
            if (!storedUser) {
              throw new Error('No user information found in localStorage either');
            }

            const currentUser = JSON.parse(storedUser);
            return {
              attorneyId: currentUser._id || currentUser.id,
              companyId: storedCompanyId || currentUser.companyId,
              user: currentUser
            };
          }
        };

        // Get attorney information
        const attorneyInfo = await getCurrentAttorneyInfo();
        const { attorneyId, companyId: attorneyCompanyId, user: currentUser } = attorneyInfo;

        console.log('🔍 DEBUG: Attorney information for client creation:', {
          currentUser,
          attorneyId,
          attorneyCompanyId,
          hasAttorneyId: !!attorneyId,
          hasCompanyId: !!attorneyCompanyId,
          source: 'API with localStorage fallback'
        });

        // Validate that we have attorney information
        if (!attorneyId) {
          throw new Error('Attorney ID not found. Please ensure you are logged in as an attorney.');
        }

        if (!attorneyCompanyId) {
          throw new Error('Attorney company ID not found. Please ensure you are logged in as an attorney.');
        }

        const attorneyIds = [attorneyId];

        // ✅ Use the new company client creation with all fields
        const response = await createCompanyClient({
          firstName: updatedClient.firstName,
          lastName: updatedClient.lastName,
          name: `${updatedClient.firstName} ${updatedClient.lastName}`, // Auto-generated name
          email: clientEmail.toLowerCase().trim(),
          phone: client.phone || '',
          nationality: client.nationality || '',
          address: {
            street: client.address?.street || '',
            city: client.address?.city || '',
            state: client.address?.state || '',
            zipCode: client.address?.zipCode || '',
            country: client.address?.country || ''
          },
          role: 'client',
          userType: 'companyClient',
          companyId: attorneyCompanyId, // Attorney's company from session
          attorneyIds: attorneyIds, // Current attorney's ID
          dateOfBirth: client.dateOfBirth || '',
          placeOfBirth: client.placeOfBirth ? {
            city: client.placeOfBirth.city || '',
            state: client.placeOfBirth.state || '',
            country: client.placeOfBirth.country || ''
          } : undefined,
          gender: client.gender || undefined,
          maritalStatus: client.maritalStatus || undefined,
          immigrationPurpose: client.immigrationPurpose || undefined,
          passportNumber: client.passportNumber || undefined,
          alienRegistrationNumber: client.alienRegistrationNumber || undefined,
          nationalIdNumber: client.nationalIdNumber || undefined,
          spouse: client.spouse ? {
            firstName: client.spouse.firstName || undefined,
            lastName: client.spouse.lastName || undefined,
            dateOfBirth: client.spouse.dateOfBirth || undefined,
            nationality: client.spouse.nationality || undefined,
            alienRegistrationNumber: client.spouse.alienRegistrationNumber || undefined
          } : undefined,
          children: client.children || undefined,
          employment: client.employment ? {
            currentEmployer: client.employment.currentEmployer ? {
              name: client.employment.currentEmployer.name || undefined,
              address: client.employment.currentEmployer.address ? {
                street: client.employment.currentEmployer.address.street || '',
                city: client.employment.currentEmployer.address.city || '',
                state: client.employment.currentEmployer.address.state || '',
                zipCode: client.employment.currentEmployer.address.zipCode || '',
                country: client.employment.currentEmployer.address.country || ''
              } : undefined
            } : undefined,
            jobTitle: client.employment.jobTitle || undefined,
            employmentStartDate: client.employment.employmentStartDate || undefined,
            annualIncome: client.employment.annualIncome || undefined
          } : undefined,
          education: client.education ? {
            highestLevel: client.education.highestLevel || undefined,
            institutionName: client.education.institutionName || undefined,
            datesAttended: client.education.datesAttended ? {
              startDate: client.education.datesAttended.startDate || undefined,
              endDate: client.education.datesAttended.endDate || undefined
            } : undefined,
            fieldOfStudy: client.education.fieldOfStudy || undefined
          } : undefined,
          travelHistory: client.travelHistory || undefined,
          financialInfo: client.financialInfo ? {
            annualIncome: client.financialInfo.annualIncome || undefined,
            sourceOfFunds: client.financialInfo.sourceOfFunds || undefined,
            bankAccountBalance: client.financialInfo.bankAccountBalance || undefined
          } : undefined,
          criminalHistory: client.criminalHistory ? {
            hasCriminalRecord: client.criminalHistory.hasCriminalRecord || false,
            details: client.criminalHistory.details || undefined
          } : undefined,
          medicalHistory: client.medicalHistory ? {
            hasMedicalConditions: client.medicalHistory.hasMedicalConditions || false,
            details: client.medicalHistory.details || undefined
          } : undefined,
          bio: client.bio || undefined,
          status: 'Active',
          entryDate: client.entryDate || undefined,
          visaCategory: client.visaCategory || undefined,
          notes: client.notes || undefined,
          documents: client.documents || undefined,
          active: true,
          lastLogin: undefined, // Will be set on first login
          // Legacy fields for backward compatibility
          // id: clientId,
          alienNumber: client.alienNumber || undefined,
          sendPassword: true, // Send password to client
          password: clientPassword // Include the password
        });



        // ✅ Enhanced response handling - createCompanyClient returns Client directly
        const userData = response;
        const apiClientId = userData?._id || userData?.id;

        if (!apiClientId) {
          throw new Error('No user ID returned from client creation');
        }



        // Create comprehensive client object with all necessary fields
        const apiClient = {
          ...updatedClient,
          id: apiClientId,
          _id: apiClientId,
          userId: apiClientId,
          hasUserAccount: true,
          firstName: client.firstName,
          middleName: client.middleName || '',
          lastName: client.lastName,
          name: client.name, // Keep the full name
          email: client.email.toLowerCase().trim(),
          phone: client.phone || '',
          dateOfBirth: client.dateOfBirth || '',
          nationality: client.nationality || '',
          address: {
            street: client.address?.street || '',
            aptSuiteFlr: client.address?.aptSuiteFlr || '',
            aptNumber: client.address?.aptNumber || '',
            city: client.address?.city || '',
            state: client.address?.state || '',
            zipCode: client.address?.zipCode || '',
            province: client.address?.province || '',
            postalCode: client.address?.postalCode || '',
            country: client.address?.country || ''
          },
          status: 'active'
        };

        setClient(apiClient);

        handleNext();

        // Return the real user account ID
        return apiClientId;

      } catch (error: any) {


        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message ||
          errorData?.message ||
          errorData?.error ||
          error.message ||
          'Failed to create client account';

        if (error.response?.status === 400) {
          toast.error(`Registration failed: ${errorMessage}`);
        } else if (error.response?.status === 409 || errorMessage.toLowerCase().includes('already exists')) {

          toast.error(`A user with email ${clientEmail} already exists. Please use a different email or contact support.`);

          // Try to get the existing user ID from the error response
          const existingUserId = errorData?.userId || errorData?.data?.userId;

          if (existingUserId) {


            // Update client object with existing user ID
            const existingClient = {
              ...client,
              id: existingUserId,
              _id: existingUserId,
              firstName: client.firstName,
              middleName: client.middleName || '',
              lastName: client.lastName,
              name: client.name,
              email: clientEmail,
              userId: existingUserId,
              hasUserAccount: true,
              existingUser: true
            };
            setClient(existingClient);

            handleNext();
            return existingUserId;
          }
        } else {
          toast.error(`Failed to create client account: ${errorMessage}`);
        }

        return null;
      }

    } catch (error: any) {

      toast.error('Failed to create client account');
      return null;
    }
  };

  // const handleCaseSubmit = async () => {
  //   // Generate valid MongoDB ObjectId for the case
  //   const caseId = generateObjectId();
  //   const updatedCase = {
  //     ...caseData,
  //     id: caseId,
  //     _id: caseId, // Add both id and _id for compatibility
  //     clientId: client.clientId || client._id, // Use either id or _id
  //     createdAt: new Date().toISOString()
  //   };
  //   setCaseData(updatedCase);

  //   // Just proceed to next step without saving
  //   handleNext();
  // };

  const handleFormsSubmit = async () => {
    if (selectedForms.length === 0) {
      toast.error('Please select a form');
      return;
    }

    setGeneratingCaseIds(true);

    try {
      // Generate case ID for the selected form


      let caseIds: Record<string, string> = {};

      try {
        // Try to generate case IDs from API first
        caseIds = await generateMultipleCaseIdsFromAPI(selectedForms);
        // Generated case ID for form
      } catch (error) {

        // Fallback to client-side generation
        caseIds = await generateMultipleCaseIds(selectedForms);
        // Generated case ID for form (offline mode)
      }

      // Store the generated case IDs
      setFormCaseIds(caseIds);

      // Log the generated case ID for debugging


      // Update case with selected forms and case IDs
      const updatedCase = {
        ...caseData,
        assignedForms: selectedForms,
        formCaseIds: caseIds // Add case IDs to case data
      };
      setCaseData(updatedCase);

      // Just proceed to next step without saving
      handleNext();
    } catch (error) {

      toast.error('Failed to generate case IDs. Please try again.');
    } finally {
      setGeneratingCaseIds(false);
    }
  };

  // Function to fetch workflows from API for auto-fill
  const fetchWorkflowsFromAPI = async () => {
    try {
      // setLoadingWorkflows(true);
      const token = localStorage.getItem('token');

      // Check token availability
      if (!token) {
        console.log('⚠️ DEBUG: No authentication token available');
        return [];
      }

      console.log('🔄 DEBUG: Requesting workflows from API...');

      // Request workflows from API
      const workflows = await fetchWorkflows({
        status: 'in-progress',
        limit: 50,
        offset: 0
      });

      // Ensure workflows is always an array
      if (!Array.isArray(workflows)) {
        console.warn('⚠️ DEBUG: fetchWorkflows did not return an array:', typeof workflows, workflows);
        return [];
      }

      if (workflows.length > 0) {
        console.log('✅ DEBUG: Retrieved workflows from API:', workflows.length);
        return workflows;
      } else {
        console.log('⚠️ DEBUG: No workflows found from API');
        return [];
      }

    } catch (error: any) {
      console.error('❌ DEBUG: Error in fetchWorkflowsFromAPI:', error);
      // If 404, the endpoint might not be available
      if (error.response?.status === 404) {
        console.log('⚠️ DEBUG: Server workflows endpoint not found');
      } else if (error.response?.status === 401) {
        console.log('⚠️ DEBUG: Authentication failed');
      } else {
        console.log('⚠️ DEBUG: Other API error:', error.message);
      }

      return [];
    } finally {
      // setLoadingWorkflows(false);
    }
  };


  // Function to fetch existing clients from workflows collection
  const fetchClientsFromWorkflows = async (searchQuery?: string) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return [];
      }

      
      // Get all workflows to extract client information
      const workflows = await fetchWorkflows({
        limit: 100,
        offset: 0
      });

      if (workflows.length > 0) {
        // Log the structure of the first workflow for debugging
        

        // Extract unique clients from workflows
        const clientsMap = new Map();

        workflows.forEach((workflow: any) => {
          

          if (workflow.client) {
            const client = workflow.client;
            const clientEmail = client.email?.toLowerCase();

            // Create a unique key using email or name
            const clientKey = clientEmail || `${client.firstName}_${client.lastName}`.toLowerCase();


            if (clientKey && !clientsMap.has(clientKey)) {
              // Ensure client has proper structure
              const processedClient = {
                _id: client.clientId || client._id || generateObjectId(),
                id: client.clientId || client._id || generateObjectId(),
                firstName: client.firstName || '',
                lastName: client.lastName || '',
                name: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim(),
                email: client.email || '',
                phone: client.phone || '',
                dateOfBirth: client.dateOfBirth || '',
                nationality: client.nationality || '',
                address: client.address || {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: ''
                },
                role: 'client', // Set role as client since these are from workflows
                userType: 'individualUser', // Set userType for consistency
                status: client.status || 'active',
                createdAt: client.createdAt || new Date().toISOString(),
                // Add workflow context
                fromWorkflow: true,
                workflowId: workflow._id || workflow.id
              };

              // Filter by search query if provided
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesEmail = processedClient.email.toLowerCase().includes(query);
                const matchesName = processedClient.name.toLowerCase().includes(query);
                const matchesFirstName = processedClient.firstName.toLowerCase().includes(query);
                const matchesLastName = processedClient.lastName.toLowerCase().includes(query);

                if (matchesEmail || matchesName || matchesFirstName || matchesLastName) {
                  clientsMap.set(clientKey, processedClient);
                }
              } else {
                clientsMap.set(clientKey, processedClient);
              }
            } else {
            }
          }
        });

        const uniqueClients = Array.from(clientsMap.values());

        return uniqueClients;
      } else {
        return [];
      }

    } catch (error: any) {
      console.error('❌ Error fetching clients from workflows:', error);
      return [];
    }
  };

  // Fetch existing questionnaire responses for existing clients
  const fetchExistingQuestionnaireResponses = async (clientId: string) => {
    try {
      setLoadingExistingResponses(true);
      console.log('🔄 DEBUG: Fetching existing questionnaire responses for client:', clientId);
      
      // Validate client ID format
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(clientId);
      console.log('🔍 DEBUG: Client ID validation:', {
        clientId,
        isValidObjectId,
        length: clientId.length,
        isEmail: clientId.includes('@')
      });
      
      if (!isValidObjectId) {
        console.warn('⚠️ DEBUG: Client ID is not a valid MongoDB ObjectId, skipping questionnaire response fetch');
        if (clientId.includes('@')) {
          console.warn('⚠️ DEBUG: Client ID appears to be an email address, not an ObjectId');
        }
        setExistingQuestionnaireResponses([]);
        return;
      }

      // Import the questionnaire response controllers to use the correct API
      const { getClientResponses } = await import('../controllers/QuestionnaireResponseControllers');
      
      // Use the correct endpoint to get questionnaire assignments with responses
      const responseData = await getClientResponses({
        clientId: clientId,
        status: 'completed', // Only get completed assignments
        page: 1,
        limit: 50
      });

      console.log('🔍 DEBUG: Raw API response:', {
        clientId,
        responseData,
        hasData: !!responseData.data,
        dataKeys: responseData.data ? Object.keys(responseData.data) : [],
        assignmentsCount: responseData.data?.assignments?.length || 0
      });

      const assignments = responseData.data?.assignments || [];
      
      // If no assignments found with clientId filter, try fetching all and filtering manually
      if (assignments.length === 0) {
        console.log('⚠️ DEBUG: No assignments found with clientId filter, trying to fetch all assignments');
        try {
          const allResponseData = await getClientResponses({
            status: 'completed',
            page: 1,
            limit: 100 // Get more results
          });
          
          const allAssignments = allResponseData.data?.assignments || [];
          console.log('🔍 DEBUG: Fetched all assignments:', {
            totalAllAssignments: allAssignments.length,
            allAssignments: allAssignments.map((a: any) => ({
              id: a._id,
              clientId: a.clientId,
              actualClientId: a.actualClient?._id,
              clientUserId: a.clientUserId?._id,
              clientEmail: a.actualClient?.email || a.clientUserId?.email,
              questionnaireTitle: a.questionnaireDetails?.title
            }))
          });
          
          // Filter by client ID manually, with email fallback
          const filteredAssignments = allAssignments.filter((assignment: any) => {
            const assignmentClientId = assignment.clientId || 
                                     assignment.actualClient?._id || 
                                     assignment.clientUserId?._id;
            const assignmentEmail = assignment.actualClient?.email || assignment.clientUserId?.email;
            const currentClientEmail = client.email;
            
            const idMatch = assignmentClientId === clientId;
            const emailMatch = assignmentEmail && currentClientEmail && 
                              assignmentEmail.toLowerCase() === currentClientEmail.toLowerCase();
            
            const matches = idMatch || emailMatch;
            
            console.log('🔍 DEBUG: Checking assignment client match:', {
              assignmentId: assignment._id,
              assignmentClientId,
              assignmentEmail,
              targetClientId: clientId,
              targetClientEmail: currentClientEmail,
              idMatch,
              emailMatch,
              matches
            });
            
            return matches;
          });
          
          console.log('✅ DEBUG: Manually filtered assignments:', {
            clientId,
            filteredCount: filteredAssignments.length,
            filteredAssignments: filteredAssignments.map((a: any) => ({
              id: a._id,
              questionnaireTitle: a.questionnaireDetails?.title,
              clientId: a.clientId
            }))
          });
          
          assignments.push(...filteredAssignments);
        } catch (fallbackError) {
          console.error('❌ Error in fallback fetch:', fallbackError);
        }
      }
      console.log('✅ DEBUG: Retrieved questionnaire assignments:', {
        clientId,
        totalAssignments: assignments.length,
        assignments: assignments.map((a: any) => ({
          id: a._id,
          questionnaireTitle: a.questionnaireDetails?.title || 'Unknown',
          status: a.status,
          hasResponseId: !!a.responseId,
          hasResponses: !!a.responseId?.responses,
          responseCount: a.responseId?.responses ? Object.keys(a.responseId.responses).length : 0,
          clientEmail: a.actualClient?.email || a.clientUserId?.email
        }))
      });

      // Convert assignments to response format expected by the UI
      const responses = assignments
        .filter((assignment: any) => assignment.responseId && assignment.responseId.responses)
        .map((assignment: any) => ({
          id: assignment.responseId._id || assignment._id,
          assignmentId: assignment._id,
          questionnaireId: assignment.questionnaireId,
          questionnaireTitle: assignment.questionnaireDetails?.title || 
                             assignment.workflowQuestionnaireAssignment?.questionnaire_title ||
                             'Unknown Questionnaire',
          clientId: assignment.clientId,
          responses: assignment.responseId.responses,
          status: 'completed',
          submittedAt: assignment.responseId.submittedAt || assignment.completedAt,
          createdAt: assignment.assignedAt,
          updatedAt: assignment.completedAt,
          // Include additional metadata
          formCaseIdGenerated: assignment.formCaseIdGenerated,
          workflowCase: assignment.workflowCase,
          workflowQuestionnaireAssignment: assignment.workflowQuestionnaireAssignment
        }));

      console.log('✅ DEBUG: Converted to response format:', {
        clientId,
        totalResponses: responses.length,
        responses: responses.map((r: any) => ({
          id: r.id,
          questionnaireTitle: r.questionnaireTitle,
          submittedAt: r.submittedAt,
          responseCount: Object.keys(r.responses || {}).length,
          clientId: r.clientId
        }))
      });
      
      // Additional debugging for the specific client mentioned in the issue
      if (clientId === '68c1505149321ce701f936ae') {
        console.log('🎯 DEBUG: Special debugging for client 68c1505149321ce701f936ae:', {
          clientId,
          totalAssignments: assignments.length,
          totalResponses: responses.length,
          assignmentsWithResponses: assignments.filter((a: any) => a.responseId && a.responseId.responses).length,
          allAssignmentsDetails: assignments.map((a: any) => ({
            id: a._id,
            clientId: a.clientId,
            actualClientId: a.actualClient?._id,
            clientUserId: a.clientUserId?._id,
            clientEmail: a.actualClient?.email || a.clientUserId?.email,
            hasResponseId: !!a.responseId,
            hasResponses: !!a.responseId?.responses,
            responseCount: a.responseId?.responses ? Object.keys(a.responseId.responses).length : 0
          }))
        });
        
        // If still no responses found, try a more aggressive search
        if (responses.length === 0) {
          console.log('🔍 DEBUG: No responses found for specific client, trying broader search...');
          try {
            // Try searching by email specifically
            const emailResponseData = await getClientResponses({
              status: 'completed',
              page: 1,
              limit: 200 // Get even more results
            });
            
            const emailAssignments = emailResponseData.data?.assignments || [];
            const emailFiltered = emailAssignments.filter((assignment: any) => {
              const assignmentEmail = assignment.actualClient?.email || assignment.clientUserId?.email;
              return assignmentEmail && assignmentEmail.toLowerCase().includes('anjali_b@bullbox.in');
            });
            
            console.log('🔍 DEBUG: Email-based search results:', {
              totalAssignments: emailAssignments.length,
              emailFiltered: emailFiltered.length,
              emailFilteredDetails: emailFiltered.map((a: any) => ({
                id: a._id,
                clientEmail: a.actualClient?.email || a.clientUserId?.email,
                hasResponseId: !!a.responseId,
                hasResponses: !!a.responseId?.responses
              }))
            });
            
            if (emailFiltered.length > 0) {
              // Add these to our responses
              const emailResponses = emailFiltered
                .filter((assignment: any) => assignment.responseId && assignment.responseId.responses)
                .map((assignment: any) => ({
                  id: assignment.responseId._id || assignment._id,
                  assignmentId: assignment._id,
                  questionnaireId: assignment.questionnaireId,
                  questionnaireTitle: assignment.questionnaireDetails?.title || 'Unknown Questionnaire',
                  clientId: assignment.clientId,
                  responses: assignment.responseId.responses,
                  status: 'completed',
                  submittedAt: assignment.responseId.submittedAt || assignment.completedAt,
                  createdAt: assignment.assignedAt,
                  updatedAt: assignment.completedAt,
                  formCaseIdGenerated: assignment.formCaseIdGenerated,
                  workflowCase: assignment.workflowCase,
                  workflowQuestionnaireAssignment: assignment.workflowQuestionnaireAssignment
                }));
              
              responses.push(...emailResponses);
              console.log('✅ DEBUG: Added email-based responses:', emailResponses.length);
            }
          } catch (emailError) {
            console.error('❌ Error in email-based search:', emailError);
          }
        }
      }

      setExistingQuestionnaireResponses(responses);
      
      // Also try to fetch workflow-specific responses for this client
      console.log('🔄 DEBUG: Also checking for workflow-specific responses');
      await fetchWorkflowQuestionnaireResponses(clientId);
      
      return responses;
    } catch (error) {
      console.error('❌ Error fetching existing questionnaire responses:', error);
      setExistingQuestionnaireResponses([]);
      return [];
    } finally {
      setLoadingExistingResponses(false);
    }
  };

  // New function to fetch questionnaire responses specifically from workflow data
  const fetchWorkflowQuestionnaireResponses = async (clientId: string) => {
    try {
      console.log('🔄 DEBUG: Fetching workflow-specific questionnaire responses for client:', clientId);
      
      // Try to find workflow data for this client that might contain questionnaire responses
      const apiWorkflows = await fetchWorkflowsFromAPI();
      
      if (Array.isArray(apiWorkflows)) {
        // More flexible client matching
        const clientWorkflows = apiWorkflows.filter((w: any) => {
          const workflowClientId = w.clientId || w.client?.clientId || w.client?.id || w.client?._id;
          const workflowClientEmail = w.client?.email;
          const currentClientEmail = client.email;
          
          // Handle empty string clientId in workflow
          const hasValidWorkflowClientId = workflowClientId && workflowClientId.trim() !== '';
          const idMatch = hasValidWorkflowClientId && workflowClientId === clientId;
          const emailMatch = workflowClientEmail && currentClientEmail && workflowClientEmail.toLowerCase() === currentClientEmail.toLowerCase();
          
          // Also check if the workflow client ID matches the target client's ID from the workflow's client object
          const workflowInternalClientId = w.client?.clientId || w.client?.id || w.client?._id;
          const internalIdMatch = workflowInternalClientId && workflowInternalClientId === clientId;
          
          console.log('🔍 DEBUG: Checking workflow for client match:', {
            workflowId: w.id || w._id,
            workflowClientId: workflowClientId || 'empty/undefined',
            workflowInternalClientId: workflowInternalClientId || 'empty/undefined',
            workflowClientEmail,
            targetClientId: clientId,
            targetClientEmail: currentClientEmail,
            hasValidWorkflowClientId,
            idMatch,
            internalIdMatch,
            emailMatch,
            overallMatch: idMatch || emailMatch || internalIdMatch
          });
          
          return idMatch || emailMatch || internalIdMatch;
        });
        
        console.log('🔄 DEBUG: Found workflows for client:', {
          clientId,
          clientEmail: client.email,
          totalWorkflows: apiWorkflows.length,
          matchingWorkflows: clientWorkflows.length,
          workflowIds: clientWorkflows.map((w: any) => w.id || w._id)
        });
        
        // Check each workflow for questionnaire responses
        for (const workflow of clientWorkflows) {
          console.log('🔍 DEBUG: Checking workflow for questionnaire data:', {
            workflowId: workflow.id || workflow._id,
            hasQuestionnaireAssignment: !!workflow.questionnaireAssignment,
            hasResponses: !!workflow.responses,
            hasResponsesData: workflow.responses ? Object.keys(workflow.responses).length > 0 : false,
            currentStep: workflow.currentStep,
            status: workflow.status
          });
          
          if (workflow.questionnaireAssignment && workflow.responses && Object.keys(workflow.responses).length > 0) {
            console.log('✅ DEBUG: Found workflow with questionnaire responses:', {
              workflowId: workflow.id || workflow._id,
              questionnaireTitle: workflow.questionnaireAssignment.questionnaire_title,
              responseCount: Object.keys(workflow.responses || {}).length,
              responseFields: Object.keys(workflow.responses)
            });
            
            // Load this workflow's questionnaire responses
            const loadedResponse = await loadPreviousQuestionnaireFromWorkflow(workflow);
            if (loadedResponse) {
              console.log('✅ DEBUG: Successfully loaded workflow questionnaire response');
            }
          } else {
            console.log('⚠️ DEBUG: Workflow does not have complete questionnaire data:', {
              workflowId: workflow.id || workflow._id,
              missingQuestionnaireAssignment: !workflow.questionnaireAssignment,
              missingResponses: !workflow.responses,
              emptyResponses: workflow.responses ? Object.keys(workflow.responses).length === 0 : 'no responses object'
            });
          }
        }
      } else {
        console.log('⚠️ DEBUG: apiWorkflows is not an array:', typeof apiWorkflows, apiWorkflows);
      }
    } catch (error) {
      console.error('❌ Error fetching workflow questionnaire responses:', error);
    }
  };

  // Function to detect and load previous questionnaire responses from workflow data
  const loadPreviousQuestionnaireFromWorkflow = async (workflowData: any) => {
    try {
      console.log('🔄 DEBUG: ========== LOADING PREVIOUS QUESTIONNAIRE FROM WORKFLOW ==========');
      console.log('🔄 DEBUG: Checking for previous questionnaire responses in workflow data:', {
        hasQuestionnaireAssignment: !!workflowData.questionnaireAssignment,
        hasTopLevelResponses: !!workflowData.responses,
        hasNestedResponses: !!(workflowData.questionnaireAssignment?.responses),
        currentStep: workflowData.currentStep,
        workflowStructure: {
          questionnaireAssignment: workflowData.questionnaireAssignment ? Object.keys(workflowData.questionnaireAssignment) : 'None',
          topLevelResponsesKeys: workflowData.responses ? Object.keys(workflowData.responses) : 'None'
        }
      });

      let responsesData = null;
      let questionnaireAssignmentData = workflowData.questionnaireAssignment;

      // Check for responses in multiple locations
      if (workflowData.questionnaireAssignment?.responses && Object.keys(workflowData.questionnaireAssignment.responses).length > 0) {
        console.log('✅ DEBUG: Found responses in questionnaireAssignment.responses');
        responsesData = workflowData.questionnaireAssignment.responses;
      } else if (workflowData.responses && Object.keys(workflowData.responses).length > 0) {
        console.log('✅ DEBUG: Found responses in top-level responses');
        responsesData = workflowData.responses;
      }

      console.log('🔍 DEBUG: Response data analysis:', {
        foundResponses: !!responsesData,
        responseLocation: responsesData ? (workflowData.questionnaireAssignment?.responses ? 'questionnaireAssignment.responses' : 'top-level responses') : 'none',
        responseCount: responsesData ? Object.keys(responsesData).length : 0,
        responseKeys: responsesData ? Object.keys(responsesData) : [],
        responsesData: responsesData
      });

      // Check if the workflow has questionnaire assignment and responses
      if (questionnaireAssignmentData && responsesData && Object.keys(responsesData).length > 0) {
        const questionnaireResponse = {
          id: questionnaireAssignmentData.response_id || `response_${Date.now()}`,
          _id: questionnaireAssignmentData.response_id,
          questionnaireId: questionnaireAssignmentData.questionnaire_id,
          questionnaireTitle: questionnaireAssignmentData.questionnaire_title || 'Previous Questionnaire',
          responses: responsesData,
          submittedAt: questionnaireAssignmentData.submitted_at || responsesData.submitted_at || new Date().toISOString(),
          isComplete: questionnaireAssignmentData.is_complete || responsesData.is_complete || false,
          clientId: client.clientId,
          caseId: workflowData.case?.id || 'previous-case',
          // Additional workflow data
          assignmentId: questionnaireAssignmentData.assignment_id,
          attorneyId: questionnaireAssignmentData.attorney_id,
          notes: questionnaireAssignmentData.notes,
          formNumber: questionnaireAssignmentData.formNumber,
          formCaseIdGenerated: questionnaireAssignmentData.formCaseIdGenerated
        };

        console.log('✅ DEBUG: ========== QUESTIONNAIRE RESPONSE CREATED ==========');
        console.log('✅ DEBUG: Created questionnaire response object:', {
          responseId: questionnaireResponse.id,
          questionnaireTitle: questionnaireResponse.questionnaireTitle,
          questionnaireId: questionnaireResponse.questionnaireId,
          responseCount: Object.keys(questionnaireResponse.responses).length,
          isComplete: questionnaireResponse.isComplete,
          submittedAt: questionnaireResponse.submittedAt,
          assignmentId: questionnaireResponse.assignmentId,
          responseFields: Object.entries(questionnaireResponse.responses).map(([key, value]) => ({
            field: key,
            value: value,
            type: typeof value
          }))
        });

        // Add this response to the existing questionnaire responses
        setExistingQuestionnaireResponses(prev => {
          // Check if this response already exists to avoid duplicates
          const existingIndex = prev.findIndex(r => r.id === questionnaireResponse.id);
          if (existingIndex >= 0) {
            console.log('🔄 DEBUG: Updating existing response in state');
            // Update existing response
            const updated = [...prev];
            updated[existingIndex] = questionnaireResponse;
            return updated;
          } else {
            console.log('🔄 DEBUG: Adding new response to state');
            // Add new response
            return [questionnaireResponse, ...prev];
          }
        });

        // Auto-select the previous response for convenience
        console.log('🔄 DEBUG: Auto-selecting previous response');
        setSelectedExistingResponse(questionnaireResponse.id);
        setUseExistingResponse(true);
        
        // Load the responses into the form
        console.log('🔄 DEBUG: Loading responses into form state');
        setClientResponses(questionnaireResponse.responses);
        setIsExistingResponse(true);

        toast.success(`Previous questionnaire response loaded: ${questionnaireResponse.questionnaireTitle}`);
        
        console.log('✅ DEBUG: ========== QUESTIONNAIRE LOADING COMPLETED ==========');
        return questionnaireResponse;
      } else {
        console.log('⚠️ DEBUG: ========== NO QUESTIONNAIRE RESPONSES FOUND ==========');
        console.log('⚠️ DEBUG: Missing data analysis:', {
          hasQuestionnaireAssignment: !!questionnaireAssignmentData,
          hasResponses: !!responsesData,
          responseCount: responsesData ? Object.keys(responsesData).length : 0,
          missingQuestionnaireAssignment: !questionnaireAssignmentData,
          missingResponses: !responsesData,
          emptyResponses: responsesData ? Object.keys(responsesData).length === 0 : 'no responses object'
        });
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR: Failed to load previous questionnaire from workflow:', error);
      return null;
    }
  };

  // Function to auto-fill workflow data from saved workflows
  // Function to auto-fill ONLY CLIENT DATA - no other workflow data
  const autoFillFromSavedWorkflow = async (workflowData: any) => {
    try {
      console.log('🔄 DEBUG: ========== AUTO-FILLING CLIENT DATA FROM WORKFLOW ==========');
      console.log('🔄 DEBUG: Current client state before auto-fill:', {
        currentClientFlags: {
          isExistingClient: client.isExistingClient,
          hasUserAccount: client.hasUserAccount,
          role: client.role,
          userType: client.userType
        },
        currentClientId: client.clientId,
        currentClientEmail: client.email,
        currentClientName: client.name
      });
      
      // MODIFIED SAFETY CHECK: For existing clients, we DO want to load workflow data to populate Create Client step
      // But we need to preserve their existing client flags
      const isExistingClientLoad = client.isExistingClient === true || client.hasUserAccount === true;
      if (isExistingClientLoad) {
        console.log('� DEBUG: EXISTING CLIENT LOAD - Loading workflow data while preserving client flags:', {
          isExistingClient: client.isExistingClient,
          hasUserAccount: client.hasUserAccount,
          clientId: client.clientId,
          clientEmail: client.email,
          reason: 'Loading complete workflow data for existing client on Create Client step'
        });
      }
      
      console.log('🔄 DEBUG: Auto-filling ONLY client data for Create Client step - SKIPPING all other data:', {
        hasClient: !!workflowData.client,
        willSkipCase: true,
        willSkipForms: true,
        willSkipQuestionnaire: true,
        willSkipAllOtherData: true
      });

      // ONLY auto-fill client data - absolutely nothing else
      if (workflowData.client) {
        console.log('🔄 DEBUG: Auto-filling client data from workflow:', {
          currentClientId: client.clientId,
          workflowClientId: workflowData.client.clientId || workflowData.client._id,
          workflowClientName: workflowData.client.name || `${workflowData.client.firstName} ${workflowData.client.lastName}`.trim(),
          workflowClientEmail: workflowData.client.email,
          workflowClientPhone: workflowData.client.phone,
          workflowClientAddress: workflowData.client.address,
          workflowAptNumber: workflowData.client.address?.aptNumber,
          workflowAptSuiteFlr: workflowData.client.address?.aptSuiteFlr
        });

        const newClientData = {
          ...client,
          ...workflowData.client,
          // Ensure we don't overwrite with undefined values
          id: workflowData.client.clientId || client.clientId,
          _id: workflowData.client._id || client._id,
          name: workflowData.client.name || client.name,
          // Explicitly handle separate name fields
          firstName: workflowData.client.firstName || client.firstName,
          middleName: workflowData.client.middleName || client.middleName || '',
          lastName: workflowData.client.lastName || client.lastName,
          email: workflowData.client.email || client.email,
          phone: workflowData.client.phone || client.phone,
          // Explicitly handle complete address information from workflow
          address: {
            street: workflowData.client.address?.street || client.address?.street || '',
            aptSuiteFlr: workflowData.client.address?.aptSuiteFlr || client.address?.aptSuiteFlr || '',
            aptNumber: workflowData.client.address?.aptNumber || client.address?.aptNumber || '',
            city: workflowData.client.address?.city || client.address?.city || '',
            state: workflowData.client.address?.state || client.address?.state || '',
            zipCode: workflowData.client.address?.zipCode || client.address?.zipCode || '',
            province: workflowData.client.address?.province || client.address?.province || '',
            postalCode: workflowData.client.address?.postalCode || client.address?.postalCode || '',
            country: workflowData.client.address?.country || client.address?.country || '',
            formattedAddress: workflowData.client.address?.formattedAddress || client.address?.formattedAddress
          },
          dateOfBirth: workflowData.client.dateOfBirth || client.dateOfBirth,
          nationality: workflowData.client.nationality || client.nationality,
          status: workflowData.client.status || client.status,
          // Additional fields from workflow
          temporaryPassword: workflowData.client.temporaryPassword,
          createdAt: workflowData.client.createdAt || client.createdAt,
          // PRESERVE EXISTING CLIENT FLAGS - ABSOLUTE PRIORITY to preserve existing client status
          // These flags should NEVER be overwritten if they were already set to true
          // CRITICAL: If client.isExistingClient OR client.hasUserAccount is already true, KEEP IT TRUE
          isExistingClient: (client.isExistingClient === true) ? true : 
                          (client.isExistingClient || workflowData.client.isExistingClient || 
                           (workflowData.client.clientId || workflowData.client._id ? true : false)),
          hasUserAccount: (client.hasUserAccount === true) ? true : 
                         (client.hasUserAccount || workflowData.client.hasUserAccount || 
                          (workflowData.client.clientId || workflowData.client._id ? true : false)),
          role: client.role || workflowData.client.role,
          userType: client.userType || workflowData.client.userType
        };
        
        // CRITICAL DEBUG: Log flag preservation logic
        console.log('🔍 DEBUG: FLAG PRESERVATION LOGIC:', {
          originalClientFlags: {
            isExistingClient: client.isExistingClient,
            hasUserAccount: client.hasUserAccount,
            isExistingClientStrictly: client.isExistingClient === true,
            hasUserAccountStrictly: client.hasUserAccount === true
          },
          workflowClientFlags: {
            isExistingClient: workflowData.client.isExistingClient,
            hasUserAccount: workflowData.client.hasUserAccount,
            hasWorkflowId: !!(workflowData.client.clientId || workflowData.client._id)
          },
          resultingFlags: {
            isExistingClient: newClientData.isExistingClient,
            hasUserAccount: newClientData.hasUserAccount
          },
          flagPreservationReason: {
            existingClientPreserved: client.isExistingClient === true,
            userAccountPreserved: client.hasUserAccount === true,
            workflowIdDetected: !!(workflowData.client.clientId || workflowData.client._id)
          }
        });

        console.log('✅ DEBUG: Complete client data updated from workflow:', {
          name: newClientData.name,
          firstName: newClientData.firstName,
          lastName: newClientData.lastName,
          email: newClientData.email,
          phone: newClientData.phone,
          dateOfBirth: newClientData.dateOfBirth,
          nationality: newClientData.nationality,
          hasAddress: !!newClientData.address,
          addressDetails: newClientData.address,
          aptNumber: newClientData.address?.aptNumber,
          aptSuiteFlr: newClientData.address?.aptSuiteFlr,
          temporaryPassword: !!newClientData.temporaryPassword,
          // IMPORTANT: Check existing client flags
          isExistingClient: newClientData.isExistingClient,
          hasUserAccount: newClientData.hasUserAccount,
          role: newClientData.role,
          userType: newClientData.userType,
          preservedFromOriginalClient: {
            isExistingClient: client.isExistingClient,
            hasUserAccount: client.hasUserAccount
          },
          derivedFromWorkflow: {
            hasWorkflowId: !!(workflowData.client.clientId || workflowData.client._id),
            workflowClientId: workflowData.client.clientId || workflowData.client._id
          }
        });

        setClient(newClientData);
        
        // DEBUG: Confirm apartment number was set
        console.log('✅ DEBUG: Client data set, apartment number check:', {
          aptNumber: newClientData.address?.aptNumber,
          aptSuiteFlr: newClientData.address?.aptSuiteFlr,
          fullAddress: newClientData.address,
          setClientCalled: true
        });
        
        // Immediately verify the client flags were preserved
        console.log('🔍 DEBUG: Client flags immediately after setClient:', {
          isExistingClient: newClientData.isExistingClient,
          hasUserAccount: newClientData.hasUserAccount,
          role: newClientData.role,
          userType: newClientData.userType,
          clientId: newClientData.id,
          clientEmail: newClientData.email
        });
        
        // Also update client credentials if available
        if (workflowData.clientCredentials) {
          console.log('🔄 DEBUG: Updating client credentials from workflow:', {
            email: workflowData.clientCredentials.email,
            createAccount: workflowData.clientCredentials.createAccount,
            hasPassword: workflowData.clientCredentials.hasPassword,
            isExistingClient: newClientData.isExistingClient,
            hasUserAccount: newClientData.hasUserAccount
          });
          
          setClientCredentials(prev => {
            // For existing clients, never create accounts - they should already have accounts
            const shouldCreateAccount = (newClientData.isExistingClient || newClientData.hasUserAccount) 
              ? false 
              : (workflowData.clientCredentials.createAccount !== undefined ? workflowData.clientCredentials.createAccount : prev.createAccount);
            
            console.log('🔄 DEBUG: Client credentials updated:', {
              createAccount: shouldCreateAccount,
              reason: (newClientData.isExistingClient || newClientData.hasUserAccount) ? 'Existing client - account creation disabled' : 'New client - using workflow setting'
            });
            
            return {
              ...prev,
              email: workflowData.clientCredentials.email || prev.email,
              createAccount: shouldCreateAccount,
              // Don't auto-fill password for security reasons
              password: prev.password
            };
          });
        }
        
        toast.success(`Client details loaded from workflow: ${newClientData.name}`);
      } else {
        console.log('⚠️ DEBUG: No client data in workflow, keeping existing client data:', {
          clientId: client.clientId,
          clientName: client.name,
          clientEmail: client.email
        });
        // Client data is already set from selection, no need to change anything
        toast.success(`Client details preserved: ${client.name}`);
      }

      // EXPLICITLY DO NOT AUTO-FILL ANY OTHER DATA (except client)
      console.log('🚫 DEBUG: SKIPPING ALL OTHER WORKFLOW DATA:');
      console.log('🚫 DEBUG: NOT auto-filling case data');
      console.log('🚫 DEBUG: NOT auto-filling forms data'); 
      console.log('🚫 DEBUG: NOT auto-filling questionnaire selection');
      console.log('🚫 DEBUG: NOT auto-filling form case IDs');
      console.log('🚫 DEBUG: NOT auto-filling client responses');
      console.log('🚫 DEBUG: NOT auto-filling questionnaire assignments');
      console.log('🚫 DEBUG: NOT auto-filling form details');
      console.log('🚫 DEBUG: NOT changing current step');

      // Summary - only client details
      console.log('✅ DEBUG: ========== AUTO-FILL COMPLETED ==========');
      console.log('✅ DEBUG: Auto-fill completed - ONLY client details filled, all other data skipped:', {
        clientName: client.name,
        clientEmail: client.email,
        currentStep: currentStep, // Should stay exactly the same
        allOtherDataSkipped: true
      });

      toast.success('Client details loaded - only Create Client step filled');
      
    } catch (error) {
      console.error('❌ DEBUG: Auto-fill error:', error);
      toast.error('Error during auto-fill: ' + (error as Error).message);
    }
  };

  // Function to find and auto-fill matching workflow for existing clients
  const findAndAutoFillWorkflow = async (clientEmail?: string, clientId?: string) => {
    try {
      console.log('🔄 DEBUG: ========== WORKFLOW SEARCH STARTED ==========');
      console.log('🔄 DEBUG: Searching for existing client workflows:', { 
        clientEmail, 
        clientId,
        timestamp: new Date().toISOString()
      });

      // Try multiple approaches to fetch workflow data
      let apiWorkflows: any[] = [];

      // Approach 1: Use the general fetchWorkflowsFromAPI to find workflow IDs
      console.log('🔄 DEBUG: ========== APPROACH 1: GENERAL API WORKFLOWS ==========');
      console.log('🔄 DEBUG: Calling fetchWorkflowsFromAPI...');
      
      try {
        apiWorkflows = await fetchWorkflowsFromAPI();
        
        console.log('🔄 DEBUG: fetchWorkflowsFromAPI response details:', {
          responseType: typeof apiWorkflows,
          isArray: Array.isArray(apiWorkflows),
          length: Array.isArray(apiWorkflows) ? apiWorkflows.length : 'N/A',
          rawResponse: apiWorkflows
        });
        
        // Ensure apiWorkflows is always an array
        if (!Array.isArray(apiWorkflows)) {
          console.warn('⚠️ DEBUG: fetchWorkflowsFromAPI did not return an array:', typeof apiWorkflows, apiWorkflows);
          apiWorkflows = [];
        }
        
        console.log('✅ DEBUG: General API workflows found:', apiWorkflows.length);
        
        // Log detailed structure of each workflow found
        if (apiWorkflows.length > 0) {
          console.log('🔍 DEBUG: ========== DETAILED WORKFLOW ANALYSIS ==========');
          apiWorkflows.forEach((workflow, index) => {
            console.log(`🔍 DEBUG: Workflow ${index + 1}/${apiWorkflows.length}:`, {
              workflowId: workflow.id || workflow._id || workflow.workflowId,
              createdBy: workflow.createdBy,
              currentStep: workflow.currentStep,
              status: workflow.status,
              workflowType: workflow.workflowType,
              client: {
                id: workflow.client?.clientId || workflow.client?.id || workflow.client?._id || workflow.clientId,
                name: workflow.client?.name || `${workflow.client?.firstName || ''} ${workflow.client?.lastName || ''}`.trim(),
                firstName: workflow.client?.firstName,
                lastName: workflow.client?.lastName,
                email: workflow.client?.email,
                phone: workflow.client?.phone,
                hasClientData: !!workflow.client
              },
              case: {
                id: workflow.case?.id || workflow.case?._id,
                category: workflow.case?.category,
                hasCaseData: !!workflow.case
              },
              questionnaire: {
                selectedQuestionnaire: workflow.selectedQuestionnaire,
                questionnaireAssignment: !!workflow.questionnaireAssignment,
                hasResponses: !!(workflow.responses && Object.keys(workflow.responses).length > 0),
                responseCount: workflow.responses ? Object.keys(workflow.responses).length : 0,
                isComplete: workflow.responses?.is_complete,
                submittedAt: workflow.responses?.submitted_at,
                questionnaireTitle: workflow.questionnaireAssignment?.questionnaire_title,
                assignmentId: workflow.questionnaireAssignment?.assignment_id,
                responseId: workflow.questionnaireAssignment?.response_id
              },
              forms: {
                selectedForms: workflow.selectedForms ? workflow.selectedForms.length : 0,
                formTemplates: workflow.formTemplates ? workflow.formTemplates.length : 0,
                formCaseIds: !!workflow.formCaseIds
              },
              timestamps: {
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt
              },
              stepsProgress: workflow.stepsProgress ? workflow.stepsProgress.length : 0,
              allKeys: Object.keys(workflow)
            });
          });
        }
      } catch (fetchError: any) {
        console.error('❌ DEBUG: fetchWorkflowsFromAPI failed:', {
          error: fetchError,
          message: fetchError.message,
          stack: fetchError.stack
        });
        apiWorkflows = [];
      }

      // Approach 2: If no workflows found, try fetchWorkflowsForClientSearch with email
      if (apiWorkflows.length === 0 && clientEmail) {
        console.log('🔄 DEBUG: Approach 2 - Trying fetchWorkflowsForClientSearch with email');
        try {
          const clientSearchWorkflows = await fetchWorkflowsForClientSearch(clientEmail);
          
          // Ensure result is an array
          if (Array.isArray(clientSearchWorkflows)) {
            apiWorkflows = clientSearchWorkflows;
            console.log('✅ DEBUG: Client search API workflows found:', apiWorkflows.length);
          } else {
            console.warn('⚠️ DEBUG: fetchWorkflowsForClientSearch did not return an array:', typeof clientSearchWorkflows);
          }
        } catch (error: any) {
          console.log('⚠️ DEBUG: Client search API failed:', error.message);
        }
      }

      // Approach 3: If still no workflows, try the clients from workflows method
      if (apiWorkflows.length === 0) {
        console.log('🔄 DEBUG: Approach 3 - Trying fetchClientsFromWorkflows');
        try {
          const clientsFromWorkflows = await fetchClientsFromWorkflows(clientEmail);
          console.log('✅ DEBUG: Clients from workflows found:', clientsFromWorkflows.length);
          
          // If we found clients, try to get their workflows
          if (clientsFromWorkflows.length > 0) {
            // Try to get all workflows again to find the ones for these clients
            const allWorkflows = await fetchWorkflows({ limit: 200, offset: 0 });
            
            // Ensure result is an array
            if (Array.isArray(allWorkflows)) {
              apiWorkflows = allWorkflows;
              console.log('✅ DEBUG: All workflows retrieved for client matching:', apiWorkflows.length);
            } else {
              console.warn('⚠️ DEBUG: fetchWorkflows did not return an array:', typeof allWorkflows);
            }
          }
        } catch (error: any) {
          console.log('⚠️ DEBUG: fetchClientsFromWorkflows failed:', error.message);
        }
      }

      console.log('✅ DEBUG: Workflow IDs found:', {
        total: apiWorkflows.length,
        isArray: Array.isArray(apiWorkflows),
        workflowIds: Array.isArray(apiWorkflows) ? apiWorkflows.map(w => ({
          id: w.id || w._id,
          workflowId: w.workflowId,
          clientEmail: w.client?.email,
          clientId: w.clientId || w.client?.clientId || w.client?.id || w.client?._id,
          clientName: w.client?.name || `${w.client?.firstName} ${w.client?.lastName}`.trim(),
          status: w.status
        })) : 'apiWorkflows is not an array'
      });

      // Use all found workflows to find matching workflow ID
      const allWorkflows = apiWorkflows;
      console.log('🔄 DEBUG: ========== WORKFLOW MATCHING PHASE ==========');
      console.log('🔄 DEBUG: Searching for matching workflow among', allWorkflows.length, 'workflows');
      console.log('🔄 DEBUG: Search criteria:', {
        clientId: clientId || 'Not provided',
        clientEmail: clientEmail || 'Not provided'
      });

      if (allWorkflows.length === 0) {
        console.log('⚠️ DEBUG: No workflows found from any source');
        toast('No saved workflows found to auto-fill from');
        return false;
      }

      // Find matching workflow by client email, client ID, or oldest (first created)
      let matchingWorkflow = null;

      // First try to match by client ID if provided
      if (clientId) {
        console.log('🔄 DEBUG: ========== SEARCHING BY CLIENT ID ==========');
        console.log('🔄 DEBUG: Target client ID:', clientId);
        
        const clientIdMatches = allWorkflows.filter((w: any, index: number) => {
          const workflowClientId = w.clientId || w.client?.clientId || w.client?.id || w.client?._id;
          console.log(`� DEBUG: Workflow ${index + 1}: Comparing client IDs:`, { 
            workflowIndex: index,
            workflowId: w.id || w._id,
            workflowClientId, 
            searchClientId: clientId,
            workflowClient: w.client?.name || w.client?.email,
            matches: workflowClientId === clientId
          });
          return workflowClientId === clientId;
        });

        if (clientIdMatches.length > 0) {
          // Sort by createdAt ascending to get the oldest (first created) workflow
          // Handle cases where createdAt might be missing by using a fallback date
          matchingWorkflow = clientIdMatches.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          })[0];
          
          if (clientIdMatches.length > 1) {
            console.log(`🔄 DEBUG: Found ${clientIdMatches.length} workflows with same client ID - selected oldest:`, {
              selectedWorkflowId: matchingWorkflow.id || matchingWorkflow._id,
              selectedCreatedAt: matchingWorkflow.createdAt,
              allMatches: clientIdMatches.map((w: any) => ({
                id: w.id || w._id,
                createdAt: w.createdAt
              }))
            });
          }
        }

        if (matchingWorkflow) {
          console.log('✅ DEBUG: ========== FOUND MATCHING WORKFLOW BY CLIENT ID ==========');
          console.log('✅ DEBUG: Matching workflow details:', {
            workflowId: matchingWorkflow.id || matchingWorkflow._id,
            workflowIdField: matchingWorkflow.workflowId,
            clientId: matchingWorkflow.clientId || matchingWorkflow.client?.clientId || matchingWorkflow.client?.id,
            clientName: matchingWorkflow.client?.name || `${matchingWorkflow.client?.firstName} ${matchingWorkflow.client?.lastName}`.trim(),
            clientEmail: matchingWorkflow.client?.email,
            status: matchingWorkflow.status,
            currentStep: matchingWorkflow.currentStep
          });
        } else {
          console.log('⚠️ DEBUG: No workflow found for client ID:', clientId);
        }
      }

      // If not found by ID, try email
      if (!matchingWorkflow && clientEmail) {
        console.log('🔄 DEBUG: ========== SEARCHING BY CLIENT EMAIL ==========');
        console.log('🔄 DEBUG: Target client email:', clientEmail);
        
        const emailMatches = allWorkflows.filter((w: any) => {
          const workflowEmail = w.client?.email?.toLowerCase();
          const searchEmail = clientEmail.toLowerCase();
          console.log('🔄 DEBUG: Email comparison:', { 
            workflowEmail, 
            searchEmail,
            workflowClient: w.client?.name 
          });
          return workflowEmail === searchEmail;
        });

        if (emailMatches.length > 0) {
          // Sort by createdAt ascending to get the oldest (first created) workflow
          // Handle cases where createdAt might be missing by using a fallback date
          matchingWorkflow = emailMatches.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          })[0];
          
          if (emailMatches.length > 1) {
            console.log(`🔄 DEBUG: Found ${emailMatches.length} workflows with same email - selected oldest:`, {
              selectedWorkflowId: matchingWorkflow.id || matchingWorkflow._id,
              selectedCreatedAt: matchingWorkflow.createdAt,
              allMatches: emailMatches.map((w: any) => ({
                id: w.id || w._id,
                createdAt: w.createdAt
              }))
            });
          }
        }

        if (matchingWorkflow) {
          console.log('✅ DEBUG: Found matching workflow by email:', {
            workflowId: matchingWorkflow.id || matchingWorkflow._id,
            email: matchingWorkflow.client?.email,
            clientName: matchingWorkflow.client?.name || `${matchingWorkflow.client?.firstName} ${matchingWorkflow.client?.lastName}`.trim()
          });
        } else {
          console.log('⚠️ DEBUG: No workflow found for email:', clientEmail);
        }
      }

      // If still not found, look for oldest (first created) workflow for this client (any status)
      if (!matchingWorkflow) {
        console.log('🔄 DEBUG: Looking for any workflows for this client (any status)');
        const clientWorkflows = allWorkflows.filter((w: any) => {
          const matchesClient = (clientId && (w.clientId === clientId || w.client?.clientId === clientId || w.client?.id === clientId || w.client?._id === clientId)) ||
                               (clientEmail && w.client?.email?.toLowerCase() === clientEmail.toLowerCase());
          return matchesClient;
        });
        
        console.log('🔄 DEBUG: Found workflows for client (any status):', clientWorkflows.length);

        // Log all workflows for this client to show date comparison
        if (clientWorkflows.length > 1) {
          console.log('🔄 DEBUG: Multiple workflows found for client - showing creation dates for comparison:');
          clientWorkflows.forEach((workflow: any, index: number) => {
            console.log(`  Workflow ${index + 1}: ID=${workflow.id || workflow._id}, createdAt=${workflow.createdAt}, updatedAt=${workflow.updatedAt}, status=${workflow.status}`);
          });
          console.log('🔄 DEBUG: Will select the OLDEST (first created) workflow to get original client data');
        }

        if (clientWorkflows.length > 0) {
          // Sort by createdAt in ascending order to get the OLDEST (first created) workflow data
          // This ensures we load the initial/original client data, not the most recently updated one
          matchingWorkflow = clientWorkflows.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          })[0];
          console.log('✅ DEBUG: Selected oldest (first created) workflow:', {
            workflowId: matchingWorkflow.id || matchingWorkflow._id,
            createdAt: matchingWorkflow.createdAt,
            updatedAt: matchingWorkflow.updatedAt,
            status: matchingWorkflow.status,
            reason: 'Loading first created data as it contains original client information'
          });
        }
      }

      if (matchingWorkflow) {
        // Extract the workflow ID to use with getWorkflowProgress
        // Try multiple field names as different APIs might return different structures
        const workflowId = matchingWorkflow.workflowId || 
                          matchingWorkflow.id || 
                          matchingWorkflow._id ||
                          matchingWorkflow.workflow_id;
        
        if (!workflowId) {
          console.error('❌ DEBUG: No valid workflow ID found in matching workflow:', {
            matchingWorkflow: matchingWorkflow,
            availableKeys: Object.keys(matchingWorkflow)
          });
          toast.error('Invalid workflow data found - missing workflow ID');
          return false;
        }
        
        console.log('✅ DEBUG: Found workflow, now fetching detailed data using getWorkflowProgress:', {
          workflowId: workflowId,
          originalWorkflowData: {
            workflowId: matchingWorkflow.workflowId,
            id: matchingWorkflow.id,
            _id: matchingWorkflow._id,
            workflow_id: matchingWorkflow.workflow_id
          },
          clientName: matchingWorkflow.client?.name || `${matchingWorkflow.client?.firstName} ${matchingWorkflow.client?.lastName}`.trim(),
          clientEmail: matchingWorkflow.client?.email,
          status: matchingWorkflow.status
        });

        try {
          // Use getWorkflowProgress to get the complete workflow data
          console.log('🔄 DEBUG: ========== FETCHING DETAILED WORKFLOW DATA ==========');
          console.log('🔄 DEBUG: Calling getWorkflowProgress with ID:', workflowId);
          const detailedWorkflowData = await getWorkflowProgress(workflowId);
          
          console.log('✅ DEBUG: ========== DETAILED WORKFLOW DATA RECEIVED ==========');
          console.log('✅ DEBUG: Raw response structure:', {
            dataType: typeof detailedWorkflowData,
            isObject: typeof detailedWorkflowData === 'object',
            hasData: !!detailedWorkflowData,
            responseKeys: detailedWorkflowData ? Object.keys(detailedWorkflowData) : []
          });

          // Log comprehensive workflow data from DB
          if (detailedWorkflowData) {
            console.log('✅ DEBUG: ========== COMPLETE WORKFLOW FROM DATABASE ==========');
            console.log('✅ DEBUG: Workflow Metadata:', {
              _id: detailedWorkflowData._id,
              workflowId: detailedWorkflowData.workflowId,
              createdBy: detailedWorkflowData.createdBy,
              currentStep: detailedWorkflowData.currentStep,
              status: detailedWorkflowData.status,
              workflowType: detailedWorkflowData.workflowType,
              createdAt: detailedWorkflowData.createdAt,
              updatedAt: detailedWorkflowData.updatedAt
            });

            console.log('✅ DEBUG: Client Data from DB:', {
              hasClient: !!detailedWorkflowData.client,
              clientData: detailedWorkflowData.client || 'No client data',
              clientKeys: detailedWorkflowData.client ? Object.keys(detailedWorkflowData.client) : []
            });

            console.log('✅ DEBUG: Client Credentials from DB:', {
              hasClientCredentials: !!detailedWorkflowData.clientCredentials,
              clientCredentials: detailedWorkflowData.clientCredentials || 'No client credentials',
              credentialsKeys: detailedWorkflowData.clientCredentials ? Object.keys(detailedWorkflowData.clientCredentials) : []
            });

            console.log('✅ DEBUG: Case Data from DB:', {
              hasCase: !!detailedWorkflowData.case,
              caseData: detailedWorkflowData.case || 'No case data',
              caseKeys: detailedWorkflowData.case ? Object.keys(detailedWorkflowData.case) : []
            });

            console.log('✅ DEBUG: Selected Forms from DB:', {
              hasSelectedForms: !!(detailedWorkflowData.selectedForms && detailedWorkflowData.selectedForms.length > 0),
              selectedFormsCount: detailedWorkflowData.selectedForms ? detailedWorkflowData.selectedForms.length : 0,
              selectedForms: detailedWorkflowData.selectedForms || 'No selected forms'
            });

            console.log('✅ DEBUG: Form Templates from DB:', {
              hasFormTemplates: !!(detailedWorkflowData.formTemplates && detailedWorkflowData.formTemplates.length > 0),
              formTemplatesCount: detailedWorkflowData.formTemplates ? detailedWorkflowData.formTemplates.length : 0,
              formTemplates: detailedWorkflowData.formTemplates || 'No form templates'
            });

            console.log('✅ DEBUG: Form Case IDs from DB:', {
              hasFormCaseIds: !!detailedWorkflowData.formCaseIds,
              formCaseIds: detailedWorkflowData.formCaseIds || 'No form case IDs',
              formCaseIdsKeys: detailedWorkflowData.formCaseIds ? Object.keys(detailedWorkflowData.formCaseIds) : []
            });

            console.log('✅ DEBUG: ========== QUESTIONNAIRE DATA FROM DATABASE ==========');
            console.log('✅ DEBUG: Selected Questionnaire:', {
              hasSelectedQuestionnaire: !!detailedWorkflowData.selectedQuestionnaire,
              selectedQuestionnaire: detailedWorkflowData.selectedQuestionnaire || 'No selected questionnaire'
            });

            console.log('✅ DEBUG: Available Questionnaires Summary:', {
              hasAvailableQuestionnairesSummary: !!(detailedWorkflowData.availableQuestionnairesSummary && detailedWorkflowData.availableQuestionnairesSummary.length > 0),
              availableQuestionnairesCount: detailedWorkflowData.availableQuestionnairesSummary ? detailedWorkflowData.availableQuestionnairesSummary.length : 0,
              availableQuestionnairesSummary: detailedWorkflowData.availableQuestionnairesSummary || 'No available questionnaires summary'
            });

            console.log('✅ DEBUG: Questionnaire Assignment from DB:', {
              hasQuestionnaireAssignment: !!detailedWorkflowData.questionnaireAssignment,
              questionnaireAssignment: detailedWorkflowData.questionnaireAssignment || 'No questionnaire assignment',
              assignmentKeys: detailedWorkflowData.questionnaireAssignment ? Object.keys(detailedWorkflowData.questionnaireAssignment) : []
            });

            console.log('✅ DEBUG: ========== QUESTIONNAIRE RESPONSES FROM DATABASE ==========');
            console.log('✅ DEBUG: Responses Object:', {
              hasResponses: !!detailedWorkflowData.responses,
              responsesType: typeof detailedWorkflowData.responses,
              responsesIsObject: typeof detailedWorkflowData.responses === 'object',
              responsesKeys: detailedWorkflowData.responses ? Object.keys(detailedWorkflowData.responses) : [],
              responsesCount: detailedWorkflowData.responses ? Object.keys(detailedWorkflowData.responses).length : 0,
              rawResponses: detailedWorkflowData.responses || 'No responses'
            });

            if (detailedWorkflowData.responses) {
              console.log('✅ DEBUG: Individual Response Fields:', {
                responseFields: Object.entries(detailedWorkflowData.responses).map(([key, value]) => ({
                  fieldKey: key,
                  fieldValue: value,
                  valueType: typeof value
                }))
              });
            }

            console.log('✅ DEBUG: Steps Progress from DB:', {
              hasStepsProgress: !!(detailedWorkflowData.stepsProgress && detailedWorkflowData.stepsProgress.length > 0),
              stepsProgressCount: detailedWorkflowData.stepsProgress ? detailedWorkflowData.stepsProgress.length : 0,
              stepsProgress: detailedWorkflowData.stepsProgress || 'No steps progress'
            });

            console.log('✅ DEBUG: ========== COMPLETE WORKFLOW OBJECT ==========');
            console.log('✅ DEBUG: Full workflow object from database:', detailedWorkflowData);
          }

          // Check if the response has the expected structure
          if (!detailedWorkflowData || typeof detailedWorkflowData !== 'object') {
            console.warn('⚠️ DEBUG: getWorkflowProgress returned invalid data:', detailedWorkflowData);
            throw new Error('Invalid workflow data structure returned from API');
          }

          console.log('🔄 DEBUG: Auto-filling workflow data from getWorkflowProgress');
          await autoFillFromSavedWorkflow(detailedWorkflowData);
          
          // Also check for and load previous questionnaire responses
          console.log('🔄 DEBUG: Checking for previous questionnaire responses in workflow');
          await loadPreviousQuestionnaireFromWorkflow(detailedWorkflowData);
          
          const clientName = detailedWorkflowData.client?.name || 
                           `${detailedWorkflowData.client?.firstName} ${detailedWorkflowData.client?.lastName}`.trim() || 
                           matchingWorkflow.client?.name || 
                           `${matchingWorkflow.client?.firstName} ${matchingWorkflow.client?.lastName}`.trim() || 
                           'client';
          
          toast.success(`Complete workflow data loaded for ${clientName}`);
          return true;
          
        } catch (progressError: any) {
          console.error('❌ DEBUG: Failed to get detailed workflow progress:', {
            error: progressError,
            errorMessage: progressError.message,
            errorStatus: progressError.response?.status,
            errorData: progressError.response?.data,
            workflowId: workflowId
          });
          
          // Fallback to using the basic workflow data if getWorkflowProgress fails
          console.log('🔄 DEBUG: Falling back to basic workflow data from matching workflow');
          console.log('🔄 DEBUG: Basic workflow data structure:', {
            hasClient: !!matchingWorkflow.client,
            hasCase: !!matchingWorkflow.case,
            hasSelectedForms: !!(matchingWorkflow.selectedForms && matchingWorkflow.selectedForms.length > 0),
            hasQuestionnaire: !!matchingWorkflow.selectedQuestionnaire,
            allKeys: Object.keys(matchingWorkflow)
          });
          
          await autoFillFromSavedWorkflow(matchingWorkflow);
          
          // Also check for and load previous questionnaire responses from fallback data
          console.log('🔄 DEBUG: Checking for previous questionnaire responses in fallback workflow data');
          await loadPreviousQuestionnaireFromWorkflow(matchingWorkflow);
          
          const clientName = matchingWorkflow.client?.name || `${matchingWorkflow.client?.firstName} ${matchingWorkflow.client?.lastName}`.trim() || 'client';
          toast.success(`Basic workflow data loaded for ${clientName} (API error: ${progressError.message})`);
          return true;
        }
      } else {
        console.log('⚠️ DEBUG: No matching workflow found after all attempts');
        toast('No matching workflow found for this client');
        return false;
      }

    } catch (error) {
      console.error('❌ DEBUG: Auto-fill error:', error);
      toast.error('Error during auto-fill: ' + (error as Error).message);
      return false;
    }
  };

  // Function to save all workflow progress before questionnaire assignment
  const saveWorkflowProgressLocal = async () => {
    try {
      // DEBUG: Log the current client address state before saving
      console.log('🔍 DEBUG: Client address before saving:', {
        fullAddress: client.address,
        aptNumber: client.address?.aptNumber,
        aptSuiteFlr: client.address?.aptSuiteFlr,
        street: client.address?.street,
        city: client.address?.city,
        state: client.address?.state,
        zipCode: client.address?.zipCode
      });

      // Prepare comprehensive workflow data
      const workflowData: {
        workflowId: string;
        createdAt: string;
        updatedAt: string;
        currentStep: number;
        status: string;
        client: any;
        case: any;
        selectedForms: string[];
        formCaseIds: Record<string, string>;
        formTemplates: FormTemplate[];
        selectedQuestionnaire: string;
        availableQuestionnairesSummary: any[];
        clientCredentials: any;
        stepsProgress: any[];
        questionnaireAssignment?: any;
      } = {
        // Workflow metadata
        workflowId: `workflow_${Date.now()}`,
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
          // Explicitly include client ID fields
          clientId: client.clientId || client._id || client.clientId, // MongoDB ObjectId reference
          // Explicitly include immigration-specific identifiers
          alienRegistrationNumber: client.alienRegistrationNumber || '',
          uscisOnlineAccountNumber: client.uscisOnlineAccountNumber || '',
          socialSecurityNumber: client.socialSecurityNumber || '',
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
            country: client.address?.country || ''
          },
          // Remove sensitive data from storage
          password: undefined,
          temporaryPassword: clientCredentials.createAccount ? clientCredentials.password : undefined
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
        formTemplates: formTemplates.filter(template => selectedForms.includes(template.formNumber)),

        // Questionnaire selection
        selectedQuestionnaire,
        availableQuestionnairesSummary: availableQuestionnaires.map(q => ({
          id: q._id || q.id,
          title: q.title || q.name,
          category: q.category,
          fieldsCount: (q.fields || q.questions || []).length
        })),

        // Client credentials info (without password)
        clientCredentials: {
          email: clientCredentials.email || client.email,
          createAccount: clientCredentials.createAccount,
          // Don't store actual password
          hasPassword: !!clientCredentials.password
        },

        // Workflow steps progress
        stepsProgress: NEW_WORKFLOW_STEPS.map((step, index) => ({
          ...step,
          index,
          status: index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending',
          completedAt: index < currentStep ? new Date().toISOString() : undefined
        }))
      };

      // Add questionnaire assignment if using existing response
      if (useExistingResponse && selectedExistingResponse) {
        console.log('🔄 DEBUG: Adding questionnaire assignment with previous response to workflow data:', {
          selectedExistingResponse,
          hasExistingResponses: existingQuestionnaireResponses.length > 0
        });

        // Find the selected existing response
        const existingResponse = existingQuestionnaireResponses.find(r => r.id === selectedExistingResponse);
        if (existingResponse) {
          workflowData.questionnaireAssignment = {
            id: `assignment_${Date.now()}`,
            caseId: caseData.id || caseData._id,
            clientId: client.clientId || client._id,
            questionnaireId: existingResponse.questionnaireId,
            questionnaireName: existingResponse.questionnaireTitle,
            status: 'completed',
            assignedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            responses: existingResponse.responses || {},
            // Metadata about reused response
            reuseMetadata: {
              originalResponseId: existingResponse.id,
              originalCaseId: existingResponse.caseId,
              originalSubmittedAt: existingResponse.submittedAt,
              reusedAt: new Date().toISOString(),
              newCaseId: caseData.id || caseData._id,
              newFormSelection: selectedForms
            },
            // Include form and case context
            formCaseIds: formCaseIds,
            selectedForms: selectedForms
          };

          console.log('✅ DEBUG: Questionnaire assignment added with response data:', {
            assignmentId: workflowData.questionnaireAssignment.id,
            responseCount: Object.keys(existingResponse.responses || {}).length,
            questionnaireTitle: existingResponse.questionnaireTitle,
            originalCaseId: existingResponse.caseId,
            newCaseId: caseData.id || caseData._id
          });
        } else {
          console.warn('⚠️ DEBUG: Selected existing response not found in available responses');
        }
      } else {
        console.log('🔍 DEBUG: Not using existing response - no questionnaire assignment added to workflow data:', {
          useExistingResponse,
          selectedExistingResponse,
          willAddQuestionnaireAssignment: false
        });
      }



      // Check if we should save to API
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Validate required fields before saving
          const missingFields = [];
          if (!client.firstName?.trim()) missingFields.push('First Name');
          if (!client.lastName?.trim()) missingFields.push('Last Name');
          if (!client.email?.trim()) missingFields.push('Email');
          if (!client.address?.street?.trim()) missingFields.push('Street Address');
          if (!client.address?.city?.trim()) missingFields.push('City');
          if (!client.address?.state?.trim()) missingFields.push('State/Province');
          if (!client.address?.zipCode?.trim()) missingFields.push('ZIP/Postal Code');
          if (!client.address?.country?.trim()) missingFields.push('Country');

          if (missingFields.length > 0) {
            const errorMessage = `Please fill in the following required fields: ${missingFields.join(', ')}`;
            console.error('❌ DEBUG: Validation failed - missing required fields:', missingFields);
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }

          // DEBUG: Log the address data being sent to API
          console.log('🔍 DEBUG: Address data being sent to API:', {
            clientAddress: workflowData.client.address,
            aptNumber: workflowData.client.address?.aptNumber,
            aptSuiteFlr: workflowData.client.address?.aptSuiteFlr,
            fullWorkflowData: JSON.stringify(workflowData.client.address, null, 2)
          });

          // Save to API only
          const response = await saveWorkflowProgress(workflowData);


          // Store the workflow ID from API response
          if (response?.workflowId) {
            workflowData.workflowId = response.workflowId;
          }

          // DEBUG: Log successful save response
          console.log('✅ DEBUG: Workflow saved successfully to API:', {
            workflowId: response?.workflowId,
            savedAptNumber: response?.client?.address?.aptNumber,
            responseKeys: Object.keys(response || {}),
            fullResponse: response
          });

          // Workflow progress saved to server

        } catch (apiError: any) {


          // Check if it's a 404 (endpoint doesn't exist)
          if (apiError.response?.status === 404) {

            toast.error('Workflow save endpoint not available', { duration: 3000 });
          } else {
            toast.error('Failed to save workflow progress to server', { duration: 3000 });
          }
          throw apiError; // Re-throw error since we're not saving locally anymore
        }
      } else {

        toast.error('Authentication required to save workflow');
        throw new Error('No authentication token available');
      }

      return workflowData;

    } catch (error) {

      toast.error('Failed to save workflow progress');
      throw error;
    }
  };

  // Function to save existing client filled details separately in the database
  const saveExistingClientDetailsToDatabase = async (existingResponse: any, currentClient: any, currentCase: any) => {
    try {
      console.log('🔄 DEBUG: Saving existing client filled details separately to database:', {
        existingResponseId: existingResponse.id,
        clientId: currentClient.id,
        newCaseId: currentCase.id || currentCase._id,
        responseCount: Object.keys(existingResponse.responses || {}).length
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Extract client information from the existing response
      const clientDetailsFromResponse = {
        // Basic client info
        clientId: currentClient.id || currentClient._id,
        clientName: currentClient.name,
        clientEmail: currentClient.email,
        
        // Response metadata
        originalResponseId: existingResponse.id,
        originalCaseId: existingResponse.caseId,
        originalQuestionnaireTitle: existingResponse.questionnaireTitle,
        originalSubmittedAt: existingResponse.submittedAt,
        
        // New case context
        newCaseId: currentCase.id || currentCase._id,
        newCaseTitle: currentCase.title || 'Untitled Case',
        newSelectedForms: selectedForms,
        
        // Filled details from responses
        filledDetails: existingResponse.responses || {},
        
        // Metadata
        reuseTimestamp: new Date().toISOString(),
        questionnaireId: existingResponse.questionnaireId,
        totalAnswers: Object.keys(existingResponse.responses || {}).length,
        
        // Attorney information
        attorneyId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : null,
        companyId: localStorage.getItem('companyId')
      };

      // Import the api utility
      const { default: api } = await import('../utils/api');

      // Try to save to multiple possible endpoints
      const saveEndpoints = [
        '/api/v1/client-response-reuse',
        '/api/client-response-reuse',
        '/client-response-reuse',
        '/api/v1/existing-client-details',
        '/api/existing-client-details'
      ];

      let saveSuccess = false;
      let lastError = null;

      for (const endpoint of saveEndpoints) {
        try {
          console.log(`🔄 DEBUG: Attempting to save client details to endpoint: ${endpoint}`);
          
          const response = await api.post(endpoint, clientDetailsFromResponse, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log(`✅ DEBUG: Successfully saved client details to ${endpoint}:`, response.data);
          saveSuccess = true;
          
          toast.success(
            <div>
              <p>✅ Client details saved separately to database</p>
              <p className="text-sm mt-1">📊 {clientDetailsFromResponse.totalAnswers} responses archived</p>
              <p className="text-xs text-green-600">🔗 Linked to new case: {currentCase.title || 'Untitled Case'}</p>
            </div>,
            { duration: 6000 }
          );
          
          break;
        } catch (endpointError: any) {
          console.log(`⚠️ DEBUG: Endpoint ${endpoint} failed:`, endpointError.message);
          lastError = endpointError;
        }
      }

      if (!saveSuccess) {
        console.error('❌ DEBUG: All endpoints failed to save client details:', lastError);
        toast.error(
          <div>
            <p>⚠️ Client details could not be saved separately</p>
            <p className="text-sm mt-1">Response will still be reused for the workflow</p>
          </div>,
          { duration: 5000 }
        );
      }

    } catch (error: any) {
      console.error('❌ ERROR: Failed to save existing client details to database:', error);
      toast.error(
        <div>
          <p>⚠️ Could not save client details separately</p>
          <p className="text-sm mt-1">Response will still be reused for the workflow</p>
        </div>,
        { duration: 5000 }
      );
    }
  };

  const handleQuestionnaireAssignment = async (questionnaireIdOverride?: string) => {
    // Use override when provided (avoids waiting on React state updates)
    const effectiveQuestionnaire = questionnaireIdOverride ?? selectedQuestionnaire;

  
    if (!effectiveQuestionnaire) {
      console.log('🚫 DEBUG: No selected/effective questionnaire - returning early');
      return;
    }

    // Check if using existing response
    if (useExistingResponse && selectedExistingResponse) {
      console.log('🔄 DEBUG: Processing existing response selection for workflow save:', {
        selectedExistingResponse,
        useExistingResponse,
        clientId: client.clientId,
        clientName: client.name,
        newCaseId: caseData.id || caseData._id,
        selectedForms
      });

      try {
        setLoading(true);

        // Generate a consistent case ID that will be used across all collections
        const consistentCaseId = caseData.id || caseData._id || generateObjectId();
        
        // Ensure the caseData has the consistent ID
        setCaseData(prev => ({
          ...prev,
          caseId: consistentCaseId,
          id: consistentCaseId,
          _id: consistentCaseId
        }));

        // Find the selected existing response
        const existingResponse = existingQuestionnaireResponses.find(r => r.id === selectedExistingResponse);
        if (!existingResponse) {
          toast.error('Selected response not found.');
          setLoading(false);
          return;
        }

        console.log('✅ DEBUG: Found existing response to reuse:', {
          responseId: existingResponse.id,
          questionnaireTitle: existingResponse.questionnaireTitle,
          originalCaseId: existingResponse.caseId,
          responseCount: Object.keys(existingResponse.responses || {}).length
        });

        // Save the existing client filled details separately in the database
        await saveExistingClientDetailsToDatabase(existingResponse, client, caseData);

        // Save the existing response data to client responses for the UI
        setClientResponses(existingResponse.responses || {});

        // Create comprehensive workflow data with existing response
        const workflowDataWithExistingResponse = {
          // Workflow metadata
          workflowId: `workflow_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentStep,
          status: 'in-progress',
          
          // Top-level client ID for database queries
          clientId: client.clientId || client._id,
          
          // Client information
          client: {
            ...client,
            clientId: client.clientId || client._id, // Ensure client object has ID
            firstName: client.firstName,
            middleName: client.middleName || '',
            lastName: client.lastName,
            name: client.name,
            // Include immigration-specific identifiers
            alienRegistrationNumber: client.alienRegistrationNumber || '',
            uscisOnlineAccountNumber: client.uscisOnlineAccountNumber || '',
            socialSecurityNumber: client.socialSecurityNumber || '',
            address: {
              street: client.address?.street || '',
              aptSuiteFlr: client.address?.aptSuiteFlr || '',
              aptNumber: client.address?.aptNumber || '',
              city: client.address?.city || '',
              state: client.address?.state || '',
              zipCode: client.address?.zipCode || '',
              province: client.address?.province || '',
              postalCode: client.address?.postalCode || '',
              country: client.address?.country || ''
            }
          },

          // Case details (NEW CASE)
          case: {
            ...caseData,
            caseId: consistentCaseId,
            id: consistentCaseId,
            _id: consistentCaseId,
            clientId: client.clientId || client._id || client.email // Link case to client with proper client ID
          },

          // Selected forms and case IDs (NEW FORMS)
          selectedForms,
          formCaseIds,
          formTemplates: formTemplates.filter(template => selectedForms.includes(template.formNumber)),

          // Questionnaire information
          // Use the effectiveQuestionnaire (may be provided by override) to avoid race with React state
          selectedQuestionnaire: effectiveQuestionnaire,
          
          // EXISTING RESPONSE DATA - This is the key addition
          questionnaireAssignment: {
            id: `assignment_${Date.now()}`,
            caseId: consistentCaseId,
            clientId: client.clientId || client._id,
            questionnaireId: existingResponse.questionnaireId,
            questionnaireName: existingResponse.questionnaireTitle,
            status: 'completed',
            assignedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            responses: existingResponse.responses,
            // Metadata about reused response
            reuseMetadata: {
              originalResponseId: existingResponse.id,
              originalCaseId: existingResponse.caseId,
              originalSubmittedAt: existingResponse.submittedAt,
              reusedAt: new Date().toISOString(),
              newCaseId: consistentCaseId,
              newFormSelection: selectedForms
            },
            // Include new case and form information
            formCaseIds: formCaseIds,
            selectedForms: selectedForms
          },

          // Client credentials info
          clientCredentials: {
            email: clientCredentials.email || client.email,
            createAccount: clientCredentials.createAccount,
            hasPassword: !!clientCredentials.password
          },

          // Workflow steps progress
          stepsProgress: NEW_WORKFLOW_STEPS.map((step, index) => ({
            ...step,
            index,
            status: index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending',
            completedAt: index < currentStep ? new Date().toISOString() : undefined
          }))
        };

        

        // Log the complete data structure being sent (truncated for readability)
     
        // Save the comprehensive workflow data to the database
        const token = localStorage.getItem('token');
        if (token) {
          // Validate required fields before API call
          const validationErrors = [];
          if (!workflowDataWithExistingResponse.workflowId) validationErrors.push('Missing workflowId');
          if (!workflowDataWithExistingResponse.client) validationErrors.push('Missing client data');
          if (!workflowDataWithExistingResponse.case) validationErrors.push('Missing case data');
          if (!workflowDataWithExistingResponse.status) validationErrors.push('Missing status');
          
          if (validationErrors.length > 0) {
            console.error('❌ DEBUG: Validation errors before API call:', validationErrors);
            toast.error(
              <div>
                <p>❌ Data validation failed</p>
                <p className="text-sm mt-1">Errors: {validationErrors.join(', ')}</p>
              </div>,
              { duration: 8000 }
            );
            setLoading(false);
            return;
          }

          try {
            console.log('🔄 DEBUG: Calling saveWorkflowProgress with token present');
            
            // Validate required fields before saving - less strict for existing responses
            const missingFields = [];
            if (!client.firstName?.trim()) missingFields.push('First Name');
            if (!client.lastName?.trim()) missingFields.push('Last Name');
            if (!client.email?.trim()) missingFields.push('Email');
            
            // For existing responses, only require basic address info, not all fields
            if (!client.address?.city?.trim()) missingFields.push('City');
            if (!client.address?.country?.trim()) missingFields.push('Country');

            if (missingFields.length > 0) {
              const errorMessage = `Please fill in the following required fields: ${missingFields.join(', ')}`;
              console.error('❌ DEBUG: Validation failed - missing required fields:', missingFields);
              toast.error(errorMessage);
              setLoading(false);
              return;
            }
            
            console.log('✅ DEBUG: Validation passed for existing response workflow - proceeding to save...');
            
            // Test API connectivity before the actual call
            console.log('🔄 DEBUG: Testing API connectivity...');
            const { default: api } = await import('../utils/api');
            
            // Simple connectivity test
            try {
              const testResponse = await api.get('/api/v1/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              console.log('✅ DEBUG: API connectivity test passed:', testResponse.status);
            } catch (connectivityError: any) {
              console.warn('⚠️ DEBUG: API connectivity test failed:', {
                status: connectivityError?.response?.status,
                message: connectivityError?.message
              });
            }
            
            let response = await saveWorkflowProgress(workflowDataWithExistingResponse);
            
            // Alternative direct API call for testing
            if (!response || !response.success) {
              console.log('🔄 DEBUG: Trying direct API call as fallback...');
              try {
                const directResponse = await api.post('/api/v1/workflows/progress', workflowDataWithExistingResponse, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                console.log('✅ DEBUG: Direct API call succeeded:', directResponse.data);
                response = directResponse.data;
              } catch (directError: any) {
                console.error('❌ DEBUG: Direct API call also failed:', {
                  status: directError?.response?.status,
                  data: directError?.response?.data,
                  message: directError?.message
                });
              }
            }
            console.log('✅ DEBUG: Workflow with existing response saved to database:', {
              success: response?.success,
              dataId: response?.data?.id || response?.data?._id,
              message: response?.message,
              fullResponse: response
            });
            
            // ✅ CREATE ENHANCED CASE WITH DEDICATED API ENDPOINT (for existing response path)
            let enhancedCaseData: EnhancedCaseData | undefined;
            try {
              console.log('🔄 Creating enhanced case for existing response workflow...');
              console.log('🔍 DEBUG: Client data for enhanced case:', {
                clientId: client.clientId,
                clientInternalId: client._id,
                clientEmail: client.email,
                clientName: client.name,
                finalClientId: client.clientId || client._id || '',
                hasClientId: !!(client.clientId),
                hasInternalId: !!(client._id)
              });
              
              // Get current user for assignedTo field
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              const assignedToId = currentUser._id || currentUser.id;
              
              // Prepare enhanced case data for existing response path
              // const enhancedCaseData: EnhancedCaseData = {
              //   // Required fields
              //   type: caseData.category || 'Family-Based',
              //   clientId: client.clientId || client._id || '',
                
              //   // Enhanced fields
              //   title: caseData.title || `${client.name} - ${caseData.category || 'Immigration'} Case (Existing Response)`,
              //   description: caseData.description || `${caseData.category || 'Immigration'} case for ${client.name} using existing questionnaire response`,
              //   category: caseData.category || 'family-based',
              //   subcategory: caseData.subcategory || 'adjustment-of-status',
              //   priority: (caseData.priority?.charAt(0).toUpperCase() + caseData.priority?.slice(1)) as 'Low' | 'Medium' | 'High' | 'Urgent' || 'Medium',
              //   dueDate: caseData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
              //   assignedTo: assignedToId,
                
              //   // Form management
              //   assignedForms: selectedForms || [],
              //   formCaseIds: formCaseIds || {},
              //   questionnaires: [existingResponse.questionnaireId],
                
              //   // Optional fields
              //   status: 'in-progress', // Mark as in-progress since responses already exist
              //   startDate: new Date().toISOString(),
              //   expectedClosureDate: caseData.expectedClosureDate,
              //   notes: `Case created with existing questionnaire response. Original response from: ${existingResponse.questionnaireTitle}. Original case: ${existingResponse.caseId}`
              // };

              // const caseResponse = await createEnhancedCase(enhancedCaseData);
              
              // if (caseResponse && caseResponse.data) {
              //   console.log('✅ Enhanced case created for existing response:', {
              //     caseId: caseResponse.data.case?._id || caseResponse.data._id,
              //     success: caseResponse.data.success,
              //     message: caseResponse.data.message
              //   });
                
              //   // Update local case data with the newly created case information
              //   const createdCase = caseResponse.data.case || caseResponse.data;
              //   if (createdCase._id) {
              //     setCaseData(prev => ({
              //       ...prev,
              //       id: createdCase._id,
              //       _id: createdCase._id,
              //       ...createdCase
              //     }));
              //   }
                
              //   toast.success(
              //     <div>
              //       <p>✅ Enhanced case created with existing response!</p>
              //       <p className="text-sm mt-1">📋 Case ID: {createdCase._id}</p>
              //       <p className="text-sm">📁 Reused response: {existingResponse.questionnaireTitle}</p>
              //       <p className="text-xs text-green-600">💾 Saved separately in cases collection</p>
              //     </div>,
              //     { duration: 6000 }
              //   );
              // }
              
            } catch (caseError: any) {
              console.error('❌ Error creating enhanced case for existing response:', {
                error: caseError.message,
                status: caseError.response?.status,
                data: caseError.response?.data,
                stack: caseError.stack,
                clientId: client.clientId || client._id,
                hasClientId: !!(client.clientId || client._id),
                enhancedCaseDataSnapshot: {
                  clientId: enhancedCaseData?.clientId || workflowDataWithExistingResponse?.clientId || client.clientId || client.id || client._id,
                  type: enhancedCaseData?.type,
                  title: enhancedCaseData?.title
                }
              });
              
              // Check if it's a network or server error
              if (caseError.response?.status >= 500) {
                console.error('🚨 SERVER ERROR: Backend may not be saving to ims_cases collection');
              } else if (caseError.response?.status >= 400) {
                console.error('🚨 CLIENT ERROR: Request data may be invalid');
              }
              
              // Don't fail the entire workflow, just log the case creation error
              toast.error(
                <div>
                  <p>⚠️ Case creation failed but workflow saved</p>
                  <p className="text-sm mt-1">Existing response workflow is still active</p>
                  <p className="text-xs text-gray-600">Error: {caseError.message}</p>
                  <p className="text-xs text-red-600">Status: {caseError.response?.status || 'Network Error'}</p>
                </div>,
                { duration: 8000 }
              );
            }
            
            toast.success(
              <div>
                <p>✅ Previous response selected and saved for client {client.name}</p>
                <p className="text-sm mt-1">📋 Response: {existingResponse.questionnaireTitle}</p>
                <p className="text-sm text-green-600">📁 New case: {caseData.title || 'Untitled Case'}</p>
                <p className="text-xs text-blue-600">💾 Workflow saved to database with existing response data</p>
              </div>,
              { duration: 8000 }
            );

            // Set the questionnaire assignment for the UI
            const assignment: QuestionnaireAssignment = {
              id: workflowDataWithExistingResponse.questionnaireAssignment.id,
              caseId: consistentCaseId,
              clientId: client.clientId || client._id || '',
              questionnaireId: existingResponse.questionnaireId,
              questionnaireName: existingResponse.questionnaireTitle,
              status: 'completed',
              assignedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              responses: existingResponse.responses,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              notes: `Reused response from previous case. Original case: ${existingResponse.caseId}`,
              clientEmail: client.email,
              formCaseIds: formCaseIds,
              selectedForms: selectedForms
            };

            setQuestionnaireAssignment(assignment);

            // Move to initial screen after successful assignment
            
            // Reset workflow state for new client creation
            setCurrentStep(0);
            setClient({
              id: '',
              name: '',
              firstName: '',
              middleName: '',
              lastName: '',
              email: '',
              phone: '',
              address: {
                street: '',
                aptSuiteFlr: '',
                aptNumber: '',
                city: '',
                state: '',
                zipCode: '',
                province: '',
                postalCode: '',
                country: '',
              },
              dateOfBirth: '',
              nationality: '',
              // Immigration-specific fields
              alienRegistrationNumber: '',
              uscisOnlineAccountNumber: '',
              socialSecurityNumber: '',
              status: 'active',
              createdAt: ''
            });
            setCaseData({
              id: '',
              clientId: '',
              title: '',
              description: '',
              category: '',
              subcategory: '',
              type: 'Family-Based',
              status: 'draft',
              priority: 'medium',
              assignedForms: [],
              questionnaires: [],
              createdAt: '',
              dueDate: '',
              startDate: '',
              expectedClosureDate: '',
              assignedAttorney: '',
              formCaseIds: {}
            });
            setSelectedForms([]);
            setFormCaseIds({});
            setSelectedQuestionnaire('');
            setClientCredentials({
              email: '',
              password: '',
              createAccount: false
            });
            
            // Show success message for new client creation completion
            toast.success(
              <div>
                <p>🎉 <strong>New Client Successfully Created!</strong></p>
                <p className="text-sm mt-1">✅ Client: {client.name}</p>
                <p className="text-sm">✅ Case: {caseData.title || 'Untitled Case'}</p>
                <p className="text-sm">✅ Questionnaire: {assignment.questionnaireName}</p>
                <p className="text-xs text-green-600 mt-2">Ready to create another client or process existing clients.</p>
              </div>,
              { duration: 10000 }
            );
            
          } catch (apiError: any) {
            console.error('❌ DEBUG: Failed to save workflow with existing response:', {
              error: apiError,
              message: apiError?.message,
              status: apiError?.response?.status,
              statusText: apiError?.response?.statusText,
              data: apiError?.response?.data,
              config: {
                url: apiError?.config?.url,
                method: apiError?.config?.method,
                headers: apiError?.config?.headers
              }
            });
            
            // Show detailed error to user
            const errorMessage = apiError?.response?.data?.message || 
                               apiError?.response?.data?.error || 
                               apiError?.message || 
                               'Unknown error occurred';
            
            toast.error(
              <div>
                <p>❌ Failed to save workflow to database</p>
                <p className="text-sm mt-1">Error: {errorMessage}</p>
                <p className="text-xs text-gray-600">Check console for detailed error information</p>
              </div>,
              { duration: 10000 }
            );
          }
        } else {
          toast.error('Authentication required to save workflow');
        }

        setLoading(false);
        return;

      } catch (error: any) {
        console.error('❌ DEBUG: Error processing existing response selection:', error);
        toast.error('Failed to process existing response selection. Please try again.');
        setLoading(false);
        return;
      }
    }

    // Original questionnaire assignment logic continues below for new responses
    // For existing clients, skip account creation validation since they already have accounts
    const isExistingClientWithAccount = client.isExistingClient || client.hasUserAccount;
    
    if (!isExistingClientWithAccount) {
      // Only validate account creation requirements for NEW clients
      console.log('🔄 DEBUG: NEW client detected - validating account creation requirements:', {
        clientEmail: client.email,
        createAccount: clientCredentials.createAccount,
        hasPassword: !!clientCredentials.password
      });
      
      if (!clientCredentials.createAccount) {
        toast.error('Client account creation must be enabled to assign questionnaires. Please check "Create Account" option and set a password.');
        return;
      }

      // Ensure password is available for new clients
      if (!clientCredentials.password) {
        toast.error('Password is required for client account creation. Please generate a password first.');
        return;
      }
    } else {
      console.log('✅ DEBUG: EXISTING client detected - COMPLETELY SKIPPING all account creation validation:', {
        clientId: client.clientId,
        clientName: client.name,
        clientEmail: client.email,
        isExistingClient: client.isExistingClient,
        hasUserAccount: client.hasUserAccount,
        skipPasswordValidation: true,
        skipAccountCreationValidation: true
      });
    }

    setLoading(true);

    // Declare assignmentData and clientUserId in outer scope so they're accessible in catch blocks
    let assignmentData: any = null;
    let clientUserId = undefined;

    try {
      // Handle client account creation only for new clients
      if (!isExistingClientWithAccount) {
        console.log('🔄 DEBUG: Processing new client - will create account:', {
          clientEmail: client.email,
          hasPassword: !!clientCredentials.password,
          createAccount: clientCredentials.createAccount
        });
        
        // First, check if we need to create a client account for new clients
        if (clientCredentials.createAccount) {
          if (!clientCredentials.password) {
            toast.error('Password is required for client account creation. Please generate a password in the questionnaire assignment screen.');
            setLoading(false);
            return;
          }

          // Ensure the client object has the password before calling handleClientSubmit
          const clientWithCredentials = {
            ...client,
            password: clientCredentials.password,
            email: clientCredentials.email || client.email
          };

          // Update both state and the direct object reference
          setClient(clientWithCredentials);
          Object.assign(client, clientWithCredentials);
        }

        // Call handleClientSubmit to create the client account for new clients
        const createdUserId = await handleClientSubmit();

        // If client account creation is enabled, use the returned user ID
        if (clientCredentials.createAccount && createdUserId) {
          clientUserId = createdUserId;
        }
      } else {
        // For existing clients, use their existing ID and skip all account creation
        clientUserId = client.clientId || client._id || client.userId;
        console.log('✅ DEBUG: Using existing client ID for questionnaire assignment - NO ACCOUNT CREATION:', {
          clientUserId,
          clientName: client.name,
          clientEmail: client.email,
          isExistingClient: client.isExistingClient,
          hasUserAccount: client.hasUserAccount,
          skipAccountCreation: true
        });
      }
  const selectedQ = availableQuestionnaires.find(q => {
        // Check all possible ID fields
        const possibleIds = [
          q._id,          // MongoDB ObjectId
          q.id,           // Original ID or API ID
          q.originalId,   // Original ID before conversion
          q.name          // Fallback to name if used as ID
        ].filter(Boolean); // Remove undefined/null values

        // For API questionnaires, prioritize matching the q_ prefixed ID
  if (q.apiQuestionnaire && q.id === effectiveQuestionnaire) {

          return true;
        }

        // Check if any of the possible IDs match
  const matches = possibleIds.includes(effectiveQuestionnaire);
        if (matches) {

        }
        return matches;
      });

      if (!selectedQ) {
        toast.error('Could not find selected questionnaire');

        return;
      }

      // Validate that questionnaire has fields/questions
      const normalizedQ = normalizeQuestionnaireStructure(selectedQ);

      // Log the normalized questionnaire for debugging


      // Check for fields/questions in multiple locations
      let fields = normalizedQ.fields || normalizedQ.questions || [];

      // Special handling for API format questionnaires
      if (normalizedQ.id && normalizedQ.id.startsWith('q_') && Array.isArray(normalizedQ.fields)) {

        fields = normalizedQ.fields;
      }

      if (!fields || fields.length === 0) {
        toast.error('This questionnaire has no questions defined. Please select another questionnaire.');
        setLoading(false);
        return;
      }

      // Questionnaire is valid with fields

      // Get questionnaire ID from normalized questionnaire
      const questionnaireId = normalizedQ._id;

      // For API questionnaires (with q_ prefix), we don't validate as MongoDB ObjectId
      const isApiQuestionnaire = normalizedQ.apiQuestionnaire || (questionnaireId && questionnaireId.startsWith('q_'));

      if (!isApiQuestionnaire && !isValidMongoObjectId(questionnaireId)) {

        toast.error(`Cannot assign questionnaire with invalid ID format. Please contact support.`);
        setLoading(false);
        return;
      }

      // Log the ID type for debugging
      if (isApiQuestionnaire) {

      } else {

        // Only validate as MongoDB ObjectId if it's not an API questionnaire
        validateMongoObjectId(questionnaireId, 'questionnaire');
      }

      // If we had to convert the ID, log this for debugging
      if (normalizedQ.originalId) {

      }

      // Use the client ID (which should match the created user account ID)
      let clientId;

      if (clientUserId) {
        // If we have a clientUserId (from account creation), use that as clientId too
        clientId = clientUserId;

      } else {
        // If no user account was created, we should not create a questionnaire assignment
        if (clientCredentials.createAccount) {
          // User wanted account creation but it failed

          toast.error('Cannot create questionnaire assignment because client account creation failed. Please try again.');
          setLoading(false);
          return;
        } else {
          // User explicitly chose not to create account - this should not happen in normal flow

          toast.error('Questionnaire assignments require a client user account. Please enable "Create Account" option.');
          setLoading(false);
          return;
        }
      }






      // Final validation - ensure we have a valid MongoDB ObjectId from user account
      try {
        validateMongoObjectId(clientId, 'client');

      } catch (error) {

        toast.error('Invalid client ID - questionnaire assignment requires a valid user account ID.');
        setLoading(false);
        return;
      }

      // Validate case ID if it exists and ensure it's a valid MongoDB ObjectId
      let caseId = caseData._id || caseData.id;
      if (caseId) {
        // If the case ID isn't a valid ObjectId, convert it
        if (!isValidMongoObjectId(caseId)) {

          // Check if we already have a caseId._id that's valid
          if (caseData._id && isValidMongoObjectId(caseData._id)) {
            caseId = caseData._id;
          } else {
            // Generate a new valid ObjectId
            caseId = generateObjectId();
            // Save it back to the case object for future use
            caseData._id = caseId;
          }
        }
        validateMongoObjectId(caseId, 'case');
      }

      // Define the assignment data with client user information
      assignmentData = {
        questionnaireId,
        questionnaireName: normalizedQ.title || 'Questionnaire',
        clientId, // This should be the user account ID (clientUserId)
        caseId: caseId || undefined,
        status: 'pending',
        assignedAt: new Date().toISOString(),
        dueDate: caseData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days due date
        notes: `Please complete this questionnaire for your ${caseData.category || 'immigration'} case.`,
        clientUserId: clientUserId, // Include the created user account ID
        clientEmail: clientCredentials.email || client.email, // Use provided email or client email
        tempPassword: clientCredentials.createAccount ? clientCredentials.password : undefined, // Include password if account was created
        accountCreated: !!clientUserId, // Track whether user account was successfully created
        formCaseIds: formCaseIds, // Include the generated case IDs for each form
        selectedForms: selectedForms, // Include the selected forms
        // Add form type and generated case ID for backend integration
        formNumber: selectedForms.length > 0 ? selectedForms[0] : undefined, // Use the first selected form as primary form number
        formCaseIdGenerated: selectedForms.length > 0 && formCaseIds[selectedForms[0]] ? formCaseIds[selectedForms[0]] : undefined // Use the case ID for the primary form
      };

      // Debug log the validated data before making the API call
      

      // Check if we have an authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        // No authentication token - require login
        toast.error('You must be logged in to assign questionnaires. Please log in and try again.');
        setLoading(false);
        return;
      }

      // Log the token (first 10 chars for security) to verify it exists


      // Use the controller to check if the API endpoint is available
      const endpointPath = LEGAL_WORKFLOW_ENDPOINTS.GET_QUESTIONNAIRE_ASSIGNMENTS;
      const endpointAvailable = await isApiEndpointAvailable(endpointPath);

      // Log and notify user about API availability

      if (!endpointAvailable) {
        toast.error('API endpoint not available. Cannot assign questionnaire without server connection.');
        setLoading(false);
        return;
      }

      let assignment: QuestionnaireAssignment;

      // Attempt API call since endpoint is available
      try {
        // Add debugging for the request

        // Send directly with fetch for creating the assignment
        const response = await createQuestionnaireAssignment(assignmentData);

        // Handle the response which returns json directly
        const responseId = response?.data?.id || response?.id || `assignment_${Date.now()}`;

        assignment = {
          id: responseId,
          caseId: caseData.id,
          clientId: clientUserId || client.clientId, // Use the user account ID for proper linking
    questionnaireId: effectiveQuestionnaire,
          questionnaireName: selectedQ?.title || selectedQ?.name || 'Questionnaire',
          status: 'pending',
          assignedAt: new Date().toISOString(),
          completedAt: undefined,
          responses: {},
          dueDate: assignmentData.dueDate,
          notes: assignmentData.notes,
          clientEmail: assignmentData.clientEmail,
          clientUserId: assignmentData.clientUserId,
          accountCreated: assignmentData.accountCreated, // Track whether user account was successfully created
          formCaseIds: assignmentData.formCaseIds,
          selectedForms: assignmentData.selectedForms,
          // Add form type and generated case ID for backend integration
          formNumber: assignmentData.formNumber,
          formCaseIdGenerated: assignmentData.formCaseIdGenerated
        };

        // API save succeeded

      } catch (apiError: any) {
        throw apiError; // Re-throw to be caught by the main catch block
      }

      setQuestionnaireAssignment(assignment);

      // Notify the user of success with client account information
      if (clientCredentials.createAccount && clientUserId) {
        toast.success(
          <div>
            <p>✅ Questionnaire "{selectedQ?.title || selectedQ?.name}" assigned to client {client.name}</p>
            <p className="text-sm mt-1">🔐 Client account created:</p>
            <p className="text-xs">Email: {clientCredentials.email || client.email}</p>
            <p className="text-xs">Password: {clientCredentials.password}</p>
          </div>,
          { duration: 8000 }
        );
      } else {
        // Questionnaire assigned to client
      }

      // Save all accumulated workflow data to backend now
      try {
        // Create comprehensive workflow data for new questionnaire assignment (similar to existing response path)
        const workflowDataWithNewAssignment = {
          // Workflow metadata
          workflowId: `workflow_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentStep,
          status: 'in-progress',
          
          // Top-level client ID for database queries - use the newly created client user ID
          clientId: clientUserId || client.id || client._id,
          
          // Client information
          client: {
            ...client,
            id: clientUserId || client.id || client._id, // Use the newly created client user ID
            firstName: client.firstName,
            middleName: client.middleName || '',
            lastName: client.lastName,
            name: client.name,
            // Include immigration-specific identifiers
            alienRegistrationNumber: client.alienRegistrationNumber || '',
            uscisOnlineAccountNumber: client.uscisOnlineAccountNumber || '',
            socialSecurityNumber: client.socialSecurityNumber || '',
            address: {
              street: client.address?.street || '',
              aptSuiteFlr: client.address?.aptSuiteFlr || '',
              aptNumber: client.address?.aptNumber || '',
              city: client.address?.city || '',
              state: client.address?.state || '',
              zipCode: client.address?.zipCode || '',
              province: client.address?.province || '',
              postalCode: client.address?.postalCode || '',
              country: client.address?.country || ''
            }
          },

          // Case details (NEW CASE or EXISTING CASE)
          case: {
            ...caseData,
            id: caseData.id || generateObjectId(),
            _id: caseData._id || caseData.id || generateObjectId(),
            clientId: clientUserId || client.id || client._id // Link case to the newly created client
          },

          // Selected forms and case IDs
          selectedForms,
          formCaseIds,
          formTemplates: formTemplates.filter(template => selectedForms.includes(template.formNumber)),

          // Questionnaire information
          selectedQuestionnaire,
          
          // NEW QUESTIONNAIRE ASSIGNMENT DATA
          questionnaireAssignment: {
            id: assignment.id,
            caseId: assignment.caseId,
            clientId: assignment.clientId,
            questionnaireId: assignment.questionnaireId,
            questionnaireName: assignment.questionnaireName,
            status: 'pending',
            assignedAt: assignment.assignedAt,
            completedAt: assignment.completedAt,
            responses: assignment.responses || {},
            // Metadata about new assignment
            assignmentMetadata: {
              isNewAssignment: true,
              assignedAt: new Date().toISOString(),
              caseId: caseData.id || caseData._id,
              formSelection: selectedForms,
              clientAccountCreated: !!clientUserId,
              tempPassword: clientCredentials.createAccount ? clientCredentials.password : undefined
            },
            // Include case and form information
            formCaseIds: formCaseIds,
            selectedForms: selectedForms
          },

          // Client credentials info
          clientCredentials: {
            email: clientCredentials.email || client.email,
            createAccount: clientCredentials.createAccount,
            hasPassword: !!clientCredentials.password
          },

          // Workflow steps progress
          stepsProgress: NEW_WORKFLOW_STEPS.map((step, index) => ({
            ...step,
            index,
            status: index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending',
            completedAt: index < currentStep ? new Date().toISOString() : undefined
          }))
        };

        console.log('🔄 DEBUG: Saving workflow with new questionnaire assignment to database:', {
          workflowId: workflowDataWithNewAssignment.workflowId,
          caseId: workflowDataWithNewAssignment.case.id,
          questionnaireId: assignment.questionnaireId,
          questionnaireName: assignment.questionnaireName,
          selectedForms: workflowDataWithNewAssignment.selectedForms,
          clientAccountCreated: !!clientUserId,
          // Client ID information
          topLevelClientId: workflowDataWithNewAssignment.clientId,
          clientObjectId: workflowDataWithNewAssignment.client.id,
          caseClientId: workflowDataWithNewAssignment.case.clientId,
          assignmentClientId: assignment.clientId,
          originalClientId: client.id,
          newlyCreatedClientUserId: clientUserId
        });

        // Save the comprehensive workflow data to the database using saveWorkflowProgress
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Validate required fields before saving
            const missingFields = [];
            if (!client.firstName?.trim()) missingFields.push('First Name');
            if (!client.lastName?.trim()) missingFields.push('Last Name');
            if (!client.email?.trim()) missingFields.push('Email');
            if (!client.address?.street?.trim()) missingFields.push('Street Address');
            if (!client.address?.city?.trim()) missingFields.push('City');
            if (!client.address?.state?.trim()) missingFields.push('State/Province');
            if (!client.address?.zipCode?.trim()) missingFields.push('ZIP/Postal Code');
            if (!client.address?.country?.trim()) missingFields.push('Country');

            if (missingFields.length > 0) {
              const errorMessage = `Please fill in the following required fields: ${missingFields.join(', ')}`;
              console.error('❌ DEBUG: Validation failed - missing required fields:', missingFields);
              toast.error(errorMessage);
              return;
            }

            // Console log to check client ID before saving workflow for new client
            console.log('🔍 DEBUG: About to save NEW CLIENT workflow - Client ID verification:', {
              clientUserId: clientUserId,
              topLevelClientId: workflowDataWithNewAssignment.clientId,
              clientObjectId: workflowDataWithNewAssignment.client.id,
              caseClientId: workflowDataWithNewAssignment.case.clientId,
              assignmentClientId: assignment.clientId,
              originalClientId: client.id,
              clientName: client.name,
              clientEmail: client.email,
              isNewClient: !client.isExistingClient,
              accountCreated: !!clientUserId
            });

            const response = await saveWorkflowProgress(workflowDataWithNewAssignment);
            console.log('✅ DEBUG: Workflow with new assignment saved to database:', response);
            
            // ✅ CREATE ENHANCED CASE WITH DEDICATED API ENDPOINT
            try {
              console.log('🔄 Creating enhanced case with POST /api/v1/cases endpoint...');
              
              // Get current user for assignedTo field
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              const assignedToId = currentUser._id || currentUser.id;
              
              // Prepare enhanced case data according to API specification
              // const enhancedCaseData: EnhancedCaseData = {
              //   // Required fields
              //   type: caseData.category || 'Family-Based',
              //   clientId: clientUserId || client.id || client._id || '',
                
              //   // Enhanced fields
              //   title: caseData.title || `${client.name} - ${caseData.category || 'Immigration'} Case`,
              //   description: caseData.description || `${caseData.category || 'Immigration'} case for ${client.name}`,
              //   category: caseData.category || 'family-based',
              //   subcategory: caseData.subcategory || 'adjustment-of-status',
              //   priority: (caseData.priority?.charAt(0).toUpperCase() + caseData.priority?.slice(1)) as 'Low' | 'Medium' | 'High' | 'Urgent' || 'Medium',
              //   dueDate: caseData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
              //   assignedTo: assignedToId,
                
              //   // Form management
              //   assignedForms: selectedForms || [],
              //   formCaseIds: formCaseIds || {},
              //   questionnaires: [selectedQuestionnaire],
                
              //   // Optional fields
              //   status: 'draft',
              //   startDate: new Date().toISOString(),
              //   expectedClosureDate: caseData.expectedClosureDate,
              //   notes: `Case created through workflow automation. Questionnaire: ${assignment.questionnaireName}`
              // };

              // const caseResponse = await createEnhancedCase(enhancedCaseData);
              
              // if (caseResponse && caseResponse.data) {
              //   console.log('✅ Enhanced case created successfully:', {
              //     caseId: caseResponse.data.case?._id || caseResponse.data._id,
              //     success: caseResponse.data.success,
              //     message: caseResponse.data.message
              //   });
                
              //   // Update local case data with the newly created case information
              //   const createdCase = caseResponse.data.case || caseResponse.data;
              //   if (createdCase._id) {
              //     setCaseData(prev => ({
              //       ...prev,
              //       id: createdCase._id,
              //       _id: createdCase._id,
              //       ...createdCase
              //     }));
              //   }
                
              //   toast.success(
              //     <div>
              //       <p>✅ Enhanced case created successfully!</p>
              //       <p className="text-sm mt-1">📋 Case ID: {createdCase._id}</p>
              //       <p className="text-sm">📁 Title: {enhancedCaseData.title}</p>
              //       <p className="text-xs text-green-600">💾 Saved with enhanced fields, forms, and questionnaire assignment</p>
              //     </div>,
              //     { duration: 6000 }
              //   );
              // }
              
            } catch (caseError: any) {
              console.error('❌ Error creating enhanced case:', {
                error: caseError.message,
                status: caseError.response?.status,
                data: caseError.response?.data
              });
              
              // Don't fail the entire workflow, just log the case creation error
              toast.error(
                <div>
                  <p>⚠️ Case creation failed but workflow saved</p>
                  <p className="text-sm mt-1">Questionnaire assignment is still active</p>
                  <p className="text-xs text-gray-600">Error: {caseError.message}</p>
                </div>,
                { duration: 5000 }
              );
            }
            
            toast.success(
              <div>
                <p>✅ New questionnaire assigned and workflow saved for client {client.name}</p>
                <p className="text-sm mt-1">📋 Questionnaire: {assignment.questionnaireName}</p>
                <p className="text-sm text-green-600">📁 Case: {caseData.title || 'Untitled Case'}</p>
                <p className="text-xs text-blue-600">💾 Complete workflow saved to database</p>
              </div>,
              { duration: 8000 }
            );
            
          } catch (workflowSaveError: any) {
            console.error('❌ DEBUG: Failed to save workflow with new assignment:', workflowSaveError);
            // Don't fail the entire process - just log and continue
            toast.error('Questionnaire assigned but workflow save failed. Assignment is still active.');
          }
        } else {
          console.warn('⚠️ DEBUG: No authentication token - skipping workflow save');
        }

        console.log('✅ DEBUG: Workflow data saved successfully to database');

      } catch (error) {
        console.error('❌ DEBUG: Error saving workflow data:', error);
        toast.error('Questionnaire assigned but some data may not be saved to server', { duration: 3000 });
      }

      // Move to initial screen after successful assignment
      console.log('✅ DEBUG: New questionnaire assignment completed - redirecting to initial screen');
      
      // Reset workflow state for new client creation
      setCurrentStep(0);
      setClient({
        id: '',
        clientId: '', // MongoDB ObjectId reference to DEFAULT_IMS_Client
        name: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        address: {
          street: '',
          aptSuiteFlr: '',
          aptNumber: '',
          city: '',
          state: '',
          zipCode: '',
          province: '',
          postalCode: '',
          country: '',
        },
        dateOfBirth: '',
        nationality: '',
        // Immigration-specific fields
        alienRegistrationNumber: '',
        uscisOnlineAccountNumber: '',
        socialSecurityNumber: '',
        status: 'active',
        createdAt: ''
      });
      setCaseData({
        id: '',
        clientId: '',
        title: '',
        description: '',
        category: '',
        subcategory: '',
        type: 'Family-Based',
        status: 'draft',
        priority: 'medium',
        assignedForms: [],
        questionnaires: [],
        createdAt: '',
        dueDate: '',
        startDate: '',
        expectedClosureDate: '',
        assignedAttorney: '',
        formCaseIds: {}
      });
      setSelectedForms([]);
      setFormCaseIds({});
      setSelectedQuestionnaire('');
      setClientCredentials({
        email: '',
        password: '',
        createAccount: false
      });
      
      // Show success message for new client creation completion
      toast.success(
        <div>
          <p>🎉 <strong>New Client Successfully Created!</strong></p>
          <p className="text-sm mt-1">✅ Client: {client.name}</p>
          <p className="text-sm">✅ Case: {caseData.title || 'Untitled Case'}</p>
          <p className="text-sm">✅ Questionnaire: {typeof selectedQuestionnaire === 'string'
            ? selectedQuestionnaire
            : (selectedQuestionnaire && typeof selectedQuestionnaire === 'object'
                ? (selectedQuestionnaire as any)._id || (selectedQuestionnaire as any).id || 'Unknown'
                : 'Unknown')}</p>
          <p className="text-xs text-green-600 mt-2">Ready to create another client or process existing clients.</p>
        </div>,
        { duration: 10000 }
      );
    } catch (error: any) {

      // Display more specific error messages
      if (error?.message && error.message.includes('Invalid')) {
        // This is our validation error
        toast.error(error.message);
        setLoading(false);
        return;
      } else if (error?.message && error.message.includes('Authentication required')) {
        // Authentication error
        toast.error('You must be logged in to assign questionnaires. Please log in first.');
        setLoading(false);
        return;
      } else if (error?.response?.status === 404 || error?.message?.includes('not found')) {
        // API endpoint not found
        toast.error('API endpoint not found. Cannot assign questionnaire without server connection.', { duration: 4000 });
        setLoading(false);
        return;
      } else if (error?.response?.data?.error) {
        // This is an API error with details
        toast.error(`API Error: ${error.response.data.error}`);
        setLoading(false);
        return;
      } else {
        // Generic fallback error
        toast.error('Failed to assign questionnaire. Please check your connection and try again.');
        setLoading(false);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async () => {
    if (!questionnaireAssignment) return;

    try {
      setLoading(true);

      // Use controller to submit responses
      if (questionnaireAssignment.id && !questionnaireAssignment.id.startsWith('assignment_')) {
        // Submit using API for real server-generated IDs
        await submitQuestionnaireResponses(questionnaireAssignment.id, clientResponses);
      }

      const updatedAssignment = {
        ...questionnaireAssignment,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        responses: clientResponses
      };

      setQuestionnaireAssignment(updatedAssignment);

      // Note: Data is now only saved to backend via API

      // Questionnaire responses saved successfully
      handleNext();
    } catch (error) {

      toast.error('There was an error saving the responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to auto-fill form details from API workflow response
  const autoFillFromAPIResponse = (apiResponse: any) => {
    try {
      if (!apiResponse || !apiResponse.data || apiResponse.data.length === 0) {
        return;
      }

      const workflowData = apiResponse.data[0]; // Get the first workflow

      // Auto-fill client data
      if (workflowData.client) {
        const clientData = {
          ...client,
          name: workflowData.client.name || client.name,
          firstName: workflowData.client.firstName || client.firstName,
          lastName: workflowData.client.lastName || client.lastName,
          email: workflowData.client.email || client.email,
          phone: workflowData.client.phone || client.phone,
          dateOfBirth: workflowData.client.dateOfBirth || client.dateOfBirth,
          nationality: workflowData.client.nationality || client.nationality,
          // Include client ID fields
          clientId: workflowData.client.clientId || workflowData.client._id || workflowData.client.clientId || client.clientId,
          address: {
            ...client.address,
            ...workflowData.client.address
          }
        };
        setClient(clientData);
      }

      // Auto-fill case data
      if (workflowData.case) {
        const caseDataFromAPI = {
          ...caseData,
          id: workflowData.case.id || caseData.id,
          _id: workflowData.case._id || caseData._id,
          title: workflowData.case.title || caseData.title,
          category: workflowData.case.category || caseData.category,
          subcategory: workflowData.case.subcategory || caseData.subcategory,
          status: workflowData.case.status || caseData.status,
          priority: workflowData.case.priority || caseData.priority,
          visaType: workflowData.case.visaType || caseData.visaType,
          description: workflowData.case.description || caseData.description,
          openDate: workflowData.case.openDate || caseData.openDate,
          priorityDate: workflowData.case.priorityDate || caseData.priorityDate,
          dueDate: workflowData.case.dueDate || caseData.dueDate
        };
        setCaseData(caseDataFromAPI);
      }

      // Auto-fill selected forms
      if (workflowData.selectedForms && Array.isArray(workflowData.selectedForms)) {
        setSelectedForms(workflowData.selectedForms);
      }

      // Auto-fill form case IDs
      if (workflowData.formCaseIds) {
        setFormCaseIds(workflowData.formCaseIds);
      }

      // Auto-fill selected questionnaire
      if (workflowData.selectedQuestionnaire) {
        // Ensure selectedQuestionnaire is always a string ID, not an object
        const questionnaireId = typeof workflowData.selectedQuestionnaire === 'string' 
          ? workflowData.selectedQuestionnaire 
          : workflowData.selectedQuestionnaire?._id || workflowData.selectedQuestionnaire?.id || '';
        setSelectedQuestionnaire(questionnaireId);
      }

      // Auto-fill client credentials
      if (workflowData.clientCredentials) {
        setClientCredentials({
          ...clientCredentials,
          email: workflowData.clientCredentials.email || clientCredentials.email,
          createAccount: workflowData.clientCredentials.createAccount || clientCredentials.createAccount
        });
      }

      // Auto-fill current step if specified
      if (workflowData.currentStep !== undefined && workflowData.currentStep >= 0) {
        setCurrentStep(Math.max(workflowData.currentStep, currentStep)); // Don't go backwards
      }

    } catch (error) {
      // Error auto-filling from API response
    }
  };

  // New function to auto-generate forms using renderFormWithData
  const handleAutoGenerateForms = async () => {
    try {
      setGeneratingForms(true);
      setGeneratedForms([]);

      console.log(completeWorkflowDetails);

      // Prepare comprehensive form data from all collected information
      const formData = {
        // Required fields for validation
        clientId: client.clientId || client._id || '',
        formNumber: selectedForms && selectedForms.length > 0 ? selectedForms[0] : 'workflow-step',

        // Client information
        clientFirstName: client.firstName || '',
        clientLastName: client.lastName || '',
        clientEmail: client.email || '',
        clientPhone: client.phone || '',
        clientDateOfBirth: client.dateOfBirth || '',
        clientNationality: client.nationality || '',

        // Client address
        clientStreet: client.address?.street || '',
        clientCity: client.address?.city || '',
        clientState: client.address?.state || '',
        clientZipCode: client.address?.zipCode || '',
        clientCountry: client.address?.country || '',

        // Case information
        caseCategory: caseData.category || '',
        caseSubcategory: caseData.subcategory || '',
        visaType: caseData.visaType || '',
        priorityDate: caseData.priorityDate || '',
        caseId: completeWorkflowDetails.case.caseId || '',

        // Client responses from questionnaire
        ...clientResponses,

        // Form details
        selectedForms: selectedForms || [],
        questionnaireResponses: clientResponses || {},

        // Additional metadata
        workflowStep: currentStep,
        timestamp: new Date().toISOString(),
        autoFillSource: 'LegalFirmWorkflow'
      };

      // Validate the form data
      const validation = validateFormData(formData);
      if (!validation.isValid) {
        toast.error(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }

      // Prepare the data for the API
      const preparedData = prepareFormData(formData);

      // Generate forms for each selected form
      const newGeneratedForms = [];

      for (const formName of selectedForms) {
        try {
          // Find the form template that matches the selected form name
          const formTemplate = formTemplates.find(template => 
            template.formNumber === formName || 
            template.metadata?.uscisFormNumber === formName
          );
          
          // Get the form number from the template metadata, or fallback to form name
          const rawFormNumber = formTemplate?.metadata?.uscisFormNumber || formName;
          
          // Normalize form number by removing "Form " prefix if present
          const formNumber = rawFormNumber.replace(/^Form\s+/i, '');

          // Add a placeholder for generating status
          newGeneratedForms.push({
            formName,
            templateId: '',
            blob: new Blob(),
            downloadUrl: '',
            fileName: `${formName}_${new Date().toISOString().split('T')[0]}.pdf`,
            status: 'generating' as const
          });

          // Fetch template IDs for this form number using Anvil API
          const templatesResponse = await getTemplateIdsByFormNumber(formNumber);
          
          if (!templatesResponse.data.success || !templatesResponse.data.data.templates.length) {
            throw new Error(`No Anvil templates found for form ${formNumber}`);
          }

          // Use the first available template (you might want to add logic to select the best one)
          const anvilTemplate = templatesResponse.data.data.templates[0];
          const templateId = anvilTemplate.templateId;

          // Update the template ID in the form
          const formIndex: number = newGeneratedForms.findIndex(f => f.formName === formName);
          if (formIndex !== -1) {
            newGeneratedForms[formIndex].templateId = templateId;
          }

          // Ensure caseId is included in the prepared data
          const preparedDataWithCaseId = {
            ...preparedData,
            caseId: completeWorkflowDetails.case.caseId || ''
          };

          // Use Anvil API to fill the PDF template
          const anvilResponse = await fillPdfTemplateBlob(
            templateId,
            preparedDataWithCaseId,
            {
              title: `${formName} - ${client.firstName} ${client.lastName}`,
              fontFamily: 'Arial',
              fontSize: 12,
              textColor: '#000000',
              useInteractiveFields: true
            }
          );

          if (anvilResponse.data) {
            // Create download URL
            const downloadUrl = createPdfBlobUrl(anvilResponse.data.blob);
            const fileName = anvilResponse.data.metadata?.filename || `${formName}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Update the form with success status
            if (formIndex !== -1) {
              newGeneratedForms[formIndex] = {
                formName,
                templateId,
                blob: anvilResponse.data.blob,
                downloadUrl,
                fileName,
                pdfId: anvilResponse.data.pdfId,
                status: 'success' as const,
                filledPercentage: anvilResponse.data.filledPercentage,
                unfilledFields: anvilResponse.data.unfilledFields,
                metadata: anvilResponse.data.metadata
              };
            }

            // Generated form successfully
          } else {
            throw new Error('No data returned from Anvil API');
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
        // Forms generated successfully
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
  const handlePreviewForm = async (formName: string) => {
    const form = generatedForms.find(f => f.formName === formName);
    if (!form) {
      toast.error(`Form ${formName} not found`);
      return;
    }

    // If preview is already showing, just toggle it off
    if (showPreview[formName]) {
      setShowPreview(prev => ({
        ...prev,
        [formName]: false
      }));
      return;
    }

    // Always try to show preview - use existing blob first, then try to fetch fresh data
    if (form.blob) {
      // Show existing preview immediately
      setShowPreview(prev => ({
        ...prev,
        [formName]: true
      }));
      
      // If we have a pdfId, also try to fetch fresh data in background
      if (form.pdfId) {
        try {
          setLoadingPreview(prev => ({ ...prev, [formName]: true }));
          
          const previewResponse = await getPdfPreviewBlob({ pdfId: form.pdfId });
          
          if (previewResponse.data.blob) {
            const { blob, metadata, pdfId } = previewResponse.data;
            
            // Update preview data state
            setPdfPreviewData(prev => ({
              ...prev,
              [formName]: {
                blob,
                metadata,
                pdfId
              }
            }));

            // Update the form with new preview data
            const updatedForms = generatedForms.map(f => 
              f.formName === formName 
                ? { 
                    ...f, 
                    blob,
                    downloadUrl: URL.createObjectURL(blob)
                  }
                : f
            );
            setGeneratedForms(updatedForms);

            toast.success('PDF preview refreshed from backend');
          }
        } catch (error) {
          console.error('Error refreshing PDF preview:', error);
          // Don't show error toast since we're already showing the cached version
        } finally {
          setLoadingPreview(prev => ({ ...prev, [formName]: false }));
        }
      }
    } else if (form.pdfId) {
      // No existing blob, try to fetch from backend
      try {
        setLoadingPreview(prev => ({ ...prev, [formName]: true }));
        
        const previewResponse = await getPdfPreviewBlob({ pdfId: form.pdfId });
        
        if (previewResponse.data.blob) {
          const { blob, metadata, pdfId } = previewResponse.data;
          
          // Update preview data state
          setPdfPreviewData(prev => ({
            ...prev,
            [formName]: {
              blob,
              metadata,
              pdfId
            }
          }));

          // Update the form with new preview data
          const updatedForms = generatedForms.map(f => 
            f.formName === formName 
              ? { 
                  ...f, 
                  blob,
                  downloadUrl: URL.createObjectURL(blob)
                }
              : f
          );
          setGeneratedForms(updatedForms);

          // Show the preview
          setShowPreview(prev => ({
            ...prev,
            [formName]: true
          }));

          toast.success('PDF preview loaded from backend');
        } else {
          throw new Error('Failed to load PDF preview - no blob data received');
        }
      } catch (error) {
        console.error('Error loading PDF preview:', error);
        toast.error('Failed to load PDF preview');
      } finally {
        setLoadingPreview(prev => ({ ...prev, [formName]: false }));
      }
    } else {
      toast.error('No PDF data available for preview');
    }
  };

  // Function to open PDF editor
  const handleEditForm = (formName: string) => {
    setShowEditor(prev => ({
      ...prev,
      [formName]: !prev[formName]
    }));
  };

  // Function to close PDF editor
  const handleCloseEditor = (formName: string) => {
    setShowEditor(prev => ({
      ...prev,
      [formName]: false
    }));
  };

  // Function to handle saving edited PDF
  const handleSaveEditedPdf = async (formName: string, editedPdfBlob: Blob) => {
    try {
      const form = generatedForms.find(f => f.formName === formName);
      if (!form) return;

      // Get current client and case information
      const currentClient = existingClients.find(c => c.email === selectedExistingClientId) || client;
      const currentCase = caseData;

      // Save to backend database
      const clientId = currentClient?._id || currentClient?.clientId || currentClient?.id || '';
      const formNumber = formName; // formName should be the form number
      const templateId = form.templateId;
      
      // Ensure we have a valid pdfId
      if (!form.pdfId) {
        toast.error(`Cannot save edited PDF: Missing pdfId for form ${formName}`);
        return;
      }

      const saveResponse = await saveEditedPdf(
        editedPdfBlob,
        formNumber,
        clientId,
        templateId,
        form.pdfId, // Use the existing pdfId
        {
          caseId: currentCase?._id || currentCase?.id,
          workflowId: questionnaireAssignment?.id,
          filename: form.fileName
        }
      );

      if (saveResponse.data.success) {
        // Update the form with the edited PDF and new backend data
        const updatedForms = generatedForms.map(f => 
          f.formName === formName 
            ? { 
                ...f, 
                blob: editedPdfBlob, 
                downloadUrl: saveResponse.data.data?.downloadUrl || URL.createObjectURL(editedPdfBlob),
                pdfId: saveResponse.data.data?.pdfId,
                savedToBackend: true
              }
            : f
        );
        setGeneratedForms(updatedForms);

        toast.success('PDF saved successfully to database');
        handleCloseEditor(formName);
      } else {
        throw new Error(saveResponse.data.message || 'Failed to save PDF to database');
      }
    } catch (error) {
      console.error('Error saving edited PDF:', error);
      toast.error('Failed to save PDF to database');
      
      // Fallback: still update local state even if backend save fails
      try {
        const form = generatedForms.find(f => f.formName === formName);
        if (form) {
          const updatedForms = generatedForms.map(f => 
            f.formName === formName 
              ? { ...f, blob: editedPdfBlob, downloadUrl: URL.createObjectURL(editedPdfBlob) }
              : f
          );
          setGeneratedForms(updatedForms);
          toast.success('PDF saved locally (backend save failed)');
          handleCloseEditor(formName);
        }
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
      }
    }
  };

  // Function to close preview
  const handleClosePreview = (formName: string) => {
    setShowPreview(prev => ({
      ...prev,
      [formName]: false
    }));
    
    // Clean up blob URL to prevent memory leaks
    const form = generatedForms.find(f => f.formName === formName);
    if (form && form.downloadUrl && form.downloadUrl.startsWith('blob:')) {
      URL.revokeObjectURL(form.downloadUrl);
    }
  };

  // Function to toggle unfilled fields display
  const handleToggleUnfilledFields = (formName: string) => {
    setShowUnfilledFields(prev => ({
      ...prev,
      [formName]: !prev[formName]
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
      
      // Also clean up preview data blob URLs
      Object.values(pdfPreviewData).forEach(previewData => {
        if (previewData.blob) {
          const url = URL.createObjectURL(previewData.blob);
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [generatedForms, pdfPreviewData]);

  // Handles steps for new responses
  const renderNewResponseStep = (step: number) => {
    switch (step) {
      case 0: // Start: New or Existing Client
        return (
          // <div>Start: New or Existing Client</div>
          <div className="space-y-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Start Workflow</h3>
            <p className="text-blue-700">Choose to create a new client or select an existing client to begin the workflow.</p>
          </div>
          
          {/* DEBUG BUTTON - Remove in production */}
 
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* New Client */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-between">
              <User className="w-10 h-10 text-blue-500 mb-2" />
              <h4 className="font-medium text-gray-900 mb-2">New Client</h4>
              <p className="text-gray-600 mb-4 text-center">Enter new client details and start a new case.</p>
              <Button onClick={() => setCurrentStep(1)} className="w-full">Create New Client</Button>
            </div>
            {/* Existing Client */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-between">
              <Users className="w-10 h-10 text-green-500 mb-2" />
              <h4 className="font-medium text-gray-900 mb-2">Existing Client</h4>
              <p className="text-gray-600 mb-4 text-center">Select an existing client to auto-load their information and previous workflow data.</p>
              <div className="w-full mb-4">
                {fetchingClients ? (
                  <div className="text-gray-500 text-center">Loading clients...</div>
                ) : (
                  <Select
                    id="existingClient"
                    label="Select Client"
                    value={selectedExistingClientId}
                    onChange={e => {

                      setSelectedExistingClientId(e.target.value);
                    }}
                    options={[
                      { value: '', label: 'Choose a client' },
                      ...existingClients
                        .filter(c => {
                          const anyClient = c as any;
                          // Check if client has a valid ID and email
                          const hasValidId = typeof anyClient._id === 'string' && anyClient._id.length === 24;
                          const hasValidEmail = typeof anyClient.email === 'string' && anyClient.email.includes('@');
                          // Check if client has valid role and userType (allow both companyClient and individual client types)
                          const hasValidType = anyClient.role === 'client' && (anyClient.userType === 'companyClient' || anyClient.userType === 'client' || !anyClient.userType);
                          
                          return hasValidId && hasValidEmail && hasValidType;
                        })
                        .map(c => {
                          const anyClient = c as any;
                          // Try to construct name from multiple possible fields
                          let displayName = '';
                          
                          if (anyClient.name) {
                            displayName = anyClient.name;
                          } else if (anyClient.firstName || anyClient.lastName) {
                            displayName = `${anyClient.firstName || ''} ${anyClient.lastName || ''}`.trim();
                          } else if (anyClient.fullName) {
                            displayName = anyClient.fullName;
                          } else {
                            displayName = 'Unnamed Client';
                          }
                          
                          const email = anyClient.email || 'No email';
                          
                          return {
                            value: anyClient.email,
                            label: `${displayName} (${email})`
                          };
                        })
                    ]}
                  />
                )}
              </div>
              <Button
                onClick={async () => {
                  if (!selectedExistingClientId) return;
                  
                  console.log('🔄 Existing client button clicked, fetching client details');
                  
                  // Use fetchClientDetails method directly
                  const result = await fetchClientDetails(selectedExistingClientId);
                  
                  if (result.success) {
                    // After client details are successfully fetched, proceed to Create Client step
                    setCurrentStep(1);
                    console.log('✅ Client details fetched successfully, proceeding to Create Client step');
                  } else {
                    console.error('❌ Failed to fetch client details:', result.error);
                    // Error handling is already done in fetchClientDetails (toast notification)
                  }
                }}
                disabled={!selectedExistingClientId || loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Proceed for New case '}
              </Button>
            </div>
          </div>
        </div>
        );

      case 1: // Create Client
        return (
          // <div>Create Client</div>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                {client.isExistingClient ? 'Existing Client Information' : 'Client Information'}
              </h3>
              <p className="text-blue-700">
                {client.isExistingClient 
                  ? `Review and update client details for: ${client.name || 'Selected Client'}` 
                  : 'Enter the client\'s personal details to create their profile.'
                }
              </p>
              {client.isExistingClient && (
                <div className="mt-2 flex items-center text-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Client details loaded </span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  id="firstName"
                  label="First Name"
                  value={client.firstName}
                  onChange={(e) => {
                    const firstName = e.target.value;
                    const fullName = `${firstName} ${client.middleName || ''} ${client.lastName || ''}`.trim().replace(/\s+/g, ' ');
                    setClient({
                      ...client,
                      firstName: firstName,
                      name: fullName
                    });
                  }}
                  required
                />
                <Input
                  id="middleName"
                  label="Middle Name"
                  value={client.middleName}
                  onChange={(e) => {
                    const middleName = e.target.value;
                    const fullName = `${client.firstName || ''} ${middleName} ${client.lastName || ''}`.trim().replace(/\s+/g, ' ');
                    setClient({
                      ...client,
                      middleName: middleName,
                      name: fullName
                    });
                  }}
                />
                <Input
                  id="lastName"
                  label="Last Name"
                  value={client.lastName}
                  onChange={(e) => {
                    const lastName = e.target.value;
                    const fullName = `${client.firstName || ''} ${client.middleName || ''} ${lastName}`.trim().replace(/\s+/g, ' ');
                    setClient({
                      ...client,
                      lastName: lastName,
                      name: fullName
                    });
                  }}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  required
                />
                <Input
                  id="phone"
                  label="Phone Number"
                  value={client.phone}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })}
                  required
                />
                <Input
                  id="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={client.dateOfBirth}
                  onChange={(e) => setClient({ ...client, dateOfBirth: e.target.value })}
                  required
                />
                <Input
                  id="nationality"
                  label="Nationality"
                  value={client.nationality}
                  onChange={(e) => setClient({ ...client, nationality: e.target.value })}
                  required
                />
              </div>
            </div>
            
            {/* Immigration Information Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Immigration Information</h4>
              <p className="text-sm text-gray-600">Optional immigration-specific identifiers (if applicable)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="alienRegistrationNumber"
                  label="Alien Registration Number (A-Number)"
                  value={client.alienRegistrationNumber || ''}
                  onChange={(e) => setClient({ ...client, alienRegistrationNumber: e.target.value })}
                  placeholder="A-123456789 (if any)"
                />
                <Input
                  id="uscisOnlineAccountNumber"
                  label="USCIS Online Account Number"
                  value={client.uscisOnlineAccountNumber || ''}
                  onChange={(e) => setClient({ ...client, uscisOnlineAccountNumber: e.target.value })}
                  placeholder="Enter USCIS account number (if any)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="socialSecurityNumber"
                  label="U.S. Social Security Number"
                  value={client.socialSecurityNumber || ''}
                  onChange={(e) => setClient({ ...client, socialSecurityNumber: e.target.value })}
                  placeholder="XXX-XX-XXXX (if any)"
                />
                <div></div> {/* Empty div for spacing */}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Address Information</h4>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  id="street"
                  label="Street Address"
                  value={client.address?.street || ''}
                  onChange={(e) => setClient({
                    ...client,
                    address: { ...(client.address || {}), street: e.target.value }
                  })}
                  placeholder="Enter street address"
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    id="aptSuiteFlr"
                    label="Apt/Suite/Flr"
                    value={client.address?.aptSuiteFlr || ''}
                    onChange={(e) => setClient({
                      ...client,
                      address: { ...(client.address || {}), aptSuiteFlr: e.target.value }
                    })}
                    options={[
                      { value: '', label: 'Select Type' },
                      { value: 'Apt', label: 'Apartment' },
                      { value: 'Suite', label: 'Suite' },
                      { value: 'Flr', label: 'Floor' },
                      { value: 'Unit', label: 'Unit' },
                      { value: 'Room', label: 'Room' }
                    ]}
                  />
                  <Input
                    id="aptNumber"
                    label="Apt/Suite Number"
                    value={client.address?.aptNumber || ''}
                    onChange={(e) => setClient({
                      ...client,
                      address: { ...(client.address || {}), aptNumber: e.target.value }
                    })}
                    placeholder="Enter number"
                  />
                  <div></div> {/* Empty div for spacing */}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="city"
                    label="City"
                    value={client.address?.city || ''}
                    onChange={(e) => setClient({
                      ...client,
                      address: { ...(client.address || {}), city: e.target.value }
                    })}
                    required
                  />
                  <Input
                    id="state"
                    label="State/Province"
                    value={client.address?.state || client.address?.province || ''}
                    onChange={(e) => setClient({
                      ...client,
                      address: { ...(client.address || {}), state: e.target.value, province: e.target.value }
                    })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="zipCode"
                    label="ZIP/Postal Code"
                    value={client.address?.zipCode || client.address?.postalCode || ''}
                    onChange={(e) => setClient({
                      ...client,
                      address: { ...(client.address || {}), zipCode: e.target.value, postalCode: e.target.value }
                    })}
                    required
                  />
                  <Input
                    id="country"
                    label="Country"
                    value={client.address?.country || ''}
                    onChange={(e) => setClient({
                      ...client,
                      address: { ...(client.address || {}), country: e.target.value }
                    })}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {isViewEditMode ? (
                // Simple Next button in view/edit mode
                <Button 
                  onClick={handleNext} 
                  disabled={!client.name || !client.email || !client.address?.street || !client.address?.city || !client.address?.state || !client.address?.zipCode || !client.address?.country}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                // Original Create Client button in normal mode
                <Button
                  onClick={async () => {
                    // For Step 1 (Create Client), we don't need to save form details to backend
                    // Client data will be saved when account is actually created later
                    // Skip backend save for client step as it's not form data
                    console.log('🔄 DEBUG: Create Client step - skipping form details save');

                    // Simply advance to next step without creating client account
                    // Client account will only be created later if password is provided from questionnaire assignment
                    setCurrentStep(2);
                  }}
                  disabled={!client.name || !client.email || !client.address?.street || !client.address?.city || !client.address?.state || !client.address?.zipCode || !client.address?.country}
                >
                  {client.isExistingClient ? 'Proceed to Next Step' : 'Create Client & Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        );

      case 2: // Create Case
        return (
          // <div>Create Case</div>
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Case Setup</h3>
              <p className="text-green-700">Create a new case for client: <strong>{client.name}</strong></p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="title"
                  label="Case Title"
                  placeholder="Enter case title"
                  value={caseData.title || ''}
                  onChange={e => setCaseData({ ...caseData, title: e.target.value })}
                  required
                />
                <Select
                  id="category"
                  label="Immigration Category"
                  value={caseData.category || ''}
                  onChange={e => setCaseData({ ...caseData, category: e.target.value })}
                  options={IMMIGRATION_CATEGORIES.map(cat => ({
                    value: cat.id,
                    label: cat.name
                  }))}
                  required
                />
                <Select
                  id="subcategory"
                  label="Subcategory"
                  value={caseData.subcategory || ''}
                  onChange={e => setCaseData({ ...caseData, subcategory: e.target.value })}
                  options={[
                    { value: '', label: 'Select subcategory' },
                    ...(caseData.category ?
                      IMMIGRATION_CATEGORIES
                        .find(cat => cat.id === caseData.category)
                        ?.subcategories.map(sub => ({
                          value: sub.id,
                          label: sub.name
                        })) || []
                      : []
                    )
                  ]}
                  required
                />
                <Select
                  id="status"
                  label="Case Status"
                  value={caseData.status || 'Active'}
                  onChange={e => setCaseData({ ...caseData, status: e.target.value as Case['status'] })}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Closed', label: 'Closed' },
                    { value: 'On Hold', label: 'On Hold' }
                  ]}
                  required
                />
                <Select
                  id="priority"
                  label="Priority Level"
                  value={caseData.priority || 'Medium'}
                  onChange={e => setCaseData({ ...caseData, priority: e.target.value as Case['priority'] })}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' },
                    { value: 'Urgent', label: 'Urgent' }
                  ]}
                  required
                />
                <Input
                  id="startDate"
                  label="Start Date"
                  type="date"
                  value={caseData.startDate || ''}
                  onChange={e => setCaseData({ ...caseData, startDate: e.target.value })}
                  required
                />
                <Input
                  id="expectedClosureDate"
                  label="Expected Closure Date"
                  type="date"
                  value={caseData.expectedClosureDate || ''}
                  onChange={e => setCaseData({ ...caseData, expectedClosureDate: e.target.value })}
                />
              </div>
              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Case Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter case description or notes..."
                  value={caseData.description || ''}
                  onChange={e => setCaseData({ ...caseData, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={async () => {
                  // For Step 2 (Create Case), we don't need to save form details to backend
                  // Case data will be saved when the workflow is actually processed
                  // Skip backend save for case step as it's not form data
                  console.log('🔄 DEBUG: Create Case step - skipping form details save');
                  
                  setCurrentStep(3);
                }}
                disabled={!caseData.title || !caseData.category}
              >
                Create Case & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3: // Select Forms
        return (
          // <div>Select Forms</div>
           <div className="space-y-6">
            

            

            {/* Display generated case ID summary */}
            {selectedForms.length > 0 && Object.keys(formCaseIds).length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Selected Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Name:</span> {client.name}
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Email:</span> {client.email}
                  </div>
                  {client.phone && (
                    <div>
                      <span className="font-medium text-green-800">Phone:</span> {client.phone}
                    </div>
                  )}
                  {client.address?.city && (
                    <div>
                      <span className="font-medium text-green-800">Location:</span> {String(client.address.city)}, {String(client.address.state || client.address.province || '')}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-green-800">Client ID:</span> {client.clientId || client._id}
                  </div>
                  {client.role && (
                    <div>
                      <span className="font-medium text-green-800">Role:</span> {client.role}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Select Immigration Form</h3>
              <p className="text-blue-700">Choose one immigration form needed for this case.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Available Forms (Select One)</h4>
              {loadingFormTemplates ? (
                <div className="text-gray-500">Loading forms...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formTemplates.map((template) => (
                    <div
                      key={template.formNumber}
                      onClick={() => {
                        if (selectedForms.includes(template.formNumber)) {
                          setSelectedForms([]); // Deselect if clicking the same form
                        } else {
                          setSelectedForms([template.formNumber]); // Select only this form
                        }
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedForms.includes(template.formNumber)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{template.formNumber}</h5>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                          <div className="text-xs text-gray-400 mt-1">Category: {template.category}</div>
                        </div>
                        {selectedForms.includes(template.formNumber) && (
                          <Check className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleFormsSubmit} disabled={selectedForms.length === 0 || generatingCaseIds}>
                {generatingCaseIds ? 'Generating Case IDs...' : 'Continue with Selected Forms'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 4: // Assign Questionnaire
        return (
          // <div>Assign Questionnaire</div>
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Assign Questionnaire</h3>
              <p className="text-orange-700">Send a questionnaire to the client to collect required information.</p>
            </div>

            {/* Description of how questionnaires work */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <InfoIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">How Client Questionnaires Work</h4>
                  <p className="text-blue-700 text-sm">
                    When you assign a questionnaire, the client will receive a notification and the questionnaire will
                    appear in their dashboard. They can fill it out at their convenience, and you'll be notified
                    once it's completed.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Select
                id="questionnaire"
                label="Select Questionnaire"
                value={selectedQuestionnaire}
                onChange={(e) => {
                  const selectedId = e.target.value;

                  // Log all available questionnaires with their ID fields for debugging
                  // Available questionnaires logged

                  // Enhanced flexible matching to find the selected questionnaire
                  const selected = availableQuestionnaires.find(q => {
                    // Check all possible ID fields
                    const possibleIds = [
                      q._id,          // MongoDB ObjectId
                      q.id,           // Original ID or API ID
                      q.originalId,   // Original ID before conversion
                      q.name          // Fallback to name if used as ID
                    ].filter(Boolean); // Remove undefined/null values

                    // For API questionnaires, prioritize matching the q_ prefixed ID
                    if (q.apiQuestionnaire && q.id === selectedId) {
                      // API questionnaire match found
                      return true;
                    }

                    // Check if any of the possible IDs match
                    const matches = possibleIds.includes(selectedId);
                    if (matches) {
                      // Regular questionnaire match found
                    }
                    return matches;
                  });

                  // Selected questionnaire found
                  setSelectedQuestionnaire(selectedId);

                  // If not found, log a warning
                  if (!selected) {
                    // Selected questionnaire not found in available list
                  }
                }}
                options={[
                  { value: '', label: 'Choose a questionnaire' },
                  ...availableQuestionnaires
                    .filter(q => {
                      // Add debug for questionnaire categories
                      // Questionnaire category checking

                      if (!caseData.category) return true;
                      if (!q.category) return true;
                      // const catMap: Record<string, string> = {
                      //   'family-based': 'FAMILY_BASED',
                      //   'employment-based': 'EMPLOYMENT_BASED',
                      //   'citizenship': 'NATURALIZATION',
                      //   'asylum': 'ASYLUM',
                      //   'foia': 'FOIA',
                      //   'other': 'OTHER',
                      //   'assessment': 'ASSESSMENT',
                      // };
                      // Convert case category to questionnaire category if needed
                      // const mapped = catMap[caseData.category] || '';
                      // Make the category matching more lenient
                      return true; // Show all questionnaires for now regardless of category
                    })
                    .map(q => {
                      // First normalize the questionnaire structure to ensure consistent fields
                      const normalizedQ = normalizeQuestionnaireStructure(q);

                      // Handle ID resolution with preference for the original API ID format
                      let idToUse;
                      let wasConverted = false;

                      // For API format questionnaires, ALWAYS use the original q_ format ID
                      if (q.id && q.id.startsWith('q_')) {
                        idToUse = q.id;
                        // Using API format ID
                      }
                      // For questionnaires with an originalId, offer both options with preference for original
                      else if (normalizedQ.originalId) {
                        // Use the original ID for selection to maintain consistency with saved data
                        idToUse = normalizedQ.originalId;
                        wasConverted = true;
                        // Using original ID
                      }
                      // For normalized IDs, use that format
                      else if (normalizedQ._id) {
                        idToUse = normalizedQ._id;
                        // Using normalized ID
                      }
                      // Fall back to any available ID
                      else {
                        idToUse = normalizedQ._id || normalizedQ.id || normalizedQ.name || `q_${Date.now()}`;
                        // Using fallback ID
                      }

                      // Count questions
                      const fields = normalizedQ.fields || [];
                      const questionCount = fields.length;

                      // Log what's being added to the dropdown
                      // Questionnaire option prepared

                      return {
                        // Store all possible IDs to help with matching later
                        value: idToUse, // Use the resolved ID as primary value for selection
                        apiId: q.id && q.id.startsWith('q_') ? q.id : undefined,
                        mongoId: normalizedQ._id,
                        originalId: normalizedQ.originalId,
                        label: `${normalizedQ.title || normalizedQ.name || 'Untitled'} (${questionCount} questions)${wasConverted ? ' 🔄' : ''}`,
                        hasValidId: true, // Should always be valid now
                        wasConverted, // Flag if ID was converted
                        fields: fields.length > 0 // Flag to indicate if questions/fields exist
                      };
                    })
                ]}
                required
              />                {selectedQuestionnaire && (() => {
                // Enhanced flexible matching to find the selected questionnaire
                const questionnaire = availableQuestionnaires.find(q => {
                  // Check all possible ID fields
                  const possibleIds = [
                    q._id,          // MongoDB ObjectId
                    q.id,           // Original ID or API ID
                    q.originalId,   // Original ID before conversion
                    q.name          // Fallback to name if used as ID
                  ].filter(Boolean); // Remove undefined/null values

                  // For API questionnaires, prioritize matching the q_ prefixed ID
                  if (q.apiQuestionnaire && q.id === selectedQuestionnaire) {

                    return true;
                  }

                  // Check if any of the possible IDs match
                  const matches = possibleIds.includes(selectedQuestionnaire);
                  if (matches) {

                  }
                  return matches;
                });

                if (!questionnaire) {

                  return (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                      <p className="text-yellow-700">Questionnaire not found. Please select a different questionnaire.</p>
                    </div>
                  );
                }

                // Questionnaire structure is valid
                let fields = questionnaire.fields || questionnaire.questions || [];

                // Special handling for API format questionnaires
                if (questionnaire.apiQuestionnaire ||
                  (questionnaire.id && questionnaire.id.startsWith('q_') && Array.isArray(questionnaire.fields))) {

                  fields = questionnaire.fields;
                }



                // Check if this is an API questionnaire or standard MongoDB questionnaire
                const isApiQuestionnaire = questionnaire.apiQuestionnaire ||
                  (questionnaire._id && questionnaire._id.startsWith('q_')) ||
                  (questionnaire.id && questionnaire.id.startsWith('q_'));
                const hasValidId = isApiQuestionnaire || (questionnaire._id && isValidMongoObjectId(questionnaire._id));
                const hasConvertedId = !!questionnaire.originalId;

                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Questionnaire Preview</h4>
                      {!hasValidId && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center">
                          <AlertCircle size={12} className="mr-1" /> Invalid ID Format
                        </span>
                      )}
                      {hasConvertedId && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                          <CheckCircle size={12} className="mr-1" /> ID Converted for Backend
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-2">{questionnaire.description || 'No description provided.'}</p>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      This questionnaire contains {fields.length} questions
                    </div>

                    {fields.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded bg-white p-2">
                        <ul className="space-y-2">
                          {fields.map((field: any, idx: number) => {
                            const fieldId = field.id || field._id || `field_${idx}`;
                            const fieldLabel = field.label || field.question || `Question ${idx + 1}`;
                            const fieldType = field.type || 'text';

                            return (
                              <li key={fieldId} className="py-1 px-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center">
                                  <span className="text-primary-600 font-semibold mr-2">{idx + 1}.</span>
                                  <span className="flex-grow">{fieldLabel}</span>
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {fieldType}
                                  </span>
                                </div>
                                {(field.description || field.help_text) && (
                                  <p className="text-xs text-gray-500 mt-1 ml-6">{field.description || field.help_text}</p>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-gray-300 bg-white rounded">
                        <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No questions defined in this questionnaire.</p>
                        <p className="text-xs text-gray-400 mt-1">
                          This questionnaire may be incomplete or malformed.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Enhanced UI for existing clients with previous questionnaire responses */}
              {(client.isExistingClient || client.hasUserAccount || existingQuestionnaireResponses.length > 0) && (
                <div className="mt-6 p-6 border-2 border-purple-300 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-purple-900 flex items-center">
                      <ClipboardList className="w-5 h-5 mr-2" />
                      Questionnaire Options for Existing Client
                    </h4>
                    <div className="flex items-center space-x-2">
                      {existingQuestionnaireResponses.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {existingQuestionnaireResponses.length} Previous Response{existingQuestionnaireResponses.length !== 1 ? 's' : ''} Found
                        </span>
                      )}
                      {/* Debug info for development */}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Debug Info</summary>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <div><strong>Client ID:</strong> {client.clientId || 'None'}</div>
                          <div><strong>Client Email:</strong> {client.email || 'None'}</div>
                          <div><strong>Is Existing:</strong> {client.isExistingClient ? 'Yes' : 'No'}</div>
                          <div><strong>Has Account:</strong> {client.hasUserAccount ? 'Yes' : 'No'}</div>
                          <div><strong>Responses Found:</strong> {existingQuestionnaireResponses.length}</div>
                          {existingQuestionnaireResponses.length > 0 && (
                            <div className="mt-2">
                              <strong>Response Details:</strong>
                              {existingQuestionnaireResponses.map((resp, idx) => (
                                <div key={idx} className="ml-2">
                                  • ID: {resp.id || resp._id} | Title: {resp.questionnaireTitle || 'Unknown'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                  
                  {existingQuestionnaireResponses.length > 0 ? (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-2">
                            <InfoIcon className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-700">
                              <strong>Great news!</strong> This client has previously completed questionnaires. 
                              You can save time by reusing their previous responses or assign a new questionnaire if needed.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-purple-50 border-purple-200 bg-white">
                            <input
                              type="radio"
                              name="responseChoice"
                              checked={useExistingResponse}
                              onChange={() => setUseExistingResponse(true)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${useExistingResponse ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                              {useExistingResponse && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-purple-800 block">✨ Use Previous Response</span>
                              <span className="text-xs text-purple-600">Reuse existing answers (Recommended)</span>
                            </div>
                          </label>
                          
                          <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border-gray-200 bg-white">
                            <input
                              type="radio"
                              name="responseChoice"
                              checked={!useExistingResponse}
                              onChange={() => {
                                setUseExistingResponse(false);
                                setSelectedExistingResponse('');
                                setClientResponses({});
                                setIsExistingResponse(false);
                              }}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${!useExistingResponse ? 'border-gray-600 bg-gray-600' : 'border-gray-300'}`}>
                              {!useExistingResponse && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-800 block">📝 Assign New Questionnaire</span>
                              <span className="text-xs text-gray-600">Start fresh with new questions</span>
                            </div>
                          </label>
                        </div>

                        {useExistingResponse && (
                          <div className="mt-4 p-4 bg-white border border-purple-200 rounded-lg">
                            <Select
                              id="existingResponse"
                              label="Select Previous Response to Reuse"
                              value={selectedExistingResponse}
                              onChange={(e) => {
                                console.log('🔄 DEBUG: Existing response dropdown changed:', {
                                  selectedValue: e.target.value,
                                  existingResponsesCount: existingQuestionnaireResponses.length,
                                  existingResponsesIds: existingQuestionnaireResponses.map(r => ({ id: r.id, _id: r._id }))
                                });
                                
                                setSelectedExistingResponse(e.target.value);
                                // When existing response is selected, populate the form fields
                                const response = existingQuestionnaireResponses.find(r => {
                                  const match = (r.id === e.target.value) || (r._id === e.target.value);
                                  console.log('🔍 DEBUG: Checking response match:', {
                                    responseId: r.id,
                                    response_Id: r._id,
                                    selectedValue: e.target.value,
                                    match
                                  });
                                  return match;
                                });
                                
                                console.log("EXISTING RESPONSE", response);
                                console.log('🔍 DEBUG: Response search result:', {
                                  found: !!response,
                                  hasResponses: !!(response && response.responses),
                                  responseKeys: response?.responses ? Object.keys(response.responses) : []
                                });
                                
                                if (response && response.responses) {
                                  setClientResponses(response.responses);
                                  setIsExistingResponse(true);
                                  console.log('✅ Previous questionnaire response loaded:', {
                                    responseId: response.id,
                                    questionnaireTitle: response.questionnaireTitle,
                                    responseCount: Object.keys(response.responses).length
                                  });
                                } else {
                                  console.warn('⚠️ DEBUG: No response found or response has no data');
                                }
                              }}
                              options={[
                                { value: '', label: '👆 Choose a previous response to reuse' },
                                ...existingQuestionnaireResponses.map(response => {
                                  const responseCount = Object.keys(response.responses || {}).length;
                                  const submittedDate = new Date(response.submittedAt || response.createdAt).toLocaleDateString();
                                  const isComplete = response.isComplete ? '✅' : '⚠️';
                                  const valueToUse = response.id || response._id;
                                  
                                  console.log('🔍 DEBUG: Creating option for response:', {
                                    responseId: response.id,
                                    response_Id: response._id,
                                    valueToUse,
                                    title: response.questionnaireTitle
                                  });
                                  
                                  return {
                                    value: valueToUse,
                                    label: `${isComplete} ${response.questionnaireTitle || 'Unknown Questionnaire'} - ${submittedDate} (${responseCount} answers)`
                                  };
                                })
                              ]}
                            />
                            {selectedExistingResponse && (() => {
                              const selectedResponse = existingQuestionnaireResponses.find(r => r.id === selectedExistingResponse);
                              return (
                                <div className="mt-3 space-y-3">
                                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0 mr-2">
                                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="text-sm text-green-700">
                                          <strong>Perfect!</strong> The previous responses have been loaded and will be reused for this new case.
                                          The original response will remain unchanged, and a new entry will be created for this case.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedResponse && selectedResponse.responses && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                      <h4 className="text-sm font-medium text-blue-900 mb-3">📋 Previous Response Details</h4>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {Object.entries(selectedResponse.responses).map(([questionKey, answer]) => (
                                          <div key={questionKey} className="bg-white p-2 rounded border border-blue-100">
                                            <div className="text-xs font-medium text-blue-700 mb-1">
                                              {questionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </div>
                                            <div className="text-sm text-gray-700">
                                              {typeof answer === 'object' ? JSON.stringify(answer, null, 2) : String(answer || 'No answer')}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="mt-3 pt-2 border-t border-blue-200">
                                        <div className="text-xs text-blue-600">
                                          <strong>Total responses:</strong> {Object.keys(selectedResponse.responses).length} answers
                                          {selectedResponse.submittedAt && (
                                            <span className="ml-3">
                                              <strong>Submitted:</strong> {new Date(selectedResponse.submittedAt).toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-2">
                            <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-yellow-700">
                              <strong>No previous responses found</strong> for this client. 
                              You'll need to assign a new questionnaire from the options above.
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                              Client ID: {client.clientId} | Email: {client.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            console.log('🔄 DEBUG: Manual refresh of questionnaire responses triggered');
                            console.log('🔄 DEBUG: Current client data:', {
                              clientId: client.clientId,
                              clientEmail: client.email,
                              clientName: client.name,
                              isExistingClient: client.isExistingClient,
                              hasUserAccount: client.hasUserAccount
                            });
                            
                            if (client.clientId) {
                              await fetchExistingQuestionnaireResponses(client.clientId);
                            } else {
                              console.warn('⚠️ DEBUG: No client ID available for refresh');
                              toast.error('No client ID available to fetch responses');
                            }
                          }}
                          className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Set due date (optional) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={caseData.dueDate || ''}
                  onChange={(e) => setCaseData({ ...caseData, dueDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The client will be asked to complete the questionnaire by this date.
                </p>
              </div>

              {/* Display case IDs for selected forms */}
              {selectedForms.length > 0 && Object.keys(formCaseIds).length > 0 && (
                <div className="mt-6 p-4 border border-green-200 rounded-lg bg-green-50">
                  <h4 className="font-medium text-green-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Case IDs for Selected Forms
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedForms.map(formName => (
                      formCaseIds[formName] && (
                        <div key={formName} className="flex justify-between items-center p-3 bg-white border border-green-200 rounded">
                          <div>
                            <div className="font-medium text-green-800">{formName}</div>
                            <div className="text-sm text-green-600">Form Type</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-green-900 bg-green-100 px-2 py-1 rounded text-sm">
                              {formatCaseId(formCaseIds[formName])}
                            </div>
                            <div className="text-xs text-green-600 mt-1">Case ID</div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                  <p className="text-sm text-green-700 mt-3">
                    These case IDs will be associated with the questionnaire responses and can be used to track each form separately.
                  </p>
                </div>
              )}

              {/* Client account status section */}
              {(() => {
                // COMPREHENSIVE DEBUG: Capture complete client state and component context
                const currentTimestamp = new Date().toISOString();
                const clientState = {
                  id: client.clientId,
                  name: client.name,
                  email: client.email,
                  isExistingClient: client.isExistingClient,
                  hasUserAccount: client.hasUserAccount,
                  role: client.role,
                  userType: client.userType,
                  // All client properties for debugging
                  completeClient: client
                };
                
                // EMERGENCY SAFETY CHECK: If we have a client ID and it's from selectedExistingClientId, force the flags
                const isDefinitelyExistingClient = (
                  selectedExistingClientId && 
                  client.email && 
                  client.email === selectedExistingClientId
                );
                
                if (isDefinitelyExistingClient && (client.isExistingClient !== true || client.hasUserAccount !== true)) {
                  console.log('🚨 DEBUG: EMERGENCY SAFETY - Detected existing client with undefined flags, FORCING correction:', {
                    selectedExistingClientId,
                    clientEmail: client.email,
                    emailMatch: client.email === selectedExistingClientId,
                    currentFlags: {
                      isExistingClient: client.isExistingClient,
                      hasUserAccount: client.hasUserAccount
                    },
                    forcingToTrue: true
                  });
                  
                  // Emergency correction moved to useEffect to avoid render cycle issues
                  console.log('Emergency correction will be handled by useEffect');
                }
                
                console.log('🔍 DEBUG: ========== ACCOUNT CREATION CONDITIONAL CHECK ==========');
                console.log('🔍 DEBUG: Account creation conditional check:', {
                  timestamp: currentTimestamp,
                  currentStep,
                  selectedExistingClientId,
                  isDefinitelyExistingClient,
                  isExistingClient: client.isExistingClient,
                  hasUserAccount: client.hasUserAccount,
                  hasSelectedExistingClientId: !!selectedExistingClientId,
                  willShowAccountCreation: !(client.isExistingClient || client.hasUserAccount || isDefinitelyExistingClient || selectedExistingClientId),
                  clientObject: clientState,
                  exactFlagValues: {
                    isExistingClientType: typeof client.isExistingClient,
                    isExistingClientValue: client.isExistingClient,
                    isExistingClientStrictBoolean: client.isExistingClient === true,
                    hasUserAccountType: typeof client.hasUserAccount,
                    hasUserAccountValue: client.hasUserAccount,
                    hasUserAccountStrictBoolean: client.hasUserAccount === true
                  },
                  conditionalResult: {
                    orCondition: (client.isExistingClient || client.hasUserAccount || selectedExistingClientId),
                    negatedCondition: !(client.isExistingClient || client.hasUserAccount || isDefinitelyExistingClient || selectedExistingClientId),
                    willShowExistingClient: (client.isExistingClient || client.hasUserAccount || isDefinitelyExistingClient || selectedExistingClientId),
                    willShowAccountCreation: !(client.isExistingClient || client.hasUserAccount || isDefinitelyExistingClient || selectedExistingClientId)
                  }
                });
                
                const isExistingClientAccount = (
                  client.isExistingClient || 
                  client.hasUserAccount || 
                  isDefinitelyExistingClient ||
                  selectedExistingClientId // Additional check for when existing client is selected
                );
                console.log('🔍 DEBUG: Final decision - isExistingClientAccount:', isExistingClientAccount);
                console.log('🔍 DEBUG: ================================================');
                
                return isExistingClientAccount;
              })() ? (
                // Show existing client info - no account creation needed
                <div className="mt-6 p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="text-sm font-medium text-green-800">
                      Existing Client Account Found
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {useExistingResponse ? (
                      <p className="text-sm text-green-700">
                        ✅ <strong>Using Previous Response:</strong> Will reuse existing questionnaire answers for new case {caseData.id || 'pending'}.
                      </p>
                    ) : (
                      <p className="text-sm text-green-700">
                        ✅ <strong>New Questionnaire:</strong> Will assign new questionnaire to existing client account.
                      </p>
                    )}
                    <p className="text-xs text-green-600 mt-2">
                      No account setup required - client already has access to the system.
                    </p>
                  </div>
                </div>
              ) : (
                // Show account creation section for new clients only
                <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="createClientAccount"
                    checked={clientCredentials.createAccount}
                    onChange={(e) => {
                      // When enabling account creation, generate a password automatically
                      if (e.target.checked && !clientCredentials.password) {
                        const generatedPassword = generateSecurePassword();
                        setClientCredentials({
                          ...clientCredentials,
                          createAccount: e.target.checked,
                          password: generatedPassword
                        });
                      } else {
                        setClientCredentials({ ...clientCredentials, createAccount: e.target.checked });
                      }
                    }}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor="createClientAccount" className="ml-2 text-sm font-medium text-blue-800">
                    Create client account for accessing questionnaires
                  </label>
                </div>

                {clientCredentials.createAccount && (
                  <div className="space-y-4">
                    <p className="text-sm text-blue-700">
                      This will create a login account for your client so they can access and complete the questionnaire
                      directly in the system.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={clientCredentials.email || client.email || ''}
                          onChange={(e) => {
                            // When email is entered and no password exists, generate one
                            if (e.target.value && !clientCredentials.password) {
                              const generatedPassword = generateSecurePassword();
                              setClientCredentials({
                                ...clientCredentials,
                                email: e.target.value,
                                password: generatedPassword
                              });
                            } else {
                              setClientCredentials({ ...clientCredentials, email: e.target.value });
                            }
                          }}
                          placeholder="client@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required={clientCredentials.createAccount}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Default is client's email from their profile
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={clientCredentials.password}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPassword = generateSecurePassword();
                              setClientCredentials({ ...clientCredentials, password: newPassword });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                          >
                            Regenerate
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          System-generated secure password for client access
                        </p>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-700">
                        <strong>Note:</strong> The client will receive an email with these login details to access their questionnaire.
                        Be sure to save this information as the password is encrypted and cannot be retrieved later.
                      </p>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {/* New button with disable/enable based on details entered */}
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    // Check if questionnaire details are entered or existing response is selected
                    if (useExistingResponse) {
                      if (selectedExistingResponse) {
                        console.log('🔄 DEBUG: Response Selected - saving workflow progress and calling handleQuestionnaireAssignment:', {
                          selectedExistingResponse,
                          clientName: client.name,
                          newCaseId: caseData.id || caseData._id,
                          useExistingResponse,
                          currentStates: {
                            useExistingResponse,
                            selectedExistingResponse,
                            selectedQuestionnaire
                          }
                        });
                        
                        // ENSURE STATE IS SET CORRECTLY BEFORE CALLING handleQuestionnaireAssignment
                        if (!useExistingResponse) {
                          console.log('⚠️ DEBUG: useExistingResponse was false, setting to true');
                          setUseExistingResponse(true);
                        }
                        
                        try {
                          // First save the workflow progress to backend
                          console.log('🔄 DEBUG: Saving workflow progress to backend before questionnaire assignment...');
                          const workflowData = await saveWorkflowProgressLocal();
                          console.log('✅ DEBUG: Workflow progress saved successfully:', workflowData?.workflowId);
                          
                          // CRITICAL FIX: Ensure selectedQuestionnaire is set BEFORE calling handleQuestionnaireAssignment
                          let finalSelectedQuestionnaire = selectedQuestionnaire;
                          
                          if (!finalSelectedQuestionnaire) {
                            console.log('⚠️ DEBUG: selectedQuestionnaire was empty, extracting from existing response');
                            const existingResponse = existingQuestionnaireResponses.find(r => r.id === selectedExistingResponse);
                            console.log('🔍 DEBUG: Found existing response for questionnaire ID extraction:', {
                              existingResponse,
                              questionnaireId: existingResponse?.questionnaireId,
                              questionnaire_id: existingResponse?.questionnaire_id,
                              questionnaire: existingResponse?.questionnaire,
                              questionnaireIdType: typeof existingResponse?.questionnaireId
                            });
                            
                            if (existingResponse?.questionnaireId) {
                              // Extract the actual ID string from questionnaireId (might be object or string)
                              let questionnaireIdToSet = existingResponse.questionnaireId;
                              if (typeof questionnaireIdToSet === 'object' && questionnaireIdToSet._id) {
                                questionnaireIdToSet = questionnaireIdToSet._id;
                              } else if (typeof questionnaireIdToSet === 'object' && questionnaireIdToSet.id) {
                                questionnaireIdToSet = questionnaireIdToSet.id;
                              }
                              
                              console.log('🔍 DEBUG: Extracted questionnaire ID to set:', {
                                original: existingResponse.questionnaireId,
                                extracted: questionnaireIdToSet,
                                isString: typeof questionnaireIdToSet === 'string'
                              });
                              
                              // Set both the state AND the local variable
                              finalSelectedQuestionnaire = questionnaireIdToSet;
                              setSelectedQuestionnaire(questionnaireIdToSet);
                              console.log('✅ DEBUG: Set selectedQuestionnaire to:', questionnaireIdToSet);
                            }
                          }
                          
                          // Verify we have the required values before proceeding
                          if (!finalSelectedQuestionnaire) {
                            console.error('❌ DEBUG: Still no selectedQuestionnaire after extraction attempts');
                            toast.error('Could not determine questionnaire for existing response');
                            return;
                          }
                          
                          // Add a longer delay to ensure state updates are processed
                          await new Promise(resolve => setTimeout(resolve, 200));
                          
                          // Then call the main questionnaire assignment handler which handles existing responses
                          console.log('🔄 DEBUG: About to call handleQuestionnaireAssignment with current state:', {
                            useExistingResponse,
                            selectedExistingResponse,
                            selectedQuestionnaire: finalSelectedQuestionnaire,
                            selectedQuestionnaireType: typeof finalSelectedQuestionnaire,
                            selectedQuestionnaireLength: finalSelectedQuestionnaire?.length || 0
                          });
                          await handleQuestionnaireAssignment();
                          
                          console.log('✅ DEBUG: Response Selected process completed successfully');
                          
                          // Mark submission as complete
                          setIsSubmissionComplete(true);
                          
                          // Navigate back to legal firm workflow screen after successful submission
                          setTimeout(() => {
                            // Option 1: Reset to start of workflow
                            setCurrentStep(0);
                            
                            // Option 2: Or redirect to workflow list/dashboard
                            // window.location.href = '/legal-firm-workflow';
                            
                            // Reset states for new workflow
                            setIsSubmissionComplete(false);
                            setUseExistingResponse(false);
                            setSelectedExistingResponse('');
                            setSelectedQuestionnaire('');
                            
                            // Show notification about returning to workflow start
                            toast.success('Returning to workflow start for new case creation', {
                              duration: 3000,
                              style: {
                                background: '#3B82F6',
                                color: 'white',
                              }
                            });
                          }, 3000); // Wait 3 seconds to show success message
                          
                        } catch (error) {
                          console.error('❌ ERROR: Failed during Response Selected process:', error);
                          toast.error('Failed to save workflow progress: ' + (error as Error).message);
                        }
                      } else {
                        toast.error('Please select a previous response first.');
                      }
                    } else if (selectedQuestionnaire) {
                      const questionnaire = availableQuestionnaires.find(q => {
                        const possibleIds = [q._id, q.id, q.originalId, q.name].filter(Boolean);
                        return q.apiQuestionnaire && q.id === selectedQuestionnaire || possibleIds.includes(selectedQuestionnaire);
                      });

                      if (questionnaire) {
                        console.log('🔄 DEBUG: New questionnaire selected - saving workflow progress and creating case...');
                        try {
                          // Save workflow progress for new questionnaire selection
                          const workflowData = await saveWorkflowProgressLocal();
                          console.log('✅ DEBUG: Workflow progress saved for new questionnaire:', workflowData?.workflowId);
                          
                          // IMPORTANT: Also call handleQuestionnaireAssignment to create the case
                          await handleQuestionnaireAssignment();
                          
                          console.log('✅ DEBUG: Questionnaire assigned and case created successfully');
                        } catch (error) {
                          console.error('❌ ERROR: Failed to save workflow progress for new questionnaire:', error);
                          toast.error('Failed to save workflow progress: ' + (error as Error).message);
                        }
                      } else {
                        toast.error('Please select a valid questionnaire first.');
                      }
                    } else {
                      toast.error('Please select a questionnaire or previous response first.');
                    }
                  }}
                  disabled={!selectedQuestionnaire && !(useExistingResponse && selectedExistingResponse) || isSubmissionComplete}
                  className={`${
                    (!selectedQuestionnaire && !(useExistingResponse && selectedExistingResponse)) || isSubmissionComplete
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSubmissionComplete ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-green-500">✅ Submitted Successfully</span>
                    </>
                  ) : (selectedQuestionnaire || (useExistingResponse && selectedExistingResponse)) ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {useExistingResponse ? 'Submit' : 'Details Complete'}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {useExistingResponse ? 'Response Required' : 'Details Required'}
                    </>
                  )}
                </Button>

                {isViewEditMode ? (
                  // Simple Next button in view/edit mode
                  <Button
                    onClick={handleNext}
                    disabled={!selectedQuestionnaire}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  selectedQuestionnaire && (() => {
                    // Enhanced flexible matching to find the selected questionnaire
                    const questionnaire = availableQuestionnaires.find(q => {
                      // Check all possible ID fields
                      const possibleIds = [
                        q._id,          // MongoDB ObjectId
                        q.id,           // Original ID or API ID
                        q.originalId,   // Original ID before conversion
                        q.name          // Fallback to name if used as ID
                      ].filter(Boolean); // Remove undefined/null values

                      // For API questionnaires, prioritize matching the q_ prefixed ID
                      if (q.apiQuestionnaire && q.id === selectedQuestionnaire) {

                        return true;
                      }

                      // Check if any of the possible IDs match
                      const matches = possibleIds.includes(selectedQuestionnaire);
                      if (matches) {

                      }
                      return matches;
                    });
                    const hasFields = questionnaire &&
                      (questionnaire.fields?.length > 0 || questionnaire.questions?.length > 0);

                    if (!hasFields) {
                      return (
                        <div className="flex items-center">
                          <Button
                            onClick={() => toast.error('This questionnaire has no questions defined. Please select another questionnaire.')}
                            className="bg-yellow-500 hover:bg-yellow-600"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            No Questions Available
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <Button
                        onClick={() => handleQuestionnaireAssignment()}
                        disabled={!selectedQuestionnaire}
                      >
                        {loading ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            Assign to Client & Continue
                            <Send className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  // Handles steps for existing responses
  const renderExistResponseStep = (step: number) => {
    switch (step) {
      case 0: // Review Responses (answers)
        return (
          // <div>Review Responses (answers)</div>
          <div className="space-y-6">

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Client Responses</h3>
              <p className="text-indigo-700">Review and fill out the questionnaire as the client would.</p>

              {Object.keys(clientResponses).length > 0 && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded p-2">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">Pre-filled with existing client responses ({Object.keys(clientResponses).length} fields)</span>
                  </div>
                </div>
              )}

              {/* Add filling status indicator */}
              {questionnaireAssignment && (() => {
                const questionnaire = availableQuestionnaires.find(q => {
                  const possibleIds = [q._id, q.id, q.originalId, q.name].filter(Boolean);
                  return q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId ||
                    possibleIds.includes(questionnaireAssignment.questionnaireId);
                });

                if (questionnaire) {
                  const questions = questionnaire.fields || questionnaire.questions || questionnaire.form?.fields || questionnaire.form?.questions || [];
                  const totalFields = questions.length;
                  const filledFields = questions.filter((q: any) => {
                    const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
                    const fieldLabel = q.label || q.question || q.name;
                    const value = clientResponses[fieldId] || clientResponses[fieldLabel];
                    return value !== undefined && value !== null && value !== '' &&
                      (!Array.isArray(value) || value.length > 0);
                  }).length;

                  return (
                    <div className="mt-3 flex items-center justify-between bg-white border border-gray-200 rounded p-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: filledFields === totalFields ? '#10b981' : filledFields > 0 ? '#f59e0b' : '#ef4444' }}></div>
                        <span className="text-sm font-medium text-gray-700">
                          Progress: {filledFields} of {totalFields} fields completed
                        </span>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${totalFields > 0 ? (filledFields / totalFields) * 100 : 0}%`,
                            backgroundColor: filledFields === totalFields ? '#10b981' : filledFields > 0 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

            </div>

            {questionnaireAssignment && (() => {

              // Enhanced flexible matching to find the assigned questionnaire
              const questionnaire = availableQuestionnaires.find(q => {
                // Check all possible ID fields
                const possibleIds = [
                  q._id,          // MongoDB ObjectId
                  q.id,           // Original ID or API ID
                  q.originalId,   // Original ID before conversion
                  q.name          // Fallback to name if used as ID
                ].filter(Boolean); // Remove undefined/null values

                // For API questionnaires, prioritize matching the q_ prefixed ID
                if (q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId) {

                  return true;
                }

                // Try exact matches first
                const exactMatch = possibleIds.includes(questionnaireAssignment.questionnaireId);
                if (exactMatch) {

                  return true;
                }

                // Try fuzzy matching for similar IDs (handle cases where IDs are very similar)
                const targetId = questionnaireAssignment.questionnaireId;
                const fuzzyMatch = possibleIds.some(id => {
                  if (!id || !targetId) return false;

                  // Remove 'q_' prefix if present and compare
                  const cleanId = id.replace(/^q_/, '');
                  const cleanTargetId = targetId.replace(/^q_/, '');

                  // Check if they're very similar (allowing for small differences)
                  const similarity = cleanId.substring(0, 20) === cleanTargetId.substring(0, 20);
                  if (similarity) {

                    return true;
                  }

                  return false;
                });

                return fuzzyMatch;
              });



              if (!questionnaire) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-800">
                      <p className="font-medium">No questionnaire found</p>
                      <p className="text-sm mt-1">
                        Looking for ID: {questionnaireAssignment.questionnaireId}
                      </p>
                      <p className="text-sm">
                        Available IDs: {availableQuestionnaires.map(q => q._id || q.id || q.name).join(', ')}
                      </p>
                    </div>
                  </div>
                );
              }

              // Try to find questions/fields in multiple possible locations
              let questions = questionnaire.fields ||
                questionnaire.questions ||
                questionnaire.form?.fields ||
                questionnaire.form?.questions ||
                [];

              // If API response format is detected
              if (questionnaire.id && questionnaire.id.startsWith('q_') && Array.isArray(questionnaire.fields)) {

                questions = questionnaire.fields;
              }

              if (!questions || questions.length === 0) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800">
                      <p className="font-medium">No questions found in this questionnaire</p>
                      <p className="text-sm mt-1">Questions array is empty or undefined</p>
                      <pre className="text-xs mt-2 bg-red-100 p-2 rounded">
                        {JSON.stringify(questionnaire, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              }
              return (
                <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{questionnaire.title || questionnaire.name}</h4>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {questionnaireAssignment.status}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {questions.map((q: any, idx: number) => {
                      // Log each field for debugging


                      // Ensure field has required properties
                      const fieldId = q.id || q._id || `field_${idx}`;
                      const fieldLabel = q.label || q.question || q.name || `Question ${idx + 1}`;
                      const fieldType = q.type || 'text';
                      const fieldOptions = q.options || [];

                      // Check if field is filled
                      const currentValue = clientResponses[fieldId] || clientResponses[fieldLabel];
                      const isFilled = currentValue !== undefined && currentValue !== null && currentValue !== '' &&
                        (!Array.isArray(currentValue) || currentValue.length > 0);
                      const isRequired = q.required === true;

                      // Determine field status styling
                      const getFieldStatusStyle = () => {
                        if (isFilled) {
                          return 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200';
                        } else if (isRequired) {
                          return 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200';
                        } else {
                          return 'border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-200';
                        }
                      };

                      const fieldStatusStyle = getFieldStatusStyle();

                      // Common field wrapper with status indicator
                      const FieldWrapper = ({ children, label }: { children: React.ReactNode, label: string }) => (
                        <div className="relative">
                          <div className="flex items-center mb-1">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-2 ${isFilled ? 'bg-green-500' : isRequired ? 'bg-red-500' : 'bg-gray-400'
                              }`}></div>
                            <label className="block text-sm font-medium text-gray-700">
                              {label}
                              {isRequired && <span className="text-red-500 ml-1">*</span>}
                              {isFilled && <span className="text-green-600 ml-2 text-xs">✓ Filled</span>}
                            </label>
                          </div>
                          <div className="relative">
                            {children}
                            {isFilled && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );

                      // Render input based on type
                      if (fieldType === 'date') {
                        return (
                          <FieldWrapper key={fieldId} label={fieldLabel}>
                            <Input
                              id={fieldId}
                              label=""
                              type="date"
                              value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
                              onChange={e => setClientResponses({
                                ...clientResponses,
                                [fieldId]: e.target.value
                              })}
                              className={fieldStatusStyle}
                            />
                          </FieldWrapper>
                        );
                      } else if (fieldType === 'select' && Array.isArray(fieldOptions)) {
                        return (
                          <FieldWrapper key={fieldId} label={fieldLabel}>
                            <Select
                              id={fieldId}
                              label=""
                              value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
                              onChange={e => setClientResponses({
                                ...clientResponses,
                                [fieldId]: e.target.value
                              })}
                              options={[
                                { value: '', label: 'Select an option' },
                                ...fieldOptions.map((opt: any) => ({ value: opt, label: opt }))
                              ]}
                              className={fieldStatusStyle}
                            />
                          </FieldWrapper>
                        );
                      } else if (fieldType === 'multiselect' && Array.isArray(fieldOptions)) {
                        return (
                          <FieldWrapper key={fieldId} label={fieldLabel}>
                            <select
                              multiple
                              className={`w-full px-3 py-2 border rounded-md ${fieldStatusStyle}`}
                              value={clientResponses[fieldId] || clientResponses[fieldLabel] || []}
                              onChange={e => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setClientResponses({
                                  ...clientResponses,
                                  [fieldId]: selected
                                });
                              }}
                            >
                              {fieldOptions.map((opt: any) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </FieldWrapper>
                        );
                      } else if (fieldType === 'checkbox' && Array.isArray(fieldOptions)) {
                        return (
                          <FieldWrapper key={fieldId} label={fieldLabel}>
                            <div className={`flex flex-wrap gap-4 p-3 border rounded-md ${fieldStatusStyle}`}>
                              {fieldOptions.map((opt: any) => (
                                <label key={opt} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(clientResponses[fieldId] || clientResponses[fieldLabel]) && (clientResponses[fieldId] || clientResponses[fieldLabel])?.includes(opt)}
                                    onChange={e => {
                                      const prev = Array.isArray(clientResponses[fieldId] || clientResponses[fieldLabel])
                                        ? (clientResponses[fieldId] || clientResponses[fieldLabel])
                                        : [];
                                      if (e.target.checked) {
                                        setClientResponses({
                                          ...clientResponses,
                                          [fieldId]: [...prev, opt]
                                        });
                                      } else {
                                        setClientResponses({
                                          ...clientResponses,
                                          [fieldId]: prev.filter((v: any) => v !== opt)
                                        });
                                      }
                                    }}
                                    className="mr-2"
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </FieldWrapper>
                        );
                      } else if (fieldType === 'radio' && Array.isArray(fieldOptions)) {
                        return (
                          <FieldWrapper key={fieldId} label={fieldLabel}>
                            <div className={`flex flex-wrap gap-4 p-3 border rounded-md ${fieldStatusStyle}`}>
                              {fieldOptions.map((opt: any) => (
                                <label key={opt} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={fieldId}
                                    value={opt}
                                    checked={clientResponses[fieldId] === opt}
                                    onChange={() => setClientResponses({
                                      ...clientResponses,
                                      [fieldId]: opt
                                    })}
                                    className="mr-2"
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </FieldWrapper>
                        );
                      } else if (fieldType === 'textarea') {
                        return (
                          <FieldWrapper key={fieldId} label={fieldLabel}>
                            <TextArea
                              id={fieldId}
                              label=""
                              value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
                              onChange={e => setClientResponses({
                                ...clientResponses,
                                [fieldId]: e.target.value
                              })}
                              rows={3}
                              className={fieldStatusStyle}
                            />
                          </FieldWrapper>
                        );
                      } else {
                        // Default to text input
                        return (
                          <FieldWrapper key={fieldId} label={fieldLabel}>
                            <Input
                              id={fieldId}
                              label=""
                              type={fieldType === 'email' ? 'email' : fieldType === 'number' ? 'number' : 'text'}
                              value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
                              onChange={e => setClientResponses({
                                ...clientResponses,
                                [fieldId]: e.target.value
                              })}
                              placeholder={q.placeholder || ''}
                              className={fieldStatusStyle}
                            />
                          </FieldWrapper>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Response Summary Card */}
            {questionnaireAssignment && (() => {
              const questionnaire = availableQuestionnaires.find(q => {
                const possibleIds = [q._id, q.id, q.originalId, q.name].filter(Boolean);
                return q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId ||
                  possibleIds.includes(questionnaireAssignment.questionnaireId);
              });

              if (questionnaire) {
                const questions = questionnaire.fields || questionnaire.questions || questionnaire.form?.fields || questionnaire.form?.questions || [];
                const filledFields = questions.filter((q: any) => {
                  const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
                  const fieldLabel = q.label || q.question || q.name;
                  const value = clientResponses[fieldId] || clientResponses[fieldLabel];
                  return value !== undefined && value !== null && value !== '' &&
                    (!Array.isArray(value) || value.length > 0);
                });
                const requiredFields = questions.filter((q: any) => q.required === true);
                const filledRequiredFields = requiredFields.filter((q: any) => {
                  const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
                  const fieldLabel = q.label || q.question || q.name;
                  const value = clientResponses[fieldId] || clientResponses[fieldLabel];
                  return value !== undefined && value !== null && value !== '' &&
                    (!Array.isArray(value) || value.length > 0);
                });

                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Response Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded p-3 border">
                        <div className="text-gray-600">Total Fields</div>
                        <div className="text-lg font-medium text-gray-900">{questions.length}</div>
                      </div>
                      <div className="bg-white rounded p-3 border">
                        <div className="text-gray-600">Filled Fields</div>
                        <div className={`text-lg font-medium ${filledFields.length === questions.length ? 'text-green-600' : 'text-yellow-600'}`}>
                          {filledFields.length}
                        </div>
                      </div>
                      <div className="bg-white rounded p-3 border">
                        <div className="text-gray-600">Required Fields</div>
                        <div className={`text-lg font-medium ${filledRequiredFields.length === requiredFields.length ? 'text-green-600' : 'text-red-600'}`}>
                          {filledRequiredFields.length} / {requiredFields.length}
                        </div>
                      </div>
                    </div>

                    {/* Missing Required Fields Warning */}
                    {filledRequiredFields.length < requiredFields.length && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-red-800 mb-1">Missing Required Fields:</div>
                            <ul className="text-red-700 space-y-1">
                              {requiredFields.filter((q: any) => {
                                const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
                                const fieldLabel = q.label || q.question || q.name;
                                const value = clientResponses[fieldId] || clientResponses[fieldLabel];
                                return value === undefined || value === null || value === '' ||
                                  (Array.isArray(value) && value.length === 0);
                              }).map((q: any, index: number) => (
                                <li key={index} className="flex items-center">
                                  <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                                  {q.label || q.question || q.name || 'Unnamed field'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completion Status */}
                    {filledRequiredFields.length === requiredFields.length && filledFields.length === questions.length && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">All fields completed! Ready to proceed.</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-end">
              {isViewEditMode ? (
                // Simple Next button in view/edit mode
                <Button
                  onClick={handleNext}
                  disabled={Object.keys(clientResponses).length === 0}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                // Original Response submission button in normal mode
                <Button
                  onClick={handleResponseSubmit}
                  disabled={Object.keys(clientResponses).length === 0}
                >
                  Responses Complete & Continue
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

          </div>
        );
      case 1: // All Details Summary
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-purple-900 mb-3 flex items-center">
                <ClipboardList className="w-6 h-6 mr-3" />
                Complete Workflow Details Summary
              </h3>
              <p className="text-purple-700 text-lg">All collected information at a glance</p>
            </div>

            {/* Workflow Overview */}
            {completeWorkflowDetails && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Workflow Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Workflow ID:</span>
                    <span className="ml-2 text-gray-600 font-mono">{completeWorkflowDetails._id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      completeWorkflowDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                      completeWorkflowDetails.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {completeWorkflowDetails.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(completeWorkflowDetails.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(completeWorkflowDetails.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Current Step:</span>
                    <span className="ml-2 text-gray-600">{completeWorkflowDetails.currentStep || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created By:</span>
                    <span className="ml-2 text-gray-600">
                      {completeWorkflowDetails.createdBy?.firstName} {completeWorkflowDetails.createdBy?.lastName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Client Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Client Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Full Name:</span>
                  <span className="ml-2 text-gray-900">{client.name || `${client.firstName} ${client.lastName}`}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-600">{client.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="ml-2 text-gray-600">{client.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date of Birth:</span>
                  <span className="ml-2 text-gray-600">
                    {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nationality:</span>
                  <span className="ml-2 text-gray-600">{client.nationality || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">SSN:</span>
                  <span className="ml-2 text-gray-600">{client.socialSecurityNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">A-Number:</span>
                  <span className="ml-2 text-gray-600">{client.alienRegistrationNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">USCIS Account:</span>
                  <span className="ml-2 text-gray-600">{client.uscisOnlineAccountNumber || 'Not provided'}</span>
                </div>
              </div>
              
              {/* Address Information - Separate Fields */}
              {client.address && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="font-medium text-gray-700 mb-3">Address Information:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {client.address.street && (
                      <div>
                        <span className="font-medium text-gray-700">Street:</span>
                        <span className="ml-2 text-gray-600">{client.address.street}</span>
                      </div>
                    )}
                    {client.address.aptSuiteFlr && (
                      <div>
                        <span className="font-medium text-gray-700">Apt/Suite/Flr:</span>
                        <span className="ml-2 text-gray-600">{client.address.aptSuiteFlr}</span>
                      </div>
                    )}
                    {client.address.aptNumber && (
                      <div>
                        <span className="font-medium text-gray-700">Apt Number:</span>
                        <span className="ml-2 text-gray-600">{client.address.aptNumber}</span>
                      </div>
                    )}
                    {client.address.city && (
                      <div>
                        <span className="font-medium text-gray-700">City:</span>
                        <span className="ml-2 text-gray-600">{client.address.city}</span>
                      </div>
                    )}
                    {client.address.state && (
                      <div>
                        <span className="font-medium text-gray-700">State:</span>
                        <span className="ml-2 text-gray-600">{client.address.state}</span>
                      </div>
                    )}
                    {client.address.province && client.address.province !== client.address.state && (
                      <div>
                        <span className="font-medium text-gray-700">Province:</span>
                        <span className="ml-2 text-gray-600">{client.address.province}</span>
                      </div>
                    )}
                    {client.address.zipCode && (
                      <div>
                        <span className="font-medium text-gray-700">ZIP Code:</span>
                        <span className="ml-2 text-gray-600">{client.address.zipCode}</span>
                      </div>
                    )}
                    {client.address.postalCode && client.address.postalCode !== client.address.zipCode && (
                      <div>
                        <span className="font-medium text-gray-700">Postal Code:</span>
                        <span className="ml-2 text-gray-600">{client.address.postalCode}</span>
                      </div>
                    )}
                    {client.address.country && (
                      <div>
                        <span className="font-medium text-gray-700">Country:</span>
                        <span className="ml-2 text-gray-600">{client.address.country}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Case Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Case Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Case Title:</span>
                  <span className="ml-2 text-gray-900">{caseData.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-2 text-gray-600">{caseData.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Subcategory:</span>
                  <span className="ml-2 text-gray-600">{caseData.subcategory}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    caseData.status === 'Active' ? 'bg-green-100 text-green-800' :
                    caseData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {caseData.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    caseData.priority === 'High' ? 'bg-red-100 text-red-800' :
                    caseData.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {caseData.priority}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Due Date:</span>
                  <span className="ml-2 text-gray-600">
                    {caseData.dueDate ? new Date(caseData.dueDate).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              </div>
              
              {caseData.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="font-medium text-gray-700 mb-2">Description:</h5>
                  <p className="text-sm text-gray-600">{caseData.description}</p>
                </div>
              )}
            </div>

            {/* Selected Forms and Case IDs */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Selected Forms & Case IDs
              </h4>
              <div className="space-y-3">
                {selectedForms.map(form => (
                  <div key={form} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-blue-500 mr-3" />
                      <span className="font-medium text-gray-900">{form}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Case ID: </span>
                      <span className="font-mono text-blue-600">{formCaseIds[form] || 'Not generated'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questionnaire Information */}
            {questionnaireAssignment && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2" />
                  Questionnaire Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Questionnaire:</span>
                    <span className="ml-2 text-gray-900">{questionnaireAssignment.questionnaireName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      questionnaireAssignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {questionnaireAssignment.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Assigned:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(questionnaireAssignment.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {questionnaireAssignment.completedAt && (
                    <div>
                      <span className="font-medium text-gray-700">Completed:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(questionnaireAssignment.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client Responses - Separate Section */}
            {Object.keys(clientResponses).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Client Responses
                </h4>
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(clientResponses).map(([key, value]) => (
                      <div key={key} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
                        <div className="font-semibold text-blue-900 text-sm mb-2">
                          {/* Convert field keys to readable titles */}
                          {key === 'First Name' ? 'First Name' :
                           key === 'City or Town' ? 'City or Town' :
                           key === 'Country' ? 'Country' :
                           key === 'Apt./Ste/Flr' ? 'Apt./Ste/Flr' :
                           key === 'Petitioner\'s Mailing Address Street Name and Number' ? 'Mailing Address' :
                           key === 'Postal Code' ? 'Postal Code' :
                           key === 'Province' ? 'Province' :
                           key === 'State' ? 'State' :
                           key === 'ZIP Code' ? 'ZIP Code' :
                           key.startsWith('field_') ? 
                             (key === 'field_1760076779170' ? 'First Name' :
                              key === 'field_1760076976522' ? 'Mailing Address' :
                              key === 'field_1760077016842' ? 'Apt./Ste/Flr' :
                              key === 'field_1760077133514' ? 'City or Town' :
                              key === 'field_1760077177161' ? 'State' :
                              key === 'field_1760077195817' ? 'ZIP Code' :
                              key === 'field_1760077233642' ? 'Province' :
                              key === 'field_1760077255418' ? 'Postal Code' :
                              key === 'field_1760077280434' ? 'Country' :
                              key) :
                           key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                          }
                        </div>
                        <div className="text-blue-800 text-sm bg-white p-2 rounded border">
                          {typeof value === 'object' && value !== null ? 
                            JSON.stringify(value, null, 2) : String(value || 'Not provided')
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Raw Workflow Data for Debugging */}
            {completeWorkflowDetails && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Complete Workflow Data (Debug)
                </h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
                  <pre>{JSON.stringify(completeWorkflowDetails, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button 
                onClick={handlePrevious} 
                variant="outline"
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700 flex items-center"
              >
                Continue to Auto-fill Forms
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );
      case 2: // Auto-fill Forms
        return (
          // <div>Auto-fill Forms</div>
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Auto-Fill Forms</h3>
              <p className="text-green-700">Generate completed forms with all collected information.</p>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Ready to Generate Forms</h4>

                <div className="space-y-3">
                  {selectedForms.map(form => (
                    <div key={form} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-500 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{form}</div>
                          <div className="text-sm text-gray-500">
                            Will be auto-filled with client and case data
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900">Auto-Fill Process</h5>
                      <p className="text-blue-700 text-sm mt-1">
                        The forms will be automatically filled with:
                      </p>
                      <ul className="text-blue-700 text-sm mt-2 ml-4 space-y-1">
                        <li>• Client personal information</li>
                        <li>• Address and contact details</li>
                        <li>• Questionnaire responses</li>
                        <li>• Case-specific information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Generate Forms Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Auto-Generate Forms</h4>
                <p className="text-gray-600 mb-4">
                  Use the advanced auto-generation feature to create forms with all collected data.
                </p>

                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleAutoGenerateForms}
                    disabled={generatingForms || selectedForms.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {generatingForms ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Auto-Generating Forms...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4 mr-2" />
                        Auto Generate Forms
                      </>
                    )}
                  </Button>
                </div>

                {/* Generated Forms Display */}
                {generatedForms.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900">Generated Forms</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedForms.map((form) => (
                        <div key={form.formName} className="border border-gray-200 rounded-lg p-4">
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-blue-500 mr-2" />
                              <span className="font-medium text-gray-900">{form.formName}</span>
                            </div>
                            <div className="flex items-center">
                              {form.status === 'generating' && (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              )}
                              {form.status === 'success' && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              {form.status === 'error' && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>

                          {form.status === 'generating' && (
                            <div className="text-sm text-blue-600">Generating...</div>
                          )}

                          {form.status === 'success' && (
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600">{form.fileName}</div>
                              
                              {/* Enhanced Percentage Display */}
                              <div className="space-y-2">
                                {/* Original Filled Percentage */}
                                {form.filledPercentage !== undefined && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Initial Fill:</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${form.filledPercentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {Math.round(form.filledPercentage)}%
                                    </span>
                                  </div>
                                )}

                              </div>

                              {/* Unfilled Fields Toggle */}
                              {form.unfilledFields && Object.keys(form.unfilledFields).length > 0 && (
                                <div className="space-y-2">
                                  <Button
                                    onClick={() => handleToggleUnfilledFields(form.formName)}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {showUnfilledFields[form.formName] ? 'Hide' : 'Show'} Unfilled Fields ({Object.keys(form.unfilledFields).length})
                                  </Button>
                                  
                                  {showUnfilledFields[form.formName] && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                      <h6 className="text-sm font-medium text-yellow-800 mb-2">Unfilled Fields:</h6>
                                      <div className="space-y-1">
                                        {Object.entries(form.unfilledFields).map(([fieldName, fieldValue]) => (
                                          <div key={fieldName} className="text-xs text-yellow-700">
                                            <span className="font-medium">{fieldName}:</span> {fieldValue || 'Empty'}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => handleDownloadForm(form.formName)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  onClick={() => handlePreviewForm(form.formName)}
                                  size="sm"
                                  variant="outline"
                                  disabled={loadingPreview[form.formName]}
                                >
                                  {loadingPreview[form.formName] ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <FileText className="w-4 h-4 mr-1" />
                                  )}
                                  {loadingPreview[form.formName] ? 'Loading...' : 'Preview'}
                                </Button>
                                <Button
                                  onClick={() => handleEditForm(form.formName)}
                                  size="sm"
                                  variant="outline"
                                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                >
                                  <Edit3 className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          )}

                          {form.status === 'error' && (
                            <div className="text-sm text-red-600">
                              Error: {form.error || 'Unknown error'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF Preview Modal */}
                {Object.entries(showPreview).map(([formName, isVisible]) => {
                  if (!isVisible) return null;
                  const form = generatedForms.find(f => f.formName === formName);
                  if (!form || form.status !== 'success') return null;

                  return (
                    <div key={formName} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-4 max-w-4xl w-full h-5/6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Preview: {formName}</h3>
                          <Button
                            onClick={() => handleClosePreview(formName)}
                            variant="outline"
                            size="sm"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="flex-1">
                          {form.blob ? (
                            <iframe
                              src={URL.createObjectURL(form.blob)}
                              className="w-full h-full border-0"
                              title={`Preview of ${formName}`}
                              onError={() => {
                                console.error('PDF preview failed to load');
                                toast.error('Failed to load PDF preview');
                              }}
                            />
                          ) : loadingPreview[formName] ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Loading PDF preview...</p>
                                <p className="text-sm text-gray-500 mt-2">
                                  Fetching fresh data from backend
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                                <p className="text-gray-600">No PDF data available</p>
                                <p className="text-sm text-gray-500 mt-2">
                                  Try refreshing the preview or regenerating the form
                                </p>
                                <Button
                                  onClick={() => handlePreviewForm(formName)}
                                  size="sm"
                                  className="mt-4"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Retry Preview
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* PDF Editor Modal */}
                {Object.entries(showEditor).map(([formName, isVisible]) => {
                  if (!isVisible) return null;
                  const form = generatedForms.find(f => f.formName === formName);
                  if (!form || form.status !== 'success') return null;

                  return (
                    <PdfEditor
                      key={formName}
                      pdfUrl={form.downloadUrl}
                      filename={form.fileName}
                      onClose={() => handleCloseEditor(formName)}
                      onSave={(editedPdfBlob) => handleSaveEditedPdf(formName, editedPdfBlob)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  const renderStepContent = () => {
    console.log('🎨 renderStepContent called:', { 
      isExistResponse, 
      currentStep,
      renderingFunction: isExistResponse ? 'renderExistResponseStep' : 'renderNewResponseStep'
    });
    
    if (isExistResponse) {
      console.log('🔄 Rendering existing response step:', currentStep);
      return renderExistResponseStep(currentStep);
    } else {
      console.log('🔄 Rendering new response step:', currentStep);
      return renderNewResponseStep(currentStep);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Legal Firm Workflow</h1>
              <p className="text-gray-600 mt-2">Complete immigration case management from client to forms</p>
            </div>

          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {isExistResponse ? (
              // Existing client response workflow
              EXIST_WORKFLOW_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                          'bg-white border-gray-300 text-gray-400'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 max-w-20">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // New client response workflow
              NEW_WORKFLOW_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                          'bg-white border-gray-300 text-gray-400'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 max-w-20">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (getWorkflowSteps().length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default LegalFirmWorkflow;
