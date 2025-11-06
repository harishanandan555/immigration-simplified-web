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

export interface SaveEditedPdfRequest {
  formNumber: string;
  clientId: string;
  caseId?: string;
  workflowId?: string;
  templateId: string;
  pdfId: string;
  pdfData: string; // Base64-encoded PDF data
  metadata: {
    filename: string;
    fileSize: number;
    contentType: string;
    editedAt: string;
    editSource: 'nutrient-sdk';
  };
}

export interface SaveEditedPdfResponse {
  success: boolean;
  message: string;
  data?: {
    pdfId: string;
    formName: string;
    clientId: string;
    caseId?: string;
    workflowId?: string;
    originalTemplateId?: string;
    downloadUrl: string;
    metadata: {
      filename: string;
      fileSize: number;
      contentType: string;
      createdAt: string;
      editedAt: string;
      editSource: string;
    };
  };
}

export interface ValidatePdfDataRequest {
  pdfId?: string;
  templateId?: string;
  clientId?: string;
  formNumber?: string;
}

export interface ValidatePdfDataResponse {
  success: boolean;
  message: string;
  data?: {
    pdfId: string;
    templateId?: string;
    clientId?: string;
    formNumber?: string;
    filledPercentage: number;
  };
}

export interface GetPdfPreviewRequest {
  pdfId?: string;
  templateId?: string;
  clientId?: string;
  formNumber?: string;
}

export interface GetPdfPreviewResponse {
  success: boolean;
  message: string;
  data?: {
    pdfId: string;
    templateId?: string;
    clientId?: string;
    formNumber?: string;
    pdfData: string; // Base64-encoded PDF data
    metadata: {
      filename: string;
      fileSize: number;
      contentType: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface FilledPdfItem {
  _id: string;
  adminId: string;
  clientId: string;
  caseId: string;
  formNumber: string;
  templateId: string;
  pdfData: string; // Base64-encoded PDF data
  contentType: string;
  fileSize: number;
  filename: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetFilledPdfsByClientAndCaseResponse {
  success: boolean;
  message: string;
  data: {
    clientId: string;
    caseId: string;
    filledPdfs: FilledPdfItem[];
    totalCount: number;
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
): Promise<ApiResponse<{ blob: Blob; metadata: any; filledPercentage: number; unfilledFields: Record<string, any>; pdfId: string }>> => {
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
          unfilledFields: response.data.data.unfilledFields,
          pdfId: response.data.data.pdfId
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
 * Convert base64-encoded PDF data to Blob
 */
export const base64ToBlob = (base64Data: string, contentType: string = 'application/pdf'): Blob => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
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
 * Save edited PDF to database (with existing pdfId)
 */
export const saveEditedPdf = async (
  pdfBlob: Blob,
  formNumber: string,
  clientId: string,
  templateId: string,
  pdfId: string,
  options?: {
    caseId?: string;
    workflowId?: string;
    filename?: string;
  }
): Promise<ApiResponse<SaveEditedPdfResponse>> => {
  try {
    
    // Convert blob to base64
    // const arrayBuffer = await pdfBlob.arrayBuffer();
    // const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    //  Convert blob to base64 using FileReader for large files
     const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (data:application/pdf;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(pdfBlob);
    });
    
    const requestData: SaveEditedPdfRequest = {
      formNumber,
      clientId,
      caseId: options?.caseId,
      workflowId: options?.workflowId,
      templateId,
      pdfId,
      pdfData: base64String,
      metadata: {
        filename: options?.filename || `${formNumber}_edited_${Date.now()}.pdf`,
        fileSize: pdfBlob.size,
        contentType: 'application/pdf',
        editedAt: new Date().toISOString(),
        editSource: 'nutrient-sdk'
      }
    };

    const response = await api.post(
      ANVIL_END_POINTS.SAVE_EDITED_PDF,
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
 * Validate PDF data using OpenAI analysis
 */
export const validatePdfData = async (
  requestData: ValidatePdfDataRequest
): Promise<ApiResponse<ValidatePdfDataResponse>> => {
  try {
    // Validate that at least one identifier is provided
    if (!requestData.pdfId && !requestData.templateId && !requestData.clientId && !requestData.formNumber) {
      throw new Error('At least one identifier is required: pdfId, templateId, clientId, or formNumber');
    }

    const response = await api.post(
      ANVIL_END_POINTS.VALIDATE_PDF_DATA,
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
 * Get PDF preview data using any combination of identifiers
 */
export const getPdfPreview = async (
  params: GetPdfPreviewRequest
): Promise<ApiResponse<GetPdfPreviewResponse>> => {
  try {
    // Validate that at least one identifier is provided
    if (!params.pdfId && !params.templateId && !params.clientId && !params.formNumber) {
      throw new Error('At least one identifier is required: pdfId, templateId, clientId, or formNumber');
    }

    const response = await api.get(
      ANVIL_END_POINTS.PDF_PREVIEW,
      { params }
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
 * Get PDF preview as blob for browser display
 */
export const getPdfPreviewBlob = async (
  params: GetPdfPreviewRequest
): Promise<ApiResponse<{ blob: Blob; metadata: any; pdfId: string }>> => {
  try {
    const response = await getPdfPreview(params);
    
    if (response.data.success && response.data.data?.pdfData) {
      // Convert base64 to blob
      const pdfBlob = new Blob([
        Uint8Array.from(atob(response.data.data.pdfData), c => c.charCodeAt(0))
      ], { type: 'application/pdf' });
      
      return {
        data: {
          blob: pdfBlob,
          metadata: response.data.data.metadata,
          pdfId: response.data.data.pdfId
        },
        status: response.status,
        statusText: response.statusText
      };
    } else {
      throw new Error(response.data.message || 'Failed to get PDF preview');
    }
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get filled PDFs by client ID and case ID
 */
export const getFilledPdfsByClientAndCase = async (
  clientId: string,
  caseId: string
): Promise<ApiResponse<GetFilledPdfsByClientAndCaseResponse>> => {
  try {
    // Validate required parameters
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    if (!caseId) {
      throw new Error('Case ID is required');
    }

    const endpoint = ANVIL_END_POINTS.GET_FILLED_PDFS_BY_CLIENT_AND_CASE
      .replace(':clientId', clientId)
      .replace(':caseId', caseId);

    const response = await api.get(endpoint);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};