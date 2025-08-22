import api from '../utils/api';
import { FOIA_CASE_END_POINTS } from '../utils/constants';

export interface FoiaCase {
  _id: string;
  caseId: string;
  requestNumber: string;
  publicCaseId: number;
  status: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface FoiaCaseList {
  _id: string;
  userId: string;
  subject: {
    firstName: string;
    lastName: string;
  };
  status: string;
  requestNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoiaCaseForm {
  alienNumber?: string;
  alienNumbers?: string[];
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
    daytimePhone: string;
    mobilePhone: string;
    emailAddress: string;
  };
  family: Array<{
    firstName: string;
    lastName: string;
    middleName?: string;
    relation: string; // M = Mother, F = Father
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
    daytimePhone: string;
    mobilePhone: string;
    emailAddress: string;
    organization?: string;
  };
  receiptNumber: string[];
  receiptNumbers: string[];
  representiveRoleToSubjectOfRecord: {
    role: string; // ATTORNEY or OTHERFAMILY
    otherExplain: string;
  };
  digitalDelivery: string; // MY_ACCOUNT or LEGACY
  preferredConsentMethod: string; // NOTARIZED, EMAIL, or SMS
  courtProceedings: boolean;
  recordsRequested: Array<{
    requestedDocumentType: string;
    otherDescription?: string;
    requestedDocumentDate?: string;
  }>;
  qualificationsForExpeditedProcessing: {
    physicalThreat: boolean;
    informPublic: boolean;
    dueProcess: boolean;
    mediaInterest: boolean;
  };
  documents: Array<{
    content: string;
    fileName: string;
  }>;
}

export interface CreateFoiaCaseResponse {
  success: boolean;
  message: string;
  data: {
    caseId: string;
    requestNumber: string;
    publicCaseId: number;
    status: string;
    uscisResponse: {
      publicCaseId: number;
      requestNumber: string;
      error: string | null;
    };
  };
}

export interface CaseStatusResponse {
  success: boolean;
  data: {
    data: {
      status: {
        display: string;
        code: string;
      };
      estCompletionDate: string;
      requestNumber: string;
      subjectName: string;
      requestDate: string;
      queueLength?: number;
      placeInQueue?: number;
    };
    localCase: {
      id: string;
      status: string;
      estimatedCompletionDate: string;
    };
  };
}

export interface GetCasesResponse {
  success: boolean;
  count: number;
  data: FoiaCaseList[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
}

export const createFoiaCase = async (data: { userId: string; formData: FoiaCaseForm }): Promise<CreateFoiaCaseResponse> => {
  try {
    const response = await api.post<CreateFoiaCaseResponse>(
      FOIA_CASE_END_POINTS.CREATECASE,
      data
    );

    return response.data;

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating FOIA case:', error.message);
      throw new Error(`Failed to create FOIA case: ${error.message}`);
    }
    throw new Error('Failed to create FOIA case due to an unknown error');
  }
};

export const getFoiaCaseStatus = async (requestNumber: string): Promise<CaseStatusResponse> => {
  try {
    const response = await api.get<CaseStatusResponse>(
      FOIA_CASE_END_POINTS.GETCASESTATUS.replace(':requestNumber', requestNumber)
    );

    return response.data;

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching FOIA case status:', error.message);
      throw new Error(`Failed to fetch FOIA case status: ${error.message}`);
    }
    throw new Error('Failed to fetch FOIA case status due to an unknown error');
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

export const getFoiaCases = async (): Promise<GetCasesResponse> => {
  try {
    const response = await api.get(FOIA_CASE_END_POINTS.GETCASES);
    return response.data;
  } catch (error) {
    console.error('Error fetching FOIA cases:', error);
    throw error;
  }
};

export const updateFoiaCase = async (caseId: string, updateData: Partial<FoiaCaseForm>): Promise<ApiResponse<FoiaCase>> => {
  try {
    const response = await api.put<ApiResponse<FoiaCase>>(
      FOIA_CASE_END_POINTS.UPDATECASE.replace(':id', caseId),
      updateData
    );

    return response.data;

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating FOIA case:', error.message);
      throw new Error(`Failed to update FOIA case: ${error.message}`);
    }
    throw new Error('Failed to update FOIA case due to an unknown error');
  }
};

export const deleteFoiaCase = async (caseId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete<{ success: boolean; message: string }>(
      FOIA_CASE_END_POINTS.DELETECASE.replace(':id', caseId)
    );

    return response.data;

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting FOIA case:', error.message);
      throw new Error(`Failed to delete FOIA case: ${error.message}`);
    }
    throw new Error('Failed to delete FOIA case due to an unknown error');
  }
}; 