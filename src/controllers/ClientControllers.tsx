import api from '../utils/api';
import { CLIENT_END_POINTS } from '../utils/constants';
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

export const getClients = async (): Promise<Client[]> => {
    try {
        const response: AxiosResponse<Client[]> = await api.get(CLIENT_END_POINTS.GETCLIENTS);
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching clients:', error.message);
            throw new Error(`Failed to fetch clients: ${error.message}`);
        }
        throw new Error('Failed to fetch clients due to an unknown error');
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