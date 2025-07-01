export interface QuestionnaireField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'yesno' | 'rating' | 'file' | 'address';
  label: string;
  placeholder?: string;
  required: boolean;
  help_text?: string;
  eligibility_impact: 'high' | 'medium' | 'low';
  options?: string[]; // for select/radio/checkbox types
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
    accepted_file_types?: string[];
    max_file_size?: number; // in bytes
  };
  conditional_logic?: {
    show_if?: {
      field_id: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    };
    required_if?: {
      field_id: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    };
  };
  order: number;
}

export interface QuestionnaireSettings {
  show_progress_bar: boolean;
  allow_back_navigation: boolean;
  auto_save: boolean;
  show_results: boolean;
  theme: 'default' | 'modern' | 'minimal';
  require_completion?: boolean;
  save_partial_responses?: boolean;
}

export interface ImmigrationQuestionnaire {
  id: string;
  title: string;
  description: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'citizenship' | 'temporary' | 'assessment' | 'general';
  created_by: string;
  organization_id?: string;
  is_active: boolean;
  settings: QuestionnaireSettings;
  fields: QuestionnaireField[];
  created_at: string;
  updated_at: string;
  version: number;
}

export interface AssessmentResults {
  eligibility_score: number; // 0-100
  recommended_forms: string[];
  next_steps: string[];
  estimated_timeline: string;
  potential_issues: string[];
  confidence_level: 'high' | 'medium' | 'low';
  detailed_analysis?: Record<string, any>;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaire_id: string;
  client_id: string;
  submitted_by?: string; // if attorney submits on behalf
  responses: Record<string, any>; // field_id -> response value
  is_complete: boolean;
  auto_saved_at?: string;
  submitted_at?: string;
  assessment_results?: AssessmentResults;
  created_at: string;
  updated_at: string;
}

// Response value types for different field types
export type FieldResponseValue = 
  | string              // text, email, phone, textarea, select, radio
  | number              // number, rating
  | boolean             // yesno
  | string[]            // multiselect, checkbox
  | Date                // date
  | AddressValue        // address
  | FileValue           // file
  | any;                // fallback

export interface AddressValue {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface FileValue {
  filename: string;
  size: number;
  type: string;
  upload_id: string;
}

// API Response types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  timestamp?: string;
  request_id?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
} 