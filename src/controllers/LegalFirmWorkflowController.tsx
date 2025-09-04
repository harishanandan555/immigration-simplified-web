import api from '../utils/api';
import { LEGAL_WORKFLOW_ENDPOINTS } from '../utils/constants';

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

// API Functions
export const getWorkflowProgress = async (workflowId: string): Promise<any> => {
  try {
    const response = await api.get(LEGAL_WORKFLOW_ENDPOINTS.GET_WORKFLOW_PROGRESS.replace(':workflowId', workflowId));
    return response.data;
  } catch (error) {
    console.error('Error fetching workflow progress:', error);
    throw error;
  }
};

export const saveWorkflowProgress = async (workflowData: WorkflowData): Promise<any> => {
  try {
    const response = await api.post(LEGAL_WORKFLOW_ENDPOINTS.SAVE_WORKFLOW_PROGRESS, workflowData);
    return response.data;
  } catch (error) {
    console.error('Error saving workflow progress:', error);
    throw error;
  }
};

export const fetchWorkflows = async (searchParams?: {
  search?: string;
  status?: string;
  category?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
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

    const response = await api.get(LEGAL_WORKFLOW_ENDPOINTS.GET_WORKFLOWS, {
      params: Object.fromEntries(params)
    });

    console.log('✅ Workflows fetched successfully:', response.data);
    return response.data.workflows || response.data || [];
  } catch (error) {
    console.error('❌ Error fetching workflows:', error);
    return [];
  }
};

export const fetchWorkflowsForClientSearch = async (searchQuery?: string): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append('search', searchQuery);
      params.append('includeClientInfo', 'true');
    }

    const response = await api.get(LEGAL_WORKFLOW_ENDPOINTS.GET_WORKFLOWS, {
      params: Object.fromEntries(params)
    });

    return response.data.workflows || response.data || [];
  } catch (error) {
    console.error('Error fetching workflows for client search:', error);
    return [];
  }
};

export const checkEmailExists = async (clientEmail: string): Promise<{
  exists: boolean;
  userId?: string;
  role?: string;
  userType?: string;
}> => {
  try {
    const checkResponse = await api.get(LEGAL_WORKFLOW_ENDPOINTS.CHECK_EMAIL.replace(':email', encodeURIComponent(clientEmail.toLowerCase().trim())));
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
};



export const registerCompanyClient = async (userData: {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  companyId: string;
  attorneyIds?: string[];
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
  sendPassword?: boolean;
}): Promise<any> => {
  try {
    // Import the client registration function from AuthControllers
    const { registerCompanyClient: authRegisterCompanyClient } = await import('./AuthControllers');
    
    const response = await authRegisterCompanyClient(
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.password,
      userData.companyId,
      userData.attorneyIds,
      userData.phone,
      userData.nationality,
      userData.address ? {
        street: userData.address.street || '',
        city: userData.address.city || '',
        state: userData.address.state || '',
        zipCode: userData.address.zipCode || '',
        country: userData.address.country || 'United States'
      } : undefined,
      userData.dateOfBirth,
      undefined, // placeOfBirth
      undefined, // gender
      undefined, // maritalStatus
      undefined, // immigrationPurpose
      undefined, // passportNumber
      undefined, // alienRegistrationNumber
      undefined, // nationalIdNumber
      undefined, // bio
      userData.sendPassword
    );
    
    return response;
  } catch (error) {
    console.error('Error registering company client:', error);
    throw error;
  }
};

export const createFormDetails = async (formData: {
  clientId: string;
  formType: string;
  formData: Record<string, any>;
  status: string;
  caseId?: string;
}): Promise<any> => {
  try {
    const requestData = {
      clientId: formData.clientId,
      formType: formData.formType,
      formData: formData.formData,
      status: formData.status,
      caseId: formData.caseId
    };

    const response = await api.post(LEGAL_WORKFLOW_ENDPOINTS.CREATE_FORM_DETAILS, requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating form details:', error);
    throw error;
  }
};

export const assignQuestionnaireToFormDetails = async (
  formDetailsId: string,
  requestData: {
    questionnaireId: string;
    caseId: string;
    clientId: string;
    tempPassword?: string;
  }
): Promise<any> => {
  try {
    const response = await api.post(LEGAL_WORKFLOW_ENDPOINTS.ASSIGN_QUESTIONNAIRE.replace(':formDetailsId', formDetailsId), requestData);
    return response.data;
  } catch (error) {
    console.error('Error assigning questionnaire to form details:', error);
    throw error;
  }
};

export const fetchQuestionnaireAssignments = async (): Promise<any[]> => {
  try {
    const response = await api.get(LEGAL_WORKFLOW_ENDPOINTS.GET_QUESTIONNAIRE_ASSIGNMENTS);
    return response.data.assignments || response.data || [];
  } catch (error) {
    console.error('Error fetching questionnaire assignments:', error);
    return [];
  }
};

export const createQuestionnaireAssignment = async (assignmentData: {
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
}): Promise<any> => {
  try {
    const response = await api.post(LEGAL_WORKFLOW_ENDPOINTS.GET_QUESTIONNAIRE_ASSIGNMENTS, assignmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating questionnaire assignment:', error);
    throw error;
  }
};

export const submitImmigrationProcess = async (payload: ImmigrationProcessPayload): Promise<any> => {
  try {
    const response = await api.post(LEGAL_WORKFLOW_ENDPOINTS.SUBMIT_IMMIGRATION_PROCESS, payload);
    return response.data;
  } catch (error) {
    console.error('Error submitting immigration process:', error);
    throw error;
  }
};

export const getWorkflowResumptionParams = (): {
  resumeWorkflowId: string | null;
  fromQuestionnaireResponses: string | null;
} => {
  const urlParams = new URLSearchParams(window.location.search);
  const resumeWorkflowId = urlParams.get('resumeWorkflow');
  const fromQuestionnaireResponses = urlParams.get('fromQuestionnaireResponses');
  
  return { resumeWorkflowId, fromQuestionnaireResponses };
};

export const clearWorkflowResumptionParams = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete('resumeWorkflow');
  url.searchParams.delete('fromQuestionnaireResponses');
  window.history.replaceState({}, '', url.toString());
};

export const generateMultipleCaseIds = async (formTypes: string[]): Promise<Record<string, string>> => {
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
};

export const validateFormData = (formData: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} => {
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
};

export const formatCaseId = (caseId: string): string => {
  // Add case ID formatting logic here
  return caseId.toUpperCase().replace(/[^A-Z0-9-]/g, '');
};

export const isApiEndpointAvailable = async (endpointPath: string): Promise<boolean> => {
  try {
    // Check the specific endpoint using api utility
    try {
      await api.head(endpointPath);
      return true;
    } catch (error: any) {
      // If we get a 401, the endpoint exists but requires auth
      if (error.response?.status === 401) {
        return true;
      }
      // If we get a 404, the endpoint doesn't exist
      if (error.response?.status === 404) {
        return false;
      }
      // For other errors, assume endpoint is available
      return true;
    }
  } catch (error) {
    console.error('Error checking API endpoint availability:', error);
    return false;
  }
};

export default {
  getWorkflowProgress,
  saveWorkflowProgress,
  fetchWorkflows,
  fetchWorkflowsForClientSearch,
  checkEmailExists,
  registerCompanyClient,
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
  isApiEndpointAvailable
};
