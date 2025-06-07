# Immigration Simplified API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All API endpoints require authentication using a Bearer token.
```http
Authorization: Bearer <token>
```

## Immigration Process API

### Start Immigration Process
```http
POST /immigration/process/start
```

**Request Body:**
```json
{
  "categoryId": "string",
  "subcategoryId": "string",
  "visaType": "string",
  "clientId": "string",
  "priorityDate": "YYYY-MM-DD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "categoryId": "string",
    "subcategoryId": "string",
    "visaType": "string",
    "clientId": "string",
    "caseId": "string",
    "priorityDate": "YYYY-MM-DD",
    "status": "pending",
    "currentStep": "documents",
    "steps": [],
    "documents": [],
    "formData": {},
    "validationResults": null,
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

### Get Process Details
```http
GET /immigration/process/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "categoryId": "string",
    "subcategoryId": "string",
    "visaType": "string",
    "clientId": "string",
    "caseId": "string",
    "priorityDate": "YYYY-MM-DD",
    "status": "pending|in_progress|completed|rejected",
    "currentStep": "documents|forms|review|submitted",
    "steps": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "status": "pending|in_progress|completed",
        "requiredDocuments": ["string"],
        "requiredForms": ["string"],
        "validationRules": []
      }
    ],
    "documents": [],
    "formData": {},
    "validationResults": null,
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

### Update Process
```http
PUT /immigration/process/:id
```

**Request Body:**
```json
{
  "status": "string",
  "currentStep": "string",
  "formData": {}
}
```

### Submit Process
```http
POST /immigration/process/:id/submit
```

## Document API

### Upload Document
```http
POST /documents/upload
```

**Request Body (multipart/form-data):**
```
file: File
documentType: string
category: string
description: string (optional)
tags: string[] (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "type": "string",
    "url": "string",
    "status": "pending|approved|rejected",
    "category": "string",
    "documentType": "string",
    "size": "number",
    "mimeType": "string",
    "uploadedAt": "ISO-8601",
    "validationResults": null
  }
}
```

### Get All Documents
```http
GET /documents
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "url": "string",
      "status": "pending|approved|rejected",
      "category": "string",
      "documentType": "string",
      "size": "number",
      "mimeType": "string",
      "uploadedAt": "ISO-8601",
      "validationResults": null
    }
  ]
}
```

### Get Document by ID
```http
GET /documents/:id
```

### Update Document
```http
PUT /documents/:id
```

**Request Body:**
```json
{
  "documentType": "string",
  "category": "string",
  "description": "string",
  "tags": ["string"]
}
```

### Delete Document
```http
DELETE /documents/:id
```

### Validate Document
```http
POST /documents/:id/validate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [
      {
        "field": "string",
        "message": "string",
        "code": "string"
      }
    ],
    "warnings": [
      {
        "field": "string",
        "message": "string",
        "code": "string"
      }
    ]
  }
}
```

### Get Document Categories
```http
GET /documents/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "requiredDocuments": ["string"]
    }
  ]
}
```

### Get Document Types
```http
GET /documents/types
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "allowedExtensions": ["string"],
      "maxSize": "number"
    }
  ]
}
```

### Get Document Requirements
```http
GET /documents/requirements
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "string",
      "requiredDocuments": [
        {
          "type": "string",
          "description": "string",
          "isRequired": true,
          "validationRules": []
        }
      ]
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal error occurred"
  }
}
```

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP address
- 1000 requests per hour per user

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1614567890
```

## Pagination

List endpoints support pagination using query parameters:
```http
GET /documents?page=1&limit=10
```

**Response Headers:**
```http
X-Total-Count: 100
X-Total-Pages: 10
X-Current-Page: 1
X-Per-Page: 10
```

## File Upload Limits

- Maximum file size: 10MB
- Allowed file types: PDF, JPG, PNG, DOC, DOCX
- Maximum files per request: 5 