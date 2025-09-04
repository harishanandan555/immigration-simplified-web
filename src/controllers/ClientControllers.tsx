import api from '../utils/api';
import { CLIENT_END_POINTS, USER_END_POINTS } from '../utils/constants';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PlaceOfBirth {
  city: string;
  state?: string;
  country: string;
}

export interface Spouse {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  alienRegistrationNumber?: string;
}

export interface Child {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  alienRegistrationNumber?: string;
}

export interface Employment {
  currentEmployer?: {
    name?: string;
    address?: Address;
  };
  jobTitle?: string;
  employmentStartDate?: string;
  annualIncome?: number;
}

export interface Education {
  highestLevel?: 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctorate' | 'other';
  institutionName?: string;
  datesAttended?: {
    startDate?: string;
    endDate?: string;
  };
  fieldOfStudy?: string;
}

export interface TravelHistory {
  country: string;
  visitDate: string;
  purpose: 'tourism' | 'business' | 'education' | 'family' | 'other';
  duration: number; // days
}

export interface FinancialInfo {
  annualIncome?: number;
  sourceOfFunds?: 'employment' | 'investment' | 'family' | 'savings' | 'other';
  bankAccountBalance?: number;
}

export interface CriminalHistory {
  hasCriminalRecord: boolean;
  details?: string;
}

export interface MedicalHistory {
  hasMedicalConditions: boolean;
  details?: string;
}

export interface Document {
  name: string;
  path: string;
  uploadedAt: string;
  category: string;
}

export interface Company {
  _id: string;
  name: string;
}

export interface Attorney {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Client {
    _id: string;
    firstName: string;
    lastName: string;
    name: string; // Auto-generated from firstName + lastName
    email: string;
    phone: string;
    nationality: string;
    address: Address;
    role: 'client';
    userType: 'companyClient' | 'individualUser';
    companyId?: string; // Required for companyClient
    attorneyIds: string[];
    dateOfBirth: string;
    placeOfBirth?: PlaceOfBirth;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'civil_union';
    immigrationPurpose?: 'family_reunification' | 'employment' | 'education' | 'asylum' | 'investment' | 'diversity_lottery' | 'other';
    passportNumber?: string;
    alienRegistrationNumber?: string;
    nationalIdNumber?: string;
    spouse?: Spouse;
    children?: Child[];
    employment?: Employment;
    education?: Education;
    travelHistory?: TravelHistory[];
    financialInfo?: FinancialInfo;
    criminalHistory?: CriminalHistory;
    medicalHistory?: MedicalHistory;
    bio?: string;
    status: 'Active' | 'Inactive' | 'Pending';
    entryDate?: string;
    visaCategory?: string;
    notes?: string;
    documents?: Document[];
    active: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    // Legacy fields for backward compatibility
    id?: string;
    alienNumber?: string;
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface ClientsApiResponse {
    clients: Client[];
    pagination: PaginationInfo;
}

export interface UsersApiResponse {
    success: boolean;
    users: User[];
    pagination: PaginationInfo;
}

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    name: string; // Auto-generated from firstName + lastName
    email: string;
    role: string;
    status?: 'Active' | 'Inactive' | 'Pending';
    userType?: 'companyUser' | 'individualUser';
    companyId?: string;
    attorneyIds?: string[];
    superadminIds?: string[];
    lastLogin?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Task {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    clientId: string;
    caseId: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    status?: 'Pending' | 'In Progress' | 'Completed';
    assignedTo: string;
    createdAt?: string;
    updatedAt?: string;
}

export const getClients = async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
} = {}): Promise<ClientsApiResponse> => {
    try {
        console.log('🔄 Fetching clients with params:', params);
        const response = await api.get<ClientsApiResponse>(CLIENT_END_POINTS.GETCLIENTS, {
            params
        });
        console.log('📥 Clients API response:', response.data);
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching clients:', error.message);
            throw new Error(`Failed to fetch clients: ${error.message}`);
        }
        throw new Error('Failed to fetch clients due to an unknown error');
    }
};

export const getUsers = async (params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    userType?: string;
    search?: string;
} = {}): Promise<UsersApiResponse> => {
    try {
        console.log('🔄 Fetching users from new API endpoint...');
        console.log('📍 API Endpoint:', USER_END_POINTS.GET_ALL_USERS);
        console.log('📍 Request params:', params);
        
        const response = await api.get<UsersApiResponse>(USER_END_POINTS.GET_ALL_USERS, {
            params
        });
        
        console.log('📥 Users API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        if (error instanceof Error) {
            console.error('Error fetching users:', error.message);
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
        throw new Error('Failed to fetch users due to an unknown error');
    }
};

// Helper function to get assignable users (attorneys and paralegals)
export const getAssignableUsers = async (): Promise<User[]> => {
    try {
        const response = await getUsers({ role: 'attorney,paralegal' });
        return response.users;
    } catch (error) {
        console.error('❌ Error fetching assignable users:', error);
        throw error;
    }
};

// Alternative method to try different API approaches
export const getUsersAlternative = async (): Promise<User[]> => {
    try {
        console.log('🔄 Trying alternative approach to fetch users...');
        
        // Try 1: Get all users without role filtering first
        console.log('🔍 Attempt 1: Getting all users without role filter');
        let response = await api.get(USER_END_POINTS.GET_ALL_USERS);
        
        console.log('📥 All users response:', response.data);
        
        // Handle different response structures
        let allUsers: User[];
        if (Array.isArray(response.data)) {
            allUsers = response.data;
        } else if (response.data && response.data.users) {
            allUsers = response.data.users;
        } else if (response.data && response.data.data) {
            allUsers = response.data.data;
        } else {
            allUsers = [];
        }
        
        console.log('📋 All users found:', allUsers);
        if (allUsers.length > 0) {
            console.log('📋 All user roles:', allUsers.map(u => `${u.firstName} ${u.lastName} - ${u.role}`));
        }
        
        // Filter for attorneys and paralegals
        const assignableUsers = allUsers.filter((user: User) => 
            user.role === 'attorney' || user.role === 'paralegal'
        );
        
        console.log(`✅ Alternative method found ${assignableUsers.length} assignable users`);
        
        return assignableUsers;
        
    } catch (error) {
        console.error('❌ Error in alternative user fetch:', error);
        
        // Try fallback endpoint
        try {
            console.log('🔍 Attempt 2: Trying fallback endpoint /api/v1/users');
            const fallbackResponse = await api.get('/api/v1/users');
            console.log('📥 Fallback response:', fallbackResponse.data);
            
            let fallbackUsers: User[];
            if (Array.isArray(fallbackResponse.data)) {
                fallbackUsers = fallbackResponse.data;
            } else if (fallbackResponse.data && fallbackResponse.data.users) {
                fallbackUsers = fallbackResponse.data.users;
            } else if (fallbackResponse.data && fallbackResponse.data.data) {
                fallbackUsers = fallbackResponse.data.data;
            } else {
                fallbackUsers = [];
            }
            
            const assignableUsers = fallbackUsers.filter((user: User) => 
                user.role === 'attorney' || user.role === 'paralegal'
            );
            
            console.log(`✅ Fallback method found ${assignableUsers.length} assignable users`);
            return assignableUsers;
            
        } catch (fallbackError) {
            console.error('❌ Fallback method also failed:', fallbackError);
            return [];
        }
    }
};

export const getAttorneys = async (): Promise<User[]> => {
    try {
        console.log('🔄 Fetching attorneys from new API endpoint...');
        
        const response = await getUsers({ role: 'attorney' });
        console.log(`✅ Found ${response.users.length} attorneys`);
        return response.users;
    } catch (error) {
        console.error('❌ Error fetching attorneys:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch attorneys: ${error.message}`);
        }
        throw new Error('Failed to fetch attorneys due to an unknown error');
    }
};

export const getParalegals = async (): Promise<User[]> => {
    try {
        console.log('🔄 Fetching paralegals from new API endpoint...');
        
        const response = await getUsers({ role: 'paralegal' });
        console.log(`✅ Found ${response.users.length} paralegals`);
        return response.users;
    } catch (error) {
        console.error('❌ Error fetching paralegals:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch paralegals: ${error.message}`);
        }
        throw new Error('Failed to fetch paralegals due to an unknown error');
    }
};

export const getClientById = async (id: string): Promise<Client> => {
    try {
        const response = await api.get<Client>(
            CLIENT_END_POINTS.GETCLIENTBYID.replace(':id', id)
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching client:', error.message);
            throw new Error(`Failed to fetch client: ${error.message}`);
        }
        throw new Error('Failed to fetch client due to an unknown error');
    }
};

export const createIndividualClient = async (clientData: Omit<Client, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    try {
        console.log('🔄 Creating individual client...');
        const response = await api.post<Client>(
            CLIENT_END_POINTS.CREATECLIENT,
            clientData
        );

        console.log('✅ Individual client created:', response.data);
        return response.data;

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error creating client:', error.message);
            throw new Error(`Failed to create client: ${error.message}`);
        }
        throw new Error('Failed to create client due to an unknown error');
    }
};

export const createCompanyClient = async (clientData: Omit<Client, '_id' | 'id' | 'createdAt' | 'updatedAt'> & {
    companyId: string;
    attorneyIds?: string[];
    sendPassword?: boolean;
    password?: string;
}): Promise<Client> => {
    try {
        console.log('🔄 Creating company client...');
        const response = await api.post<Client>(
            CLIENT_END_POINTS.CREATECOMPANYCLIENT,
            clientData
        );

        console.log('✅ Company client created:', response.data);
        return response.data;

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error creating company client:', error.message);
            throw new Error(`Failed to create company client: ${error.message}`);
        }
        throw new Error('Failed to create company client due to an unknown error');
    }
};

export const updateClient = async (clientId: string, updateData: Partial<Client>): Promise<Client> => {
    try {
        console.log('🔄 Updating client:', clientId);
        const response = await api.put<Client>(
            CLIENT_END_POINTS.UPDATECLIENT.replace(':id', clientId),
            updateData
        );

        console.log('✅ Client updated:', response.data);
        return response.data;

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error updating client:', error.message);
            throw new Error(`Failed to update client: ${error.message}`);
        }
        throw new Error('Failed to update client due to an unknown error');
    }
};

export const addClientDocument = async (clientId: string, documentData: {
    type: string;
    name: string;
    fileUrl: string;
    notes?: string;
}): Promise<Client> => {
    try {
        console.log('🔄 Adding document to client:', clientId);
        const response = await api.post<Client>(
            CLIENT_END_POINTS.ADDCLIENTDOCUMENT.replace(':id', clientId),
            documentData
        );

        console.log('✅ Document added to client:', response.data);
        return response.data;

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error adding document to client:', error.message);
            throw new Error(`Failed to add document to client: ${error.message}`);
        }
        throw new Error('Failed to add document to client due to an unknown error');
    }
};

export const getClientCases = async (clientId: string): Promise<any[]> => {
    try {
        const response = await api.get<any[]>(
            CLIENT_END_POINTS.GETCLIENTCASES.replace(':id', clientId)
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching client cases:', error.message);
            throw new Error(`Failed to fetch client cases: ${error.message}`);
        }
        throw new Error('Failed to fetch client cases due to an unknown error');
    }
};