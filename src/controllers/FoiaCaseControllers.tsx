import api from '../utils/api';
import { FOIA_CASE_END_POINTS } from '../utils/constants';

export interface FoiaCase {
  _id: string;
  subject: {
    firstName: string;
    lastName: string;
  };
  requester: {
    firstName: string;
    lastName: string;
    emailAddress: string;
  };
  recordsRequested: Array<{
    requestedDocumentType: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoiaCaseList {
  _id: string;
  subject: {
    firstName: string;
    lastName: string;
  };
  requester: {
    firstName: string;
    lastName: string;
    emailAddress: string;
  };
  recordsRequested: Array<{
    requestedDocumentType: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoiaCaseForm {
  userId: string;
  alienNumber: string;
  alienNumbers: number[];
  subject: {
    firstName: string;
    lastName: string;
    middleName?: string;
    entryFirstName: string;
    entryLastName: string;
    entryMiddleName?: string;
    dateOfBirth: string;
    birthCountry: string;
    mailingCountry: string;
    mailingState: string;
    mailingAddress1: string;
    mailingAddress2?: string;
    mailingCity: string;
    mailingZipCode: string;
    mailingProvince?: string;
    mailingPostalCode?: string;
    daytimePhone: string;
    mobilePhone: string;
    emailAddress: string;
  };
  family: Array<{
    firstName: string;
    lastName: string;
    middleName?: string;
    relation: string;
    maidenName?: string;
  }>;
  aliases: Array<{
    firstName: string;
    lastName: string;
    middleName?: string;
  }>;
  requester: {
    firstName: string;
    lastName: string;
    middleName?: string;
    mailingCountry: string;
    mailingState: string;
    mailingAddress1: string;
    mailingAddress2?: string;
    mailingCity: string;
    mailingZipCode: string;
    mailingProvince?: string;
    mailingPostalCode?: string;
    daytimePhone: string;
    mobilePhone: string;
    emailAddress: string;
    organization?: string;
  };
  receiptNumber: string[];
  receiptNumbers: string[];
  representiveRoleToSubjectOfRecord: {
    role: string;
    otherExplain: string;
  };
  digitalDelivery: string;
  preferredConsentMethod: string;
  courtProceedings: boolean;
  recordsRequested: Array<{
    requestedDocumentType: string;
    otherDescription?: string;
    requestedDocumentDate?: string;
  }>;
  qualificationsForExpeditedProcessing: {
    physicalThreat: string;
    informPublic: string;
    dueProcess: string;
    mediaInterest: string;
  };
  documents: Array<{
    content: string;
    fileName: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
}

export const createFoiaCase = async (caseData: FoiaCaseForm): Promise<ApiResponse<FoiaCase>> => {
  try {
    const response = await api.post<FoiaCase>(
      FOIA_CASE_END_POINTS.CREATECASE,
      caseData
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating FOIA case:', error.message);
      throw new Error(`Failed to create FOIA case: ${error.message}`);
    }
    throw new Error('Failed to create FOIA case due to an unknown error');
  }
};

export const getFoiaCaseByCaseId = async (caseId: string): Promise<ApiResponse<FoiaCase>> => {
  try {
    const response = await api.get<ApiResponse<FoiaCase>>(
      FOIA_CASE_END_POINTS.GETCASEBYID.replace(':id', caseId)
    );

    return response.data;

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching FOIA case:', error.message);
      throw new Error(`Failed to fetch FOIA case: ${error.message}`);
    }
    throw new Error('Failed to fetch FOIA case due to an unknown error');
  }
};

export const getFoiaCases = async (): Promise<{ data: FoiaCaseList[]; pagination: any }> => {
  try {
    const response = await api.get(FOIA_CASE_END_POINTS.GETCASES);
    return {
      data: response.data.cases,
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error('Error fetching FOIA cases:', error);
    throw error;
  }
}; 