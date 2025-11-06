import api from '../utils/api';
import { LEGAL_WORKFLOW_ENDPOINTS } from '../utils/constants';

// Types
export interface Client {
  _id?: string;
  clientId?: string; // MongoDB ObjectId reference to DEFAULT_IMS_Client
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
  formNumber?: string;
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
  formNumber: string;
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
    
    console.log(' getWorkflowProgress:', response.data);
    // Handle the nested response structure
    const workflowData = response.data.data || response.data;
    
    console.log('✅ getWorkflowProgress: Retrieved workflow data:', {
      hasData: !!workflowData,
      responseKeys: response.data ? Object.keys(response.data) : [],
      workflowDataKeys: workflowData ? Object.keys(workflowData) : [],
      hasClient: !!workflowData?.client,
      hasCase: !!workflowData?.case,
      hasSelectedForms: !!(workflowData?.selectedForms && workflowData.selectedForms.length > 0)
    });
    
    return workflowData;
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

    // Handle different response structures
    const workflows = response.data.data || response.data.workflows || response.data || [];
    
    // Ensure we always return an array
    if (!Array.isArray(workflows)) {
      console.warn('⚠️ fetchWorkflows: API response is not an array:', typeof workflows, workflows);
      return [];
    }
    
    console.log('✅ fetchWorkflows: Retrieved workflows:', workflows.length);
    return workflows;
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

    // Handle different response structures
    const workflows = response.data.data || response.data.workflows || response.data || [];
    
    // Ensure we always return an array
    if (!Array.isArray(workflows)) {
      console.warn('⚠️ fetchWorkflowsForClientSearch: API response is not an array:', typeof workflows, workflows);
      return [];
    }
    
    console.log('✅ fetchWorkflowsForClientSearch: Retrieved workflows:', workflows.length);
    return workflows;
  } catch (error) {
    console.error('Error fetching workflows for client search:', error);
    return [];
  }
};

/**
 * Get complete workflow details by client email or ID
 * @param {string} clientIdentifier - Client email or ID
 * @param {Object} options - Query parameters
 * @returns {Promise<Object>} Complete workflow data
 */
export const getWorkflowsByClient = async (
  clientIdentifier: string, 
  options: {
    page?: number;
    limit?: number;
    status?: string;
    currentStep?: number;
    includeQuestions?: boolean;
  } = {}
): Promise<{
  success: boolean;
  count: number;
  data: any[];
  error?: string;
}> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      currentStep,
      includeQuestions = false
    } = options;

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      includeQuestions: includeQuestions.toString()
    });

    if (status) queryParams.append('status', status);
    if (currentStep) queryParams.append('currentStep', currentStep.toString());

    console.log('🔄 DEBUG: ========== getWorkflowsByClient STARTED ==========');
    console.log('🔄 DEBUG: Input Parameters:', {
      clientIdentifier,
      options,
      queryString: queryParams.toString(),
      fullURL: `/api/v1/workflows/by-client/${encodeURIComponent(clientIdentifier)}?${queryParams}`,
      timestamp: new Date().toISOString()
    });

    // Make API call using the by-client endpoint pattern
    const response = await api.get(
      `/api/v1/workflows/by-client/${encodeURIComponent(clientIdentifier)}?${queryParams}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    console.log('✅ DEBUG: Raw API Response Received:');
    console.log('================================');

    console.log('Response Data (Full Object):', response.data);
    console.log('Response Data Keys:', response.data ? Object.keys(response.data) : 'No data');
    console.log('Response Data Type:', typeof response.data);
  
    console.log('================================');

    if (!response.data) {
      throw new Error('No data received from API');
    }

    // Handle different response structures
    const workflowData = response.data.data || response.data.workflows || response.data || [];
    const count = response.data.count || workflowData.length || 0;

    console.log('🔍 DEBUG: Processed Workflow Data:');
    console.log('================================');
    console.log('Workflow Data Type:', typeof workflowData);
    console.log('Is Workflow Data Array?:', Array.isArray(workflowData));
    console.log('Workflow Count:', count);
    console.log('Workflow Data Length:', Array.isArray(workflowData) ? workflowData.length : 'Not an array');
    console.log('Raw Workflow Data:', workflowData);
    console.log('================================');

    // Process the complete workflow data
    if (Array.isArray(workflowData)) {
      console.log('🔍 DEBUG: Individual Workflow Details:');
      console.log('================================');
      
      workflowData.forEach((workflow, index) => {
        console.log(`� Workflow ${index + 1} Details:`, {
          workflowId: workflow.workflowId || workflow.id || workflow._id,
          status: workflow.status,
          currentStep: workflow.currentStep,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          allWorkflowKeys: Object.keys(workflow),
          hasClient: !!workflow.client,
          hasCase: !!workflow.case,
          hasQuestionnaireAssignment: !!workflow.questionnaireAssignment,
          hasSelectedForms: !!(Array.isArray(workflow.selectedForms) && workflow.selectedForms.length > 0),
          hasFormCaseIds: !!(workflow.formCaseIds && Object.keys(workflow.formCaseIds).length > 0)
        });

        if (workflow.client) {
          console.log(`👤 Client Data for Workflow ${index + 1}:`, {
            clientId: workflow.client._id || workflow.client.id || workflow.client.clientId,
            name: workflow.client.name,
            firstName: workflow.client.firstName,
            lastName: workflow.client.lastName,
            email: workflow.client.email,
            phone: workflow.client.phone,
            role: workflow.client.role,
            userType: workflow.client.userType,
            hasAddress: !!workflow.client.address,
            allClientKeys: Object.keys(workflow.client)
          });

          if (workflow.client.address) {
            console.log(`🏠 Client Address for Workflow ${index + 1}:`, workflow.client.address);
          }
        }

        if (workflow.case) {
          console.log(`📋 Case Data for Workflow ${index + 1}:`, {
            caseId: workflow.case._id || workflow.case.id,
            title: workflow.case.title,
            category: workflow.case.category,
            subcategory: workflow.case.subcategory,
            status: workflow.case.status,
            priority: workflow.case.priority,
            allCaseKeys: Object.keys(workflow.case)
          });
        }

        if (workflow.questionnaireAssignment) {
          console.log(`📝 Questionnaire Assignment for Workflow ${index + 1}:`, {
            assignmentId: workflow.questionnaireAssignment.assignment_id || workflow.questionnaireAssignment.id,
            questionnaireId: workflow.questionnaireAssignment.questionnaire_id,
            questionnaireTitle: workflow.questionnaireAssignment.questionnaire_title,
            status: workflow.questionnaireAssignment.status,
            hasResponses: !!workflow.questionnaireAssignment.responses,
            responseCount: workflow.questionnaireAssignment.responses ? Object.keys(workflow.questionnaireAssignment.responses).length : 0,
            submittedAt: workflow.questionnaireAssignment.submitted_at,
            allAssignmentKeys: Object.keys(workflow.questionnaireAssignment)
          });

          if (workflow.questionnaireAssignment.responses) {
            console.log(`💬 Questionnaire Responses for Workflow ${index + 1}:`, {
              responseKeys: Object.keys(workflow.questionnaireAssignment.responses),
              sampleResponses: Object.entries(workflow.questionnaireAssignment.responses).slice(0, 5).reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
              }, {} as any)
            });
          }
        }

        if (workflow.selectedForms) {
          console.log(`📄 Selected Forms for Workflow ${index + 1}:`, workflow.selectedForms);
        }

        if (workflow.formCaseIds) {
          console.log(`🆔 Form Case IDs for Workflow ${index + 1}:`, workflow.formCaseIds);
        }

        console.log('--------------------------------');
      });
      
      console.log('================================');
    } else {
      console.log('⚠️ DEBUG: Workflow data is not an array:', {
        actualType: typeof workflowData,
        actualValue: workflowData
      });
    }

    const finalResult = {
      success: true,
      count,
      data: Array.isArray(workflowData) ? workflowData : [],
      error: undefined
    };

    console.log('✅ DEBUG: Final Result Being Returned:');
    console.log('================================');
    console.log('Success:', finalResult.success);
    console.log('Count:', finalResult.count);
    console.log('Data Length:', finalResult.data.length);
    console.log('Has Error:', !!finalResult.error);
    console.log('================================');
    console.log('🔄 DEBUG: ========== getWorkflowsByClient COMPLETED ==========');

    return finalResult;

  } catch (error: any) {
    console.error('❌ DEBUG: ========== getWorkflowsByClient ERROR ==========');
    console.error('Error Type:', typeof error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('API Response Status:', error.response?.status);
    console.error('API Response Data:', error.response?.data);
    console.error('API Response Headers:', error.response?.headers);
    console.error('Full Error Object:', error);
    console.error('================================');
    
    // Return a structured error response
    const errorResult = {
      success: false,
      count: 0,
      data: [],
      error: error.response?.data?.message || error.message || 'Failed to fetch workflows'
    };

    console.error('❌ DEBUG: Error Result Being Returned:', errorResult);
    console.error('❌ DEBUG: ========== getWorkflowsByClient ERROR END ==========');
    
    return errorResult;
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
  formNumber: string;
  formData: Record<string, any>;
  status: string;
  caseId?: string;
}): Promise<any> => {
  try {
    const requestData = {
      clientId: formData.clientId,
      formNumber: formData.formNumber,
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
  formNumber?: string;
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

export const generateMultipleCaseIds = async (formNumbers: string[]): Promise<Record<string, string>> => {
  try {
    // This would typically call the case ID generation API
    // For now, returning a mock implementation
    const caseIds: Record<string, string> = {};
    formNumbers.forEach(formNumber => {
      caseIds[formNumber] = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  
  if (!formData.formNumber) {
    errors.push('Form number is required');
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
  getWorkflowsByClient,
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
