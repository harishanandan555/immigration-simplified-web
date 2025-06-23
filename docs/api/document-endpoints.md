# Document Management API Endpoints

## Overview
This document outlines all the document management endpoints that need to be implemented in the backend for the immigration management system. All endpoints require authentication via JWT token in the Authorization header.

**Base URL**: `/api/v1/documents`

**Authentication**: `Authorization: Bearer <jwt_token>`

## Core Document Operations

### 1. Get All Documents
**Endpoint**: `GET /api/v1/documents`

**Query Parameters**:
- `search` (string, optional): Search term for document name or case number
- `type` (string, optional): Filter by document type
- `status` (string, optional): Filter by document status
- `clientId` (string, optional): Filter by client ID
- `caseNumber` (string, optional): Filter by case number
- `uploadedBy` (string, optional): Filter by uploader
- `dateFrom` (string, optional): Filter documents uploaded from date (ISO format)
- `dateTo` (string, optional): Filter documents uploaded to date (ISO format)
- `tags` (string[], optional): Filter by tags
- `folderId` (string, optional): Filter by folder ID
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of documents per page (default: 10)
- `sortBy` (string, optional): Sort field (default: 'uploadedAt')
- `sortOrder` (string, optional): Sort order - 'asc' or 'desc' (default: 'desc')

**Response**:
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "doc123",
        "name": "Passport.pdf",
        "type": "Identity Document",
        "size": 2457600,
        "sizeFormatted": "2.4 MB",
        "uploadedBy": "user123",
        "uploadedAt": "2023-06-15T10:30:00Z",
        "status": "Verified",
        "caseNumber": "CF-2023-1001",
        "clientId": "client123",
        "fileUrl": "https://storage.example.com/documents/passport.pdf",
        "mimeType": "application/pdf",
        "description": "Client passport document",
        "tags": ["identity", "passport"],
        "folderId": "folder123",
        "version": 1,
        "isPublic": false,
        "metadata": {
          "pageCount": 2,
          "dimensions": {
            "width": 612,
            "height": 792
          },
          "extractedText": "Sample extracted text...",
          "ocrProcessed": true,
          "securityLevel": "confidential",
          "retentionPolicy": "7_years",
          "expiryDate": "2030-06-15T00:00:00Z",
          "customFields": {
            "documentNumber": "A12345678",
            "issuingCountry": "USA"
          }
        },
        "permissions": {
          "owner": "user123",
          "viewers": ["user456", "user789"],
          "editors": ["user456"],
          "admins": ["user123"],
          "publicAccess": false,
          "allowDownload": true,
          "allowPrint": false,
          "allowShare": true
        },
        "createdAt": "2023-06-15T10:30:00Z",
        "updatedAt": "2023-06-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "pages": 15
    }
  },
  "status": 200
}
```

### 2. Create Document
**Endpoint**: `POST /api/v1/documents`

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file` (File, required): The document file to upload
- `clientId` (string, required): ID of the client the document belongs to
- `caseNumber` (string, optional): Associated case number
- `type` (string, required): Document type
- `description` (string, optional): Document description
- `tags` (string, optional): JSON string of tags array
- `folderId` (string, optional): ID of the folder to store document in
- `metadata` (string, optional): JSON string of metadata object

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "name": "Passport.pdf",
    "type": "Identity Document",
    "size": 2457600,
    "sizeFormatted": "2.4 MB",
    "uploadedBy": "user123",
    "uploadedAt": "2023-06-15T10:30:00Z",
    "status": "Pending Review",
    "caseNumber": "CF-2023-1001",
    "clientId": "client123",
    "fileUrl": "https://storage.example.com/documents/passport.pdf",
    "mimeType": "application/pdf",
    "description": "Client passport document",
    "tags": ["identity", "passport"],
    "folderId": "folder123",
    "version": 1,
    "isPublic": false,
    "metadata": {
      "pageCount": 2,
      "ocrProcessed": false,
      "securityLevel": "confidential"
    },
    "permissions": {
      "owner": "user123",
      "viewers": [],
      "editors": [],
      "admins": ["user123"],
      "publicAccess": false,
      "allowDownload": true,
      "allowPrint": false,
      "allowShare": true
    },
    "createdAt": "2023-06-15T10:30:00Z",
    "updatedAt": "2023-06-15T10:30:00Z"
  },
  "status": 201
}
```

### 3. Get Document by ID
**Endpoint**: `GET /api/v1/documents/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "name": "Passport.pdf",
    "type": "Identity Document",
    "size": 2457600,
    "sizeFormatted": "2.4 MB",
    "uploadedBy": "user123",
    "uploadedAt": "2023-06-15T10:30:00Z",
    "status": "Verified",
    "caseNumber": "CF-2023-1001",
    "clientId": "client123",
    "fileUrl": "https://storage.example.com/documents/passport.pdf",
    "mimeType": "application/pdf",
    "description": "Client passport document",
    "tags": ["identity", "passport"],
    "folderId": "folder123",
    "version": 1,
    "isPublic": false,
    "metadata": {
      "pageCount": 2,
      "dimensions": {
        "width": 612,
        "height": 792
      },
      "extractedText": "Sample extracted text...",
      "ocrProcessed": true,
      "securityLevel": "confidential",
      "retentionPolicy": "7_years",
      "expiryDate": "2030-06-15T00:00:00Z",
      "customFields": {
        "documentNumber": "A12345678",
        "issuingCountry": "USA"
      }
    },
    "permissions": {
      "owner": "user123",
      "viewers": ["user456", "user789"],
      "editors": ["user456"],
      "admins": ["user123"],
      "publicAccess": false,
      "allowDownload": true,
      "allowPrint": false,
      "allowShare": true
    },
    "createdAt": "2023-06-15T10:30:00Z",
    "updatedAt": "2023-06-15T10:30:00Z"
  },
  "status": 200
}
```

### 4. Update Document
**Endpoint**: `PUT /api/v1/documents/:id`

**Description**: Updates the details of a specific document. Only the fields provided in the request body will be updated.

**Request Body**:
The request body is a JSON object that can contain any of the following fields. All fields are optional.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | string | The new name of the document. |
| `description` | string | A new description for the document. |
| `tags` | string[] | An array of tags to associate with the document. This will replace existing tags. |
| `folderId` | string | The ID of the folder to move the document to. |
| `status` | string | The new status of the document. Must be one of `Pending Review`, `Verified`, `Needs Update`, `Rejected`, `Archived`. |
| `metadata` | object | An object containing metadata fields to update. See `DocumentMetadata` for details. |
| `permissions`| object | An object containing permission fields to update. See `DocumentPermissions` for details. |


**Example Request Body**:
```json
{
  "name": "Updated Client Passport.pdf",
  "description": "Updated passport with new expiry date.",
  "tags": ["identity", "passport", "updated", "valid"],
  "status": "Verified",
  "metadata": {
    "expiryDate": "2035-01-22T00:00:00Z",
    "customFields": {
      "documentNumber": "A98765432",
      "issuingCountry": "USA",
      "notes": "Updated upon client request."
    }
  },
  "permissions": {
    "viewers": ["user456", "user789", "attorney123"],
    "editors": ["user456"],
    "allowPrint": true
  }
}
```

**Response**:
The response will be the full updated document object, same as the response for `GET /api/v1/documents/:id`.

**Status Codes**:
- `200 OK`: Document updated successfully.
- `400 Bad Request`: Invalid data provided in the request body.
- `401 Unauthorized`: Authentication token is missing or invalid.
- `403 Forbidden`: User does not have permission to update this document.
- `404 Not Found`: No document found with the given ID.
- `500 Internal Server Error`: An error occurred on the server.

### 5. Delete Document
**Endpoint**: `DELETE /api/v1/documents/:id`

**Response**:
```json
{
  "success": true,
  "data": null,
  "status": 200,
  "message": "Document deleted successfully"
}
```

## Document Actions

### 6. Download Document
**Endpoint**: `GET /api/v1/documents/:id/download`

**Response**: File blob with appropriate headers
- `Content-Type`: Based on document mime type
- `Content-Disposition`: `attachment; filename="document_name.pdf"`

### 7. Preview Document
**Endpoint**: `GET /api/v1/documents/:id/preview`

**Response**:
```json
{
  "success": true,
  "data": {
    "previewUrl": "https://storage.example.com/previews/document123.pdf",
    "expiresAt": "2023-06-15T11:30:00Z"
  },
  "status": 200
}
```

### 8. Verify Document
**Endpoint**: `POST /api/v1/documents/:id/verify`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "status": "Verified",
    "verifiedBy": "user456",
    "verifiedAt": "2023-06-15T11:00:00Z",
    "updatedAt": "2023-06-15T11:00:00Z"
  },
  "status": 200
}
```

### 9. Reject Document
**Endpoint**: `POST /api/v1/documents/:id/reject`

**Request Body**:
```json
{
  "reason": "Document is unclear and needs to be re-uploaded"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "status": "Rejected",
    "rejectedBy": "user456",
    "rejectedAt": "2023-06-15T11:00:00Z",
    "rejectionReason": "Document is unclear and needs to be re-uploaded",
    "updatedAt": "2023-06-15T11:00:00Z"
  },
  "status": 200
}
```

## Client and Case Specific Operations

### 10. Get Documents by Client
**Endpoint**: `GET /api/v1/documents/client/:clientId`

**Query Parameters**: Same as Get All Documents

**Response**: Same as Get All Documents

### 11. Get Documents by Case
**Endpoint**: `GET /api/v1/documents/case/:caseId`

**Query Parameters**: Same as Get All Documents

**Response**: Same as Get All Documents

## Document Status and Types

### 12. Get Document Status
**Endpoint**: `GET /api/v1/documents/:id/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "Verified",
    "verifiedBy": "user456",
    "verifiedAt": "2023-06-15T11:00:00Z"
  },
  "status": 200
}
```

### 13. Update Document Status
**Endpoint**: `PUT /api/v1/documents/:id/status`

**Request Body**:
```json
{
  "status": "Verified",
  "notes": "Document verified successfully"
}
```

**Response**: Same as Get Document Status

### 14. Get Document Types
**Endpoint**: `GET /api/v1/documents/types`

**Response**:
```json
{
  "success": true,
  "data": [
    "Identity Document",
    "Supporting Document",
    "Financial Document",
    "Legal Document",
    "Other"
  ],
  "status": 200
}
```

### 15. Get Document Statuses
**Endpoint**: `GET /api/v1/documents/statuses`

**Response**:
```json
{
  "success": true,
  "data": [
    "Pending Review",
    "Verified",
    "Needs Update",
    "Rejected",
    "Archived"
  ],
  "status": 200
}
```

## Search and Filtering

### 16. Search Documents
**Endpoint**: `GET /api/v1/documents/search`

**Query Parameters**: Same as Get All Documents

**Response**: Same as Get All Documents

## Bulk Operations

### 17. Bulk Delete Documents
**Endpoint**: `POST /api/v1/documents/bulk-delete`

**Request Body**:
```json
{
  "documentIds": ["doc123", "doc456", "doc789"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deletedCount": 3,
    "failedIds": []
  },
  "status": 200
}
```

### 18. Bulk Verify Documents
**Endpoint**: `POST /api/v1/documents/bulk-verify`

**Request Body**:
```json
{
  "documentIds": ["doc123", "doc456", "doc789"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "verifiedCount": 3,
    "failedIds": []
  },
  "status": 200
}
```

## Export and Import

### 19. Export Documents
**Endpoint**: `POST /api/v1/documents/export`

**Request Body**:
```json
{
  "documentIds": ["doc123", "doc456", "doc789"],
  "format": "pdf"
}
```

**Response**: File blob (PDF, CSV, or Excel)

### 20. Import Documents
**Endpoint**: `POST /api/v1/documents/import`

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file` (File, required): Import file (CSV, Excel)
- `clientId` (string, required): Default client ID for imported documents
- `caseNumber` (string, optional): Default case number

**Response**:
```json
{
  "success": true,
  "data": {
    "importedCount": 5,
    "failedCount": 1,
    "errors": [
      {
        "row": 3,
        "error": "Invalid document type"
      }
    ]
  },
  "status": 200
}
```

## Document Metadata

### 21. Get Document Metadata
**Endpoint**: `GET /api/v1/documents/:id/metadata`

**Response**:
```json
{
  "success": true,
  "data": {
    "pageCount": 2,
    "dimensions": {
      "width": 612,
      "height": 792
    },
    "extractedText": "Sample extracted text...",
    "ocrProcessed": true,
    "securityLevel": "confidential",
    "retentionPolicy": "7_years",
    "expiryDate": "2030-06-15T00:00:00Z",
    "customFields": {
      "documentNumber": "A12345678",
      "issuingCountry": "USA"
    }
  },
  "status": 200
}
```

### 22. Update Document Metadata
**Endpoint**: `PUT /api/v1/documents/:id/metadata`

**Request Body**:
```json
{
  "securityLevel": "restricted",
  "retentionPolicy": "10_years",
  "customFields": {
    "documentNumber": "A12345678",
    "issuingCountry": "USA",
    "expiryDate": "2025-06-15"
  }
}
```

**Response**: Same as Get Document Metadata

## Document Versions

### 23. Get Document Versions
**Endpoint**: `GET /api/v1/documents/:id/versions`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "version123",
      "version": 1,
      "fileUrl": "https://storage.example.com/documents/passport_v1.pdf",
      "size": 2457600,
      "uploadedBy": "user123",
      "uploadedAt": "2023-06-15T10:30:00Z",
      "changeDescription": "Initial upload"
    },
    {
      "_id": "version124",
      "version": 2,
      "fileUrl": "https://storage.example.com/documents/passport_v2.pdf",
      "size": 2460000,
      "uploadedBy": "user456",
      "uploadedAt": "2023-06-16T14:20:00Z",
      "changeDescription": "Updated with clearer scan"
    }
  ],
  "status": 200
}
```

### 24. Restore Document Version
**Endpoint**: `POST /api/v1/documents/:id/versions/:versionId/restore`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "version": 3,
    "restoredFrom": 1,
    "restoredBy": "user789",
    "restoredAt": "2023-06-17T09:15:00Z"
  },
  "status": 200
}
```

## Document Sharing and Permissions

### 25. Share Document
**Endpoint**: `POST /api/v1/documents/:id/share`

**Request Body**:
```json
{
  "viewers": ["user456", "user789"],
  "editors": ["user456"],
  "expiresAt": "2023-07-15T00:00:00Z",
  "allowDownload": true,
  "allowPrint": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "sharedAt": "2023-06-15T12:00:00Z",
    "sharedBy": "user123",
    "shareUrl": "https://app.example.com/documents/doc123/shared",
    "expiresAt": "2023-07-15T00:00:00Z"
  },
  "status": 200
}
```

### 26. Unshare Document
**Endpoint**: `POST /api/v1/documents/:id/unshare`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "unsharedAt": "2023-06-15T13:00:00Z",
    "unsharedBy": "user123"
  },
  "status": 200
}
```

### 27. Get Document Permissions
**Endpoint**: `GET /api/v1/documents/:id/permissions`

**Response**:
```json
{
  "success": true,
  "data": {
    "owner": "user123",
    "viewers": ["user456", "user789"],
    "editors": ["user456"],
    "admins": ["user123"],
    "publicAccess": false,
    "allowDownload": true,
    "allowPrint": false,
    "allowShare": true
  },
  "status": 200
}
```

### 28. Update Document Permissions
**Endpoint**: `PUT /api/v1/documents/:id/permissions`

**Request Body**:
```json
{
  "viewers": ["user456", "user789"],
  "editors": ["user456"],
  "publicAccess": false,
  "allowDownload": true,
  "allowPrint": true,
  "allowShare": false
}
```

**Response**: Same as Get Document Permissions

## Document Activity and Comments

### 29. Get Document Activity
**Endpoint**: `GET /api/v1/documents/:id/activity`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "activity123",
      "action": "document_created",
      "performedBy": "user123",
      "performedByName": "John Doe",
      "timestamp": "2023-06-15T10:30:00Z",
      "details": {
        "fileName": "Passport.pdf",
        "fileSize": 2457600
      }
    },
    {
      "_id": "activity124",
      "action": "document_verified",
      "performedBy": "user456",
      "performedByName": "Jane Smith",
      "timestamp": "2023-06-15T11:00:00Z",
      "details": {
        "previousStatus": "Pending Review",
        "newStatus": "Verified"
      }
    }
  ],
  "status": 200
}
```

### 30. Get Document Comments
**Endpoint**: `GET /api/v1/documents/:id/comments`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "comment123",
      "content": "This document looks good and is ready for submission.",
      "author": "user456",
      "authorName": "Jane Smith",
      "createdAt": "2023-06-15T11:30:00Z",
      "updatedAt": "2023-06-15T11:30:00Z"
    }
  ],
  "status": 200
}
```

### 31. Add Document Comment
**Endpoint**: `POST /api/v1/documents/:id/comments`

**Request Body**:
```json
{
  "content": "This document needs additional verification."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "comment124",
    "content": "This document needs additional verification.",
    "author": "user789",
    "authorName": "Bob Johnson",
    "createdAt": "2023-06-15T12:00:00Z",
    "updatedAt": "2023-06-15T12:00:00Z"
  },
  "status": 201
}
```

### 32. Update Document Comment
**Endpoint**: `PUT /api/v1/documents/:id/comments/:commentId`

**Request Body**:
```json
{
  "content": "Updated comment content"
}
```

**Response**: Same as Add Document Comment

### 33. Delete Document Comment
**Endpoint**: `DELETE /api/v1/documents/:id/comments/:commentId`

**Response**:
```json
{
  "success": true,
  "data": null,
  "status": 200,
  "message": "Comment deleted successfully"
}
```

## Document Tags

### 34. Get Document Tags
**Endpoint**: `GET /api/v1/documents/:id/tags`

**Response**:
```json
{
  "success": true,
  "data": ["identity", "passport", "important"],
  "status": 200
}
```

### 35. Add Document Tags
**Endpoint**: `POST /api/v1/documents/:id/tags`

**Request Body**:
```json
{
  "tags": ["urgent", "reviewed"]
}
```

**Response**:
```json
{
  "success": true,
  "data": ["identity", "passport", "important", "urgent", "reviewed"],
  "status": 200
}
```

### 36. Remove Document Tags
**Endpoint**: `DELETE /api/v1/documents/:id/tags`

**Request Body**:
```json
{
  "tags": ["urgent"]
}
```

**Response**:
```json
{
  "success": true,
  "data": ["identity", "passport", "important", "reviewed"],
  "status": 200
}
```

## Document Folders

### 37. Get Document Folders
**Endpoint**: `GET /api/v1/documents/folders`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "folder123",
      "name": "Identity Documents",
      "description": "All identity-related documents",
      "parentFolderId": null,
      "createdBy": "user123",
      "createdAt": "2023-06-01T00:00:00Z",
      "updatedAt": "2023-06-01T00:00:00Z",
      "documentCount": 15
    },
    {
      "_id": "folder124",
      "name": "Financial Documents",
      "description": "All financial-related documents",
      "parentFolderId": null,
      "createdBy": "user123",
      "createdAt": "2023-06-01T00:00:00Z",
      "updatedAt": "2023-06-01T00:00:00Z",
      "documentCount": 8
    }
  ],
  "status": 200
}
```

### 38. Create Document Folder
**Endpoint**: `POST /api/v1/documents/folders`

**Request Body**:
```json
{
  "name": "Legal Documents",
  "description": "All legal-related documents",
  "parentFolderId": "folder123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "folder125",
    "name": "Legal Documents",
    "description": "All legal-related documents",
    "parentFolderId": "folder123",
    "createdBy": "user123",
    "createdAt": "2023-06-15T14:00:00Z",
    "updatedAt": "2023-06-15T14:00:00Z",
    "documentCount": 0
  },
  "status": 201
}
```

### 39. Update Document Folder
**Endpoint**: `PUT /api/v1/documents/folders/:folderId`

**Request Body**:
```json
{
  "name": "Updated Legal Documents",
  "description": "Updated description"
}
```

**Response**: Same as Create Document Folder

### 40. Delete Document Folder
**Endpoint**: `DELETE /api/v1/documents/folders/:folderId`

**Response**:
```json
{
  "success": true,
  "data": null,
  "status": 200,
  "message": "Folder deleted successfully"
}
```

### 41. Move Document to Folder
**Endpoint**: `POST /api/v1/documents/:id/move`

**Request Body**:
```json
{
  "folderId": "folder125"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "doc123",
    "folderId": "folder125",
    "movedAt": "2023-06-15T15:00:00Z",
    "movedBy": "user123"
  },
  "status": 200
}
```

### 42. Get Documents in Folder
**Endpoint**: `GET /api/v1/documents/folders/:folderId/documents`

**Query Parameters**: Same as Get All Documents

**Response**: Same as Get All Documents

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid document type",
  "status": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token",
  "status": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to access this document",
  "status": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Document not found",
  "status": 404
}
```

### 413 Payload Too Large
```json
{
  "success": false,
  "error": "Payload Too Large",
  "message": "File size exceeds maximum allowed size of 10MB",
  "status": 413
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "status": 500
}
```

## Data Models

### Document Status Enum
```typescript
type DocumentStatus = 'Pending Review' | 'Verified' | 'Needs Update' | 'Rejected' | 'Archived';
```

### Document Type Enum
```typescript
type DocumentType = 'Identity Document' | 'Supporting Document' | 'Financial Document' | 'Legal Document' | 'Other';
```

### Security Level Enum
```typescript
type SecurityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
```

## File Upload Requirements

- **Maximum file size**: 10MB
- **Allowed file types**: PDF, PNG, JPG, JPEG, DOC, DOCX, XLS, XLSX
- **Storage**: Files should be stored in a secure cloud storage service (AWS S3, Google Cloud Storage, etc.)
- **Virus scanning**: All uploaded files should be scanned for viruses
- **OCR processing**: PDF files should be processed for text extraction when possible

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Check user permissions before allowing access
3. **File validation**: Validate file types and sizes
4. **Virus scanning**: Scan all uploaded files
5. **Audit logging**: Log all document operations
6. **Data encryption**: Encrypt sensitive document data at rest
7. **Access control**: Implement role-based access control
8. **Rate limiting**: Implement rate limiting for file uploads
9. **CORS**: Configure CORS properly for cross-origin requests
10. **Input validation**: Validate all input parameters

## Performance Considerations

1. **Pagination**: Implement proper pagination for large document lists
2. **Caching**: Cache frequently accessed documents and metadata
3. **CDN**: Use CDN for document delivery
4. **Compression**: Compress large documents when possible
5. **Async processing**: Process OCR and virus scanning asynchronously
6. **Database indexing**: Properly index document search fields
7. **File optimization**: Optimize file storage and retrieval
8. **Load balancing**: Use load balancers for high availability 