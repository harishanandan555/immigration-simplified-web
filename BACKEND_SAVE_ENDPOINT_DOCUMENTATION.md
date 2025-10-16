# Backend Endpoint Documentation

## Save Edited PDF Endpoint

### Endpoint
```
POST /api/v1/anvil/save-edited-pdf
```

### Description
Saves edited PDFs from the Nutrient Web SDK editor to the database with metadata tracking.

### Request Body
```typescript
interface SaveEditedPdfRequest {
  formName: string;
  clientId: string;
  caseId?: string;
  workflowId?: string;
  originalTemplateId?: string;
  pdfData: string; // Base64-encoded PDF data
  metadata: {
    filename: string;
    fileSize: number;
    contentType: string;
    editedAt: string;
    editSource: 'nutrient-sdk';
  };
}
```

### Response
```typescript
interface SaveEditedPdfResponse {
  success: boolean;
  message: string;
  data?: {
    pdfId: string;
    formName: string;
    clientId: string;
    caseId?: string;
    workflowId?: string;
    originalTemplateId?: string;
    downloadUrl: string;
    metadata: {
      filename: string;
      fileSize: number;
      contentType: string;
      createdAt: string;
      editedAt: string;
      editSource: string;
    };
  };
}
```

### Usage in Frontend

#### LegalFirmWorkflow Component
```typescript
import { saveEditedPdf } from '../controllers/AnvilControllers';

const handleSaveEditedPdf = async (formName: string, editedPdfBlob: Blob) => {
  const saveResponse = await saveEditedPdf(
    editedPdfBlob,
    formName,
    clientId,
    {
      caseId: currentCase?.id,
      workflowId: questionnaireAssignment?.id,
      originalTemplateId: form.templateId,
      filename: form.fileName
    }
  );
  
  if (saveResponse.data.success) {
    // Update UI with saved PDF data
    toast.success('PDF saved successfully to database');
  }
};
```

#### IndividualImmigrationProcess Component
```typescript
import { saveEditedPdf } from '../../controllers/AnvilControllers';

const handleSaveEditedPdf = async (formName: string, editedPdfBlob: Blob) => {
  const saveResponse = await saveEditedPdf(
    editedPdfBlob,
    formName,
    'individual-user', // Client ID for individual users
    {
      filename: form.fileName
    }
  );
  
  if (saveResponse.data.success) {
    // Update UI with saved PDF data
    toast.success('PDF saved successfully to database');
  }
};
```

### Error Handling
The endpoint includes comprehensive error handling with fallback to local storage if backend save fails:

1. **Primary Save**: Attempts to save to backend database
2. **Fallback Save**: If backend fails, saves locally and notifies user
3. **Error Messages**: User-friendly error messages for different failure scenarios

### Database Schema (Expected)
The backend should store the following information:
- PDF binary data (base64 decoded)
- Form metadata (name, client, case, workflow associations)
- Edit tracking (timestamp, source)
- File information (size, type, filename)
- Download URLs for future access

### Security Considerations
- PDF data is base64 encoded for transmission
- Client authentication required
- File size validation recommended
- Content type verification for PDF files
