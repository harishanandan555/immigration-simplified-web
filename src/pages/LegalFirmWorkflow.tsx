import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, ClipboardList, Send, Download, CheckCircle, 
  ArrowRight, ArrowLeft, Plus, User, Briefcase, FormInput,
  MessageSquare, FileCheck, AlertCircle, Clock, Star, Info as InfoIcon,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { validateMongoObjectId, isValidMongoObjectId, generateObjectId } from '../utils/idValidation';
// No debug utilities needed in production
import api from '../utils/api';
import { APPCONSTANTS } from '../utils/constants';

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
  generateSecurePassword,
  createClientUserAccount
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

  // Questionnaire assignment and responses
  const [questionnaireAssignment, setQuestionnaireAssignment] = useState<QuestionnaireAssignment | null>(null);
  const [clientResponses, setClientResponses] = useState<Record<string, any>>({});

  // Form details
  const [formDetails, setFormDetails] = useState<FormData[]>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  // Load available questionnaires
  useEffect(() => {
    loadQuestionnaires();
  }, []);

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
    if (currentStep < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
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
      createdAt: new Date().toISOString()
    };
    setClient(updatedClient);
    
    try {
      // Try to create the client in the backend API
      const response = await api.post('/api/v1/clients', {
        name: client.name,
        firstName: updatedClient.firstName, // Use the parsed firstName
        lastName: updatedClient.lastName,   // Use the parsed lastName
        email: client.email,
        phone: client.phone || '555-555-5555', // Default phone if not provided
        dateOfBirth: client.dateOfBirth || new Date().toISOString(), // Default DOB if not provided
        nationality: client.nationality || 'Unknown',
        address: client.address || {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        status: 'active'
      });
      
      // If successful, use the returned client ID from the API
      if (response.data && (response.data._id || response.data.id)) {
        const apiClientId = response.data._id || response.data.id;
        console.log(`Client created in API with ID: ${apiClientId}`);
        
        // Update the client with the API-generated ID
        const apiClient = {
          ...updatedClient,
          id: apiClientId,
          _id: apiClientId
        };
        setClient(apiClient);
        
        // Save to localStorage for future reference
        const existingClients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
        existingClients.push(apiClient);
        localStorage.setItem('legal-firm-clients', JSON.stringify(existingClients));
      } else {
        // Fallback to local storage if API doesn't return an ID
        const existingClients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
        existingClients.push(updatedClient);
        localStorage.setItem('legal-firm-clients', JSON.stringify(existingClients));
      }
    } catch (error) {
      console.error('Failed to create client in API:', error);
      // Fallback to localStorage storage
      const existingClients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
      existingClients.push(updatedClient);
      localStorage.setItem('legal-firm-clients', JSON.stringify(existingClients));
    }
    
    console.log('Client saved, calling handleNext');
    handleNext();
  };

  const handleCaseSubmit = () => {
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
    
    handleNext();
  };

  const handleFormsSubmit = () => {
    // Update case with selected forms
    const updatedCase = {
      ...caseData,
      assignedForms: selectedForms
    };
    setCaseData(updatedCase);
    handleNext();
  };

  // State for client credentials
  const [clientCredentials, setClientCredentials] = useState({
    email: '',  // Will be populated with client.email when needed
    password: '',
    createAccount: false
  });
  
  const handleQuestionnaireAssignment = async () => {
    if (!selectedQuestionnaire) return;
    
    setLoading(true);
    
    // Declare assignmentData in outer scope so it's accessible in the catch block
    let assignmentData: any = null;
    
    try {
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
      
      // Check if we need to create a client account
      let clientUserId = null;
      if (clientCredentials.createAccount && clientCredentials.email && clientCredentials.password) {
        // Create client user account first
        try {
          // Parse name into first and last name, ensuring lastName is never empty
          let firstName = '', lastName = '';
          if (client.name) {
            const nameParts = client.name.trim().split(' ');
            if (nameParts.length > 1) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              // If only one word in name, use it as firstName and default lastName
              firstName = nameParts[0];
              lastName = 'Client'; // Default last name to ensure validation passes
            }
          } else {
            // Provide default values if name is empty
            firstName = 'New';
            lastName = 'Client';
          }
          
          console.log(`Creating client user account for: ${firstName} ${lastName}`);
          
          // Use controller to create client account
          const userResponse = await createClientUserAccount({
            firstName: firstName,
            lastName: lastName,
            email: clientCredentials.email.toLowerCase(),
            password: clientCredentials.password,
            role: 'client',
            userType: 'individual'
          });
          
          clientUserId = userResponse._id;
          console.log('Client user account created with ID:', clientUserId);
          
          toast.success(`Client account created successfully for ${clientCredentials.email}`);
        } catch (error: any) {
          console.error('Error creating client account:', error);
          toast.error(`Account creation failed: ${error.message}`);
          // Continue with questionnaire assignment even if account creation fails
        }
      }
      
      // Get questionnaire ID from normalized questionnaire
      // Since we now ensure all IDs are valid in normalizeQuestionnaireStructure
      const questionnaireId = normalizedQ._id;
      
      if (!isValidMongoObjectId(questionnaireId)) {
        console.error(`After normalization, ID is still invalid: ${questionnaireId}`);
        toast.error(`Cannot assign questionnaire with invalid ID format. Please contact support.`);
        setLoading(false);
        return;
      }
      
      // If we had to convert the ID, log this for debugging
      if (normalizedQ.originalId) {
        console.log(`Using converted ID: Original=${normalizedQ.originalId}, Converted=${questionnaireId}`);
      }
      
      validateMongoObjectId(questionnaireId, 'questionnaire');
      
      // If we have a clientUserId from user creation, use that instead
      let clientId = clientUserId || client._id || client.id;
      
      console.log(`Using client ID: ${clientId} (from user creation: ${!!clientUserId})`);
      
      // If the client ID isn't a valid ObjectId, convert it to one and store the mapping
      if (!isValidMongoObjectId(clientId)) {
        console.warn(`Client ID ${clientId} is not a valid MongoDB ObjectId, converting...`);
        // Check if we already have a clientId._id that's valid
        if (client._id && isValidMongoObjectId(client._id)) {
          clientId = client._id;
        } else {
          // Generate a new valid ObjectId
          clientId = generateObjectId();
          // Save it back to the client object for future use
          client._id = clientId;
          
          // Update client in localStorage with the valid ID
          const clients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
          const updatedClients = clients.map((c: any) => {
            if (c.id === client.id) {
              return { ...c, _id: clientId };
            }
            return c;
          });
          localStorage.setItem('legal-firm-clients', JSON.stringify(updatedClients));
          
          console.log(`Converted client ID from ${client.id} to valid MongoDB ObjectId: ${clientId}`);
        }
      }
      
      // Final validation
      try {
        validateMongoObjectId(clientId, 'client');
      } catch (error) {
        console.error('Failed to validate client ID:', error);
        toast.error('Could not create a valid client ID. Please try again.');
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
      
      // Define the assignment data
      assignmentData = {
        questionnaireId,
        questionnaireName: normalizedQ.title || 'Questionnaire',
        clientId,
        caseId: caseId || undefined,
        status: 'pending',
        assignedAt: new Date().toISOString(),
        dueDate: caseData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days due date
        notes: `Please complete this questionnaire for your ${caseData.category || 'immigration'} case.`,
        clientUserId: clientUserId, // Include the user ID if a new account was created
        clientEmail: clientCredentials.email || client.email // Use provided email or client email
      };
      
      // Debug log the validated data before making the API call
      console.log('Creating questionnaire assignment with data:', JSON.stringify(assignmentData, null, 2));
      
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
          clientUserId: clientUserId
        };
        
        // Save to localStorage
        const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
        existingAssignments.push(localAssignment);
        localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
        
        // Update state
        setQuestionnaireAssignment(localAssignment);
        
        // Show success and proceed
        toast.success(`Questionnaire "${normalizedQ.title || normalizedQ.name}" has been assigned to client ${client.name} (local storage only).`);
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
            clientUserId: assignmentData.clientUserId
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
          clientUserId: assignmentData.clientUserId
        };
        
        // Save assignment to localStorage as fallback
        const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
        existingAssignments.push(assignment);
        localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
        toast.success('API server not available. Assignment saved locally only.', { icon: <InfoIcon size={16} /> });
      }
      
      setQuestionnaireAssignment(assignment);
      
      // Notify the user of success
      toast.success(`Questionnaire "${selectedQ?.title || selectedQ?.name}" has been assigned to client ${client.name}.`);
      
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
        clientUserId: assignmentData ? assignmentData.clientUserId : undefined
      };
      
      // Update the state with our local assignment
      setQuestionnaireAssignment(localAssignment);
      
      // Save assignment to localStorage for persistence
      const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
      existingAssignments.push(localAssignment);
      localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
      
      // Show success message to the user
      toast.success(`Questionnaire "${selectedQ?.title || selectedQ?.name}" has been assigned to client ${client.name} (local storage mode).`);
      
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
          petitionerMailingAddress: `${client.address.street}, ${client.address.city}, ${client.address.state} ${client.address.zipCode}`,
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
                  value={client.address.street}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, street: e.target.value}
                  })}
                  className="md:col-span-2"
                />
                <Input
                  id="city"
                  label="City"
                  value={client.address.city}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, city: e.target.value}
                  })}
                />
                <Input
                  id="state"
                  label="State"
                  value={client.address.state}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, state: e.target.value}
                  })}
                />
                <Input
                  id="zipCode"
                  label="ZIP Code"
                  value={client.address.zipCode}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, zipCode: e.target.value}
                  })}
                />
                <Input
                  id="country"
                  label="Country"
                  value={client.address.country}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, country: e.target.value}
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
                onClick={handleClientSubmit}
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
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Required Forms</h3>
              <p className="text-purple-700">Select the forms required for this case based on the selected category.</p>
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
                      <label key={template._id || template.name} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedForms.includes(template.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForms([...selectedForms, template.name]);
                            } else {
                              setSelectedForms(selectedForms.filter(f => f !== template.name));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.description}</div>
                          <div className="text-xs text-gray-400">Category: {template.category}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleFormsSubmit}
                disabled={selectedForms.length === 0}
              >
                Confirm Forms & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
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
                const hasValidId = questionnaire._id && isValidMongoObjectId(questionnaire._id);
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
                  console.log(`Looking for fields: Found exact match for API questionnaire: ${q.id}`);
                  return true;
                }
                
                // Check if any of the possible IDs match
                const matches = possibleIds.includes(questionnaireAssignment.questionnaireId);
                if (matches) {
                  console.log(`Looking for fields: Found matching questionnaire by ID: ${questionnaireAssignment.questionnaireId} matched with:`, possibleIds);
                }
                return matches;
              });
              
              // Debug log to check questionnaire matching
              console.log('Looking for questionnaire with ID:', questionnaireAssignment.questionnaireId);
              console.log('Available questionnaires:', availableQuestionnaires.map(q => ({ 
                id: q._id || q.id || q.name, title: q.title || q.name 
              })));
              console.log('Found questionnaire:', questionnaire);
              
              if (!questionnaire) return null;
              
              // Try to find questions/fields in multiple possible locations
              let questions = questionnaire.fields || 
                           questionnaire.questions || 
                           questionnaire.form?.fields || 
                           questionnaire.form?.questions || 
                           [];
              
              // If API response format is detected
              if (questionnaire.id && questionnaire.id.startsWith('q_') && Array.isArray(questionnaire.fields)) {
                console.log('API questionnaire format detected:', questionnaire.id);
                questions = questionnaire.fields;
              }
                             
              console.log('Questions found for rendering:', questions);
              
              if (!questions || questions.length === 0) {
                return <div className="text-gray-500">No questions found in this questionnaire.</div>;
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
                      
                      // Render input based on type
                      if (fieldType === 'date') {
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                            <Input
                              id={fieldId}
                              label=""
                              type="date"
                              value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
                              onChange={e => setClientResponses({
                                ...clientResponses,
                                [fieldId]: e.target.value
                              })}
                            />
                          </div>
                        );
                      } else if (fieldType === 'select' && Array.isArray(fieldOptions)) {
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
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
                            />
                          </div>
                        );
                      } else if (fieldType === 'multiselect' && Array.isArray(fieldOptions)) {
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                            <select
                              multiple
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                          </div>
                        );
                      } else if (fieldType === 'checkbox' && Array.isArray(fieldOptions)) {
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                            <div className="flex flex-wrap gap-4">
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
                          </div>
                        );
                      } else if (fieldType === 'radio' && Array.isArray(fieldOptions)) {
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                            <div className="flex flex-wrap gap-4">
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
                          </div>
                        );
                      } else if (fieldType === 'textarea') {
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                            <TextArea
                              id={fieldId}
                              label=""
                              value={clientResponses[fieldId] || clientResponses[fieldLabel] || ''}
                              onChange={e => setClientResponses({
                                ...clientResponses,
                                [fieldId]: e.target.value
                              })}
                              rows={3}
                            />
                          </div>
                        );
                      } else {
                        // Default to text input
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
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
                            />
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              );
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
          <h1 className="text-3xl font-bold text-gray-900">Legal Firm Workflow</h1>
          <p className="text-gray-600 mt-2">Complete immigration case management from client to forms</p>
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