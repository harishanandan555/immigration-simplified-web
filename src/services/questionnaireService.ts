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
    
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    console.log('[QuestionnaireService] Request headers:', {
      'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN',
      'Content-Type': 'application/json'
    });

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    const fullUrl = `${this.baseURL}${url}`;
    console.log('[QuestionnaireService] Making request:', {
      url: fullUrl,
      method: config.method || 'GET',
      hasToken: !!token,
      tokenStart: token ? token.substring(0, 10) + '...' : 'none'
    });

    try {
      const response = await fetch(fullUrl, config);
      
      console.log('[QuestionnaireService] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
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
        
        // Handle authentication errors (including 500 errors that are auth-related)
        if (response.status === 401 || response.status === 403 || 
            (response.status === 500 && (
              errorData?.error?.code === 'unauthorized' || 
              errorData?.error?.message?.includes('unauthorized') ||
              errorData?.error?.message?.includes('Not authorized') ||
              errorText.includes('unauthorized') ||
              errorText.includes('Not authorized')
            ))) {
          throw new Error('Authentication failed. Please log in again.');
        }
        
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
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
    // Use the same token retrieval pattern as the main API utility
    const token = localStorage.getItem('token');
    
    console.log('[QuestionnaireService] Token check:', {
      foundToken: token ? `present (${token.substring(0, 10)}...)` : 'missing',
      tokenLength: token ? token.length : 0
    });
    
    return token;
  }

  // ==================== QUESTIONNAIRE CRUD OPERATIONS ====================

  /**
   * Get all questionnaires
   */
  async getQuestionnaires(): Promise<QuestionnaireListResponse> {
    const url = `/questionnaires`;
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
    const response = await this.getQuestionnaires();
    // Filter by category on the client side
    return response.questionnaires.filter(q => q.category === category && q.is_active);
  }

  /**
   * Search questionnaires
   */
  async searchQuestionnaires(query: string): Promise<ImmigrationQuestionnaire[]> {
    const response = await this.getQuestionnaires();
    // Filter by search query on the client side
    const searchLower = query.toLowerCase();
    return response.questionnaires.filter(q => 
      q.is_active && (
        q.title.toLowerCase().includes(searchLower) ||
        q.description.toLowerCase().includes(searchLower) ||
        q.category.toLowerCase().includes(searchLower)
      )
    );
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
   * Import questionnaire from file using backend import endpoint
   */
  async importQuestionnaire(file: File): Promise<ImmigrationQuestionnaire> {
    console.log('[QuestionnaireService] ==================== IMPORT STARTED ====================');
    console.log('[QuestionnaireService] File details:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    try {
      // Check if it's a text file - process it on frontend first to avoid backend category issues
      if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        console.log('[QuestionnaireService] 📝 Text file detected - processing on frontend first');
        const questionnaireData = await this.importFromText(file);
        
        // Remove properties that shouldn't be sent to API
        const apiData = {
          title: questionnaireData.title,
          description: questionnaireData.description,
          category: questionnaireData.category,
          fields: questionnaireData.fields,
          settings: questionnaireData.settings,
          is_active: questionnaireData.is_active
        };
        
        // Now create the questionnaire using the standard create endpoint
        console.log('[QuestionnaireService] 🚀 Creating questionnaire from processed text data:', apiData);
        const createResult = await this.createQuestionnaire(apiData as any);
        console.log('[QuestionnaireService] ✅ Questionnaire created, fetching full data:', createResult);
        
        // Fetch the complete questionnaire
        return await this.getQuestionnaireById(createResult.id);
      }

      const token = this.getAuthToken();
      console.log('[QuestionnaireService] Auth token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenStart: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
      });

      if (!token) {
        console.error('[QuestionnaireService] ❌ Authentication token not found');
        throw new Error('Authentication token not found');
      }

      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append('file', file);

      const fullUrl = `${this.baseURL}/questionnaires/import`;
      
      console.log('[QuestionnaireService] 📤 Making import request:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: fullUrl,
        baseURL: this.baseURL,
        method: 'POST',
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          valueType: typeof value,
          isFile: value instanceof File,
          fileName: value instanceof File ? value.name : undefined
        }))
      });

      console.log('[QuestionnaireService] 🔐 Request headers:', {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        ContentType: 'FormData (multipart/form-data with boundary)'
      });

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      console.log('[QuestionnaireService] 📨 Import response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        responseSize: response.headers.get('content-length')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QuestionnaireService] ❌ Import error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          errorLength: errorText.length
        });
        throw new Error(`Import failed: ${response.statusText} - ${errorText}`);
      }

      console.log('[QuestionnaireService] 📖 Reading response body...');
      const responseText = await response.text();
      console.log('[QuestionnaireService] Raw response text:', {
        length: responseText.length,
        preview: responseText.substring(0, 500),
        isJson: responseText.trim().startsWith('{') || responseText.trim().startsWith('[')
      });

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('[QuestionnaireService] ✅ Response parsed as JSON:', {
          resultType: typeof result,
          resultKeys: typeof result === 'object' ? Object.keys(result) : 'N/A',
          hasData: !!result.data,
          hasQuestionnaire: !!result.questionnaire,
          hasId: !!(result.id || result._id),
          hasTitle: !!result.title,
          hasFields: !!(result.fields && Array.isArray(result.fields))
        });
      } catch (parseError) {
        console.error('[QuestionnaireService] ❌ Failed to parse response as JSON:', parseError);
        console.error('[QuestionnaireService] Response content:', responseText);
        throw new Error(`Invalid JSON response: ${parseError}`);
      }

      console.log('[QuestionnaireService] 🎯 Import result structure:', {
        result: result,
        resultData: result.data,
        resultQuestionnaire: result.questionnaire,
        finalQuestionnaire: result.data || result.questionnaire || result
      });

      const finalResult = result.data || result.questionnaire || result;
      console.log('[QuestionnaireService] ✅ Import successful! Final questionnaire:', {
        id: finalResult.id || finalResult._id,
        title: finalResult.title,
        fieldsCount: finalResult.fields ? finalResult.fields.length : 0,
        category: finalResult.category,
        isActive: finalResult.is_active
      });

      console.log('[QuestionnaireService] ==================== IMPORT COMPLETED ====================');
      
      return finalResult;
      
    } catch (error: any) {
      console.error('[QuestionnaireService] ❌ ==================== IMPORT FAILED ====================');
      console.error('[QuestionnaireService] Import error details:', {
        errorMessage: error.message,
        errorType: error.constructor.name,
        errorStack: error.stack,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw new Error(`Failed to import questionnaire: ${error.message}`);
    }
  }

  /**
   * Import questionnaire from JSON file (original functionality)
   */
  // @ts-ignore - Method reserved for future use
  private async importFromJSON(file: File): Promise<ImmigrationQuestionnaire> {
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

          // Ensure category is valid - backend only accepts specific values
          const validCategories = ['family-based', 'employment-based', 'humanitarian', 'citizenship', 'temporary', 'assessment', 'general'];
          if (!jsonData.category || !validCategories.includes(jsonData.category)) {
            console.log('[QuestionnaireService] Invalid category detected, setting to "general":', jsonData.category);
            jsonData.category = 'general';
          }

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
   * Import questionnaire from PDF file
   */
  // @ts-ignore - Method reserved for future use
  private async importFromPDF(file: File): Promise<ImmigrationQuestionnaire> {
    // Note: This is a simplified implementation
    // For production, you might want to use PDF.js or similar library
    console.log('Attempting to import PDF file:', file.name);
    throw new Error('PDF import requires additional processing. Please convert PDF to text format first.');
  }

  /**
   * Import questionnaire from Word document
   */
  // @ts-ignore - Method reserved for future use
  private async importFromDocument(file: File): Promise<ImmigrationQuestionnaire> {
    // Note: This is a simplified implementation
    // For production, you might want to use mammoth.js or similar library
    console.log('Attempting to import document file:', file.name);
    throw new Error('Document import requires additional processing. Please convert document to text format first.');
  }

  /**
   * Import questionnaire from text file
   */
  private async importFromText(file: File): Promise<ImmigrationQuestionnaire> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const textContent = e.target?.result as string;
          const questionnaire = this.parseTextToQuestionnaire(textContent, file.name);
          resolve(questionnaire);
        } catch (error) {
          reject(new Error('Failed to parse text file'));
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * Parse text content and create questionnaire structure
   */
  private parseTextToQuestionnaire(text: string, fileName: string): ImmigrationQuestionnaire {
    const lines = text.split('\n').filter(line => line.trim());
    const fields: any[] = [];
    
    // Enhanced parsing to handle different formats
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      let fieldType = 'text';
      let fieldLabel = trimmedLine;
      let fieldOptions: string[] = [];
      
      // Check if field type is specified in parentheses (e.g., "First Name(text)")
      const typeMatch = trimmedLine.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (typeMatch) {
        fieldLabel = typeMatch[1].trim();
        const specifiedType = typeMatch[2].toLowerCase().trim();
        
        // Map specified types to our field types
        switch (specifiedType) {
          case 'text':
          case 'string':
            fieldType = 'text';
            break;
          case 'email':
            fieldType = 'email';
            break;
          case 'phone':
          case 'telephone':
            fieldType = 'phone';
            break;
          case 'number':
          case 'numeric':
            fieldType = 'number';
            break;
          case 'date':
            fieldType = 'date';
            break;
          case 'textarea':
          case 'longtext':
            fieldType = 'textarea';
            break;
          case 'radio':
          case 'select':
            fieldType = 'radio';
            fieldOptions = ['Option 1', 'Option 2', 'Option 3'];
            break;
          case 'checkbox':
          case 'multiselect':
            fieldType = 'checkbox';
            fieldOptions = ['Option 1', 'Option 2', 'Option 3'];
            break;
          case 'yesno':
          case 'boolean':
            fieldType = 'yesno';
            fieldOptions = ['Yes', 'No'];
            break;
          case 'address':
            fieldType = 'address';
            break;
          case 'file':
          case 'upload':
            fieldType = 'file';
            break;
          default:
            fieldType = 'text';
        }
      } else {
        // Fallback to original heuristic detection
        if (trimmedLine.endsWith('?') || 
            /^(what|how|when|where|why|which|who|do you|did you|have you|are you|will you|can you)/i.test(trimmedLine)) {
          
          // Determine field type based on content
          if (/email/i.test(trimmedLine)) fieldType = 'email';
          else if (/phone|telephone/i.test(trimmedLine)) fieldType = 'phone';
          else if (/date|birth|when/i.test(trimmedLine)) fieldType = 'date';
          else if (/address/i.test(trimmedLine)) fieldType = 'address';
          else if (/yes|no|\(y\/n\)/i.test(trimmedLine)) {
            fieldType = 'yesno';
            fieldOptions = ['Yes', 'No'];
          }
          else if (trimmedLine.length > 100) fieldType = 'textarea';
          
          // Remove question marks and colons from label
          fieldLabel = trimmedLine.replace(/[?:]+$/, '').trim();
        } else if (/^(name|address|phone|email|date|age)/i.test(trimmedLine)) {
          // Handle field names without questions
          if (/email/i.test(trimmedLine)) fieldType = 'email';
          else if (/phone/i.test(trimmedLine)) fieldType = 'phone';
          else if (/date|birth/i.test(trimmedLine)) fieldType = 'date';
          else if (/address/i.test(trimmedLine)) fieldType = 'address';
          else if (/zip|postal/i.test(trimmedLine)) fieldType = 'number';
        }
      }
      
      // Create field object
      if (fieldLabel) {
        fields.push({
          id: `field_${Date.now()}_${index}`,
          type: fieldType,
          label: fieldLabel,
          required: false,
          order: fields.length,
          eligibility_impact: 'medium',
          placeholder: '',
          help_text: '',
          options: fieldOptions.length > 0 ? fieldOptions : 
                   (['radio', 'checkbox', 'select', 'multiselect'].includes(fieldType) ? ['Option 1', 'Option 2'] : [])
        });
      }
    });

    // If no fields found, create a basic field
    if (fields.length === 0) {
      fields.push({
        id: `field_${Date.now()}_0`,
        type: 'textarea',
        label: `Content from ${fileName}`,
        required: false,
        order: 0,
        eligibility_impact: 'medium',
        help_text: 'Please review and edit this imported content',
        placeholder: '',
        options: []
      });
    }

    const baseName = fileName.replace(/\.[^/.]+$/, '');
    return {
      id: 'new',
      title: `Imported from ${baseName}`,
      description: `Questionnaire automatically generated from text file: ${fileName}. Contains ${fields.length} fields.`,
      category: 'general',
      fields,
      settings: {
        show_progress_bar: true,
        allow_back_navigation: true,
        auto_save: true,
        require_completion: false,
        show_results: true,
        theme: 'default'
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as ImmigrationQuestionnaire;
  }

  /**
   * Check if API is available (for fallback to localStorage)
   */
  async isAPIAvailable(): Promise<boolean> {
    try {
      
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
      
      // Consider API available if we get any response (including 401 unauthorized)
      // 401 means API is working but requires authentication, which is fine
      if (response.status === 401) {
        console.log('[QuestionnaireService] API is available but requires authentication');
        return true;
      }
      
      if (!response.ok) {
        console.error(`[QuestionnaireService] API test failed with status ${response.status}`);
        return false;
      }
      
      // Try to parse the response as JSON
      const responseText = await response.text();
      try {
        JSON.parse(responseText);
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
      return {
        isAuthenticated: false,
        message: 'No authentication token found'
      };
    }
    
    
    try {
      // First, try with the /auth/profile endpoint
      let response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      
      // If profile endpoint fails, try a basic endpoint as fallback
      if (!response.ok) {
        response = await fetch(`${this.baseURL}/questionnaires?limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        
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
        
        const userData = JSON.parse(responseText);
        
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