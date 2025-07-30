import axios from 'axios';
import api from '../utils/api';
import { FORM_AUTO_FILL_END_POINTS, FILLED_FORM_SUBMISSION_END_POINTS } from '../utils/constants';

// Define common response type
interface ApiResponseData<T> {
  data: T;
  status: number;
  statusText: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// TypeScript interfaces for filled form submissions
export interface FilledFormSubmission {
  _id: string;
  submissionId: string;
  templateId: string;
  formData: Record<string, any>;
  pdfMetadata: {
    fileName: string;
    fileSize: number;
    contentType: string;
    generatedAt: string;
  };
  submittedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  clientId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  caseId?: string;
  formCaseId?: string;
  status: 'draft' | 'submitted' | 'processed' | 'completed' | 'failed';
  metadata: Record<string, any>;
  processingInfo: {
    processingTime: number;
    success: boolean;
    errorMessage?: string;
  };
  notes?: string;
  submittedAt: string;
  processedAt?: string;
  completedAt?: string;
  pdfDownloadUrl?: string;
  ageInDays: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FilledFormSubmissionsResponse {
  submissions: FilledFormSubmission[];
  pagination: PaginationInfo;
}

export interface FilledFormSubmissionFilters {
  templateId?: string;
  status?: string;
  submittedBy?: string;
  clientId?: string;
  caseId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateFilledFormSubmissionRequest {
  templateId: string;
  formData: Record<string, any>;
  clientId?: string;
  caseId?: string;
  formCaseId?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateFilledFormSubmissionRequest {
  status?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface FilledFormSubmissionStats {
  total: number;
  byStatus: Record<string, number>;
  byTemplate: Record<string, number>;
  byMonth: Record<string, number>;
  averageProcessingTime: number;
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

// Form Field Interfaces
export interface FormField {
  field_id: number;
  field_name: string;
  field_type: string;
  parameter_name: string;
  display_name: string;
  section: string;
  required: boolean;
  data_type: string;
  max_length?: number;
  options?: string[] | null;
  default_value?: any;
}

export interface FormFieldSummary {
  totalFields: number;
  parameterNamesAvailable: number;
  parameterNamesMissing: number;
}

export interface RenderFieldsResponse {
  fields: FormField[];
  summary: FormFieldSummary;
  stored: boolean;
}

export interface MappedParameter {
  field_id: number;
  field_name: string;
  parameter_name: string;
  display_name: string;
  section: string;
  required: boolean;
  data_type: string;
  max_length?: number;
  options?: string[] | null;
  default_value?: any;
}

export interface UpdateFieldsRequest {
  pdf_template_description: string;
  mapped_parameters: MappedParameter[];
}

export interface RenderFormDataRequest {
  [key: string]: any; // Dynamic field parameters
}

export interface DownloadMultipleRequest {
  template_ids: string[];
  field_parameters: {
    [key: string]: any; // Dynamic field parameters
  };
}

export interface DisplayNamesResponse {
  success: boolean;
  templateId: string;
  displayNames: {
    [key: string]: string; // display_name: field_type
  };
  totalFields: number;
}



// 1. Render PDF Form Fields
export const renderFormFields = async (templateId: string): Promise<ApiResponseData<RenderFieldsResponse>> => {
  try {
    const response = await api.post(
      FORM_AUTO_FILL_END_POINTS.RENDER_FIELDS.replace(':templateId', templateId)
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error rendering form fields:', error);
    throw handleApiError(error);
  }
};

// 2. Update PDF Form Fields
export const updateFormFields = async (
  pdfTemplateName: string, 
  updateData: UpdateFieldsRequest
): Promise<ApiResponseData<MappedParameter[]>> => {
  try {
    const response = await api.post(
      FORM_AUTO_FILL_END_POINTS.UPDATE_FIELDS.replace(':pdfTemplateName', pdfTemplateName),
      updateData
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating form fields:', error);
    throw handleApiError(error);
  }
};

// 3. Render PDF Form with Data
export const renderFormWithData = async (
  templateId: string, 
  formData: RenderFormDataRequest
): Promise<ApiResponseData<Blob>> => {
  try {
    const response = await api.post(
      FORM_AUTO_FILL_END_POINTS.RENDER_FORM_WITH_DATA.replace(':templateId', templateId),
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
    console.error('Error rendering form with data:', error);
    throw handleApiError(error);
  }
};

// 4. Download Multiple PDF Forms
export const downloadMultipleForms = async (
  downloadData: DownloadMultipleRequest
): Promise<ApiResponseData<Blob>> => {
  try {
    const response = await api.post(
      FORM_AUTO_FILL_END_POINTS.DOWNLOAD_MULTIPLE,
      downloadData,
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
    console.error('Error downloading multiple forms:', error);
    throw handleApiError(error);
  }
};

// 5. Get Display Names by Template ID
export const getDisplayNames = async (templateId: string): Promise<ApiResponseData<DisplayNamesResponse>> => {
  try {
    const response = await api.get(
      FORM_AUTO_FILL_END_POINTS.GET_DISPLAY_NAMES.replace(':templateId', templateId)
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error getting display names:', error);
    throw handleApiError(error);
  }
};

/**
 * Get filled form submissions with optional filtering
 */
export const getFilledFormSubmissions = async (
  filters: FilledFormSubmissionFilters = {}
): Promise<FilledFormSubmissionsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${FILLED_FORM_SUBMISSION_END_POINTS.GET_SUBMISSIONS}?${queryParams.toString()}`;
    const response = await api.get(url);
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching filled form submissions:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
  }
};

/**
 * Get a specific filled form submission by ID
 */
export const getFilledFormSubmissionById = async (
  submissionId: string
): Promise<FilledFormSubmission> => {
  try {
    const url = FILLED_FORM_SUBMISSION_END_POINTS.GET_SUBMISSION_BY_ID.replace(':id', submissionId);
    const response = await api.get(url);
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching filled form submission:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch submission');
  }
};

/**
 * Download filled form PDF
 */
export const downloadFilledFormPDF = async (
  submissionId: string
): Promise<Blob> => {
  try {
    const url = FILLED_FORM_SUBMISSION_END_POINTS.DOWNLOAD_SUBMISSION_PDF.replace(':id', submissionId);
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error downloading filled form PDF:', error);
    throw new Error(error.response?.data?.message || 'Failed to download PDF');
  }
};

/**
 * Create a new filled form submission
 */
export const createFilledFormSubmission = async (
  submissionData: CreateFilledFormSubmissionRequest
): Promise<FilledFormSubmission> => {
  try {
    const response = await api.post(FILLED_FORM_SUBMISSION_END_POINTS.CREATE_SUBMISSION, submissionData);
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating filled form submission:', error);
    throw new Error(error.response?.data?.message || 'Failed to create submission');
  }
};

/**
 * Update a filled form submission
 */
export const updateFilledFormSubmission = async (
  submissionId: string,
  updateData: UpdateFilledFormSubmissionRequest
): Promise<FilledFormSubmission> => {
  try {
    const url = FILLED_FORM_SUBMISSION_END_POINTS.UPDATE_SUBMISSION.replace(':id', submissionId);
    const response = await api.put(url, updateData);
    
    return response.data;
  } catch (error: any) {
    console.error('Error updating filled form submission:', error);
    throw new Error(error.response?.data?.message || 'Failed to update submission');
  }
};

/**
 * Delete a filled form submission (admin only)
 */
export const deleteFilledFormSubmission = async (
  submissionId: string
): Promise<{ message: string }> => {
  try {
    const url = FILLED_FORM_SUBMISSION_END_POINTS.DELETE_SUBMISSION.replace(':id', submissionId);
    const response = await api.delete(url);
    
    return response.data;
  } catch (error: any) {
    console.error('Error deleting filled form submission:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete submission');
  }
};

/**
 * Get filled form submission statistics
 */
export const getFilledFormSubmissionStats = async (): Promise<FilledFormSubmissionStats> => {
  try {
    const response = await api.get(FILLED_FORM_SUBMISSION_END_POINTS.GET_SUBMISSION_STATS);
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching filled form submission stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
  }
};

/**
 * Bulk download filled form submissions
 */
export const bulkDownloadFilledFormSubmissions = async (
  submissionIds: string[]
): Promise<Blob> => {
  try {
    const response = await api.post(
      FILLED_FORM_SUBMISSION_END_POINTS.BULK_DOWNLOAD_SUBMISSIONS,
      { submissionIds },
      { responseType: 'blob' }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Error bulk downloading filled form submissions:', error);
    throw new Error(error.response?.data?.message || 'Failed to bulk download submissions');
  }
};

/**
 * Bulk delete filled form submissions (admin only)
 */
export const bulkDeleteFilledFormSubmissions = async (
  submissionIds: string[]
): Promise<{ message: string; deletedCount: number }> => {
  try {
    const response = await api.post(FILLED_FORM_SUBMISSION_END_POINTS.BULK_DELETE_SUBMISSIONS, {
      submissionIds
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error bulk deleting filled form submissions:', error);
    throw new Error(error.response?.data?.message || 'Failed to bulk delete submissions');
  }
};

/**
 * Helper function to download PDF file
 */
export const downloadPdfFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
};

/**
 * Helper function to create PDF blob URL for preview
 */
export const createPdfBlobUrl = (blob: Blob): string => {
  return window.URL.createObjectURL(blob);
};

/**
 * Helper function to revoke PDF blob URL
 */
export const revokePdfBlobUrl = (url: string): void => {
  window.URL.revokeObjectURL(url);
}; 

// Helper function to validate form data before submission
export const validateFormData = (formData: RenderFormDataRequest): { isValid: boolean; errors: string[] } => {
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

// Helper function to prepare form data for submission
export const prepareFormData = (rawData: any): RenderFormDataRequest => {
  const preparedData: RenderFormDataRequest = {};
  
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