import api from '../utils/api';
import { CLIENT_END_POINTS } from '../utils/constants';

interface Case {
    id?: string; // Optional for creation
    title: string;
    description: string;
    status?: string; // Optional with default value on backend
    // Add other case properties as needed
}

// Define the response type from your API
interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
    // Add other standard axios response fields if needed
}

// Example in a React component or custom hook
export const getClients = async () => {
    try {
        const response = await api.get(CLIENT_END_POINTS.GETCLIENTS);
        // Handle the response data
        console.log(response.data);
        return response.data;
    } catch (error) {
        // Handle errors
        console.error('Error fetching cases:', error);
        throw error;
    }
};

export const createClient = async (caseData: Omit<Case, 'id'>): Promise<ApiResponse<Case>> => {
    try {
        const response = await api.post<Case>(
            CLIENT_END_POINTS.CREATECLIENT,
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