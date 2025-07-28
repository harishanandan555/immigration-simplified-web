import { ImmigrationQuestionnaire, QuestionnaireResponse } from '../types/questionnaire';

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
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

export interface QuestionnaireResponseSubmission {
  response_id: string;
  assessment_results?: {
    eligibility_score: number;
    recommended_forms: string[];
    next_steps: string[];
    estimated_timeline: string;
    potential_issues: string[];
    confidence_level: 'high' | 'medium' | 'low';
  };
  message: string;
}

class QuestionnaireService {
  private baseURL: string;

  constructor() {
    // Use the same baseURL logic as in QuestionnaireBuilder.tsx
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 
                  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
                    ? "http://localhost:5005/api/v1" 
                    : "https://immigration-simplified-api.onrender.com/api/v1");
    
    // Remove trailing slash if present
    if (this.baseURL.endsWith('/')) {
      this.baseURL = this.baseURL.slice(0, -1);
    }
    
    // If the baseURL doesn't include /api/v1 and it's not a relative path, add it
    if (!this.baseURL.includes('/api/v1') && !this.baseURL.startsWith('/')) {
      this.baseURL = `${this.baseURL}/api/v1`;
    }
    
    console.log(`[QuestionnaireService] Initialized with baseURL: ${this.baseURL}`);
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    // Debug output
    console.log(`[QuestionnaireService] Making request to ${this.baseURL}${url}`);
    console.log(`[QuestionnaireService] Auth token available: ${!!token}`);
    if (token) {
      console.log(`[QuestionnaireService] Token starts with: ${token.substring(0, 10)}...`);
    }
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    // Log request details
    console.log(`[QuestionnaireService] Request method: ${options.method || 'GET'}`);
    if (options.body && typeof options.body === 'string') {
      console.log(`[QuestionnaireService] Request body: ${options.body.substring(0, 200)}...`);
    }

    try {
      console.log(`[QuestionnaireService] Fetching ${this.baseURL}${url}`);
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      console.log(`[QuestionnaireService] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Try to get the error response as text first
        const errorText = await response.text();
        console.error(`[QuestionnaireService] Error response text:`, errorText);
        
        // Try to parse as JSON if possible
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
          console.error(`[QuestionnaireService] Parsed error data:`, errorData);
        } catch (parseError) {
          console.error(`[QuestionnaireService] Could not parse error response as JSON:`, parseError);
        }
        
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log(`[QuestionnaireService] Response body (first 200 chars): ${responseText.substring(0, 200)}...`);
      
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (jsonError: any) {
        console.error(`[QuestionnaireService] Error parsing JSON response:`, jsonError);
        console.error(`[QuestionnaireService] Raw response:`, responseText);
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }
    } catch (error) {
      console.error('[QuestionnaireService] Request failed:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  private getAuthToken(): string | null {
    // Try multiple storage locations for auth token with debug info
    const authToken = localStorage.getItem('auth_token');
    const sessionAuthToken = sessionStorage.getItem('auth_token');
    const accessToken = localStorage.getItem('access_token');
    const sessionAccessToken = sessionStorage.getItem('access_token');
    const regularToken = localStorage.getItem('token');
    
    // Log which token was found
    if (authToken) console.log('[QuestionnaireService] Found token in localStorage.auth_token');
    else if (sessionAuthToken) console.log('[QuestionnaireService] Found token in sessionStorage.auth_token');
    else if (accessToken) console.log('[QuestionnaireService] Found token in localStorage.access_token');
    else if (sessionAccessToken) console.log('[QuestionnaireService] Found token in sessionStorage.access_token');
    else if (regularToken) console.log('[QuestionnaireService] Found token in localStorage.token');
    else console.log('[QuestionnaireService] No auth token found in any storage location');
    
    // Return the first valid token found
    return authToken || sessionAuthToken || accessToken || sessionAccessToken || regularToken;
  }

  // ==================== QUESTIONNAIRE CRUD OPERATIONS ====================

  /**
   * Get all questionnaires with optional filtering
   */
  async getQuestionnaires(params?: {
    category?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<QuestionnaireListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `/questionnaires${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<QuestionnaireListResponse>(url);
  }

  /**
   * Get a specific questionnaire by ID
   */
  async getQuestionnaireById(id: string): Promise<ImmigrationQuestionnaire> {
    return this.makeRequest<ImmigrationQuestionnaire>(`/questionnaires/${id}`);
  }

  /**
   * Create a new questionnaire
   */
  async createQuestionnaire(
    questionnaire: Omit<ImmigrationQuestionnaire, 'id' | 'created_by' | 'organization_id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<{ id: string; message: string; version: number }> {
    // Verify auth token is available before attempting request
    const token = this.getAuthToken();
    if (!token) {
      console.error('[QuestionnaireService] No authentication token available. Cannot create questionnaire.');
      throw new Error('Authentication required. Please log in and try again.');
    }
    
    try {
      console.log('[QuestionnaireService] Creating new questionnaire with title:', questionnaire.title);
      
      return this.makeRequest<{ id: string; message: string; version: number }>('/questionnaires', {
        method: 'POST',
        body: JSON.stringify(questionnaire),
      });
    } catch (error: any) {
      // Enhanced error handling
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.error('[QuestionnaireService] Authorization failed. Token may be invalid or expired.');
        throw new Error('Authentication failed. Please log out and log back in.');
      }
      
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        console.warn('[QuestionnaireService] Questionnaire with this title already exists.');
        throw new Error('A questionnaire with this title already exists. Please use a different title.');
      }
      
      throw error;
    }
  }

  /**
   * Update an existing questionnaire
   */
  async updateQuestionnaire(
    id: string,
    questionnaire: Omit<ImmigrationQuestionnaire, 'id' | 'created_by' | 'organization_id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<{ id: string; message: string; version: number }> {
    return this.makeRequest<{ id: string; message: string; version: number }>(`/questionnaires/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionnaire),
    });
  }

  /**
   * Delete a questionnaire (soft delete)
   */
  async deleteQuestionnaire(id: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/questionnaires/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Duplicate an existing questionnaire
   */
  async duplicateQuestionnaire(
    id: string,
    updates: { title: string; description?: string }
  ): Promise<{ id: string; message: string; original_id: string }> {
    return this.makeRequest<{ id: string; message: string; original_id: string }>(`/questionnaires/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  // ==================== QUESTIONNAIRE RESPONSES ====================

  /**
   * Submit a questionnaire response
   */
  async submitQuestionnaireResponse(
    questionnaireId: string,
    data: {
      client_id?: string;
      responses: Record<string, any>;
      auto_save?: boolean;
      notes?: string;
    }
  ): Promise<QuestionnaireResponseSubmission> {
    return this.makeRequest<QuestionnaireResponseSubmission>(`/questionnaires/${questionnaireId}/responses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all responses for a questionnaire
   */
  async getQuestionnaireResponses(
    questionnaireId: string,
    params?: {
      client_id?: string;
      submitted_after?: string;
      submitted_before?: string;
      is_complete?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    responses: QuestionnaireResponse[];
    pagination: any;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `/questionnaires/${questionnaireId}/responses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<{
      responses: QuestionnaireResponse[];
      pagination: any;
    }>(url);
  }

  /**
   * Get a specific response by ID
   */
  async getResponseById(id: string): Promise<QuestionnaireResponse> {
    return this.makeRequest<QuestionnaireResponse>(`/responses/${id}`);
  }

  /**
   * Update a response (for auto-save)
   */
  async updateResponse(
    id: string,
    data: {
      responses: Record<string, any>;
      is_complete?: boolean;
    }
  ): Promise<{ message: string; auto_saved_at: string }> {
    return this.makeRequest<{ message: string; auto_saved_at: string }>(`/responses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get questionnaires by category (for immigration process integration)
   */
  async getQuestionnairesByCategory(category: string): Promise<ImmigrationQuestionnaire[]> {
    const response = await this.getQuestionnaires({ category, is_active: true });
    return response.questionnaires;
  }

  /**
   * Search questionnaires
   */
  async searchQuestionnaires(query: string): Promise<ImmigrationQuestionnaire[]> {
    const response = await this.getQuestionnaires({ search: query, is_active: true });
    return response.questionnaires;
  }

  /**
   * Validate questionnaire data before submission
   */
  validateQuestionnaireData(questionnaire: Partial<ImmigrationQuestionnaire>): string[] {
    const errors: string[] = [];

    if (!questionnaire.title?.trim()) {
      errors.push('Title is required');
    }

    if (!questionnaire.category) {
      errors.push('Category is required');
    }

    if (!questionnaire.fields || questionnaire.fields.length === 0) {
      errors.push('At least one field is required');
    }

    questionnaire.fields?.forEach((field, index) => {
      if (!field.label?.trim()) {
        errors.push(`Field ${index + 1}: Label is required`);
      }

      if (!field.type) {
        errors.push(`Field ${index + 1}: Type is required`);
      }

      if (['select', 'multiselect', 'radio', 'checkbox'].includes(field.type) && (!field.options || field.options.length === 0)) {
        errors.push(`Field ${index + 1}: Options are required for ${field.type} fields`);
      }
    });

    return errors;
  }

  /**
   * Export questionnaire data
   */
  async exportQuestionnaire(id: string): Promise<ImmigrationQuestionnaire> {
    const questionnaire = await this.getQuestionnaireById(id);
    
    // Create downloadable JSON
    const dataStr = JSON.stringify(questionnaire, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `questionnaire-${questionnaire.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    return questionnaire;
  }

  /**
   * Import questionnaire from JSON
   */
  async importQuestionnaire(file: File): Promise<ImmigrationQuestionnaire> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          // Validate imported data
          const errors = this.validateQuestionnaireData(jsonData);
          if (errors.length > 0) {
            reject(new Error(`Invalid questionnaire data: ${errors.join(', ')}`));
            return;
          }

          // Remove ID and timestamps for import
          delete jsonData.id;
          delete jsonData.created_at;
          delete jsonData.updated_at;
          delete jsonData.created_by;
          delete jsonData.organization_id;
          delete jsonData.version;

          // Add "(Imported)" to title if not already present
          if (!jsonData.title.includes('(Imported)')) {
            jsonData.title += ' (Imported)';
          }

          resolve(jsonData);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * Check if API is available (for fallback to localStorage)
   */
  async isAPIAvailable(): Promise<boolean> {
    try {
      // Try a basic request to see if API is responding
      console.log('[QuestionnaireService] Testing API connectivity...');
      
      // Use questionnaires endpoint with limit=1 instead of debug endpoint
      const response = await fetch(`${this.baseURL}/questionnaires?limit=1`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          // Include auth token if available
          ...(this.getAuthToken() && { 
            'Authorization': `Bearer ${this.getAuthToken()}` 
          })
        }
      });
      
      console.log(`[QuestionnaireService] API test response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[QuestionnaireService] API test failed with status ${response.status}`);
        return false;
      }
      
      // Try to parse the response as JSON
      const responseText = await response.text();
      console.log(`[QuestionnaireService] API test response: ${responseText.substring(0, 100)}...`);
      
      try {
        JSON.parse(responseText);
        console.log('[QuestionnaireService] API is available and returning valid JSON');
        return true;
      } catch (e) {
        console.error('[QuestionnaireService] API returned non-JSON response');
        return false;
      }
    } catch (error) {
      console.error('[QuestionnaireService] API connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Test authentication status to ensure the user is properly authenticated
   */
  async testAuthentication(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
    role?: string;
    message: string;
  }> {
    const token = this.getAuthToken();
    if (!token) {
      console.log('[QuestionnaireService] No authentication token found for testing');
      return {
        isAuthenticated: false,
        message: 'No authentication token found'
      };
    }
    
    console.log(`[QuestionnaireService] Testing authentication with token: ${token.substring(0, 10)}...`);
    
    try {
      // First, try with the /auth/profile endpoint
      console.log(`[QuestionnaireService] Testing auth with ${this.baseURL}/auth/profile`);
      let response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`[QuestionnaireService] Auth test response status: ${response.status}`);
      
      // If profile endpoint fails, try a basic endpoint as fallback
      if (!response.ok) {
        console.log('[QuestionnaireService] Profile endpoint failed, trying with questionnaires endpoint');
        response = await fetch(`${this.baseURL}/questionnaires?limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`[QuestionnaireService] Fallback auth test response status: ${response.status}`);
        
        // If this endpoint returns 401, the token is definitely invalid
        if (response.status === 401) {
          console.error('[QuestionnaireService] Authentication failed with 401 Unauthorized');
          return {
            isAuthenticated: false,
            message: 'Authentication token is invalid or expired'
          };
        }
        
        // If endpoint is accessible with auth token, consider it authenticated
        if (response.ok) {
          console.log('[QuestionnaireService] Fallback endpoint accessible with token, considering authenticated');
          return {
            isAuthenticated: true,
            message: 'User appears to be authenticated'
          };
        }
        
        return {
          isAuthenticated: false,
          message: `Authentication check failed with status: ${response.status}`
        };
      }
      
      // Parse and return user data if profile endpoint was successful
      try {
        const responseText = await response.text();
        console.log(`[QuestionnaireService] Auth response: ${responseText.substring(0, 100)}...`);
        
        const userData = JSON.parse(responseText);
        console.log(`[QuestionnaireService] User authenticated as ID: ${userData._id || userData.id}`);
        
        return {
          isAuthenticated: true,
          userId: userData._id || userData.id,
          role: userData.role,
          message: 'User is authenticated'
        };
      } catch (parseError: any) {
        console.error('[QuestionnaireService] Error parsing auth response:', parseError);
        return {
          isAuthenticated: response.ok,
          message: response.ok ? 'Authentication successful but could not parse user data' : 'Authentication failed'
        };
      }
    } catch (error: any) {
      console.error('[QuestionnaireService] Authentication check error:', error);
      return {
        isAuthenticated: false,
        message: `Authentication check error: ${error.message}`
      };
    }
  }

  /**
   * Get questionnaire details by ID (for clients)
   * @param {string} questionnaireId - The questionnaire ID
   * @returns {Promise<Object>} Questionnaire details
   */
  async getQuestionnaireForClient(questionnaireId: string): Promise<ImmigrationQuestionnaire> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    console.log(`[QuestionnaireService] Getting questionnaire ${questionnaireId} for client`);

    try {
      const response = await fetch(`${this.baseURL}/questionnaires/${questionnaireId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[QuestionnaireService] Failed to get questionnaire: ${response.status} ${errorText}`);
        throw new Error(`Failed to get questionnaire: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[QuestionnaireService] Successfully retrieved questionnaire ${questionnaireId}`);
      
      return data.data || data;
    } catch (error: any) {
      console.error(`[QuestionnaireService] Error getting questionnaire ${questionnaireId}:`, error);
      throw new Error(`Failed to get questionnaire: ${error.message}`);
    }
  }
}

// Create singleton instance
export const questionnaireService = new QuestionnaireService();
export default questionnaireService;