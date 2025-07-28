import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, ClipboardList, Send, Download, CheckCircle, 
  ArrowRight, ArrowLeft, Plus, User, Briefcase, FormInput,
  MessageSquare, FileCheck, AlertCircle, Clock, Star, Info as InfoIcon,
  Loader, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { validateMongoObjectId, isValidMongoObjectId, generateObjectId } from '../utils/idValidation';
// No debug utilities needed in production
import api from '../utils/api';
import { APPCONSTANTS } from '../utils/constants';
import { 
  generateMultipleCaseIdsFromAPI, 
  generateMultipleCaseIds, 
  formatCaseId 
} from '../utils/caseIdGenerator';

import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import FileUpload from '../components/common/FileUpload';
import { downloadFilledI130PDF, I130FormData } from '../utils/pdfUtils';
import { 
  isQuestionnaireApiAvailable, 
  getQuestionnaires 
} from '../controllers/QuestionnaireControllers';
import {
  assignQuestionnaire,
  isApiEndpointAvailable
} from '../controllers/QuestionnaireAssignmentControllers';
import {
  submitQuestionnaireResponses,
  normalizeQuestionnaireStructure
} from '../controllers/QuestionnaireResponseControllers';
import {
  generateSecurePassword
  // createClientUserAccount no longer used - skipping user account creation
} from '../controllers/UserCreationController';
// Service imports have been moved to controllers
import { getClients as fetchClientsFromAPI, getClientById, Client as APIClient } from '../controllers/ClientControllers';
import { getFormTemplates, FormTemplate } from '../controllers/SettingsControllers';

// Extend APIClient with optional _id field and name parts
type Client = APIClient & { 
  _id?: string;
  firstName?: string;
  lastName?: string;
};

interface Case {
  id: string;
  _id?: string; // Added for compatibility with MongoDB
  clientId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: 'draft' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedForms: string[];
  questionnaires: string[];
  createdAt: string;
  dueDate: string;
  visaType?: string;
  priorityDate?: string;
  caseNumber?: string;
  type?: string;
  // Additional optional properties that might be used in the UI
  assignedTo?: string;
  courtLocation?: string;
  judge?: string;
  openDate?: string;
  formCaseIds?: Record<string, string>; // Map of form names to case IDs
}

interface QuestionnaireAssignment {
  id: string;
  caseId: string;
  clientId: string;
  questionnaireId: string;
  questionnaireName: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  responses: Record<string, any>;
  dueDate?: string;
  notes?: string;
  clientEmail?: string;
  clientUserId?: string;
  tempPassword?: string; // Added for client account creation
  formCaseIds?: Record<string, string>; // Map of form names to case IDs
  selectedForms?: string[]; // List of selected forms
}

interface FormData {
  formType: string;
  data: Record<string, any>;
  status: 'draft' | 'review' | 'completed';
}

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

const WORKFLOW_STEPS = [
  { id: 'start', title: 'Start', icon: User, description: 'New or existing client' },
  { id: 'client', title: 'Create Client', icon: Users, description: 'Add new client information' },
  { id: 'case', title: 'Create Case', icon: Briefcase, description: 'Set up case details and category' },
  { id: 'forms', title: 'Select Forms', icon: FileText, description: 'Choose required forms for filing' },
  { id: 'questionnaire', title: 'Assign Questions', icon: ClipboardList, description: 'Send questionnaire to client' },
  { id: 'answers', title: 'Collect Answers', icon: MessageSquare, description: 'Review client responses' },
  { id: 'form-details', title: 'Form Details', icon: FormInput, description: 'Complete form information' },
  { id: 'auto-fill', title: 'Auto-fill Forms', icon: FileCheck, description: 'Generate completed forms' }
];

// Use generateSecurePassword from UserCreationController

const LegalFirmWorkflow: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Client data
  const [client, setClient] = useState<any>({
    id: '',
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
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
    dueDate: ''
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
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

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
      console.log('🔄 Loading workflows for auto-fill...');
      await fetchWorkflowsFromAPI();
    };
    
    // Load workflows after a brief delay to allow other data to load first
    setTimeout(loadWorkflowsForAutoFill, 1000);
  }, []);
  
  // Function to resume workflow from saved progress
  const resumeWorkflow = async (workflowId: string) => {
    try {
      console.log('🔄 Attempting to resume workflow:', workflowId);
      
      let workflowData = null;
      
      // Try to load from API first
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get(`/api/v1/workflows/progress/${workflowId}`);
          workflowData = response.data.data || response.data;
          console.log('✅ Loaded workflow from API:', workflowData);
          toast.success('Workflow resumed from server', { duration: 2000 });
        } catch (apiError: any) {
          console.warn('⚠️ Failed to load workflow from API:', apiError);
          if (apiError.response?.status !== 404) {
            toast.error('Failed to load from server, checking local storage');
          }
        }
      }
      
      // Fallback to localStorage
      if (!workflowData) {
        const savedWorkflows = JSON.parse(localStorage.getItem('legal-firm-workflows') || '[]');
        workflowData = savedWorkflows.find((w: any) => w.workflowId === workflowId);
        
        if (workflowData) {
          console.log('✅ Loaded workflow from localStorage:', workflowData);
          toast.success('Workflow resumed from local storage', { duration: 2000 });
        }
      }
      
      if (!workflowData) {
        toast.error('Workflow not found');
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
      
      console.log('✅ Workflow state restored successfully');
      toast.success(`Workflow resumed at step: ${WORKFLOW_STEPS[workflowData.currentStep]?.title || 'Unknown'}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error resuming workflow:', error);
      toast.error('Failed to resume workflow');
      return false;
    }
  };
  
  // Check for workflow resumption on component mount
  useEffect(() => {
    const checkForWorkflowResumption = () => {
      // Check URL parameters for workflow resumption
      const urlParams = new URLSearchParams(window.location.search);
      const resumeWorkflowId = urlParams.get('resumeWorkflow');
      
      if (resumeWorkflowId) {
        console.log('🔄 URL parameter detected for workflow resumption:', resumeWorkflowId);
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
          console.log('🔄 SessionStorage detected for workflow resumption:', workflowId);
          resumeWorkflow(workflowId);
          sessionStorage.removeItem('resumeWorkflow');
        } catch (error) {
          console.error('Error parsing resume workflow data:', error);
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
        console.log('Found pre-filled workflow data after questionnaires loaded:', data);
        
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
          console.log('Creating temporary questionnaire from pre-filled data');
          
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
          
          console.log('Created temporary questionnaire:', foundQuestionnaire);
          
          // Add it to available questionnaires
          setAvailableQuestionnaires(prev => [...prev, foundQuestionnaire]);
        } else {
          console.log('Found existing questionnaire:', foundQuestionnaire);
        }
        
        // Set client data
        setClient((prev: any) => ({
          ...prev,
          id: data.clientId,
          firstName: data.clientName.split(' ')[0] || '',
          lastName: data.clientName.split(' ').slice(1).join(' ') || '',
          email: data.clientEmail
        }));
        
        // Set selected questionnaire
        if (data.questionnaireId) {
          setSelectedQuestionnaire(data.questionnaireId);
          
          // Create a questionnaire assignment for the answers collection step
          const assignment: QuestionnaireAssignment = {
            id: data.originalAssignmentId || 'temp-assignment',
            caseId: '',
            clientId: data.clientId,
            questionnaireId: data.questionnaireId,
            questionnaireName: data.questionnaireTitle || 'Questionnaire',
            status: 'in-progress',
            assignedAt: new Date().toISOString(),
            responses: data.existingResponses || {},
            clientEmail: data.clientEmail
          };
          
          console.log('Creating questionnaire assignment:', assignment);
          setQuestionnaireAssignment(assignment);
        }
        
        // Set existing responses if in edit mode
        if (data.mode === 'edit' && data.existingResponses) {
          setClientResponses(data.existingResponses);
          console.log('Set client responses:', data.existingResponses);
        }
        
        // Jump to the answers collection step since we have responses
        if (data.mode === 'edit') {
          setCurrentStep(WORKFLOW_STEPS.findIndex(step => step.id === 'answers'));
          toast.success(`Loaded existing responses for ${data.clientName}`);
        } else {
          setCurrentStep(WORKFLOW_STEPS.findIndex(step => step.id === 'questionnaire'));
          toast.success(`Loaded client data for ${data.clientName}`);
        }
        
        // Clear the session storage after using it
        sessionStorage.removeItem('legalFirmWorkflowData');
        
      } catch (error) {
        console.error('Error parsing workflow data:', error);
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
        const response = await getFormTemplates('');
        console.log('Fetched form templates:', response.data.templates);
        setFormTemplates(response.data.templates || []);
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
      try {
        const apiClients = await fetchClientsFromAPI();
        
        // Make sure each client has a valid MongoDB ObjectId
        const validatedClients = apiClients?.map((client: any) => {
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
          console.log(`Converting client ID ${client._id || client.id} to valid ObjectId: ${validId}`);
          
          return {
            ...client,
            id: validId,
            _id: validId
          };
        }) || [];
        
        console.log('Validated clients:', validatedClients);
        setExistingClients(validatedClients);
      } catch (err) {
        console.error('Error fetching clients:', err);
        // Load clients from localStorage as fallback
        try {
          const localClients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
          console.log('Loaded clients from localStorage:', localClients);
          setExistingClients(localClients);
        } catch (localErr) {
          console.error('Error loading local clients:', localErr);
          setExistingClients([]);
        }
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
        
        console.log('API response for questionnaires:', response);
        
        // Questionnaires loaded successfully from API
        if (response.questionnaires && response.questionnaires.length > 0) {
          console.log('First questionnaire structure from API:', 
            JSON.stringify(response.questionnaires[0], null, 2));
        }
        
        // Normalize questionnaire data to ensure consistent structure
        const normalizedQuestionnaires = response.questionnaires.map((q: any) => {
          // Special handling for API response format
          if (q.id && q.id.startsWith('q_') && q.fields) {
            console.log('Processing API format questionnaire:', q.id);
          }
          return normalizeQuestionnaireStructure(q);
        });
        console.log('Normalized questionnaires from API:', normalizedQuestionnaires);
        setAvailableQuestionnaires(normalizedQuestionnaires);
      } else {
        // Fallback to localStorage
        const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
        if (savedQuestionnaires) {
          const parsedQuestionnaires = JSON.parse(savedQuestionnaires);
          // Questionnaires loaded from localStorage
          console.log('Loading questionnaires from localStorage:', parsedQuestionnaires);
          
          // Normalize questionnaire data from localStorage
          const normalizedQuestionnaires = parsedQuestionnaires.map((q: any) => {
            // First apply the standard normalization
            const normalizedQ = normalizeQuestionnaireStructure(q);
            // Log each questionnaire's field structure before and after normalization
            console.log(`Questionnaire "${q.title || q.name || 'unnamed'}":`, 
              'Original fields:', q.fields || q.questions || [], 
              'Normalized fields:', normalizedQ.fields);
            return normalizedQ;
          });
          setAvailableQuestionnaires(normalizedQuestionnaires);
        } else {
          console.warn('No questionnaires found in localStorage');
          // Load demo questionnaires if nothing is available
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
                { id: 'relationship', type: 'select', label: 'Relationship to Petitioner', required: true, 
                  options: ['Spouse', 'Parent', 'Child', 'Sibling'] }
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
                { id: 'criminalHistory', type: 'radio', label: 'Do you have any criminal history?', required: true,
                  options: ['Yes', 'No'] }
              ]
            }
          ];
          console.log('Loading demo questionnaires:', demoQuestionnaires);
          setAvailableQuestionnaires(demoQuestionnaires);
          localStorage.setItem('immigration-questionnaires', JSON.stringify(demoQuestionnaires));
        }
      }
    } catch (error) {
      console.error('Error loading questionnaires:', error);
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
            { id: 'relationship', type: 'select', label: 'Relationship to Petitioner', required: true, 
              options: ['Spouse', 'Parent', 'Child', 'Sibling'] }
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
      console.log('Loading demo questionnaires due to error:', demoQuestionnaires);
      setAvailableQuestionnaires(demoQuestionnaires);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Normalizes questionnaire data structure to ensure consistent fields format
   */
  // Use the imported normalizeQuestionnaireStructure function from QuestionnaireResponseControllers

  const handleNext = () => {
    console.log('Current step:', currentStep, 'Moving to:', currentStep + 1);
    
    const nextStep = currentStep + 1;
    
    if (nextStep < WORKFLOW_STEPS.length) {
      setCurrentStep(nextStep);
      
      // Check if we're moving to the "Collect Answers" step (typically step 5)
      const nextStepConfig = WORKFLOW_STEPS[nextStep];
      if (nextStepConfig?.id === 'answers' && autoFillEnabled) {
        console.log('🔄 Reached Collect Answers step - triggering auto-fill...');
        
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

  const handleClientSubmit = async () => {
    console.log('Client submit called with data:', client);
    
    // Ensure client has a name with first and last name parts
    if (!client.name || client.name.trim() === '') {
      toast.error('Client name is required');
      return;
    }
    
    // Validate email
    if (!client.email || !client.email.includes('@')) {
      toast.error('Valid email address is required');
      return;
    }
    
    // Parse name to ensure we have first and last name components
    let firstName = '', lastName = '';
    const nameParts = client.name.trim().split(' ');
    if (nameParts.length > 1) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else {
      // If only one word in name, use it as firstName and default lastName
      firstName = nameParts[0];
      lastName = 'Client'; // Default last name
    }
    
    // Only proceed with user account creation if password is provided (from questionnaire assignment screen)
    if (!client.password) {
      console.log('⚠️ No password provided - user account creation will be skipped');
      toast.error('Password is required for user account creation. Please set a password in the questionnaire assignment screen.');
      return null;
    }
    
    // Use the email and password from questionnaire assignment screen or generated password
    const clientEmail = client.email;
    const clientPassword = client.password;
    
    console.log('📧 Using email:', clientEmail);
    console.log('🔑 Using password: [HIDDEN]');
    
    return await createClientAccountWithCredentials(clientEmail, clientPassword);
  };

  // Helper function to create client account with provided credentials
  const createClientAccountWithCredentials = async (clientEmail: string, clientPassword: string) => {
    // Parse name to ensure we have first and last name components
    let firstName = '', lastName = '';
    const nameParts = client.name.trim().split(' ');
    if (nameParts.length > 1) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else {
      // If only one word in name, use it as firstName and default lastName
      firstName = nameParts[0];
      lastName = 'Client'; // Default last name
    }
    
    // Generate a valid MongoDB ObjectId for the client
    const clientId = generateObjectId();
    const updatedClient = {
      ...client,
      id: clientId,
      _id: clientId, // Add both id and _id for compatibility
      firstName, // Add parsed name components
      lastName,
      email: clientEmail, // Use the specific email
      password: clientPassword, // Use the specific password
      createdAt: new Date().toISOString()
    };
    setClient(updatedClient);
    
    try {
      console.log('Creating client user account through correct backend endpoint...');
      
      // ✅ Use the correct endpoint: /api/v1/auth/register/user
      const response = await api.post('/api/v1/auth/register/user', {
        firstName: updatedClient.firstName,
        lastName: updatedClient.lastName,
        email: clientEmail.toLowerCase().trim(),
        password: clientPassword,
        role: 'client', // ✅ Required: Specify user role
        userType: 'individual', // ✅ Required: Enables individual client creation
        sendPassword: false // ✅ Controls welcome email (set to true if you want emails)
      });
      
      console.log('Backend registration response:', response.data);
      
      // ✅ Enhanced response handling - handle both response structures
      const userData = response.data?.data || response.data?.user || response.data;
      const apiClientId = userData?._id || userData?.id;
      const token = response.data?.token || userData?.token;
      
      if (!apiClientId) {
        throw new Error('No user ID returned from registration');
      }
      
      console.log(`✅ Client user account created successfully with ID: ${apiClientId}`);
      
      // Create comprehensive client object with all necessary fields
      const apiClient = {
        ...updatedClient,
        id: apiClientId,
        _id: apiClientId,
        userId: apiClientId, // Store the user account ID
        hasUserAccount: true,
        email: client.email.toLowerCase().trim(),
        // Include additional client profile data
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
        status: 'active',
        // Include JWT token for potential auto-login
        ...(token && { token })
      };
      
      setClient(apiClient);
      
      // Save to localStorage for future reference
      const existingClients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
      existingClients.push(apiClient);
      localStorage.setItem('legal-firm-clients', JSON.stringify(existingClients));
      
      // 🔑 Store client credentials for easy login access
      const clientCredentials = {
        email: clientEmail,
        password: clientPassword,
        userId: apiClientId
      };
      
      try {
        const { storeClientCredentials } = await import('../utils/clientLoginHelper');
        storeClientCredentials(clientCredentials);
        console.log('✅ Client credentials stored for easy access');
      } catch (helperError) {
        console.warn('Could not store client credentials:', helperError);
      }
      
      // ✅ Success toast with user's name and login credentials
      toast.success(
        <div>
          <p>✅ Client account created successfully for {updatedClient.firstName} {updatedClient.lastName}!</p>
          <p className="text-sm mt-1">🔐 Login credentials:</p>
          <p className="text-xs">Email: {clientEmail}</p>
          <p className="text-xs">Password: {clientPassword}</p>
        </div>,
        { duration: 8000 }
      );
      
      console.log('✅ Client user registration completed successfully, proceeding to next step');
      handleNext();
      
      // Return the real user account ID
      return apiClientId;
      
    } catch (error: any) {
      console.error('❌ Failed to create client user account:', error);
      
      // ✅ Enhanced error handling with specific messages
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || 
                          errorData?.message || 
                          errorData?.error || 
                          error.message || 
                          'Failed to create client account';
      
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: errorData,
        message: errorMessage
      });
      
      // ✅ Handle specific error scenarios
      if (error.response?.status === 400) {
        toast.error(`Registration failed: ${errorMessage}`);
      } else if (error.response?.status === 409 || errorMessage.toLowerCase().includes('already exists')) {
        // ✅ Handle "user already exists" errors gracefully
        console.log('🔄 User already exists, this may not be fatal...');
        toast.error(`A user with email ${client.email} already exists. Please use a different email or contact support.`);
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in to create client accounts.');
      } else if (error.response?.status === 500) {
        toast.error('Server error occurred. Please try again or contact support.');
      } else {
        toast.error(`Failed to create client account: ${errorMessage}`);
      }
      
      // ✅ Prevent navigation to next step if registration fails
      console.log('❌ Registration failed, not proceeding to next step');
      
      // Don't save to localStorage or proceed if registration completely failed
      // Only proceed if it's a non-fatal error like "user exists"
      if (errorMessage.toLowerCase().includes('already exists')) {
        // For existing users, still save basic client info locally but mark as no new account
        const localClient = {
          ...updatedClient,
          hasUserAccount: false,
          existingUser: true,
          error: 'User already exists'
        };
        
        const existingClients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
        existingClients.push(localClient);
        localStorage.setItem('legal-firm-clients', JSON.stringify(existingClients));
        setClient(localClient);
        
        // Still proceed in this case since client data is captured
        handleNext();
      } else {
        // For other errors, clear the password and don't proceed
        const clientWithoutPassword = { ...client };
        delete clientWithoutPassword.password;
        setClient(clientWithoutPassword);
        console.log('❌ Cleared password from client object due to registration failure');
      }
      
      // For other errors, don't proceed to next step
      return null;
    }
  };

  const handleCaseSubmit = async () => {
    // Generate valid MongoDB ObjectId for the case
    const caseId = generateObjectId();
    const updatedCase = {
      ...caseData,
      id: caseId,
      _id: caseId, // Add both id and _id for compatibility
      clientId: client.id || client._id, // Use either id or _id
      createdAt: new Date().toISOString()
    };
    setCaseData(updatedCase);
    
    // Save to localStorage
    const existingCases = JSON.parse(localStorage.getItem('legal-firm-cases') || '[]');
    existingCases.push(updatedCase);
    localStorage.setItem('legal-firm-cases', JSON.stringify(existingCases));
    
    // Save case data to backend (Step 2)
    try {
      await saveFormDetailsToBackend(2);
      console.log('✅ Case data saved to backend');
    } catch (error) {
      console.warn('⚠️ Failed to save case data to backend:', error);
    }
    
    // Save workflow progress after case creation
    try {
      await saveWorkflowProgress();
      console.log('✅ Workflow progress saved after case creation');
    } catch (error) {
      console.warn('⚠️ Failed to save workflow progress after case creation:', error);
    }
    
    handleNext();
  };

  const handleFormsSubmit = async () => {
    if (selectedForms.length === 0) {
      toast.error('Please select a form');
      return;
    }

    setGeneratingCaseIds(true);
    
    try {
      // Generate case ID for the selected form
      console.log('Generating case ID for form:', selectedForms);
      
      let caseIds: Record<string, string> = {};
      
      try {
        // Try to generate case IDs from API first
        caseIds = await generateMultipleCaseIdsFromAPI(selectedForms);
        toast.success(`Generated case ID for ${selectedForms[0]} form`);
      } catch (error) {
        console.warn('API case ID generation failed, using client-side fallback:', error);
        // Fallback to client-side generation
        caseIds = generateMultipleCaseIds(selectedForms);
        toast.success(`Generated case ID for ${selectedForms[0]} form (offline mode)`);
      }
      
      // Store the generated case IDs
      setFormCaseIds(caseIds);
      
      // Log the generated case ID for debugging
      console.log('Generated case ID:', caseIds);
      
      // Update case with selected forms and case IDs
      const updatedCase = {
        ...caseData,
        assignedForms: selectedForms,
        formCaseIds: caseIds // Add case IDs to case data
      };
      setCaseData(updatedCase);
      
      // Save to localStorage
      const existingCases = JSON.parse(localStorage.getItem('legal-firm-cases') || '[]');
      const updatedCases = existingCases.map((c: any) => {
        if (c.id === caseData.id) {
          return updatedCase;
        }
        return c;
      });
      localStorage.setItem('legal-firm-cases', JSON.stringify(updatedCases));
      
      // Save form selection to backend (Step 3)
      try {
        await saveFormDetailsToBackend(3);
        console.log('✅ Form selection saved to backend');
      } catch (error) {
        console.warn('⚠️ Failed to save form selection to backend:', error);
      }
      
      // Save workflow progress after form selection
      try {
        await saveWorkflowProgress();
        console.log('✅ Workflow progress saved after form selection');
      } catch (error) {
        console.warn('⚠️ Failed to save workflow progress after form selection:', error);
      }
      
      handleNext();
    } catch (error) {
      console.error('Error generating case IDs:', error);
      toast.error('Failed to generate case IDs. Please try again.');
    } finally {
      setGeneratingCaseIds(false);
    }
  };

  // State for client credentials
  const [clientCredentials, setClientCredentials] = useState({
    email: '',  // Will be populated with client.email when needed
    password: '',
    createAccount: false
  });

  // State for form details ID (backend integration)
  const [formDetailsId, setFormDetailsId] = useState<string | null>(null);
  
  // State for auto-fill data from API
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [autoFillEnabled, setAutoFillEnabled] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  
  // Function to fetch workflows from API for auto-fill
  const fetchWorkflowsFromAPI = async () => {
    try {
      console.log('🔄 === STARTING API WORKFLOW FETCH ===');
      setLoadingWorkflows(true);
      const token = localStorage.getItem('token');
      
      console.log('🔐 Token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
      });
      
      if (!token) {
        console.warn('❌ No authentication token found. Cannot fetch workflows from API.');
        toast('No authentication token - using local data only');
        return [];
      }

      console.log('🌐 Making API request to /api/v1/workflows...');
      console.log('📋 Request parameters:', {
        status: 'in-progress',
        page: 1,
        limit: 50
      });
      
      const response = await api.get('/api/v1/workflows', {
        params: {
          status: 'in-progress',
          page: 1,
          limit: 50
        }
      });

      console.log('📡 API Response received:', {
        status: response.status,
        statusText: response.statusText,
        dataStructure: {
          hasData: !!response.data,
          hasSuccess: !!response.data?.success,
          hasDataArray: !!response.data?.data,
          dataCount: response.data?.data?.length || 0
        }
      });
      console.log('📋 Full API response data:', response.data);
      
      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        setAvailableWorkflows(workflows);
        console.log(`✅ Successfully loaded ${workflows.length} workflows from API`);
        console.log('📋 Workflow summary:', workflows.map(w => ({
          workflowId: w.workflowId,
          clientEmail: w.client?.email,
          status: w.status,
          updatedAt: w.updatedAt,
          currentStep: w.currentStep
        })));
        return workflows;
      } else {
        console.warn('⚠️ API response structure unexpected:', response.data);
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ API ERROR during workflow fetch:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // If 404, the endpoint might not be available
      if (error.response?.status === 404) {
        console.log('📝 Workflows API endpoint not available (404), using localStorage only');
        toast('Server workflows not available - using local data');
      } else if (error.response?.status === 401) {
        console.log('🔐 Authentication failed (401) - token may be expired');
        toast('Authentication failed - please login again');
      } else {
        console.log('🔥 General API error:', error.response?.status);
        toast.error('Failed to load workflows from server', { duration: 3000 });
      }
      
      return [];
    } finally {
      console.log('🏁 API workflow fetch completed');
      setLoadingWorkflows(false);
    }
  };
  
  // Function to auto-fill workflow data from saved workflows
  const autoFillFromSavedWorkflow = async (workflowData: any) => {
    try {
      console.log('🔄 === STARTING AUTO-FILL FROM SAVED WORKFLOW ===');
      console.log('📋 Workflow data to auto-fill:', {
        workflowId: workflowData.workflowId,
        hasClient: !!workflowData.client,
        hasCase: !!workflowData.case,
        hasResponses: !!workflowData.clientResponses,
        currentStep: workflowData.currentStep,
        responseCount: workflowData.clientResponses ? Object.keys(workflowData.clientResponses).length : 0
      });
      
      // Auto-fill client data
      if (workflowData.client) {
        console.log('📝 Auto-filling client data...');
        console.log('👤 Current client before fill:', {
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address
        });
        console.log('👤 Workflow client data:', workflowData.client);
        
        const newClientData = {
          ...client,
          ...workflowData.client,
          // Ensure we don't overwrite with undefined values
          id: workflowData.client.id || client.id,
          _id: workflowData.client._id || client._id,
          name: workflowData.client.name || client.name,
          email: workflowData.client.email || client.email,
          phone: workflowData.client.phone || client.phone,
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States',
            ...(client.address || {}),
            ...(workflowData.client.address || {})
          },
          dateOfBirth: workflowData.client.dateOfBirth || client.dateOfBirth,
          nationality: workflowData.client.nationality || client.nationality
        };
        
        console.log('👤 Setting new client data:', newClientData);
        setClient(newClientData);
        console.log('✅ Client data auto-filled successfully');
      } else {
        console.log('⚠️ No client data in workflow to auto-fill');
      }
      
      // Auto-fill case data
      if (workflowData.case) {
        console.log('📝 Auto-filling case data...');
        console.log('📋 Current case before fill:', caseData);
        console.log('📋 Workflow case data:', workflowData.case);
        
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
        
        console.log('📋 Setting new case data:', newCaseData);
        setCaseData(newCaseData);
        console.log('✅ Case data auto-filled successfully');
      } else {
        console.log('⚠️ No case data in workflow to auto-fill');
      }
      
      // Auto-fill selected forms
      if (workflowData.selectedForms && Array.isArray(workflowData.selectedForms)) {
        console.log('📝 Auto-filling selected forms:', workflowData.selectedForms);
        setSelectedForms(workflowData.selectedForms);
      }
      
      // Auto-fill form case IDs
      if (workflowData.formCaseIds) {
        console.log('📝 Auto-filling form case IDs:', workflowData.formCaseIds);
        setFormCaseIds(workflowData.formCaseIds);
      }
      
      // Auto-fill questionnaire selection
      if (workflowData.selectedQuestionnaire) {
        console.log('📝 Auto-filling selected questionnaire:', workflowData.selectedQuestionnaire);
        setSelectedQuestionnaire(workflowData.selectedQuestionnaire);
      }
      
      // Auto-fill client credentials (without password for security)
      if (workflowData.clientCredentials) {
        console.log('📝 Auto-filling client credentials...');
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
        console.log('📝 Auto-filling client responses:', workflowData.clientResponses);
        setClientResponses({
          ...clientResponses,
          ...workflowData.clientResponses
        });
      }
      
      // Auto-fill questionnaire assignment if available
      if (workflowData.questionnaireAssignment) {
        console.log('📝 Auto-filling questionnaire assignment:', workflowData.questionnaireAssignment);
        setQuestionnaireAssignment(workflowData.questionnaireAssignment);
      }
      
      // Auto-fill form details if available
      if (workflowData.formDetails && Array.isArray(workflowData.formDetails)) {
        console.log('📝 Auto-filling form details:', workflowData.formDetails);
        setFormDetails(workflowData.formDetails);
      }
      
      // Auto-fill current step (but don't go backwards)
      if (workflowData.currentStep && workflowData.currentStep > currentStep) {
        console.log(`📝 Auto-filling current step: ${workflowData.currentStep}`);
        setCurrentStep(workflowData.currentStep);
      }
      
      console.log('✅ Auto-fill completed successfully');
      toast.success('Workflow data auto-filled from saved progress!', { duration: 4000 });
      
    } catch (error) {
      console.error('❌ Error during auto-fill:', error);
      toast.error('Failed to auto-fill workflow data');
    }
  };
  
  // Function to find and auto-fill matching workflow
  const findAndAutoFillWorkflow = async (clientEmail?: string) => {
    try {
      console.log('🔄 === STARTING AUTO-FILL WORKFLOW SEARCH ===');
      console.log('📧 Client email parameter:', clientEmail);
      
      // First try to fetch from API
      console.log('🌐 Fetching workflows from API...');
      const apiWorkflows = await fetchWorkflowsFromAPI();
      console.log('📊 API workflows fetched:', apiWorkflows.length, 'workflows');
      console.log('📋 API workflow details:', apiWorkflows.map((w: any) => ({
        workflowId: w.workflowId,
        clientEmail: w.client?.email,
        status: w.status,
        updatedAt: w.updatedAt
      })));
      
      // Then get localStorage workflows as fallback
      console.log('💾 Fetching workflows from localStorage...');
      const localWorkflows = JSON.parse(localStorage.getItem('legal-firm-workflows') || '[]');
      console.log('📊 LocalStorage workflows found:', localWorkflows.length, 'workflows');
      console.log('📋 LocalStorage workflow details:', localWorkflows.map((w: any) => ({
        workflowId: w.workflowId,
        clientEmail: w.client?.email,
        status: w.status,
        updatedAt: w.updatedAt
      })));
      
      // Combine both sources
      const allWorkflows = [...apiWorkflows, ...localWorkflows];
      console.log('📊 Total combined workflows:', allWorkflows.length);
      
      if (allWorkflows.length === 0) {
        console.log('📝 No saved workflows found for auto-fill');
        toast('No saved workflows found to auto-fill from');
        return false;
      }
      
      console.log(`🔍 Searching ${allWorkflows.length} workflows for auto-fill match...`);
      
      // Find matching workflow by client email or most recent
      let matchingWorkflow = null;
      
      if (clientEmail) {
        console.log('🔍 Looking for workflow with client email:', clientEmail);
        // Find by client email
        matchingWorkflow = allWorkflows.find(w => {
          const workflowEmail = w.client?.email?.toLowerCase();
          const searchEmail = clientEmail.toLowerCase();
          console.log(`   Comparing: "${workflowEmail}" vs "${searchEmail}"`);
          return workflowEmail === searchEmail;
        });
        
        if (matchingWorkflow) {
          console.log('✅ Found workflow by email match:', {
            workflowId: matchingWorkflow.workflowId,
            clientEmail: matchingWorkflow.client?.email,
            status: matchingWorkflow.status
          });
        } else {
          console.log('❌ No workflow found with matching email');
        }
      }
      
      if (!matchingWorkflow) {
        console.log('🔍 Looking for most recent in-progress workflow...');
        const inProgressWorkflows = allWorkflows.filter(w => w.status === 'in-progress');
        console.log('📊 In-progress workflows found:', inProgressWorkflows.length);
        
        if (inProgressWorkflows.length > 0) {
          matchingWorkflow = inProgressWorkflows
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
          console.log('✅ Using most recent in-progress workflow:', {
            workflowId: matchingWorkflow.workflowId,
            updatedAt: matchingWorkflow.updatedAt
          });
        }
      }
      
      if (matchingWorkflow) {
        console.log('🚀 Found matching workflow for auto-fill! Details:', {
          workflowId: matchingWorkflow.workflowId,
          clientName: matchingWorkflow.client?.name,
          clientEmail: matchingWorkflow.client?.email,
          currentStep: matchingWorkflow.currentStep,
          status: matchingWorkflow.status,
          hasClientData: !!matchingWorkflow.client,
          hasCaseData: !!matchingWorkflow.case,
          hasResponses: !!matchingWorkflow.clientResponses && Object.keys(matchingWorkflow.clientResponses).length > 0
        });
        
        console.log('🔄 Calling autoFillFromSavedWorkflow...');
        await autoFillFromSavedWorkflow(matchingWorkflow);
        return true;
      } else {
        console.log('❌ No matching workflow found for auto-fill');
        toast('No matching workflow found for this client');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error finding workflow for auto-fill:', error);
      toast.error('Error during auto-fill: ' + (error as Error).message);
      return false;
    }
  };
  
  // Function to save all workflow progress before questionnaire assignment
  const saveWorkflowProgress = async () => {
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
        stepsProgress: WORKFLOW_STEPS.map((step, index) => ({
          ...step,
          index,
          status: index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending',
          completedAt: index < currentStep ? new Date().toISOString() : undefined
        }))
      };
      
      console.log('💾 Saving workflow progress:', workflowData);
      
      // Check if we should save to API or localStorage
      const token = localStorage.getItem('token');
      let savedToAPI = false;
      
      if (token) {
        try {
          // Try to save to API first
          const response = await api.post('/api/v1/workflows/progress', workflowData);
          console.log('✅ Workflow progress saved to API:', response.data);
          
          // Store the workflow ID from API response
          if (response.data?.workflowId) {
            workflowData.workflowId = response.data.workflowId;
          }
          
          savedToAPI = true;
          toast.success('Workflow progress saved to server', { duration: 2000 });
          
        } catch (apiError: any) {
          console.warn('⚠️ Failed to save workflow progress to API:', apiError);
          
          // Check if it's a 404 (endpoint doesn't exist)
          if (apiError.response?.status === 404) {
            console.log('📝 Workflow API endpoint not available, using localStorage only');
          } else {
            toast.error('Failed to save to server, using local storage', { duration: 3000 });
          }
        }
      }
      
      // Always save to localStorage as backup
      const existingWorkflows = JSON.parse(localStorage.getItem('legal-firm-workflows') || '[]');
      
      // Update existing workflow or add new one
      const existingIndex = existingWorkflows.findIndex((w: any) => 
        w.client?.email === workflowData.client.email || 
        w.workflowId === workflowData.workflowId
      );
      
      if (existingIndex >= 0) {
        existingWorkflows[existingIndex] = { ...existingWorkflows[existingIndex], ...workflowData };
        console.log('📝 Updated existing workflow in localStorage');
      } else {
        existingWorkflows.push(workflowData);
        console.log('📝 Added new workflow to localStorage');
      }
      
      localStorage.setItem('legal-firm-workflows', JSON.stringify(existingWorkflows));
      
      if (!savedToAPI) {
        toast.success('Workflow progress saved locally', { duration: 2000 });
      }
      
      return workflowData;
      
    } catch (error) {
      console.error('❌ Error saving workflow progress:', error);
      toast.error('Failed to save workflow progress');
      throw error;
    }
  };
  
  // Function to save form details to backend (Steps 1-4)
  const saveFormDetailsToBackend = async (step: number, additionalData?: any) => {
    try {
      console.log(`💾 Saving form details to backend for step ${step}...`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found. Skipping backend save.');
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
            firstName: client.firstName || client.name.split(' ')[0],
            lastName: client.lastName || client.name.split(' ').slice(1).join(' ') || 'Client',
            email: client.email,
            phone: client.phone,
            dateOfBirth: client.dateOfBirth,
            nationality: client.nationality,
            address: client.address,
            clientId: client.id || client._id,
            status: client.status || 'active'
          };
          break;

        case 2:
          // Case information step
          requestData.caseInfo = {
            title: caseData.title,
            caseNumber: caseData.caseNumber,
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
              title: formTemplate.title,
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

      console.log('Form details request data:', requestData);

      // Make API call
      const response = await api.post('/api/v1/form-details', requestData);
      
      console.log('✅ Form details saved to backend:', response.data);
      
      // Store form details ID for future updates
      if (response.data?.data?.id) {
        setFormDetailsId(response.data.data.id);
        console.log('📝 Form details ID stored:', response.data.data.id);
      }

      toast.success(`Step ${step} data saved to server`, { duration: 2000 });
      return response.data;

    } catch (error: any) {
      console.error('❌ Failed to save form details to backend:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save to server';
      console.error('Backend save error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });

      // Don't show error toast for non-critical failures
      if (error.response?.status !== 404) {
        toast.error(`Failed to save step ${step} to server: ${errorMessage}`, { duration: 3000 });
      }
      
      return null;
    }
  };

  // Function to assign questionnaire to form details (Step 4)
  const assignQuestionnaireToFormDetails = async (questionnaireId: string, tempPassword?: string) => {
    try {
      if (!formDetailsId) {
        console.warn('No form details ID available. Cannot assign questionnaire to backend.');
        return null;
      }

      console.log(`💾 Assigning questionnaire to form details ${formDetailsId}...`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found. Skipping backend assignment.');
        return null;
      }

      const requestData = {
        questionnaireId,
        dueDate: caseData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Questionnaire assigned for ${caseData.category || 'immigration'} case`,
        tempPassword
      };

      console.log('Questionnaire assignment request data:', requestData);

      // Make API call to assign questionnaire
      const response = await api.post(`/api/v1/form-details/${formDetailsId}/assign-questionnaire`, requestData);
      
      console.log('✅ Questionnaire assigned to form details:', response.data);
      
      toast.success('Questionnaire assigned and saved to server', { duration: 2000 });
      return response.data;

    } catch (error: any) {
      console.error('❌ Failed to assign questionnaire to form details:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to assign questionnaire';
      console.error('Questionnaire assignment error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });

      toast.error(`Failed to assign questionnaire: ${errorMessage}`, { duration: 3000 });
      return null;
    }
  };
  
  const handleQuestionnaireAssignment = async () => {
    if (!selectedQuestionnaire) return;
    
    // Save all workflow progress before proceeding
    try {
      console.log('💾 Saving workflow progress before questionnaire assignment...');
      await saveWorkflowProgress();
      console.log('✅ Workflow progress saved successfully');
    } catch (saveError) {
      console.error('❌ Failed to save workflow progress:', saveError);
      
      // Ask user if they want to continue without saving
      const continueAnyway = window.confirm(
        'Failed to save workflow progress. Do you want to continue with questionnaire assignment anyway?'
      );
      
      if (!continueAnyway) {
        return;
      }
    }
    
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
        console.log('🔄 Client account creation is enabled, ensuring password is set...');
        
        if (!clientCredentials.password) {
          console.error('❌ Password missing from clientCredentials');
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
        
        console.log('🔑 Setting password in client object before handleClientSubmit');
        console.log('📧 Email:', clientWithCredentials.email);
        console.log('🔑 Password available:', !!clientWithCredentials.password);
        
        // Update both state and the direct object reference
        setClient(clientWithCredentials);
        Object.assign(client, clientWithCredentials);
      }
      
      // Call handleClientSubmit to create the client account if needed
      console.log('🔄 Calling handleClientSubmit...');
      const createdUserId = await handleClientSubmit();
      console.log('✅ handleClientSubmit completed successfully');
      
      // If client account creation is enabled, use the returned user ID
      if (clientCredentials.createAccount && createdUserId) {
        console.log('🔐 Client account creation was enabled, using returned user ID');
        clientUserId = createdUserId;
        console.log('👤 Client user ID from created account:', clientUserId);
      } else {
        console.log('👤 Client account creation disabled or failed, proceeding with questionnaire assignment only');
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
          console.log(`handleAssignQuestionnaire: Found exact match for API questionnaire: ${q.id}`);
          return true;
        }
        
        // Check if any of the possible IDs match
        const matches = possibleIds.includes(selectedQuestionnaire);
        if (matches) {
          console.log(`handleAssignQuestionnaire: Found matching questionnaire by ID: ${selectedQuestionnaire} matched with:`, possibleIds);
        }
        return matches;
      });
      
      if (!selectedQ) {
        toast.error('Could not find selected questionnaire');
        console.warn(`Could not find questionnaire with ID ${selectedQuestionnaire}`);
        return;
      }
      
      // Validate that questionnaire has fields/questions
      const normalizedQ = normalizeQuestionnaireStructure(selectedQ);
      
      // Log the normalized questionnaire for debugging
      console.log('Normalized questionnaire for assignment:', normalizedQ);
      
      // Check for fields/questions in multiple locations
      let fields = normalizedQ.fields || normalizedQ.questions || [];
      
      // Special handling for API format questionnaires
      if (normalizedQ.id && normalizedQ.id.startsWith('q_') && Array.isArray(normalizedQ.fields)) {
        console.log('API questionnaire format detected in assignment:', normalizedQ.id);
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
        console.error(`After normalization, ID is still invalid: ${questionnaireId}`);
        toast.error(`Cannot assign questionnaire with invalid ID format. Please contact support.`);
        setLoading(false);
        return;
      }
      
      // Log the ID type for debugging
      if (isApiQuestionnaire) {
        console.log(`Using API questionnaire ID: ${questionnaireId}`);
      } else {
        console.log(`Using MongoDB questionnaire ID: ${questionnaireId}`);
        // Only validate as MongoDB ObjectId if it's not an API questionnaire
        validateMongoObjectId(questionnaireId, 'questionnaire');
      }
      
      // If we had to convert the ID, log this for debugging
      if (normalizedQ.originalId) {
        console.log(`Using converted ID: Original=${normalizedQ.originalId}, Converted=${questionnaireId}`);
      }
      
      // Use the client ID (which should match the created user account ID)
      let clientId;
      
      if (clientUserId) {
        // If we have a clientUserId (from account creation), use that as clientId too
        clientId = clientUserId;
        console.log(`✅ Using clientId from created user account: ${clientId}`);
      } else {
        // If no user account was created, we should not create a questionnaire assignment
        if (clientCredentials.createAccount) {
          // User wanted account creation but it failed
          console.error('❌ Client account creation was enabled but failed - cannot create assignment without user account');
          toast.error('Cannot create questionnaire assignment because client account creation failed. Please try again.');
          setLoading(false);
          return;
        } else {
          // User explicitly chose not to create account - this should not happen in normal flow
          console.error('❌ No user account available and none was requested - questionnaire assignments require user accounts');
          toast.error('Questionnaire assignments require a client user account. Please enable "Create Account" option.');
          setLoading(false);
          return;
        }
      }
      
      console.log(`Final clientId: ${clientId}`);
      console.log(`ClientUserId: ${clientUserId || 'undefined'}`);
      console.log(`IDs match: ${clientId === clientUserId ? '✅ YES' : '❌ NO'}`);
      console.log(`Client account enabled: ${clientCredentials.createAccount ? '✅ YES' : '❌ NO'}`);
      
      // Final validation - ensure we have a valid MongoDB ObjectId from user account
      try {
        validateMongoObjectId(clientId, 'client');
        console.log(`✅ Client ID validation passed: ${clientId}`);
      } catch (error) {
        console.error('❌ Client ID validation failed:', error);
        toast.error('Invalid client ID - questionnaire assignment requires a valid user account ID.');
        setLoading(false);
        return;
      }
      
      // Validate case ID if it exists and ensure it's a valid MongoDB ObjectId
      let caseId = caseData._id || caseData.id;
      if (caseId) {
        // If the case ID isn't a valid ObjectId, convert it
        if (!isValidMongoObjectId(caseId)) {
          console.warn(`Case ID ${caseId} is not a valid MongoDB ObjectId, converting...`);
          // Check if we already have a caseId._id that's valid
          if (caseData._id && isValidMongoObjectId(caseData._id)) {
            caseId = caseData._id;
          } else {
            // Generate a new valid ObjectId
            caseId = generateObjectId();
            // Save it back to the case object for future use
            caseData._id = caseId;
            
            // Update case in localStorage with the valid ID
            const cases = JSON.parse(localStorage.getItem('legal-firm-cases') || '[]');
            const updatedCases = cases.map((c: any) => {
              if (c.id === caseData.id) {
                return { ...c, _id: caseId };
              }
              return c;
            });
            localStorage.setItem('legal-firm-cases', JSON.stringify(updatedCases));
            
            console.log(`Converted case ID from ${caseData.id} to valid MongoDB ObjectId: ${caseId}`);
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
      console.log('Creating questionnaire assignment with data:', JSON.stringify(assignmentData, null, 2));
      console.log('🔍 Assignment debugging:', {
        clientId,
        clientUserId,
        clientEmail: clientCredentials.email || client.email,
        formType: assignmentData.formType,
        formCaseIdGenerated: assignmentData.formCaseIdGenerated,
        selectedForms: selectedForms,
        formCaseIds: formCaseIds,
        clientFromState: {
          id: client.id,
          _id: client._id,
          userId: client.userId,
          email: client.email
        }
      });
      
      // Check if we have an authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found. Creating assignment in local storage only.');
        toast.error('You must be logged in to assign questionnaires through the API. Will use local storage instead.');
        // Don't throw error, just set a flag to skip API call
        // Use both API and localStorage as needed
        
        // Create and save assignment in localStorage
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
          formCaseIdGenerated: selectedForms.length > 0 && formCaseIds[selectedForms[0]] ? formCaseIds[selectedForms[0]] : undefined
        };
        
        // Save to localStorage
        const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
        existingAssignments.push(localAssignment);
        localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
        
        // Update state
        setQuestionnaireAssignment(localAssignment);
        
        // Show success and proceed
        if (clientCredentials.createAccount && clientUserId) {
          toast.success(
            <div>
              <p>✅ Questionnaire "{normalizedQ.title || normalizedQ.name}" assigned to client {client.name} (local storage)</p>
              <p className="text-sm mt-1">🔐 Client account created:</p>
              <p className="text-xs">Email: {clientCredentials.email || client.email}</p>
              <p className="text-xs">Password: {clientCredentials.password}</p>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.success(`Questionnaire "${normalizedQ.title || normalizedQ.name}" has been assigned to client ${client.name} (local storage only).`);
        }
        setLoading(false);
        handleNext();
        return;
      }
      
      // Log the token (first 10 chars for security) to verify it exists
      console.log(`Using authentication token: ${token.substring(0, 10)}...`);
      
      // Use the controller to check if the API endpoint is available
      const endpointPath = '/api/v1/questionnaire-assignments';
      const endpointAvailable = await isApiEndpointAvailable(endpointPath);
      
      // Log and notify user about API availability
      console.log('Questionnaire assignments endpoint available:', endpointAvailable);
      
      if (!endpointAvailable) {
        toast.error('API endpoint not available. Assignment will be saved locally only.');
      }
      
      let assignment: QuestionnaireAssignment;
      // Track success state for future use
      
      // Only attempt API call if the endpoint is available
      if (endpointAvailable) {
        try {
          // Add debugging for the request
          console.log(`Sending assignment to API: ${APPCONSTANTS.API_BASE_URL}/api/v1/questionnaire-assignments`);
          console.log('Assignment data:', JSON.stringify(assignmentData, null, 2));
          console.log('Request headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...` });
          
          // Send directly with fetch for creating the assignment
          const fetchResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/questionnaire-assignments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
          });
          
          console.log(`Fetch response: status=${fetchResponse.status}, ok=${fetchResponse.ok}`);
          
          if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            console.error(`Fetch error response: ${errorText}`);
            throw new Error(`Assignment creation failed: ${fetchResponse.status} ${fetchResponse.statusText}\n${errorText}`);
          }
          
          // Parse the successful response
          const response = await fetchResponse.json();
          
          // Handle the response which returns json directly
          const responseId = response?.data?.id || response?.id || `assignment_${Date.now()}`;
          console.log('Got assignment ID from API:', responseId);
          
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
          console.log('Questionnaire successfully assigned through API');
        } catch (apiError: any) {
          console.error('API call failed despite server being available:', apiError);
          throw apiError; // Re-throw to be caught by the main catch block
        }
      } else {
        // API not available, fall back to localStorage immediately
        console.warn('API server not available, using localStorage fallback');
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
        
        // Save assignment to localStorage as fallback
        const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
        existingAssignments.push(assignment);
        localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
        toast.success('API server not available. Assignment saved locally only.', { icon: <InfoIcon size={16} /> });
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
        toast.success(`Questionnaire "${selectedQ?.title || selectedQ?.name}" has been assigned to client ${client.name}.`);
      }
      
      // Save questionnaire assignment to backend (Step 4)
      try {
        const backendResult = await assignQuestionnaireToFormDetails(
          questionnaireId,
          clientCredentials.createAccount ? clientCredentials.password : undefined
        );
        
        if (backendResult) {
          console.log('✅ Questionnaire assignment saved to backend');
        } else {
          console.log('⚠️ Backend assignment skipped (offline mode or no form details ID)');
        }
      } catch (error) {
        console.warn('⚠️ Failed to save questionnaire assignment to backend:', error);
        // Don't block the workflow for backend failures
      }
      
      // Move to next step
      handleNext();
    } catch (error: any) {
      console.error('Error assigning questionnaire:', error);
      
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
        // API endpoint not found
        console.error('API endpoint not found:', error.request?.responseURL || '/api/v1/questionnaire-assignments');
        
        // Create a helpful toast message
        toast.error(
          <div>
            <p>The questionnaire assignment API endpoint was not found (404).</p>
            <p className="text-sm mt-2">Possible solutions:</p>
            <ul className="text-sm list-disc pl-4">
              <li>Ensure the API server is running</li>
              <li>Verify the API is accessible at {APPCONSTANTS.API_BASE_URL}</li>
              <li>Check that routes are registered properly in server.js</li>
              <li>If you're running the API on a different port, update the API_BASE_URL</li>
            </ul>
            <p className="text-sm mt-2">A local copy of the assignment has been saved.</p>
          </div>, 
          { duration: 8000 }
        );
        
        // Show simpler message after detailed one
        setTimeout(() => {
          toast.success('Assignment saved locally. You can continue with your workflow.', { icon: <AlertCircle size={16} /> });
        }, 1000);
        
        console.warn('API endpoint not found, using local storage fallback');
      } else if (error?.response?.data?.error) {
        // This is an API error with details
        toast.error(`API Error: ${error.response.data.error}`);
      } else {
        // Generic fallback error
        toast.error('Failed to assign questionnaire. Using local storage as fallback.');
      }
      
      // Don't proceed to next step or save to localStorage if it's an ID validation error
      if (error?.message && error.message.includes('Invalid')) {
        return;
      }
      
      // Create a local assignment as fallback
      console.log('Creating local assignment as fallback to API');
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
          console.log(`localAssignment: Found exact match for API questionnaire: ${q.id}`);
          return true;
        }
        
        // Check if any of the possible IDs match
        const matches = possibleIds.includes(selectedQuestionnaire);
        if (matches) {
          console.log(`localAssignment: Found matching questionnaire by ID: ${selectedQuestionnaire} matched with:`, possibleIds);
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
      
      // Save assignment to localStorage for persistence
      const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
      existingAssignments.push(localAssignment);
      localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
      
      // Show success message to the user
      if (clientCredentials.createAccount && clientUserId) {
        toast.success(
          <div>
            <p>✅ Questionnaire "{selectedQ?.title || selectedQ?.name}" assigned to client {client.name} (local storage)</p>
            <p className="text-sm mt-1">🔐 Client account created:</p>
            <p className="text-xs">Email: {clientCredentials.email || client.email}</p>
            <p className="text-xs">Password: {clientCredentials.password}</p>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.success(`Questionnaire "${selectedQ?.title || selectedQ?.name}" has been assigned to client ${client.name} (local storage mode).`);
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
      
      // Update locally regardless (for resilience)
      const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
      const updatedAssignments = existingAssignments.map((a: any) => {
        if (a.id === questionnaireAssignment.id) {
          return updatedAssignment;
        }
        return a;
      });
      localStorage.setItem('questionnaire-assignments', JSON.stringify(updatedAssignments));
      
      toast.success('Questionnaire responses saved successfully');
      handleNext();
    } catch (error) {
      console.error('Error submitting questionnaire responses:', error);
      toast.error('There was an error saving the responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormDetailsSubmit = () => {
    handleNext();
  };

  // Save the workflow to backend when auto-filling forms (final step)
  const handleAutoFillForms = async () => {
    try {
      setLoading(true);

      // Prepare payload to match backend requirements
      const payload = {
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
        clientResponses: clientResponses || {},
        formDetails: formDetails || [],
        steps: WORKFLOW_STEPS.map((step, idx) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          status: idx < currentStep ? 'completed' : idx === currentStep ? 'current' : 'pending'
        })),
        createdAt: caseData.createdAt || new Date(),
        dueDate: caseData.dueDate || null
      };

      // Call backend API to save the workflow process (correct endpoint)
      const response = await api.post('/api/v1/immigration/process', payload);

      console.log("Workflow saved successfully:", response.data);
      alert('Workflow saved successfully!');

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
      console.error('Error auto-filling forms or saving workflow:', error);
      alert('Error saving workflow or generating forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Start: New or Existing Client
        return (
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
                        console.log('Selected existing client _id:', e.target.value);
                        setSelectedExistingClientId(e.target.value);
                      }}
                      options={[
                        { value: '', label: 'Choose a client' },
                        ...existingClients
                          .filter(c => typeof (c as any)._id === 'string' && (c as any)._id.length === 24)
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
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
              <p className="text-blue-700">Enter the client's personal details to create their profile.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Full Name"
                value={client.name}
                onChange={(e) => {
                  const fullName = e.target.value;
                  // Parse name into firstName and lastName
                  let firstName = '', lastName = '';
                  if (fullName) {
                    const nameParts = fullName.trim().split(' ');
                    if (nameParts.length > 1) {
                      firstName = nameParts[0];
                      lastName = nameParts.slice(1).join(' ');
                    } else {
                      firstName = nameParts[0];
                      lastName = 'Client'; // Default
                    }
                  }
                  setClient({
                    ...client, 
                    name: fullName,
                    firstName: firstName,
                    lastName: lastName
                  });
                }}
                required
              />
              <Input
                id="email"
                label="Email Address"
                type="email"
                value={client.email}
                onChange={(e) => setClient({...client, email: e.target.value})}
                required
              />
              <Input
                id="phone"
                label="Phone Number"
                value={client.phone}
                onChange={(e) => setClient({...client, phone: e.target.value})}
                required
              />
              <Input
                id="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={client.dateOfBirth}
                onChange={(e) => setClient({...client, dateOfBirth: e.target.value})}
                required
              />
              <Input
                id="nationality"
                label="Nationality"
                value={client.nationality}
                onChange={(e) => setClient({...client, nationality: e.target.value})}
                required
              />
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="street"
                  label="Street Address"
                  value={client.address?.street || ''}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...(client.address || {}), street: e.target.value}
                  })}
                  className="md:col-span-2"
                />
                <Input
                  id="city"
                  label="City"
                  value={client.address?.city || ''}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...(client.address || {}), city: e.target.value}
                  })}
                />
                <Input
                  id="state"
                  label="State"
                  value={client.address?.state || ''}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...(client.address || {}), state: e.target.value}
                  })}
                />
                <Input
                  id="zipCode"
                  label="ZIP Code"
                  value={client.address?.zipCode || ''}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...(client.address || {}), zipCode: e.target.value}
                  })}
                />
                <Input
                  id="country"
                  label="Country"
                  value={client.address?.country || ''}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...(client.address || {}), country: e.target.value}
                  })}
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
                  // Save client data to backend (Step 1)
                  try {
                    await saveFormDetailsToBackend(1);
                    console.log('✅ Client data saved to backend');
                  } catch (error) {
                    console.warn('⚠️ Failed to save client data to backend:', error);
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
            </div>
          </div>
        );

      case 2: // Create Case
        return (
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
                <Input
                  id="caseNumber"
                  label="Case Number"
                  placeholder="Enter case number"
                  value={caseData.caseNumber || ''}
                  onChange={e => setCaseData({ ...caseData, caseNumber: e.target.value })}
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
                  id="priority"
                  label="Priority"
                  value={caseData.priority}
                  onChange={e => setCaseData({ ...caseData, priority: e.target.value as "low" | "medium" | "high" })}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                  required
                />
                <Select
                  id="status"
                  label="Status"
                  value={caseData.status}
                  onChange={e => setCaseData({ ...caseData, status: e.target.value as "draft" | "in-progress" | "review" | "completed" })}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'review', label: 'Review' },
                    { value: 'completed', label: 'Completed' }
                  ]}
                  required
                />
                <Input
                  id="visaType"
                  label="Visa Type"
                  value={caseData.visaType || ''}
                  onChange={e => setCaseData({ ...caseData, visaType: e.target.value })}
                  placeholder="E.g., B-2, H-1B, L-1"
                  required
                />
                <Input
                  id="priorityDate"
                  label="Priority Date"
                  type="date"
                  value={caseData.priorityDate || ''}
                  onChange={e => setCaseData({ ...caseData, priorityDate: e.target.value })}
                  required
                />
                <Input
                  id="openDate"
                  label="Open Date"
                  type="date"
                  value={caseData.openDate || ''}
                  onChange={e => setCaseData({ ...caseData, openDate: e.target.value })}
                  required
                />
              </div>
              <div className="mt-4">
                <TextArea
                  id="description"
                  label="Description"
                  value={caseData.description}
                  onChange={e => setCaseData({ ...caseData, description: e.target.value })}
                  rows={4}
                  placeholder="Enter case description"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleCaseSubmit}
                disabled={
                  !caseData.title ||
                  !caseData.category ||
                  !caseData.status ||
                  !caseData.visaType ||
                  !caseData.priorityDate ||
                  !caseData.openDate
                }
              >
                Create Case & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3: // Select Forms
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Required Form</h3>
              <p className="text-purple-700">Select the form required for this case based on the selected category.</p>
            </div>

            {/* Show form templates from backend */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Available Form Templates</h4>
              {loadingFormTemplates ? (
                <div className="text-gray-500">Loading form templates...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formTemplates.length === 0 ? (
                    <div className="text-gray-400">No form templates available.</div>
                  ) : (
                    formTemplates.map(template => (
                      <label key={template._id || template.name} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="selectedForm"
                          checked={selectedForms.includes(template.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForms([template.name]); // Only allow one form selection
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.description}</div>
                          <div className="text-xs text-gray-400">Category: {template.category}</div>
                          {/* Show case ID if form is selected and case ID exists */}
                          {selectedForms.includes(template.name) && formCaseIds[template.name] && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              Case ID: {formatCaseId(formCaseIds[template.name])}
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Display generated case ID summary */}
            {selectedForms.length > 0 && Object.keys(formCaseIds).length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Generated Case ID</h4>
                <div className="space-y-2">
                  {selectedForms.map(formName => (
                    formCaseIds[formName] && (
                      <div key={formName} className="flex justify-between items-center text-sm">
                        <span className="text-green-700">{formName}:</span>
                        <span className="font-mono text-green-800 bg-green-100 px-2 py-1 rounded">
                          {formatCaseId(formCaseIds[formName])}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleFormsSubmit}
                disabled={selectedForms.length === 0 || generatingCaseIds}
              >
                {generatingCaseIds ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating Case ID...
                  </>
                ) : (
                  <>
                    Confirm Form & Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 4: // Assign Questionnaire (now using QuestionnaireBuilder/availableQuestionnaires)
        return (
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
                  console.log('Selected questionnaire ID from dropdown:', selectedId);
                  
                  // Log all available questionnaires with their ID fields for debugging
                  console.log('Available questionnaires with IDs:', availableQuestionnaires.map(q => ({
                    _id: q._id,
                    id: q.id,
                    apiQuestionnaire: q.apiQuestionnaire,
                    originalId: q.originalId,
                    name: q.name,
                    title: q.title
                  })));
                  
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
                      console.log(`Found exact match for API questionnaire: ${q.id}`);
                      return true;
                    }
                    
                    // Check if any of the possible IDs match
                    const matches = possibleIds.includes(selectedId);
                    if (matches) {
                      console.log(`Found matching questionnaire by ID: ${selectedId} matched with:`, possibleIds);
                    }
                    return matches;
                  });
                  
                  console.log('Selected questionnaire details:', selected);
                  setSelectedQuestionnaire(selectedId);
                  
                  // If not found, log a warning
                  if (!selected) {
                    console.warn(`Could not find questionnaire with ID ${selectedId} in available questionnaires`);
                  }
                }}
                options={[
                  { value: '', label: 'Choose a questionnaire' },
                  ...availableQuestionnaires
                    .filter(q => {
                      // Add debug for questionnaire categories
                      console.log(`Questionnaire filter check:`, {
                        id: q._id || q.id,
                        title: q.title || q.name,
                        questCategory: q.category,
                        caseCategory: caseData.category
                      });
                      
                      if (!caseData.category) return true;
                      if (!q.category) return true;
                      const catMap: Record<string, string> = {
                        'family-based': 'FAMILY_BASED',
                        'employment-based': 'EMPLOYMENT_BASED',
                        'citizenship': 'NATURALIZATION',
                        'asylum': 'ASYLUM',
                        'foia': 'FOIA',
                        'other': 'OTHER',
                        'assessment': 'ASSESSMENT',
                      };
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
                        console.log(`Using original API questionnaire ID: ${idToUse}`);
                      } 
                      // For questionnaires with an originalId, offer both options with preference for original
                      else if (normalizedQ.originalId) {
                        // Use the original ID for selection to maintain consistency with saved data
                        idToUse = normalizedQ.originalId;
                        wasConverted = true;
                        console.log(`Using original questionnaire ID for selection: ${idToUse} (MongoDB ID: ${normalizedQ._id})`);
                      }
                      // For normalized IDs, use that format
                      else if (normalizedQ._id) {
                        idToUse = normalizedQ._id;
                        console.log(`Using normalized questionnaire ID: ${idToUse}`);
                      }
                      // Fall back to any available ID
                      else {
                        idToUse = normalizedQ._id || normalizedQ.id || normalizedQ.name || `q_${Date.now()}`;
                        console.log(`Using fallback questionnaire ID: ${idToUse}`);
                      }
                      
                      // Count questions
                      const fields = normalizedQ.fields || [];
                      const questionCount = fields.length;
                      
                      // Log what's being added to the dropdown
                      console.log(`Adding questionnaire to dropdown: ${normalizedQ.title || normalizedQ.name || 'Untitled'} with ID ${idToUse} (${questionCount} questions)`);
                      
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
                    console.log(`Preview: Found exact match for API questionnaire: ${q.id}`);
                    return true;
                  }
                  
                  // Check if any of the possible IDs match
                  const matches = possibleIds.includes(selectedQuestionnaire);
                  if (matches) {
                    console.log(`Preview: Found matching questionnaire by ID: ${selectedQuestionnaire} matched with:`, possibleIds);
                  }
                  return matches;
                });
                
                if (!questionnaire) {
                  console.warn(`Preview: Could not find questionnaire with ID ${selectedQuestionnaire}`);
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
                  console.log('API questionnaire format detected in preview:', questionnaire.id);
                  fields = questionnaire.fields;
                }
                
                console.log('Questionnaire preview fields:', fields);
                
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
                  onChange={(e) => setCaseData({...caseData, dueDate: e.target.value})}
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
                        setClientCredentials({...clientCredentials, createAccount: e.target.checked});
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
                              setClientCredentials({...clientCredentials, email: e.target.value});
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
                              setClientCredentials({...clientCredentials, password: newPassword});
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
              {selectedQuestionnaire && (() => {
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
                    console.log(`Client Review: Found exact match for API questionnaire: ${q.id}`);
                    return true;
                  }
                  
                  // Check if any of the possible IDs match
                  const matches = possibleIds.includes(selectedQuestionnaire);
                  if (matches) {
                    console.log(`Client Review: Found matching questionnaire by ID: ${selectedQuestionnaire} matched with:`, possibleIds);
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
                        No Questions Availableilable
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
              })()}
            </div>
          </div>
        );

      case 5: // Collect Answers (Dynamic client responses for selected questionnaire)
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Client Responses</h3>
              <p className="text-indigo-700">Review and fill out the questionnaire as the client would.</p>
              
              {/* Auto-fill Controls */}
              <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Auto-fill from Saved Data</h4>
                  <div className="flex items-center space-x-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-primary-600"
                        checked={autoFillEnabled}
                        onChange={(e) => setAutoFillEnabled(e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-fill enabled</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      console.log('🔄 AUTO-FILL BUTTON CLICKED');
                      const clientEmail = client.email || clientCredentials.email;
                      console.log('📧 Client email for auto-fill:', clientEmail);
                      console.log('👤 Current client state:', {
                        name: client.name,
                        email: client.email,
                        phone: client.phone,
                        address: client.address
                      });
                      console.log('🔑 Client credentials:', {
                        email: clientCredentials.email,
                        createAccount: clientCredentials.createAccount,
                        hasPassword: !!clientCredentials.password
                      });
                      console.log('📊 Current workflow state:', {
                        currentStep,
                        availableWorkflowsCount: availableWorkflows.length,
                        loadingWorkflows,
                        autoFillEnabled
                      });
                      
                      if (!clientEmail) {
                        console.warn('⚠️ No client email available for auto-fill!');
                        toast.error('No client email available for auto-fill');
                        return;
                      }
                      
                      console.log('🚀 Calling findAndAutoFillWorkflow with email:', clientEmail);
                      findAndAutoFillWorkflow(clientEmail);
                    }}
                    disabled={loadingWorkflows}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                  >
                    {loadingWorkflows ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Auto-fill Now
                      </>
                    )}
                  </button>
                  
                  {availableWorkflows.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {availableWorkflows.length} saved workflow{availableWorkflows.length !== 1 ? 's' : ''} available
                    </div>
                  )}
                  
                  {loadingWorkflows && (
                    <div className="text-xs text-blue-600">
                      Fetching workflows from server...
                    </div>
                  )}
                  
                  {/* Add test data button for development */}
                  <button
                    onClick={() => {
                      console.log('🧪 Creating test workflow data...');
                      const testWorkflow = {
                        workflowId: `workflow_${Date.now()}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        currentStep: 3,
                        status: 'in-progress',
                        client: {
                          firstName: 'Test',
                          lastName: 'Client',
                          name: 'Test Client',
                          email: client.email || 'test@example.com',
                          phone: '555-0123',
                          dateOfBirth: '1990-01-01',
                          nationality: 'USA',
                          address: {
                            street: '123 Test Street',
                            city: 'Test City',
                            state: 'CA',
                            zipCode: '90210',
                            country: 'United States'
                          }
                        },
                        case: {
                          title: 'Test Family Case',
                          description: 'Test case for auto-fill',
                          category: 'family-based',
                          subcategory: 'immediate-relative',
                          status: 'in-progress',
                          priority: 'high'
                        },
                        selectedForms: ['I-130'],
                        selectedQuestionnaire: 'q_test_123',
                        clientResponses: {
                          'field_1752373985684': 'John Smith',
                          'field_1752738016003': 'Jane Smith',
                          'field_1752738040659': 'Robert Smith'
                        }
                      };
                      
                      // Save to localStorage
                      const existingWorkflows = JSON.parse(localStorage.getItem('legal-firm-workflows') || '[]');
                      existingWorkflows.push(testWorkflow);
                      localStorage.setItem('legal-firm-workflows', JSON.stringify(existingWorkflows));
                      
                      // Update available workflows
                      setAvailableWorkflows([...availableWorkflows, testWorkflow]);
                      
                      console.log('✅ Test workflow created:', testWorkflow);
                      toast.success('Test workflow data created! Try auto-fill now.');
                    }}
                    className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                  >
                    Create Test Data
                  </button>
                </div>
                
                {availableWorkflows.length > 1 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                      Select specific workflow ({availableWorkflows.length} available)
                    </summary>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {availableWorkflows.map((workflow, index) => (
                        <button
                          key={workflow.workflowId || index}
                          onClick={() => autoFillFromSavedWorkflow(workflow)}
                          className="block w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
                        >
                          {workflow.client?.name || workflow.client?.email || `Workflow ${index + 1}`} 
                          {workflow.client?.email && ` (${workflow.client.email})`}
                          <span className="text-gray-500 ml-2">
                            {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
              
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
                             style={{backgroundColor: filledFields === totalFields ? '#10b981' : filledFields > 0 ? '#f59e0b' : '#ef4444'}}></div>
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
              console.log('=== QUESTIONNAIRE MATCHING DEBUG ===');
              console.log('questionnaireAssignment:', questionnaireAssignment);
              console.log('Looking for questionnaire with ID:', questionnaireAssignment.questionnaireId);
              console.log('Available questionnaires:', availableQuestionnaires);
              
              const questionnaire = availableQuestionnaires.find(q => {
                // Check all possible ID fields
                const possibleIds = [
                  q._id,          // MongoDB ObjectId
                  q.id,           // Original ID or API ID
                  q.originalId,   // Original ID before conversion
                  q.name          // Fallback to name if used as ID
                ].filter(Boolean); // Remove undefined/null values
                
                console.log('Checking questionnaire:', q);
                console.log('Possible IDs for this questionnaire:', possibleIds);
                
                // For API questionnaires, prioritize matching the q_ prefixed ID
                if (q.apiQuestionnaire && q.id === questionnaireAssignment.questionnaireId) {
                  console.log(`Looking for fields: Found exact match for API questionnaire: ${q.id}`);
                  return true;
                }
                
                // Try exact matches first
                const exactMatch = possibleIds.includes(questionnaireAssignment.questionnaireId);
                if (exactMatch) {
                  console.log(`Looking for fields: Found exact match: ${questionnaireAssignment.questionnaireId}`);
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
                    console.log(`Fuzzy match found: ${id} ≈ ${targetId}`);
                    return true;
                  }
                  
                  return false;
                });
                
                return fuzzyMatch;
              });
              
              console.log('Found questionnaire:', questionnaire);
              
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
              
              console.log('Raw questions found:', questions);
              
              // If API response format is detected
              if (questionnaire.id && questionnaire.id.startsWith('q_') && Array.isArray(questionnaire.fields)) {
                console.log('API questionnaire format detected:', questionnaire.id);
                questions = questionnaire.fields;
              }
                             
              console.log('Questions found for rendering:', questions);
              
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
                      console.log(`Rendering field ${idx}:`, q);
                      
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
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-2 ${
                              isFilled ? 'bg-green-500' : isRequired ? 'bg-red-500' : 'bg-gray-400'
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
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleResponseSubmit}
                disabled={Object.keys(clientResponses).length === 0}
              >
                Responses Complete & Continue
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 6: // Form Details
        return (
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-teal-900 mb-2">Form Details</h3>
              <p className="text-teal-700">Review all details filled so far before proceeding to auto-fill forms.</p>
            </div>

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
                  <div><strong>Case Number:</strong> {caseData.caseNumber}</div>
                  <div><strong>Case Type:</strong> {caseData.type}</div>
                  <div><strong>Status:</strong> {caseData.status}</div>
                  <div><strong>Assigned Attorney:</strong> {caseData.assignedTo}</div>
                  <div><strong>Open Date:</strong> {caseData.openDate}</div>
                  <div><strong>Category:</strong> {IMMIGRATION_CATEGORIES.find(c => c.id === caseData.category)?.name}</div>
                  <div><strong>Subcategory:</strong> {caseData.subcategory}</div>
                  <div className="md:col-span-2"><strong>Description:</strong> {caseData.description}</div>
                </div>

                {/* Questionnaire responses summary */}
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
                      console.log(`Assignment: Found exact match for API questionnaire: ${q.id}`);
                      return true;
                    }
                    
                    // Check if any of the possible IDs match
                    const matches = possibleIds.includes(questionnaireAssignment.questionnaireId);
                    if (matches) {
                      console.log(`Assignment: Found matching questionnaire by ID: ${questionnaireAssignment.questionnaireId} matched with:`, possibleIds);
                    }
                    return matches;
                  });
                  const questions = questionnaire ? (questionnaire.fields || questionnaire.questions) : [];
                  if (!questions || questions.length === 0) {
                    return (
                      <div className="mt-6">
                        <strong className="font-medium text-gray-900 mb-2 block">Questionnaire Responses</strong>
                        <div className="text-gray-500 italic">No questionnaire responses found.</div>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-6">
                      <strong className="font-medium text-gray-900 mb-2 block">Questionnaire Responses</strong>
                      <div className="space-y-2">
                        {questions.map((q: any, idx: number) => {
                          const key = q.id || q.label || `q_${idx}`;
                          const answer = clientResponses[key];
                          let displayAnswer = '';
                          if (Array.isArray(answer)) {
                            displayAnswer = answer.join(', ');
                          } else if (typeof answer === 'boolean') {
                            displayAnswer = answer ? 'Yes' : 'No';
                          } else {
                            displayAnswer = answer || '-';
                          }
                          return (
                            <div key={key} className="flex flex-col md:flex-row md:items-center md:gap-2">
                              <span className="font-medium text-gray-700"><strong>{q.label || q.question}:</strong></span>
                              <span className="text-gray-900">{displayAnswer}</span>
                            </div>
                          );
                        })}
                      </div>
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
              <Button onClick={handleFormDetailsSubmit}>
                Proceed to Auto-Fill
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 7: // Auto-fill Forms
        return (
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
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
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
                    Generate & Download Forms
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/questionnaires/responses')}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Responses
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
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
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
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