import React, { useState, useEffect } from 'react';
import {
  Users, FileText, ClipboardList, Send, Download, CheckCircle,
  ArrowRight, ArrowLeft, User, Briefcase, FormInput,
  MessageSquare, FileCheck, AlertCircle, Clock, Info as InfoIcon,
  Loader, Loader2, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

import { validateMongoObjectId, isValidMongoObjectId, generateObjectId } from '../utils/idValidation';
import {
  generateMultipleCaseIdsFromAPI
} from '../utils/caseIdGenerator';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import { downloadFilledI130PDF } from '../utils/pdfUtils';
import {
  isQuestionnaireApiAvailable,
  getQuestionnaires
} from '../controllers/QuestionnaireControllers';
import {
  renderFormWithData,
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
import { getClients as fetchClientsFromAPI, getClientById, createCompanyClient, Client as APIClient } from '../controllers/ClientControllers';
import { getFormTemplates, getUscisFormNumbers, FormTemplate } from '../controllers/SettingsControllers';
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
  checkEmailExists,
  createFormDetails,
  assignQuestionnaireToFormDetails,
  fetchQuestionnaireAssignments,
  createQuestionnaireAssignment,
  submitImmigrationProcess,
  getWorkflowResumptionParams,
  clearWorkflowResumptionParams,
  generateMultipleCaseIds,
  validateFormData,
  formatCaseId,
  isApiEndpointAvailable,
  Case,
  QuestionnaireAssignment,
  FormData,
  WorkflowData,
  ImmigrationProcessPayload
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
      { id: 'immediate-relative', name: 'Immediate Relative (I-130)', forms: ['I-130', 'I-485'] },
      { id: 'family-preference', name: 'Family Preference Categories', forms: ['I-130', 'I-824'] },
      { id: 'adjustment-status', name: 'Adjustment of Status', forms: ['I-485', 'I-864'] }
    ]
  },
  {
    id: 'employment-based',
    name: 'Employment-Based Immigration',
    subcategories: [
      { id: 'professional-worker', name: 'Professional Worker (EB-2/EB-3)', forms: ['I-140', 'I-485'] },
      { id: 'temporary-worker', name: 'Temporary Worker', forms: ['I-129', 'I-94'] },
      { id: 'investment-based', name: 'Investment-Based (EB-5)', forms: ['I-526', 'I-485'] }
    ]
  },
  {
    id: 'citizenship',
    name: 'Citizenship & Naturalization',
    subcategories: [
      { id: 'naturalization', name: 'Naturalization Application', forms: ['N-400'] },
      { id: 'certificate-citizenship', name: 'Certificate of Citizenship', forms: ['N-600'] }
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
  { id: 'form-details', title: 'Form Details', icon: FormInput, description: 'Complete form information' },
  { id: 'auto-fill', title: 'Auto-fill Forms', icon: FileCheck, description: 'Generate completed forms' }
];

const LegalFirmWorkflow: React.FC = (): React.ReactElement => {
  // const navigate = useNavigate(); // Not used in current implementation
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Client data
  const [client, setClient] = useState<any>({
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
      country: 'United States'
    },
    dateOfBirth: '',
    nationality: '',
    status: 'active',
    createdAt: ''
  });

  // Existing clients (from API)
  const [existingClients, setExistingClients] = useState<Client[]>([]);
  const [selectedExistingClientId, setSelectedExistingClientId] = useState('');
  const [fetchingClients, setFetchingClients] = useState(false);

  // Case data
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
    createdAt: '',
    dueDate: '',
    startDate: '',
    expectedClosureDate: '',
    assignedAttorney: ''
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
  const [formDetails, setFormDetails] = useState<FormData[]>([]);

  // State for client credentials
  const [clientCredentials, setClientCredentials] = useState({
    email: '',  // Will be populated with client.email when needed
    password: '',
    createAccount: false
  });

  // State for form details ID (backend integration)
  const [formDetailsId, setFormDetailsId] = useState<string | null>(null);

  // State for auto-fill data from API
  // const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [autoFillEnabled] = useState(false);
  // const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [autoFillingFormDetails, setAutoFillingFormDetails] = useState(false);

  // State to track if we're in view/edit mode from QuestionnaireResponses
  const [isViewEditMode, setIsViewEditMode] = useState(false);

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
    status: 'generating' | 'success' | 'error';
    error?: string;
  }>>([]);
  const [generatingForms, setGeneratingForms] = useState(false);
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});

  // Function to get the appropriate workflow steps based on response type
  const getWorkflowSteps = () => {
    if (isExistResponse) {
      return EXIST_WORKFLOW_STEPS;
    }
    return NEW_WORKFLOW_STEPS;
  };

  // Load available questionnaires
  useEffect(() => {
    const loadQuestionnairesAndCheckPrefilledData = async () => {
      await loadQuestionnaires();
    };
    loadQuestionnairesAndCheckPrefilledData();
  }, []); 

  // Load available workflows for auto-fill on component mount
  useEffect(() => {
    const loadWorkflowsForAutoFill = async () => {
      await fetchWorkflowsFromAPI();
    };

    // Load workflows after a brief delay to allow other data to load first
    setTimeout(loadWorkflowsForAutoFill, 1000);
  }, []);

  // Auto-fill form details when user reaches step 6 (Form Details)
  useEffect(() => {
    const autoFillOnFormDetailsStep = async () => {
      if (currentStep === 6) { // Form Details step
        // Add a small delay to let the UI render first
        setTimeout(async () => {
          try {
            setAutoFillingFormDetails(true);

            // Fetch from actual API only
            const apiWorkflows = await fetchWorkflowsFromAPI();
            if (apiWorkflows && apiWorkflows.length > 0) {
              const response = { success: true, count: apiWorkflows.length, data: apiWorkflows };
              autoFillFromAPIResponse(response);
            } else {
              // No saved workflows found to auto-fill
            }
          } catch (error) {
            // Error auto-filling form details
          } finally {
            setAutoFillingFormDetails(false);
          }
        }, 500); // 500ms delay for smoother UX
      }
    };

    autoFillOnFormDetailsStep();
  }, [currentStep]); // Trigger when currentStep changes

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
        setSelectedQuestionnaire(workflowData.selectedQuestionnaire);
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

      // Check sessionStorage for workflow resumption
      const resumeData = sessionStorage.getItem('resumeWorkflow');
      if (resumeData) {
        try {
          const { workflowId } = JSON.parse(resumeData);

          resumeWorkflow(workflowId);
          sessionStorage.removeItem('resumeWorkflow');
        } catch (error) {

          sessionStorage.removeItem('resumeWorkflow');
        }
      }
    };

    // Delay check to allow questionnaires to load first
    setTimeout(checkForWorkflowResumption, 1000);
  }, []);

  // Separate effect to handle pre-filled data after questionnaires are loaded
  useEffect(() => {
    if (availableQuestionnaires.length === 0) return; // Wait for questionnaires to be loaded

    const workflowData = sessionStorage.getItem('legalFirmWorkflowData');
    if (workflowData) {
      try {
        const data = JSON.parse(workflowData);

        // Check if we have the questionnaire in our available questionnaires
        let foundQuestionnaire = availableQuestionnaires.find(q =>
          q._id === data.questionnaireId ||
          q.id === data.questionnaireId ||
          q.originalId === data.questionnaireId ||
          // Fuzzy matching for similar IDs
          (q.id && q.id.replace(/^q_/, '').substring(0, 20) === data.questionnaireId.replace(/^q_/, '').substring(0, 20))
        );

        // If not found and we have field data, create a temporary questionnaire
        if (!foundQuestionnaire) {
          // If we have fields from the response data, use them
          const fieldsToUse = data.fields && data.fields.length > 0 ? data.fields : [
            // Create basic fields from the existing responses
            ...Object.keys(data.existingResponses || {}).map((key, index) => ({
              id: key,
              type: 'text',
              label: `Question ${index + 1}`,
              question: key,
              required: false,
              options: []
            }))
          ];

          foundQuestionnaire = {
            _id: data.questionnaireId,
            id: data.questionnaireId,
            title: data.questionnaireTitle || 'Imported Questionnaire',
            description: 'Loaded from existing response data',
            category: 'imported',
            fields: fieldsToUse,
            apiQuestionnaire: true
          };

          // Add it to available questionnaires
          setAvailableQuestionnaires(prev => [...prev, foundQuestionnaire]);
        }

        // Auto-fill workflow steps progressively from step 2 to targetStep
        const autoFillSteps = async () => {
          // Step 1: Client Information (index 1)
          if (data.workflowClient) {
            setClient({
              id: data.clientId || '',
              name: data.workflowClient.name || `${data.workflowClient.firstName || ''} ${data.workflowClient.lastName || ''}`.trim(),
              firstName: data.workflowClient.firstName || data.clientName.split(' ')[0] || '',
              lastName: data.workflowClient.lastName || data.clientName.split(' ').slice(1).join(' ') || '',
              email: data.workflowClient.email || data.clientEmail,
              phone: data.workflowClient.phone || '',
              address: data.workflowClient.address || {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'United States'
              },
              dateOfBirth: data.workflowClient.dateOfBirth || '',
              nationality: data.workflowClient.nationality || '',
              status: 'active',
              createdAt: new Date().toISOString()
            });
          } else {
            // Fallback to basic client data
            setClient((prev: any) => ({
              ...prev,
              id: data.clientId,
              firstName: data.clientName.split(' ')[0] || '',
              lastName: data.clientName.split(' ').slice(1).join(' ') || '',
              email: data.clientEmail
            }));
          }

          // Step 2: Case Information (index 2)
          if (data.workflowCase) {
            setCaseData({
              id: data.workflowCase.id || data.workflowCase._id || generateObjectId(),
              _id: data.workflowCase._id || data.workflowCase.id,
              clientId: data.clientId,
              title: data.workflowCase.title || 'Case',
              description: data.workflowCase.description || '',
              category: data.workflowCase.category || 'family-based',
              subcategory: data.workflowCase.subcategory || '',
              status: data.workflowCase.status || 'draft',
              priority: data.workflowCase.priority || 'medium',
              assignedForms: [],
              questionnaires: [data.questionnaireId],
              createdAt: new Date().toISOString(),
              dueDate: data.workflowCase.dueDate || '',
              visaType: data.workflowCase.visaType || '',
              priorityDate: data.workflowCase.priorityDate || '',
              openDate: data.workflowCase.openDate || ''
            });
          }

          // Step 1: Form Selection (index 1)
          if (data.selectedForms && data.selectedForms.length > 0) {
            setSelectedForms(data.selectedForms);

            if (data.formCaseIds) {
              setFormCaseIds(data.formCaseIds);
            }
          }

          // Step 3: Questionnaire Assignment (index 3) 
          if (data.questionnaireId) {
            setSelectedQuestionnaire(data.questionnaireId);

            // Create a questionnaire assignment for the answers collection step
            const assignment: QuestionnaireAssignment = {
              id: data.originalAssignmentId || 'temp-assignment',
              caseId: data.workflowCase?.id || data.workflowCase?._id || '',
              clientId: data.clientId,
              questionnaireId: data.questionnaireId,
              questionnaireName: data.questionnaireTitle || 'Questionnaire',
              status: 'in-progress',
              assignedAt: new Date().toISOString(),
              responses: data.existingResponses || {},
              clientEmail: data.clientEmail,
              selectedForms: data.selectedForms || [],
              formCaseIds: data.formCaseIds || {}
            };

            setQuestionnaireAssignment(assignment);
          }

          // Step 4: Responses (index 4) - Set existing responses if in edit mode
          if (data.mode === 'edit' && data.existingResponses) {
            setClientResponses(data.existingResponses);

            // Set as existing response workflow
            setIsExistResponse(true);
            // setIsNewResponse(false);
          }

          // Set client credentials if available
          if (data.clientCredentials) {
            setClientCredentials({
              email: data.clientCredentials.email || data.clientEmail,
              password: '',
              createAccount: data.clientCredentials.createAccount || true
            });
          }

          // For existing responses, start at step 0 (Review Responses)
          // For new responses, start at step 1 (Client Information)
          const startStep = data.mode === 'edit' ? 0 : 1; // Review Responses for edit mode, Client Information for new
          const targetStepIndex = data.targetStep || (data.mode === 'edit' ? 2 : 6); // Default to Form Details for edit, Auto-fill for new

          setCurrentStep(startStep);

          // Show success message
          if (data.autoFillMode) {
            setIsViewEditMode(true); // Set view/edit mode for simple navigation
          } else if (data.mode === 'edit') {
            setIsExistResponse(true);
            // setIsNewResponse(false);
            toast.success(`Loaded existing responses for ${data.clientName}`);
          } else {
            // setIsNewResponse(true);
            setIsExistResponse(false);
          }
        };

        // Execute auto-fill after a small delay to ensure UI is ready
        setTimeout(autoFillSteps, 500);

        // Clear the session storage after using it
        sessionStorage.removeItem('legalFirmWorkflowData');

      } catch (error) {
        sessionStorage.removeItem('legalFirmWorkflowData');
      }
    }
  }, [availableQuestionnaires]);

  // Load available form templates for Select Forms screen
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingFormTemplates(true);
      try {
        // You may want to pass userId or params as needed
        // const response = await getFormTemplates('');
        const response = await getUscisFormNumbers();
        // setFormTemplates(response.data.templates || []);
        console.log("resonse ", response)
        // Map the API response to FormTemplate structure
        const mappedTemplates: FormTemplate[] = (response.data || []).map((form: any) => ({
          _id: form._id,
          name: form.title || form.formNumber,
          description: form.description || '',
          category: 'USCIS' as keyof typeof FORM_TEMPLATE_CATEGORIES,
          type: 'uscis' as keyof typeof FORM_TEMPLATE_TYPES,
          status: form.isActive ? 'active' as keyof typeof FORM_TEMPLATE_STATUS : 'inactive' as keyof typeof FORM_TEMPLATE_STATUS,
          fields: [], // Empty fields array for now
          version: '1.0',
          effectiveDate: form.createdAt || new Date().toISOString(),
          expirationDate: form.expirationDate,
          isActive: form.isActive || false,
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: form.createdAt || new Date().toISOString(),
          updatedAt: form.updatedAt || new Date().toISOString(),
          metadata: {
            uscisFormNumber: form.formNumber,
            uscisFormLink: form.detailsUrl,
            fee: form.fee,
            instructions: form.metadata?.instructions
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

      // Test API connection first
      const token = localStorage.getItem('token');

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
          if (client.id && isValidMongoObjectId(client.id)) {
            return {
              ...client,
              _id: client.id // Set _id to the valid ObjectId
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

        // No localStorage fallback - just set empty array
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
      const isAPIAvailable = await isQuestionnaireApiAvailable();

      if (isAPIAvailable) {
        const response = await getQuestionnaires({
          is_active: true,
          limit: 50
        });



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
      } else {
        // Fallback to demo questionnaires if nothing is available
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
          },
          {
            _id: '507f1f77bcf86cd799439013', // Valid MongoDB ObjectId for demo
            title: 'N-400 Naturalization Questionnaire',
            category: 'NATURALIZATION',
            description: 'Information needed for citizenship application',
            fields: [
              { id: 'residenceYears', type: 'number', label: 'Years as Permanent Resident', required: true },
              { id: 'absences', type: 'textarea', label: 'List all absences from the US', required: true },
              {
                id: 'criminalHistory', type: 'radio', label: 'Do you have any criminal history?', required: true,
                options: ['Yes', 'No']
              }
            ]
          }
        ];

        setAvailableQuestionnaires(demoQuestionnaires);
      }
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
        setTimeout(() => {
          const clientEmail = client.email || clientCredentials.email;
          findAndAutoFillWorkflow(clientEmail);
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
    // Use the firstName and lastName from the client state directly
    const firstName = client.firstName.trim();
    const lastName = client.lastName.trim();

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
        // Get companyId from attorney's localStorage
        const attorneyCompanyId = localStorage.getItem('companyId');
        if (!attorneyCompanyId) {
          throw new Error('Attorney company ID not found. Please ensure you are logged in as an attorney.');
        }

        // Get current user data for attorneyIds
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const attorneyIds = currentUser._id ? [currentUser._id] : [];

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
            country: client.address?.country || 'United States'
          },
          role: 'client',
          userType: 'companyClient',
          companyId: attorneyCompanyId, // Get from attorney's localStorage
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
                country: client.employment.currentEmployer.address.country || 'United States'
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
            country: client.address?.country || 'United States'
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
  //     clientId: client.id || client._id, // Use either id or _id
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
        return [];
      }

      // Request workflows from API
      const workflows = await fetchWorkflows({
        status: 'in-progress',
        limit: 50,
        offset: 0
      });

      if (workflows.length > 0) {
        return workflows;
      } else {
        return [];
      }

    } catch (error: any) {
      // If 404, the endpoint might not be available
      if (error.response?.status === 404) {
        // Server workflows endpoint not found
      } else if (error.response?.status === 401) {
        // Authentication failed
      } else {
        // Other API error
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

        workflows.forEach((workflow: any, index: number) => {
          

          if (workflow.client) {
            const client = workflow.client;
            const clientEmail = client.email?.toLowerCase();

            // Create a unique key using email or name
            const clientKey = clientEmail || `${client.firstName}_${client.lastName}`.toLowerCase();


            if (clientKey && !clientsMap.has(clientKey)) {
              // Ensure client has proper structure
              const processedClient = {
                _id: client.id || client._id || generateObjectId(),
                id: client.id || client._id || generateObjectId(),
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
                  country: 'United States'
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

  // Function to auto-fill workflow data from saved workflows
  const autoFillFromSavedWorkflow = async (workflowData: any) => {
    try {
      // Log workflow data for debugging

      // Auto-fill client data
      if (workflowData.client) {
        // Current client data

        const newClientData = {
          ...client,
          ...workflowData.client,
          // Ensure we don't overwrite with undefined values
          id: workflowData.client.id || client.id,
          _id: workflowData.client._id || client._id,
          name: workflowData.client.name || client.name,
          // Explicitly handle separate name fields
          firstName: workflowData.client.firstName || client.firstName,
          middleName: workflowData.client.middleName || client.middleName || '',
          lastName: workflowData.client.lastName || client.lastName,
          email: workflowData.client.email || client.email,
          phone: workflowData.client.phone || client.phone,
          // Explicitly handle complete address information
          address: {
            street: '',
            aptSuiteFlr: '',
            aptNumber: '',
            city: '',
            state: '',
            zipCode: '',
            province: '',
            postalCode: '',
            country: 'United States',
            ...(client.address || {}),
            ...(workflowData.client.address || {})
          },
          dateOfBirth: workflowData.client.dateOfBirth || client.dateOfBirth,
          nationality: workflowData.client.nationality || client.nationality
        };

        // Client data updated
        setClient(newClientData);
        // Client data auto-filled
      } else {
        // No client data to auto-fill
      }

      // Auto-fill case data
      if (workflowData.case) {
        // Current and new case data

        const newCaseData = {
          ...caseData,
          ...workflowData.case,
          // Ensure we don't overwrite with undefined values
          id: workflowData.case.id || caseData.id,
          _id: workflowData.case._id || caseData._id,
          title: workflowData.case.title || caseData.title,
          description: workflowData.case.description || caseData.description,
          category: workflowData.case.category || caseData.category,
          subcategory: workflowData.case.subcategory || caseData.subcategory,
          status: workflowData.case.status || caseData.status,
          priority: workflowData.case.priority || caseData.priority,
          dueDate: workflowData.case.dueDate || caseData.dueDate
        };

        // Case data updated
        setCaseData(newCaseData);
        // Case data auto-filled
      } else {
        // No case data to auto-fill
      }

      // Auto-fill selected forms
      if (workflowData.selectedForms && Array.isArray(workflowData.selectedForms)) {
        // Forms auto-filled
        setSelectedForms(workflowData.selectedForms);
      }

      // Auto-fill form case IDs
      if (workflowData.formCaseIds) {
        // Form case IDs auto-filled
        setFormCaseIds(workflowData.formCaseIds);
      }

      // Auto-fill questionnaire selection
      if (workflowData.selectedQuestionnaire) {
        // Questionnaire auto-filled
        setSelectedQuestionnaire(workflowData.selectedQuestionnaire);
      }

      // Auto-fill client credentials (without password for security)
      if (workflowData.clientCredentials) {
        // Client credentials auto-filled
        setClientCredentials({
          ...clientCredentials,
          email: workflowData.clientCredentials.email || clientCredentials.email,
          createAccount: workflowData.clientCredentials.createAccount || clientCredentials.createAccount,
          // Don't auto-fill password for security reasons
          password: clientCredentials.password
        });
      }

      // Auto-fill client responses if available
      if (workflowData.clientResponses && Object.keys(workflowData.clientResponses).length > 0) {
        // Client responses auto-filled
        setClientResponses({
          ...clientResponses,
          ...workflowData.clientResponses
        });
      }

      // Auto-fill questionnaire assignment if available
      if (workflowData.questionnaireAssignment) {
        // Questionnaire assignment auto-filled
        setQuestionnaireAssignment(workflowData.questionnaireAssignment);
      }

      // Auto-fill form details if available
      if (workflowData.formDetails && Array.isArray(workflowData.formDetails)) {
        // Form details auto-filled
        setFormDetails(workflowData.formDetails);
      }

      // Auto-fill current step (but don't go backwards)
      if (workflowData.currentStep && workflowData.currentStep > currentStep) {
        // Current step updated
        setCurrentStep(workflowData.currentStep);
      }

      // Workflow auto-fill complete
      // Workflow data auto-filled from saved progress

    } catch (error) {
      // Auto-fill error
      toast.error('Failed to auto-fill workflow data');
    }
  };

  // Function to find and auto-fill matching workflow
  const findAndAutoFillWorkflow = async (clientEmail?: string) => {
    try {
      // Search for matching workflows

      // Fetch workflows from API only
      // Fetching workflows from API
      const apiWorkflows = await fetchWorkflowsFromAPI();
      // API workflows summary

      // Use only API workflows
      const allWorkflows = apiWorkflows;
      // Total workflows available

      if (allWorkflows.length === 0) {
        // No workflows found
        toast('No saved workflows found to auto-fill from');
        return false;
      }

      // Searching for matching workflow


      // Find matching workflow by client email or most recent
      let matchingWorkflow = null;

      if (clientEmail) {
        // Searching by client email
        // Find by client email
        matchingWorkflow = allWorkflows.find((w: any) => {
          const workflowEmail = w.client?.email?.toLowerCase();
          const searchEmail = clientEmail.toLowerCase();
          // Email comparison
          return workflowEmail === searchEmail;
        });

        if (matchingWorkflow) {
          // Found matching workflow by email
        } else {
          // No workflow found for this email
        }
      }

      if (!matchingWorkflow) {
        // Looking for in-progress workflows
        const inProgressWorkflows = allWorkflows.filter((w: any) => w.status === 'in-progress');
        // Found in-progress workflows

        if (inProgressWorkflows.length > 0) {
          matchingWorkflow = inProgressWorkflows
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
          // Selected most recent workflow
        }
      }

      if (matchingWorkflow) {
        // Found workflow to auto-fill

        // Auto-filling workflow
        await autoFillFromSavedWorkflow(matchingWorkflow);
        return true;
      } else {
        // No matching workflow found
        toast('No matching workflow found for this client');
        return false;
      }

    } catch (error) {
      // Auto-fill error
      toast.error('Error during auto-fill: ' + (error as Error).message);
      return false;
    }
  };

  // Function to save all workflow progress before questionnaire assignment
  const saveWorkflowProgressLocal = async () => {
    try {
      // Prepare comprehensive workflow data
      const workflowData = {
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
        formTemplates: formTemplates.filter(template => selectedForms.includes(template.name)),

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



      // Check if we should save to API
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Save to API only
          const response = await saveWorkflowProgress(workflowData);


          // Store the workflow ID from API response
          if (response?.workflowId) {
            workflowData.workflowId = response.workflowId;
          }

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

  // Function to save form details to backend (Steps 1-4)
  const saveFormDetailsToBackend = async (step: number, additionalData?: any) => {
    try {


      const token = localStorage.getItem('token');
      if (!token) {

        return null;
      }

      // Prepare data based on step
      let requestData: any = {
        step,
        notes: `Workflow step ${step} completed`
      };

      // Add form details ID if updating existing record
      if (formDetailsId) {
        requestData.id = formDetailsId;
      }

      // Step-specific data
      switch (step) {
        case 1:
          // Client information step
          requestData.clientInfo = {
            name: client.name,
            firstName: client.firstName,
            middleName: client.middleName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            dateOfBirth: client.dateOfBirth,
            nationality: client.nationality,
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
            },
            clientId: client.id || client._id,
            status: client.status || 'active'
          };
          break;

        case 2:
          // Case information step
          requestData.caseInfo = {
            title: caseData.title,
            description: caseData.description,
            category: caseData.category,
            subcategory: caseData.subcategory,
            visaType: caseData.visaType,
            status: caseData.status,
            priority: caseData.priority,
            priorityDate: caseData.priorityDate,
            openDate: caseData.openDate,
            dueDate: caseData.dueDate,
            caseId: caseData.id || caseData._id
          };
          break;

        case 3:
          // Form selection step
          if (selectedForms.length > 0) {
            const selectedForm = selectedForms[0]; // Single form selection
            const formTemplate = formTemplates.find(t => t.name === selectedForm);

            requestData.selectedForm = selectedForm;
            requestData.formTemplate = formTemplate ? {
              name: formTemplate.name,
              title: formTemplate.name, // Use name as title fallback
              description: formTemplate.description,
              category: formTemplate.category
            } : null;
            requestData.formCaseId = formCaseIds[selectedForm]; // Single form case ID
          }
          break;

        case 4:
          // Questionnaire assignment step - will be handled separately
          break;
      }

      // Include additional data if provided
      if (additionalData) {
        requestData = { ...requestData, ...additionalData };
      }



      // Make API call
      const response = await createFormDetails({
        clientId: requestData.clientInfo?.clientId || '',
        formType: 'workflow-step',
        formData: requestData,
        status: 'draft'
      });



      // Store form details ID for future updates
      if (response?.id) {
        setFormDetailsId(response.id);

      }

      // Step data saved to server
      return response.data;

    } catch (error: any) {
      // Error saving to server

      const errorMessage = error.response?.data?.error || error.message || 'Failed to save to server';
      // Error details logged

      // Don't show error toast for non-critical failures
      if (error.response?.status !== 404) {
        toast.error(`Failed to save step ${step} to server: ${errorMessage}`, { duration: 3000 });
      }

      return null;
    }
  };

  // Function to assign questionnaire to form details (Step 3)
  const assignQuestionnaireToFormDetailsLocal = async (questionnaireId: string, tempPassword?: string): Promise<any> => {
    try {
      if (!formDetailsId) {

        return null;
      }



      const token = localStorage.getItem('token');
      if (!token) {

        return null;
      }

      const requestData = {
        questionnaireId,
        dueDate: caseData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Questionnaire assigned for ${caseData.category || 'immigration'} case`,
        tempPassword
      };



              // Make API call to assign questionnaire
        const response = await assignQuestionnaireToFormDetailsLocal(questionnaireId, tempPassword);



      // Questionnaire assigned and saved to server
      return response.data;

    } catch (error: any) {
      // Error assigning questionnaire

      const errorMessage = error.response?.data?.error || error.message || 'Failed to assign questionnaire';
      // Error details logged

      toast.error(`Failed to assign questionnaire: ${errorMessage}`, { duration: 3000 });
      return null;
    }
  };

  const handleQuestionnaireAssignment = async () => {
    if (!selectedQuestionnaire) return;

    // Check if client account creation is enabled
    if (!clientCredentials.createAccount) {
      toast.error('Client account creation must be enabled to assign questionnaires. Please check "Create Account" option and set a password.');
      return;
    }

    // Ensure password is available
    if (!clientCredentials.password) {
      toast.error('Password is required for client account creation. Please generate a password first.');
      return;
    }

    setLoading(true);

    // Declare assignmentData and clientUserId in outer scope so they're accessible in catch blocks
    let assignmentData: any = null;
    let clientUserId = undefined;

    try {
      // First, check if we need to create a client account
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

      // Call handleClientSubmit to create the client account if needed

      const createdUserId = await handleClientSubmit();


      // If client account creation is enabled, use the returned user ID
      if (clientCredentials.createAccount && createdUserId) {

        clientUserId = createdUserId;

      } else {

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
        if (q.apiQuestionnaire && q.id === selectedQuestionnaire) {

          return true;
        }

        // Check if any of the possible IDs match
        const matches = possibleIds.includes(selectedQuestionnaire);
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
        clientId,
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
        formType: selectedForms.length > 0 ? selectedForms[0] : undefined, // Use the first selected form as primary form type
        formCaseIdGenerated: selectedForms.length > 0 && formCaseIds[selectedForms[0]] ? formCaseIds[selectedForms[0]] : undefined // Use the case ID for the primary form
      };

      // Debug log the validated data before making the API call
      // Assignment data prepared

      // Check if we have an authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        // No authentication token
        toast.error('You must be logged in to assign questionnaires through the API. Will use local storage instead.');
        // Don't throw error, just set a flag to skip API call
        // Use API only - no localStorage fallback

        // Create assignment object (API only mode)
        const localAssignment: QuestionnaireAssignment = {
          id: `assignment_${Date.now()}`,
          caseId: caseData.id,
          clientId: client.id,
          questionnaireId: selectedQuestionnaire,
          questionnaireName: normalizedQ.title || normalizedQ.name || 'Questionnaire',
          status: 'pending',
          assignedAt: new Date().toISOString(),
          completedAt: undefined,
          responses: {},
          dueDate: caseData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: `Please complete this questionnaire for your ${caseData.category || 'immigration'} case.`,
          clientEmail: clientCredentials.email || client.email,
          clientUserId: clientUserId, // Include the created user account ID
          tempPassword: clientCredentials.createAccount ? clientCredentials.password : undefined, // Include password if account was created
          accountCreated: !!clientUserId, // Track whether user account was successfully created
          formCaseIds: formCaseIds,
          selectedForms: selectedForms,
          // Add form type and generated case ID for backend integration
          formType: selectedForms.length > 0 ? selectedForms[0] : undefined,
          formCaseIdGenerated: selectedForms.length > 0 && formCaseIds[selectedForms[0]] ? formCaseIds[selectedForms[0]] : undefined,
          // Include client name fields
          clientFirstName: client.firstName,
          clientMiddleName: client.middleName || '',
          clientLastName: client.lastName,
          clientFullName: client.name,
          // Include client address
          clientAddress: {
            street: client.address?.street || '',
            aptSuiteFlr: client.address?.aptSuiteFlr || '',
            aptNumber: client.address?.aptNumber || '',
            city: client.address?.city || '',
            state: client.address?.state || '',
            zipCode: client.address?.zipCode || '',
            province: client.address?.province || '',
            postalCode: client.address?.postalCode || '',
            country: client.address?.country || 'United States'
          },
          // Include other client info
          clientPhone: client.phone || '',
          clientDateOfBirth: client.dateOfBirth || '',
          clientNationality: client.nationality || ''
        };

        // Update state (no localStorage saving)
        setQuestionnaireAssignment(localAssignment);

        // Show success and proceed
        if (clientCredentials.createAccount && clientUserId) {
          toast.success(
            <div>
              <p>✅ Questionnaire "{normalizedQ.title || normalizedQ.name}" assigned to client {client.name}</p>
              <p className="text-sm mt-1">🔐 Client account created:</p>
              <p className="text-xs">Email: {clientCredentials.email || client.email}</p>
              <p className="text-xs">Password: {clientCredentials.password}</p>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.success(`Questionnaire "${normalizedQ.title || normalizedQ.name}" has been assigned to client ${client.name}.`);
        }
        setLoading(false);
        handleNext();
        return;
      }

      // Log the token (first 10 chars for security) to verify it exists


      // Use the controller to check if the API endpoint is available
      const endpointPath = LEGAL_WORKFLOW_ENDPOINTS.GET_QUESTIONNAIRE_ASSIGNMENTS;
      const endpointAvailable = await isApiEndpointAvailable(endpointPath);

      // Log and notify user about API availability


      if (!endpointAvailable) {
        toast.error('API endpoint not available. Assignment will be saved locally only.');
      }

      let assignment: QuestionnaireAssignment;
      // Track success state for future use

      // Only attempt API call if the endpoint is available
      if (endpointAvailable) {
        try {
          // Add debugging for the request




          // Send directly with fetch for creating the assignment
          const response = await createQuestionnaireAssignment(assignmentData);

          // Handle the response which returns json directly
          const responseId = response?.data?.id || response?.id || `assignment_${Date.now()}`;


          assignment = {
            id: responseId,
            caseId: caseData.id,
            clientId: client.id,
            questionnaireId: selectedQuestionnaire,
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
            formType: assignmentData.formType,
            formCaseIdGenerated: assignmentData.formCaseIdGenerated
          };

          // API save succeeded

        } catch (apiError: any) {

          throw apiError; // Re-throw to be caught by the main catch block
        }
      } else {
        // API not available, create assignment object only

        assignment = {
          id: `assignment_${Date.now()}`,
          caseId: caseData.id,
          clientId: client.id,
          questionnaireId: selectedQuestionnaire,
          questionnaireName: selectedQ?.title || selectedQ?.name || 'Questionnaire',
          status: 'pending',
          assignedAt: new Date().toISOString(),
          completedAt: undefined,
          responses: {},
          // Include fields from assignmentData
          dueDate: assignmentData.dueDate,
          notes: assignmentData.notes,
          clientEmail: assignmentData.clientEmail,
          clientUserId: assignmentData.clientUserId, // Include the created user account ID
          tempPassword: assignmentData.tempPassword, // Include password if account was created
          accountCreated: assignmentData.accountCreated, // Track whether user account was successfully created
          formCaseIds: assignmentData.formCaseIds,
          selectedForms: assignmentData.selectedForms,
          // Add form type and generated case ID for backend integration
          formType: assignmentData.formType,
          formCaseIdGenerated: assignmentData.formCaseIdGenerated
        };

        toast.error('API server not available. Assignment created but not saved.', { duration: 3000 });
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

      // Save questionnaire assignment to backend (Step 3)
      try {
        if (!formDetailsId) {
          throw new Error('Form details ID is required');
        }
        
        const backendResult = await assignQuestionnaireToFormDetails(
          formDetailsId,
          {
            questionnaireId,
            caseId: caseData.id || caseData._id || '',
            clientId: client.id || client._id || '',
            tempPassword: clientCredentials.createAccount ? clientCredentials.password : undefined
          }
        );

        if (backendResult) {

        } else {

        }
      } catch (error) {

        // Don't block the workflow for backend failures
      }

      // Save all accumulated workflow data to backend now
      try {



        // Save workflow progress
        await saveWorkflowProgressLocal();


        // All workflow data saved to server successfully

      } catch (error) {

        toast.error('Questionnaire assigned but some data may not be saved to server', { duration: 3000 });
      }

      // Move to next step
      handleNext();
    } catch (error: any) {


      // Display more specific error messages
      if (error?.message && error.message.includes('Invalid')) {
        // This is our validation error
        toast.error(error.message);
      } else if (error?.message && error.message.includes('Authentication required')) {
        // Authentication error
        toast.error('You must be logged in to assign questionnaires. Please log in first.');
        // Could navigate to login page here if needed
        // navigate('/login');
      } else if (error?.response?.status === 404 || error?.message?.includes('not found')) {
        // API endpoint not found - show simple message
        toast.error('API endpoint not found. Assignment saved locally.', { duration: 4000 });
      } else if (error?.response?.data?.error) {
        // This is an API error with details
        toast.error(`API Error: ${error.response.data.error}`);
      } else {
        // Generic fallback error
        toast.error('Failed to assign questionnaire. Using local storage as fallback.');
      }

      // Don't proceed to next step if it's an ID validation error
      if (error?.message && error.message.includes('Invalid')) {
        return;
      }

      // Create a local assignment as fallback

      // Enhanced flexible matching to find the selected questionnaire
      const selectedQ = availableQuestionnaires.find(q => {
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

      // Create a local assignment with the same data format as the API would return
      const localAssignment: QuestionnaireAssignment = {
        id: `assignment_${Date.now()}`,
        caseId: caseData.id,
        clientId: client.id,
        questionnaireId: selectedQuestionnaire,
        questionnaireName: selectedQ?.title || selectedQ?.name || 'Questionnaire',
        status: 'pending',
        assignedAt: new Date().toISOString(),
        completedAt: undefined,
        responses: {},
        // Include all fields from the assignment data if available
        dueDate: assignmentData ? assignmentData.dueDate : undefined,
        notes: assignmentData ? assignmentData.notes : undefined,
        clientEmail: assignmentData ? assignmentData.clientEmail : client.email,
        clientUserId: assignmentData ? assignmentData.clientUserId : clientUserId, // Include the created user account ID
        tempPassword: assignmentData ? assignmentData.tempPassword : (clientCredentials.createAccount ? clientCredentials.password : undefined), // Include password if account was created
        accountCreated: assignmentData ? assignmentData.accountCreated : !!clientUserId, // Track whether user account was successfully created
        formCaseIds: assignmentData ? assignmentData.formCaseIds : formCaseIds,
        selectedForms: assignmentData ? assignmentData.selectedForms : selectedForms
      };

      // Update the state with our local assignment
      setQuestionnaireAssignment(localAssignment);

      // Show warning message to the user that data is not persisted
      if (clientCredentials.createAccount && clientUserId) {
        toast.error(
          <div>
            <p>⚠️ Questionnaire "{selectedQ?.title || selectedQ?.name}" assigned to client {client.name} (not saved to server)</p>
            <p className="text-sm mt-1">🔐 Client account created:</p>
            <p className="text-xs">Email: {clientCredentials.email || client.email}</p>
            <p className="text-xs">Password: {clientCredentials.password}</p>
          </div>,
          { duration: 8000 }
        );
      } else {
        // Questionnaire assigned to client (local storage mode)
      }

      // Only proceed to next step if it's not an ID validation error
      handleNext();
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

  const handleFormDetailsSubmit = () => {
    handleNext();
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
        setSelectedQuestionnaire(workflowData.selectedQuestionnaire);
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

  // Save the workflow to backend when auto-filling forms (final step)
  const handleAutoFillForms = async () => {
    try {
      setLoading(true);

      // Prepare payload to match ImmigrationProcessPayload interface
      const payload: ImmigrationProcessPayload = {
        clientInfo: client,
        selectedForms: selectedForms || caseData.assignedForms || [],
        questionnaireResponses: clientResponses || {},
        formData: {
          categoryId: caseData.category,
          subcategoryId: caseData.subcategory,
          visaType: caseData.visaType || '',
          clientId: client.id,
          caseId: caseData.id,
          priorityDate: caseData.priorityDate || new Date().toISOString(),
          status: caseData.status || 'draft',
          assignedForms: selectedForms || caseData.assignedForms || [],
          questionnaires: caseData.questionnaires || (selectedQuestionnaire ? [selectedQuestionnaire] : []),
          questionnaireAssignment: questionnaireAssignment || null,
          formDetails: formDetails || [],
          steps: NEW_WORKFLOW_STEPS.map((step, idx) => ({
            id: step.id,
            title: step.title,
            description: step.description,
            status: idx < currentStep ? 'completed' : idx === currentStep ? 'current' : 'pending'
          })),
          createdAt: caseData.createdAt || new Date(),
          dueDate: caseData.dueDate || null
        }
      };

      // Call backend API to save the workflow process (correct endpoint)
              await submitImmigrationProcess(payload);
      // Workflow saved successfully

      // For I-130 form auto-fill (existing logic)
      if (selectedForms.includes('I-130')) {
        const i130Data = {
          relationshipType: caseData.subcategory && caseData.subcategory.includes('spouse') ? 'Spouse' : 'Child',
          petitionerFamilyName: client.lastName,
          petitionerGivenName: client.firstName,
          petitionerMiddleName: '',
          petitionerBirthCity: clientResponses.birthCity || '',
          petitionerBirthCountry: clientResponses.birthCountry || client.nationality,
          petitionerDateOfBirth: client.dateOfBirth,
          petitionerSex: clientResponses.gender || 'Male',
          petitionerMailingAddress: `${client.address?.street || ''}, ${client.address?.city || ''}, ${client.address?.state || ''} ${client.address?.zipCode || ''}`.trim(),
          petitionerCurrentStatus: 'U.S. Citizen',
          petitionerDaytimePhone: client.phone,
          petitionerEmail: client.email,
          beneficiaryFamilyName: clientResponses.beneficiaryLastName || '',
          beneficiaryGivenName: clientResponses.beneficiaryFirstName || '',
          beneficiaryMiddleName: clientResponses.beneficiaryMiddleName || '',
          beneficiaryBirthCity: clientResponses.beneficiaryBirthCity || '',
          beneficiaryBirthCountry: clientResponses.beneficiaryBirthCountry || '',
          beneficiaryDateOfBirth: clientResponses.beneficiaryDateOfBirth || '',
          beneficiarySex: clientResponses.beneficiaryGender || 'Female',
          beneficiaryMailingAddress: clientResponses.beneficiaryAddress || ''
        };
        await downloadFilledI130PDF(i130Data);
      }
      // Handle other forms similarly
    } catch (error) {
      console.error('Error saving workflow or generating forms:', error);
    } finally {
      setLoading(false);
    }
  };

  // New function to auto-generate forms using renderFormWithData
  const handleAutoGenerateForms = async () => {
    try {
      setGeneratingForms(true);
      setGeneratedForms([]);

      // Prepare comprehensive form data from all collected information
      const formData = {
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
        clientCountry: client.address?.country || 'United States',

        // Case information
        caseCategory: caseData.category || '',
        caseSubcategory: caseData.subcategory || '',
        visaType: caseData.visaType || '',
        priorityDate: caseData.priorityDate || '',

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

            // Generated form successfully
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
              <p className="text-gray-600 mb-4 text-center">Select an existing client to auto-load their information.</p>
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
                        .filter(c => typeof (c as any)._id === 'string' && (c as any)._id.length === 24 && (c as any).userType === 'companyClient')
                        .map(c => {
                          const anyClient = c as any;
                          return {
                            value: anyClient._id,
                            label: `${anyClient.name || ((anyClient.firstName || '') + ' ' + (anyClient.lastName || '')).trim()} (${anyClient.email || ''})`
                          };
                        })
                    ]}
                  />
                )}
              </div>
              <Button
                onClick={async () => {
                  if (!selectedExistingClientId) return;
                  setLoading(true);
                  try {
                    const fullClient = await getClientById(selectedExistingClientId);
                    const anyClient = fullClient as any;
                    const name = anyClient.name || ((anyClient.firstName || '') + ' ' + (anyClient.lastName || '')).trim();
                    setClient({ ...fullClient, name });
                    setCaseData(prev => ({ ...prev, clientId: selectedExistingClientId }));
                    setCurrentStep(2); // Advance immediately after fetching
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={!selectedExistingClientId || loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Use Selected Client'}
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
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
              <p className="text-blue-700">Enter the client's personal details to create their profile.</p>
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
                    value={client.address?.country || 'United States'}
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
                <Button onClick={handleNext} disabled={!client.name || !client.email}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                // Original Create Client button in normal mode
                <Button
                  onClick={async () => {
                    // Save client data to backend (Step 1)
                    try {
                      await saveFormDetailsToBackend(1);

                    } catch (error) {

                    }

                    // Simply advance to next step without creating client account
                    // Client account will only be created later if password is provided from questionnaire assignment
                    setCurrentStep(2);
                  }}
                  disabled={!client.name || !client.email}
                >
                  Create Client & Continue
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
                  options={[
                    { value: '', label: 'Select category' },
                    ...IMMIGRATION_CATEGORIES.map(cat => ({
                      value: cat.id,
                      label: cat.name
                    }))
                  ]}
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
                <Input
                  id="assignedAttorney"
                  label="Assigned Attorney"
                  placeholder="Enter attorney name"
                  value={caseData.assignedAttorney || ''}
                  onChange={e => setCaseData({ ...caseData, assignedAttorney: e.target.value })}
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
                  // Save case data to backend (Step 2)
                  try {
                    await saveFormDetailsToBackend(2);
                  } catch (error) {

                  }
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
                      <span className="font-medium text-green-800">Location:</span> {client.address.city}, {client.address.state || client.address.province}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-green-800">Client ID:</span> {client.id || client._id}
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
                      key={template.name}
                      onClick={() => {
                        if (selectedForms.includes(template.name)) {
                          setSelectedForms([]); // Deselect if clicking the same form
                        } else {
                          setSelectedForms([template.name]); // Select only this form
                        }
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedForms.includes(template.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{template.name}</h5>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                          <div className="text-xs text-gray-400 mt-1">Category: {template.category}</div>
                        </div>
                        {selectedForms.includes(template.name) && (
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

              {/* Client account creation section */}
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
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {/* New button with disable/enable based on details entered */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    // Check if questionnaire details are entered
                    if (selectedQuestionnaire) {
                      const questionnaire = availableQuestionnaires.find(q => {
                        const possibleIds = [q._id, q.id, q.originalId, q.name].filter(Boolean);
                        return q.apiQuestionnaire && q.id === selectedQuestionnaire || possibleIds.includes(selectedQuestionnaire);
                      });

                      if (questionnaire) {
                        toast.success('Questionnaire details are complete!');
                      } else {
                        toast.error('Please select a valid questionnaire first.');
                      }
                    } else {
                      toast.error('Please select a questionnaire first.');
                    }
                  }}
                  disabled={!selectedQuestionnaire}
                  className={`${!selectedQuestionnaire ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {selectedQuestionnaire ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Details Complete
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Details Required
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
                        onClick={handleQuestionnaireAssignment}
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
      case 1: // Form Details
        return (
          // <div>Form Details</div>
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-teal-900 mb-2">Form Details</h3>
              <p className="text-teal-700">Review all details filled so far before proceeding to auto-fill forms.</p>
            </div>

            {/* Auto-filling Progress Indicator */}
            {autoFillingFormDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <h4 className="text-sm font-medium text-blue-900">Auto-filling form details...</h4>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Loading data from saved workflow API response.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Selected Forms Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedForms.map(form => (
                  <div key={form} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">{form}</h5>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Will be auto-filled with client and case data
                    </p>
                    {formCaseIds[form] && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-xs text-blue-600">Case ID:</div>
                        <div className="text-sm font-mono text-blue-800">{formCaseIds[form]}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">All Details Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Client Name:</strong> {client.name}</div>
                  <div><strong>Email:</strong> {client.email}</div>
                  <div><strong>Phone:</strong> {client.phone}</div>
                  <div><strong>Date of Birth:</strong> {client.dateOfBirth}</div>
                  <div><strong>Nationality:</strong> {client.nationality}</div>
                  <div><strong>Address:</strong> {client.address?.street}, {client.address?.city}, {client.address?.state} {client.address?.zipCode}, {client.address?.country}</div>
                  <div><strong>Case Title:</strong> {caseData.title}</div>
                  <div><strong>Case Type:</strong> {caseData.type || caseData.visaType}</div>
                  <div><strong>Status:</strong> {caseData.status}</div>
                  <div><strong>Assigned Attorney:</strong> {caseData.assignedTo || 'Not assigned'}</div>
                  <div><strong>Open Date:</strong> {caseData.openDate}</div>
                  <div><strong>Priority Date:</strong> {caseData.priorityDate}</div>
                  <div><strong>Due Date:</strong> {caseData.dueDate || 'Not set'}</div>
                  <div><strong>Priority:</strong> {caseData.priority}</div>
                  <div><strong>Category:</strong> {IMMIGRATION_CATEGORIES.find(c => c.id === caseData.category)?.name || caseData.category}</div>
                  <div><strong>Subcategory:</strong> {caseData.subcategory}</div>
                  <div><strong>Visa Type:</strong> {caseData.visaType}</div>
                  <div className="md:col-span-2"><strong>Description:</strong> {caseData.description}</div>
                  {Object.keys(formCaseIds).length > 0 && (
                    <div className="md:col-span-2">
                      <strong>Form Case IDs:</strong>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(formCaseIds).map(([form, caseId]) => (
                          <div key={form} className="text-xs bg-gray-100 p-2 rounded">
                            <div className="font-medium">{form}:</div>
                            <div className="font-mono text-blue-600">{caseId}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Questionnaire responses summary with debugging */}
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

                    // Direct match first
                    if (possibleIds.includes(questionnaireAssignment.questionnaireId)) {
                      return true;
                    }

                    // For API questionnaires, prioritize matching the q_ prefixed ID
                    if (q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId) {
                      return true;
                    }

                    // Handle case where assignment has ID without q_ prefix but questionnaire has q_ prefix
                    if (q.id && q.id.startsWith('q_')) {
                      const idWithoutPrefix = q.id.substring(2); // Remove 'q_' prefix
                      if (idWithoutPrefix === questionnaireAssignment.questionnaireId) {
                        return true;
                      }
                      // Check if IDs are very similar (within 1-2 character difference)
                      if (Math.abs(idWithoutPrefix.length - questionnaireAssignment.questionnaireId.length) <= 2) {
                        const similarity = calculateStringSimilarity(idWithoutPrefix, questionnaireAssignment.questionnaireId);
                        if (similarity > 0.9) { // 90% similarity
                          return true;
                        }
                      }
                    }

                    // Handle case where assignment has ID with q_ prefix but questionnaire has no prefix
                    if (questionnaireAssignment.questionnaireId.startsWith('q_')) {
                      const assignmentIdWithoutPrefix = questionnaireAssignment.questionnaireId.substring(2);
                      if (possibleIds.includes(assignmentIdWithoutPrefix)) {
                        return true;
                      }
                    }

                    // Check by questionnaire name if it matches the assignment name
                    if (questionnaireAssignment.questionnaireName && (q.title || q.name)) {
                      const qName = (q.title || q.name).toLowerCase();
                      const assignmentName = questionnaireAssignment.questionnaireName.toLowerCase();
                      if (qName === assignmentName || qName.includes(assignmentName) || assignmentName.includes(qName)) {
                        return true;
                      }
                    }

                    return false;
                  });

                  // Helper function to calculate string similarity
                  function calculateStringSimilarity(str1: string, str2: string): number {
                    const longer = str1.length > str2.length ? str1 : str2;
                    const shorter = str1.length > str2.length ? str2 : str1;
                    const editDistance = getEditDistance(longer, shorter);
                    return (longer.length - editDistance) / longer.length;
                  }

                  // Helper function to calculate edit distance
                  function getEditDistance(str1: string, str2: string): number {
                    const matrix = [];
                    for (let i = 0; i <= str2.length; i++) {
                      matrix[i] = [i];
                    }
                    for (let j = 0; j <= str1.length; j++) {
                      matrix[0][j] = j;
                    }
                    for (let i = 1; i <= str2.length; i++) {
                      for (let j = 1; j <= str1.length; j++) {
                        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                          matrix[i][j] = matrix[i - 1][j - 1];
                        } else {
                          matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                          );
                        }
                      }
                    }
                    return matrix[str2.length][str1.length];
                  }


                  const questions = questionnaire ? (questionnaire.fields || questionnaire.questions) : [];
                  const hasResponses = Object.keys(clientResponses).length > 0;


                  // If no questionnaire found but we have an assignment, show debug info
                  if (!questionnaire) {
                    return (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <strong className="font-medium text-red-900 mb-2 block flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Questionnaire Not Found
                        </strong>
                        <div className="text-red-700 space-y-2">
                          <div>Assignment ID: {questionnaireAssignment.questionnaireId}</div>
                          <div>Assignment Name: {questionnaireAssignment.questionnaireName}</div>
                          <div>Available Questionnaires: {availableQuestionnaires.length}</div>
                          {hasResponses && (
                            <div>Client Responses: {Object.keys(clientResponses).length} answers found</div>
                          )}
                          <div className="mt-3">
                            <strong>Debug: Available Questionnaire IDs:</strong>
                            <ul className="list-disc list-inside mt-1 text-sm">
                              {availableQuestionnaires.map((q, idx) => (
                                <li key={idx}>
                                  {q.title || q.name} - ID: {q.id || q._id || 'No ID'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (!questions || questions.length === 0) {
                    return (
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <strong className="font-medium text-yellow-900 mb-2 block flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Questionnaire Information
                        </strong>
                        <div className="text-yellow-700 space-y-1">
                          <div>Questionnaire found: {questionnaire?.title || questionnaire?.name}</div>
                          <div>But no questions/fields defined.</div>
                          {hasResponses && (
                            <div className="mt-2 text-yellow-800">
                              <strong>However, {Object.keys(clientResponses).length} responses were found:</strong>
                              <div className="mt-1 max-h-32 overflow-y-auto bg-yellow-100 p-2 rounded text-sm">
                                {Object.entries(clientResponses).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <strong className="font-medium text-blue-900 mb-2 block flex items-center">
                          <ClipboardList className="w-5 h-5 mr-2" />
                          Questionnaire Responses
                          {isViewEditMode && (
                            <span className="ml-2 text-sm font-normal text-blue-700">(Edit Mode)</span>
                          )}
                        </strong>
                        <div className="text-blue-700 text-sm">
                          {questionnaire?.title || questionnaire?.name || 'Questionnaire'} - {questions.length} questions
                          {questionnaireAssignment.completedAt && (
                            <span className="ml-2 text-green-700">✓ Completed on {new Date(questionnaireAssignment.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {!hasResponses && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="text-gray-500 italic flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            No responses submitted yet. Client can access questionnaire to provide answers.
                          </div>
                        </div>
                      )}

                      {hasResponses && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900">Response Details</h5>
                            <span className="text-sm text-green-600 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {Object.keys(clientResponses).length} of {questions.length} answered
                            </span>
                          </div>

                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {questions.map((q: any, idx: number) => {
                              const key = q.id || q.label || `q_${idx}`;
                              const answer = clientResponses[key];
                              const hasAnswer = answer !== undefined && answer !== null && answer !== '';

                              let displayAnswer = '';
                              let answerClass = 'text-gray-900';

                              if (!hasAnswer) {
                                displayAnswer = 'Not answered';
                                answerClass = 'text-gray-400 italic';
                              } else if (Array.isArray(answer)) {
                                displayAnswer = answer.length > 0 ? answer.join(', ') : 'Not answered';
                                answerClass = answer.length > 0 ? 'text-gray-900' : 'text-gray-400 italic';
                              } else if (typeof answer === 'boolean') {
                                displayAnswer = answer ? 'Yes' : 'No';
                                answerClass = 'text-gray-900';
                              } else {
                                displayAnswer = answer.toString();
                                answerClass = 'text-gray-900';
                              }

                              return (
                                <div key={key} className="border-l-4 border-gray-200 pl-4 py-2 hover:border-blue-300 transition-colors">
                                  <div className="flex flex-col space-y-1">
                                    <div className="flex items-start justify-between">
                                      <span className="font-medium text-gray-700 text-sm">
                                        Q{idx + 1}: {q.label || q.question}
                                      </span>
                                      {hasAnswer && (
                                        <span className="text-green-500 ml-2">
                                          <CheckCircle className="w-4 h-4" />
                                        </span>
                                      )}
                                    </div>
                                    {q.description && (
                                      <p className="text-xs text-gray-500 italic">{q.description}</p>
                                    )}
                                    <div className="mt-1">
                                      <span className={`${answerClass} ${hasAnswer ? 'font-medium' : ''}`}>
                                        {displayAnswer}
                                      </span>
                                      {q.type && (
                                        <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                          {q.type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Summary stats */}

                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {isViewEditMode ? (
                // Simple Next button in view/edit mode
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                // Original Form Details submission button in normal mode
                <Button onClick={handleFormDetailsSubmit}>
                  Proceed to Auto-Fill
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
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

                  {!isViewEditMode && (
                    <Button
                      onClick={handleAutoFillForms}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Generating Forms...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Legacy Generate & Download
                        </>
                      )}
                    </Button>
                  )}
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
                              <div className="flex gap-2">
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
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  Preview
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
                          <iframe
                            src={form.downloadUrl}
                            className="w-full h-full border-0"
                            title={`Preview of ${formName}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {isViewEditMode ? (
                // Simple completion message in view/edit mode
                <Button
                  onClick={() => {
                    // Workflow review completed
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Complete Review
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={handleAutoGenerateForms}
                    disabled={generatingForms || selectedForms.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {generatingForms ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Auto-Generating...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4 mr-2" />
                        Auto Generate
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAutoFillForms}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Legacy Generate
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  const renderStepContent = () => {
    if (isExistResponse) {
      return renderExistResponseStep(currentStep);
    } else {
      return renderNewResponseStep(currentStep);
    }
  };


  // const renderStepContent = () => {
  //   const workflowSteps = getWorkflowSteps();

  //   // For existing responses, map the current step to the appropriate step in the workflow
  //   let actualStep = currentStep;
  //   if (isExistResponse) {
  //     // Map existing response workflow steps to the actual step content
  //     // EXIST_WORKFLOW_STEPS: ['answers', 'form-details', 'auto-fill']
  //     // WORKFLOW_STEPS: ['start', 'client', 'case', 'forms', 'questionnaire', 'answers', 'form-details', 'auto-fill']
  //     switch (currentStep) {
  //       case 0: // Review Responses (answers)
  //         actualStep = 5; // Map to answers step in full workflow
  //         break;
  //       case 1: // Form Details
  //         actualStep = 6; // Map to form-details step in full workflow
  //         break;
  //       case 2: // Auto-fill Forms
  //         actualStep = 7; // Map to auto-fill step in full workflow
  //         break;
  //       default:
  //         actualStep = currentStep;
  //     }
  //   }

  //   switch (actualStep) {
  //     case 0: // Start: New or Existing Client
  //       // Skip start step for existing responses
  //       if (isExistResponse) {
  //         return (
  //           <div className="space-y-8">
  //             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //               <h3 className="text-lg font-semibold text-blue-900 mb-2">Review Existing Responses</h3>
  //               <p className="text-blue-700">Review and edit existing client responses before proceeding to form details.</p>
  //             </div>
  //           </div>
  //         );
  //       }

  //       return (
  //         <div className="space-y-8">
  //           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-blue-900 mb-2">Start Workflow</h3>
  //             <p className="text-blue-700">Choose to create a new client or select an existing client to begin the workflow.</p>
  //           </div>
  //           <div className="flex flex-col md:flex-row gap-8">
  //             {/* New Client */}
  //             <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-between">
  //               <User className="w-10 h-10 text-blue-500 mb-2" />
  //               <h4 className="font-medium text-gray-900 mb-2">New Client</h4>
  //               <p className="text-gray-600 mb-4 text-center">Enter new client details and start a new case.</p>
  //               <Button onClick={() => setCurrentStep(1)} className="w-full">Create New Client</Button>
  //             </div>
  //             {/* Existing Client */}
  //             <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-between">
  //               <Users className="w-10 h-10 text-green-500 mb-2" />
  //               <h4 className="font-medium text-gray-900 mb-2">Existing Client</h4>
  //               <p className="text-gray-600 mb-4 text-center">Select an existing client to auto-load their information.</p>
  //               <div className="w-full mb-4">
  //                 {fetchingClients ? (
  //                   <div className="text-gray-500 text-center">Loading clients...</div>
  //                 ) : (
  //                   <Select
  //                     id="existingClient"
  //                     label="Select Client"
  //                     value={selectedExistingClientId}
  //                     onChange={e => {

  //                       setSelectedExistingClientId(e.target.value);
  //                     }}
  //                     options={[
  //                       { value: '', label: 'Choose a client' },
  //                       ...existingClients
  //                         .filter(c => typeof (c as any)._id === 'string' && (c as any)._id.length === 24)
  //                         .map(c => {
  //                           const anyClient = c as any;
  //                           return {
  //                             value: anyClient._id,
  //                             label: `${anyClient.name || ((anyClient.firstName || '') + ' ' + (anyClient.lastName || '')).trim()} (${anyClient.email || ''})`
  //                           };
  //                         })
  //                     ]}
  //                   />
  //                 )}
  //               </div>
  //               <Button
  //                 onClick={async () => {
  //                   if (!selectedExistingClientId) return;
  //                   setLoading(true);
  //                   try {
  //                     const fullClient = await getClientById(selectedExistingClientId);
  //                     const anyClient = fullClient as any;
  //                     const name = anyClient.name || ((anyClient.firstName || '') + ' ' + (anyClient.lastName || '')).trim();
  //                     setClient({ ...fullClient, name });
  //                     setCaseData(prev => ({ ...prev, clientId: selectedExistingClientId }));
  //                     setCurrentStep(2); // Advance immediately after fetching
  //                   } finally {
  //                     setLoading(false);
  //                   }
  //                 }}
  //                 disabled={!selectedExistingClientId || loading}
  //                 className="w-full"
  //               >
  //                 {loading ? 'Loading...' : 'Use Selected Client'}
  //               </Button>
  //             </div>
  //           </div>
  //         </div>
  //       );
        
  //     case 1: // Create Client
  //       // Skip client creation for existing responses
  //       if (isExistResponse) {
  //         return (
  //           <div className="space-y-6">
  //             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //               <h3 className="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
  //               <p className="text-blue-700">Client information is already available from existing responses.</p>
  //             </div>
  //           </div>
  //         );
  //       }

  //       return (
  //         <div className="space-y-6">
  //           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
  //             <p className="text-blue-700">Enter the client's personal details to create their profile.</p>
  //           </div>
  //           <div className="space-y-4">
  //             <h4 className="font-medium text-gray-900">Personal Information</h4>
  //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //               <Input
  //                 id="firstName"
  //                 label="First Name"
  //                 value={client.firstName}
  //                 onChange={(e) => {
  //                   const firstName = e.target.value;
  //                   const fullName = `${firstName} ${client.middleName || ''} ${client.lastName || ''}`.trim().replace(/\s+/g, ' ');
  //                   setClient({
  //                     ...client,
  //                     firstName: firstName,
  //                     name: fullName
  //                   });
  //                 }}
  //                 required
  //               />
  //               <Input
  //                 id="middleName"
  //                 label="Middle Name"
  //                 value={client.middleName}
  //                 onChange={(e) => {
  //                   const middleName = e.target.value;
  //                   const fullName = `${client.firstName || ''} ${middleName} ${client.lastName || ''}`.trim().replace(/\s+/g, ' ');
  //                   setClient({
  //                     ...client,
  //                     middleName: middleName,
  //                     name: fullName
  //                   });
  //                 }}
  //               />
  //               <Input
  //                 id="lastName"
  //                 label="Last Name"
  //                 value={client.lastName}
  //                 onChange={(e) => {
  //                   const lastName = e.target.value;
  //                   const fullName = `${client.firstName || ''} ${client.middleName || ''} ${lastName}`.trim().replace(/\s+/g, ' ');
  //                   setClient({
  //                     ...client,
  //                     lastName: lastName,
  //                     name: fullName
  //                   });
  //                 }}
  //                 required
  //               />
  //             </div>
  //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //               <Input
  //                 id="email"
  //                 label="Email Address"
  //                 type="email"
  //                 value={client.email}
  //                 onChange={(e) => setClient({ ...client, email: e.target.value })}
  //                 required
  //               />
  //               <Input
  //                 id="phone"
  //                 label="Phone Number"
  //                 value={client.phone}
  //                 onChange={(e) => setClient({ ...client, phone: e.target.value })}
  //                 required
  //               />
  //               <Input
  //                 id="dateOfBirth"
  //                 label="Date of Birth"
  //                 type="date"
  //                 value={client.dateOfBirth}
  //                 onChange={(e) => setClient({ ...client, dateOfBirth: e.target.value })}
  //                 required
  //               />
  //               <Input
  //                 id="nationality"
  //                 label="Nationality"
  //                 value={client.nationality}
  //                 onChange={(e) => setClient({ ...client, nationality: e.target.value })}
  //                 required
  //               />
  //             </div>
  //           </div>
  //           <div className="space-y-4">
  //             <h4 className="font-medium text-gray-900">Address Information</h4>
  //             <div className="grid grid-cols-1 gap-4">
  //               <Input
  //                 id="street"
  //                 label="Street Address"
  //                 value={client.address?.street || ''}
  //                 onChange={(e) => setClient({
  //                   ...client,
  //                   address: { ...(client.address || {}), street: e.target.value }
  //                 })}
  //                 placeholder="Enter street address"
  //               />
  //               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //                 <Select
  //                   id="aptSuiteFlr"
  //                   label="Apt/Suite/Flr"
  //                   value={client.address?.aptSuiteFlr || ''}
  //                   onChange={(e) => setClient({
  //                     ...client,
  //                     address: { ...(client.address || {}), aptSuiteFlr: e.target.value }
  //                   })}
  //                   options={[
  //                     { value: '', label: 'Select Type' },
  //                     { value: 'Apt', label: 'Apartment' },
  //                     { value: 'Suite', label: 'Suite' },
  //                     { value: 'Flr', label: 'Floor' },
  //                     { value: 'Unit', label: 'Unit' },
  //                     { value: 'Room', label: 'Room' }
  //                   ]}
  //                 />
  //                 <Input
  //                   id="aptNumber"
  //                   label="Apt/Suite Number"
  //                   value={client.address?.aptNumber || ''}
  //                   onChange={(e) => setClient({
  //                     ...client,
  //                     address: { ...(client.address || {}), aptNumber: e.target.value }
  //                   })}
  //                   placeholder="Enter number"
  //                 />
  //                 <div></div> {/* Empty div for spacing */}
  //               </div>
  //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                 <Input
  //                   id="city"
  //                   label="City"
  //                   value={client.address?.city || ''}
  //                   onChange={(e) => setClient({
  //                     ...client,
  //                     address: { ...(client.address || {}), city: e.target.value }
  //                   })}
  //                   required
  //                 />
  //                 <Input
  //                   id="state"
  //                   label="State/Province"
  //                   value={client.address?.state || client.address?.province || ''}
  //                   onChange={(e) => setClient({
  //                     ...client,
  //                     address: { ...(client.address || {}), state: e.target.value, province: e.target.value }
  //                   })}
  //                   required
  //                 />
  //               </div>
  //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                 <Input
  //                   id="zipCode"
  //                   label="ZIP/Postal Code"
  //                   value={client.address?.zipCode || client.address?.postalCode || ''}
  //                   onChange={(e) => setClient({
  //                     ...client,
  //                     address: { ...(client.address || {}), zipCode: e.target.value, postalCode: e.target.value }
  //                   })}
  //                   required
  //                 />
  //                 <Input
  //                   id="country"
  //                   label="Country"
  //                   value={client.address?.country || 'United States'}
  //                   onChange={(e) => setClient({
  //                     ...client,
  //                     address: { ...(client.address || {}), country: e.target.value }
  //                   })}
  //                   required
  //                 />
  //               </div>
  //             </div>
  //           </div>
  //           <div className="flex justify-between">
  //             <Button variant="outline" onClick={handlePrevious}>
  //               <ArrowLeft className="w-4 h-4 mr-2" />
  //               Back
  //             </Button>
  //             {isViewEditMode ? (
  //               // Simple Next button in view/edit mode
  //               <Button onClick={handleNext} disabled={!client.name || !client.email}>
  //                 Next
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             ) : (
  //               // Original Create Client button in normal mode
  //               <Button
  //                 onClick={async () => {
  //                   // Save client data to backend (Step 1)
  //                   try {
  //                     await saveFormDetailsToBackend(1);

  //                   } catch (error) {

  //                   }

  //                   // Simply advance to next step without creating client account
  //                   // Client account will only be created later if password is provided from questionnaire assignment
  //                   setCurrentStep(2);
  //                 }}
  //                 disabled={!client.name || !client.email}
  //               >
  //                 Create Client & Continue
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             )}
  //           </div>
  //         </div>
  //       );

  //     case 2: // Create Case
  //       // Skip case creation for existing responses
  //       if (isExistResponse) {
  //         return (
  //           <div className="space-y-6">
  //             <div className="bg-green-50 border border-green-200 rounded-lg p-4">
  //               <h3 className="text-lg font-semibold text-green-900 mb-2">Case Setup</h3>
  //               <p className="text-green-700">Case information is already available from existing responses.</p>
  //             </div>
  //           </div>
  //         );
  //       }

  //       return (
  //         <div className="space-y-6">
  //           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-green-900 mb-2">Case Setup</h3>
  //             <p className="text-green-700">Create a new case for client: <strong>{client.name}</strong></p>
  //           </div>
  //           <div className="bg-white rounded-lg shadow-md p-6">
  //             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //               <Input
  //                 id="title"
  //                 label="Case Title"
  //                 placeholder="Enter case title"
  //                 value={caseData.title || ''}
  //                 onChange={e => setCaseData({ ...caseData, title: e.target.value })}
  //                 required
  //               />
  //               <Select
  //                 id="category"
  //                 label="Immigration Category"
  //                 value={caseData.category || ''}
  //                 onChange={e => setCaseData({ ...caseData, category: e.target.value })}
  //                 options={[
  //                   { value: '', label: 'Select category' },
  //                   ...IMMIGRATION_CATEGORIES.map(cat => ({
  //                     value: cat.id,
  //                     label: cat.name
  //                   }))
  //                 ]}
  //                 required
  //               />
  //               <Select
  //                 id="subcategory"
  //                 label="Subcategory"
  //                 value={caseData.subcategory || ''}
  //                 onChange={e => setCaseData({ ...caseData, subcategory: e.target.value })}
  //                 options={[
  //                   { value: '', label: 'Select subcategory' },
  //                   ...(caseData.category ?
  //                     IMMIGRATION_CATEGORIES
  //                       .find(cat => cat.id === caseData.category)
  //                       ?.subcategories.map(sub => ({
  //                         value: sub.id,
  //                         label: sub.name
  //                       })) || []
  //                     : []
  //                   )
  //                 ]}
  //                 required
  //               />
  //               <Select
  //                 id="priority"
  //                 label="Priority"
  //                 value={caseData.priority}
  //                 onChange={e => setCaseData({ ...caseData, priority: e.target.value as "low" | "medium" | "high" })}
  //                 options={[
  //                   { value: 'low', label: 'Low' },
  //                   { value: 'medium', label: 'Medium' },
  //                   { value: 'high', label: 'High' },
  //                 ]}
  //                 required
  //               />
  //               <Select
  //                 id="status"
  //                 label="Status"
  //                 value={caseData.status}
  //                 onChange={e => setCaseData({ ...caseData, status: e.target.value as "draft" | "in-progress" | "review" | "completed" })}
  //                 options={[
  //                   { value: 'draft', label: 'Draft' },
  //                   { value: 'in-progress', label: 'In Progress' },
  //                   { value: 'review', label: 'Review' },
  //                   { value: 'completed', label: 'Completed' }
  //                 ]}
  //                 required
  //               />
  //               <Input
  //                 id="visaType"
  //                 label="Visa Type"
  //                 value={caseData.visaType || ''}
  //                 onChange={e => setCaseData({ ...caseData, visaType: e.target.value })}
  //                 placeholder="E.g., B-2, H-1B, L-1"
  //                 required
  //               />
  //               <Input
  //                 id="priorityDate"
  //                 label="Priority Date"
  //                 type="date"
  //                 value={caseData.priorityDate || ''}
  //                 onChange={e => setCaseData({ ...caseData, priorityDate: e.target.value })}
  //                 required
  //               />
  //               <Input
  //                 id="openDate"
  //                 label="Open Date"
  //                 type="date"
  //                 value={caseData.openDate || ''}
  //                 onChange={e => setCaseData({ ...caseData, openDate: e.target.value })}
  //                 required
  //               />
  //             </div>
  //             <div className="mt-4">
  //               <TextArea
  //                 id="description"
  //                 label="Description"
  //                 value={caseData.description}
  //                 onChange={e => setCaseData({ ...caseData, description: e.target.value })}
  //                 rows={4}
  //                 placeholder="Enter case description"
  //               />
  //             </div>
  //           </div>
  //           <div className="flex justify-between">
  //             <Button variant="outline" onClick={handlePrevious}>
  //               <ArrowLeft className="w-4 h-4 mr-2" />
  //               Back
  //             </Button>
  //             {isViewEditMode ? (
  //               // Simple Next button in view/edit mode
  //               <Button
  //                 onClick={handleNext}
  //                 disabled={
  //                   !caseData.title ||
  //                   !caseData.category ||
  //                   !caseData.status ||
  //                   !caseData.visaType ||
  //                   !caseData.priorityDate ||
  //                   !caseData.openDate
  //                 }
  //               >
  //                 Next
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             ) : (
  //               // Original Create Case button in normal mode
  //               <Button
  //                 onClick={handleCaseSubmit}
  //                 disabled={
  //                   !caseData.title ||
  //                   !caseData.category ||
  //                   !caseData.status ||
  //                   !caseData.visaType ||
  //                   !caseData.priorityDate ||
  //                   !caseData.openDate
  //                 }
  //               >
  //                 Create Case & Continue
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             )}
  //           </div>
  //         </div>
  //       );

  //     case 3: // Select Forms
  //       // Skip forms selection for existing responses
  //       if (isExistResponse) {
  //         return (
  //           <div className="space-y-6">
  //             <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
  //               <h3 className="text-lg font-semibold text-purple-900 mb-2">Required Form</h3>
  //               <p className="text-purple-700">Forms are already selected from existing responses.</p>
  //             </div>
  //           </div>
  //         );
  //       }

  //       return (
  //         <div className="space-y-6">
  //           <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-purple-900 mb-2">Required Form</h3>
  //             <p className="text-purple-700">Select the form required for this case based on the selected category.</p>
  //           </div>

  //           {/* Show form templates from backend */}
  //           <div className="space-y-4">
  //             <h4 className="font-medium text-gray-900">Available Form Templates</h4>
  //             {loadingFormTemplates ? (
  //               <div className="text-gray-500">Loading form templates...</div>
  //             ) : (
  //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                 {formTemplates.length === 0 ? (
  //                   <div className="text-gray-400">No form templates available.</div>
  //                 ) : (
  //                   formTemplates.map(template => (
  //                     <label key={template._id || template.name} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
  //                       <input
  //                         type="radio"
  //                         name="selectedForm"
  //                         checked={selectedForms.includes(template.name)}
  //                         onChange={(e) => {
  //                           if (e.target.checked) {
  //                             setSelectedForms([template.name]); // Only allow one form selection
  //                           }
  //                         }}
  //                         className="mr-3"
  //                       />
  //                       <div>
  //                         <div className="font-medium text-gray-900">{template.name}</div>
  //                         <div className="text-sm text-gray-500">{template.description}</div>
  //                         <div className="text-xs text-gray-400">Category: {template.category}</div>
  //                         {/* Show case ID if form is selected and case ID exists */}
  //                         {selectedForms.includes(template.name) && formCaseIds[template.name] && (
  //                           <div className="text-xs text-green-600 font-medium mt-1">
  //                             Case ID: {formatCaseId(formCaseIds[template.name])}
  //                           </div>
  //                         )}
  //                       </div>
  //                     </label>
  //                   ))
  //                 )}
  //               </div>
  //             )}
  //           </div>

  //           {/* Display generated case ID summary */}
  //           {selectedForms.length > 0 && Object.keys(formCaseIds).length > 0 && (
  //             <div className="bg-green-50 border border-green-200 rounded-lg p-4">
  //               <h4 className="font-medium text-green-900 mb-2">Generated Case ID</h4>
  //               <div className="space-y-2">
  //                 {selectedForms.map(formName => (
  //                   formCaseIds[formName] && (
  //                     <div key={formName} className="flex justify-between items-center text-sm">
  //                       <span className="text-green-700">{formName}:</span>
  //                       <span className="font-mono text-green-800 bg-green-100 px-2 py-1 rounded">
  //                         {formatCaseId(formCaseIds[formName])}
  //                       </span>
  //                     </div>
  //                   )
  //                 ))}
  //               </div>
  //             </div>
  //           )}

  //           <div className="flex justify-between">
  //             <Button variant="outline" onClick={handlePrevious}>
  //               <ArrowLeft className="w-4 h-4 mr-2" />
  //               Back
  //             </Button>
  //             {isViewEditMode ? (
  //               // Simple Next button in view/edit mode
  //               <Button
  //                 onClick={handleNext}
  //                 disabled={selectedForms.length === 0}
  //               >
  //                 Next
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             ) : (
  //               // Original Form submission button in normal mode
  //               <Button
  //                 onClick={handleFormsSubmit}
  //                 disabled={selectedForms.length === 0 || generatingCaseIds}
  //               >
  //                 {generatingCaseIds ? (
  //                   <>
  //                     <Loader className="w-4 h-4 mr-2 animate-spin" />
  //                     Generating Case ID...
  //                   </>
  //                 ) : (
  //                   <>
  //                     Confirm Form & Continue
  //                     <ArrowRight className="w-4 h-4 ml-2" />
  //                   </>
  //                 )}
  //               </Button>
  //             )}
  //           </div>
  //         </div>
  //       );

  //     case 4: // Assign Questionnaire (now using QuestionnaireBuilder/availableQuestionnaires)
  //       // Skip questionnaire assignment for existing responses
  //       if (isExistResponse) {
  //         return (
  //           <div className="space-y-6">
  //             <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
  //               <h3 className="text-lg font-semibold text-orange-900 mb-2">Assign Questionnaire</h3>
  //               <p className="text-orange-700">Questionnaire is already assigned and responses are available.</p>
  //             </div>
  //           </div>
  //         );
  //       }

  //       return (
  //         <div className="space-y-6">
  //           <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-orange-900 mb-2">Assign Questionnaire</h3>
  //             <p className="text-orange-700">Send a questionnaire to the client to collect required information.</p>
  //           </div>

  //           {/* Description of how questionnaires work */}
  //           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
  //             <div className="flex items-start">
  //               <div className="flex-shrink-0 mr-2">
  //                 <InfoIcon className="h-5 w-5 text-blue-500" />
  //               </div>
  //               <div>
  //                 <h4 className="font-medium text-blue-800 mb-1">How Client Questionnaires Work</h4>
  //                 <p className="text-blue-700 text-sm">
  //                   When you assign a questionnaire, the client will receive a notification and the questionnaire will
  //                   appear in their dashboard. They can fill it out at their convenience, and you'll be notified
  //                   once it's completed.
  //                 </p>
  //               </div>
  //             </div>
  //           </div>

  //           <div className="space-y-4">
  //             <Select
  //               id="questionnaire"
  //               label="Select Questionnaire"
  //               value={selectedQuestionnaire}
  //               onChange={(e) => {
  //                 const selectedId = e.target.value;

  //                 // Log all available questionnaires with their ID fields for debugging
  //                 // Available questionnaires logged

  //                 // Enhanced flexible matching to find the selected questionnaire
  //                 const selected = availableQuestionnaires.find(q => {
  //                   // Check all possible ID fields
  //                   const possibleIds = [
  //                     q._id,          // MongoDB ObjectId
  //                     q.id,           // Original ID or API ID
  //                     q.originalId,   // Original ID before conversion
  //                     q.name          // Fallback to name if used as ID
  //                   ].filter(Boolean); // Remove undefined/null values

  //                   // For API questionnaires, prioritize matching the q_ prefixed ID
  //                   if (q.apiQuestionnaire && q.id === selectedId) {
  //                     // API questionnaire match found
  //                     return true;
  //                   }

  //                   // Check if any of the possible IDs match
  //                   const matches = possibleIds.includes(selectedId);
  //                   if (matches) {
  //                     // Regular questionnaire match found
  //                   }
  //                   return matches;
  //                 });

  //                 // Selected questionnaire found
  //                 setSelectedQuestionnaire(selectedId);

  //                 // If not found, log a warning
  //                 if (!selected) {
  //                   // Selected questionnaire not found in available list
  //                 }
  //               }}
  //               options={[
  //                 { value: '', label: 'Choose a questionnaire' },
  //                 ...availableQuestionnaires
  //                   .filter(q => {
  //                     // Add debug for questionnaire categories
  //                     // Questionnaire category checking

  //                     if (!caseData.category) return true;
  //                     if (!q.category) return true;
  //                     // const catMap: Record<string, string> = {
  //                     //   'family-based': 'FAMILY_BASED',
  //                     //   'employment-based': 'EMPLOYMENT_BASED',
  //                     //   'citizenship': 'NATURALIZATION',
  //                     //   'asylum': 'ASYLUM',
  //                     //   'foia': 'FOIA',
  //                     //   'other': 'OTHER',
  //                     //   'assessment': 'ASSESSMENT',
  //                     // };
  //                     // Convert case category to questionnaire category if needed
  //                     // const mapped = catMap[caseData.category] || '';
  //                     // Make the category matching more lenient
  //                     return true; // Show all questionnaires for now regardless of category
  //                   })
  //                   .map(q => {
  //                     // First normalize the questionnaire structure to ensure consistent fields
  //                     const normalizedQ = normalizeQuestionnaireStructure(q);

  //                     // Handle ID resolution with preference for the original API ID format
  //                     let idToUse;
  //                     let wasConverted = false;

  //                     // For API format questionnaires, ALWAYS use the original q_ format ID
  //                     if (q.id && q.id.startsWith('q_')) {
  //                       idToUse = q.id;
  //                       // Using API format ID
  //                     }
  //                     // For questionnaires with an originalId, offer both options with preference for original
  //                     else if (normalizedQ.originalId) {
  //                       // Use the original ID for selection to maintain consistency with saved data
  //                       idToUse = normalizedQ.originalId;
  //                       wasConverted = true;
  //                       // Using original ID
  //                     }
  //                     // For normalized IDs, use that format
  //                     else if (normalizedQ._id) {
  //                       idToUse = normalizedQ._id;
  //                       // Using normalized ID
  //                     }
  //                     // Fall back to any available ID
  //                     else {
  //                       idToUse = normalizedQ._id || normalizedQ.id || normalizedQ.name || `q_${Date.now()}`;
  //                       // Using fallback ID
  //                     }

  //                     // Count questions
  //                     const fields = normalizedQ.fields || [];
  //                     const questionCount = fields.length;

  //                     // Log what's being added to the dropdown
  //                     // Questionnaire option prepared

  //                     return {
  //                       // Store all possible IDs to help with matching later
  //                       value: idToUse, // Use the resolved ID as primary value for selection
  //                       apiId: q.id && q.id.startsWith('q_') ? q.id : undefined,
  //                       mongoId: normalizedQ._id,
  //                       originalId: normalizedQ.originalId,
  //                       label: `${normalizedQ.title || normalizedQ.name || 'Untitled'} (${questionCount} questions)${wasConverted ? ' 🔄' : ''}`,
  //                       hasValidId: true, // Should always be valid now
  //                       wasConverted, // Flag if ID was converted
  //                       fields: fields.length > 0 // Flag to indicate if questions/fields exist
  //                     };
  //                   })
  //               ]}
  //               required
  //             />                {selectedQuestionnaire && (() => {
  //               // Enhanced flexible matching to find the selected questionnaire
  //               const questionnaire = availableQuestionnaires.find(q => {
  //                 // Check all possible ID fields
  //                 const possibleIds = [
  //                   q._id,          // MongoDB ObjectId
  //                   q.id,           // Original ID or API ID
  //                   q.originalId,   // Original ID before conversion
  //                   q.name          // Fallback to name if used as ID
  //                 ].filter(Boolean); // Remove undefined/null values

  //                 // For API questionnaires, prioritize matching the q_ prefixed ID
  //                 if (q.apiQuestionnaire && q.id === selectedQuestionnaire) {

  //                   return true;
  //                 }

  //                 // Check if any of the possible IDs match
  //                 const matches = possibleIds.includes(selectedQuestionnaire);
  //                 if (matches) {

  //                 }
  //                 return matches;
  //               });

  //               if (!questionnaire) {

  //                 return (
  //                   <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
  //                     <p className="text-yellow-700">Questionnaire not found. Please select a different questionnaire.</p>
  //                   </div>
  //                 );
  //               }

  //               // Questionnaire structure is valid
  //               let fields = questionnaire.fields || questionnaire.questions || [];

  //               // Special handling for API format questionnaires
  //               if (questionnaire.apiQuestionnaire ||
  //                 (questionnaire.id && questionnaire.id.startsWith('q_') && Array.isArray(questionnaire.fields))) {

  //                 fields = questionnaire.fields;
  //               }



  //               // Check if this is an API questionnaire or standard MongoDB questionnaire
  //               const isApiQuestionnaire = questionnaire.apiQuestionnaire ||
  //                 (questionnaire._id && questionnaire._id.startsWith('q_')) ||
  //                 (questionnaire.id && questionnaire.id.startsWith('q_'));
  //               const hasValidId = isApiQuestionnaire || (questionnaire._id && isValidMongoObjectId(questionnaire._id));
  //               const hasConvertedId = !!questionnaire.originalId;

  //               return (
  //                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
  //                   <div className="flex justify-between items-center mb-2">
  //                     <h4 className="font-medium text-gray-900">Questionnaire Preview</h4>
  //                     {!hasValidId && (
  //                       <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center">
  //                         <AlertCircle size={12} className="mr-1" /> Invalid ID Format
  //                       </span>
  //                     )}
  //                     {hasConvertedId && (
  //                       <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
  //                         <CheckCircle size={12} className="mr-1" /> ID Converted for Backend
  //                       </span>
  //                     )}
  //                   </div>

  //                   <p className="text-gray-700 mb-2">{questionnaire.description || 'No description provided.'}</p>

  //                   <div className="flex items-center text-sm text-gray-500 mb-2">
  //                     <ClipboardList className="w-4 h-4 mr-2" />
  //                     This questionnaire contains {fields.length} questions
  //                   </div>

  //                   {fields.length > 0 ? (
  //                     <div className="max-h-60 overflow-y-auto border border-gray-200 rounded bg-white p-2">
  //                       <ul className="space-y-2">
  //                         {fields.map((field: any, idx: number) => {
  //                           const fieldId = field.id || field._id || `field_${idx}`;
  //                           const fieldLabel = field.label || field.question || `Question ${idx + 1}`;
  //                           const fieldType = field.type || 'text';

  //                           return (
  //                             <li key={fieldId} className="py-1 px-2 hover:bg-gray-50 rounded">
  //                               <div className="flex items-center">
  //                                 <span className="text-primary-600 font-semibold mr-2">{idx + 1}.</span>
  //                                 <span className="flex-grow">{fieldLabel}</span>
  //                                 <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
  //                                   {fieldType}
  //                                 </span>
  //                               </div>
  //                               {(field.description || field.help_text) && (
  //                                 <p className="text-xs text-gray-500 mt-1 ml-6">{field.description || field.help_text}</p>
  //                               )}
  //                             </li>
  //                           );
  //                         })}
  //                       </ul>
  //                     </div>
  //                   ) : (
  //                     <div className="text-center py-6 border border-dashed border-gray-300 bg-white rounded">
  //                       <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
  //                       <p className="text-sm text-gray-500">No questions defined in this questionnaire.</p>
  //                       <p className="text-xs text-gray-400 mt-1">
  //                         This questionnaire may be incomplete or malformed.
  //                       </p>
  //                     </div>
  //                   )}
  //                 </div>
  //               );
  //             })()}

  //             {/* Set due date (optional) */}
  //             <div className="mt-4">
  //               <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
  //               <input
  //                 type="date"
  //                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
  //                 value={caseData.dueDate || ''}
  //                 onChange={(e) => setCaseData({ ...caseData, dueDate: e.target.value })}
  //               />
  //               <p className="text-xs text-gray-500 mt-1">
  //                 The client will be asked to complete the questionnaire by this date.
  //               </p>
  //             </div>

  //             {/* Display case IDs for selected forms */}
  //             {selectedForms.length > 0 && Object.keys(formCaseIds).length > 0 && (
  //               <div className="mt-6 p-4 border border-green-200 rounded-lg bg-green-50">
  //                 <h4 className="font-medium text-green-900 mb-3 flex items-center">
  //                   <FileText className="w-4 h-4 mr-2" />
  //                   Case IDs for Selected Forms
  //                 </h4>
  //                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  //                   {selectedForms.map(formName => (
  //                     formCaseIds[formName] && (
  //                       <div key={formName} className="flex justify-between items-center p-3 bg-white border border-green-200 rounded">
  //                         <div>
  //                           <div className="font-medium text-green-800">{formName}</div>
  //                           <div className="text-sm text-green-600">Form Type</div>
  //                         </div>
  //                         <div className="text-right">
  //                           <div className="font-mono text-green-900 bg-green-100 px-2 py-1 rounded text-sm">
  //                             {formatCaseId(formCaseIds[formName])}
  //                           </div>
  //                           <div className="text-xs text-green-600 mt-1">Case ID</div>
  //                         </div>
  //                       </div>
  //                     )
  //                   ))}
  //                 </div>
  //                 <p className="text-sm text-green-700 mt-3">
  //                   These case IDs will be associated with the questionnaire responses and can be used to track each form separately.
  //                 </p>
  //               </div>
  //             )}

  //             {/* Client account creation section */}
  //             <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
  //               <div className="flex items-center mb-4">
  //                 <input
  //                   type="checkbox"
  //                   id="createClientAccount"
  //                   checked={clientCredentials.createAccount}
  //                   onChange={(e) => {
  //                     // When enabling account creation, generate a password automatically
  //                     if (e.target.checked && !clientCredentials.password) {
  //                       const generatedPassword = generateSecurePassword();
  //                       setClientCredentials({
  //                         ...clientCredentials,
  //                         createAccount: e.target.checked,
  //                         password: generatedPassword
  //                       });
  //                     } else {
  //                       setClientCredentials({ ...clientCredentials, createAccount: e.target.checked });
  //                     }
  //                   }}
  //                   className="h-4 w-4 text-primary-600 border-gray-300 rounded"
  //                 />
  //                 <label htmlFor="createClientAccount" className="ml-2 text-sm font-medium text-blue-800">
  //                   Create client account for accessing questionnaires
  //                 </label>
  //               </div>

  //               {clientCredentials.createAccount && (
  //                 <div className="space-y-4">
  //                   <p className="text-sm text-blue-700">
  //                     This will create a login account for your client so they can access and complete the questionnaire
  //                     directly in the system.
  //                   </p>
  //                   <div className="grid grid-cols-1 gap-4">
  //                     <div>
  //                       <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
  //                       <input
  //                         type="email"
  //                         value={clientCredentials.email || client.email || ''}
  //                         onChange={(e) => {
  //                           // When email is entered and no password exists, generate one
  //                           if (e.target.value && !clientCredentials.password) {
  //                             const generatedPassword = generateSecurePassword();
  //                             setClientCredentials({
  //                               ...clientCredentials,
  //                               email: e.target.value,
  //                               password: generatedPassword
  //                             });
  //                           } else {
  //                             setClientCredentials({ ...clientCredentials, email: e.target.value });
  //                           }
  //                         }}
  //                         placeholder="client@example.com"
  //                         className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
  //                         required={clientCredentials.createAccount}
  //                       />
  //                       <p className="text-xs text-gray-500 mt-1">
  //                         Default is client's email from their profile
  //                       </p>
  //                     </div>

  //                     <div>
  //                       <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
  //                       <div className="relative">
  //                         <input
  //                           type="text"
  //                           value={clientCredentials.password}
  //                           readOnly
  //                           className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
  //                         />
  //                         <button
  //                           type="button"
  //                           onClick={() => {
  //                             const newPassword = generateSecurePassword();
  //                             setClientCredentials({ ...clientCredentials, password: newPassword });
  //                           }}
  //                           className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
  //                         >
  //                           Regenerate
  //                         </button>
  //                       </div>
  //                       <p className="text-xs text-gray-500 mt-1">
  //                         System-generated secure password for client access
  //                       </p>
  //                     </div>
  //                   </div>
  //                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
  //                     <p className="text-xs text-yellow-700">
  //                       <strong>Note:</strong> The client will receive an email with these login details to access their questionnaire.
  //                       Be sure to save this information as the password is encrypted and cannot be retrieved later.
  //                     </p>
  //                   </div>
  //                 </div>
  //               )}
  //             </div>
  //           </div>
  //           <div className="flex justify-between">
  //             <Button variant="outline" onClick={handlePrevious}>
  //               <ArrowLeft className="w-4 h-4 mr-2" />
  //               Back
  //             </Button>

  //             {/* New button with disable/enable based on details entered */}
  //             <div className="flex gap-3">
  //               <Button
  //                 onClick={() => {
  //                   // Check if questionnaire details are entered
  //                   if (selectedQuestionnaire) {
  //                     const questionnaire = availableQuestionnaires.find(q => {
  //                       const possibleIds = [q._id, q.id, q.originalId, q.name].filter(Boolean);
  //                       return q.apiQuestionnaire && q.id === selectedQuestionnaire || possibleIds.includes(selectedQuestionnaire);
  //                     });

  //                     if (questionnaire) {
  //                       toast.success('Questionnaire details are complete!');
  //                     } else {
  //                       toast.error('Please select a valid questionnaire first.');
  //                     }
  //                   } else {
  //                     toast.error('Please select a questionnaire first.');
  //                   }
  //                 }}
  //                 disabled={!selectedQuestionnaire}
  //                 className={`${!selectedQuestionnaire ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
  //               >
  //                 {selectedQuestionnaire ? (
  //                   <>
  //                     <CheckCircle className="w-4 h-4 mr-2" />
  //                     Details Complete
  //                   </>
  //                 ) : (
  //                   <>
  //                     <AlertCircle className="w-4 h-4 mr-2" />
  //                     Details Required
  //                   </>
  //                 )}
  //               </Button>

  //               {isViewEditMode ? (
  //                 // Simple Next button in view/edit mode
  //                 <Button
  //                   onClick={handleNext}
  //                   disabled={!selectedQuestionnaire}
  //                 >
  //                   Next
  //                   <ArrowRight className="w-4 h-4 ml-2" />
  //                 </Button>
  //               ) : (
  //                 selectedQuestionnaire && (() => {
  //                   // Enhanced flexible matching to find the selected questionnaire
  //                   const questionnaire = availableQuestionnaires.find(q => {
  //                     // Check all possible ID fields
  //                     const possibleIds = [
  //                       q._id,          // MongoDB ObjectId
  //                       q.id,           // Original ID or API ID
  //                       q.originalId,   // Original ID before conversion
  //                       q.name          // Fallback to name if used as ID
  //                     ].filter(Boolean); // Remove undefined/null values

  //                     // For API questionnaires, prioritize matching the q_ prefixed ID
  //                     if (q.apiQuestionnaire && q.id === selectedQuestionnaire) {

  //                       return true;
  //                     }

  //                     // Check if any of the possible IDs match
  //                     const matches = possibleIds.includes(selectedQuestionnaire);
  //                     if (matches) {

  //                     }
  //                     return matches;
  //                   });
  //                   const hasFields = questionnaire &&
  //                     (questionnaire.fields?.length > 0 || questionnaire.questions?.length > 0);

  //                   if (!hasFields) {
  //                     return (
  //                       <div className="flex items-center">
  //                         <Button
  //                           onClick={() => toast.error('This questionnaire has no questions defined. Please select another questionnaire.')}
  //                           className="bg-yellow-500 hover:bg-yellow-600"
  //                         >
  //                           <AlertCircle className="w-4 h-4 mr-2" />
  //                           No Questions Available
  //                         </Button>
  //                       </div>
  //                     );
  //                   }

  //                   return (
  //                     <Button
  //                       onClick={handleQuestionnaireAssignment}
  //                       disabled={!selectedQuestionnaire}
  //                     >
  //                       {loading ? (
  //                         <>
  //                           <Loader className="w-4 h-4 mr-2 animate-spin" />
  //                           Assigning...
  //                         </>
  //                       ) : (
  //                         <>
  //                           Assign to Client & Continue
  //                           <Send className="w-4 h-4 ml-2" />
  //                         </>
  //                       )}
  //                     </Button>
  //                   );
  //                 })()
  //               )}
  //             </div>
  //           </div>
  //         </div>
  //       );

  //     case 5: // Collect Answers (Dynamic client responses for selected questionnaire)
  //       return (
  //         <div className="space-y-6">

  //           <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-indigo-900 mb-2">Client Responses</h3>
  //             <p className="text-indigo-700">Review and fill out the questionnaire as the client would.</p>

  //             {Object.keys(clientResponses).length > 0 && (
  //               <div className="mt-2 bg-green-50 border border-green-200 rounded p-2">
  //                 <div className="flex items-center text-green-800">
  //                   <CheckCircle className="w-4 h-4 mr-2" />
  //                   <span className="text-sm">Pre-filled with existing client responses ({Object.keys(clientResponses).length} fields)</span>
  //                 </div>
  //               </div>
  //             )}

  //             {/* Add filling status indicator */}
  //             {questionnaireAssignment && (() => {
  //               const questionnaire = availableQuestionnaires.find(q => {
  //                 const possibleIds = [q._id, q.id, q.originalId, q.name].filter(Boolean);
  //                 return q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId ||
  //                   possibleIds.includes(questionnaireAssignment.questionnaireId);
  //               });

  //               if (questionnaire) {
  //                 const questions = questionnaire.fields || questionnaire.questions || questionnaire.form?.fields || questionnaire.form?.questions || [];
  //                 const totalFields = questions.length;
  //                 const filledFields = questions.filter((q: any) => {
  //                   const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
  //                   const fieldLabel = q.label || q.question || q.name;
  //                   const value = clientResponses[fieldId] || clientResponses[fieldLabel];
  //                   return value !== undefined && value !== null && value !== '' &&
  //                     (!Array.isArray(value) || value.length > 0);
  //                 }).length;

  //                 return (
  //                   <div className="mt-3 flex items-center justify-between bg-white border border-gray-200 rounded p-3">
  //                     <div className="flex items-center">
  //                       <div className="flex-shrink-0 w-3 h-3 rounded-full mr-3"
  //                         style={{ backgroundColor: filledFields === totalFields ? '#10b981' : filledFields > 0 ? '#f59e0b' : '#ef4444' }}></div>
  //                       <span className="text-sm font-medium text-gray-700">
  //                         Progress: {filledFields} of {totalFields} fields completed
  //                       </span>
  //                     </div>
  //                     <div className="w-24 bg-gray-200 rounded-full h-2">
  //                       <div
  //                         className="h-2 rounded-full transition-all duration-300"
  //                         style={{
  //                           width: `${totalFields > 0 ? (filledFields / totalFields) * 100 : 0}%`,
  //                           backgroundColor: filledFields === totalFields ? '#10b981' : filledFields > 0 ? '#f59e0b' : '#ef4444'
  //                         }}
  //                       ></div>
  //                     </div>
  //                   </div>
  //                 );
  //               }
  //               return null;
  //             })()}

  //           </div>

  //           {questionnaireAssignment && (() => {

  //             // Enhanced flexible matching to find the assigned questionnaire
  //             const questionnaire = availableQuestionnaires.find(q => {
  //               // Check all possible ID fields
  //               const possibleIds = [
  //                 q._id,          // MongoDB ObjectId
  //                 q.id,           // Original ID or API ID
  //                 q.originalId,   // Original ID before conversion
  //                 q.name          // Fallback to name if used as ID
  //               ].filter(Boolean); // Remove undefined/null values

  //               // For API questionnaires, prioritize matching the q_ prefixed ID
  //               if (q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId) {

  //                 return true;
  //               }

  //               // Try exact matches first
  //               const exactMatch = possibleIds.includes(questionnaireAssignment.questionnaireId);
  //               if (exactMatch) {

  //                 return true;
  //               }

  //               // Try fuzzy matching for similar IDs (handle cases where IDs are very similar)
  //               const targetId = questionnaireAssignment.questionnaireId;
  //               const fuzzyMatch = possibleIds.some(id => {
  //                 if (!id || !targetId) return false;

  //                 // Remove 'q_' prefix if present and compare
  //                 const cleanId = id.replace(/^q_/, '');
  //                 const cleanTargetId = targetId.replace(/^q_/, '');

  //                 // Check if they're very similar (allowing for small differences)
  //                 const similarity = cleanId.substring(0, 20) === cleanTargetId.substring(0, 20);
  //                 if (similarity) {

  //                   return true;
  //                 }

  //                 return false;
  //               });

  //               return fuzzyMatch;
  //             });



  //             if (!questionnaire) {
  //               return (
  //                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
  //                   <div className="text-yellow-800">
  //                     <p className="font-medium">No questionnaire found</p>
  //                     <p className="text-sm mt-1">
  //                       Looking for ID: {questionnaireAssignment.questionnaireId}
  //                     </p>
  //                     <p className="text-sm">
  //                       Available IDs: {availableQuestionnaires.map(q => q._id || q.id || q.name).join(', ')}
  //                     </p>
  //                   </div>
  //                 </div>
  //               );
  //             }

  //             // Try to find questions/fields in multiple possible locations
  //             let questions = questionnaire.fields ||
  //               questionnaire.questions ||
  //               questionnaire.form?.fields ||
  //               questionnaire.form?.questions ||
  //               [];

  //             // If API response format is detected
  //             if (questionnaire.id && questionnaire.id.startsWith('q_') && Array.isArray(questionnaire.fields)) {

  //               questions = questionnaire.fields;
  //             }

  //             if (!questions || questions.length === 0) {
  //               return (
  //                 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
  //                   <div className="text-red-800">
  //                     <p className="font-medium">No questions found in this questionnaire</p>
  //                     <p className="text-sm mt-1">Questions array is empty or undefined</p>
  //                     <pre className="text-xs mt-2 bg-red-100 p-2 rounded">
  //                       {JSON.stringify(questionnaire, null, 2)}
  //                     </pre>
  //                   </div>
  //                 </div>
  //               );
  //             }
  //             return (
  //               <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
  //                 <div className="flex items-center justify-between mb-4">
  //                   <h4 className="font-medium text-gray-900">{questionnaire.title || questionnaire.name}</h4>
  //                   <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
  //                     {questionnaireAssignment.status}
  //                   </span>
  //                 </div>
  //                 <div className="space-y-4">
  //                   {questions.map((q: any, idx: number) => {
  //                     // Log each field for debugging


  //                     // Ensure field has required properties
  //                     const fieldId = q.id || q._id || `field_${idx}`;
  //                     const fieldLabel = q.label || q.question || q.name || `Question ${idx + 1}`;
  //                     const fieldType = q.type || 'text';
  //                     const fieldOptions = q.options || [];

  //                     // Check if field is filled
  //                     const currentValue = clientResponses[fieldId] || clientResponses[fieldLabel];
  //                     const isFilled = currentValue !== undefined && currentValue !== null && currentValue !== '' &&
  //                       (!Array.isArray(currentValue) || currentValue.length > 0);
  //                     const isRequired = q.required === true;

  //                     // Determine field status styling
  //                     const getFieldStatusStyle = () => {
  //                       if (isFilled) {
  //                         return 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200';
  //                       } else if (isRequired) {
  //                         return 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200';
  //                       } else {
  //                         return 'border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-200';
  //                       }
  //                     };

  //                     const fieldStatusStyle = getFieldStatusStyle();

  //                     // Common field wrapper with status indicator
  //                     const FieldWrapper = ({ children, label }: { children: React.ReactNode, label: string }) => (
  //                       <div className="relative">
  //                         <div className="flex items-center mb-1">
  //                           <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-2 ${isFilled ? 'bg-green-500' : isRequired ? 'bg-red-500' : 'bg-gray-400'
  //                             }`}></div>
  //                           <label className="block text-sm font-medium text-gray-700">
  //                             {label}
  //                             {isRequired && <span className="text-red-500 ml-1">*</span>}
  //                             {isFilled && <span className="text-green-600 ml-2 text-xs">✓ Filled</span>}
  //                           </label>
  //                         </div>
  //                         <div className="relative">
  //                           {children}
  //                           {isFilled && (
  //                             <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
  //                               <CheckCircle className="w-3 h-3 text-white" />
  //                             </div>
  //                           )}
  //                         </div>
  //                       </div>
  //                     );

  //                     // Render input based on type
  //                     if (fieldType === 'date') {
  //                       return (
  //                         <FieldWrapper key={fieldId} label={fieldLabel}>
  //                           <Input
  //                             id={fieldId}
  //                             label=""
  //                             type="date"
  //                             value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
  //                             onChange={e => setClientResponses({
  //                               ...clientResponses,
  //                               [fieldId]: e.target.value
  //                             })}
  //                             className={fieldStatusStyle}
  //                           />
  //                         </FieldWrapper>
  //                       );
  //                     } else if (fieldType === 'select' && Array.isArray(fieldOptions)) {
  //                       return (
  //                         <FieldWrapper key={fieldId} label={fieldLabel}>
  //                           <Select
  //                             id={fieldId}
  //                             label=""
  //                             value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
  //                             onChange={e => setClientResponses({
  //                               ...clientResponses,
  //                               [fieldId]: e.target.value
  //                             })}
  //                             options={[
  //                               { value: '', label: 'Select an option' },
  //                               ...fieldOptions.map((opt: any) => ({ value: opt, label: opt }))
  //                             ]}
  //                             className={fieldStatusStyle}
  //                           />
  //                         </FieldWrapper>
  //                       );
  //                     } else if (fieldType === 'multiselect' && Array.isArray(fieldOptions)) {
  //                       return (
  //                         <FieldWrapper key={fieldId} label={fieldLabel}>
  //                           <select
  //                             multiple
  //                             className={`w-full px-3 py-2 border rounded-md ${fieldStatusStyle}`}
  //                             value={clientResponses[fieldId] || clientResponses[fieldLabel] || []}
  //                             onChange={e => {
  //                               const selected = Array.from(e.target.selectedOptions, option => option.value);
  //                               setClientResponses({
  //                                 ...clientResponses,
  //                                 [fieldId]: selected
  //                               });
  //                             }}
  //                           >
  //                             {fieldOptions.map((opt: any) => (
  //                               <option key={opt} value={opt}>{opt}</option>
  //                             ))}
  //                           </select>
  //                         </FieldWrapper>
  //                       );
  //                     } else if (fieldType === 'checkbox' && Array.isArray(fieldOptions)) {
  //                       return (
  //                         <FieldWrapper key={fieldId} label={fieldLabel}>
  //                           <div className={`flex flex-wrap gap-4 p-3 border rounded-md ${fieldStatusStyle}`}>
  //                             {fieldOptions.map((opt: any) => (
  //                               <label key={opt} className="flex items-center">
  //                                 <input
  //                                   type="checkbox"
  //                                   checked={Array.isArray(clientResponses[fieldId] || clientResponses[fieldLabel]) && (clientResponses[fieldId] || clientResponses[fieldLabel])?.includes(opt)}
  //                                   onChange={e => {
  //                                     const prev = Array.isArray(clientResponses[fieldId] || clientResponses[fieldLabel])
  //                                       ? (clientResponses[fieldId] || clientResponses[fieldLabel])
  //                                       : [];
  //                                     if (e.target.checked) {
  //                                       setClientResponses({
  //                                         ...clientResponses,
  //                                         [fieldId]: [...prev, opt]
  //                                       });
  //                                     } else {
  //                                       setClientResponses({
  //                                         ...clientResponses,
  //                                         [fieldId]: prev.filter((v: any) => v !== opt)
  //                                       });
  //                                     }
  //                                   }}
  //                                   className="mr-2"
  //                                 />
  //                                 {opt}
  //                               </label>
  //                             ))}
  //                           </div>
  //                         </FieldWrapper>
  //                       );
  //                     } else if (fieldType === 'radio' && Array.isArray(fieldOptions)) {
  //                       return (
  //                         <FieldWrapper key={fieldId} label={fieldLabel}>
  //                           <div className={`flex flex-wrap gap-4 p-3 border rounded-md ${fieldStatusStyle}`}>
  //                             {fieldOptions.map((opt: any) => (
  //                               <label key={opt} className="flex items-center">
  //                                 <input
  //                                   type="radio"
  //                                   name={fieldId}
  //                                   value={opt}
  //                                   checked={clientResponses[fieldId] === opt}
  //                                   onChange={() => setClientResponses({
  //                                     ...clientResponses,
  //                                     [fieldId]: opt
  //                                   })}
  //                                   className="mr-2"
  //                                 />
  //                                 {opt}
  //                               </label>
  //                             ))}
  //                           </div>
  //                         </FieldWrapper>
  //                       );
  //                     } else if (fieldType === 'textarea') {
  //                       return (
  //                         <FieldWrapper key={fieldId} label={fieldLabel}>
  //                           <TextArea
  //                             id={fieldId}
  //                             label=""
  //                             value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
  //                             onChange={e => setClientResponses({
  //                               ...clientResponses,
  //                               [fieldId]: e.target.value
  //                             })}
  //                             rows={3}
  //                             className={fieldStatusStyle}
  //                           />
  //                         </FieldWrapper>
  //                       );
  //                     } else {
  //                       // Default to text input
  //                       return (
  //                         <FieldWrapper key={fieldId} label={fieldLabel}>
  //                           <Input
  //                             id={fieldId}
  //                             label=""
  //                             type={fieldType === 'email' ? 'email' : fieldType === 'number' ? 'number' : 'text'}
  //                             value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
  //                             onChange={e => setClientResponses({
  //                               ...clientResponses,
  //                               [fieldId]: e.target.value
  //                             })}
  //                             placeholder={q.placeholder || ''}
  //                             className={fieldStatusStyle}
  //                           />
  //                         </FieldWrapper>
  //                       );
  //                     }
  //                   })}
  //                 </div>
  //               </div>
  //             );
  //           })()}

  //           {/* Response Summary Card */}
  //           {questionnaireAssignment && (() => {
  //             const questionnaire = availableQuestionnaires.find(q => {
  //               const possibleIds = [q._id, q.id, q.originalId, q.name].filter(Boolean);
  //               return q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId ||
  //                 possibleIds.includes(questionnaireAssignment.questionnaireId);
  //             });

  //             if (questionnaire) {
  //               const questions = questionnaire.fields || questionnaire.questions || questionnaire.form?.fields || questionnaire.form?.questions || [];
  //               const filledFields = questions.filter((q: any) => {
  //                 const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
  //                 const fieldLabel = q.label || q.question || q.name;
  //                 const value = clientResponses[fieldId] || clientResponses[fieldLabel];
  //                 return value !== undefined && value !== null && value !== '' &&
  //                   (!Array.isArray(value) || value.length > 0);
  //               });
  //               const requiredFields = questions.filter((q: any) => q.required === true);
  //               const filledRequiredFields = requiredFields.filter((q: any) => {
  //                 const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
  //                 const fieldLabel = q.label || q.question || q.name;
  //                 const value = clientResponses[fieldId] || clientResponses[fieldLabel];
  //                 return value !== undefined && value !== null && value !== '' &&
  //                   (!Array.isArray(value) || value.length > 0);
  //               });

  //               return (
  //                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
  //                   <h4 className="font-medium text-gray-900 mb-3 flex items-center">
  //                     <FileText className="w-4 h-4 mr-2" />
  //                     Response Summary
  //                   </h4>
  //                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
  //                     <div className="bg-white rounded p-3 border">
  //                       <div className="text-gray-600">Total Fields</div>
  //                       <div className="text-lg font-medium text-gray-900">{questions.length}</div>
  //                     </div>
  //                     <div className="bg-white rounded p-3 border">
  //                       <div className="text-gray-600">Filled Fields</div>
  //                       <div className={`text-lg font-medium ${filledFields.length === questions.length ? 'text-green-600' : 'text-yellow-600'}`}>
  //                         {filledFields.length}
  //                       </div>
  //                     </div>
  //                     <div className="bg-white rounded p-3 border">
  //                       <div className="text-gray-600">Required Fields</div>
  //                       <div className={`text-lg font-medium ${filledRequiredFields.length === requiredFields.length ? 'text-green-600' : 'text-red-600'}`}>
  //                         {filledRequiredFields.length} / {requiredFields.length}
  //                       </div>
  //                     </div>
  //                   </div>

  //                   {/* Missing Required Fields Warning */}
  //                   {filledRequiredFields.length < requiredFields.length && (
  //                     <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
  //                       <div className="flex items-start">
  //                         <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
  //                         <div className="text-sm">
  //                           <div className="font-medium text-red-800 mb-1">Missing Required Fields:</div>
  //                           <ul className="text-red-700 space-y-1">
  //                             {requiredFields.filter((q: any) => {
  //                               const fieldId = q.id || q._id || `field_${questions.indexOf(q)}`;
  //                               const fieldLabel = q.label || q.question || q.name;
  //                               const value = clientResponses[fieldId] || clientResponses[fieldLabel];
  //                               return value === undefined || value === null || value === '' ||
  //                                 (Array.isArray(value) && value.length === 0);
  //                             }).map((q: any, index: number) => (
  //                               <li key={index} className="flex items-center">
  //                                 <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
  //                                 {q.label || q.question || q.name || 'Unnamed field'}
  //                               </li>
  //                             ))}
  //                           </ul>
  //                         </div>
  //                       </div>
  //                     </div>
  //                   )}

  //                   {/* Completion Status */}
  //                   {filledRequiredFields.length === requiredFields.length && filledFields.length === questions.length && (
  //                     <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
  //                       <div className="flex items-center text-green-800">
  //                         <CheckCircle className="w-4 h-4 mr-2" />
  //                         <span className="text-sm font-medium">All fields completed! Ready to proceed.</span>
  //                       </div>
  //                     </div>
  //                   )}
  //                 </div>
  //               );
  //             }
  //             return null;
  //           })()}

  //           <div className="flex justify-end">
  //             {isViewEditMode ? (
  //               // Simple Next button in view/edit mode
  //               <Button
  //                 onClick={handleNext}
  //                 disabled={Object.keys(clientResponses).length === 0}
  //               >
  //                 Next
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             ) : (
  //               // Original Response submission button in normal mode
  //               <Button
  //                 onClick={handleResponseSubmit}
  //                 disabled={Object.keys(clientResponses).length === 0}
  //               >
  //                 Responses Complete & Continue
  //                 <CheckCircle className="w-4 h-4 ml-2" />
  //               </Button>
  //             )}
  //           </div>

  //         </div>
  //       );

  //     case 6: // Form Details
  //       return (
  //         <div className="space-y-6">
  //           <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-teal-900 mb-2">Form Details</h3>
  //             <p className="text-teal-700">Review all details filled so far before proceeding to auto-fill forms.</p>
  //           </div>

  //           {/* Auto-filling Progress Indicator */}
  //           {autoFillingFormDetails && (
  //             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //               <div className="flex items-center">
  //                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
  //                 <h4 className="text-sm font-medium text-blue-900">Auto-filling form details...</h4>
  //               </div>
  //               <p className="text-sm text-blue-700 mt-1">
  //                 Loading data from saved workflow API response.
  //               </p>
  //             </div>
  //           )}

  //           <div className="space-y-4">
  //             <h4 className="font-medium text-gray-900">Selected Forms Summary</h4>
  //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //               {selectedForms.map(form => (
  //                 <div key={form} className="bg-white border border-gray-200 rounded-lg p-4">
  //                   <div className="flex items-center justify-between">
  //                     <h5 className="font-medium text-gray-900">{form}</h5>
  //                     <CheckCircle className="w-5 h-5 text-green-500" />
  //                   </div>
  //                   <p className="text-sm text-gray-500 mt-1">
  //                     Will be auto-filled with client and case data
  //                   </p>
  //                   {formCaseIds[form] && (
  //                     <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
  //                       <div className="text-xs text-blue-600">Case ID:</div>
  //                       <div className="text-sm font-mono text-blue-800">{formCaseIds[form]}</div>
  //                     </div>
  //                   )}
  //                 </div>
  //               ))}
  //             </div>

  //             <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
  //               <h4 className="font-medium text-gray-900 mb-2">All Details Summary</h4>
  //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
  //                 <div><strong>Client Name:</strong> {client.name}</div>
  //                 <div><strong>Email:</strong> {client.email}</div>
  //                 <div><strong>Phone:</strong> {client.phone}</div>
  //                 <div><strong>Date of Birth:</strong> {client.dateOfBirth}</div>
  //                 <div><strong>Nationality:</strong> {client.nationality}</div>
  //                 <div><strong>Address:</strong> {client.address?.street}, {client.address?.city}, {client.address?.state} {client.address?.zipCode}, {client.address?.country}</div>
  //                 <div><strong>Case Title:</strong> {caseData.title}</div>
  //                 <div><strong>Case Type:</strong> {caseData.type || caseData.visaType}</div>
  //                 <div><strong>Status:</strong> {caseData.status}</div>
  //                 <div><strong>Assigned Attorney:</strong> {caseData.assignedTo || 'Not assigned'}</div>
  //                 <div><strong>Open Date:</strong> {caseData.openDate}</div>
  //                 <div><strong>Priority Date:</strong> {caseData.priorityDate}</div>
  //                 <div><strong>Due Date:</strong> {caseData.dueDate || 'Not set'}</div>
  //                 <div><strong>Priority:</strong> {caseData.priority}</div>
  //                 <div><strong>Category:</strong> {IMMIGRATION_CATEGORIES.find(c => c.id === caseData.category)?.name || caseData.category}</div>
  //                 <div><strong>Subcategory:</strong> {caseData.subcategory}</div>
  //                 <div><strong>Visa Type:</strong> {caseData.visaType}</div>
  //                 <div className="md:col-span-2"><strong>Description:</strong> {caseData.description}</div>
  //                 {Object.keys(formCaseIds).length > 0 && (
  //                   <div className="md:col-span-2">
  //                     <strong>Form Case IDs:</strong>
  //                     <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
  //                       {Object.entries(formCaseIds).map(([form, caseId]) => (
  //                         <div key={form} className="text-xs bg-gray-100 p-2 rounded">
  //                           <div className="font-medium">{form}:</div>
  //                           <div className="font-mono text-blue-600">{caseId}</div>
  //                         </div>
  //                       ))}
  //                     </div>
  //                   </div>
  //                 )}
  //               </div>


  //             </div>
  //           </div>

  //           <div className="flex justify-between">
  //             <Button variant="outline" onClick={handlePrevious}>
  //               <ArrowLeft className="w-4 h-4 mr-2" />
  //               Back
  //             </Button>
  //             {isViewEditMode ? (
  //               // Simple Next button in view/edit mode
  //               <Button onClick={handleNext}>
  //                 Next
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             ) : (
  //               // Original Form Details submission button in normal mode
  //               <Button onClick={handleFormDetailsSubmit}>
  //                 Proceed to Auto-Fill
  //                 <ArrowRight className="w-4 h-4 ml-2" />
  //               </Button>
  //             )}
  //           </div>
  //         </div>
  //       );

  //     case 7: // Auto-fill Forms
  //       return (
  //         <div className="space-y-6">
  //           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
  //             <h3 className="text-lg font-semibold text-green-900 mb-2">Auto-Fill Forms</h3>
  //             <p className="text-green-700">Generate completed forms with all collected information.</p>
  //           </div>

  //           <div className="space-y-4">
  //             <div className="bg-white border border-gray-200 rounded-lg p-6">
  //               <h4 className="font-medium text-gray-900 mb-4">Ready to Generate Forms</h4>

  //               <div className="space-y-3">
  //                 {selectedForms.map(form => (
  //                   <div key={form} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  //                     <div className="flex items-center">
  //                       <FileText className="w-5 h-5 text-blue-500 mr-3" />
  //                       <div>
  //                         <div className="font-medium text-gray-900">{form}</div>
  //                         <div className="text-sm text-gray-500">
  //                           Will be auto-filled with client and case data
  //                         </div>
  //                       </div>
  //                     </div>
  //                     <div className="flex items-center text-green-600">
  //                       <CheckCircle className="w-5 h-5 mr-2" />
  //                       <span className="text-sm font-medium">Ready</span>
  //                     </div>
  //                   </div>
  //                 ))}
  //               </div>

  //               <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  //                 <div className="flex items-start">
  //                   <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
  //                   <div>
  //                     <h5 className="font-medium text-blue-900">Auto-Fill Process</h5>
  //                     <p className="text-blue-700 text-sm mt-1">
  //                       The forms will be automatically filled with:
  //                     </p>
  //                     <ul className="text-blue-700 text-sm mt-2 ml-4 space-y-1">
  //                       <li>• Client personal information</li>
  //                       <li>• Address and contact details</li>
  //                       <li>• Questionnaire responses</li>
  //                       <li>• Case-specific information</li>
  //                     </ul>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Auto-Generate Forms Section */}
  //             <div className="bg-white border border-gray-200 rounded-lg p-6">
  //               <h4 className="font-medium text-gray-900 mb-4">Auto-Generate Forms</h4>
  //               <p className="text-gray-600 mb-4">
  //                 Use the advanced auto-generation feature to create forms with all collected data.
  //               </p>

  //               <div className="flex gap-3 mb-6">
  //                 <Button
  //                   onClick={handleAutoGenerateForms}
  //                   disabled={generatingForms || selectedForms.length === 0}
  //                   className="bg-purple-600 hover:bg-purple-700"
  //                 >
  //                   {generatingForms ? (
  //                     <>
  //                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  //                       Auto-Generating Forms...
  //                     </>
  //                   ) : (
  //                     <>
  //                       <FileCheck className="w-4 h-4 mr-2" />
  //                       Auto Generate Forms
  //                     </>
  //                   )}
  //                 </Button>

  //                 {!isViewEditMode && (
  //                   <Button
  //                     onClick={handleAutoFillForms}
  //                     disabled={loading}
  //                     className="bg-green-600 hover:bg-green-700"
  //                   >
  //                     {loading ? (
  //                       <>
  //                         <Clock className="w-4 h-4 mr-2 animate-spin" />
  //                         Generating Forms...
  //                       </>
  //                     ) : (
  //                       <>
  //                         <Download className="w-4 h-4 mr-2" />
  //                         Legacy Generate & Download
  //                       </>
  //                     )}
  //                   </Button>
  //                 )}
  //               </div>

  //               {/* Generated Forms Display */}
  //               {generatedForms.length > 0 && (
  //                 <div className="space-y-4">
  //                   <h5 className="font-medium text-gray-900">Generated Forms</h5>
  //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                     {generatedForms.map((form) => (
  //                       <div key={form.formName} className="border border-gray-200 rounded-lg p-4">
  //                         <div className="flex items-center justify-between mb-3">
  //                           <div className="flex items-center">
  //                             <FileText className="w-5 h-5 text-blue-500 mr-2" />
  //                             <span className="font-medium text-gray-900">{form.formName}</span>
  //                           </div>
  //                           <div className="flex items-center">
  //                             {form.status === 'generating' && (
  //                               <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
  //                             )}
  //                             {form.status === 'success' && (
  //                               <CheckCircle className="w-4 h-4 text-green-500" />
  //                             )}
  //                             {form.status === 'error' && (
  //                               <AlertCircle className="w-4 h-4 text-red-500" />
  //                             )}
  //                           </div>
  //                         </div>

  //                         {form.status === 'generating' && (
  //                           <div className="text-sm text-blue-600">Generating...</div>
  //                         )}

  //                         {form.status === 'success' && (
  //                           <div className="space-y-2">
  //                             <div className="text-sm text-gray-600">{form.fileName}</div>
  //                             <div className="flex gap-2">
  //                               <Button
  //                                 onClick={() => handleDownloadForm(form.formName)}
  //                                 size="sm"
  //                                 className="bg-blue-600 hover:bg-blue-700"
  //                               >
  //                                 <Download className="w-4 h-4 mr-1" />
  //                                 Download
  //                               </Button>
  //                               <Button
  //                                 onClick={() => handlePreviewForm(form.formName)}
  //                                 size="sm"
  //                                 variant="outline"
  //                               >
  //                                 <FileText className="w-4 h-4 mr-1" />
  //                                 Preview
  //                               </Button>
  //                             </div>
  //                           </div>
  //                         )}

  //                         {form.status === 'error' && (
  //                           <div className="text-sm text-red-600">
  //                             Error: {form.error || 'Unknown error'}
  //                           </div>
  //                         )}
  //                       </div>
  //                     ))}
  //                   </div>
  //                 </div>
  //               )}

  //               {/* PDF Preview Modal */}
  //               {Object.entries(showPreview).map(([formName, isVisible]) => {
  //                 if (!isVisible) return null;
  //                 const form = generatedForms.find(f => f.formName === formName);
  //                 if (!form || form.status !== 'success') return null;

  //                 return (
  //                   <div key={formName} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  //                     <div className="bg-white rounded-lg p-4 max-w-4xl w-full h-5/6 flex flex-col">
  //                       <div className="flex items-center justify-between mb-4">
  //                         <h3 className="text-lg font-semibold">Preview: {formName}</h3>
  //                         <Button
  //                           onClick={() => handleClosePreview(formName)}
  //                           variant="outline"
  //                           size="sm"
  //                         >
  //                           ×
  //                         </Button>
  //                       </div>
  //                       <div className="flex-1">
  //                         <iframe
  //                           src={form.downloadUrl}
  //                           className="w-full h-full border-0"
  //                           title={`Preview of ${formName}`}
  //                         />
  //                       </div>
  //                     </div>
  //                   </div>
  //                 );
  //               })}
  //             </div>
  //           </div>

  //           <div className="flex justify-between">
  //             <Button variant="outline" onClick={handlePrevious}>
  //               <ArrowLeft className="w-4 h-4 mr-2" />
  //               Back
  //             </Button>
  //             {isViewEditMode ? (
  //               // Simple completion message in view/edit mode
  //               <Button
  //                 onClick={() => {
  //                   // Workflow review completed
  //                 }}
  //                 className="bg-blue-600 hover:bg-blue-700"
  //               >
  //                 Complete Review
  //                 <CheckCircle className="w-4 h-4 ml-2" />
  //               </Button>
  //             ) : (
  //               <div className="flex gap-3">
  //                 <Button
  //                   onClick={handleAutoGenerateForms}
  //                   disabled={generatingForms || selectedForms.length === 0}
  //                   className="bg-purple-600 hover:bg-purple-700"
  //                 >
  //                   {generatingForms ? (
  //                     <>
  //                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  //                       Auto-Generating...
  //                     </>
  //                   ) : (
  //                     <>
  //                       <FileCheck className="w-4 h-4 mr-2" />
  //                       Auto Generate
  //                     </>
  //                   )}
  //                 </Button>
  //                 <Button
  //                   onClick={handleAutoFillForms}
  //                   disabled={loading}
  //                   className="bg-green-600 hover:bg-green-700"
  //                 >
  //                   {loading ? (
  //                     <>
  //                       <Clock className="w-4 h-4 mr-2 animate-spin" />
  //                       Generating...
  //                     </>
  //                   ) : (
  //                     <>
  //                       <Download className="w-4 h-4 mr-2" />
  //                       Legacy Generate
  //                     </>
  //                   )}
  //                 </Button>
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       );

  //     default:
  //       return <div />;
  //   }
  // };

  // API connectivity is checked through regular application flows

  // Utility function to get and validate current user data
  // User data is managed through the application context

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
