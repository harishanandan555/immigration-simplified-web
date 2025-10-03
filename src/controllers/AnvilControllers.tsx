import api from '../utils/api';
import { ANVIL_END_POINTS } from '../utils/constants';
import axios from 'axios';

// Define common response type
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

const handleApiError = (error: any) => {
    if (axios.isAxiosError(error)) {
        return {
            data: error.response?.data || 'An error occurred',
            status: error.response?.status || 500,
            statusText: error.response?.statusText || 'Internal Server Error'
        };
    }
    return {
        data: 'An unexpected error occurred',
        status: 500,
        statusText: 'Internal Server Error'
    };
};

// Anvil PDF Template Interfaces
export interface AnvilFillRequest {
  templateId: string;
  formData: Record<string, any>;
  options?: {
    filename?: string;
    download?: boolean;
    preview?: boolean;
  };
}

export interface AnvilFillResponse {
  success: boolean;
  data?: {
    pdfUrl?: string;
    downloadUrl?: string;
    filename?: string;
    fileSize?: number;
    contentType?: string;
  };
  message?: string;
  error?: string;
}

export interface AnvilTemplateInfo {
  templateId: string;
  name: string;
  description?: string;
  fields: AnvilField[];
  metadata?: {
    version?: string;
    created?: string;
    updated?: string;
  };
}

export interface AnvilField {
  fieldId: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'checkbox' | 'radio' | 'select' | 'signature' | 'file';
  required: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  options?: string[];
  defaultValue?: any;
}

export interface AnvilTemplateListItem {
  templateId: string;
  name: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'draft';
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  fieldCount?: number;
  metadata?: {
    thumbnail?: string;
    tags?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime?: string;
  };
}

export interface AnvilTemplatesListResponse {
  templates: AnvilTemplateListItem[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export interface AnvilTemplatesListParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'fieldCount';
  sortOrder?: 'asc' | 'desc';
}

export interface AnvilTemplatePayload {
  templateId: string;
  name: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'draft';
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  fields: AnvilField[];
  metadata?: {
    thumbnail?: string;
    tags?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime?: string;
    pageCount?: number;
    fileSize?: number;
    author?: string;
    lastModifiedBy?: string;
  };
  payload: {
    rawData?: any;
    processedData?: any;
    schema?: any;
    validationRules?: any;
    fieldMappings?: Record<string, any>;
    dependencies?: string[];
    requirements?: string[];
  };
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    canDownload: boolean;
    canPreview: boolean;
  };
  usage?: {
    totalUses: number;
    lastUsed?: string;
    averageCompletionTime?: number;
    successRate?: number;
  };
}

// Anvil PDF Template Controllers

/**
 * Get list of available Anvil templates
 */
export const getAnvilTemplatesList = async (
  params?: AnvilTemplatesListParams
): Promise<ApiResponse<AnvilTemplatesListResponse>> => {
  try {
    const response = await api.get(ANVIL_END_POINTS.GET_TEMPLATES_LIST, { params });
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get template payload by template ID
 */
export const getAnvilTemplatePayload = async (
  templateId: string
): Promise<ApiResponse<AnvilTemplatePayload>> => {
  try {
    const response = await api.get(
      ANVIL_END_POINTS.GET_TEMPLATE_PAYLOAD.replace(':templateId', templateId)
    );
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fill PDF template using Anvil API
 */
export const fillPdfTemplate = async (
  templateId: string, 
  formData: Record<string, any>,
  options?: {
    filename?: string;
    download?: boolean;
    preview?: boolean;
  }
): Promise<ApiResponse<AnvilFillResponse>> => {
  try {
    const requestData: AnvilFillRequest = {
      templateId,
      formData,
      options
    };

    const response = await api.post(
      ANVIL_END_POINTS.FILL_PDF_TEMPLATE.replace(':templateId', templateId),
      requestData
    );
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fill PDF template and get blob for download/preview
 */
export const fillPdfTemplateBlob = async (
  templateId: string, 
  formData: Record<string, any>,
  options?: {
    filename?: string;
  }
): Promise<ApiResponse<Blob>> => {
  try {
    const requestData: AnvilFillRequest = {
      templateId,
      formData,
      options: {
        ...options,
        download: true
      }
    };

    const response = await api.post(
      ANVIL_END_POINTS.FILL_PDF_TEMPLATE.replace(':templateId', templateId),
      requestData,
      {
        responseType: 'blob'
      }
    );
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Fill PDF template and get preview URL
 */
export const fillPdfTemplatePreview = async (
  templateId: string, 
  formData: Record<string, any>
): Promise<ApiResponse<AnvilFillResponse>> => {
  try {
    const requestData: AnvilFillRequest = {
      templateId,
      formData,
      options: {
        preview: true
      }
    };

    const response = await api.post(
      ANVIL_END_POINTS.FILL_PDF_TEMPLATE.replace(':templateId', templateId),
      requestData
    );
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Utility functions for common operations

/**
 * Download filled PDF file
 */
export const downloadFilledPdf = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Create PDF blob URL for preview
 */
export const createPdfPreviewUrl = (blob: Blob): string => {
  return window.URL.createObjectURL(blob);
};

/**
 * Revoke PDF blob URL to free memory
 */
export const revokePdfPreviewUrl = (url: string): void => {
  window.URL.revokeObjectURL(url);
};

/**
 * Handle API errors with user-friendly messages
 */
export const handleAnvilApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'Template not found. Please check the template ID.';
      case 400:
        return error.response?.data?.message || 'Invalid request data.';
      case 422:
        return error.response?.data?.message || 'Validation error. Please check your form data.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Anvil service is temporarily unavailable. Please try again later.';
      default:
        return error.response?.data?.message || 'An unexpected error occurred.';
    }
  }
  return 'An unexpected error occurred.';
};

/**
 * Validate form data before submission
 */
export const validateAnvilFormData = (formData: Record<string, any>): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  // Check if formData is not empty
  if (!formData || Object.keys(formData).length === 0) {
    errors.push('Form data cannot be empty');
  }
  
  // Check for required fields (basic validation)
  Object.entries(formData).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      errors.push(`Field '${key}' cannot be empty`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Prepare form data for Anvil API submission
 */
export const prepareAnvilFormData = (rawData: any): Record<string, any> => {
  const preparedData: Record<string, any> = {};
  
  Object.entries(rawData).forEach(([key, value]) => {
    // Convert null/undefined to empty string for text fields
    if (value === null || value === undefined) {
      preparedData[key] = '';
    } else {
      preparedData[key] = value;
    }
  });
  
  return preparedData;
};

/**
 * Format filename with timestamp
 */
export const formatAnvilFilename = (baseName: string, templateId: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${baseName}_${templateId}_${timestamp}.pdf`;
};

/**
 * Check if response contains valid PDF data
 */
export const isValidPdfResponse = (response: any): boolean => {
  return response && 
         response.data && 
         (response.data instanceof Blob || 
          (typeof response.data === 'object' && response.data.pdfUrl));
};

/**
 * Extract filename from response headers
 */
export const extractFilenameFromHeaders = (headers: any): string | null => {
  const contentDisposition = headers['content-disposition'];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, '');
    }
  }
  return null;
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if template ID is valid
 */
export const isValidTemplateId = (templateId: string): boolean => {
  return Boolean(templateId && 
         typeof templateId === 'string' && 
         templateId.trim().length > 0);
};

/**
 * Sanitize form data for Anvil API
 */
export const sanitizeAnvilFormData = (formData: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  Object.entries(formData).forEach(([key, value]) => {
    // Remove any potentially dangerous characters
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '');
    
    if (typeof value === 'string') {
      // Basic XSS protection
      sanitized[sanitizedKey] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else {
      sanitized[sanitizedKey] = value;
    }
  });
  
  return sanitized;
};

// Template List Utility Functions

/**
 * Filter templates by category
 */
export const filterTemplatesByCategory = (
  templates: AnvilTemplateListItem[], 
  category: string
): AnvilTemplateListItem[] => {
  return templates.filter(template => 
    template.category?.toLowerCase() === category.toLowerCase()
  );
};

/**
 * Filter templates by status
 */
export const filterTemplatesByStatus = (
  templates: AnvilTemplateListItem[], 
  status: string
): AnvilTemplateListItem[] => {
  return templates.filter(template => 
    template.status === status
  );
};

/**
 * Search templates by name or description
 */
export const searchTemplates = (
  templates: AnvilTemplateListItem[], 
  searchTerm: string
): AnvilTemplateListItem[] => {
  const term = searchTerm.toLowerCase();
  return templates.filter(template => 
    template.name.toLowerCase().includes(term) ||
    template.description?.toLowerCase().includes(term) ||
    template.templateId.toLowerCase().includes(term)
  );
};

/**
 * Sort templates by specified field
 */
export const sortTemplates = (
  templates: AnvilTemplateListItem[],
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'fieldCount',
  sortOrder: 'asc' | 'desc' = 'asc'
): AnvilTemplateListItem[] => {
  return [...templates].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt || 0).getTime();
        bValue = new Date(b.updatedAt || 0).getTime();
        break;
      case 'fieldCount':
        aValue = a.fieldCount || 0;
        bValue = b.fieldCount || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Get active templates only
 */
export const getActiveTemplates = (templates: AnvilTemplateListItem[]): AnvilTemplateListItem[] => {
  return templates.filter(template => template.status === 'active');
};

/**
 * Get templates by difficulty level
 */
export const getTemplatesByDifficulty = (
  templates: AnvilTemplateListItem[], 
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): AnvilTemplateListItem[] => {
  return templates.filter(template => 
    template.metadata?.difficulty === difficulty
  );
};

/**
 * Get template categories
 */
export const getTemplateCategories = (templates: AnvilTemplateListItem[]): string[] => {
  const categories = new Set<string>();
  templates.forEach(template => {
    if (template.category) {
      categories.add(template.category);
    }
  });
  return Array.from(categories).sort();
};

/**
 * Get template statistics
 */
export const getTemplateStats = (templates: AnvilTemplateListItem[]) => {
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.status === 'active').length,
    inactive: templates.filter(t => t.status === 'inactive').length,
    draft: templates.filter(t => t.status === 'draft').length,
    categories: getTemplateCategories(templates).length,
    averageFieldCount: 0,
    difficulty: {
      beginner: templates.filter(t => t.metadata?.difficulty === 'beginner').length,
      intermediate: templates.filter(t => t.metadata?.difficulty === 'intermediate').length,
      advanced: templates.filter(t => t.metadata?.difficulty === 'advanced').length
    }
  };

  // Calculate average field count
  const templatesWithFieldCount = templates.filter(t => t.fieldCount !== undefined);
  if (templatesWithFieldCount.length > 0) {
    const totalFields = templatesWithFieldCount.reduce((sum, t) => sum + (t.fieldCount || 0), 0);
    stats.averageFieldCount = Math.round(totalFields / templatesWithFieldCount.length);
  }

  return stats;
};

/**
 * Find template by ID
 */
export const findTemplateById = (
  templates: AnvilTemplateListItem[], 
  templateId: string
): AnvilTemplateListItem | undefined => {
  return templates.find(template => template.templateId === templateId);
};

/**
 * Get recent templates (created/updated in last 30 days)
 */
export const getRecentTemplates = (templates: AnvilTemplateListItem[]): AnvilTemplateListItem[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return templates.filter(template => {
    const createdAt = new Date(template.createdAt || 0);
    const updatedAt = new Date(template.updatedAt || 0);
    return createdAt >= thirtyDaysAgo || updatedAt >= thirtyDaysAgo;
  });
};

// Template Payload Utility Functions

/**
 * Extract field names from template payload
 */
export const getFieldNamesFromPayload = (payload: AnvilTemplatePayload): string[] => {
  return payload.fields.map(field => field.fieldName);
};

/**
 * Extract required fields from template payload
 */
export const getRequiredFieldsFromPayload = (payload: AnvilTemplatePayload): AnvilField[] => {
  return payload.fields.filter(field => field.required);
};

/**
 * Get field by name from template payload
 */
export const getFieldByName = (payload: AnvilTemplatePayload, fieldName: string): AnvilField | undefined => {
  return payload.fields.find(field => field.fieldName === fieldName);
};

/**
 * Get fields by type from template payload
 */
export const getFieldsByType = (payload: AnvilTemplatePayload, fieldType: string): AnvilField[] => {
  return payload.fields.filter(field => field.fieldType === fieldType);
};

/**
 * Validate form data against template payload
 */
export const validateFormDataAgainstPayload = (
  formData: Record<string, any>, 
  payload: AnvilTemplatePayload
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required fields
  const requiredFields = getRequiredFieldsFromPayload(payload);
  requiredFields.forEach(field => {
    const value = formData[field.fieldName];
    if (value === undefined || value === null || value === '') {
      errors.push(`Field '${field.fieldName}' is required`);
    }
  });
  
  // Check field validation rules
  payload.fields.forEach(field => {
    const value = formData[field.fieldName];
    if (value !== undefined && value !== null && value !== '' && field.validation) {
      const validation = field.validation;
      
      if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
        errors.push(`Field '${field.fieldName}' must be at least ${validation.min}`);
      }
      
      if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
        errors.push(`Field '${field.fieldName}' must be at most ${validation.max}`);
      }
      
      if (validation.pattern && typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
        errors.push(`Field '${field.fieldName}' format is invalid`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate form schema from template payload
 */
export const generateFormSchemaFromPayload = (payload: AnvilTemplatePayload): any => {
  const schema: any = {
    type: 'object',
    properties: {},
    required: []
  };
  
  payload.fields.forEach(field => {
    const fieldSchema: any = {
      type: field.fieldType || 'string'
    };
    
    if (field.placeholder) {
      fieldSchema.placeholder = field.placeholder;
    }
    
    if (field.validation) {
      if (field.validation.min !== undefined) {
        fieldSchema.minimum = field.validation.min;
      }
      if (field.validation.max !== undefined) {
        fieldSchema.maximum = field.validation.max;
      }
      if (field.validation.pattern) {
        fieldSchema.pattern = field.validation.pattern;
      }
    }
    
    if (field.options && field.options.length > 0) {
      fieldSchema.enum = field.options;
    }
    
    if (field.defaultValue !== undefined) {
      fieldSchema.default = field.defaultValue;
    }
    
    schema.properties[field.fieldName] = fieldSchema;
    
    if (field.required) {
      schema.required.push(field.fieldName);
    }
  });
  
  return schema;
};

/**
 * Get template dependencies
 */
export const getTemplateDependencies = (payload: AnvilTemplatePayload): string[] => {
  return payload.payload.dependencies || [];
};

/**
 * Get template requirements
 */
export const getTemplateRequirements = (payload: AnvilTemplatePayload): string[] => {
  return payload.payload.requirements || [];
};

/**
 * Check if user has permission for template action
 */
export const hasTemplatePermission = (
  payload: AnvilTemplatePayload, 
  action: 'edit' | 'delete' | 'share' | 'download' | 'preview'
): boolean => {
  if (!payload.permissions) return false;
  
  switch (action) {
    case 'edit':
      return payload.permissions.canEdit;
    case 'delete':
      return payload.permissions.canDelete;
    case 'share':
      return payload.permissions.canShare;
    case 'download':
      return payload.permissions.canDownload;
    case 'preview':
      return payload.permissions.canPreview;
    default:
      return false;
  }
};

/**
 * Get template usage statistics
 */
export const getTemplateUsageStats = (payload: AnvilTemplatePayload) => {
  return payload.usage || {
    totalUses: 0,
    lastUsed: undefined,
    averageCompletionTime: undefined,
    successRate: undefined
  };
};

/**
 * Check if template is active
 */
export const isTemplateActive = (payload: AnvilTemplatePayload): boolean => {
  return payload.status === 'active';
};

/**
 * Get template metadata
 */
export const getTemplateMetadata = (payload: AnvilTemplatePayload) => {
  return payload.metadata || {};
};

/**
 * Get template field count
 */
export const getTemplateFieldCount = (payload: AnvilTemplatePayload): number => {
  return payload.fields.length;
};

/**
 * Get template difficulty level
 */
export const getTemplateDifficulty = (payload: AnvilTemplatePayload): string | undefined => {
  return payload.metadata?.difficulty;
};

/**
 * Get template tags
 */
export const getTemplateTags = (payload: AnvilTemplatePayload): string[] => {
  return payload.metadata?.tags || [];
};

/**
 * Check if template has specific tag
 */
export const hasTemplateTag = (payload: AnvilTemplatePayload, tag: string): boolean => {
  return payload.metadata?.tags?.includes(tag) || false;
};
