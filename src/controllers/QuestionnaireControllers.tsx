import questionnaireService from '../services/questionnaireService';
import { ImmigrationQuestionnaire } from '../types/questionnaire';

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

export interface QuestionnaireListParams {
  is_active?: boolean;
  category?: string;
  subcategory?: string;
  limit?: number;
  page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface QuestionnaireListResponse {
  questionnaires: ImmigrationQuestionnaire[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

/**
 * Check if the questionnaire API is available
 * @returns A boolean indicating whether the API is available
 */
export const isQuestionnaireApiAvailable = async (): Promise<boolean> => {
  try {
    return await questionnaireService.isAPIAvailable();
  } catch (error) {
    console.error('Error checking questionnaire API availability:', error);
    return false;
  }
};

/**
 * Get a list of questionnaires based on provided parameters
 * @param params Optional parameters to filter and paginate the results
 * @returns A list of questionnaires and pagination information
 */
export const getQuestionnaires = async (params?: QuestionnaireListParams): Promise<QuestionnaireListResponse> => {
  try {
    const response = await questionnaireService.getQuestionnaires(params || {});
    return response;
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    // Return an empty response rather than throwing to make the UI more resilient
    return {
      questionnaires: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false
      }
    };
  }
};

/**
 * Get a questionnaire by its ID
 * @param id The ID of the questionnaire to retrieve
 * @returns The questionnaire with the specified ID
 */
export const getQuestionnaireById = async (id: string): Promise<ImmigrationQuestionnaire> => {
  try {
    return await questionnaireService.getQuestionnaireById(id);
  } catch (error) {
    console.error(`Error fetching questionnaire with ID ${id}:`, error);
    throw new Error(`Failed to fetch questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Create a new questionnaire
 * @param questionnaire The questionnaire data to create
 * @returns The created questionnaire
 */
export const createQuestionnaire = async (questionnaire: Omit<ImmigrationQuestionnaire, "id" | "created_by" | "organization_id" | "created_at" | "updated_at" | "version">): Promise<{ id: string }> => {
  try {
    return await questionnaireService.createQuestionnaire(questionnaire);
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    throw new Error(`Failed to create questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing questionnaire
 * @param id The ID of the questionnaire to update
 * @param questionnaire The updated questionnaire data
 * @returns The updated questionnaire
 */
export const updateQuestionnaire = async (id: string, questionnaire: Omit<ImmigrationQuestionnaire, "id" | "created_by" | "organization_id" | "created_at" | "updated_at" | "version">): Promise<{ id: string }> => {
  try {
    return await questionnaireService.updateQuestionnaire(id, questionnaire);
  } catch (error) {
    console.error(`Error updating questionnaire with ID ${id}:`, error);
    throw new Error(`Failed to update questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a questionnaire
 * @param id The ID of the questionnaire to delete
 * @returns A success message
 */
export const deleteQuestionnaire = async (id: string): Promise<{ message: string }> => {
  try {
    return await questionnaireService.deleteQuestionnaire(id);
  } catch (error) {
    console.error(`Error deleting questionnaire with ID ${id}:`, error);
    throw new Error(`Failed to delete questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Duplicate a questionnaire
 * @param id The ID of the questionnaire to duplicate
 * @param options Options for duplicating the questionnaire
 * @returns The ID of the duplicated questionnaire
 */
export const duplicateQuestionnaire = async (id: string, options: { title: string; description?: string }): Promise<{ id: string }> => {
  try {
    return await questionnaireService.duplicateQuestionnaire(id, options);
  } catch (error) {
    console.error(`Error duplicating questionnaire with ID ${id}:`, error);
    throw new Error(`Failed to duplicate questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export a questionnaire as JSON
 * @param id The ID of the questionnaire to export
 * @returns The questionnaire data
 */
export const exportQuestionnaire = async (id: string): Promise<any> => {
  try {
    return await questionnaireService.exportQuestionnaire(id);
  } catch (error) {
    console.error(`Error exporting questionnaire with ID ${id}:`, error);
    throw new Error(`Failed to export questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Import a questionnaire from a file
 * @param file The file containing the questionnaire data
 * @returns The imported questionnaire data
 */
export const importQuestionnaire = async (file: File): Promise<any> => {
  try {
    return await questionnaireService.importQuestionnaire(file);
  } catch (error) {
    console.error('Error importing questionnaire:', error);
    throw new Error(`Failed to import questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Submit a questionnaire response
 * @param questionnaireId The ID of the questionnaire
 * @param responses The responses to the questionnaire
 * @returns The submitted response and any assessment results
 */
export const submitQuestionnaireResponse = async (
  questionnaireId: string,
  responseData: Record<string, any>,
  clientId?: string,
  autoSave?: boolean,
  notes?: string
): Promise<any> => {
  try {
    const responsePayload = {
      client_id: clientId,
      responses: responseData,
      auto_save: autoSave,
      notes: notes
    };
    return await questionnaireService.submitQuestionnaireResponse(questionnaireId, responsePayload);
  } catch (error) {
    console.error(`Error submitting response for questionnaire ${questionnaireId}:`, error);
    throw new Error(`Failed to submit questionnaire response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

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
    // Create a URL for the assignment endpoint
    const baseURL = import.meta.env.VITE_API_BASE_URL || 
                   'https://immigration-api.fourzeroconsulting.com';
    
    const url = `${baseURL}/api/v1/questionnaire-assignments`;
    
    // Get authentication token using the same logic as questionnaireService
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token') ||
                  localStorage.getItem('access_token') ||
                  sessionStorage.getItem('access_token') ||
                  localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(assignment)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to assign questionnaire: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
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
    // Implementation would be similar to assignQuestionnaire but with GET method
    const baseURL = import.meta.env.VITE_API_BASE_URL || 
                   'https://immigration-api.fourzeroconsulting.com';
    
    const url = `${baseURL}/api/v1/questionnaire-assignments?clientId=${clientId}`;
    
    // Get authentication token
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token') ||
                  localStorage.getItem('access_token') ||
                  sessionStorage.getItem('access_token') ||
                  localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get questionnaire assignments: ${errorText}`);
    }
    
    const data = await response.json();
    return data.assignments || [];
  } catch (error) {
    console.error(`Error getting questionnaire assignments for client ${clientId}:`, error);
    // Return empty array rather than throwing to make the UI more resilient
    return [];
  }
};
