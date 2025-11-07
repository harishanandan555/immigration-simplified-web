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