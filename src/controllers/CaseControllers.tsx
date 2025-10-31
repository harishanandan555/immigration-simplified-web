import api from '../utils/api';
import { CASE_END_POINTS } from '../utils/constants';

interface Case {
  id?: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  timeline: Array<{
    action: string;
    user: string;
    notes: string;
    _id: string;
    date: string;
  }>;
  updatedAt: string;
  createdAt: string;
}

// Define the response type from your API
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  // Add other standard axios response fields if needed
}

// Example in a React component or custom hook
export const getCases = async () => {
  try {
    const response = await api.get(CASE_END_POINTS.GETCASES);
    // Handle the response data
    return {
      data: response.data.cases,
      pagination: response.data.pagination
    };
  } catch (error) {
    // Handle errors
    console.error('Error fetching cases:', error);
    throw error;
  }
};

export const createCase = async (caseData: Omit<Case, 'id'>): Promise<ApiResponse<Case>> => {
  try {
    const response = await api.post<Case>(
      CASE_END_POINTS.CREATECASE,
      caseData
    );

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };

  } catch (error) {
    // Handle different error types if needed
    if (error instanceof Error) {
      console.error('Error creating case:', error.message);
      throw new Error(`Failed to create case: ${error.message}`);
    }
    throw new Error('Failed to create case due to an unknown error');
  }
}

// Enhanced case creation interface for workflow integration
export interface EnhancedCaseData {
  // Required fields
  type: string;
  clientId: string;
  
  // Enhanced fields
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string;
  assignedTo?: string;
  
  // Form management
  assignedForms: string[];
  formCaseIds: Record<string, string>;
  questionnaires: string[];
  
  // Optional fields
  status?: string;
  startDate?: string;
  expectedClosureDate?: string;
  courtLocation?: string;
  judge?: string;
  notes?: string;
}

// Enhanced case creation function with all required fields
export const createEnhancedCase = async (caseData: EnhancedCaseData): Promise<ApiResponse<any>> => {
  try {
    console.log('🔄 Creating enhanced case with data:', {
      type: caseData.type,
      clientId: caseData.clientId,
      title: caseData.title,
      category: caseData.category,
      subcategory: caseData.subcategory,
      assignedFormsCount: caseData.assignedForms?.length || 0,
      formCaseIdsCount: Object.keys(caseData.formCaseIds || {}).length,
      questionnairesCount: caseData.questionnaires?.length || 0
    });

    // Prepare the request payload matching the API specification
    const requestPayload = {
      // Required fields
      type: caseData.type,
      clientId: caseData.clientId,
      
      // Enhanced fields
      title: caseData.title,
      description: caseData.description,
      category: caseData.category,
      subcategory: caseData.subcategory,
      priority: caseData.priority,
      dueDate: caseData.dueDate,
      assignedTo: caseData.assignedTo,
      
      // Form management
      assignedForms: caseData.assignedForms,
      formCaseIds: caseData.formCaseIds,
      questionnaires: caseData.questionnaires,
      
      // Optional fields with defaults
      status: caseData.status || 'draft',
      startDate: caseData.startDate || new Date().toISOString(),
      expectedClosureDate: caseData.expectedClosureDate,
      courtLocation: caseData.courtLocation,
      judge: caseData.judge,
      notes: caseData.notes,
      createdAt: new Date().toISOString()
    };

    console.log('🔄 Sending case creation request to API:', {
      endpoint: CASE_END_POINTS.CREATECASE,
      payloadSize: JSON.stringify(requestPayload).length,
      hasFormCaseIds: !!requestPayload.formCaseIds && Object.keys(requestPayload.formCaseIds).length > 0
    });

    const response = await api.post(
      CASE_END_POINTS.CREATECASE,
      requestPayload
    );

    console.log('✅ Enhanced case created successfully:', {
      caseId: response.data.case?._id || response.data._id,
      status: response.status,
      hasData: !!response.data
    });

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };

  } catch (error: any) {
    console.error('❌ Error creating enhanced case:', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      clientId: caseData.clientId,
      caseTitle: caseData.title
    });

    // Handle different error types
    if (error instanceof Error) {
      throw new Error(`Failed to create enhanced case: ${error.message}`);
    }
    throw new Error('Failed to create enhanced case due to an unknown error');
  }
}

export const getCaseByNumber = async (caseNumber: string): Promise<ApiResponse<Case>> => {
  try {
    const response = await api.get<Case>(
      CASE_END_POINTS.GETCASEBYNUMBER.replace(':caseNumber', caseNumber)
    );

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching case by number:', error.message);
      throw new Error(`Failed to fetch case: ${error.message}`);
    }
    throw new Error('Failed to fetch case due to an unknown error');
  }
}