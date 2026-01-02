import api from '../utils/api';
import { PRIVACY_POLICY_END_POINTS } from '../utils/constants';

// Define common response type
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface PrivacyPolicy {
  effectiveDate: string;
  version: string;
  content: {
    title: string;
    company: string;
    sections: any[];
  };
}

export interface PrivacyPolicyAcceptance {
  userId?: string;
  email: string;
  version: string;
  acceptedAt: string;
}

export interface PrivacyPolicyStatus {
  userId: string;
  hasAcceptedLatestVersion: boolean;
  latestVersion: string;
  currentVersion: string;
  lastAcceptedAt?: string;
}

export interface PrivacyPolicyHistory {
  userId: string;
  history: Array<{
    _id: string;
    userId?: string;
    email: string;
    privacyPolicyAccepted: boolean;
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
 * Get the current Privacy Policy
 * Public endpoint - no authentication required
 */
export const getPrivacyPolicy = async (): Promise<PrivacyPolicy> => {
  try {
    const response = await api.get(PRIVACY_POLICY_END_POINTS.GET_POLICY);
    return response.data.data || response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Accept the Privacy Policy
 * Can be called publicly (during registration) or privately (for logged-in users)
 * @param email - User's email address (required)
 * @param userId - User ID (optional, for logged-in users)
 * @param version - Policy version (optional, defaults to latest)
 */
export const acceptPrivacyPolicy = async (
  email: string,
  userId?: string,
  version?: string
): Promise<PrivacyPolicyAcceptance> => {
  try {
    const body: any = { email: email.toLowerCase() };
    if (userId) body.userId = userId;
    if (version) body.version = version;

    const response = await api.post(PRIVACY_POLICY_END_POINTS.ACCEPT_POLICY, body);
    return response.data.data || response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Check if the authenticated user has accepted the latest Privacy Policy
 * Private endpoint - requires authentication token
 */
export const checkPrivacyPolicyStatus = async (): Promise<PrivacyPolicyStatus> => {
  try {
    const response = await api.get(PRIVACY_POLICY_END_POINTS.CHECK_STATUS);
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
export const getPrivacyPolicyHistory = async (userId: string): Promise<PrivacyPolicyHistory> => {
  try {
    const url = PRIVACY_POLICY_END_POINTS.GET_HISTORY.replace(':userId', userId);
    const response = await api.get(url);
    return response.data.data || response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

