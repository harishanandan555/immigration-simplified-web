import api from '../utils/api';
import { DOCUMENT_END_POINTS } from '../utils/constants';

// Set to false to skip the method
const IS_DOCUMENTS_ENABLED = true;
const IS_DOCUMENT_CRUD_ENABLED = true;
const IS_DOCUMENT_DOWNLOAD_ENABLED = true;
const IS_DOCUMENT_PREVIEW_ENABLED = true;
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
  clientEmail?: string; // Add email field for better client identification
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
  data: any;
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
    return {
      data: {
        documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 },
        data: undefined
      },
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
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
    throw new Error('Failed to fetch documents due to an unknown error');
  }
};

export const getDocumentById = async (documentId: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
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
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
    throw new Error('Failed to fetch document due to an unknown error');
  }
};

export const createDocument = async (documentData: DocumentUploadRequest): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
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
    if (documentData.clientEmail) {
      formData.append('clientEmail', documentData.clientEmail);
    }
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
      throw new Error(`Failed to create document: ${error.message}`);
    }
    throw new Error('Failed to create document due to an unknown error');
  }
};

export const updateDocument = async (documentId: string, updateData: DocumentUpdateRequest): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
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
      throw new Error(`Failed to update document: ${error.message}`);
    }
    throw new Error('Failed to update document due to an unknown error');
  }
};

export const deleteDocument = async (documentId: string): Promise<ApiResponse<null>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
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
      throw new Error(`Failed to delete document: ${error.message}`);
    }
    throw new Error('Failed to delete document due to an unknown error');
  }
};

export const downloadDocument = async (documentId: string, documentName: string): Promise<void> => {
  if (!IS_DOCUMENT_DOWNLOAD_ENABLED) {
    throw new Error('Document download is not enabled');
  }

  try {
    
    // Request the file directly as a blob (since backend now returns actual file content)
    const response = await api.get(
      DOCUMENT_END_POINTS.DOWNLOADDOCUMENT.replace(':id', documentId),
      {
        responseType: 'blob',
        timeout: 60000, // 60 second timeout for large files
        headers: {
          'Accept': 'application/octet-stream, */*'
        }
      }
    );

    // Check if we actually got a blob
    if (!response.data || response.data.size === 0) {
      throw new Error('Downloaded file is empty or invalid');
    }

    // Since backend now returns actual file content directly as blob, we can use it directly
    const fileBlob = response.data;

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let finalFileName = documentName;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); 
      if (filenameMatch && filenameMatch[1]) {
        finalFileName = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Check if file is valid
    if (!fileBlob || fileBlob.size === 0) {
      throw new Error('Downloaded file is empty or invalid');
    }

    // Sanitize filename and ensure it has an extension
    if (!finalFileName.includes('.')) {
      // Try to determine extension from blob mime type
      const extension = fileBlob.type?.includes('pdf') ? '.pdf' : 
                       fileBlob.type?.includes('image') ? '.jpg' :
                       fileBlob.type?.includes('text') ? '.txt' : '';
      finalFileName = `${finalFileName}${extension}`;
    }

    // Create download link
    const url = window.URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = url;
    
    a.download = finalFileName;
    a.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error: any) {    // Enhance error messages
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 404:
          throw new Error('Document not found. It may have been deleted or moved.');
        case 403:
          throw new Error('You do not have permission to download this document.');
        case 401:
          throw new Error('Authentication required. Please log in again.');
        case 500:
          throw new Error('Server error occurred while downloading the document.');
        default:
          throw new Error(`Download failed (${status}): ${message}`);
      }
    } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.code === 'TIMEOUT_ERROR' || error.message?.includes('timeout')) {
      throw new Error('Download timed out. The file may be too large or the connection is slow.');
    } else {
      throw new Error(`Failed to download document: ${error.message || 'Unknown error'}`);
    }
  }
};

export const previewDocument = async (documentId: string): Promise<void> => {
  if (!IS_DOCUMENT_PREVIEW_ENABLED) {
    throw new Error('Method not enabled');
  }

  try {
    
    const response = await api.get(
      DOCUMENT_END_POINTS.PREVIEWDOCUMENT.replace(':id', documentId),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Handle different response formats
    let previewUrl = null;
    
    if (response.data?.success && response.data?.data?.previewUrl) {
      previewUrl = response.data.data.previewUrl;
    } else if (response.data?.previewUrl) {
      previewUrl = response.data.previewUrl;
    } else if (response.data?.fileUrl) {
      previewUrl = response.data.fileUrl;
    } else if (response.data?.data?.fileUrl) {
      previewUrl = response.data.data.fileUrl;
    }

    if (previewUrl) {
      
      // Check if it's a dummy URL
      if (previewUrl.includes('storage.example.com')) {
        throw new Error('This is a demo document with a placeholder URL. Please upload a real document to test preview functionality.');
      }
      
      window.open(previewUrl, '_blank');
    } else {
      // Fallback: try to serve the file directly through the API
      const fallbackUrl = `${window.location.origin}/api/v1/documents/${documentId}/download`;
      window.open(fallbackUrl, '_blank');
    }
    
    
  } catch (error: any) {
    
    // More specific error handling
    if (error.response?.status === 404) {
      
    } else if (error.response?.status === 403) {
      
    } else {
      
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to get document preview: ${error.message}`);
    }
    throw new Error('Failed to get document preview due to an unknown error');
  }
};

export const updateDocumentStatus = async (documentId: string, status: DocumentStatus, notes?: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
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
      throw new Error(`Failed to update document status: ${error.message}`);
    }
    throw new Error('Failed to update document status due to an unknown error');
  }
};

export const verifyDocument = async (documentId: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_VERIFICATION_ENABLED) {
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
      throw new Error(`Failed to verify document: ${error.message}`);
    }
    throw new Error('Failed to verify document due to an unknown error');
  }
};

export const rejectDocument = async (documentId: string, reason?: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
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
      throw new Error(`Failed to reject document: ${error.message}`);
    }
    throw new Error('Failed to reject document due to an unknown error');
  }
};

export const getDocumentsByClient = async (clientId: string, params?: DocumentSearchParams): Promise<ApiResponse<DocumentSearchResponse>> => {
  if (!IS_DOCUMENTS_ENABLED) {
    return {
      data: { data: null, documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
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
      throw new Error(`Failed to fetch client documents: ${error.message}`);
    }
    throw new Error('Failed to fetch client documents due to an unknown error');
  }
};

export const getDocumentsByCase = async (caseId: string, params?: DocumentSearchParams): Promise<ApiResponse<DocumentSearchResponse>> => {
  if (!IS_DOCUMENTS_ENABLED) {
    return {
      data: { data: null, documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
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
      throw new Error(`Failed to fetch case documents: ${error.message}`);
    }
    throw new Error('Failed to fetch case documents due to an unknown error');
  }
};

export const getDocumentTypes = async (): Promise<ApiResponse<DocumentType[]>> => {
  if (!IS_DOCUMENTS_ENABLED) {
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
      throw new Error(`Failed to fetch document types: ${error.message}`);
    }
    throw new Error('Failed to fetch document types due to an unknown error');
  }
};

export const getDocumentStatuses = async (): Promise<ApiResponse<DocumentStatus[]>> => {
  if (!IS_DOCUMENTS_ENABLED) {
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
      throw new Error(`Failed to fetch document statuses: ${error.message}`);
    }
    throw new Error('Failed to fetch document statuses due to an unknown error');
  }
};

export const searchDocuments = async (params: DocumentSearchParams): Promise<ApiResponse<DocumentSearchResponse>> => {
  if (!IS_DOCUMENT_SEARCH_ENABLED) {
    return {
      data: { data: null, documents: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } },
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
      throw new Error(`Failed to search documents: ${error.message}`);
    }
    throw new Error('Failed to search documents due to an unknown error');
  }
};

export const bulkDeleteDocuments = async (documentIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
  if (!IS_DOCUMENT_BULK_OPERATIONS_ENABLED) {
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
      throw new Error(`Failed to bulk delete documents: ${error.message}`);
    }
    throw new Error('Failed to bulk delete documents due to an unknown error');
  }
};

export const bulkVerifyDocuments = async (documentIds: string[]): Promise<ApiResponse<{ verifiedCount: number }>> => {
  if (!IS_DOCUMENT_BULK_OPERATIONS_ENABLED) {
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
      throw new Error(`Failed to bulk verify documents: ${error.message}`);
    }
    throw new Error('Failed to bulk verify documents due to an unknown error');
  }
};

export const getDocumentComments = async (documentId: string): Promise<ApiResponse<DocumentComment[]>> => {
  if (!IS_DOCUMENT_COMMENTS_ENABLED) {
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
      throw new Error(`Failed to fetch document comments: ${error.message}`);
    }
    throw new Error('Failed to fetch document comments due to an unknown error');
  }
};

export const addDocumentComment = async (documentId: string, content: string): Promise<ApiResponse<DocumentComment>> => {
  if (!IS_DOCUMENT_COMMENTS_ENABLED) {
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
      throw new Error(`Failed to add document comment: ${error.message}`);
    }
    throw new Error('Failed to add document comment due to an unknown error');
  }
};

export const getDocumentFolders = async (): Promise<ApiResponse<DocumentFolder[]>> => {
  if (!IS_DOCUMENT_FOLDERS_ENABLED) {
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
      throw new Error(`Failed to fetch document folders: ${error.message}`);
    }
    throw new Error('Failed to fetch document folders due to an unknown error');
  }
};

export const createDocumentFolder = async (folderData: { name: string; description?: string; parentFolderId?: string }): Promise<ApiResponse<DocumentFolder>> => {
  if (!IS_DOCUMENT_FOLDERS_ENABLED) {
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
      throw new Error(`Failed to create document folder: ${error.message}`);
    }
    throw new Error('Failed to create document folder due to an unknown error');
  }
};

export const moveDocumentToFolder = async (documentId: string, folderId: string): Promise<ApiResponse<Document>> => {
  if (!IS_DOCUMENT_CRUD_ENABLED) {
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
      throw new Error(`Failed to move document to folder: ${error.message}`);
    }
    throw new Error('Failed to move document to folder due to an unknown error');
  }
};

export const exportDocuments = async (documentIds: string[], format: 'pdf' | 'csv' | 'excel' = 'pdf'): Promise<Blob> => {
  if (!IS_DOCUMENT_EXPORT_ENABLED) {
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
      throw new Error(`Failed to export documents: ${error.message}`);
    }
    throw new Error('Failed to export documents due to an unknown error');
  }
}; 