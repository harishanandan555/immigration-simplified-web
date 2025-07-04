# API Integration Guide for Immigration Simplified

## Database Schema & Data Models

### User & Authentication

```typescript
interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'attorney' | 'client' | 'super_admin';
  profile: UserProfile;
  organization_id?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Address;
  avatar_url?: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
```

### Questionnaire System

```typescript
interface ImmigrationQuestionnaire {
  id: string;
  title: string;
  description: string;
  category: 'family-based' | 'employment-based' | 'humanitarian' | 'citizenship' | 'temporary' | 'assessment' | 'general';
  created_by: string; // user_id
  organization_id?: string;
  is_active: boolean;
  settings: QuestionnaireSettings;
  fields: QuestionnaireField[];
  created_at: Date;
  updated_at: Date;
  version: number;
}

interface QuestionnaireSettings {
  show_progress_bar: boolean;
  allow_back_navigation: boolean;
  auto_save: boolean;
  show_results: boolean;
  theme: 'default' | 'modern' | 'minimal';
  require_completion: boolean;
  save_partial_responses: boolean;
}

interface QuestionnaireField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  help_text?: string;
  eligibility_impact: 'high' | 'medium' | 'low';
  options?: string[]; // for select/radio/checkbox
  validation?: FieldValidation;
  conditional_logic?: ConditionalLogic;
  order: number;
}

type FieldType = 
  | 'text' | 'email' | 'phone' | 'number' | 'date' 
  | 'textarea' | 'select' | 'multiselect' | 'radio' 
  | 'checkbox' | 'yesno' | 'rating' | 'file' | 'address';

interface FieldValidation {
  min_length?: number;
  max_length?: number;
  pattern?: string; // regex
  min_value?: number;
  max_value?: number;
  accepted_file_types?: string[];
  max_file_size?: number; // in bytes
}

interface ConditionalLogic {
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
}
```

### Questionnaire Responses

```typescript
interface QuestionnaireResponse {
  id: string;
  questionnaire_id: string;
  client_id: string;
  submitted_by?: string; // if attorney submits on behalf
  responses: Record<string, any>; // field_id -> response value
  is_complete: boolean;
  auto_saved_at?: Date;
  submitted_at?: Date;
  assessment_results?: AssessmentResults;
  created_at: Date;
  updated_at: Date;
}

interface AssessmentResults {
  eligibility_score: number; // 0-100
  recommended_forms: string[];
  next_steps: string[];
  estimated_timeline: string;
  potential_issues: string[];
  confidence_level: 'high' | 'medium' | 'low';
  detailed_analysis?: Record<string, any>;
}
```

### Immigration Process Management

```typescript
interface ImmigrationProcess {
  id: string;
  client_id: string;
  assigned_attorney?: string;
  category: string;
  subcategory: string;
  status: 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  current_step: number;
  total_steps: number;
  steps: ProcessStep[];
  questionnaire_response_id?: string;
  estimated_completion?: Date;
  priority: 'high' | 'medium' | 'low';
  created_at: Date;
  updated_at: Date;
}

interface ProcessStep {
  step_number: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  requirements: string[];
  uploaded_documents: string[]; // document_ids
  completed_at?: Date;
  notes?: string;
  assigned_to?: string; // user_id
  due_date?: Date;
}
```

### Document Management

```typescript
interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: DocumentType;
  client_id: string;
  process_id?: string;
  uploaded_by: string;
  file_path: string; // S3 or local path
  thumbnail_path?: string;
  is_verified: boolean;
  verification_notes?: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

type DocumentType = 
  | 'birth_certificate' | 'marriage_certificate' | 'passport' 
  | 'driver_license' | 'social_security_card' | 'tax_return'
  | 'employment_letter' | 'bank_statement' | 'utility_bill'
  | 'filled_form' | 'supporting_evidence' | 'other';
```

### PDF Form System

```typescript
interface PDFForm {
  id: string;
  name: string;
  description: string;
  uscis_form_number: string; // e.g., "I-130"
  category: string;
  version: string;
  page_count: number;
  field_mappings: Record<string, string>; // frontend_field -> pdf_field
  file_path: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface FilledPDFForm {
  id: string;
  original_form_id: string;
  client_id: string;
  filled_by: string;
  input_data: Record<string, any>;
  output_file_path: string;
  fields_filled: number;
  total_fields: number;
  fill_percentage: number;
  validation_errors: string[];
  created_at: Date;
}
```

## API Implementation Patterns

### 1. Authentication Middleware

```typescript
// Express.js middleware example
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Access token required' 
      } 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await getUserById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Invalid or inactive user' 
        } 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: { 
        code: 'FORBIDDEN', 
        message: 'Invalid or expired token' 
      } 
    });
  }
};
```

### 2. Role-Based Access Control

```typescript
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } 
      });
    }

    next();
  };
};

// Usage
app.get('/admin/users', authenticateToken, requireRole(['super_admin']), getUsersHandler);
app.get('/questionnaires', authenticateToken, requireRole(['attorney', 'super_admin']), getQuestionnairesHandler);
```

### 3. Request Validation

```typescript
import Joi from 'joi';

const questionnaireSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000),
  category: Joi.string().valid('family-based', 'employment-based', 'humanitarian', 'citizenship', 'temporary', 'assessment', 'general').required(),
  settings: Joi.object({
    show_progress_bar: Joi.boolean().default(true),
    allow_back_navigation: Joi.boolean().default(true),
    auto_save: Joi.boolean().default(true),
    show_results: Joi.boolean().default(true),
    theme: Joi.string().valid('default', 'modern', 'minimal').default('default')
  }),
  fields: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('text', 'email', 'phone', 'number', 'date', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'yesno', 'rating', 'file', 'address').required(),
      label: Joi.string().min(1).max(200).required(),
      placeholder: Joi.string().max(100),
      required: Joi.boolean().default(false),
      help_text: Joi.string().max(500),
      eligibility_impact: Joi.string().valid('high', 'medium', 'low').default('medium'),
      options: Joi.array().items(Joi.string()).when('type', {
        is: Joi.string().valid('select', 'multiselect', 'radio', 'checkbox'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
    })
  ).min(1).required()
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details
        }
      });
    }
    next();
  };
};
```

### 4. PDF Processing Service

```typescript
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export class PDFFormService {
  async fillForm(formId: string, data: Record<string, any>, clientId: string): Promise<FilledPDFForm> {
    try {
      // Get form metadata
      const form = await this.getFormById(formId);
      if (!form) {
        throw new Error('Form not found');
      }

      // Load PDF
      const pdfBytes = fs.readFileSync(form.file_path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pdfForm = pdfDoc.getForm();

      let fieldsAttempted = 0;
      let fieldsFilled = 0;
      const validationErrors: string[] = [];

      // Fill fields based on mappings
      for (const [frontendField, pdfField] of Object.entries(form.field_mappings)) {
        if (data[frontendField]) {
          try {
            fieldsAttempted++;
            const field = pdfForm.getField(pdfField);
            
            if (field.constructor.name === 'PDFTextField') {
              field.setText(String(data[frontendField]));
              fieldsFilled++;
            } else if (field.constructor.name === 'PDFCheckBox') {
              if (data[frontendField] === true || data[frontendField] === 'true') {
                field.check();
                fieldsFilled++;
              }
            }
          } catch (error) {
            validationErrors.push(`Failed to fill field ${pdfField}: ${error.message}`);
          }
        }
      }

      // Save filled PDF
      const filledPdfBytes = await pdfDoc.save();
      const outputPath = await this.saveFilledPDF(filledPdfBytes, formId, clientId);

      // Create record
      const filledForm: FilledPDFForm = {
        id: generateUUID(),
        original_form_id: formId,
        client_id: clientId,
        filled_by: 'current_user_id', // from context
        input_data: data,
        output_file_path: outputPath,
        fields_filled: fieldsFilled,
        total_fields: fieldsAttempted,
        fill_percentage: (fieldsFilled / fieldsAttempted) * 100,
        validation_errors: validationErrors,
        created_at: new Date()
      };

      await this.saveFilledFormRecord(filledForm);
      return filledForm;

    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
}
```

## Frontend Integration Replacements

### 1. Replace localStorage in QuestionnaireBuilder

**Current localStorage code:**
```typescript
// src/components/settings/QuestionnaireBuilder.tsx
const savedQuestionnaires = JSON.parse(localStorage.getItem('immigration-questionnaires') || '[]');
```

**Replace with API calls:**
```typescript
// services/questionnaireService.ts
export class QuestionnaireService {
  private baseURL = '/api/v1';

  async getQuestionnaires(category?: string): Promise<ImmigrationQuestionnaire[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    const response = await fetch(`${this.baseURL}/questionnaires?${params}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch questionnaires: ${response.statusText}`);
    }

    const data = await response.json();
    return data.questionnaires;
  }

  async saveQuestionnaire(questionnaire: Omit<ImmigrationQuestionnaire, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const response = await fetch(`${this.baseURL}/questionnaires`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(questionnaire)
    });

    if (!response.ok) {
      throw new Error(`Failed to save questionnaire: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }
}
```

### 2. Update PDF Utils Service

**Current code in pdfUtils.ts:**
```typescript
export const downloadOfficialI130PDF = async (): Promise<ArrayBuffer> => {
  const response = await fetch('/forms/i-130.pdf');
  return await response.arrayBuffer();
};
```

**Replace with API integration:**
```typescript
// services/pdfService.ts
export class PDFService {
  private baseURL = '/api/v1';

  async fillForm(formId: string, data: any): Promise<{ download_url: string; preview_url: string }> {
    const response = await fetch(`${this.baseURL}/forms/${formId}/fill`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'PDF processing failed');
    }

    return await response.json();
  }

  async downloadFilledForm(filledFormId: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/forms/filled/${filledFormId}/download`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download filled form');
    }

    return await response.blob();
  }
}
```

### 3. Error Handling Service

```typescript
// services/errorHandler.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any): APIError => {
  if (error.response) {
    const { code, message, details } = error.response.data.error || {};
    return new APIError(
      code || 'UNKNOWN_ERROR',
      message || error.message,
      details,
      error.response.status
    );
  }
  
  return new APIError('NETWORK_ERROR', 'Network request failed');
};

// Usage in components
try {
  await questionnaireService.saveQuestionnaire(questionnaire);
  setSuccess('Questionnaire saved successfully!');
} catch (error) {
  const apiError = handleAPIError(error);
  setError(`Failed to save questionnaire: ${apiError.message}`);
  
  if (apiError.code === 'UNAUTHORIZED') {
    // Redirect to login
    router.push('/login');
  }
}
```

### 4. Real-time Updates with WebSocket

```typescript
// services/websocketService.ts
export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Record<string, Function[]> = {};

  connect(token: string) {
    this.ws = new WebSocket(`wss://api.immigration-simplified.com/ws?token=${token}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Usage in components
useEffect(() => {
  const ws = new WebSocketService();
  ws.connect(authToken);
  
  ws.on('questionnaire.updated', (data) => {
    // Update local state
    setQuestionnaires(prev => 
      prev.map(q => q.id === data.id ? { ...q, ...data } : q)
    );
  });

  ws.on('process.step_completed', (data) => {
    // Show notification
    toast.success(`Step "${data.step_title}" completed for ${data.client_name}`);
  });

  return () => ws.disconnect();
}, [authToken]);
```

## Testing Strategy

### 1. API Testing with Jest

```typescript
// tests/api/questionnaires.test.ts
import request from 'supertest';
import app from '../app';

describe('Questionnaires API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test database and get auth token
    authToken = await getTestAuthToken();
  });

  test('POST /questionnaires should create questionnaire', async () => {
    const questionnaireData = {
      title: 'Test Questionnaire',
      description: 'Test description',
      category: 'family-based',
      fields: [
        {
          type: 'text',
          label: 'Full Name',
          required: true,
          eligibility_impact: 'high'
        }
      ]
    };

    const response = await request(app)
      .post('/api/v1/questionnaires')
      .set('Authorization', `Bearer ${authToken}`)
      .send(questionnaireData)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.message).toBe('Questionnaire created successfully');
  });
});
```

### 2. Frontend Integration Testing

```typescript
// tests/frontend/questionnaireService.test.ts
import { QuestionnaireService } from '../services/questionnaireService';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('QuestionnaireService', () => {
  const service = new QuestionnaireService();

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('should fetch questionnaires successfully', async () => {
    const mockResponse = {
      questionnaires: [
        { id: '1', title: 'Test Questionnaire', category: 'family-based' }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await service.getQuestionnaires();
    
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/questionnaires?',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer')
        })
      })
    );
    
    expect(result).toEqual(mockResponse.questionnaires);
  });
});
```

This integration guide provides you with everything needed to build a robust backend API and seamlessly integrate it with your existing frontend components. 