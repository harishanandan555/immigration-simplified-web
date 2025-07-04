import { ImmigrationQuestionnaire, QuestionnaireField, QuestionnaireResponse } from '../types/questionnaire';

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
    // Check for API base URL in environment variables, fallback to relative path
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
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

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  private getAuthToken(): string | null {
    // Try multiple storage locations for auth token
    return localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token') ||
           localStorage.getItem('access_token') ||
           sessionStorage.getItem('access_token');
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
    return this.makeRequest<{ id: string; message: string; version: number }>('/questionnaires', {
      method: 'POST',
      body: JSON.stringify(questionnaire),
    });
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
      await this.makeRequest('/questionnaires?limit=1');
      return true;
    } catch (error) {
      console.warn('API not available, falling back to localStorage:', error);
      return false;
    }
  }
}

// Create singleton instance
export const questionnaireService = new QuestionnaireService();
export default questionnaireService; 