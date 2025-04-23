// Application form types
export interface FormData {
  applicantInfo: ApplicantInfo;
  caseType: string;
  documents: Document[];
  additionalInfo: string;
}

export interface ApplicantInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: Address;
  alienNumber?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Document {
  name: string;
  type: string;
  base64Content: string;
}

// Authentication types
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Case status types
export interface CaseStatus {
  caseNumber: string;
  status: string;
  lastUpdated: string;
  history: CaseHistoryItem[];
}

export interface CaseHistoryItem {
  date: string;
  status: string;
  description: string;
}

// API response types
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}


export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  // Add other fields as required
}

export interface AuthState {
  token: string | null;
  login_result: any;
  error: string | null;
}

export interface AuthAction {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT';
  payload?: any;
}