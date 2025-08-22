# FOIA Case Implementation Guide

## Overview

This document provides a comprehensive guide to the updated FOIA (Freedom of Information Act) case implementation in the immigration application. The system has been updated to integrate with the new FOIA API endpoints and includes enhanced validation, improved user experience, and better error handling.

## API Endpoints

### Base Configuration
```typescript
const FOIA_CASE_END_POINTS = {
    CREATECASE: "/api/v1/foia-cases/case",
    GETCASES: "/api/v1/foia-cases/cases", 
    GETCASEBYID: "/api/v1/foia-cases/case/:id",
    UPDATECASE: "/api/v1/foia-cases/case/:id",
    DELETECASE: "/api/v1/foia-cases/case/:id",
    GETCASESTATUS: "/api/v1/foia-cases/case-status/:requestNumber",
};
```

### 1. Create FOIA Case
- **Endpoint**: `POST /api/v1/foia-cases/case`
- **Purpose**: Creates a new FOIA case and submits it to USCIS
- **Response**: Returns case ID, request number, and USCIS response

### 2. Get Case Status
- **Endpoint**: `GET /api/v1/foia-cases/case-status/:requestNumber`
- **Purpose**: Retrieves current status from USCIS
- **Response**: Status, queue position, estimated completion date

### 3. Get User's FOIA Cases
- **Endpoint**: `GET /api/v1/foia-cases/cases`
- **Purpose**: Lists all FOIA cases for authenticated user
- **Response**: Array of cases with basic information

### 4. Get FOIA Case by ID
- **Endpoint**: `GET /api/v1/foia-cases/case/:id`
- **Purpose**: Retrieves detailed case information
- **Response**: Complete case data

### 5. Update FOIA Case
- **Endpoint**: `PUT /api/v1/foia-cases/case/:id`
- **Purpose**: Updates existing case (pending cases only)
- **Response**: Updated case data

### 6. Delete FOIA Case
- **Endpoint**: `DELETE /api/v1/foia-cases/case/:id`
- **Purpose**: Deletes case (pending cases only)
- **Response**: Success confirmation

## Data Structures

### FoiaCaseForm Interface
```typescript
export interface FoiaCaseForm {
  userId?: string;
  alienNumber?: string;
  alienNumbers?: number[];
  
  // Subject Information (Required)
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
  
  // Family Members (Required - must include mother and father)
  family: Array<{
    firstName: string;
    lastName: string;
    middleName?: string;
    relation: string; // M = Mother, F = Father
    maidenName?: string;
  }>;
  
  // Aliases (Optional)
  aliases: Array<{
    firstName: string;
    lastName: string;
    middleName?: string;
  }>;
  
  // Requester Information (Required)
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
  
  // Receipt Numbers (Optional)
  receiptNumber: string[];
  receiptNumbers: string[];
  
  // Representative Role
  representiveRoleToSubjectOfRecord: {
    role: string; // ATTORNEY or OTHERFAMILY
    otherExplain: string; // Required if OTHERFAMILY
  };
  
  // Delivery Preferences
  digitalDelivery: string; // MY_ACCOUNT or LEGACY
  preferredConsentMethod: string; // NOTARIZED, EMAIL, or SMS
  
  courtProceedings: boolean;
  
  // Records Requested (Required)
  recordsRequested: Array<{
    requestedDocumentType: string;
    otherDescription?: string; // Required if type is OTH
    requestedDocumentDate?: string;
  }>;
  
  // Expedited Processing Qualifications
  qualificationsForExpeditedProcessing: {
    physicalThreat: boolean;
    informPublic: boolean;
    dueProcess: boolean;
    mediaInterest: boolean;
  };
  
  // Supporting Documents
  documents: Array<{
    content: string;
    fileName: string;
  }>;
}
```

### Response Interfaces
```typescript
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
    publicCaseId: number;
    requestNumber: string;
    status: string;
    queueLength: number;
    placeInQueue: number;
    estCompletionDate: string;
  };
  localCase: {
    id: string;
    status: string;
    estimatedCompletionDate: string;
  };
}
```

## Frontend Components

### 1. FoiaCaseFormPage
**Location**: `src/pages/foia/FoiaCaseFormPage.tsx`

**Features**:
- Comprehensive form with all required FOIA case fields
- Dynamic family member and alias management
- Document type selection with validation
- Expedited processing qualification checkboxes
- Real-time validation with error display
- Form submission with success/error handling

**Key Validations**:
- Required fields: subject name, DOB, email; requester name, email
- Family must include both mother (M) and father (F) relations
- Other explanation required when role is OTHERFAMILY
- Description required when document type is OTH
- Email format validation

### 2. FoiaCasesPage
**Location**: `src/pages/foia/FoiaCasesPage.tsx`

**Features**:
- List view of all FOIA cases
- Search and filtering capabilities
- Sortable columns
- Click to view case details
- Create new case button

**Data Display**:
- Subject name
- Tracking number
- Status
- Creation date

### 3. FoiaCaseDetailsPage
**Location**: `src/pages/foia/FoiaCaseDetailsPage.tsx`

**Features**:
- Detailed case information display
- Real-time USCIS status checking
- Case management actions (edit, delete)
- Status tracking with queue position
- Estimated completion date

## Form Validation Rules

### Required Fields
1. **Subject Information**:
   - First Name
   - Last Name
   - Date of Birth
   - Email Address

2. **Requester Information**:
   - First Name
   - Last Name
   - Email Address

3. **Family Members**:
   - Must include at least one member with relation "M" (Mother)
   - Must include at least one member with relation "F" (Father)

4. **Records Requested**:
   - At least one record type must be specified
   - If type is "OTH", description is required

### Conditional Validation
1. **Representative Role**:
   - If role is "OTHERFAMILY", other explanation is required

2. **Document Types**:
   - If document type is "OTH", other description is required

3. **Email Format**:
   - All email addresses must be valid format

## User Experience Features

### Form Enhancements
- **Dynamic Fields**: Add/remove family members, aliases, and records
- **Smart Validation**: Real-time error clearing as user types
- **Dropdown Selections**: Predefined options for roles, delivery methods, and document types
- **Conditional Fields**: Show/hide fields based on user selections

### Status Tracking
- **Real-time Updates**: Check USCIS status with refresh button
- **Queue Information**: Display position in processing queue
- **Completion Estimates**: Show estimated completion dates
- **Visual Indicators**: Color-coded status badges

### Error Handling
- **User-friendly Messages**: Clear error descriptions
- **Field-level Validation**: Specific error messages for each field
- **Toast Notifications**: Success and error feedback
- **Form Persistence**: Data preserved on validation errors

## API Integration

### Authentication
All endpoints require JWT token authentication:
```typescript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
};
```

### Error Handling
```typescript
try {
  const response = await createFoiaCase(formData);
  if (response.success) {
    // Handle success
    localStorage.setItem('lastRequestNumber', response.data.requestNumber);
  }
} catch (error) {
  // Handle validation or API errors
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  toast.error(errorMessage);
}
```

### Response Processing
```typescript
// Store request number for future status checks
if (response.data.requestNumber) {
  localStorage.setItem('lastRequestNumber', response.data.requestNumber);
}

// Navigate to cases list on success
navigate('/foia-cases');
```

## File Structure

```
src/
├── controllers/
│   └── FoiaCaseControllers.tsx      # API integration layer
├── pages/foia/
│   ├── FoiaCaseFormPage.tsx         # Create/edit form
│   ├── FoiaCasesPage.tsx            # Cases list view
│   └── FoiaCaseDetailsPage.tsx      # Case details and status
├── utils/
│   └── constants.ts                  # API endpoint definitions
└── types/
    └── index.ts                      # TypeScript interfaces
```

## Usage Examples

### Creating a New FOIA Case
1. Navigate to `/foia-cases/new`
2. Fill out required subject and requester information
3. Add family members (mother and father required)
4. Select document types and add descriptions
5. Choose delivery and consent preferences
6. Submit form

### Checking Case Status
1. Navigate to `/foia-cases/:id`
2. Click "Check Status" button
3. View real-time USCIS status information
4. Monitor queue position and completion estimates

### Managing Cases
1. View all cases at `/foia-cases`
2. Search and filter cases
3. Click on case to view details
4. Edit or delete cases as needed

## Future Enhancements

### Planned Features
- **Bulk Operations**: Create multiple cases simultaneously
- **Document Upload**: File attachment support
- **Email Notifications**: Status update alerts
- **Reporting**: Case analytics and metrics
- **Integration**: USCIS account linking

### Technical Improvements
- **Caching**: Optimize status checking
- **Offline Support**: Form data persistence
- **Performance**: Lazy loading and pagination
- **Accessibility**: Screen reader support

## Troubleshooting

### Common Issues
1. **Validation Errors**: Ensure all required fields are completed
2. **Family Relations**: Must include both mother (M) and father (F)
3. **API Errors**: Check authentication token and network connectivity
4. **Status Updates**: Allow time for USCIS processing

### Debug Information
- Check browser console for detailed error messages
- Verify API endpoint configuration
- Confirm authentication token validity
- Review form validation rules

## Support

For technical support or questions about the FOIA case implementation:
- Review this documentation
- Check the API endpoint specifications
- Consult the frontend component code
- Review validation rules and error messages
