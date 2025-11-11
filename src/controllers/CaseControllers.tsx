import api from '../utils/api';
import { CASE_END_POINTS } from '../utils/constants';

export interface CaseUserReference {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CaseTimelineEntry {
  _id: string;
  action: string;
  user: CaseUserReference | string;
  notes: string;
  date: string;
}

export interface CaseClient extends CaseUserReference {}

export interface CaseDocument {
  _id: string;
  name?: string;
  description?: string;
  uploadedBy?: CaseUserReference | string;
  uploadedAt?: string;
  [key: string]: unknown;
}

export interface CaseTask {
  _id: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
  assignedTo?: CaseUserReference | string;
  completed?: boolean;
  [key: string]: unknown;
}

export interface Case {
  _id: string;
  type: string;
  clientId: CaseClient | string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string | null;
  formNumber?: string;
  caseNumber?: string;
  status: string;
  timeline: CaseTimelineEntry[];
  documents?: CaseDocument[];
  tasks?: CaseTask[];
  isOverdue?: boolean;
  updatedAt: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface CreateCasePayload {
  type: string;
  clientId: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string;
  formNumber?: string;
  caseNumber?: string;
}

interface CreateCaseResponse {
  success: boolean;
  case: Case;
  message: string;
}

export interface GetCasesParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  category?: string;
  subcategory?: string;
  priority?: string;
  client?: string;
  formNumber?: string;
  caseNumber?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  userType?: string;
  clientId?: string;
}

export interface PaginatedCasesResponse {
  success: boolean;
  cases: Case[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    [key: string]: unknown;
  };
}

export const getCases = async (params: GetCasesParams = {}): Promise<PaginatedCasesResponse> => {
  try {
    const response = await api.get<PaginatedCasesResponse>(
      CASE_END_POINTS.GETCASES,
      { params }
    );

    return response.data;
  } catch (error) {
    // Handle errors
    console.error('Error fetching cases:', error);
    throw error;
  }
};

export const getCasesForIndividualUser = async (
  clientId: string, 
  params: GetCasesParams = {}
): Promise<PaginatedCasesResponse> => {
  try {
    // First, try to get cases with API-level filtering
    const individualUserParams = {
      ...params,
      userType: 'individualUser',
      clientId: clientId
    };

    console.log('🔍 Fetching cases for individual user with params:', individualUserParams);

    const response = await api.get<PaginatedCasesResponse>(
      CASE_END_POINTS.GETCASES,
      { params: individualUserParams }
    );

    console.log('📦 Individual user cases response:', response.data);

    // If API doesn't support filtering, we'll get all cases and filter client-side
    if (response.data.success && response.data.cases) {
      // Filter cases on the client side to ensure we only get individual user cases
      const filteredCases = response.data.cases.filter((caseItem: any) => {
        const isCorrectUserType = caseItem.userType === 'individualUser';
        
        // Handle both string and object clientId
        let caseClientId: string;
        if (typeof caseItem.clientId === 'string') {
          caseClientId = caseItem.clientId;
        } else if (typeof caseItem.clientId === 'object' && caseItem.clientId !== null) {
          // If clientId is an object, try to get the _id or id field
          caseClientId = caseItem.clientId._id || caseItem.clientId.id || '';
        } else {
          caseClientId = '';
        }
        
        const isCorrectClient = caseClientId === clientId;
        
        // Only log when cases don't match for debugging purposes
        if (!isCorrectUserType || !isCorrectClient) {
          console.log(`🔍 Filtering out case ${caseItem.caseNumber}: userType=${caseItem.userType}, clientId=${caseClientId}`);
        }
        
        return isCorrectUserType && isCorrectClient;
      });

      console.log(`✅ Individual user filtering complete: ${filteredCases.length} cases found for user ${clientId}`);

      return {
        ...response.data,
        cases: filteredCases,
        pagination: {
          ...response.data.pagination,
          total: filteredCases.length
        }
      };
    }

    return response.data;
  } catch (error) {
    // Handle errors
    console.error('Error fetching cases for individual user:', error);
    throw error;
  }
};

export const getCasesBasedOnUserType = async (
  user: { _id: string; userType?: string; role?: string } | null,
  params: GetCasesParams = {}
): Promise<PaginatedCasesResponse> => {
  try {
    // If user is an individual user (client with individualUser type)
    if (user?.role === 'client' && user?.userType === 'individualUser') {
      console.log('🎯 Loading cases for individual user:', user._id);
      return await getCasesForIndividualUser(user._id, params);
    }
    
    console.log('🏢 Loading all cases for non-individual user');
    // For all other users (attorneys, admins, company clients, etc.), use the regular getCases
    return await getCases(params);
  } catch (error) {
    console.error('Error fetching cases based on user type:', error);
    throw error;
  }
};

export const createCase = async (caseData: CreateCasePayload): Promise<CreateCaseResponse> => {
  try {
    const response = await api.post<CreateCaseResponse>(
      CASE_END_POINTS.CREATECASE,
      caseData
    );

    return response.data;

  } catch (error) {
    // Handle different error types if needed
    if (error instanceof Error) {
      console.error('Error creating case:', error.message);
      throw new Error(`Failed to create case: ${error.message}`);
    }
    throw new Error('Failed to create case due to an unknown error');
  }
};

export interface CaseDetailResponse {
  success: boolean;
  case: Case;
}

export const getCaseById = async (caseId: string): Promise<CaseDetailResponse> => {
  try {
    const response = await api.get<CaseDetailResponse>(
      CASE_END_POINTS.GETCASEBYID.replace(':id', caseId)
    );

    return response.data;

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching case by id:', error.message);
      throw new Error(`Failed to fetch case: ${error.message}`);
    }
    throw new Error('Failed to fetch case due to an unknown error');
  }
};