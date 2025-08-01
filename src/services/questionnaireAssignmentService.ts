  import api from '../utils/api';
import { APPCONSTANTS } from '../utils/constants';
import { validateMongoObjectId } from '../utils/idValidation';

interface QuestionnaireAssignment {
  id?: string;
  _id?: string;
  questionnaireId: string;
  clientId: string;
  status: string;
  assignedAt: string;
  completedAt?: string;
  responses?: Record<string, any>;
  clientEmail?: string;
  clientUserId?: string;
}

const QuestionnaireAssignmentService = {
  api,
  
  /**
   * Simple fetch-based API call for assigned questionnaires
   */
  getMyAssignedQuestionnaires: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/questionnaire-assignments/my-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received assignments:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      throw error;
    }
  },
  
  createAssignmentDirect: async (assignmentData: any, token: string) => {
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
  },

  /**
   * Check if the API server is available
   * @returns {Promise<boolean>} Whether the API is available
   */
  checkApiConnection: async () => {
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
  },

  /**
   * Check if the questionnaire assignments endpoint is available
   * @returns {Promise<boolean>} Whether the endpoint is available
   */
  checkAssignmentsEndpoint: async () => {
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
  },
  
  /**
   * Get all questionnaire assignments for the current client
   * @returns {Promise<Array>} List of assigned questionnaires
   */
  getMyAssignments: async () => {
    try {
      // Get user info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      console.log('=== DEBUG: getMyAssignments called ===');
      console.log('User from localStorage:', user);
      console.log('Token available:', !!token);

      // Function to fetch questionnaire details with fields
      const fetchQuestionnaireDetails = async (questionnaireId: string) => {
        try {
          const response = await api.get(`/api/v1/questionnaires/${questionnaireId}?include_fields=true`);
          const questionnaire = response.data.data || response.data;
          console.log('Fetched questionnaire details:', {
            id: questionnaireId,
            title: questionnaire?.title,
            fieldCount: questionnaire?.fields?.length
          });
          return questionnaire;
        } catch (error) {
          console.warn(`Failed to fetch questionnaire details for ${questionnaireId}:`, error);
          return null;
        }
      };
      
      // Try API call first if we have a token
      if (token) {
        try {
          console.log('Attempting to fetch assignments from API with token');
          console.log('API call URL: /api/v1/questionnaire-assignments/my-assignments?populate=questionnaire');
          
          const response = await api.get('/api/v1/questionnaire-assignments/my-assignments?populate=questionnaire');
          console.log('API Response received:', response);
          console.log('Response data:', response.data);
          
          let apiAssignments = response.data.data || response.data || [];
          console.log('Raw API assignments:', apiAssignments);
          console.log('Number of assignments found:', apiAssignments.length);
          
          // Fetch questionnaire details for each assignment if not already populated
          apiAssignments = await Promise.all(apiAssignments.map(async (assignment: any) => {
            if (!assignment.questionnaire && assignment.questionnaireId) {
              const questionnaireDetails = await fetchQuestionnaireDetails(assignment.questionnaireId);
              return {
                ...assignment,
                questionnaire: questionnaireDetails,
                questionnaireId: {
                  _id: assignment.questionnaireId,
                  title: questionnaireDetails?.title || assignment.questionnaireName || 'Untitled Questionnaire',
                  category: questionnaireDetails?.category || 'unknown',
                  description: questionnaireDetails?.description || '',
                  questions: questionnaireDetails?.questions || []
                }
              };
            }
            return assignment;
          }));

          console.log('Found assignments from API:', apiAssignments.length);
          console.log('Final processed assignments:', apiAssignments);
          
          // Return assignments as-is from server
          return apiAssignments;
          
        } catch (apiError) {
          console.error('API assignment fetch failed, details:', apiError);
          console.warn('API assignment fetch failed, falling back to localStorage:', apiError);
          
          // Only use localStorage as fallback when API completely fails
          const localAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
          const filteredAssignments = localAssignments.filter((assignment: any) => 
            assignment.clientEmail === user.email || 
            assignment.clientId === user.id || 
            assignment.clientId === user._id ||
            assignment.clientUserId === user.id ||
            assignment.clientUserId === user._id
          );
          
          console.log('Using localStorage fallback:', filteredAssignments.length, 'assignments');
          return filteredAssignments;
        }
      } else {
        // No token, use localStorage only
        console.log('No token available, using localStorage only');
        const localAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
        const filteredAssignments = localAssignments.filter((assignment: any) => 
          assignment.clientEmail === user.email || 
          assignment.clientId === user.id || 
          assignment.clientUserId === user.id
        );
        return filteredAssignments;
      }
    } catch (error) {
      console.error('Error in getMyAssignments:', error);
      return [];
    }
  },

  /**
   * Get a specific assignment by ID for the current client
   * @param {string} assignmentId - The assignment ID
   * @returns {Promise<Object>} Assignment details
   */
  getMyAssignment: async (assignmentId: string) => {
    try {
      const response = await api.get(`/api/v1/questionnaire-assignments/${assignmentId}`);
      const assignment = response.data.data || response.data;
      return assignment;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  /**
   * Submit questionnaire response for an assignment
   * @param {string} questionnaireId - The questionnaire ID
   * @param {Object} responses - The responses object
   * @returns {Promise<Object>} Submission result
   */
  submitQuestionnaireResponse: async (questionnaireId: string, responses: Record<string, any>) => {
    try {
      const response = await api.post(`/api/v1/questionnaires/${questionnaireId}/responses`, {
        responses
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error submitting questionnaire response:', error);
      throw error;
    }
  },

  /**
   * Get all questionnaire assignments (for admin/attorney users)
   * @param {Object} filters Optional filters (status, clientId, etc.)
   * @returns {Promise<Array>} List of all questionnaire assignments
   */
  getAllAssignments: async (filters: Record<string, any> = {}) => {
    try {
      const response = await api.get('/api/v1/questionnaire-assignments', { 
        params: filters 
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }
  },

  /**
   * Get a specific questionnaire assignment
   * @param {string} id The assignment ID
   * @returns {Promise<Object>} The assignment details
   */
  getAssignment: async (id: string) => {
    try {
      validateMongoObjectId(id, 'assignment');
      
      const response = await api.get(`/api/v1/questionnaire-assignments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching assignment ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update the status of a questionnaire assignment
   * @param {string} id The assignment ID
   * @param {string} status The new status (pending, in-progress, completed)
   * @returns {Promise<Object>} The updated assignment
   */
  updateStatus: async (id: string, status: string) => {
    try {
      validateMongoObjectId(id, 'assignment');
      
      const response = await api.put(`/api/v1/questionnaire-assignments/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating assignment status:`, error);
      throw error;
    }
  },

  /**
   * Submit responses for a questionnaire and link to the assignment
   * @param {string} questionnaireId The questionnaire ID
   * @param {string} assignmentId The assignment ID
   * @param {Object} responses The questionnaire responses
   * @param {boolean} isCompleted Whether the questionnaire is being marked as complete
   * @returns {Promise<Object>} The submission result
   */
  submitQuestionnaire: async (questionnaireId: string, assignmentId: string, responses: Record<string, any>, isCompleted: boolean = false) => {
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
  },

  /**
   * Submit questionnaire responses for an assignment
   * @param {string} assignmentId - The assignment ID
   * @param {Object} responses - The questionnaire responses
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Submission result
   */
  submitQuestionnaireResponses: async (assignmentId: string, responses: any, notes?: string) => {
    try {
      // Validate assignment ID
      validateMongoObjectId(assignmentId, 'assignment');
      
      // Debug token information
      const token = localStorage.getItem('token');
      console.log('Current auth token exists:', !!token);
      
      if (token) {
        try {
          // Decode JWT token to see user info
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const tokenData = JSON.parse(jsonPayload);
          console.log('Current user from token:', {
            userId: tokenData.userId || tokenData.id,
            email: tokenData.email,
            role: tokenData.role,
            exp: new Date(tokenData.exp * 1000).toISOString()
          });
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      
      console.log(`Submitting questionnaire responses for assignment ${assignmentId}`);
      console.log('Request payload:', { responses, notes });
      
      // Debug: Get assignment details to compare with current user
      try {
        const assignmentResponse = await api.get(`/api/v1/questionnaire-assignments/${assignmentId}`);
        const assignment = assignmentResponse.data.data || assignmentResponse.data;
        console.log('Assignment details for authorization check:', {
          assignmentId,
          clientId: assignment.clientId,
          clientUserId: assignment.clientUserId,
          clientEmail: assignment.clientEmail,
          status: assignment.status
        });
        
        // Alert user if they need to login as client
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const tokenData = JSON.parse(jsonPayload);
            
            const currentUserId = tokenData.userId || tokenData.id;
            const currentUserEmail = tokenData.email;
            const currentUserRole = tokenData.role;
            
            console.log('Authorization comparison:', {
              currentUser: { id: currentUserId, email: currentUserEmail, role: currentUserRole },
              assignment: { 
                clientUserId: assignment.clientUserId, 
                clientEmail: assignment.clientEmail,
                clientId: assignment.clientId 
              },
              userIdMatches: currentUserId === assignment.clientUserId,
              emailMatches: currentUserEmail === assignment.clientEmail,
              clientIdMatches: currentUserId === assignment.clientId
            });
            
            // Warn if user appears to be logged in as wrong account
            if (currentUserRole !== 'client') {
              console.warn('❌ User is not logged in as a client! Current role:', currentUserRole);
              console.warn('💡 To submit this questionnaire, you need to:');
              console.warn('1. Log out from current account');
              console.warn('2. Go to /client-login');
              console.warn(`3. Login with email: ${assignment.clientEmail}`);
              console.warn('4. Use the password that was generated during client creation');
            } else if (currentUserEmail !== assignment.clientEmail) {
              console.warn('❌ Logged in as wrong client! Expected:', assignment.clientEmail, 'Actual:', currentUserEmail);
            }
          } catch (e) {
            console.error('Error decoding token for comparison:', e);
          }
        }
      } catch (debugError) {
        console.warn('Could not fetch assignment details for debugging:', debugError);
      }
      
      const response = await api.post(`/api/v1/questionnaire-assignments/${assignmentId}/submit`, {
        responses,
        notes
      });
      
      console.log('Questionnaire responses submitted successfully:', response.data);
      
      // Return the data in a consistent format
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error submitting questionnaire responses:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Re-throw with additional context
      if (error.response?.status === 403) {
        const backendError = error.response?.data?.error || 'Authorization failed';
        
        // Try to get assignment details for better error message
        let assignmentEmail = 'unknown';
        try {
          const assignmentResponse = await api.get(`/api/v1/questionnaire-assignments/${assignmentId}`);
          const assignment = assignmentResponse.data.data || assignmentResponse.data;
          assignmentEmail = assignment.clientEmail || 'unknown';
        } catch (e) {
          console.warn('Could not fetch assignment email for error message');
        }
        
        // Generate comprehensive error message using helper
        let errorMessage;
        try {
          const { generateAuthorizationErrorMessage } = await import('../utils/clientLoginHelper');
          const currentToken = localStorage.getItem('token');
          const currentUser = currentToken ? (() => {
            try {
              const base64Url = currentToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const tokenData = JSON.parse(jsonPayload);
              return {
                id: tokenData.userId || tokenData.id,
                email: tokenData.email
              };
            } catch (e) {
              return { id: 'unknown', email: 'unknown' };
            }
          })() : { id: 'unknown', email: 'unknown' };
          
          errorMessage = generateAuthorizationErrorMessage(
            assignmentId,
            assignmentEmail,
            currentUser.id,
            currentUser.email
          );
        } catch (helperError) {
          // Fallback error message if helper fails
          errorMessage = `❌ AUTHORIZATION ERROR: ${backendError}

🔐 This questionnaire was assigned to: ${assignmentEmail}

💡 To submit this questionnaire, you need to:
1. Log out from your current account
2. Go to the Client Login page (/client-login)
3. Login with the client credentials:
   • Email: ${assignmentEmail}
   • Password: (the password generated during client creation)

❓ If you don't have the client login credentials, please contact your attorney.`;
        }
        
        throw new Error(errorMessage);
      } else if (error.response?.status === 404) {
        throw new Error('Questionnaire assignment not found. It may have been deleted or completed.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid questionnaire responses. Please check your answers and try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      throw error;
    }
  },

  /**
   * Save draft responses for an assignment (store in localStorage for now)
   * @param {string} assignmentId - The assignment ID
   * @param {Object} responses - The questionnaire responses
   * @returns {Promise<void>}
   */
  saveDraftResponses: async (assignmentId: string, responses: any) => {
    try {
      const draftKey = `questionnaire_draft_${assignmentId}`;
      const draftData = {
        assignmentId,
        responses,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      console.log(`Draft saved for assignment ${assignmentId}`);
    } catch (error) {
      console.error('Error saving draft responses:', error);
      throw error;
    }
  },

  /**
   * Load draft responses for an assignment
   * @param {string} assignmentId - The assignment ID
   * @returns {Object|null} Draft responses or null if none found
   */
  loadDraftResponses: (assignmentId: string) => {
    try {
      const draftKey = `questionnaire_draft_${assignmentId}`;
      const draftData = localStorage.getItem(draftKey);
      
      if (draftData) {
        const parsed = JSON.parse(draftData);
        console.log(`Draft loaded for assignment ${assignmentId}`);
        return parsed.responses;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading draft responses:', error);
      return null;
    }
  },

  /**
   * Clear draft responses for an assignment (after successful submission)
   * @param {string} assignmentId - The assignment ID
   */
  clearDraftResponses: (assignmentId: string) => {
    try {
      const draftKey = `questionnaire_draft_${assignmentId}`;
      localStorage.removeItem(draftKey);
      console.log(`Draft cleared for assignment ${assignmentId}`);
    } catch (error) {
      console.error('Error clearing draft responses:', error);
    }
  },

  /**
   * Get assignment response for attorneys to view client submissions
   * @param {string} assignmentId - The assignment ID
   * @returns {Promise<Object>} Assignment and response data
   */
  getAssignmentResponse: async (assignmentId: string) => {
    try {
      validateMongoObjectId(assignmentId, 'assignment');
      
      console.log(`Getting assignment response for ${assignmentId}`);
      
      const response = await api.get(`/api/v1/questionnaire-assignments/${assignmentId}/response`);
      
      console.log('Assignment response retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('Error getting assignment response:', error);
      throw error;
    }
  },

  /**
   * Get all client responses for an attorney
   * @param {Object} filters - Filtering options
   * @returns {Promise<Object>} Client responses with pagination
   */
  getClientResponses: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      console.log('Getting client responses with filters:', filters);
      
      const response = await api.get(`/api/v1/questionnaire-assignments/client-responses?${params}`);
      
      console.log('Client responses retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('Error getting client responses:', error);
      throw error;
    }
  }
}

export default QuestionnaireAssignmentService;
