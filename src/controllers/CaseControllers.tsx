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