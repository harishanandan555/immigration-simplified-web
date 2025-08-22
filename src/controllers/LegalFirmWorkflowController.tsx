import api from '../utils/api';
import { APPCONSTANTS } from '../utils/constants';

// Types
export interface Client {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    aptSuiteFlr?: string;
    aptNumber?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  dateOfBirth?: string;
  nationality?: string;
}

export interface Case {
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

export interface QuestionnaireAssignment {
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
  tempPassword?: string;
  formCaseIds?: Record<string, string>;
  selectedForms?: string[];
  accountCreated?: boolean;
  formType?: string;
  formCaseIdGenerated?: string;
  clientFirstName?: string;
  clientMiddleName?: string;
  clientLastName?: string;
  clientFullName?: string;
  clientAddress?: {
    street?: string;
    aptSuiteFlr?: string;
    aptNumber?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  clientPhone?: string;
  clientDateOfBirth?: string;
  clientNationality?: string;
}

export interface FormData {
  formType: string;
  data: Record<string, any>;
  status: 'draft' | 'review' | 'completed';
}

export interface WorkflowData {
  id?: string;
  workflowId?: string;
  clientId?: string;
  currentStep: number;
  steps?: any[];
  clientInfo?: Client;
  client?: any;
  case?: any;
  selectedForms?: string[];
  formCaseIds?: Record<string, string>;
  selectedQuestionnaire?: any;
  clientCredentials?: any;
  stepsProgress?: any[];
  formsData?: FormData[];
  questionnaires?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImmigrationProcessPayload {
  clientInfo: Client;
  selectedForms: string[];
  questionnaireResponses: Record<string, any>;
  formData: Record<string, any>;
}

// API Endpoints
export const LEGAL_WORKFLOW_ENDPOINTS = {
  // Workflow Progress
  GET_WORKFLOW_PROGRESS: '/api/v1/workflows/progress/:workflowId',
  SAVE_WORKFLOW_PROGRESS: '/api/v1/workflows/progress',
  
  // Workflows
  GET_WORKFLOWS: '/api/v1/workflows',
  
  // Form Details
  CREATE_FORM_DETAILS: '/api/v1/form-details',
  ASSIGN_QUESTIONNAIRE: '/api/v1/form-details/:formDetailsId/assign-questionnaire',
  
  // User Management
  CHECK_EMAIL: '/api/v1/users/check-email/:email',
  REGISTER_USER: '/api/v1/auth/register/user',
  
  // Questionnaire Assignments
  GET_QUESTIONNAIRE_ASSIGNMENTS: '/api/v1/questionnaire-assignments',
  
  // Immigration Process
  SUBMIT_IMMIGRATION_PROCESS: '/api/v1/immigration/process'
};

// API Functions
export class LegalFirmWorkflowController {
  /**
   * Get workflow progress by ID
   */
  static async getWorkflowProgress(workflowId: string): Promise<any> {
    try {
      const response = await api.get(`/api/v1/workflows/progress/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow progress:', error);
      throw error;
    }
  }

  /**
   * Save workflow progress
   */
  static async saveWorkflowProgress(workflowData: WorkflowData): Promise<any> {
    try {
      const response = await api.post('/api/v1/workflows/progress', workflowData);
      return response.data;
    } catch (error) {
      console.error('Error saving workflow progress:', error);
      throw error;
    }
  }

  /**
   * Fetch workflows from API with optional search parameters
   */
  static async fetchWorkflows(searchParams?: {
    search?: string;
    status?: string;
    category?: string;
    assignedTo?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      console.log('🔄 Fetching workflows from API...');
      
      const params = new URLSearchParams();
      if (searchParams?.search) params.append('search', searchParams.search);
      if (searchParams?.status) params.append('status', searchParams.status);
      if (searchParams?.category) params.append('category', searchParams.category);
      if (searchParams?.assignedTo) params.append('assignedTo', searchParams.assignedTo);
      if (searchParams?.startDate) params.append('startDate', searchParams.startDate);
      if (searchParams?.endDate) params.append('endDate', searchParams.endDate);
      if (searchParams?.limit) params.append('limit', searchParams.limit.toString());
      if (searchParams?.offset) params.append('offset', searchParams.offset.toString());

      const response = await api.get('/api/v1/workflows', {
        params: Object.fromEntries(params)
      });

      console.log('✅ Workflows fetched successfully:', response.data);
      return response.data.workflows || response.data || [];
    } catch (error) {
      console.error('❌ Error fetching workflows:', error);
      return [];
    }
  }

  /**
   * Fetch workflows for client search
   */
  static async fetchWorkflowsForClientSearch(searchQuery?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
        params.append('includeClientInfo', 'true');
      }

      const response = await api.get('/api/v1/workflows', {
        params: Object.fromEntries(params)
      });

      return response.data.workflows || response.data || [];
    } catch (error) {
      console.error('Error fetching workflows for client search:', error);
      return [];
    }
  }

  /**
   * Check if email exists and return user info if found
   */
  static async checkEmailExists(clientEmail: string): Promise<{
    exists: boolean;
    userId?: string;
    role?: string;
    userType?: string;
  }> {
    try {
      const checkResponse = await api.get(`/api/v1/users/check-email/${encodeURIComponent(clientEmail.toLowerCase().trim())}`);
      return {
        exists: checkResponse.data.exists || false,
        userId: checkResponse.data.userId,
        role: checkResponse.data.role,
        userType: checkResponse.data.userType
      };
    } catch (error) {
      console.error('Error checking email existence:', error);
      return { exists: false };
    }
  }

  /**
   * Register new user
   */
  static async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    role: string;
    userType?: string;
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: {
      street?: string;
      aptSuiteFlr?: string;
      aptNumber?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
    companyId?: string;
    sendPassword?: boolean;
  }): Promise<any> {
    try {
      const response = await api.post('/api/v1/auth/register/user', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Create form details
   */
  static async createFormDetails(formData: {
    clientId: string;
    formType: string;
    formData: Record<string, any>;
    status: string;
    caseId?: string;
  }): Promise<any> {
    try {
      const requestData = {
        clientId: formData.clientId,
        formType: formData.formType,
        formData: formData.formData,
        status: formData.status,
        caseId: formData.caseId
      };

      const response = await api.post('/api/v1/form-details', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating form details:', error);
      throw error;
    }
  }

  /**
   * Assign questionnaire to form details
   */
  static async assignQuestionnaireToFormDetails(
    formDetailsId: string,
    requestData: {
      questionnaireId: string;
      caseId: string;
      clientId: string;
      tempPassword?: string;
    }
  ): Promise<any> {
    try {
      const response = await api.post(`/api/v1/form-details/${formDetailsId}/assign-questionnaire`, requestData);
      return response.data;
    } catch (error) {
      console.error('Error assigning questionnaire to form details:', error);
      throw error;
    }
  }

  /**
   * Fetch questionnaire assignments
   */
  static async fetchQuestionnaireAssignments(): Promise<any[]> {
    try {
      const fetchResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}${LEGAL_WORKFLOW_ENDPOINTS.GET_QUESTIONNAIRE_ASSIGNMENTS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        return data.assignments || data || [];
      } else {
        console.warn('Failed to fetch questionnaire assignments from API');
        return [];
      }
    } catch (error) {
      console.error('Error fetching questionnaire assignments:', error);
      return [];
    }
  }

  /**
   * Create questionnaire assignment
   */
  static async createQuestionnaireAssignment(assignmentData: {
    caseId: string;
    clientId: string;
    questionnaireId: string;
    dueDate?: string;
    notes?: string;
    clientEmail?: string;
    clientUserId?: string;
    accountCreated?: boolean;
    formCaseIds?: Record<string, string>;
    selectedForms?: string[];
    formType?: string;
    formCaseIdGenerated?: string;
    tempPassword?: string;
  }): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      const fetchResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}${LEGAL_WORKFLOW_ENDPOINTS.GET_QUESTIONNAIRE_ASSIGNMENTS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        throw new Error(`Assignment creation failed: ${fetchResponse.status} ${fetchResponse.statusText}\n${errorText}`);
      }

      const response = await fetchResponse.json();
      return response;
    } catch (error) {
      console.error('Error creating questionnaire assignment:', error);
      throw error;
    }
  }

  /**
   * Submit immigration process
   */
  static async submitImmigrationProcess(payload: ImmigrationProcessPayload): Promise<any> {
    try {
      const response = await api.post('/api/v1/immigration/process', payload);
      return response.data;
    } catch (error) {
      console.error('Error submitting immigration process:', error);
      throw error;
    }
  }

  /**
   * Get URL parameters for workflow resumption
   */
  static getWorkflowResumptionParams(): {
    resumeWorkflowId: string | null;
    fromQuestionnaireResponses: string | null;
  } {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeWorkflowId = urlParams.get('resumeWorkflow');
    const fromQuestionnaireResponses = urlParams.get('fromQuestionnaireResponses');
    
    return { resumeWorkflowId, fromQuestionnaireResponses };
  }

  /**
   * Clear workflow resumption parameters from URL
   */
  static clearWorkflowResumptionParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('resumeWorkflow');
    url.searchParams.delete('fromQuestionnaireResponses');
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Generate case IDs for multiple forms
   */
  static async generateMultipleCaseIds(formTypes: string[]): Promise<Record<string, string>> {
    try {
      // This would typically call the case ID generation API
      // For now, returning a mock implementation
      const caseIds: Record<string, string> = {};
      formTypes.forEach(formType => {
        caseIds[formType] = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      });
      return caseIds;
    } catch (error) {
      console.error('Error generating case IDs:', error);
      throw error;
    }
  }

  /**
   * Validate form data
   */
  static validateFormData(formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Add validation logic here based on your requirements
    if (!formData.clientId) {
      errors.push('Client ID is required');
    }
    
    if (!formData.formType) {
      errors.push('Form type is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format case ID
   */
  static formatCaseId(caseId: string): string {
    // Add case ID formatting logic here
    return caseId.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }

  /**
   * Check if a specific API endpoint is available
   */
  static async isApiEndpointAvailable(endpointPath: string): Promise<boolean> {
    try {
      // First check if the base API is available
      let apiAvailable = false;
      try {
        apiAvailable = await fetch(`${APPCONSTANTS.API_BASE_URL}`).then(res => res.ok).catch(() => false);
      } catch (error) {
        console.error('Error checking base API availability:', error);
        return false;
      }

      if (!apiAvailable) {
        console.warn('Base API is not available');
        return false;
      }

      // Then check the specific endpoint
      const token = localStorage.getItem('token');
      let endpointAvailable = false;
      try {
        const fullEndpointUrl = `${APPCONSTANTS.API_BASE_URL}${endpointPath}`;
        endpointAvailable = await fetch(fullEndpointUrl, {
          method: 'HEAD',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).then(res => res.ok || res.status === 401).catch(() => false);
      } catch (error) {
        console.error(`Error checking endpoint availability for ${endpointPath}:`, error);
        return false;
      }

      return endpointAvailable;
    } catch (error) {
      console.error('Error checking API endpoint availability:', error);
      return false;
    }
  }
  
}

export default LegalFirmWorkflowController;
