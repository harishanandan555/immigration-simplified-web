# Immigration Simplified Web Application - Complete API & Screen Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Authentication System](#authentication-system)
3. [API Endpoints Documentation](#api-endpoints-documentation)
4. [Screen-by-Screen Documentation](#screen-by-screen-documentation)
5. [Legal Workflow System](#legal-workflow-system)
6. [Forms & Questionnaire System](#forms--questionnaire-system)
7. [Document Management](#document-management)
8. [Settings & Administration](#settings--administration)
9. [Data Models & Interfaces](#data-models--interfaces)
10. [Security & Authorization](#security--authorization)
11. [Error Handling & Validation](#error-handling--validation)
12. [Integration Points](#integration-points)

---

## Application Overview

**Application Name:** Immigration Simplified Web (USCIS Case Management App)  
**Purpose:** Comprehensive web application for managing immigration cases, client relationships, document processing, and legal workflows for law firms specializing in immigration services.

### Key Technologies
- **Frontend:** React 18.3.1 with TypeScript 5.5.3
- **Build Tool:** Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.1 + Material-UI 5.15.11
- **State Management:** React Context API + Local State
- **HTTP Client:** Axios 1.8.4
- **PDF Processing:** PDF-lib 1.17.1
- **Charts:** Recharts 2.12.0

### Application Environment
```typescript
const APPCONSTANTS = {
    API_BASE_URL: 
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:5005"
            : "https://immigration-simplified-api.onrender.com"
};
```

---

## Authentication System

### User Roles & Permissions

#### 1. Super Admin
- **Full System Access**
- **Permissions:**
  - User management (create, edit, delete all users)
  - System configuration and settings
  - Database management and maintenance
  - Audit logs access
  - API settings configuration
  - Backup and recovery operations

#### 2. Attorney
- **Law Firm Management**
- **Permissions:**
  - Client management (create, edit, view clients)
  - Case management (all case operations)
  - Document management
  - Workflow management
  - Team management (paralegals and staff)
  - Form templates and questionnaires
  - Billing and subscription management

#### 3. Paralegal
- **Limited Case Management**
- **Permissions:**
  - View and edit assigned cases
  - Document processing and uploads
  - Task management
  - Client communication
  - Form completion assistance

#### 4. Client
- **Personal Access Only**
- **Permissions:**
  - View personal case information
  - Complete assigned questionnaires
  - Upload documents
  - Communicate with attorney
  - View task assignments

### Authentication Endpoints

#### Register Super Admin
```
POST /api/v1/auth/register/superadmin
```
**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "password": "string"
}
```

#### Register Attorney
```
POST /api/v1/auth/register/attorney
```
**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string", 
  "password": "string",
  "superadminId": "string",
  "companyId": "string"
}
```

#### Register User/Client
```
POST /api/v1/auth/register/user
```
**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "role": "client|paralegal",
  "userType": "individual|company",
  "superadminId": "string",
  "attorneyId": "string",
  "companyId": "string"
}
```

#### Login
```
POST /api/v1/auth/login
```
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "string",
    "email": "string",
    "role": "superadmin|attorney|paralegal|client",
    "firstName": "string",
    "lastName": "string",
    "userType": "individual|company"
  }
}
```

#### Get User Profile
```
GET /api/v1/auth/profile
Authorization: Bearer {token}
```

#### Update User Profile
```
PUT /api/v1/auth/profile
Authorization: Bearer {token}
```

---

## API Endpoints Documentation

### Case Management Endpoints

#### Get All Cases
```
GET /api/v1/cases
Authorization: Bearer {token}
Query Parameters:
- status: draft|active|pending|completed|closed
- page: number (default: 1)
- limit: number (default: 10)
- clientId: string (optional)
- assignedTo: string (optional)
```

#### Create New Case
```
POST /api/v1/cases
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "clientId": "string",
  "title": "string",
  "description": "string",
  "category": "family-based|employment-based|humanitarian|citizenship",
  "subcategory": "string",
  "visaType": "string",
  "priority": "low|medium|high|urgent",
  "priorityDate": "date",
  "openDate": "date",
  "assignedForms": ["string"],
  "assignedTo": "string"
}
```

#### Get Case by ID
```
GET /api/v1/cases/:id
Authorization: Bearer {token}
```

#### Update Case
```
PUT /api/v1/cases/:id
Authorization: Bearer {token}
```

#### Add Task to Case
```
POST /api/v1/cases/:id/tasks
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "dueDate": "date",
  "priority": "low|medium|high",
  "assignedTo": "string",
  "type": "review|filing|follow-up|communication"
}
```

### Client Management Endpoints

#### Get All Clients
```
GET /api/v1/clients
Authorization: Bearer {token}
Query Parameters:
- search: string (name, email search)
- status: active|inactive
- page: number
- limit: number
```

#### Create New Client
```
POST /api/v1/clients
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "dateOfBirth": "date",
  "nationality": "string",
  "alienNumber": "string",
  "status": "active|inactive"
}
```

#### Get Client by ID
```
GET /api/v1/clients/:id
Authorization: Bearer {token}
```

#### Update Client
```
PUT /api/v1/clients/:id
Authorization: Bearer {token}
```

#### Get Client Cases
```
GET /api/v1/clients/:id/cases
Authorization: Bearer {token}
```

### Document Management Endpoints

#### Get Documents
```
GET /api/v1/documents
Authorization: Bearer {token}
Query Parameters:
- clientId: string
- caseId: string
- type: string
- status: draft|review|approved|rejected
```

#### Upload Document
```
POST /api/v1/documents/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```
**Form Data:**
```
file: File
clientId: string
caseId: string (optional)
type: string
description: string
```

#### Download Document
```
GET /api/v1/documents/:id/download
Authorization: Bearer {token}
```

#### Preview Document
```
GET /api/v1/documents/:id/preview
Authorization: Bearer {token}
```

### Task Management Endpoints

#### Get All Tasks
```
GET /api/v1/tasks
Authorization: Bearer {token}
Query Parameters:
- assignedTo: string
- status: pending|in-progress|completed|overdue
- priority: low|medium|high
- dueDate: date range
```

#### Create Task
```
POST /api/v1/tasks
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "dueDate": "date",
  "priority": "low|medium|high",
  "assignedTo": "string",
  "caseId": "string",
  "type": "review|filing|follow-up|communication",
  "status": "pending"
}
```

#### Update Task
```
PUT /api/v1/tasks/:id
Authorization: Bearer {token}
```

#### Delete Task
```
DELETE /api/v1/tasks/:id
Authorization: Bearer {token}
```

### Legal Workflow Endpoints

#### Get Workflows
```
GET /api/v1/workflows
Authorization: Bearer {token}
Query Parameters:
- status: draft|in-progress|completed
- clientId: string
- page: number
- limit: number
```

#### Get Workflow Progress
```
GET /api/v1/workflows/progress/:workflowId
Authorization: Bearer {token}
```

#### Save Workflow Progress
```
POST /api/v1/workflows/progress
Authorization: Bearer {token}
```
**Request Body:**
```json
{
  "workflowId": "string",
  "userId": "string",
  "currentStep": "number",
  "status": "in-progress|completed",
  "client": {
    "id": "string",
    "name": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "address": "object",
    "dateOfBirth": "date",
    "nationality": "string"
  },
  "case": {
    "id": "string",
    "title": "string",
    "caseNumber": "string",
    "category": "string",
    "subcategory": "string",
    "status": "string",
    "priority": "string",
    "assignedForms": ["string"]
  },
  "selectedForms": ["string"],
  "formCaseIds": "object",
  "selectedQuestionnaire": "string",
  "steps": "array"
}
```

### Billing Endpoints

#### Get Subscription
```
GET /api/v1/billing/subscription
Authorization: Bearer {token}
```

#### Update Subscription
```
PUT /api/v1/billing/subscription
Authorization: Bearer {token}
```

#### Get Payment History
```
GET /api/v1/billing/payment-history
Authorization: Bearer {token}
```

#### Update Payment Method
```
PUT /api/v1/billing/payment-method
Authorization: Bearer {token}
```

---

## Screen-by-Screen Documentation

### 1. Login Page (`/login`)

**Purpose:** User authentication entry point

**Features:**
- Email/password authentication
- Role-based redirection after login
- Remember me functionality
- Password reset option
- Registration link

**User Flow:**
1. User enters email and password
2. System validates credentials
3. On success, JWT token is stored
4. User redirected based on role:
   - Clients → `/my-questionnaires`
   - Others → `/dashboard`

**API Calls:**
- `POST /api/v1/auth/login`

**State Management:**
```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  rememberMe: false
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

### 2. Dashboard (`/dashboard`)

**Purpose:** Central hub showing application overview and key metrics

**Role-Based Content:**

#### For Clients:
- Personal case status
- Assigned questionnaires
- Upcoming deadlines
- Communication history

#### For Attorneys/Admins:
- Workflow statistics from real API data
- Client overview with IMS integration status
- Case distribution charts
- Task management overview
- Quick action buttons

**Key Features:**
- **Real-time Data:** Integrates with `/api/v1/workflows` endpoint
- **Case Categorization:** Maps workflow data to display categories
- **Interactive Charts:** Case status and type distribution
- **Notification System:** Shows pending questionnaires for clients

**API Calls:**
- `GET /api/v1/workflows` - Fetch workflow data
- `GET /api/v1/tasks` - Get task statistics
- `GET /api/v1/clients` - Client information

**Data Processing:**
```typescript
const fetchClientsAndCasesFromAPI = async () => {
  const response = await api.get('/api/v1/workflows', {
    params: { page: 1, limit: 100 }
  });
  
  const workflows = response.data.data;
  const clientsMap = new Map();
  const casesArray = [];
  
  workflows.forEach(workflow => {
    // Extract client and case data
    if (workflow.client) {
      clientsMap.set(workflow.client.id, workflow.client);
    }
    if (workflow.case) {
      casesArray.push({
        ...workflow.case,
        category: formatCaseCategory(workflow.case.category)
      });
    }
  });
  
  return {
    clients: Array.from(clientsMap.values()),
    cases: casesArray
  };
};
```

### 3. Legal Firm Workflow (`/legal-firm-workflow`)

**Purpose:** Comprehensive multi-step workflow for immigration case management

**Workflow Steps:**
1. **Start** - Choose new or existing client
2. **Client** - Client information management
3. **Case** - Case details and categorization
4. **Forms** - Select required immigration forms
5. **Questionnaire** - Assign questionnaires to clients
6. **Answers** - Review client responses
7. **Form Details** - Complete form information
8. **Generate** - Auto-fill and generate forms

**Key Features:**

#### Immigration Categories:
```typescript
const IMMIGRATION_CATEGORIES = [
  {
    id: 'family-based',
    name: 'Family-Based Immigration',
    subcategories: [
      { id: 'immediate-relative', name: 'Immediate Relative (I-130)', forms: ['I-130', 'I-485'] },
      { id: 'family-preference', name: 'Family Preference Categories', forms: ['I-130', 'I-824'] }
    ]
  },
  {
    id: 'employment-based',
    name: 'Employment-Based Immigration',
    subcategories: [
      { id: 'professional-worker', name: 'Professional Worker (EB-2/EB-3)', forms: ['I-140', 'I-485'] },
      { id: 'temporary-worker', name: 'Temporary Worker', forms: ['I-129', 'I-94'] }
    ]
  }
];
```

#### Workflow State Management:
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [client, setClient] = useState({
  firstName: '', lastName: '', email: '', phone: '',
  address: {}, dateOfBirth: '', nationality: ''
});
const [caseData, setCaseData] = useState({
  category: '', subcategory: '', title: '', description: '',
  priority: 'medium', assignedForms: []
});
const [selectedForms, setSelectedForms] = useState([]);
const [formCaseIds, setFormCaseIds] = useState({});
```

#### Auto-Fill Functionality:
- Searches for existing workflows by client email
- Auto-fills form data from saved workflows
- Generates case IDs for selected forms
- Integrates with questionnaire system

**API Calls:**
- `GET /api/v1/workflows` - Fetch existing workflows
- `POST /api/v1/workflows/progress` - Save workflow progress
- `POST /api/v1/clients` - Create new clients
- `POST /api/v1/cases` - Create cases
- `POST /api/v1/immigration/process` - Submit complete process

### 4. Client Management (`/clients`)

**Purpose:** Comprehensive client information management

**Features:**
- **Client Directory:** Searchable list with filters
- **Workflow Integration:** Enhanced data from workflow API
- **IMS Status Tracking:** Integration status monitoring
- **Quick Actions:** Email, phone, view details
- **Bulk Operations:** Export, import client data

**Client Data Enhancement:**
```typescript
const fetchClientsFromWorkflowAPI = async () => {
  const workflows = await fetchWorkflows();
  const clientsMap = new Map();
  
  workflows.forEach(workflow => {
    if (workflow.client) {
      const client = workflow.client;
      clientsMap.set(client.id, {
        ...client,
        workflowId: workflow._id,
        caseType: workflow.case?.category,
        fromWorkflow: true
      });
    }
  });
  
  return Array.from(clientsMap.values());
};
```

**API Calls:**
- `GET /api/v1/clients` - Standard client data
- `GET /api/v1/workflows` - Enhanced workflow data
- `POST /api/v1/clients` - Create new client
- `PUT /api/v1/clients/:id` - Update client

### 5. Case Management (`/cases`)

**Purpose:** Immigration case tracking and management

**Features:**
- **Case Listing:** Filterable by status, type, priority
- **Search Functionality:** By case number, client name
- **Status Tracking:** Draft, Active, Pending, Completed, Closed
- **Document Association:** Link documents to cases
- **Task Management:** Case-related tasks and deadlines

**Case Types:**
- Family-Based Immigration
- Employment-Based Immigration
- Humanitarian Relief
- Naturalization/Citizenship
- Temporary Status

**API Calls:**
- `GET /api/v1/cases` - List cases
- `POST /api/v1/cases` - Create case
- `PUT /api/v1/cases/:id` - Update case
- `GET /api/v1/cases/:id` - Case details
- `POST /api/v1/cases/:id/tasks` - Add tasks

### 6. Forms Library (`/forms`)

**Purpose:** USCIS form templates and management

**Features:**
- **Form Catalog:** Comprehensive USCIS form library
- **Categories:** Organized by immigration type
- **Preview Functionality:** PDF preview before download
- **Auto-Fill Integration:** Pre-populate with client data
- **Version Control:** Track form updates and revisions

**Common Forms:**
- I-130 (Immediate Relative Petition)
- I-485 (Adjustment of Status)
- I-140 (Employment-Based Petition)
- N-400 (Naturalization Application)
- I-129 (Temporary Worker Petition)

### 7. Questionnaire System

#### My Questionnaires (`/my-questionnaires`) - Client View
**Purpose:** Client interface for assigned questionnaires

**Features:**
- **Assignment List:** Show assigned questionnaires
- **Progress Tracking:** Completion status and progress bars
- **Due Date Management:** Highlight upcoming deadlines
- **Resume Functionality:** Continue incomplete questionnaires

#### Fill Questionnaire (`/questionnaires/fill/:id`)
**Purpose:** Dynamic questionnaire completion interface

**Features:**
- **Dynamic Rendering:** Various field types (text, select, radio, checkbox, file upload)
- **Auto-Save:** Progress saved automatically
- **Validation:** Real-time field validation
- **Conditional Logic:** Show/hide fields based on responses
- **Progress Tracking:** Visual progress indicator

**Field Types Supported:**
```typescript
const FIELD_TYPES = {
  text: 'Text Input',
  email: 'Email',
  phone: 'Phone Number',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  multiselect: 'Multi-Select',
  radio: 'Radio Buttons',
  checkbox: 'Checkboxes',
  textarea: 'Text Area',
  file: 'File Upload',
  signature: 'Digital Signature',
  address: 'Address',
  name: 'Full Name'
};
```

#### Questionnaire Builder (`/settings` → Form Builder)
**Purpose:** Create and manage questionnaires for attorneys

**Features:**
- **Visual Builder:** Drag-and-drop questionnaire creation
- **Field Library:** Pre-built field types for immigration
- **Conditional Logic:** Advanced question branching
- **Preview Mode:** Test questionnaire before deployment
- **Templates:** Immigration-specific questionnaire templates

**Immigration Categories:**
```typescript
const QUESTIONNAIRE_CATEGORIES = {
  'family-based': 'Family-Based Immigration',
  'employment-based': 'Employment-Based Immigration',
  'humanitarian': 'Humanitarian Relief',
  'citizenship': 'Citizenship & Naturalization',
  'temporary': 'Temporary Status',
  'assessment': 'Initial Assessment',
  'general': 'General Information'
};
```

### 8. Document Management (`/documents`)

**Purpose:** Centralized document storage and management

**Features:**
- **Upload System:** Multi-file upload with drag-and-drop
- **Organization:** Folder structure and tagging
- **Version Control:** Track document revisions
- **Preview System:** In-browser document preview
- **Sharing:** Secure document sharing with clients
- **OCR Integration:** Extract text from scanned documents

**Document Types:**
- Identity Documents (passport, driver's license)
- Immigration Documents (visas, green cards)
- Supporting Evidence (birth certificates, marriage certificates)
- Legal Documents (affidavits, court orders)
- Financial Documents (tax returns, bank statements)

**API Calls:**
- `POST /api/v1/documents/upload` - Upload documents
- `GET /api/v1/documents` - List documents
- `GET /api/v1/documents/:id/preview` - Preview document
- `GET /api/v1/documents/:id/download` - Download document

### 9. Settings System (`/settings`)

**Purpose:** Comprehensive application configuration

#### Profile Settings
- Personal information management
- Contact details and preferences
- Profile picture upload
- Password management

#### Organization Settings
- Company information and branding
- Legal entity details
- Contact information
- Business registration details

#### Security Settings
- Password policies and requirements
- Two-factor authentication setup
- Session management
- Device management and logout

#### Email Settings
- Email signature management
- Template configuration
- SMTP settings
- Notification preferences

#### User Management (Attorneys/Admins)
- User creation and role assignment
- Permission management
- Activity monitoring
- Bulk user operations

#### System Administration (Super Admin)
- Database management and optimization
- System performance monitoring
- Audit log management
- Backup and recovery settings
- API configuration and rate limiting

### 10. FOIA Case Management (`/foia-cases`)

**Purpose:** Freedom of Information Act request management

**Features:**
- **Case Creation:** FOIA request submission
- **Status Tracking:** Request progress monitoring
- **Document Management:** Response document organization
- **Timeline Tracking:** Request milestone tracking
- **Public Portal:** Client access to case status

**FOIA Request Types:**
- Immigration Records Request
- Visa Processing Information
- Administrative Records
- Background Check Information

---

## Legal Workflow System

### Workflow Architecture

The Legal Firm Workflow system is the core feature that guides attorneys through the complete immigration case management process.

#### Workflow Steps Definition
```typescript
const NEW_WORKFLOW_STEPS = [
  { id: 'start', title: 'Start', icon: User, description: 'New or existing client' },
  { id: 'client', title: 'Client Info', icon: Users, description: 'Collect client details' },
  { id: 'case', title: 'Create Case', icon: Briefcase, description: 'Set up case details' },
  { id: 'forms', title: 'Select Forms', icon: FileText, description: 'Choose required forms' },
  { id: 'questionnaire', title: 'Assign Questions', icon: ClipboardList, description: 'Send questionnaire' },
  { id: 'answers', title: 'Collect Answers', icon: MessageSquare, description: 'Review responses' },
  { id: 'form-details', title: 'Form Details', icon: FormInput, description: 'Complete form info' },
  { id: 'generate', title: 'Generate Forms', icon: FileCheck, description: 'Auto-fill and download' }
];
```

#### Workflow Data Structure
```typescript
interface WorkflowData {
  workflowId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  status: 'draft' | 'in-progress' | 'completed';
  
  client: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: AddressInfo;
    dateOfBirth: string;
    nationality: string;
    status: string;
  };
  
  case: {
    id: string;
    clientId: string;
    title: string;
    caseNumber: string;
    description: string;
    category: string;
    subcategory: string;
    visaType: string;
    status: string;
    priority: string;
    priorityDate: string;
    openDate: string;
    assignedForms: string[];
    questionnaires: string[];
  };
  
  selectedForms: string[];
  formCaseIds: Record<string, string>;
  selectedQuestionnaire: string;
  formTemplates: FormTemplate[];
  steps: WorkflowStep[];
}
```

### API Integration

#### Save Workflow Progress
```typescript
const saveWorkflowProgress = async (workflowData: WorkflowData) => {
  try {
    const response = await api.post('/api/v1/workflows/progress', workflowData);
    return response.data;
  } catch (error) {
    console.error('Error saving workflow progress:', error);
    throw error;
  }
};
```

#### Fetch Workflows
```typescript
const fetchWorkflows = async (searchParams?: {
  status?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const params = new URLSearchParams();
    if (searchParams?.status) params.append('status', searchParams.status);
    if (searchParams?.clientId) params.append('clientId', searchParams.clientId);
    if (searchParams?.limit) params.append('limit', searchParams.limit.toString());
    if (searchParams?.offset) params.append('offset', searchParams.offset.toString());

    const response = await api.get('/api/v1/workflows', {
      params: Object.fromEntries(params)
    });

    return response.data.workflows || response.data || [];
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return [];
  }
};
```

### Workflow Resumption

The system supports workflow resumption, allowing users to continue where they left off:

```typescript
const resumeWorkflow = async (workflowId: string) => {
  try {
    const workflowData = await getWorkflowProgress(workflowId);
    
    // Restore client data
    if (workflowData.client) {
      setClient(workflowData.client);
    }
    
    // Restore case data
    if (workflowData.case) {
      setCaseData(workflowData.case);
    }
    
    // Restore form selections
    if (workflowData.selectedForms) {
      setSelectedForms(workflowData.selectedForms);
    }
    
    // Restore current step
    if (workflowData.currentStep !== undefined) {
      setCurrentStep(workflowData.currentStep);
    }
    
    return true;
  } catch (error) {
    console.error('Error resuming workflow:', error);
    return false;
  }
};
```

---

## Forms & Questionnaire System

### Questionnaire Builder Architecture

The questionnaire builder is a sophisticated system for creating dynamic forms tailored to immigration processes.

#### Questionnaire Field Types
```typescript
const QUESTIONNAIRE_FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'select', label: 'Dropdown', icon: ChevronDown },
  { type: 'multiselect', label: 'Multi-Select', icon: List },
  { type: 'radio', label: 'Radio Buttons', icon: Circle },
  { type: 'checkbox', label: 'Checkboxes', icon: Square },
  { type: 'textarea', label: 'Text Area', icon: FileText },
  { type: 'file', label: 'File Upload', icon: Upload },
  { type: 'signature', label: 'Signature', icon: PenTool },
  { type: 'address', label: 'Address', icon: MapPin },
  { type: 'name', label: 'Full Name', icon: User }
];
```

#### Questionnaire Data Model
```typescript
interface ImmigrationQuestionnaire {
  id: string;
  title: string;
  description: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'citizenship' | 'temporary' | 'assessment' | 'general';
  subcategory?: string;
  fields: QuestionnaireField[];
  settings: {
    show_progress_bar: boolean;
    allow_back_navigation: boolean;
    auto_save: boolean;
    require_completion?: boolean;
    show_results: boolean;
    theme: 'default' | 'modern' | 'minimal';
  };
  scoring?: {
    maxScore: number;
    passScore: number;
    categories: Array<{
      name: string;
      weight: number;
      threshold: number;
    }>;
  };
  results?: Array<{
    condition: string;
    title: string;
    description: string;
    recommendedForms: string[];
    nextSteps: string[];
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version?: number;
}
```

#### Questionnaire Field Configuration
```typescript
interface QuestionnaireField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  help_text?: string;
  eligibility_impact: 'high' | 'medium' | 'low';
  options?: string[];
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
    file_types?: string[];
    max_file_size?: number;
  };
  conditional_logic?: {
    show_if?: {
      field_id: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    };
    required_if?: {
      field_id: string;
      operator: string;
      value: any;
    };
  };
  order: number;
  width: 'full' | 'half' | 'third' | 'quarter';
  category?: string;
  subcategory?: string;
  weight?: number;
}
```

### Form Auto-Fill System

The form auto-fill system automatically populates USCIS forms with client data from questionnaire responses.

#### I-130 Form Auto-Fill Example
```typescript
const generateI130FormData = (client: Client, responses: QuestionnaireResponse[]) => {
  return {
    // Petitioner Information (Part 1)
    petitioner_family_name: responses.find(r => r.question_id === 'petitioner_last_name')?.answer || '',
    petitioner_given_name: responses.find(r => r.question_id === 'petitioner_first_name')?.answer || '',
    petitioner_middle_name: responses.find(r => r.question_id === 'petitioner_middle_name')?.answer || '',
    
    // Beneficiary Information (Part 2)
    beneficiary_family_name: client.lastName || '',
    beneficiary_given_name: client.firstName || '',
    beneficiary_date_of_birth: client.dateOfBirth || '',
    beneficiary_country_of_birth: responses.find(r => r.question_id === 'country_of_birth')?.answer || '',
    
    // Relationship Information (Part 3)
    relationship_to_petitioner: responses.find(r => r.question_id === 'relationship')?.answer || '',
    
    // Address Information
    beneficiary_current_address: {
      street_number: client.address?.street || '',
      city: client.address?.city || '',
      state: client.address?.state || '',
      zip_code: client.address?.zipCode || '',
      country: client.address?.country || ''
    }
  };
};
```

---

## Document Management

### Document Storage Architecture

The document management system provides comprehensive file handling for immigration cases.

#### Document Categories
```typescript
const DOCUMENT_CATEGORIES = {
  IDENTITY: 'Identity Documents',
  IMMIGRATION: 'Immigration Documents', 
  SUPPORTING: 'Supporting Evidence',
  LEGAL: 'Legal Documents',
  FINANCIAL: 'Financial Documents',
  MEDICAL: 'Medical Documents',
  EDUCATIONAL: 'Educational Documents',
  EMPLOYMENT: 'Employment Documents'
};
```

#### Document Upload API
```typescript
const uploadDocument = async (file: File, metadata: {
  clientId: string;
  caseId?: string;
  category: string;
  description: string;
}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('clientId', metadata.clientId);
  if (metadata.caseId) formData.append('caseId', metadata.caseId);
  formData.append('category', metadata.category);
  formData.append('description', metadata.description);

  const response = await api.post('/api/v1/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
```

#### Document Search and Filtering
```typescript
const searchDocuments = async (criteria: {
  clientId?: string;
  caseId?: string;
  category?: string;
  dateRange?: { start: Date; end: Date };
  searchTerm?: string;
}) => {
  const params = new URLSearchParams();
  
  Object.entries(criteria).forEach(([key, value]) => {
    if (value) {
      if (key === 'dateRange') {
        params.append('startDate', value.start.toISOString());
        params.append('endDate', value.end.toISOString());
      } else {
        params.append(key, value.toString());
      }
    }
  });

  const response = await api.get('/api/v1/documents/search', { params });
  return response.data;
};
```

---

## Settings & Administration

### Settings Architecture

The settings system provides comprehensive configuration for different user roles.

#### Settings Categories
```typescript
const SETTINGS_CATEGORIES = [
  { id: 'profile', name: 'Profile', icon: User, adminOnly: false },
  { id: 'organization', name: 'Organization', icon: Building, adminOnly: false },
  { id: 'notifications', name: 'Notifications', icon: Bell, adminOnly: false },
  { id: 'security', name: 'Security', icon: Lock, adminOnly: false },
  { id: 'email', name: 'Email', icon: Mail, adminOnly: false },
  { id: 'integrations', name: 'Integrations', icon: Globe, adminOnly: false },
  { id: 'billing', name: 'Billing', icon: CreditCard, adminOnly: false },
  { id: 'users', name: 'User Management', icon: Users, adminOnly: false, attorneyAllowed: true },
  { id: 'cases', name: 'Case Settings', icon: Briefcase, adminOnly: false, attorneyAllowed: true },
  { id: 'forms', name: 'Form Templates', icon: FileText, adminOnly: false, attorneyAllowed: true },
  { id: 'form-builder', name: 'Form Builder', icon: Edit, adminOnly: false, attorneyAllowed: true },
  { id: 'reports', name: 'Report Settings', icon: BarChart, adminOnly: false, attorneyAllowed: true },
  { id: 'roles', name: 'Roles & Permissions', icon: Shield, adminOnly: true },
  { id: 'database', name: 'Database Settings', icon: Database, adminOnly: true },
  { id: 'system', name: 'System Settings', icon: Settings, adminOnly: true },
  { id: 'audit', name: 'Audit Logs', icon: Activity, adminOnly: true },
  { id: 'backup', name: 'Backup & Recovery', icon: HardDrive, adminOnly: true },
  { id: 'api', name: 'API Settings', icon: Key, adminOnly: true }
];
```

#### Role-Based Settings Access
```typescript
const getAvailableSettings = (userRole: string) => {
  return SETTINGS_CATEGORIES.filter(category => {
    if (userRole === 'superadmin') return true;
    if (userRole === 'attorney' && category.attorneyAllowed) return true;
    if (!category.adminOnly) return true;
    return false;
  });
};
```

### Billing Management

#### Subscription Plans
```typescript
const SUBSCRIPTION_PLANS = {
  DEMO: {
    name: 'Demo',
    price: 0,
    features: ['Limited cases', 'Basic support'],
    limits: { cases: 5, users: 2, storage: '1GB' }
  },
  BASIC: {
    name: 'Basic',
    price: 99,
    features: ['Up to 50 cases', 'Email support', 'Document management'],
    limits: { cases: 50, users: 5, storage: '10GB' }
  },
  PROFESSIONAL: {
    name: 'Professional', 
    price: 299,
    features: ['Unlimited cases', 'Priority support', 'Advanced reporting'],
    limits: { cases: -1, users: 25, storage: '100GB' }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 999,
    features: ['Custom integrations', 'Dedicated support', 'White labeling'],
    limits: { cases: -1, users: -1, storage: '1TB' }
  }
};
```

---

## Data Models & Interfaces

### Core Data Models

#### User Interface
```typescript
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'superadmin' | 'attorney' | 'paralegal' | 'client';
  userType: 'individual' | 'company';
  phone?: string;
  address?: AddressInfo;
  companyId?: string;
  attorneyId?: string;
  superadminId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Client Interface
```typescript
interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: AddressInfo;
  dateOfBirth: Date;
  nationality: string;
  alienNumber?: string;
  status: 'active' | 'inactive';
  assignedAttorney?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Case Interface
```typescript
interface Case {
  _id: string;
  clientId: string;
  caseNumber: string;
  title: string;
  description: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'citizenship' | 'temporary';
  subcategory: string;
  visaType: string;
  status: 'draft' | 'active' | 'pending' | 'completed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priorityDate?: Date;
  openDate: Date;
  closeDate?: Date;
  assignedForms: string[];
  assignedTo: string;
  tasks: Task[];
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Task Interface
```typescript
interface Task {
  _id: string;
  title: string;
  description: string;
  caseId?: string;
  clientId?: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  type: 'review' | 'filing' | 'follow-up' | 'communication' | 'documentation';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Document Interface
```typescript
interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  clientId: string;
  caseId?: string;
  category: string;
  description: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  uploadedBy: string;
  reviewedBy?: string;
  tags: string[];
  metadata: {
    pageCount?: number;
    extractedText?: string;
    ocrProcessed?: boolean;
  };
  versions: DocumentVersion[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Security & Authorization

### JWT Token Management

#### Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  userType: string;
  companyId?: string;
  iat: number;
  exp: number;
}
```

#### Token Refresh Mechanism
```typescript
const refreshToken = async () => {
  try {
    const response = await api.post('/api/v1/auth/refresh-token');
    const { token } = response.data;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw error;
  }
};
```

### Route Protection

#### Protected Route Component
```typescript
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

### Data Validation

#### Input Validation Rules
```typescript
const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: true,
    pattern: /^\+?[\d\s\-\(\)]{10,15}$/,
    message: 'Please enter a valid phone number'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
  },
  caseNumber: {
    pattern: /^[A-Z]{3}\d{10}$/,
    message: 'Case number must be in format: ABC1234567890'
  }
};
```

---

## Error Handling & Validation

### API Error Handling

#### Centralized Error Handler
```typescript
const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    switch (status) {
      case 401:
        localStorage.removeItem('token');
        window.location.href = '/login';
        return { error: 'Authentication required' };
      case 403:
        return { error: 'Access denied' };
      case 404:
        return { error: 'Resource not found' };
      case 422:
        return { error: 'Validation failed', details: error.response.data.errors };
      case 500:
        return { error: 'Server error occurred' };
      default:
        return { error: message };
    }
  }
  return { error: 'An unexpected error occurred' };
};
```

#### Form Validation Hook
```typescript
const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    const rule = rules[name];
    if (!rule) return '';

    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${name} is required`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `Invalid ${name} format`;
    }

    if (rule.minLength && value.length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `${name} must not exceed ${rule.maxLength} characters`;
    }

    return '';
  };

  const validateForm = (data: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateField, validateForm, setErrors };
};
```

---

## Integration Points

### External API Integrations

#### USCIS Case Status API
```typescript
const checkUscisStatus = async (receiptNumber: string) => {
  try {
    const response = await api.get(`/api/v1/uscis/case-status/${receiptNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error checking USCIS status:', error);
    throw error;
  }
};
```

#### Email Service Integration
```typescript
const sendEmail = async (emailData: {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}) => {
  try {
    const response = await api.post('/api/v1/email/send', emailData);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
```

#### Calendar Integration
```typescript
const createCalendarEvent = async (eventData: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  attendees: string[];
}) => {
  try {
    const response = await api.post('/api/v1/calendar/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};
```

### Webhook Endpoints

#### Case Status Updates
```typescript
const registerWebhook = async (webhookData: {
  url: string;
  events: string[];
  secret: string;
}) => {
  try {
    const response = await api.post('/api/v1/webhooks/register', webhookData);
    return response.data;
  } catch (error) {
    console.error('Error registering webhook:', error);
    throw error;
  }
};
```

---

## Performance Optimization

### Caching Strategy

#### API Response Caching
```typescript
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedResponse = (key: string) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
};

const setCachedResponse = (key: string, data: any, ttl: number = 300000) => {
  apiCache.set(key, { data, timestamp: Date.now(), ttl });
};
```

#### Component Memoization
```typescript
const MemoizedClientList = React.memo(({ clients, onClientSelect }) => {
  return (
    <div className="client-list">
      {clients.map(client => (
        <ClientCard 
          key={client._id} 
          client={client} 
          onClick={() => onClientSelect(client)} 
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.clients.length === nextProps.clients.length &&
         prevProps.clients.every((client, index) => 
           client._id === nextProps.clients[index]._id
         );
});
```

### Bundle Optimization

#### Code Splitting
```typescript
// Lazy load components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const CasesPage = lazy(() => import('../pages/cases/CasesPage'));
const ClientsPage = lazy(() => import('../pages/clients/ClientsPage'));

// Route-based code splitting
<Route path="/dashboard" element={
  <Suspense fallback={<LoadingSpinner />}>
    <Dashboard />
  </Suspense>
} />
```

---

## Conclusion

This comprehensive documentation covers all aspects of the Immigration Simplified Web application, including:

- **Complete API Documentation** with endpoints, request/response formats, and authentication
- **Detailed Screen Documentation** with features, user flows, and state management
- **Legal Workflow System** architecture and implementation
- **Forms & Questionnaire System** with dynamic form building capabilities
- **Document Management** with upload, organization, and sharing features
- **Settings & Administration** with role-based access control
- **Security Implementation** with JWT tokens and route protection
- **Data Models** and interface definitions
- **Error Handling** and validation strategies
- **Integration Points** for external services

The application provides a complete solution for immigration law firms to manage their cases, clients, documents, and workflows efficiently while maintaining security and compliance with immigration regulations.

**Version:** 0.1.0  
**Last Updated:** August 26, 2025  
**Environment:** Development (localhost:3000) / Production (Render)
