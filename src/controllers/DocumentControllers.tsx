import api from '../utils/api';
import { DOCUMENT_END_POINTS } from '../utils/constants';

// Set to false to skip the method
const IS_DOCUMENTS_ENABLED = true;
const IS_DOCUMENT_CRUD_ENABLED = true;
const IS_DOCUMENT_DOWNLOAD_ENABLED = false;
const IS_DOCUMENT_PREVIEW_ENABLED = false;
const IS_DOCUMENT_VERIFICATION_ENABLED = false;
const IS_DOCUMENT_SEARCH_ENABLED = false;
const IS_DOCUMENT_BULK_OPERATIONS_ENABLED = false;
const IS_DOCUMENT_COMMENTS_ENABLED = false;
const IS_DOCUMENT_FOLDERS_ENABLED = false;
const IS_DOCUMENT_EXPORT_ENABLED = false;

// Document Interfaces
export interface Document {
  _id: string;
  name: string;
  type: string;
  size: number;
  sizeFormatted: string;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
  caseNumber?: string;
  clientId: string;
  fileUrl?: string;
  mimeType: string;
  description?: string;
  tags?: string[];
  folderId?: string;
  version: number;
  isPublic: boolean;
  metadata?: DocumentMetadata;
  permissions?: DocumentPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  pageCount?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  extractedText?: string;
  ocrProcessed: boolean;
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  retentionPolicy?: string;
  expiryDate?: string;
  customFields?: Record<string, any>;
}

export interface DocumentPermissions {
  owner: string;
  viewers: string[];
  editors: string[];
  admins: string[];
  publicAccess: boolean;
  allowDownload: boolean;
  allowPrint: boolean;
  allowShare: boolean;
}

export interface DocumentVersion {
  _id: string;
  version: number;
  fileUrl: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  changeDescription?: string;
}

export interface DocumentComment {
  _id: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentActivity {
  _id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface DocumentFolder {
  _id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

export interface DocumentUploadRequest {
  file: File;
  clientId: string;
  caseNumber?: string;
  type: string;
  description?: string;
  tags?: string[];
  folderId?: string;
  metadata?: Partial<DocumentMetadata>;
}

export interface DocumentUpdateRequest {
  name?: string;
  description?: string;
  tags?: string[];
  folderId?: string;
  status?: DocumentStatus;
  metadata?: Partial<DocumentMetadata>;
  permissions?: Partial<DocumentPermissions>;
}

export interface DocumentSearchParams {
  search?: string;
  type?: string;
  status?: DocumentStatus;
  clientId?: string;
  caseNumber?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  folderId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentSearchResponse {
  documents: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export type DocumentStatus = 'Pending Review' | 'Verified' | 'Needs Update' | 'Rejected' | 'Archived';

export type DocumentType = 'Identity Document' | 'Supporting Document' | 'Financial Document' | 'Legal Document' | 'Other';

// API Response Interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
  message?: string;
}

// Document Controllers
export const getDocuments = async (params?: DocumentSearchParams): Promise<ApiResponse<DocumentSearchResponse>> => {
  if (!IS_DOCUMENTS_ENABLED) {
    console.log('getDocuments method is skipped.');
    return {
      data: { documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentSearchResponse>(DOCUMENT_END_POINTS.GETDOCUMENTS, {
      params
    });

    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching documents:', error.message);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
    throw new Error('Failed to fetch documents due to an unknown error');
  }
};

export const getDocumentById = async (documentId: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
    console.log('getDocumentById method is skipped.');
    return {
      data: {} as Document,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<Document>(
      DOCUMENT_END_POINTS.GETDOCUMENTBYID.replace(':id', documentId)
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching document:', error.message);
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
    throw new Error('Failed to fetch document due to an unknown error');
  }
};

export const createDocument = async (documentData: DocumentUploadRequest): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
    console.log('createDocument method is skipped.');
    return {
      data: {} as Document,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', documentData.file);
    formData.append('clientId', documentData.clientId);
    if (documentData.caseNumber) {
      formData.append('caseNumber', documentData.caseNumber);
    }
    formData.append('type', documentData.type);
    if (documentData.description) {
      formData.append('description', documentData.description);
    }
    if (documentData.tags) {
      formData.append('tags', JSON.stringify(documentData.tags));
    }
    if (documentData.folderId) {
      formData.append('folderId', documentData.folderId);
    }
    if (documentData.metadata) {
      formData.append('metadata', JSON.stringify(documentData.metadata));
    }

    const response = await api.post<Document>(
      DOCUMENT_END_POINTS.CREATEDOCUMENT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating document:', error.message);
      throw new Error(`Failed to create document: ${error.message}`);
    }
    throw new Error('Failed to create document due to an unknown error');
  }
};

export const updateDocument = async (documentId: string, updateData: DocumentUpdateRequest): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
    console.log('updateDocument method is skipped.');
    return {
      data: {} as Document,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.put<Document>(
      DOCUMENT_END_POINTS.UPDATEDOCUMENT.replace(':id', documentId),
      updateData
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating document:', error.message);
      throw new Error(`Failed to update document: ${error.message}`);
    }
    throw new Error('Failed to update document due to an unknown error');
  }
};

export const deleteDocument = async (documentId: string): Promise<ApiResponse<null>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
    console.log('deleteDocument method is skipped.');
    return {
      data: null,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.delete<{ message?: string }>(
      DOCUMENT_END_POINTS.DELETEDOCUMENT.replace(':id', documentId)
    );

    return {
      data: null,
      success: true,
      status: response.status,
      message: response.data?.message || 'Document deleted successfully'
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting document:', error.message);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
    throw new Error('Failed to delete document due to an unknown error');
  }
};

export const downloadDocument = async (documentId: string, documentName: string): Promise<void> => {
  if (!IS_DOCUMENT_DOWNLOAD_ENABLED) {
    console.log('downloadDocument method is skipped.');
    throw new Error('Method not enabled');
  }

  try {
    const response = await api.get(
      DOCUMENT_END_POINTS.DOWNLOADDOCUMENT.replace(':id', documentId),
      {
        responseType: 'blob'
      }
    );

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = documentName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error downloading document:', error.message);
      throw new Error(`Failed to download document: ${error.message}`);
    }
    throw new Error('Failed to download document due to an unknown error');
  }
};

export const previewDocument = async (documentId: string): Promise<void> => {
  if (!IS_DOCUMENT_PREVIEW_ENABLED) {
    console.log('previewDocument method is skipped.');
    throw new Error('Method not enabled');
  }

  try {
    const response = await api.get<{ previewUrl: string }>(
      DOCUMENT_END_POINTS.PREVIEWDOCUMENT.replace(':id', documentId)
    );

    window.open(response.data.previewUrl, '_blank');
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error getting document preview:', error.message);
      throw new Error(`Failed to get document preview: ${error.message}`);
    }
    throw new Error('Failed to get document preview due to an unknown error');
  }
};

export const updateDocumentStatus = async (documentId: string, status: DocumentStatus, notes?: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
    console.log('updateDocumentStatus method is skipped.');
    return {
      data: {} as Document,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.put<Document>(
      DOCUMENT_END_POINTS.UPDATEDOCUMENTSTATUS.replace(':id', documentId),
      { status, notes }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating document status:', error.message);
      throw new Error(`Failed to update document status: ${error.message}`);
    }
    throw new Error('Failed to update document status due to an unknown error');
  }
};

export const verifyDocument = async (documentId: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_VERIFICATION_ENABLED) {
    console.log('verifyDocument method is skipped.');
    return {
      data: {} as Document,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.post<Document>(
      DOCUMENT_END_POINTS.VERIFYDOCUMENT.replace(':id', documentId)
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error verifying document:', error.message);
      throw new Error(`Failed to verify document: ${error.message}`);
    }
    throw new Error('Failed to verify document due to an unknown error');
  }
};

export const rejectDocument = async (documentId: string, reason?: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
    console.log('rejectDocument method is skipped.');
    return {
      data: {} as Document,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.post<Document>(
      DOCUMENT_END_POINTS.REJECTDOCUMENT.replace(':id', documentId),
      { reason }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error rejecting document:', error.message);
      throw new Error(`Failed to reject document: ${error.message}`);
    }
    throw new Error('Failed to reject document due to an unknown error');
  }
};

export const getDocumentsByClient = async (clientId: string, params?: DocumentSearchParams): Promise<ApiResponse<DocumentSearchResponse>> => {
  if (!IS_DOCUMENTS_ENABLED) {
    console.log('getDocumentsByClient method is skipped.');
    return {
      data: { documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentSearchResponse>(
      DOCUMENT_END_POINTS.GETDOCUMENTSBYCLIENT.replace(':clientId', clientId),
      { params }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching client documents:', error.message);
      throw new Error(`Failed to fetch client documents: ${error.message}`);
    }
    throw new Error('Failed to fetch client documents due to an unknown error');
  }
};

export const getDocumentsByCase = async (caseId: string, params?: DocumentSearchParams): Promise<ApiResponse<DocumentSearchResponse>> => {
  if (!IS_DOCUMENTS_ENABLED) {
    console.log('getDocumentsByCase method is skipped.');
    return {
      data: { documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentSearchResponse>(
      DOCUMENT_END_POINTS.GETDOCUMENTSBYCASE.replace(':caseId', caseId),
      { params }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching case documents:', error.message);
      throw new Error(`Failed to fetch case documents: ${error.message}`);
    }
    throw new Error('Failed to fetch case documents due to an unknown error');
  }
};

export const getDocumentTypes = async (): Promise<ApiResponse<DocumentType[]>> => {
  if (!IS_DOCUMENTS_ENABLED) {
    console.log('getDocumentTypes method is skipped.');
    return {
      data: [],
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentType[]>(DOCUMENT_END_POINTS.GETDOCUMENTTYPES);

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching document types:', error.message);
      throw new Error(`Failed to fetch document types: ${error.message}`);
    }
    throw new Error('Failed to fetch document types due to an unknown error');
  }
};

export const getDocumentStatuses = async (): Promise<ApiResponse<DocumentStatus[]>> => {
  if (!IS_DOCUMENTS_ENABLED) {
    console.log('getDocumentStatuses method is skipped.');
    return {
      data: [],
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentStatus[]>(DOCUMENT_END_POINTS.GETDOCUMENTSTATUSES);

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching document statuses:', error.message);
      throw new Error(`Failed to fetch document statuses: ${error.message}`);
    }
    throw new Error('Failed to fetch document statuses due to an unknown error');
  }
};

export const searchDocuments = async (params: DocumentSearchParams): Promise<ApiResponse<DocumentSearchResponse>> => {
  if (!IS_DOCUMENT_SEARCH_ENABLED) {
    console.log('searchDocuments method is skipped.');
    return {
      data: { documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentSearchResponse>(
      DOCUMENT_END_POINTS.SEARCHDOCUMENTS,
      { params }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error searching documents:', error.message);
      throw new Error(`Failed to search documents: ${error.message}`);
    }
    throw new Error('Failed to search documents due to an unknown error');
  }
};

export const bulkDeleteDocuments = async (documentIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
  if (!IS_DOCUMENT_BULK_OPERATIONS_ENABLED) {
    console.log('bulkDeleteDocuments method is skipped.');
    return {
      data: { deletedCount: 0 },
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.post<{ deletedCount: number }>(
      DOCUMENT_END_POINTS.BULKDELETEDOCUMENTS,
      { documentIds }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error bulk deleting documents:', error.message);
      throw new Error(`Failed to bulk delete documents: ${error.message}`);
    }
    throw new Error('Failed to bulk delete documents due to an unknown error');
  }
};

export const bulkVerifyDocuments = async (documentIds: string[]): Promise<ApiResponse<{ verifiedCount: number }>> => {
  if (!IS_DOCUMENT_BULK_OPERATIONS_ENABLED) {
    console.log('bulkVerifyDocuments method is skipped.');
    return {
      data: { verifiedCount: 0 },
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.post<{ verifiedCount: number }>(
      DOCUMENT_END_POINTS.BULKVERIFYDOCUMENTS,
      { documentIds }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error bulk verifying documents:', error.message);
      throw new Error(`Failed to bulk verify documents: ${error.message}`);
    }
    throw new Error('Failed to bulk verify documents due to an unknown error');
  }
};

export const getDocumentComments = async (documentId: string): Promise<ApiResponse<DocumentComment[]>> => {
  if (!IS_DOCUMENT_COMMENTS_ENABLED) {
    console.log('getDocumentComments method is skipped.');
    return {
      data: [],
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentComment[]>(
      DOCUMENT_END_POINTS.GETDOCUMENTCOMMENTS.replace(':id', documentId)
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching document comments:', error.message);
      throw new Error(`Failed to fetch document comments: ${error.message}`);
    }
    throw new Error('Failed to fetch document comments due to an unknown error');
  }
};

export const addDocumentComment = async (documentId: string, content: string): Promise<ApiResponse<DocumentComment>> => {
  if (!IS_DOCUMENT_COMMENTS_ENABLED) {
    console.log('addDocumentComment method is skipped.');
    return {
      data: {} as DocumentComment,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.post<DocumentComment>(
      DOCUMENT_END_POINTS.ADDDOCUMENTCOMMENT.replace(':id', documentId),
      { content }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error adding document comment:', error.message);
      throw new Error(`Failed to add document comment: ${error.message}`);
    }
    throw new Error('Failed to add document comment due to an unknown error');
  }
};

export const getDocumentFolders = async (): Promise<ApiResponse<DocumentFolder[]>> => {
  if (!IS_DOCUMENT_FOLDERS_ENABLED) {
    console.log('getDocumentFolders method is skipped.');
    return {
      data: [],
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.get<DocumentFolder[]>(DOCUMENT_END_POINTS.GETDOCUMENTFOLDERS);

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching document folders:', error.message);
      throw new Error(`Failed to fetch document folders: ${error.message}`);
    }
    throw new Error('Failed to fetch document folders due to an unknown error');
  }
};

export const createDocumentFolder = async (folderData: { name: string; description?: string; parentFolderId?: string }): Promise<ApiResponse<DocumentFolder>> => {
  if (!IS_DOCUMENT_FOLDERS_ENABLED) {
    console.log('createDocumentFolder method is skipped.');
    return {
      data: {} as DocumentFolder,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.post<DocumentFolder>(
      DOCUMENT_END_POINTS.CREATEDOCUMENTFOLDER,
      folderData
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating document folder:', error.message);
      throw new Error(`Failed to create document folder: ${error.message}`);
    }
    throw new Error('Failed to create document folder due to an unknown error');
  }
};

export const moveDocumentToFolder = async (documentId: string, folderId: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
    console.log('moveDocumentToFolder method is skipped.');
    return {
      data: {} as Document,
      success: true,
      status: 0,
      message: 'Method skipped'
    };
  }

  try {
    const response = await api.post<Document>(
      DOCUMENT_END_POINTS.MOVEDOCUMENTTOFOLDER.replace(':id', documentId),
      { folderId }
    );

    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error moving document to folder:', error.message);
      throw new Error(`Failed to move document to folder: ${error.message}`);
    }
    throw new Error('Failed to move document to folder due to an unknown error');
  }
};

export const exportDocuments = async (documentIds: string[], format: 'pdf' | 'csv' | 'excel' = 'pdf'): Promise<Blob> => {
  if (!IS_DOCUMENT_EXPORT_ENABLED) {
    console.log('exportDocuments method is skipped.');
    throw new Error('Method not enabled');
  }

  try {
    const response = await api.post(
      DOCUMENT_END_POINTS.EXPORTDOCUMENTS,
      { documentIds, format },
      {
        responseType: 'blob'
      }
    );

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error exporting documents:', error.message);
      throw new Error(`Failed to export documents: ${error.message}`);
    }
    throw new Error('Failed to export documents due to an unknown error');
  }
}; 