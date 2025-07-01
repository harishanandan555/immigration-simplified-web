# Questionnaire API Specification

## Overview
Complete API specification for questionnaire management system without URL dependencies.

## Authentication
All endpoints require Bearer token authentication:
```http
Authorization: Bearer {jwt_token}
```

## Data Models

### QuestionnaireField
```json
{
  "id": "string",
  "type": "text|email|phone|number|date|textarea|select|multiselect|radio|checkbox|yesno|rating|file|address",
  "label": "string",
  "placeholder": "string",
  "required": "boolean",
  "help_text": "string",
  "eligibility_impact": "high|medium|low",
  "options": ["string"],
  "validation": {
    "min_length": "number",
    "max_length": "number",
    "pattern": "string",
    "min_value": "number",
    "max_value": "number"
  },
  "conditional_logic": {
    "show_if": {
      "field_id": "string",
      "operator": "equals|not_equals|contains|greater_than|less_than",
      "value": "any"
    }
  },
  "order": "number"
}
```

### ImmigrationQuestionnaire
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "family-based|employment-based|humanitarian|citizenship|temporary|assessment|general",
  "created_by": "string",
  "organization_id": "string",
  "is_active": "boolean",
  "settings": {
    "show_progress_bar": "boolean",
    "allow_back_navigation": "boolean",
    "auto_save": "boolean",
    "show_results": "boolean",
    "theme": "default|modern|minimal"
  },
  "fields": ["QuestionnaireField"],
  "created_at": "string",
  "updated_at": "string",
  "version": "number"
}
```

---

## API Endpoints

### 1. Get All Questionnaires

**Method:** `GET`  
**Endpoint:** `/questionnaires`

**Query Parameters:**
- `category` (optional): Filter by immigration category
- `is_active` (optional): Filter by active status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search in title and description

**Response (200):**
```json
{
  "questionnaires": [
    {
      "id": "q_12345678-1234-1234-1234-123456789abc",
      "title": "Family-Based Immigration Assessment",
      "description": "Comprehensive questionnaire for immediate relatives",
      "category": "family-based",
      "created_by": "u_87654321-4321-4321-4321-cba987654321",
      "organization_id": "org_11111111-1111-1111-1111-111111111111",
      "is_active": true,
      "settings": {
        "show_progress_bar": true,
        "allow_back_navigation": true,
        "auto_save": true,
        "show_results": true,
        "theme": "default"
      },
      "fields": [
        {
          "id": "f_11111111-1111-1111-1111-111111111111",
          "type": "text",
          "label": "What is your full legal name?",
          "placeholder": "Enter your full name as it appears on passport",
          "required": true,
          "help_text": "This should match exactly with your passport",
          "eligibility_impact": "high",
          "validation": {
            "min_length": 2,
            "max_length": 100
          },
          "order": 1
        }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z",
      "version": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

### 2. Get Questionnaire by ID

**Method:** `GET`  
**Endpoint:** `/questionnaires/{id}`

**Response (200):**
```json
{
  "id": "q_12345678-1234-1234-1234-123456789abc",
  "title": "Family-Based Immigration Assessment",
  "description": "Comprehensive questionnaire for immediate relatives",
  "category": "family-based",
  "created_by": "u_87654321-4321-4321-4321-cba987654321",
  "is_active": true,
  "settings": {
    "show_progress_bar": true,
    "allow_back_navigation": true,
    "auto_save": true,
    "show_results": true,
    "theme": "default"
  },
  "fields": [],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z",
  "version": 2
}
```

### 3. Create Questionnaire

**Method:** `POST`  
**Endpoint:** `/questionnaires`

**Request Body:**
```json
{
  "title": "Employment-Based Immigration Assessment",
  "description": "Questionnaire for H1-B and EB visa applications",
  "category": "employment-based",
  "settings": {
    "show_progress_bar": true,
    "allow_back_navigation": true,
    "auto_save": true,
    "show_results": true,
    "theme": "modern"
  },
  "fields": [
    {
      "type": "text",
      "label": "What is your current job title?",
      "placeholder": "e.g., Software Engineer",
      "required": true,
      "help_text": "Enter your official job title as stated in your employment contract",
      "eligibility_impact": "medium",
      "validation": {
        "min_length": 2,
        "max_length": 100
      },
      "order": 1
    },
    {
      "type": "number",
      "label": "What is your annual salary in USD?",
      "placeholder": "75000",
      "required": true,
      "help_text": "Enter your gross annual salary before taxes",
      "eligibility_impact": "high",
      "validation": {
        "min_value": 0,
        "max_value": 10000000
      },
      "order": 2
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "q_98765432-9876-9876-9876-987654321098",
  "message": "Questionnaire created successfully",
  "version": 1
}
```

### 4. Update Questionnaire

**Method:** `PUT`  
**Endpoint:** `/questionnaires/{id}`

**Request Body:** Same structure as create questionnaire

**Response (200):**
```json
{
  "id": "q_12345678-1234-1234-1234-123456789abc",
  "message": "Questionnaire updated successfully",
  "version": 3
}
```

### 5. Delete Questionnaire

**Method:** `DELETE`  
**Endpoint:** `/questionnaires/{id}`

**Response (200):**
```json
{
  "message": "Questionnaire deleted successfully"
}
```

### 6. Duplicate Questionnaire

**Method:** `POST`  
**Endpoint:** `/questionnaires/{id}/duplicate`

**Request Body:**
```json
{
  "title": "Family-Based Immigration Assessment (Copy)",
  "description": "Modified version for complex cases"
}
```

**Response (201):**
```json
{
  "id": "q_11111111-2222-3333-4444-555555555555",
  "message": "Questionnaire duplicated successfully",
  "original_id": "q_12345678-1234-1234-1234-123456789abc"
}
```

---

## Questionnaire Responses

### 7. Submit Questionnaire Response

**Method:** `POST`  
**Endpoint:** `/questionnaires/{id}/responses`

**Request Body:**
```json
{
  "client_id": "c_12345678-1234-1234-1234-123456789abc",
  "responses": {
    "f_11111111-1111-1111-1111-111111111111": "John Michael Smith",
    "f_22222222-2222-2222-2222-222222222222": "john.smith@email.com",
    "f_33333333-3333-3333-3333-333333333333": "Spouse",
    "f_44444444-4444-4444-4444-444444444444": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "f_55555555-5555-5555-5555-555555555555": ["JavaScript", "Python", "Java"],
    "f_66666666-6666-6666-6666-666666666666": true
  },
  "auto_save": false,
  "notes": "Completed during consultation meeting"
}
```

**Response (201):**
```json
{
  "response_id": "r_87654321-8765-8765-8765-876543218765",
  "assessment_results": {
    "eligibility_score": 92,
    "recommended_forms": ["I-130", "I-485", "I-864"],
    "next_steps": [
      "Gather required documents",
      "Schedule biometrics appointment",
      "Prepare for interview"
    ],
    "estimated_timeline": "8-12 months",
    "potential_issues": [
      "Birth certificate needs certified translation",
      "Financial documents older than 6 months"
    ],
    "confidence_level": "high"
  },
  "message": "Response submitted successfully"
}
```

### 8. Get Questionnaire Responses

**Method:** `GET`  
**Endpoint:** `/questionnaires/{id}/responses`

**Query Parameters:**
- `client_id` (optional): Filter by specific client
- `submitted_after` (optional): Filter by submission date (ISO string)
- `submitted_before` (optional): Filter by submission date (ISO string)
- `is_complete` (optional): Filter by completion status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "responses": [
    {
      "id": "r_87654321-8765-8765-8765-876543218765",
      "questionnaire_id": "q_12345678-1234-1234-1234-123456789abc",
      "client_id": "c_12345678-1234-1234-1234-123456789abc",
      "submitted_by": "u_87654321-4321-4321-4321-cba987654321",
      "responses": {},
      "is_complete": true,
      "submitted_at": "2024-01-25T16:30:00Z",
      "assessment_results": {},
      "created_at": "2024-01-25T15:00:00Z",
      "updated_at": "2024-01-25T16:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 9. Get Single Response

**Method:** `GET`  
**Endpoint:** `/responses/{id}`

**Response (200):**
```json
{
  "id": "r_87654321-8765-8765-8765-876543218765",
  "questionnaire_id": "q_12345678-1234-1234-1234-123456789abc",
  "client_id": "c_12345678-1234-1234-1234-123456789abc",
  "submitted_by": "u_87654321-4321-4321-4321-cba987654321",
  "responses": {
    "f_11111111-1111-1111-1111-111111111111": "John Michael Smith",
    "f_22222222-2222-2222-2222-222222222222": "john.smith@email.com"
  },
  "is_complete": true,
  "auto_saved_at": "2024-01-25T16:25:00Z",
  "submitted_at": "2024-01-25T16:30:00Z",
  "assessment_results": {
    "eligibility_score": 92,
    "recommended_forms": ["I-130", "I-485"],
    "next_steps": ["Gather documents"],
    "estimated_timeline": "8-12 months",
    "potential_issues": []
  },
  "created_at": "2024-01-25T15:00:00Z",
  "updated_at": "2024-01-25T16:30:00Z"
}
```

### 10. Update Response (Auto-save)

**Method:** `PUT`  
**Endpoint:** `/responses/{id}`

**Request Body:**
```json
{
  "responses": {
    "f_11111111-1111-1111-1111-111111111111": "John Michael Smith",
    "f_22222222-2222-2222-2222-222222222222": "john.smith@email.com"
  },
  "is_complete": false
}
```

**Response (200):**
```json
{
  "message": "Response updated successfully",
  "auto_saved_at": "2024-01-25T16:45:00Z"
}
```

---

## Error Responses

### Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    }
  },
  "timestamp": "2024-01-25T10:30:00Z",
  "request_id": "req_12345678-1234-1234-1234-123456789abc"
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Questionnaire not found |
| 409 | `CONFLICT` | Questionnaire title already exists |
| 422 | `INVALID_FIELD_TYPE` | Invalid field type or configuration |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Example Error Responses

**Validation Error (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for questionnaire fields",
    "details": {
      "fields[0].label": "Label is required",
      "fields[2].options": "Options are required for select field type"
    }
  },
  "timestamp": "2024-01-25T10:30:00Z",
  "request_id": "req_12345678-1234-1234-1234-123456789abc"
}
```

**Not Found Error (404):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Questionnaire not found",
    "details": {
      "questionnaire_id": "q_12345678-1234-1234-1234-123456789abc"
    }
  },
  "timestamp": "2024-01-25T10:30:00Z",
  "request_id": "req_12345678-1234-1234-1234-123456789abc"
}
```

---

## Field Type Specifications

### Text Fields
- **Types:** `text`, `email`, `phone`
- **Validation:** `min_length`, `max_length`, `pattern`
- **Response Format:** String

### Number Fields
- **Type:** `number`
- **Validation:** `min_value`, `max_value`
- **Response Format:** Number

### Date Fields
- **Type:** `date`
- **Response Format:** ISO date string (YYYY-MM-DD)

### Selection Fields
- **Types:** `select`, `multiselect`, `radio`, `checkbox`
- **Required:** `options` array
- **Response Format:** 
  - `select`, `radio`: String (selected option)
  - `multiselect`, `checkbox`: Array of strings

### Boolean Fields
- **Type:** `yesno`
- **Response Format:** Boolean (true/false)

### File Fields
- **Type:** `file`
- **Response Format:** Object with file metadata
```json
{
  "filename": "document.pdf",
  "size": 1024000,
  "type": "application/pdf",
  "upload_id": "file_12345678-1234-1234-1234-123456789abc"
}
```

### Address Fields
- **Type:** `address`
- **Response Format:** Object with address components
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "USA"
}
```

### Rating Fields
- **Type:** `rating`
- **Validation:** `min_value`, `max_value` (default 1-5)
- **Response Format:** Number

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per user
- **Headers Included:**
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

---

## Implementation Notes

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
Accept: application/json
```

### Response Headers
```http
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Pagination
All list endpoints support pagination with consistent response format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

### Timestamps
All timestamps are in ISO 8601 format with UTC timezone:
```
2024-01-25T16:30:00Z
```

### ID Format
All IDs use prefixed UUIDs for type identification:
- Questionnaires: `q_` prefix
- Fields: `f_` prefix  
- Responses: `r_` prefix
- Users: `u_` prefix
- Organizations: `org_` prefix 