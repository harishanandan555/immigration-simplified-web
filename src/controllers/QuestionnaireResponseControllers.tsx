import api from '../utils/api';
import { QUESTIONNAIRE_RESPONSE_END_POINTS } from '../utils/constants';

export interface QuestionnaireResponse {
  id: string;
  assignmentId: string;
  questionnaireId: string;
  clientId: string;
  responses: Record<string, any>;
  status: 'draft' | 'submitted' | 'completed';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submit responses for a questionnaire assignment
 * @param assignmentId The ID of the questionnaire assignment
 * @param responses The responses data to submit
 * @param notes Optional notes to include with the submission
 * @returns The created/updated questionnaire response object
 */
export const submitQuestionnaireResponses = async (
  assignmentId: string,
  responses: Record<string, any>,
  notes?: string
): Promise<QuestionnaireResponse> => {
  try {
    // Use the correct endpoint that matches the backend
    const response = await api.post(`/api/v1/questionnaire-assignments/${assignmentId}/submit`, {
      responses,
      notes
    });
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Error submitting questionnaire responses:', error);
    
    // Handle specific authorization errors
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || 'Not authorized to submit responses for this assignment';
      throw new Error(`Authorization Error: ${errorMessage}. Please contact your attorney or ensure you are logged in with the correct account.`);
    }
    
    // For resilience in case of API failure, store in localStorage
    const localResponses = JSON.parse(localStorage.getItem('questionnaire-responses') || '[]');
    const newResponse = {
      id: `response_${Date.now()}`,
      assignmentId,
      questionnaireId: 'unknown', // We don't have this in this context
      clientId: 'unknown', // We don't have this in this context
      responses,
      status: 'submitted' as const,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localResponses.push(newResponse);
    localStorage.setItem('questionnaire-responses', JSON.stringify(localResponses));
    
    // Return the local version
    return newResponse as QuestionnaireResponse;
  }
};

/**
 * Get responses for a specific questionnaire assignment
 * @param assignmentId The ID of the questionnaire assignment
 * @returns The questionnaire responses
 */
export const getQuestionnaireResponses = async (assignmentId: string): Promise<QuestionnaireResponse> => {
  try {
    const response = await api.get(`/api/v1/questionnaire-assignments/${assignmentId}/responses`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching responses for assignment ${assignmentId}:`, error);
    
    // Fallback to localStorage
    const localResponses = JSON.parse(localStorage.getItem('questionnaire-responses') || '[]');
    const savedResponse = localResponses.find((r: any) => r.assignmentId === assignmentId);
    
    if (savedResponse) {
      return savedResponse as QuestionnaireResponse;
    }
    
    throw new Error(`Failed to fetch questionnaire responses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update responses for a questionnaire assignment
 * @param assignmentId The ID of the questionnaire assignment
 * @param responses The updated responses
 * @returns The updated questionnaire response object
 */
export const updateQuestionnaireResponses = async (
  assignmentId: string,
  responses: Record<string, any>
): Promise<QuestionnaireResponse> => {
  try {
    const response = await api.put(`/api/v1/questionnaire-assignments/${assignmentId}/responses`, {
      responses
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating responses for assignment ${assignmentId}:`, error);
    
    // Update in localStorage as fallback
    const localResponses = JSON.parse(localStorage.getItem('questionnaire-responses') || '[]');
    const updatedResponses = localResponses.map((r: any) => {
      if (r.assignmentId === assignmentId) {
        return {
          ...r,
          responses,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    
    localStorage.setItem('questionnaire-responses', JSON.stringify(updatedResponses));
    
    // Find and return the updated response
    const updatedResponse = updatedResponses.find((r: any) => r.assignmentId === assignmentId);
    if (updatedResponse) {
      return updatedResponse as QuestionnaireResponse;
    }
    
    throw new Error(`Failed to update questionnaire responses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Normalize a questionnaire's structure to ensure consistent fields and IDs
 * @param questionnaire The questionnaire to normalize
 * @returns The normalized questionnaire
 */
export const normalizeQuestionnaireStructure = (questionnaire: any) => {
  // Create a normalized copy to avoid mutating the original
  const normalized = { ...questionnaire };
  
  // Special case for API-formatted questionnaires (they have q_ prefixed IDs)
  if (normalized.id && normalized.id.startsWith('q_')) {
    normalized._id = normalized.id;
    normalized.apiQuestionnaire = true;
    return normalized;
  }
  
  // For non-API questionnaires, ensure consistent ID field
  if (!normalized._id && normalized.id) {
    normalized._id = normalized.id;
  }
  
  // Ensure consistent title field
  if (!normalized.title && normalized.name) {
    normalized.title = normalized.name;
  }
  
  // Handle fields vs questions naming
  if (!normalized.fields || normalized.fields.length === 0) {
    // Try to find questions in various locations
    const possibleQuestions = normalized.questions || 
                             normalized.form?.questions || 
                             normalized.form?.fields ||
                             normalized.data?.questions || 
                             normalized.data?.fields || 
                             [];
                             
    if (possibleQuestions && possibleQuestions.length > 0) {
      normalized.fields = possibleQuestions.map((q: any) => {
        // Convert question field to standardized field format
        return {
          id: q.id || q._id || `q_${Math.random().toString(36).substring(2, 9)}`,
          type: q.type || 'text',
          label: q.question || q.label || q.name || 'Untitled Question',
          required: q.required ?? true,
          options: q.options || [],
          placeholder: q.placeholder || '',
          description: q.description || q.help_text || ''
        };
      });
    } else {
      // Create empty fields array if none exists
      normalized.fields = [];
    }
  }
  
  // Ensure each field has required properties
  normalized.fields = (normalized.fields || []).map((field: any, index: number) => {
    return {
      id: field.id || field._id || `field_${index}`,
      type: field.type || 'text',
      label: field.label || field.question || field.name || `Question ${index + 1}`,
      required: field.required ?? true,
      options: field.options || [],
      placeholder: field.placeholder || '',
      description: field.description || field.help_text || '',
      validation: field.validation || {}
    };
  });
  
  return normalized;
};

/**
 * Get all client responses for attorneys/admins
 * @param filters Optional filters (status, clientId, etc.)
 * @returns Client responses with pagination and enhanced with workflow data
 */
export const getClientResponses = async (filters: Record<string, any> = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    // Get questionnaire assignments
    const response = await api.get(`${QUESTIONNAIRE_RESPONSE_END_POINTS.GET_CLIENT_RESPONSES}?${params}`);
    const assignmentsData = response.data;
    
    // Also fetch workflow data to get saved questionnaire assignment data
    try {
      console.log('🔍 Fetching workflow data to enhance questionnaire responses...');
      const workflowResponse = await api.get(`${QUESTIONNAIRE_RESPONSE_END_POINTS.GET_WORKFLOWS}`);
      const workflows = workflowResponse.data?.data || workflowResponse.data || [];
      
      console.log('📊 Retrieved workflows for enhancement:', {
        workflowCount: workflows.length,
        assignmentCount: assignmentsData.data?.assignments?.length || 0
      });
      
      // Enhance assignments with workflow data
      if (assignmentsData.data?.assignments && Array.isArray(workflows)) {
        assignmentsData.data.assignments = assignmentsData.data.assignments.map((assignment: any) => {
          // Find matching workflow that contains questionnaire assignment data
          const matchingWorkflow = workflows.find((workflow: any) => {
            const workflowQA = workflow.questionnaireAssignment;
            if (!workflowQA) return false;
            
            // Match by assignment ID, client ID, or email
            return workflowQA.assignment_id === assignment._id ||
                   workflowQA.client_id === assignment.clientId ||
                   (workflow.client?.email && assignment.actualClient?.email && 
                    workflow.client.email.toLowerCase() === assignment.actualClient.email.toLowerCase());
          });
          
          if (matchingWorkflow) {
            console.log('🔗 Enhanced assignment with workflow data:', {
              assignmentId: assignment._id,
              workflowId: matchingWorkflow.id || matchingWorkflow._id,
              hasQuestionnaireAssignment: !!matchingWorkflow.questionnaireAssignment,
              hasCase: !!matchingWorkflow.case,
              hasFormCaseIds: !!matchingWorkflow.formCaseIds
            });
            
            // Enhance assignment with workflow data
            return {
              ...assignment,
              // Add workflow case information
              workflowCase: matchingWorkflow.case,
              // Add form case IDs from workflow
              workflowFormCaseIds: matchingWorkflow.formCaseIds,
              // Add questionnaire assignment details from workflow
              workflowQuestionnaireAssignment: matchingWorkflow.questionnaireAssignment,
              // Add selected forms from workflow
              workflowSelectedForms: matchingWorkflow.selectedForms,
              // Add workflow ID for reference
              workflowId: matchingWorkflow.id || matchingWorkflow._id,
              // Flag to indicate this has been enhanced with workflow data
              enhancedWithWorkflow: true
            };
          }
          
          return assignment;
        });
        
        console.log('✅ Enhanced assignments with workflow data completed');
      }
    } catch (workflowError) {
      console.warn('⚠️ Failed to fetch workflow data for enhancement:', workflowError);
      // Continue with regular assignment data if workflow fetch fails
    }
    
    return assignmentsData;
  } catch (error) {
    console.error('Error getting client responses:', error);
    throw error;
  }
};

/**
 * Get workflows from API for auto-fill functionality
 * @param filters Optional filters for workflows
 * @returns Array of workflows
 */
export const getWorkflowsFromAPI = async (filters: Record<string, any> = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    
    const response = await api.get(`${QUESTIONNAIRE_RESPONSE_END_POINTS.GET_WORKFLOWS}?${params}`);
    
    if (response.data?.success && response.data?.data) {
      const workflows = response.data.data;
      return workflows;
    } else {
      return [];
    }
  } catch (error: any) {
    console.error('Error getting workflows:', error);
    
    // If 404, the endpoint might not be available
    if (error.response?.status === 404) {
      console.warn('Workflows endpoint not found');
    } else if (error.response?.status === 401) {
      console.warn('Authentication failed for workflows');
    } else {
      console.warn('Other API error for workflows:', error.response?.status);
    }
    
    return [];
  }
};

/**
 * Get assignment response for attorneys to view client submissions
 * @param assignmentId The assignment ID
 * @returns Assignment and response data
 */
export const getAssignmentResponse = async (assignmentId: string) => {
  try {
    
    const response = await api.get(
      QUESTIONNAIRE_RESPONSE_END_POINTS.GET_RESPONSE_BY_ID.replace(':assignmentId', assignmentId)
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting assignment response:', error);
    throw error;
  }
};
