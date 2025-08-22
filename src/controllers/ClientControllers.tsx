import api from '../utils/api';
import { CLIENT_END_POINTS, USER_END_POINTS } from '../utils/constants';
import { AxiosResponse } from 'axios';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: Address;
    nationality: string;
    alienNumber: string;
    passportNumber: string;
    entryDate: string;
    visaCategory: string;
    notes: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status?: string;
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

export const getClients = async (): Promise<Client[]> => {
    try {
        const response: AxiosResponse<{ clients: Client[] }> = await api.get(CLIENT_END_POINTS.GETCLIENTS);
        console.log('📥 Clients API response:', response.data);
        return response.data.clients;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching clients:', error.message);
            throw new Error(`Failed to fetch clients: ${error.message}`);
        }
        throw new Error('Failed to fetch clients due to an unknown error');
    }
};

export const getUsers = async (): Promise<User[]> => {
    try {
        console.log('🔄 Fetching users (attorneys and paralegals) from new API endpoint...');
        console.log('📍 API Endpoint:', USER_END_POINTS.GET_ALL_USERS);
        console.log('📍 Request params:', { role: 'attorney,paralegal' });
        
        // Use the new clients/users endpoint with role filtering for attorneys and paralegals
        const response: AxiosResponse<{ users?: User[], data?: User[], success?: boolean } | User[]> = await api.get(USER_END_POINTS.GET_ALL_USERS, {
            params: {
                role: 'attorney,paralegal'
            }
        });
        
        console.log('📥 Raw API response:', response);
        console.log('📥 Response status:', response.status);
        console.log('📥 Response data:', response.data);
        console.log('📥 Response data type:', typeof response.data);
        console.log('📥 Is response.data an array?', Array.isArray(response.data));
        
        // Handle different response structures
        let users: User[];
        if (Array.isArray(response.data)) {
            users = response.data;
            console.log('✅ Using response.data as array');
        } else if (response.data && response.data.users) {
            users = response.data.users;
            console.log('✅ Using response.data.users');
        } else if (response.data && response.data.data) {
            users = response.data.data;
            console.log('✅ Using response.data.data');
        } else {
            users = [];
            console.log('⚠️ No users found in response, using empty array');
        }
        
        console.log('📋 All users from API:', users);
        console.log('📋 Number of users:', users.length);
        
        if (users.length > 0) {
            console.log('📋 User roles found:', users.map(u => ({ name: `${u.firstName} ${u.lastName}`, role: u.role })));
        }
        
        // Additional client-side filtering to ensure only attorneys and paralegals
        const assignableUsers = users.filter((user: User) => 
            user.role === 'attorney' || user.role === 'paralegal'
        );
        
        console.log('📋 Filtered assignable users:', assignableUsers);
        console.log(`✅ Found ${assignableUsers.length} assignable users (attorneys/paralegals)`);
        
        if (assignableUsers.length === 0) {
            console.log('⚠️ NO ATTORNEYS OR PARALEGALS FOUND!');
            console.log('🔍 Debug info:');
            console.log('- Total users received:', users.length);
            console.log('- User roles in response:', users.map(u => u.role));
        }
        
        return assignableUsers;
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        if (error instanceof Error) {
            console.error('Error fetching users:', error.message);
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
        throw new Error('Failed to fetch users due to an unknown error');
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
        
        const response: AxiosResponse<{ users?: User[], data?: User[], success?: boolean } | User[]> = await api.get(USER_END_POINTS.GET_ALL_USERS, {
            params: {
                role: 'attorney'
            }
        });
        
        console.log('📥 Attorneys API response:', response.data);
        
        // Handle different response structures
        let users: User[];
        if (Array.isArray(response.data)) {
            users = response.data;
        } else if (response.data.users) {
            users = response.data.users;
        } else if (response.data.data) {
            users = response.data.data;
        } else {
            users = [];
        }
        
        // Filter to ensure only attorneys
        const attorneys = users.filter((user: User) => user.role === 'attorney');
        
        console.log(`✅ Found ${attorneys.length} attorneys`);
        return attorneys;
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
        
        const response: AxiosResponse<{ users?: User[], data?: User[], success?: boolean } | User[]> = await api.get(USER_END_POINTS.GET_ALL_USERS, {
            params: {
                role: 'paralegal'
            }
        });
        
        console.log('📥 Paralegals API response:', response.data);
        
        // Handle different response structures
        let users: User[];
        if (Array.isArray(response.data)) {
            users = response.data;
        } else if (response.data.users) {
            users = response.data.users;
        } else if (response.data.data) {
            users = response.data.data;
        } else {
            users = [];
        }
        
        // Filter to ensure only paralegals
        const paralegals = users.filter((user: User) => user.role === 'paralegal');
        
        console.log(`✅ Found ${paralegals.length} paralegals`);
        return paralegals;
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
        const response: AxiosResponse<Client> = await api.get(
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

export const createClient = async (clientData: Omit<Client, 'id'>): Promise<ApiResponse<Client>> => {
    try {
        const response: AxiosResponse<Client> = await api.post<Client>(
            CLIENT_END_POINTS.CREATECLIENT,
            clientData
        );

        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>
        };

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error creating client:', error.message);
            throw new Error(`Failed to create client: ${error.message}`);
        }
        throw new Error('Failed to create client due to an unknown error');
    }
}

export const getClientCases = async (clientId: string): Promise<any[]> => {
    try {
        const response: AxiosResponse<any[]> = await api.get(
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