import api from '../utils/api';
import { APPCONSTANTS } from '../utils/constants';
import { isValidMongoObjectId, validateMongoObjectId } from '../utils/idValidation';

class QuestionnaireAssignmentService {
  /**
   * Create a questionnaire assignment using a direct fetch call
   * This method bypasses the axios instance to provide better error details
   */
  async createAssignmentDirect(assignmentData: any, token: string) {
    try {
      console.log('Creating direct assignment with data:', JSON.stringify(assignmentData, null, 2));
      
      const response = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/questionnaire-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });
      
      console.log(`Direct assignment response status: ${response.status}`);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read response text';
        }
        
        console.error('Assignment creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`Assignment creation failed: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Direct assignment creation error:', error);
      throw error;
    }
  }

  /**
   * Check if the API server is available
   * @returns {Promise<boolean>} Whether the API is available
   */
  async checkApiConnection() {
    try {
      // First try the ping endpoint
      const pingResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/auth/ping`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (pingResponse.ok) {
        return true;
      }
      
      // If ping endpoint fails, try the root endpoint
      const rootResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return rootResponse.ok;
    } catch (error) {
      console.error('API connection check failed:', error);
      return false;
    }
  }

  /**
   * Check if the questionnaire assignments endpoint is available
   * @returns {Promise<boolean>} Whether the endpoint is available
   */
  async checkAssignmentsEndpoint() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Try a HEAD request to see if the endpoint exists
      const response = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/questionnaire-assignments`, {
        method: 'HEAD',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 401 Unauthorized is actually okay - it means the endpoint exists but requires auth
      return response.ok || response.status === 401;
    } catch (error) {
      console.error('Assignments endpoint check failed:', error);
      return false;
    }
  }
  
  /**
   * Get all questionnaire assignments for the current client
   * @returns {Promise<Array>} List of assigned questionnaires
   */
  async getMyAssignments() {
    try {
      const response = await api.get('/api/v1/questionnaire-assignments/my-assignments');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  /**
   * Get all questionnaire assignments (for admin/attorney users)
   * @param {Object} filters Optional filters (status, clientId, etc.)
   * @returns {Promise<Array>} List of all questionnaire assignments
   */
  async getAllAssignments(filters: Record<string, any> = {}) {
    try {
      const response = await api.get('/api/v1/questionnaire-assignments', { 
        params: filters 
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }
  }

  /**
   * Get a specific questionnaire assignment
   * @param {string} id The assignment ID
   * @returns {Promise<Object>} The assignment details
   */
  async getAssignment(id: string) {
    try {
      validateMongoObjectId(id, 'assignment');
      
      const response = await api.get(`/api/v1/questionnaire-assignments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching assignment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update the status of a questionnaire assignment
   * @param {string} id The assignment ID
   * @param {string} status The new status (pending, in-progress, completed)
   * @returns {Promise<Object>} The updated assignment
   */
  async updateStatus(id: string, status: string) {
    try {
      validateMongoObjectId(id, 'assignment');
      
      const response = await api.put(`/api/v1/questionnaire-assignments/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating assignment status:`, error);
      throw error;
    }
  }

  /**
   * Submit responses for a questionnaire and link to the assignment
   * @param {string} questionnaireId The questionnaire ID
   * @param {string} assignmentId The assignment ID
   * @param {Object} responses The questionnaire responses
   * @param {boolean} isCompleted Whether the questionnaire is being marked as complete
   * @returns {Promise<Object>} The submission result
   */
  async submitQuestionnaire(questionnaireId: string, assignmentId: string, responses: Record<string, any>, isCompleted: boolean = false) {
    try {
      // Validate MongoDB ObjectId format for both IDs
      validateMongoObjectId(questionnaireId, 'questionnaire');
      validateMongoObjectId(assignmentId, 'assignment');
      
      // Step 1: Submit responses to the questionnaire
      const responseSubmission = await api.post(`/api/v1/questionnaires/${questionnaireId}/responses`, {
        responses,
        auto_save: !isCompleted,
        notes: isCompleted ? 'Questionnaire completed via client portal' : 'Saved as draft via client portal'
      });

      // Step 2: Link response to assignment
      const responseId = responseSubmission.data.response_id;
      
      // Validate responseId is in MongoDB ObjectId format
      validateMongoObjectId(responseId, 'response');
      
      await api.put(`/api/v1/questionnaire-assignments/${assignmentId}/link-response`, {
        responseId
      });

      return responseSubmission.data;
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      throw error;
    }
  }
}

export default new QuestionnaireAssignmentService();
