import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { 
  ImmigrationProcess, 
  ProcessStep, 
  ProcessDocument,
  ImmigrationCategory,
  ValidationResult
} from '../../types/immigration';
import { APPCONSTANTS, IMMIGRATION_END_POINTS, FOIA_CASE_END_POINTS } from '../../utils/constants';

// Types
export interface ImmigrationDocument {
  documentId: string;
  type: string;
  category: string;
  description: string;
  metadata: Record<string, any>;
}

export interface ReviewData {
  confirmed: boolean;
  notes: string;
  specialInstructions: string;
}

export interface ImmigrationProcessFlow {
  category: ImmigrationCategory;
  documents: ImmigrationDocument[];
  formData: Record<string, any>;
  review: ReviewData;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'size' | 'date' | 'custom';
  value?: any;
  message: string;
}

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  status: number;
}

interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Extend AxiosRequestConfig to include retry properties
interface RetryConfig extends InternalAxiosRequestConfig {
  retry?: boolean;
  retryCount?: number;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: APPCONSTANTS.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add retry interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;
    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    const retryCount = config.retryCount ?? 0;

    if (retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config.retryCount = retryCount + 1;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config.retryCount));
    return api(config);
  }
);

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    console.error('API Response Error:', error.response?.status, error.config?.url);
    
    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized error
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          // Handle forbidden error
          console.error('Access forbidden');
          break;
        case 404:
          // Handle not found error
          console.error('Resource not found');
          break;
        case 500:
          // Handle server error
          console.error('Server error');
          break;
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data;
  }
  console.error('API request failed:', response.data);
  throw new Error(response.data.message || 'API request failed');
};

interface ClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  immigrationStatus: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

interface ClientResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  immigrationStatus: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Add Client interface for use in getClients and related functions
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  immigrationStatus: string;
  createdAt: string;
}

export const immigrationApi = {
  // Form Type Selection
  getFormTypes: async () => {
    try {
      const response = await api.get<ApiResponse<ImmigrationCategory[]>>(
        IMMIGRATION_END_POINTS.GET_FORMS,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching form types:', error);
      throw error;
    }
  },

  selectFormType: async (typeId: string) => {
    try {
      const response = await api.post<ApiResponse<void>>(
        IMMIGRATION_END_POINTS.SELECT_FORM_TYPE.replace(':typeId', typeId),
        {},
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error selecting form type:', error);
      throw error;
    }
  },

  // Subcategory Selection
  getSubcategories: async (typeId: string) => {
    try {
      const response = await api.get<ApiResponse<string[]>>(
        IMMIGRATION_END_POINTS.GET_SUBCATEGORIES.replace(':typeId', typeId),
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  },

  selectSubcategory: async (subcategoryId: string) => {
    try {
      const response = await api.post<ApiResponse<void>>(
        IMMIGRATION_END_POINTS.SELECT_SUBCATEGORY.replace(':subcategoryId', subcategoryId),
        {},
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error selecting subcategory:', error);
      throw error;
    }
  },

  // Document Upload
  uploadDocument: async (processId: string, file: File, metadata: {
    documentType: string;
    category: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', metadata.documentType);
      formData.append('category', metadata.category);
      formData.append('description', file.name);

      const response = await api.post<ApiResponse<ProcessDocument>>(
        IMMIGRATION_END_POINTS.UPLOAD_DOCUMENT.replace(':processId', processId),
        formData,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  getProcessDocuments: async (processId: string) => {
    try {
      const response = await api.get<ApiResponse<ProcessDocument[]>>(
        IMMIGRATION_END_POINTS.GET_DOCUMENTS.replace(':processId', processId),
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching process documents:', error);
      throw error;
    }
  },

  validateDocument: async (processId: string, documentId: string) => {
    try {
      const response = await api.post<ApiResponse<ValidationResult>>(
        IMMIGRATION_END_POINTS.UPDATE_DOCUMENT
          .replace(':processId', processId)
          .replace(':documentId', documentId),
        {},
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error validating document:', error);
      throw error;
    }
  },

  // FOIA Case
  createFoiaCase: async (processId: string, data: any) => {
    try {
      const response = await api.post<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.CREATE_FOIA.replace(':processId', processId),
        data,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error creating FOIA case:', error);
      throw error;
    }
  },

  getFoiaStatus: async (processId: string) => {
    try {
      const response = await api.get<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.GET_FOIA_STATUS.replace(':processId', processId),
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching FOIA status:', error);
      throw error;
    }
  },

  // Client Creation
  createClient: async (clientData: ClientData): Promise<ClientResponse> => {
    try {
      const response = await api.post<ApiResponse<ClientResponse>>('/clients', clientData, { retry: true } as RetryConfig);
      return handleResponse(response);
    } catch (error) {
      console.error('Error creating client:', error);
      throw new Error('Failed to create client. Please try again.');
    }
  },

  updateClient: async (processId: string, data: any) => {
    try {
      const response = await api.put<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.UPDATE_PROCESS.replace(':id', processId),
        data,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // Form Auto-fill
  autofillForms: async (processId: string, data: any) => {
    try {
      const response = await api.post<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.AUTOFILL_FORMS.replace(':processId', processId),
        data,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error auto-filling forms:', error);
      throw error;
    }
  },

  getAutofillStatus: async (processId: string) => {
    try {
      const response = await api.get<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.GET_AUTOFILL_STATUS.replace(':processId', processId),
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error getting auto-fill status:', error);
      throw error;
    }
  },

  // Form Download
  generateForms: async (processId: string) => {
    try {
      const response = await api.post<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.GENERATE_FORMS.replace(':processId', processId),
        {},
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error generating forms:', error);
      throw error;
    }
  },

  downloadForms: async (processId: string) => {
    try {
      const response = await api.get<Blob>(
        IMMIGRATION_END_POINTS.DOWNLOAD_FORMS.replace(':processId', processId),
        {
          responseType: 'blob',
          retry: true
        } as RetryConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading forms:', error);
      throw error;
    }
  },

  // Process Management
  getProcess: async (processId: string) => {
    if (!processId) {
      throw new Error('Process ID is required');
    }
    try {
      console.log('Fetching process with ID:', processId);
      console.log('API Endpoint:', IMMIGRATION_END_POINTS.GET_PROCESS.replace(':processId', processId));
      console.log('Full URL:', `${APPCONSTANTS.API_BASE_URL}${IMMIGRATION_END_POINTS.GET_PROCESS.replace(':processId', processId)}`);
      console.log('Request Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      });

      const response = await api.get<ApiResponse<ImmigrationProcess>>(
        IMMIGRATION_END_POINTS.GET_PROCESS.replace(':processId', processId),
        { 
          retry: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        } as RetryConfig
      );

      console.log('Process response:', response.data);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Error fetching process:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });

      if (error.response?.status === 500) {
        console.error('Server error details:', error.response?.data);
        throw new Error('Server error occurred while fetching process. Please try again later.');
      }
      
      throw error;
    }
  },

  updateProcess: async (processId: string, data: Partial<ImmigrationProcess>) => {
    if (!processId) {
      throw new Error('Process ID is required');
    }
    try {
      const response = await api.put<ApiResponse<ImmigrationProcess>>(
        IMMIGRATION_END_POINTS.UPDATE_PROCESS.replace(':processId', processId),
        data,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error updating process:', error);
      throw error;
    }
  },

  updateProcessStep: async (processId: string, step: string) => {
    if (!processId) {
      throw new Error('Process ID is required');
    }
    try {
      const response = await api.put<ApiResponse<void>>(
        IMMIGRATION_END_POINTS.UPDATE_PROCESS_STEP.replace(':processId', processId),
        { step },
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error updating process step:', error);
      throw error;
    }
  },

  startProcess: async (data: {
    caseId: string;
    categoryId: string;
    subcategoryId: string;
    visaType: string;
    clientId: string;
    priorityDate: string;
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    currentStep: 'type' | 'documents' | 'form';
    assignedStaff?: string;
    caseNotes?: string;
    relatedCases?: string[];
    createdBy?: string;
  }) => {
    try {
      // Log the exact request data and endpoint
      console.log('Starting process with data:', JSON.stringify(data, null, 2));
      console.log('API Endpoint:', IMMIGRATION_END_POINTS.START_PROCESS);

      // Validate required fields
      if (!data.caseId || !data.categoryId || !data.subcategoryId || !data.clientId) {
        throw new Error('Missing required fields');
      }

      // Format the request data to match API expectations
      const requestData = {
        caseId: data.caseId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        visaType: data.visaType,
        clientId: data.clientId,
        priorityDate: new Date(data.priorityDate).toISOString().split('T')[0],
        deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : undefined,
        status: data.status,
        currentStep: data.currentStep,
        assignedStaff: data.assignedStaff,
        caseNotes: data.caseNotes,
        relatedCases: data.relatedCases,
        createdBy: data.createdBy,
        auditLog: [{
          id: `LOG-${Date.now()}`,
          action: 'create',
          userId: data.createdBy || 'system',
          userName: 'System',
          timestamp: new Date().toISOString(),
          details: {
            action: 'Process created',
            category: data.categoryId,
            subcategory: data.subcategoryId
          }
        }]
      };

      console.log('Formatted request data:', JSON.stringify(requestData, null, 2));

      const response = await api.post<ApiResponse<ImmigrationProcess>>(
        IMMIGRATION_END_POINTS.START_PROCESS,
        requestData,
        { 
          retry: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        } as RetryConfig
      );

      // Log the full response for debugging
      console.log('Full API Response:', JSON.stringify(response.data, null, 2));

      // Check if response has the expected structure
      if (!response.data || !response.data.data) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid response from server');
      }

      // Extract the process ID from the response
      const processData = response.data.data;
      
      // Log all available properties
      console.log('Response properties:', Object.keys(processData));
      
      // Try different possible field names for the process ID
      const processId = processData._id || processData.id || processData.processId;
      
      if (!processId) {
        console.error('No ID found in response:', processData);
        throw new Error('Failed to start process: No process ID in response');
      }

      // Add the process ID to the response data
      return {
        ...processData,
        id: processId
      };
    } catch (error: any) {
      // Log detailed error information
      if (error.response?.data?.error?.details) {
        console.error('Validation Error Details:', error.response.data.error.details);
      }
      
      console.error('Error starting process:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });

      // Throw a more descriptive error
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        const errorMessages = Object.entries(details)
          .map(([field, detail]: [string, any]) => `${field}: ${detail.message}`)
          .join(', ');
        throw new Error(`Validation Error: ${errorMessages}`);
      }
      
      throw error;
    }
  },

  submitProcess: async (processId: string) => {
    try {
      const response = await api.post<ApiResponse<void>>(
        IMMIGRATION_END_POINTS.SUBMIT_PROCESS.replace(':processId', processId),
        {},
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error submitting process:', error);
      throw error;
    }
  },

  submitProcessFlow: async (processId: string, flowData: ImmigrationProcessFlow) => {
    try {
      const response = await api.post<ApiResponse<void>>(
        IMMIGRATION_END_POINTS.SUBMIT_PROCESS_FLOW.replace(':id', processId),
        flowData,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error submitting process flow:', error);
      throw error;
    }
  },

  // Forms
  getForms: async () => {
    try {
      const response = await api.get<ApiResponse<any[]>>(
        IMMIGRATION_END_POINTS.GET_FORMS,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  },

  getFormData: async (processId: string, formId: string) => {
    try {
      const response = await api.get<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.GET_FORM_DATA
          .replace(':processId', processId)
          .replace(':formId', formId),
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching form data:', error);
      throw error;
    }
  },

  saveFormData: async (processId: string, formId: string, data: any) => {
    try {
      const response = await api.post<ApiResponse<void>>(
        IMMIGRATION_END_POINTS.SAVE_FORM_DATA
          .replace(':processId', processId)
          .replace(':formId', formId),
        data,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error saving form data:', error);
      throw error;
    }
  },

  validateForm: async (processId: string, formId: string) => {
    try {
      const response = await api.post<ApiResponse<ValidationResult>>(
        IMMIGRATION_END_POINTS.VALIDATE_FORM
          .replace(':processId', processId)
          .replace(':formId', formId),
        {},
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error validating form:', error);
      throw error;
    }
  },

  // Categories and Requirements
  getCategories: async () => {
    try {
      const response = await api.get<ApiResponse<ImmigrationCategory[]>>(
        IMMIGRATION_END_POINTS.GET_CATEGORIES,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getRequirements: async (categoryId: string) => {
    try {
      const response = await api.get<ApiResponse<any>>(
        IMMIGRATION_END_POINTS.GET_REQUIREMENTS.replace(':categoryId', categoryId),
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      throw error;
    }
  },

  // Validation
  validateProcess: async (processId: string) => {
    try {
      const response = await api.post<ApiResponse<ValidationResult>>(
        IMMIGRATION_END_POINTS.UPDATE_PROCESS.replace(':id', processId),
        {},
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error validating process:', error);
      throw error;
    }
  },

  getClients: async (): Promise<Client[]> => {
    try {
      const response = await api.get<ApiResponse<Client[]>>('/api/v1/clients', { retry: true } as RetryConfig);
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  getClient: async (clientId: string) => {
    try {
      const response = await api.get<ApiResponse<ClientResponse>>(
        `/clients/${clientId}`,
        { retry: true } as RetryConfig
      );
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  },
}; 