import api from '../utils/api';
import { PDF_TEMPLATE_END_POINTS, PDF_FIELD_TYPES, PDF_TEMPLATE_STATUS, PDF_TEMPLATE_CATEGORIES, COMMON_IMMIGRATION_FORMS } from '../utils/constants';
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

// PDF Template Interfaces
export interface PdfField {
  field_id: number;
  field_name: string;
  parameter_name: string;
  default_value?: string;
  coordinates?: {
    x: number;
    y: number;
  };
  size?: number;
  color?: string;
  type?: keyof typeof PDF_FIELD_TYPES;
  required?: boolean;
  validation_rules?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  options?: string[];
  placeholder?: string;
  help_text?: string;
}

export interface PdfTemplate {
  _id?: string;
  template_id: string;
  name: string;
  description: string;
  category: keyof typeof PDF_TEMPLATE_CATEGORIES;
  status: keyof typeof PDF_TEMPLATE_STATUS;
  version: string;
  effective_date: string;
  expiration_date?: string;
  is_active: boolean;
  fields: PdfField[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    uscis_form_number?: string;
    uscis_form_link?: string;
    estimated_processing_time?: string;
    fee?: number;
    instructions?: string;
    page_count?: number;
    file_size?: number;
  };
}

export interface PdfTemplateData {
  templates: PdfTemplate[];
  total_templates: number;
  active_templates: number;
}

export interface GetPdfTemplatesParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
}

export interface RenderPdfRequest {
  [key: string]: any; // Dynamic field parameters
}

export interface DownloadMultiplePdfRequest {
  template_ids: string[];
  field_parameters: {
    [key: string]: any;
  };
}

export interface UpdateFieldsRequest {
  pdf_template_description: string;
  mapped_parameters: PdfField[];
}

// PDF Template Controllers

/**
 * Get PDF form fields and parameters for a specific template
 */
export const getPdfFields = async (templateId: string): Promise<ApiResponse<PdfField[]>> => {
  try {
    const response = await api.post(PDF_TEMPLATE_END_POINTS.GET_FIELDS.replace(':templateId', templateId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update PDF form fields configuration
 */
export const updatePdfFields = async (
  pdfTemplateName: string, 
  fieldConfig: UpdateFieldsRequest
): Promise<ApiResponse<PdfField[]>> => {
  try {
    const response = await api.post(
      PDF_TEMPLATE_END_POINTS.UPDATE_FIELDS.replace(':pdfTemplateName', pdfTemplateName),
      fieldConfig
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Render PDF form with provided data
 */
export const renderPdf = async (
  templateId: string, 
  formData: RenderPdfRequest
): Promise<ApiResponse<Blob>> => {
  try {
    const response = await api.post(
      PDF_TEMPLATE_END_POINTS.RENDER_PDF.replace(':templateId', templateId),
      formData,
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
 * Download multiple PDF forms as ZIP
 */
export const downloadMultiplePdfs = async (
  request: DownloadMultiplePdfRequest
): Promise<ApiResponse<Blob>> => {
  try {
    const response = await api.post(
      PDF_TEMPLATE_END_POINTS.DOWNLOAD_MULTIPLE,
      request,
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
 * Get all PDF templates
 */
export const getPdfTemplates = async (
  params?: GetPdfTemplatesParams
): Promise<ApiResponse<PdfTemplateData>> => {
  try {
    const response = await api.get(PDF_TEMPLATE_END_POINTS.GET_ALL_TEMPLATES, { params });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get PDF template by ID
 */
export const getPdfTemplateById = async (templateId: string): Promise<ApiResponse<PdfTemplate>> => {
  try {
    const response = await api.get(PDF_TEMPLATE_END_POINTS.GET_TEMPLATE_BY_ID.replace(':templateId', templateId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create new PDF template
 */
export const createPdfTemplate = async (templateData: Partial<PdfTemplate>): Promise<ApiResponse<PdfTemplate>> => {
  try {
    const response = await api.post(PDF_TEMPLATE_END_POINTS.CREATE_TEMPLATE, templateData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update PDF template
 */
export const updatePdfTemplate = async (
  templateId: string, 
  templateData: Partial<PdfTemplate>
): Promise<ApiResponse<PdfTemplate>> => {
  try {
    const response = await api.put(
      PDF_TEMPLATE_END_POINTS.UPDATE_TEMPLATE.replace(':templateId', templateId),
      templateData
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete PDF template
 */
export const deletePdfTemplate = async (templateId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(PDF_TEMPLATE_END_POINTS.DELETE_TEMPLATE.replace(':templateId', templateId));
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
 * Validate PDF template
 */
export const validatePdfTemplate = async (templateId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(PDF_TEMPLATE_END_POINTS.VALIDATE_TEMPLATE.replace(':templateId', templateId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Preview PDF template
 */
export const previewPdfTemplate = async (templateId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get(PDF_TEMPLATE_END_POINTS.PREVIEW_TEMPLATE.replace(':templateId', templateId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Export PDF template
 */
export const exportPdfTemplate = async (templateId: string): Promise<ApiResponse<Blob>> => {
  try {
    const response = await api.get(
      PDF_TEMPLATE_END_POINTS.EXPORT_TEMPLATE.replace(':templateId', templateId),
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
 * Import PDF template
 */
export const importPdfTemplate = async (file: File): Promise<ApiResponse<PdfTemplate>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(PDF_TEMPLATE_END_POINTS.IMPORT_TEMPLATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get template versions
 */
export const getTemplateVersions = async (templateId: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await api.get(PDF_TEMPLATE_END_POINTS.GET_TEMPLATE_VERSIONS.replace(':templateId', templateId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Restore template version
 */
export const restoreTemplateVersion = async (templateId: string, versionId: string): Promise<ApiResponse<PdfTemplate>> => {
  try {
    const response = await api.post(
      PDF_TEMPLATE_END_POINTS.RESTORE_TEMPLATE_VERSION
        .replace(':templateId', templateId)
        .replace(':versionId', versionId)
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Share template
 */
export const shareTemplate = async (templateId: string, shareData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(
      PDF_TEMPLATE_END_POINTS.SHARE_TEMPLATE.replace(':templateId', templateId),
      shareData
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Unshare template
 */
export const unshareTemplate = async (templateId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(PDF_TEMPLATE_END_POINTS.UNSHARE_TEMPLATE.replace(':templateId', templateId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get template permissions
 */
export const getTemplatePermissions = async (templateId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get(PDF_TEMPLATE_END_POINTS.GET_TEMPLATE_PERMISSIONS.replace(':templateId', templateId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update template permissions
 */
export const updateTemplatePermissions = async (templateId: string, permissions: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(
      PDF_TEMPLATE_END_POINTS.UPDATE_TEMPLATE_PERMISSIONS.replace(':templateId', templateId),
      permissions
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Utility functions for common operations

/**
 * Download rendered PDF file
 */
export const downloadPdfFile = (blob: Blob, filename: string): void => {
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
 * Download multiple PDFs as ZIP
 */
export const downloadMultiplePdfFiles = (blob: Blob, filename: string = 'immigration-simplified-documents.zip'): void => {
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
 * Handle API errors with user-friendly messages
 */
export const handlePdfApiError = (error: any): string => {
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
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.response?.data?.message || 'An unexpected error occurred.';
    }
  }
  return 'An unexpected error occurred.';
};

/**
 * Get common immigration form templates
 */
export const getCommonImmigrationForms = (): string[] => {
  return Object.values(COMMON_IMMIGRATION_FORMS);
};

/**
 * Check if template ID is a common immigration form
 */
export const isCommonImmigrationForm = (templateId: string): boolean => {
  return Object.values(COMMON_IMMIGRATION_FORMS).includes(templateId as any);
};

/**
 * Format field parameter name for nested objects
 */
export const formatParameterName = (fieldName: string, nestedPath?: string): string => {
  if (nestedPath) {
    return `${nestedPath}.${fieldName}`;
  }
  return fieldName;
};

/**
 * Extract nested field value from form data
 */
export const extractNestedFieldValue = (formData: any, parameterName: string): any => {
  const parts = parameterName.split('.');
  let value = formData;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}; 