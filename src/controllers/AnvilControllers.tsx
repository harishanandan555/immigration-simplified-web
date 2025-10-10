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
  data: Record<string, any>;
  options?: {
    title?: string;
    fontFamily?: string;
    fontSize?: number;
    textColor?: string;
    useInteractiveFields?: boolean;
  };
}

export interface AnvilFillResponse {
  success: boolean;
  message: string;
  data?: {
    templateId: string;
    formNumber: string;
    clientId: string;
    pdfId: string;
    filledPercentage: number;
    unfilledFields: Record<string, any>;
    validationRecordId: string;
    pdfData: string; // Base64-encoded PDF data
    metadata: {
      filename: string;
      fileSize: number;
      contentType: string;
      createdAt: string;
      validationDetails: {
        totalFields: number;
        filledFields: number;
        unfilledFieldsCount: number;
        openaiValidationUsed: boolean;
      };
    };
  };
}

export interface AnvilTemplateListItem {
  templateId: string;
  formNumber: string;
  isActive: boolean;
  description: string;
  isFieldsValidated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnvilTemplatesListResponse {
  success: boolean;
  message: string;
  data: {
    templates: AnvilTemplateListItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      formNumber: string | null;
      isActive: string;
    };
  };
}

export interface AnvilTemplatesByFormResponse {
  success: boolean;
  message: string;
  data: {
    formNumber: string;
    templates: AnvilTemplateListItem[];
  };
}

export interface AnvilTemplatesListParams {
  formNumber?: string;
  isActive?: string;
  page?: number;
  limit?: number;
  sortBy?: 'formNumber' | 'templateId' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AnvilTemplatePayload {
  success: boolean;
  message: string;
  data: {
    templateId: string;
    formNumber: string;
    payload: {
      title: string;
      fontSize: number;
      textColor: string;
      data: Record<string, any>;
    };
    fieldTypes: Record<string, any>;
    isFieldsValidated: boolean;
    metadata: {
      description: string;
      category: string;
      version: string;
      isActive: boolean;
      lastUpdated: string;
    };
    usageStats: {
      timesUsed: number;
      lastUsed: string;
      successRate: number;
    };
    createdAt: string;
    updatedAt: string;
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
 * Get templates by form number
 */
export const getTemplateIdsByFormNumber = async (
  formNumber: string
): Promise<ApiResponse<AnvilTemplatesByFormResponse>> => {
  try {
    const response = await api.get(
      ANVIL_END_POINTS.GET_TEMPLATES_BY_FORM.replace(':formNumber', formNumber)
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
  data: Record<string, any>,
  options?: {
    title?: string;
    fontFamily?: string;
    fontSize?: number;
    textColor?: string;
    useInteractiveFields?: boolean;
  }
): Promise<ApiResponse<AnvilFillResponse>> => {
  try {
    const requestData: AnvilFillRequest = {
      data,
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
  data: Record<string, any>,
  options?: {
    title?: string;
    fontFamily?: string;
    fontSize?: number;
    textColor?: string;
    useInteractiveFields?: boolean;
  }
): Promise<ApiResponse<{ blob: Blob; metadata: any; filledPercentage: number; unfilledFields: Record<string, any> }>> => {
  try {
    const requestData: AnvilFillRequest = {
      data,
      options
    };

    const response = await api.post(
      ANVIL_END_POINTS.FILL_PDF_TEMPLATE.replace(':templateId', templateId),
      requestData
    );
    
    if (response.data.success && response.data.data?.pdfData) {
      // Convert base64 to blob
      const pdfBlob = new Blob([
        Uint8Array.from(atob(response.data.data.pdfData), c => c.charCodeAt(0))
      ], { type: 'application/pdf' });
      
      return {
        data: {
          blob: pdfBlob,
          metadata: response.data.data.metadata,
          filledPercentage: response.data.data.filledPercentage,
          unfilledFields: response.data.data.unfilledFields
        },
        status: response.status,
        statusText: response.statusText
      };
    } else {
      throw new Error(response.data.message || 'Failed to fill PDF template');
    }
  } catch (error) {
    return handleApiError(error);
  }
};

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