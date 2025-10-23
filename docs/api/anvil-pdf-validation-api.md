# Anvil PDF Validation API Documentation

This document provides comprehensive API documentation for the PDF validation and preview endpoints in the Anvil integration system.

## Table of Contents

1. [Validate PDF Data Endpoint](#1-validate-pdf-data-endpoint)
2. [Get PDF Preview Endpoint](#2-get-pdf-preview-endpoint)
3. [Usage Examples](#usage-examples)
4. [Error Handling](#error-handling)
5. [Frontend Integration](#frontend-integration)

---

## 1. Validate PDF Data Endpoint

**Endpoint:** `POST /api/v1/anvil/validate-pdf-data`

**Description:** Analyzes a filled PDF document directly using OpenAI to determine completion percentage, quality, and compliance. Pure PDF analysis without template dependency.

**Authentication:** Required (Bearer Token)

### Request Body

```json
{
  "pdfId": "string (optional)",
  "templateId": "string (optional)", 
  "clientId": "string (optional)",
  "formNumber": "string (optional)"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pdfId` | string | No | The ID of the filled PDF to analyze |
| `templateId` | string | No | Template ID to find PDFs for analysis |
| `clientId` | string | No | Client ID to find PDFs for analysis |
| `formNumber` | string | No | Form number to find PDFs for analysis |

**Note:** At least one identifier must be provided.

### Example Request

```bash
POST /api/v1/anvil/validate-pdf-data
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "pdfId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "formNumber": "I-130"
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "PDF analysis completed successfully",
  "data": {
    "pdfId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "templateId": "template_12345",
    "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "formNumber": "I-130",
    "filledPercentage": 84.4
  }
}
```

### Error Responses

#### 400 - Bad Request

```json
{
  "success": false,
  "message": "Invalid request data",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "At least one identifier is required: pdfId, templateId, clientId, or formNumber"
  }
}
```

#### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "UNAUTHORIZED",
    "details": "Invalid or missing authentication token"
  }
}
```

#### 404 - Not Found

```json
{
  "success": false,
  "message": "PDF record not found",
  "error": {
    "code": "NOT_FOUND",
    "details": "No PDF record found matching the provided criteria"
  }
}
```

#### 503 - Service Unavailable

```json
{
  "success": false,
  "message": "OpenAI service is not available",
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "details": "OpenAI service is not connected. Please check your configuration."
  }
}
```

---

## 2. Get PDF Preview Endpoint

**Endpoint:** `GET /api/v1/anvil/pdf-preview`

**Description:** Retrieves PDF data for preview using any combination of identifiers. Returns the actual PDF file data in base64 format for browser preview.

**Authentication:** Required (Bearer Token)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pdfId` | string | No | The ID of the filled PDF to preview |
| `templateId` | string | No | Template ID to find PDFs for preview |
| `clientId` | string | No | Client ID to find PDFs for preview |
| `formNumber` | string | No | Form number to find PDFs for preview |

**Note:** At least one query parameter must be provided.

### Example Requests

```bash
# Get PDF by ID
GET /api/v1/anvil/pdf-preview?pdfId=64f8a1b2c3d4e5f6a7b8c9d0
Authorization: Bearer <your-token>

# Get PDF by template and client
GET /api/v1/anvil/pdf-preview?templateId=template_12345&clientId=64f8a1b2c3d4e5f6a7b8c9d1
Authorization: Bearer <your-token>

# Get PDF by form number
GET /api/v1/anvil/pdf-preview?formNumber=I-130
Authorization: Bearer <your-token>

# Get PDF by multiple identifiers
GET /api/v1/anvil/pdf-preview?templateId=template_12345&clientId=64f8a1b2c3d4e5f6a7b8c9d1&formNumber=I-130
Authorization: Bearer <your-token>
```

### Success Response (200)

```json
{
  "success": true,
  "message": "PDF preview retrieved successfully",
  "data": {
    "pdfId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "templateId": "template_12345",
    "clientId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "formNumber": "I-130",
    "pdfData": "JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDIgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoK...",
    "metadata": {
      "filename": "preview.pdf",
      "fileSize": 245760,
      "contentType": "application/pdf",
      "createdAt": "2023-12-21T10:30:45.123Z",
      "updatedAt": "2023-12-21T10:30:45.123Z"
    }
  }
}
```

### Error Responses

#### 400 - Bad Request

```json
{
  "success": false,
  "message": "Invalid request data",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "At least one identifier is required: pdfId, templateId, clientId, or formNumber"
  }
}
```

#### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "UNAUTHORIZED",
    "details": "Invalid or missing authentication token"
  }
}
```

#### 404 - Not Found

```json
{
  "success": false,
  "message": "PDF record not found",
  "error": {
    "code": "NOT_FOUND",
    "details": "No PDF record found matching the provided criteria"
  }
}
```

#### 500 - Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": "Failed to retrieve PDF for preview"
  }
}
```

---

## Usage Examples

### Frontend Integration Examples

#### JavaScript/TypeScript

```javascript
// Validate PDF Data
const validatePdf = async (pdfId) => {
  const response = await fetch('/api/v1/anvil/validate-pdf-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ pdfId })
  });
  
  const result = await response.json();
  console.log('Filled Percentage:', result.data.filledPercentage);
};

// Get PDF Preview
const getPdfPreview = async (templateId, clientId) => {
  const response = await fetch(`/api/v1/anvil/pdf-preview?templateId=${templateId}&clientId=${clientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  // Display PDF in browser
  const pdfBlob = new Blob([Uint8Array.from(atob(result.data.pdfData), c => c.charCodeAt(0))], {
    type: 'application/pdf'
  });
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  // Use pdfUrl in iframe or embed
  document.getElementById('pdfViewer').src = pdfUrl;
};
```

#### React Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { validatePdfData, getPdfPreviewBlob } from '../controllers/AnvilControllers';

const PdfValidationComponent: React.FC = () => {
  const [pdfId, setPdfId] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');

  const handleValidatePdf = async () => {
    try {
      const result = await validatePdfData({ pdfId });
      if (result.data.success) {
        setValidationResult(result.data.data);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePreviewPdf = async () => {
    try {
      const result = await getPdfPreviewBlob({ pdfId });
      if (result.data.blob) {
        const url = URL.createObjectURL(result.data.blob);
        setPdfPreviewUrl(url);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  return (
    <div>
      <input 
        value={pdfId} 
        onChange={(e) => setPdfId(e.target.value)} 
        placeholder="Enter PDF ID"
      />
      <button onClick={handleValidatePdf}>Validate PDF</button>
      <button onClick={handlePreviewPdf}>Preview PDF</button>
      
      {validationResult && (
        <div>
          <h3>Validation Results</h3>
          <p>Filled Percentage: {validationResult.filledPercentage}%</p>
        </div>
      )}
      
      {pdfPreviewUrl && (
        <iframe 
          src={pdfPreviewUrl} 
          width="100%" 
          height="600px"
          title="PDF Preview"
        />
      )}
    </div>
  );
};
```

### cURL Examples

```bash
# Validate PDF Data
curl -X POST "https://your-api.com/api/v1/anvil/validate-pdf-data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"pdfId": "64f8a1b2c3d4e5f6a7b8c9d0"}'

# Get PDF Preview
curl -X GET "https://your-api.com/api/v1/anvil/pdf-preview?pdfId=64f8a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

### Common Error Scenarios

1. **Missing Authentication**: Ensure you include a valid Bearer token in the Authorization header
2. **Invalid Parameters**: At least one identifier (pdfId, templateId, clientId, or formNumber) must be provided
3. **PDF Not Found**: The specified PDF record doesn't exist in the database
4. **Service Unavailable**: OpenAI service is not configured or available

### Error Response Structure

All error responses follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - PDF record not found |
| 500 | Internal Server Error |
| 503 | Service Unavailable - OpenAI service down |

---

## Frontend Integration

### Using the Controller Functions

The provided controller functions in `AnvilControllers.tsx` handle all the complexity of API communication:

```typescript
import { 
  validatePdfData, 
  getPdfPreview, 
  getPdfPreviewBlob 
} from '../controllers/AnvilControllers';

// Validate PDF
const validationResult = await validatePdfData({ pdfId: 'your-pdf-id' });

// Get PDF preview data
const previewResult = await getPdfPreview({ pdfId: 'your-pdf-id' });

// Get PDF preview as blob (for browser display)
const blobResult = await getPdfPreviewBlob({ pdfId: 'your-pdf-id' });
```

### PDF Display in Browser

To display PDFs in the browser, use the blob result:

```typescript
const displayPdf = async (pdfId: string) => {
  const result = await getPdfPreviewBlob({ pdfId });
  
  if (result.data.blob) {
    const url = URL.createObjectURL(result.data.blob);
    
    // Display in iframe
    const iframe = document.getElementById('pdfViewer') as HTMLIFrameElement;
    iframe.src = url;
    
    // Clean up URL when done
    // URL.revokeObjectURL(url);
  }
};
```

### TypeScript Types

The controller provides full TypeScript support with these interfaces:

- `ValidatePdfDataRequest`
- `ValidatePdfDataResponse`
- `GetPdfPreviewRequest`
- `GetPdfPreviewResponse`

---

## Security Considerations

1. **Authentication**: All endpoints require valid Bearer token authentication
2. **Authorization**: Users can only access PDFs they have permission to view
3. **Data Privacy**: PDF data is transmitted securely over HTTPS
4. **Rate Limiting**: Consider implementing rate limiting for production use

---

## Performance Notes

1. **PDF Size**: Large PDFs may take longer to process and transmit
2. **Base64 Encoding**: PDF data is base64 encoded, increasing size by ~33%
3. **Caching**: Consider implementing client-side caching for frequently accessed PDFs
4. **Memory Management**: Always revoke blob URLs when no longer needed

---

Both endpoints are now fully documented and ready for integration!
