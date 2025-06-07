import { api } from './config';

// Types
export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  category: string;
  documentType: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  validationResults: DocumentValidationResult | null;
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: DocumentValidationError[];
  warnings: DocumentValidationWarning[];
}

export interface DocumentValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DocumentValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface DocumentMetadata {
  documentType: string;
  category: string;
  description?: string;
  tags?: string[];
}

// API Endpoints
export const DOCUMENT_END_POINTS = {
  // Document Management
  UPLOAD: '/api/documents/upload',
  GET_ALL: '/api/documents',
  GET_BY_ID: '/api/documents/:id',
  UPDATE: '/api/documents/:id',
  DELETE: '/api/documents/:id',
  
  // Document Validation
  VALIDATE: '/api/documents/:id/validate',
  GET_VALIDATION_STATUS: '/api/documents/:id/validation-status',
  
  // Document Categories
  GET_CATEGORIES: '/api/documents/categories',
  GET_TYPES: '/api/documents/types',
  
  // Document Requirements
  GET_REQUIREMENTS: '/api/documents/requirements',
  GET_CATEGORY_REQUIREMENTS: '/api/documents/categories/:categoryId/requirements',
};

// API Functions
export const documentApi = {
  // Document Management
  uploadDocument: async (file: File, metadata: DocumentMetadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', metadata.documentType);
    formData.append('category', metadata.category);
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    
    return api.post(DOCUMENT_END_POINTS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getAllDocuments: async () => {
    return api.get(DOCUMENT_END_POINTS.GET_ALL);
  },

  getDocument: async (documentId: string) => {
    return api.get(DOCUMENT_END_POINTS.GET_BY_ID.replace(':id', documentId));
  },

  updateDocument: async (documentId: string, metadata: Partial<DocumentMetadata>) => {
    return api.put(DOCUMENT_END_POINTS.UPDATE.replace(':id', documentId), metadata);
  },

  deleteDocument: async (documentId: string) => {
    return api.delete(DOCUMENT_END_POINTS.DELETE.replace(':id', documentId));
  },

  // Document Validation
  validateDocument: async (documentId: string) => {
    return api.post(DOCUMENT_END_POINTS.VALIDATE.replace(':id', documentId));
  },

  getValidationStatus: async (documentId: string) => {
    return api.get(DOCUMENT_END_POINTS.GET_VALIDATION_STATUS.replace(':id', documentId));
  },

  // Document Categories and Types
  getCategories: async () => {
    return api.get(DOCUMENT_END_POINTS.GET_CATEGORIES);
  },

  getDocumentTypes: async () => {
    return api.get(DOCUMENT_END_POINTS.GET_TYPES);
  },

  // Document Requirements
  getRequirements: async () => {
    return api.get(DOCUMENT_END_POINTS.GET_REQUIREMENTS);
  },

  getCategoryRequirements: async (categoryId: string) => {
    return api.get(DOCUMENT_END_POINTS.GET_CATEGORY_REQUIREMENTS.replace(':categoryId', categoryId));
  },
}; 