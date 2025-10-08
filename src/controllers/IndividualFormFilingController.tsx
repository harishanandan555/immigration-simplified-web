import api from '../utils/api';
import { INDIVIDUAL_FORM_FILING_END_POINTS } from '../utils/constants';

// Types and Interfaces
export interface PersonalDetails {
  // Basic Information
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  
  // Personal Details
  dateOfBirth?: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  placeOfBirth?: {
    city?: string;
    state?: string;
    country?: string;
  };
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'civil_union';
  immigrationPurpose?: 'family_reunification' | 'employment' | 'education' | 'asylum' | 'investment' | 'diversity_lottery' | 'other';
  
  // Identification Numbers
  passportNumber?: string;
  alienRegistrationNumber?: string;
  nationalIdNumber?: string;
  ssn?: string;
  
  // Family Information
  spouse?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
    alienRegistrationNumber?: string;
  };
  children?: Array<{
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
    alienRegistrationNumber?: string;
  }>;
  
  // Employment Information
  employment?: {
    currentEmployer?: {
      name?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      };
    };
    jobTitle?: string;
    employmentStartDate?: string;
    annualIncome?: number;
  };
  
  // Education Information
  education?: {
    highestLevel?: 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctorate' | 'other';
    institutionName?: string;
    datesAttended?: {
      startDate?: string;
      endDate?: string;
    };
    fieldOfStudy?: string;
  };
  
  // Travel History
  travelHistory?: Array<{
    country?: string;
    visitDate?: string;
    purpose?: 'tourism' | 'business' | 'education' | 'family' | 'other';
    duration?: number;
  }>;
  
  // Financial Information
  financialInfo?: {
    annualIncome?: number;
    sourceOfFunds?: 'employment' | 'investment' | 'family' | 'savings' | 'other';
    bankAccountBalance?: number;
  };
  
  // Background Information
  criminalHistory?: {
    hasCriminalRecord?: boolean;
    details?: string;
  };
  medicalHistory?: {
    hasMedicalConditions?: boolean;
    details?: string;
  };
  
  // Additional Information
  bio?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
  entryDate?: string;
  visaCategory?: string;
  notes?: string;
  documents?: Array<{
    name?: string;
    path?: string;
    uploadedAt?: string;
    category?: string;
  }>;
  active?: boolean;
  lastLogin?: string;
  
  // System Information
  userType?: 'companyClient' | 'individualUser';
  role?: string;
  companyId?: string;
  attorneyIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableForm {
  formNumber: string;
  title: string;
  description: string;
  category: string;
  type: string;
  status: string;
  editionDate: string;
  expirationDate: string;
  fee: number;
  instructions: string;
}

export interface FormSelectionResponse {
  workflowId: string;
  currentStep: number;
  status: string;
  selectedForms: string[];
  stepsProgress: StepProgress[];
}

export interface StepProgress {
  step: number;
  name: string;
  completed: boolean;
  completedAt?: string;
}

export interface CaseDetails {
  type: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  visaType?: string;
  priority: string;
  priorityDate?: string;
  dueDate?: string;
}

export interface Case {
  id: string;
  _id?: string;
  caseNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  visaType?: string;
  priority: string;
  status: string;
  priorityDate?: string;
  openDate: string;
  dueDate?: string;
  clientId: string;
  assignedForms: string[];
  questionnaires: string[];
  createdAt: string;
  formCaseIds: Record<string, string>;
}

export interface FormField {
  fieldName: string;
  displayName: string;
  parameterName: string;
  defaultValue: string;
  required: boolean;
  fieldType: string;
}

export interface FormTemplate {
  name: string;
  category: string;
  fields: FormField[];
}

export interface PdfTemplate {
  totalFields: number;
  mappedFields: number;
  fieldMapping: FormField[];
}

export interface UscisForm {
  formNumber: string;
  title: string;
  description: string;
  category: string;
  fee: number;
}

export interface FormDetail {
  formNumber: string;
  formTemplate: FormTemplate;
  pdfTemplate: PdfTemplate;
  uscisForm: UscisForm;
}

export interface FormReviewResponse {
  workflowId: string;
  formDetails: FormDetail[];
  dataPreview: {
    client: any;
    case: any;
    selectedForms: string[];
    workflowId: string;
    timestamp: string;
  };
  stepsProgress: StepProgress[];
  currentStep: number;
}

export interface GeneratedPdf {
  formNumber: string;
  pdfBuffer: string;
  fileName: string;
  fileSize: number;
}

export interface AutoFillResponse {
  workflowId: string;
  results: {
    successful: string[];
    failed: string[];
    generatedPdfs: GeneratedPdf[];
  };
  stepsProgress: StepProgress[];
  status: string;
}

export interface WorkflowSearchParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FormsResponse {
  forms: AvailableForm[];
  pagination: PaginationInfo;
}

// API Functions

/**
 * Get personal details for client preview
 */
export const getPersonalDetails = async (): Promise<PersonalDetails> => {
  try {
    const response = await api.get(INDIVIDUAL_FORM_FILING_END_POINTS.GET_PERSONAL_DETAILS);
    return response.data.data.personalDetails;
  } catch (error) {
    console.error('Error fetching personal details:', error);
    throw error;
  }
};

/**
 * Update personal details for client
 */
export const updatePersonalDetails = async (personalDetails: Partial<PersonalDetails>): Promise<any> => {
  try {
    const response = await api.put(INDIVIDUAL_FORM_FILING_END_POINTS.UPDATE_PERSONAL_DETAILS, {
      personalDetails
    });
    return response.data;
  } catch (error) {
    console.error('Error updating personal details:', error);
    throw error;
  }
};

/**
 * Get available USCIS form numbers for individual users
 */
export const getAvailableForms = async (searchParams?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<FormsResponse> => {
  try {
    const params = new URLSearchParams();
    if (searchParams?.category) params.append('category', searchParams.category);
    if (searchParams?.search) params.append('search', searchParams.search);
    if (searchParams?.page) params.append('page', searchParams.page.toString());
    if (searchParams?.limit) params.append('limit', searchParams.limit.toString());

    const response = await api.get(INDIVIDUAL_FORM_FILING_END_POINTS.GET_AVAILABLE_FORMS, {
      params: Object.fromEntries(params)
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching available forms:', error);
    throw error;
  }
};

/**
 * Select forms for individual workflow
 */
export const selectForms = async (selectedForms: string[]): Promise<FormSelectionResponse> => {
  try {
    const response = await api.post(INDIVIDUAL_FORM_FILING_END_POINTS.SELECT_FORMS, {
      selectedForms
    });
    return response.data.data;
  } catch (error) {
    console.error('Error selecting forms:', error);
    throw error;
  }
};

/**
 * Create case for individual workflow
 */
export const createCase = async (workflowId: string, caseDetails: CaseDetails): Promise<{
  workflowId: string;
  currentStep: number;
  case: Case;
  stepsProgress: StepProgress[];
}> => {
  try {
    const response = await api.post(
      INDIVIDUAL_FORM_FILING_END_POINTS.CREATE_CASE.replace(':workflowId', workflowId),
      { caseDetails }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

/**
 * Get form review for selected forms
 */
export const getFormReview = async (workflowId: string): Promise<FormReviewResponse> => {
  try {
    const response = await api.get(
      INDIVIDUAL_FORM_FILING_END_POINTS.GET_FORM_REVIEW.replace(':workflowId', workflowId)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching form review:', error);
    throw error;
  }
};

/**
 * Auto-fill and generate forms
 */
export const autoFillForms = async (
  workflowId: string,
  formData?: {
    additionalInfo?: Record<string, any>;
  },
  generatePdf: boolean = true
): Promise<AutoFillResponse> => {
  try {
    const response = await api.post(
      INDIVIDUAL_FORM_FILING_END_POINTS.AUTO_FILL_FORMS.replace(':workflowId', workflowId),
      {
        formData: formData || {},
        generatePdf
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error auto-filling forms:', error);
    throw error;
  }
};

/**
 * Get individual workflow by ID
 */
export const getWorkflow = async (workflowId: string): Promise<any> => {
  try {
    const response = await api.get(
      INDIVIDUAL_FORM_FILING_END_POINTS.GET_WORKFLOW.replace(':workflowId', workflowId)
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching workflow:', error);
    throw error;
  }
};

/**
 * Get all individual workflows for a user
 */
export const getAllWorkflows = async (searchParams?: WorkflowSearchParams): Promise<{
  workflows: any[];
  pagination: PaginationInfo;
}> => {
  try {
    const params = new URLSearchParams();
    if (searchParams?.status) params.append('status', searchParams.status);
    if (searchParams?.page) params.append('page', searchParams.page.toString());
    if (searchParams?.limit) params.append('limit', searchParams.limit.toString());

    const response = await api.get(INDIVIDUAL_FORM_FILING_END_POINTS.GET_ALL_WORKFLOWS, {
      params: Object.fromEntries(params)
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching workflows:', error);
    throw error;
  }
};

// Utility Functions

/**
 * Validate form data before submission
 */
export const validateFormData = (formData: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!formData.clientId) {
    errors.push('Client ID is required');
  }
  
  if (!formData.formNumber) {
    errors.push('Form number is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format workflow ID for display
 */
export const formatWorkflowId = (workflowId: string): string => {
  return workflowId.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
};

/**
 * Check if a workflow step is completed
 */
export const isStepCompleted = (stepsProgress: StepProgress[], stepNumber: number): boolean => {
  const step = stepsProgress.find(s => s.step === stepNumber);
  return step?.completed || false;
};

/**
 * Get current step from workflow progress
 */
export const getCurrentStep = (stepsProgress: StepProgress[]): number => {
  const incompleteStep = stepsProgress.find(s => !s.completed);
  return incompleteStep?.step || stepsProgress.length;
};

/**
 * Get completed steps count
 */
export const getCompletedStepsCount = (stepsProgress: StepProgress[]): number => {
  return stepsProgress.filter(s => s.completed).length;
};

/**
 * Get workflow progress percentage
 */
export const getWorkflowProgressPercentage = (stepsProgress: StepProgress[]): number => {
  const completed = getCompletedStepsCount(stepsProgress);
  const total = stepsProgress.length;
  return Math.round((completed / total) * 100);
};

/**
 * Check if API endpoint is available
 */
export const isApiEndpointAvailable = async (endpointPath: string): Promise<boolean> => {
  try {
    try {
      await api.head(endpointPath);
      return true;
    } catch (error: any) {
      // If we get a 401, the endpoint exists but requires auth
      if (error.response?.status === 401) {
        return true;
      }
      // If we get a 404, the endpoint doesn't exist
      if (error.response?.status === 404) {
        return false;
      }
      // For other errors, assume endpoint is available
      return true;
    }
  } catch (error) {
    console.error('Error checking API endpoint availability:', error);
    return false;
  }
};

/**
 * Download generated PDF
 */
export const downloadPdf = (pdfData: GeneratedPdf): void => {
  try {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfData.pdfBuffer}`;
    link.download = pdfData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

/**
 * Download multiple PDFs as ZIP
 */
export const downloadMultiplePdfs = (pdfs: GeneratedPdf[]): void => {
  try {
    // This would typically use a library like JSZip
    // For now, we'll download them individually
    pdfs.forEach((pdf, index) => {
      setTimeout(() => {
        downloadPdf(pdf);
      }, index * 1000); // Delay each download by 1 second
    });
  } catch (error) {
    console.error('Error downloading multiple PDFs:', error);
    throw error;
  }
};

// Default export with all functions
export default {
  // Main API functions
  getPersonalDetails,
  updatePersonalDetails,
  getAvailableForms,
  selectForms,
  createCase,
  getFormReview,
  autoFillForms,
  getWorkflow,
  getAllWorkflows,
  
  // Utility functions
  validateFormData,
  formatWorkflowId,
  isStepCompleted,
  getCurrentStep,
  getCompletedStepsCount,
  getWorkflowProgressPercentage,
  isApiEndpointAvailable,
  downloadPdf,
  downloadMultiplePdfs
};
