import api from '../utils/api';
import { APPCONSTANTS } from '../utils/constants';

export interface QuestionnaireAssignment {
  id: string;
  caseId: string;
  clientId: string;
  questionnaireId: string;
  status: string;
  dueDate?: string;
  responses?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Assign a questionnaire to a client
 * @param assignment The assignment details
 * @returns The created assignment
 */
export const assignQuestionnaire = async (assignment: {
  caseId: string;
  clientId: string;
  questionnaireId: string;
  dueDate?: string;
}): Promise<QuestionnaireAssignment> => {
  try {
    const response = await api.post('/api/v1/questionnaire-assignments', assignment);
    return response.data;
  } catch (error) {
    console.error('Error assigning questionnaire:', error);
    throw new Error(`Failed to assign questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all questionnaire assignments for a client
 * @param clientId The ID of the client
 * @returns A list of questionnaire assignments for the client
 */
export const getClientQuestionnaireAssignments = async (clientId: string): Promise<QuestionnaireAssignment[]> => {
  try {
    const response = await api.get(`/api/v1/questionnaire-assignments?clientId=${clientId}`);
    return response.data.assignments || [];
  } catch (error) {
    console.error(`Error getting questionnaire assignments for client ${clientId}:`, error);
    // Return empty array rather than throwing to make the UI more resilient
    return [];
  }
};

/**
 * Get a questionnaire assignment by ID
 * @param id The ID of the assignment
 * @returns The questionnaire assignment
 */
export const getQuestionnaireAssignmentById = async (id: string): Promise<QuestionnaireAssignment> => {
  try {
    const response = await api.get(`/api/v1/questionnaire-assignments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting questionnaire assignment with ID ${id}:`, error);
    throw new Error(`Failed to get questionnaire assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update a questionnaire assignment
 * @param id The ID of the assignment to update
 * @param updates The updates to apply
 * @returns The updated assignment
 */
export const updateQuestionnaireAssignment = async (
  id: string,
  updates: Partial<QuestionnaireAssignment>
): Promise<QuestionnaireAssignment> => {
  try {
    const response = await api.patch(`/api/v1/questionnaire-assignments/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating questionnaire assignment with ID ${id}:`, error);
    throw new Error(`Failed to update questionnaire assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Submit responses for a questionnaire assignment
 * @param assignmentId The ID of the assignment
 * @param responses The responses to submit
 * @returns The updated assignment
 */
export const submitQuestionnaireAssignmentResponses = async (
  assignmentId: string,
  responses: Record<string, any>
): Promise<QuestionnaireAssignment> => {
  try {
    const response = await api.post(`/api/v1/questionnaire-assignments/${assignmentId}/responses`, {
      responses
    });
    return response.data;
  } catch (error) {
    console.error(`Error submitting responses for assignment ${assignmentId}:`, error);
    throw new Error(`Failed to submit questionnaire responses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if an API endpoint is available
 * @param endpointUrl The URL to check
 * @returns A boolean indicating whether the endpoint is available
 */
/**
 * Check if a specific API endpoint is available
 * @param endpointPath The path of the endpoint to check (e.g., '/api/v1/questionnaire-assignments')
 * @returns A boolean indicating whether the endpoint is available
 */
export const isApiEndpointAvailable = async (endpointPath: string): Promise<boolean> => {
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
};
