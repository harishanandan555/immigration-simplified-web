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
 * Get a list of questionnaires based on provided parameters
 * @param params Optional parameters to filter and paginate the results
 * @returns A list of questionnaires and pagination information
 */
export const getQuestionnaires = async (params?: QuestionnaireListParams): Promise<QuestionnaireListResponse> => {
  try {
    const response = await questionnaireService.getQuestionnaires();
    
    // Apply client-side filtering if params are provided
    let filteredQuestionnaires = response.questionnaires;
    
    if (params) {
      if (params.category) {
        filteredQuestionnaires = filteredQuestionnaires.filter(q => q.category === params.category);
      }
      
      if (params.is_active !== undefined) {
        filteredQuestionnaires = filteredQuestionnaires.filter(q => q.is_active === params.is_active);
      }
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredQuestionnaires = filteredQuestionnaires.filter(q => 
          q.title.toLowerCase().includes(searchLower) ||
          q.description.toLowerCase().includes(searchLower) ||
          q.category.toLowerCase().includes(searchLower)
        );
      }
    }
    
    return {
      questionnaires: filteredQuestionnaires,
      pagination: response.pagination
    };
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
 * Get ALL questionnaires without any filtering or pagination limits
 * @returns A list of all questionnaires available in the system
 */
export const getAllQuestionnaires = async (): Promise<QuestionnaireListResponse> => {
  try {
    // Get all questionnaires and filter for active ones
    const response = await questionnaireService.getQuestionnaires();
    const activeQuestionnaires = response.questionnaires.filter(q => q.is_active);
    
    return {
      questionnaires: activeQuestionnaires,
      pagination: {
        page: 1,
        limit: 1000,
        total: activeQuestionnaires.length,
        total_pages: 1,
        has_next: false,
        has_previous: false
      }
    };
  } catch (error) {
    console.error('Error fetching all questionnaires:', error);
    // Return an empty response rather than throwing to make the UI more resilient
    return {
      questionnaires: [],
      pagination: {
        page: 1,
        limit: 1000,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false
      }
    };
  }
};

/**
 * Get ALL questionnaires including inactive ones, without any filtering
 * @returns A list of all questionnaires in the system (active and inactive)
 */
export const getAllQuestionnairesUnfiltered = async (): Promise<QuestionnaireListResponse> => {
  try {
    // Get all questionnaires without any filters at all
    const response = await questionnaireService.getQuestionnaires();
    
    return {
      questionnaires: response.questionnaires,
      pagination: {
        page: 1,
        limit: 1000,
        total: response.questionnaires.length,
        total_pages: 1,
        has_next: false,
        has_previous: false
      }
    };
  } catch (error) {
    console.error('Error fetching all questionnaires (unfiltered):', error);
    // Return an empty response rather than throwing to make the UI more resilient
    return {
      questionnaires: [],
      pagination: {
        page: 1,
        limit: 1000,
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
