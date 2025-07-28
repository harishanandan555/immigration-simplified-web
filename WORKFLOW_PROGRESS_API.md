# Workflow Progress API Specification

## Overview
This API endpoint allows saving and retrieving legal firm workflow progress data. This ensures data persistence across the multi-step workflow process and allows for workflow resumption, audit trails, and data recovery.

## Endpoint

### Save Workflow Progress
**POST** `/api/v1/workflows/progress`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "workflowId": "workflow_1730000000000",
  "createdAt": "2025-01-24T10:30:00.000Z",
  "updatedAt": "2025-01-24T10:45:00.000Z",
  "currentStep": 4,
  "status": "in-progress",
  
  "client": {
    "id": "507f1f77bcf86cd799439011",
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "United States"
    },
    "dateOfBirth": "1990-05-15",
    "nationality": "United States",
    "status": "active",
    "createdAt": "2025-01-24T10:30:00.000Z"
  },
  
  "case": {
    "id": "507f1f77bcf86cd799439012",
    "_id": "507f1f77bcf86cd799439012",
    "clientId": "507f1f77bcf86cd799439011",
    "title": "Family-Based Immigration Case",
    "caseNumber": "CASE-2025-001",
    "description": "I-130 petition for spouse",
    "category": "family-based",
    "subcategory": "immediate-relative",
    "visaType": "IR-1",
    "status": "draft",
    "priority": "medium",
    "priorityDate": "2025-01-15",
    "openDate": "2025-01-24",
    "assignedForms": ["I-130"],
    "questionnaires": [],
    "createdAt": "2025-01-24T10:35:00.000Z",
    "dueDate": "2025-02-24T10:35:00.000Z"
  },
  
  "selectedForms": ["I-130"],
  "formCaseIds": {
    "I-130": "MSC2590000001"
  },
  "formTemplates": [
    {
      "name": "I-130",
      "title": "Petition for Alien Relative",
      "description": "Petition for spouse, child, or parent to immigrate to US",
      "category": "Family"
    }
  ],
  
  "selectedQuestionnaire": "6878a91b79e7a2f595f5fdc1",
  "availableQuestionnairesSummary": [
    {
      "id": "6878a91b79e7a2f595f5fdc1",
      "title": "New Immigration Questionnaire",
      "category": "assessment",
      "fieldsCount": 8
    }
  ],
  
  "clientCredentials": {
    "email": "john.doe@example.com",
    "createAccount": true,
    "hasPassword": true
  },
  
  "stepsProgress": [
    {
      "id": "start",
      "title": "Start",
      "description": "New or existing client",
      "index": 0,
      "status": "completed",
      "completedAt": "2025-01-24T10:30:00.000Z"
    },
    {
      "id": "client",
      "title": "Create Client",
      "description": "Add new client information",
      "index": 1,
      "status": "completed", 
      "completedAt": "2025-01-24T10:32:00.000Z"
    },
    {
      "id": "case",
      "title": "Create Case",
      "description": "Set up case details and category",
      "index": 2,
      "status": "completed",
      "completedAt": "2025-01-24T10:35:00.000Z"
    },
    {
      "id": "forms",
      "title": "Select Form",
      "description": "Choose required form for filing",
      "index": 3,
      "status": "completed",
      "completedAt": "2025-01-24T10:40:00.000Z"
    },
    {
      "id": "questionnaire",
      "title": "Assign Questions",
      "description": "Send questionnaire to client",
      "index": 4,
      "status": "current"
    },
    {
      "id": "answers",
      "title": "Collect Answers",
      "description": "Review client responses",
      "index": 5,
      "status": "pending"
    },
    {
      "id": "form-details",
      "title": "Form Details", 
      "description": "Complete form information",
      "index": 6,
      "status": "pending"
    },
    {
      "id": "auto-fill",
      "title": "Auto-fill Forms",
      "description": "Generate completed forms",
      "index": 7,
      "status": "pending"
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow_1730000000000",
    "saved": true,
    "updatedAt": "2025-01-24T10:45:00.000Z"
  },
  "message": "Workflow progress saved successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid workflow data",
    "details": {
      "field": "client.email",
      "issue": "Email format is invalid"
    }
  }
}
```

### Get Workflow Progress
**GET** `/api/v1/workflows/progress/:workflowId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Same structure as save request body
  }
}
```

### List User Workflows
**GET** `/api/v1/workflows/progress`

**Query Parameters:**
- `status`: Filter by workflow status (`in-progress`, `completed`, `abandoned`)
- `clientEmail`: Filter by client email
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        // Workflow summary data
        "workflowId": "workflow_1730000000000",
        "clientName": "John Doe",
        "clientEmail": "john.doe@example.com",
        "currentStep": 4,
        "status": "in-progress",
        "createdAt": "2025-01-24T10:30:00.000Z",
        "updatedAt": "2025-01-24T10:45:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Database Schema

### MongoDB Collection: `workflows`

```javascript
{
  _id: ObjectId,
  workflowId: String, // Unique identifier
  userId: ObjectId, // Reference to the attorney/paralegal
  
  // Workflow metadata
  createdAt: Date,
  updatedAt: Date,
  currentStep: Number,
  status: String, // 'in-progress', 'completed', 'abandoned'
  
  // Client information
  client: {
    id: String,
    name: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: Object,
    dateOfBirth: Date,
    nationality: String,
    status: String,
    createdAt: Date
  },
  
  // Case details
  case: {
    id: String,
    clientId: String,
    title: String,
    caseNumber: String,
    description: String,
    category: String,
    subcategory: String,
    visaType: String,
    status: String,
    priority: String,
    priorityDate: Date,
    openDate: Date,
    assignedForms: [String],
    questionnaires: [String],
    createdAt: Date,
    dueDate: Date
  },
  
  // Form selection
  selectedForms: [String],
  formCaseIds: Object, // Map of form names to case IDs
  formTemplates: [Object],
  
  // Questionnaire data
  selectedQuestionnaire: String,
  availableQuestionnairesSummary: [Object],
  
  // Client credentials (without password)
  clientCredentials: {
    email: String,
    createAccount: Boolean,
    hasPassword: Boolean
  },
  
  // Step progress tracking
  stepsProgress: [Object]
}
```

## Implementation Notes

### Backend Implementation
1. **Authentication**: Requires valid JWT token
2. **Authorization**: User can only access their own workflows
3. **Validation**: Validate all required fields and data types
4. **Indexing**: Index on `userId`, `workflowId`, `client.email`, `status`
5. **Cleanup**: Consider TTL for abandoned workflows (90 days)

### Frontend Usage
```javascript
// Save workflow progress
const saveWorkflowProgress = async () => {
  try {
    const response = await api.post('/api/v1/workflows/progress', workflowData);
    console.log('Workflow saved:', response.data);
  } catch (error) {
    console.error('Save failed:', error);
    // Fallback to localStorage
  }
};

// Resume workflow
const resumeWorkflow = async (workflowId) => {
  try {
    const response = await api.get(`/api/v1/workflows/progress/${workflowId}`);
    // Restore workflow state
    setClient(response.data.client);
    setCaseData(response.data.case);
    setCurrentStep(response.data.currentStep);
    // ... restore other state
  } catch (error) {
    console.error('Resume failed:', error);
  }
};
```

## Benefits

1. **Data Persistence**: No data loss if browser crashes or user navigates away
2. **Workflow Resumption**: Users can continue where they left off
3. **Audit Trail**: Track progress through complex workflows
4. **Data Recovery**: Restore lost work from server backups
5. **Analytics**: Understand where users get stuck in the workflow
6. **Collaboration**: Multiple attorneys can see workflow status

## Fallback Strategy

If the API is unavailable:
1. Save to `localStorage` as `legal-firm-workflows` 
2. Show notification about offline mode
3. Retry API save when connection is restored
4. Sync local data with server when available

This ensures the workflow continues to function even without backend connectivity.

## Complete Field Reference

### Fields Collected Before Questionnaire Assignment

The workflow collects comprehensive data across 4 steps (Steps 0-3) before reaching the questionnaire assignment screen (Step 4). Here's a complete breakdown:

#### Step 0: Start (Selection Only)
- **Choice**: New client vs existing client selection
- **If Existing**: `selectedExistingClientId` from dropdown

#### Step 1: Create Client (12+ Fields)
**Personal Information:**
- `client.name` (String, required) - Full name
- `client.firstName` (String) - Auto-parsed from full name
- `client.lastName` (String) - Auto-parsed from full name
- `client.email` (String, required) - Email address
- `client.phone` (String, required) - Phone number
- `client.dateOfBirth` (Date, required) - Date of birth
- `client.nationality` (String, required) - Nationality

**Address Information:**
- `client.address.street` (String) - Street address
- `client.address.city` (String) - City
- `client.address.state` (String) - State/province
- `client.address.zipCode` (String) - ZIP/postal code
- `client.address.country` (String) - Country (defaults to "United States")

**System Fields (Auto-generated):**
- `client.id` (String) - Generated MongoDB ObjectId
- `client._id` (String) - Duplicate of id for compatibility
- `client.status` (String) - Always "active"
- `client.createdAt` (ISO Date) - Creation timestamp

#### Step 2: Create Case (16+ Fields)
**Case Identification:**
- `case.title` (String, required) - Case title
- `case.caseNumber` (String, optional) - Case number
- `case.description` (String, optional) - Case description

**Case Classification:**
- `case.category` (String, required) - Immigration category
  - Options: "family-based", "employment-based", "citizenship", "asylum", "foia", "other"
- `case.subcategory` (String, required) - Subcategory based on category
- `case.visaType` (String, required) - Visa type (e.g., "IR-1", "H-1B", "L-1")

**Case Management:**
- `case.priority` (String, required) - Priority level
  - Options: "low", "medium", "high"
- `case.status` (String, required) - Case status
  - Options: "draft", "in-progress", "review", "completed"

**Important Dates:**
- `case.priorityDate` (Date, required) - Priority date
- `case.openDate` (Date, required) - Case open date
- `case.dueDate` (Date, optional) - Due date (can be set later)

**System Fields (Auto-generated):**
- `case.id` (String) - Generated MongoDB ObjectId
- `case._id` (String) - Duplicate of id for compatibility
- `case.clientId` (String) - Reference to client ID
- `case.assignedForms` (Array) - Will be populated in Step 3
- `case.questionnaires` (Array) - Will be populated in Step 4
- `case.createdAt` (ISO Date) - Creation timestamp

#### Step 3: Select Form (Form Selection & Case ID)
**Form Selection:**
- `selectedForms` (Array of Strings, required) - Selected form code (single form)
  - Example: ["I-130"]

**Generated Case ID:**
- `formCaseIds` (Object) - Map of form name to USCIS case ID
  - Key: Form code (e.g., "I-130")
  - Value: Generated USCIS case ID (e.g., "MSC2590000001")
  - Auto-generated for the selected form

**Form Template Metadata:**
- `formTemplates` (Array) - Details for selected form
  - Template contains:
    - `name` (String) - Form code
    - `title` (String) - Official form title
    - `description` (String) - Form description
    - `category` (String) - Form category

#### Data Collection Summary
**Total Fields Before Questionnaire Assignment: 30+ fields**

1. **Client Data**: 15 fields (personal info + address + system fields)
2. **Case Data**: 16 fields (identification + classification + management + dates + system fields)
3. **Form Data**: 2+ fields (selectedForms array + formCaseIds object + formTemplates metadata)

#### Workflow Progress Tracking
- `stepsProgress` (Array) - Progress through each workflow step
  - Steps 0-3: "completed" status with completion timestamps
  - Step 4: "current" status (questionnaire assignment)
  - Steps 5-7: "pending" status

This comprehensive data collection ensures that all foundational information is captured before questionnaire assignment, enabling robust workflow progress saving and resumption capabilities.
