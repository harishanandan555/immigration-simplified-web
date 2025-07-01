# Immigration Simplified API Documentation

## Overview
This API documentation covers all endpoints needed for the Immigration Simplified web application, including questionnaire management, immigration process handling, PDF form filling, and user management.

## Base URL
```
https://api.immigration-simplified.com/v1
```

## Authentication
All API endpoints require authentication using JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

## Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "request_id": "uuid"
}
```

---

## 1. Authentication Endpoints

### POST /auth/login
Login user and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "attorney|client|super_admin",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890"
    }
  },
  "expires_in": 3600
}
```

### POST /auth/refresh
Refresh JWT token.

**Request:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

---

## 2. Questionnaire Management

### GET /questionnaires
Get all questionnaires for the authenticated user/organization.

**Query Parameters:**
- `category` (optional): Filter by immigration category
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "questionnaires": [
    {
      "id": "uuid",
      "title": "Family-Based Immigration Assessment",
      "description": "Comprehensive questionnaire for family-based immigration cases",
      "category": "family-based",
      "created_by": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
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
          "id": "uuid",
          "type": "text|email|phone|number|date|textarea|select|multiselect|radio|checkbox|yesno|rating|file|address",
          "label": "What is your full name?",
          "placeholder": "Enter your full legal name",
          "required": true,
          "help_text": "Enter your name as it appears on your passport",
          "eligibility_impact": "high|medium|low",
          "options": ["Option 1", "Option 2"],
          "validation": {
            "min_length": 2,
            "max_length": 100,
            "pattern": "regex_pattern"
          },
          "conditional_logic": {
            "show_if": {
              "field_id": "uuid",
              "operator": "equals|not_equals|contains|greater_than|less_than",
              "value": "some_value"
            }
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

### POST /questionnaires
Create a new questionnaire.

**Request:**
```json
{
  "title": "Family-Based Immigration Assessment",
  "description": "Comprehensive questionnaire for family-based immigration cases",
  "category": "family-based",
  "settings": {
    "show_progress_bar": true,
    "allow_back_navigation": true,
    "auto_save": true,
    "show_results": true,
    "theme": "default"
  },
  "fields": [
    {
      "type": "text",
      "label": "What is your full name?",
      "placeholder": "Enter your full legal name",
      "required": true,
      "help_text": "Enter your name as it appears on your passport",
      "eligibility_impact": "high"
    }
  ]
}
```

### GET /questionnaires/{id}
Get a specific questionnaire by ID.

### PUT /questionnaires/{id}
Update an existing questionnaire.

### DELETE /questionnaires/{id}
Delete a questionnaire.

### POST /questionnaires/{id}/duplicate
Duplicate an existing questionnaire.

---

## 3. Questionnaire Responses

### POST /questionnaires/{id}/responses
Submit a questionnaire response.

**Request:**
```json
{
  "client_id": "uuid",
  "responses": {
    "field_id_1": "John Doe",
    "field_id_2": "john@example.com",
    "field_id_3": ["option1", "option2"],
    "field_id_4": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    }
  },
  "auto_save": false
}
```

**Response:**
```json
{
  "response_id": "uuid",
  "assessment_results": {
    "eligibility_score": 85,
    "recommended_forms": ["I-130", "I-485"],
    "next_steps": [
      "Gather supporting documents",
      "Schedule biometrics appointment"
    ],
    "estimated_timeline": "6-12 months",
    "potential_issues": [
      "Need updated passport photos",
      "Birth certificate translation required"
    ]
  },
  "message": "Response submitted successfully"
}
```

---

## 4. Immigration Process Management

### GET /immigration-categories
Get all available immigration categories and subcategories.

**Response:**
```json
{
  "categories": [
    {
      "id": "family-based",
      "name": "Family-Based Immigration",
      "description": "Immigration based on family relationships",
      "subcategories": [
        {
          "id": "immediate-relatives",
          "name": "Immediate Relatives of U.S. Citizens",
          "description": "Spouses, children, and parents of U.S. citizens",
          "forms": ["I-130", "I-485"],
          "documents": [
            "Birth certificate",
            "Marriage certificate",
            "Passport photos"
          ],
          "processing_time": "8-12 months",
          "eligibility_requirements": [
            "Petitioner must be U.S. citizen",
            "Valid relationship must be proven"
          ]
        }
      ]
    }
  ]
}
```

### POST /immigration-process
Start a new immigration process for a client.

### GET /immigration-process/{id}
Get immigration process status and details.

---

## 5. PDF Form Management

### GET /forms
Get available PDF forms.

### POST /forms/{form_id}/fill
Fill a PDF form with provided data.

**Request:**
```json
{
  "data": {
    "petitionerFamilyName": "Smith",
    "petitionerGivenName": "John",
    "petitionerMiddleName": "Michael",
    "petitionerBirthCity": "New York",
    "petitionerBirthCountry": "United States",
    "petitionerDateOfBirth": "01/15/1980",
    "petitionerSex": "Male",
    "petitionerMailingAddress": "123 Main St, New York, NY 10001",
    "petitionerCurrentStatus": "U.S. Citizen",
    "petitionerDaytimePhone": "(555) 123-4567",
    "petitionerEmail": "john.smith@email.com",
    "beneficiaryFamilyName": "Doe",
    "beneficiaryGivenName": "Jane",
    "beneficiaryDateOfBirth": "03/22/1985",
    "relationshipType": "Spouse"
  },
  "auto_save": true,
  "client_id": "uuid"
}
```

**Response:**
```json
{
  "filled_form_id": "uuid",
  "download_url": "/forms/filled/uuid/download",
  "preview_url": "/forms/filled/uuid/preview",
  "fields_filled": 42,
  "total_fields": 85,
  "fill_percentage": 49.4
}
```

---

## 6. Document Management

### POST /documents/upload
Upload a document.

### GET /documents/{id}
Get document metadata.

### GET /documents/{id}/download
Download a document.

### DELETE /documents/{id}
Delete a document.

---

## 7. Client Management

### GET /clients
Get all clients (for attorneys/admins).

### POST /clients
Create a new client.

### GET /clients/{id}
Get client details.

### PUT /clients/{id}
Update client information.

---

## 8. Settings Management

### GET /settings
Get user/organization settings.

### PUT /settings
Update settings.

---

## Integration Notes

### Frontend Integration Points

1. **Replace localStorage calls** in `QuestionnaireBuilder.tsx` with API calls
2. **Update PDF filling** in `pdfUtils.ts` to use API endpoints
3. **Implement real-time updates** using WebSocket connections
4. **Add error handling** for all API responses
5. **Implement caching** for frequently accessed data

### Authentication Flow

1. Use JWT tokens for API authentication
2. Implement token refresh mechanism
3. Store tokens securely (httpOnly cookies recommended)
4. Handle token expiration gracefully

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Data validation failed |
| `PDF_PROCESSING_ERROR` | PDF form processing failed |
| `UPLOAD_ERROR` | File upload failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

This API documentation provides a comprehensive foundation for building the backend services needed to support all current frontend functionality. 