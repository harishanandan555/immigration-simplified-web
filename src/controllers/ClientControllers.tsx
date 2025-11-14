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
  _id?: string;
  type: string;
  name: string;
  fileUrl: string;
  uploadDate: string;
  notes?: string;
  category?: string;
  path?: string; // Legacy field
  uploadedAt?: string; // Legacy field
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

// New interfaces for enhanced API responses
export interface CompanyClientsApiResponse {
    success: boolean;
    clients: Client[];
    total: number;
}

export interface IndividualClientsApiResponse {
    success: boolean;
    clients: Client[];
    total: number;
}

export interface ClientStats {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    companyClients: number;
    individualClients: number;
    newThisMonth: number;
    newThisWeek: number;
}

export interface ClientSearchParams {
    query?: string;
    status?: string;
    userType?: string;
    companyId?: string;
    attorneyId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface BulkUpdateRequest {
    clientIds: string[];
    updates: Partial<Client>;
}

export interface BulkDeleteRequest {
    clientIds: string[];
}

export interface BulkAssignAttorneysRequest {
    clientIds: string[];
    attorneyIds: string[];
}

export interface ClientPasswordUpdate {
    currentPassword?: string;
    newPassword: string;
    confirmPassword?: string;
}

export interface ClientActivationRequest {
    status: 'Active' | 'Inactive' | 'Pending';
    reason?: string;
}

export interface AttorneyAssignment {
    attorneyId: string;
    assignedBy: string;
    assignedAt: string;
    notes?: string;
}


export const getUsers = async (params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    userType?: string;
    search?: string;
} = {}): Promise<UsersApiResponse> => {
    try {
        
        const response = await api.get<UsersApiResponse>(USER_END_POINTS.GET_ALL_USERS, {
            params
        });
        
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
        
        let response = await api.get(USER_END_POINTS.GET_ALL_USERS);
        
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
        
        
        // Filter for attorneys and paralegals
        const assignableUsers = allUsers.filter((user: User) => 
            user.role === 'attorney' || user.role === 'paralegal'
        );
        
        return assignableUsers;
        
    } catch (error) {
        console.error('❌ Error in alternative user fetch:', error);
        
        // Try fallback endpoint
        try {
            const fallbackResponse = await api.get('/api/v1/users');
            
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
            
            return assignableUsers;
            
        } catch (fallbackError) {
            console.error('❌ Fallback method also failed:', fallbackError);
            return [];
        }
    }
};

export const getAttorneys = async (): Promise<User[]> => {
    try {
        
        const response = await getUsers({ role: 'attorney' });
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
        
        const response = await getUsers({ role: 'paralegal' });
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
        const response = await api.post<Client>(
            CLIENT_END_POINTS.CREATEINDIVIDUALCLIENT,
            clientData
        );

        return response.data;

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error creating client:', error.message);
            throw new Error(`Failed to create client: ${error.message}`);
        }
        throw new Error('Failed to create client due to an unknown error');
    }
};

export const createCompanyClient = async (clientData: Omit<Client, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'attorneyIds'> & {
    companyId: string;
    attorneyIds?: string;
    sendPassword?: boolean;
    password?: string;
}): Promise<Client> => {
    try {
        const response = await api.post<Client>(
            CLIENT_END_POINTS.CREATECOMPANYCLIENT,
            clientData
        );

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
        const response = await api.put<Client>(
            CLIENT_END_POINTS.UPDATECLIENT.replace(':id', clientId),
            updateData
        );

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
        const response = await api.post<Client>(
            CLIENT_END_POINTS.ADDCLIENTDOCUMENT.replace(':id', clientId),
            documentData
        );

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

// New specialized client functions

export const getCompanyClients = async (params: {
    status?: string;
    search?: string;
} = {}): Promise<CompanyClientsApiResponse> => {
    try {
        const response = await api.get<CompanyClientsApiResponse>(
            CLIENT_END_POINTS.GETCOMPANYCLIENTS,
            { params }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching company clients:', error.message);
            throw new Error(`Failed to fetch company clients: ${error.message}`);
        }
        throw new Error('Failed to fetch company clients due to an unknown error');
    }
};

export const getIndividualClients = async (params: {
    status?: string;
    search?: string;
} = {}): Promise<IndividualClientsApiResponse> => {
    try {
        const response = await api.get<IndividualClientsApiResponse>(
            CLIENT_END_POINTS.GETINDIVIDUALCLIENTS,
            { params }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching individual clients:', error.message);
            throw new Error(`Failed to fetch individual clients: ${error.message}`);
        }
        throw new Error('Failed to fetch individual clients due to an unknown error');
    }
};

export const getAllUsers = async (params: {
    role?: string;
    status?: string;
    userType?: string;
    search?: string;
    page?: number;
    limit?: number;
} = {}): Promise<UsersApiResponse> => {
    try {
        const response = await api.get<UsersApiResponse>(
            CLIENT_END_POINTS.GETALLUSERS,
            { params }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching all users:', error.message);
            throw new Error(`Failed to fetch all users: ${error.message}`);
        }
        throw new Error('Failed to fetch all users due to an unknown error');
    }
};

export const deleteClient = async (clientId: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.delete<{ success: boolean; message: string }>(
            CLIENT_END_POINTS.DELETECLIENT.replace(':id', clientId)
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error deleting client:', error.message);
            throw new Error(`Failed to delete client: ${error.message}`);
        }
        throw new Error('Failed to delete client due to an unknown error');
    }
};

export const activateClient = async (clientId: string, activationData: ClientActivationRequest): Promise<Client> => {
    try {
        const response = await api.put<Client>(
            CLIENT_END_POINTS.ACTIVATECLIENT.replace(':id', clientId),
            activationData
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error activating client:', error.message);
            throw new Error(`Failed to activate client: ${error.message}`);
        }
        throw new Error('Failed to activate client due to an unknown error');
    }
};

export const deactivateClient = async (clientId: string, reason?: string): Promise<Client> => {
    try {
        const response = await api.put<Client>(
            CLIENT_END_POINTS.DEACTIVATECLIENT.replace(':id', clientId),
            { reason }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error deactivating client:', error.message);
            throw new Error(`Failed to deactivate client: ${error.message}`);
        }
        throw new Error('Failed to deactivate client due to an unknown error');
    }
};

export const resetClientPassword = async (clientId: string): Promise<{ success: boolean; message: string; temporaryPassword?: string }> => {
    try {
        const response = await api.post<{ success: boolean; message: string; temporaryPassword?: string }>(
            CLIENT_END_POINTS.RESETCLIENTPASSWORD.replace(':id', clientId)
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error resetting client password:', error.message);
            throw new Error(`Failed to reset client password: ${error.message}`);
        }
        throw new Error('Failed to reset client password due to an unknown error');
    }
};

export const updateClientPassword = async (clientId: string, passwordData: ClientPasswordUpdate): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.put<{ success: boolean; message: string }>(
            CLIENT_END_POINTS.UPDATECLIENTPASSWORD.replace(':id', clientId),
            passwordData
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error updating client password:', error.message);
            throw new Error(`Failed to update client password: ${error.message}`);
        }
        throw new Error('Failed to update client password due to an unknown error');
    }
};

export const getClientDocuments = async (clientId: string): Promise<Document[]> => {
    try {
        const response = await api.get<Document[]>(
            CLIENT_END_POINTS.GETCLIENTDOCUMENTS.replace(':id', clientId)
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching client documents:', error.message);
            throw new Error(`Failed to fetch client documents: ${error.message}`);
        }
        throw new Error('Failed to fetch client documents due to an unknown error');
    }
};

export const updateClientDocument = async (clientId: string, documentId: string, documentData: Partial<Document>): Promise<Document> => {
    try {
        const response = await api.put<Document>(
            CLIENT_END_POINTS.UPDATECLIENTDOCUMENT.replace(':id', clientId).replace(':documentId', documentId),
            documentData
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error updating client document:', error.message);
            throw new Error(`Failed to update client document: ${error.message}`);
        }
        throw new Error('Failed to update client document due to an unknown error');
    }
};

export const deleteClientDocument = async (clientId: string, documentId: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.delete<{ success: boolean; message: string }>(
            CLIENT_END_POINTS.DELETECLIENTDOCUMENT.replace(':id', clientId).replace(':documentId', documentId)
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error deleting client document:', error.message);
            throw new Error(`Failed to delete client document: ${error.message}`);
        }
        throw new Error('Failed to delete client document due to an unknown error');
    }
};

export const downloadClientDocument = async (clientId: string, documentId: string): Promise<Blob> => {
    try {
        const response = await api.get(
            CLIENT_END_POINTS.DOWNLOADCLIENTDOCUMENT.replace(':id', clientId).replace(':documentId', documentId),
            { responseType: 'blob' }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error downloading client document:', error.message);
            throw new Error(`Failed to download client document: ${error.message}`);
        }
        throw new Error('Failed to download client document due to an unknown error');
    }
};

export const searchClients = async (searchParams: ClientSearchParams): Promise<ClientsApiResponse> => {
    try {
        const response = await api.get<ClientsApiResponse>(
            CLIENT_END_POINTS.SEARCHCLIENTS,
            { params: searchParams }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error searching clients:', error.message);
            throw new Error(`Failed to search clients: ${error.message}`);
        }
        throw new Error('Failed to search clients due to an unknown error');
    }
};

export const getClientStats = async (): Promise<ClientStats> => {
    try {
        const response = await api.get<ClientStats>(CLIENT_END_POINTS.GETCLIENTSTATS);
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching client stats:', error.message);
            throw new Error(`Failed to fetch client stats: ${error.message}`);
        }
        throw new Error('Failed to fetch client stats due to an unknown error');
    }
};

export const exportClients = async (filters?: ClientSearchParams): Promise<Blob> => {
    try {
        const response = await api.get(
            CLIENT_END_POINTS.EXPORTCLIENTS,
            { 
                params: filters,
                responseType: 'blob'
            }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error exporting clients:', error.message);
            throw new Error(`Failed to export clients: ${error.message}`);
        }
        throw new Error('Failed to export clients due to an unknown error');
    }
};

export const importClients = async (file: File): Promise<{ success: boolean; message: string; imported: number; errors: string[] }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post<{ success: boolean; message: string; imported: number; errors: string[] }>(
            CLIENT_END_POINTS.IMPORTCLIENTS,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error importing clients:', error.message);
            throw new Error(`Failed to import clients: ${error.message}`);
        }
        throw new Error('Failed to import clients due to an unknown error');
    }
};

export const assignAttorney = async (clientId: string, attorneyId: string, notes?: string): Promise<Client> => {
    try {
        const response = await api.post<Client>(
            CLIENT_END_POINTS.ASSIGNATTORNEY.replace(':id', clientId),
            { attorneyId, notes }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error assigning attorney:', error.message);
            throw new Error(`Failed to assign attorney: ${error.message}`);
        }
        throw new Error('Failed to assign attorney due to an unknown error');
    }
};

export const unassignAttorney = async (clientId: string, attorneyId: string): Promise<Client> => {
    try {
        const response = await api.delete<Client>(
            CLIENT_END_POINTS.UNASSIGNATTORNEY.replace(':id', clientId),
            { data: { attorneyId } }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error unassigning attorney:', error.message);
            throw new Error(`Failed to unassign attorney: ${error.message}`);
        }
        throw new Error('Failed to unassign attorney due to an unknown error');
    }
};

export const getClientAttorneys = async (clientId: string): Promise<Attorney[]> => {
    try {
        const response = await api.get<Attorney[]>(
            CLIENT_END_POINTS.GETCLIENTATTORNEYS.replace(':id', clientId)
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching client attorneys:', error.message);
            throw new Error(`Failed to fetch client attorneys: ${error.message}`);
        }
        throw new Error('Failed to fetch client attorneys due to an unknown error');
    }
};

export const bulkUpdateClients = async (bulkUpdateData: BulkUpdateRequest): Promise<{ success: boolean; message: string; updated: number }> => {
    try {
        const response = await api.put<{ success: boolean; message: string; updated: number }>(
            CLIENT_END_POINTS.BULKUPDATECLIENTS,
            bulkUpdateData
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error bulk updating clients:', error.message);
            throw new Error(`Failed to bulk update clients: ${error.message}`);
        }
        throw new Error('Failed to bulk update clients due to an unknown error');
    }
};

export const bulkDeleteClients = async (bulkDeleteData: BulkDeleteRequest): Promise<{ success: boolean; message: string; deleted: number }> => {
    try {
        const response = await api.delete<{ success: boolean; message: string; deleted: number }>(
            CLIENT_END_POINTS.BULKDELETECLIENTS,
            { data: bulkDeleteData }
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error bulk deleting clients:', error.message);
            throw new Error(`Failed to bulk delete clients: ${error.message}`);
        }
        throw new Error('Failed to bulk delete clients due to an unknown error');
    }
};

export const bulkAssignAttorneys = async (bulkAssignData: BulkAssignAttorneysRequest): Promise<{ success: boolean; message: string; assigned: number }> => {
    try {
        const response = await api.post<{ success: boolean; message: string; assigned: number }>(
            CLIENT_END_POINTS.BULKASSIGNATTORNEYS,
            bulkAssignData
        );
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error bulk assigning attorneys:', error.message);
            throw new Error(`Failed to bulk assign attorneys: ${error.message}`);
        }
        throw new Error('Failed to bulk assign attorneys due to an unknown error');
    }
};

// Utility functions for frontend integration

export const downloadClientDocumentAsFile = async (clientId: string, documentId: string, filename?: string): Promise<void> => {
    try {
        const blob = await downloadClientDocument(clientId, documentId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `document-${documentId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading document as file:', error);
        throw error;
    }
};

export const exportClientsAsFile = async (filters?: ClientSearchParams, filename?: string): Promise<void> => {
    try {
        const blob = await exportClients(filters);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting clients as file:', error);
        throw error;
    }
};

export const validateClientData = (clientData: Partial<Client>): string[] => {
    const errors: string[] = [];
    
    if (!clientData.firstName?.trim()) {
        errors.push('First name is required');
    }
    
    if (!clientData.lastName?.trim()) {
        errors.push('Last name is required');
    }
    
    if (!clientData.email?.trim()) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
        errors.push('Invalid email format');
    }
    
    if (clientData.userType === 'companyClient' && !clientData.companyId) {
        errors.push('Company ID is required for company clients');
    }
    
    if (clientData.dateOfBirth && isNaN(Date.parse(clientData.dateOfBirth))) {
        errors.push('Invalid date of birth format');
    }
    
    return errors;
};

export const formatClientName = (client: Pick<Client, 'firstName' | 'lastName' | 'name'>): string => {
    if (client.firstName && client.lastName) {
        return `${client.firstName} ${client.lastName}`;
    }
    return client.name || 'Unknown Client';
};

export const getClientStatusColor = (status: Client['status']): string => {
    switch (status) {
        case 'Active':
            return 'green';
        case 'Inactive':
            return 'red';
        case 'Pending':
            return 'yellow';
        default:
            return 'gray';
    }
};

export const getClientTypeLabel = (userType: Client['userType']): string => {
    switch (userType) {
        case 'companyClient':
            return 'Company Client';
        case 'individualUser':
            return 'Individual User';
        default:
            return 'Unknown';
    }
};