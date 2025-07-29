import axios from 'axios';
import api from '../utils/api';
import { FORM_AUTO_FILL_END_POINTS } from '../utils/constants';

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
export const renderFormFields = async (templateId: string): Promise<ApiResponse<RenderFieldsResponse>> => {
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
): Promise<ApiResponse<MappedParameter[]>> => {
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
): Promise<ApiResponse<Blob>> => {
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
): Promise<ApiResponse<Blob>> => {
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
export const getDisplayNames = async (templateId: string): Promise<ApiResponse<DisplayNamesResponse>> => {
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

// Utility functions for common operations

// Helper function to create a PDF blob URL
export const createPdfBlobUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

// Helper function to download a PDF file
export const downloadPdfFile = (blob: Blob, filename: string): void => {
  const url = createPdfBlobUrl(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to download a ZIP file
export const downloadZipFile = (blob: Blob, filename: string = 'immigration-simplified-documents.zip'): void => {
  const url = createPdfBlobUrl(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

// Helper function to get field type from display name
export const getFieldTypeFromDisplayName = async (
  templateId: string, 
  displayName: string
): Promise<string | null> => {
  try {
    const response = await getDisplayNames(templateId);
    const displayNames = response.data.displayNames;
    return displayNames[displayName] || null;
  } catch (error) {
    console.error('Error getting field type:', error);
    return null;
  }
};

// Helper function to check if a template has required fields
export const getRequiredFields = async (templateId: string): Promise<string[]> => {
  try {
    const response = await renderFormFields(templateId);
    const requiredFields = response.data.fields
      .filter(field => field.required)
      .map(field => field.parameter_name);
    return requiredFields;
  } catch (error) {
    console.error('Error getting required fields:', error);
    return [];
  }
};

// Helper function to get all available fields for a template
export const getAvailableFields = async (templateId: string): Promise<FormField[]> => {
  try {
    const response = await renderFormFields(templateId);
    return response.data.fields;
  } catch (error) {
    console.error('Error getting available fields:', error);
    return [];
  }
};

// Helper function to create a complete form submission
export const submitCompleteForm = async (
  templateId: string,
  formData: RenderFormDataRequest,
  options?: {
    download?: boolean;
    filename?: string;
  }
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }
    
    // Prepare form data
    const preparedData = prepareFormData(formData);
    
    // Render form with data
    const response = await renderFormWithData(templateId, preparedData);
    
    // Download if requested
    if (options?.download) {
      const filename = options.filename || `${templateId}.pdf`;
      downloadPdfFile(response.data, filename);
    }
    
    return {
      success: true,
      blob: response.data
    };
  } catch (error) {
    console.error('Error submitting complete form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to batch download multiple forms
export const batchDownloadForms = async (
  templateIds: string[],
  fieldParameters: { [key: string]: any },
  options?: {
    filename?: string;
  }
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    const downloadData: DownloadMultipleRequest = {
      template_ids: templateIds,
      field_parameters: fieldParameters
    };
    
    const response = await downloadMultipleForms(downloadData);
    
    // Download if requested
    const filename = options?.filename || 'immigration-simplified-documents.zip';
    downloadZipFile(response.data, filename);
    
    return {
      success: true,
      blob: response.data
    };
  } catch (error) {
    console.error('Error batch downloading forms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};