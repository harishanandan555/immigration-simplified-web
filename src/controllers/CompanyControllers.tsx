import api from '../utils/api';
import { COMPANY_END_POINTS } from '../utils/constants';

export interface Company {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  website?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  type: 'Law Firm' | 'Immigration Service' | 'Other';
  licenseNumber?: string;
  taxId?: string;
  superadminId: string;
  notes?: string;
  settings?: Map<string, any>;
  userCount?: number;
  userLimit?: number;
  users?: {
    attorneys?: string[];
    paralegals?: string[];
    clients?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

const IS_GETCOMPANIES_ENABLED = true;
const IS_GETCOMPANYUSERS_ENABLED = true;

export const getAllCompaniesList = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_GETCOMPANIES_ENABLED) {
    console.log('getCompanies method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${COMPANY_END_POINTS.GETCOMPANIESLIST.replace(':userId', userId)}`);
    return {
      data: response.data.companies,
      pagination: response.data.pagination,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

export const getCompanyUsers = async (companyId: string): Promise<ApiResponse<any>> => {
  if (!IS_GETCOMPANYUSERS_ENABLED) {
    console.log('getCompanyUsers method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${COMPANY_END_POINTS.GETCOMPANYUSERS.replace(':id', companyId)}`);
    return {
      data: response.data.users,
      pagination: response.data.pagination,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching company users:', error);
    throw error;
  }
};

export const getCompanyById = async (companyId: string): Promise<ApiResponse<Company>> => {
  try {
    const response = await api.get(`${COMPANY_END_POINTS.GETCOMPANYBYID.replace(':id', companyId)}`);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    throw error;
  }
};