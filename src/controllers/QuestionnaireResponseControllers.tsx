import api from '../utils/api';

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
