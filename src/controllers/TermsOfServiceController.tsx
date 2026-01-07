import api from '../utils/api';
import { TERMS_OF_SERVICE_END_POINTS } from '../utils/constants';

// Define common response type
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface TermsOfService {
  effectiveDate: string;
  version: string;
  content: {
    title: string;
    company: string;
    sections: Array<{
      heading: string;
      text: string;
    }>;
  };
}

export interface TermsOfServiceAcceptance {
  userId?: string;
  email: string;
  version: string;
  acceptedAt: string;
}

export interface TermsOfServiceStatus {
  userId: string;
  hasAcceptedLatestVersion: boolean;
  latestVersion: string;
  currentVersion: string;
  lastAcceptedAt?: string;
}

export interface TermsOfServiceHistory {
  userId: string;
  history: Array<{
    _id: string;
    userId?: string;
    email: string;
    termsAccepted: boolean;
    version: string;
    acceptedAt: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  count: number;
}

const handleApiError = (error: any) => {
  if (error.response) {
    const message = error.response.data?.message || error.response.data || 'An error occurred';
    throw new Error(message);
  } else if (error.request) {
    throw new Error('No response from server. Please check your connection.');
  } else {
    throw new Error(error.message || 'An error occurred');
  }
};

/**
 * Get the current Terms of Service
 * Public endpoint - no authentication required
 */
export const getTermsOfService = async (): Promise<TermsOfService> => {
  try {
    const response = await api.get(TERMS_OF_SERVICE_END_POINTS.GET_TERMS);
    return response.data.data || response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Accept the Terms of Service
 * Can be called publicly (during registration) or privately (for logged-in users)
 * @param email - User's email address (required)
 * @param userId - User ID (optional, for logged-in users)
 * @param version - Terms version (optional, defaults to latest)
 */
export const acceptTermsOfService = async (
  email: string,
  userId?: string,
  version?: string
): Promise<TermsOfServiceAcceptance> => {
  try {
    const body: any = { email: email.toLowerCase() };
    if (userId) body.userId = userId;
    if (version) body.version = version;

    const response = await api.post(TERMS_OF_SERVICE_END_POINTS.ACCEPT_TERMS, body);
    return response.data.data || response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Check if the authenticated user has accepted the latest Terms of Service
 * Private endpoint - requires authentication token
 */
export const checkTermsOfServiceStatus = async (): Promise<TermsOfServiceStatus> => {
  try {
    const response = await api.get(TERMS_OF_SERVICE_END_POINTS.CHECK_STATUS);
    return response.data.data || response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get complete acceptance history for a user
 * Private endpoint - requires authentication token
 * @param userId - MongoDB ObjectId of the user
 */
export const getTermsOfServiceHistory = async (userId: string): Promise<TermsOfServiceHistory> => {
  try {
    const url = TERMS_OF_SERVICE_END_POINTS.GET_HISTORY.replace(':userId', userId);
    const response = await api.get(url);
    return response.data.data || response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

