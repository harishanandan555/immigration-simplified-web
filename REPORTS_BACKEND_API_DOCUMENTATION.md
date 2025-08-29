# Reports Backend API Documentation

## Overview

This document outlines the backend API endpoints for the Reports feature in the Immigration-Simplified application. The API provides comprehensive reporting capabilities including data retrieval, report generation, scheduling, and export functionality.

## Base URL

```
https://api.immigration-simplified.com/api/v1
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Report Management

#### 1.1 Get All Reports
```http
GET /reports
```

**Query Parameters:**
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of items per page (default: 10)
- `type` (string, optional): Filter by report type
- `category` (string, optional): Filter by category
- `isActive` (boolean, optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "reports": [
      {
        "_id": "report_id",
        "name": "Monthly Case Summary",
        "type": "case",
        "category": "monthly",
        "description": "Monthly summary of all cases",
        "parameters": {
          "dateRange": {
            "start": "2025-01-01",
            "end": "2025-01-31"
          },
          "filters": {
            "status": ["active", "pending"],
            "type": ["immigration", "citizenship"]
          }
        },
        "format": "PDF",
        "isActive": true,
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z",
        "createdBy": "user_id"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

#### 1.2 Get Report by ID
```http
GET /reports/:id
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "_id": "report_id",
    "name": "Monthly Case Summary",
    "type": "case",
    "category": "monthly",
    "description": "Monthly summary of all cases",
    "parameters": {
      "dateRange": {
        "start": "2025-01-01",
        "end": "2025-01-31"
      },
      "filters": {
        "status": ["active", "pending"],
        "type": ["immigration", "citizenship"]
      }
    },
    "schedule": {
      "frequency": "monthly",
      "time": "09:00",
      "dayOfMonth": 1,
      "timezone": "America/New_York",
      "isActive": true
    },
    "recipients": ["user1@example.com", "user2@example.com"],
    "format": "PDF",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "createdBy": "user_id"
  }
}
```

#### 1.3 Create New Report
```http
POST /reports
```

**Request Body:**
```json
{
  "name": "Weekly Client Summary",
  "type": "client",
  "category": "weekly",
  "description": "Weekly summary of client activities",
  "parameters": {
    "dateRange": {
      "start": "2025-01-13",
      "end": "2025-01-19"
    },
    "filters": {
      "status": ["active"],
      "type": ["individual", "corporate"]
    },
    "grouping": ["status", "type"],
    "sorting": [
      {
        "field": "lastActivity",
        "direction": "desc"
      }
    ]
  },
  "schedule": {
    "frequency": "weekly",
    "time": "08:00",
    "dayOfWeek": 1,
    "timezone": "America/New_York",
    "isActive": true
  },
  "recipients": ["manager@example.com"],
  "format": "Excel",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "status": 201,
  "data": {
    "_id": "new_report_id",
    "name": "Weekly Client Summary",
    "type": "client",
    "category": "weekly",
    "description": "Weekly summary of client activities",
    "parameters": {
      "dateRange": {
        "start": "2025-01-13",
        "end": "2025-01-19"
      },
      "filters": {
        "status": ["active"],
        "type": ["individual", "corporate"]
      },
      "grouping": ["status", "type"],
      "sorting": [
        {
          "field": "lastActivity",
          "direction": "desc"
        }
      ]
    },
    "schedule": {
      "frequency": "weekly",
      "time": "08:00",
      "dayOfWeek": 1,
      "timezone": "America/New_York",
      "isActive": true
    },
    "recipients": ["manager@example.com"],
    "format": "Excel",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "createdBy": "user_id"
  }
}
```

#### 1.4 Update Report
```http
PUT /reports/:id
```

**Request Body:**
```json
{
  "name": "Updated Weekly Client Summary",
  "description": "Updated description",
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "_id": "report_id",
    "name": "Updated Weekly Client Summary",
    "type": "client",
    "category": "weekly",
    "description": "Updated description",
    "parameters": {
      "dateRange": {
        "start": "2025-01-13",
        "end": "2025-01-19"
      },
      "filters": {
        "status": ["active"],
        "type": ["individual", "corporate"]
      }
    },
    "format": "Excel",
    "isActive": false,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T11:00:00Z",
    "createdBy": "user_id"
  }
}
```

#### 1.5 Delete Report
```http
DELETE /reports/:id
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Report deleted successfully"
}
```

### 2. Report Data Retrieval

#### 2.1 Get Case Report Data
```http
POST /reports/cases/data
```

**Request Body:**
```json
{
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "filters": {
    "status": ["active", "pending"],
    "type": ["immigration", "citizenship"],
    "priority": ["high", "medium"],
    "assignedTo": ["attorney1", "attorney2"]
  },
  "grouping": ["status", "type"],
  "sorting": [
    {
      "field": "openDate",
      "direction": "desc"
    }
  ],
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "caseNumber": "CASE-001",
      "title": "Immigration Application",
      "status": "active",
      "type": "immigration",
      "priority": "high",
      "clientName": "John Doe",
      "assignedTo": "Attorney Smith",
      "openDate": "2025-01-15",
      "lastUpdated": "2025-01-20",
      "documentsCount": 15,
      "tasksCount": 8,
      "completionPercentage": 65
    }
  ]
}
```

#### 2.2 Get Client Report Data
```http
POST /reports/clients/data
```

**Request Body:**
```json
{
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "filters": {
    "status": ["active"],
    "type": ["individual", "corporate"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "clientId": "CLIENT-001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "status": "active",
      "caseCount": 3,
      "totalDocuments": 25,
      "lastActivity": "2025-01-20",
      "registrationDate": "2024-06-15",
      "immigrationStatus": "pending"
    }
  ]
}
```

#### 2.3 Get Document Report Data
```http
POST /reports/documents/data
```

**Request Body:**
```json
{
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "filters": {
    "type": ["pdf", "image"],
    "status": ["verified", "pending"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "documentId": "DOC-001",
      "name": "Passport Copy",
      "type": "image",
      "size": "2.5MB",
      "status": "verified",
      "uploadedBy": "John Doe",
      "uploadedAt": "2025-01-15",
      "clientName": "John Doe",
      "caseNumber": "CASE-001",
      "tags": ["passport", "identification"],
      "verificationStatus": "verified"
    }
  ]
}
```

#### 2.4 Get User Report Data
```http
POST /reports/users/data
```

**Request Body:**
```json
{
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "filters": {
    "role": ["attorney", "paralegal"],
    "status": ["active"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "userId": "USER-001",
      "name": "Attorney Smith",
      "email": "smith@example.com",
      "role": "attorney",
      "status": "active",
      "lastLogin": "2025-01-20T09:00:00Z",
      "caseCount": 12,
      "documentCount": 45,
      "taskCount": 18,
      "performanceScore": 92
    }
  ]
}
```

#### 2.5 Get Financial Report Data
```http
POST /reports/financial/data
```

**Request Body:**
```json
{
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "filters": {
    "type": ["revenue", "expense"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "period": "January 2025",
      "revenue": 25000,
      "expenses": 15000,
      "profit": 10000,
      "caseRevenue": 20000,
      "subscriptionRevenue": 5000,
      "outstandingInvoices": 8000,
      "paymentHistory": [
        {
          "invoiceId": "INV-001",
          "amount": 5000,
          "status": "paid",
          "dueDate": "2025-01-15",
          "paidDate": "2025-01-10",
          "clientName": "John Doe"
        }
      ]
    }
  ]
}
```

### 3. Report Generation

#### 3.1 Generate Report
```http
POST /reports/generate
```

**Request Body:**
```json
{
  "reportId": "report_id",
  "parameters": {
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    },
    "filters": {
      "status": ["active"],
      "type": ["immigration"]
    }
  },
  "format": "PDF",
  "includeCharts": true,
  "includeSummary": true
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "reportData": {
      "reportId": "report_id",
      "generatedAt": "2025-01-20T10:00:00Z",
      "data": [...],
      "summary": {
        "totalRecords": 150,
        "filteredRecords": 75,
        "dateRange": "2025-01-01 to 2025-01-31",
        "filters": ["status: active", "type: immigration"],
        "generatedBy": "user_id"
      },
      "metadata": {
        "version": "1.0.0",
        "dataSource": "cases_collection",
        "lastUpdated": "2025-01-20T10:00:00Z",
        "recordCount": 75
      }
    },
    "downloadUrl": "https://api.example.com/reports/download/temp_token",
    "expiresAt": "2025-01-21T10:00:00Z"
  }
}
```

#### 3.2 Download Report
```http
GET /reports/:id/download
```

**Query Parameters:**
- `format` (string, required): Output format (PDF, Excel, CSV, HTML)

**Response:** Binary file (blob)

### 4. Report Scheduling

#### 4.1 Schedule Report
```http
POST /reports/:id/schedule
```

**Request Body:**
```json
{
  "frequency": "weekly",
  "time": "09:00",
  "dayOfWeek": 1,
  "timezone": "America/New_York",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "_id": "report_id",
    "schedule": {
      "frequency": "weekly",
      "time": "09:00",
      "dayOfWeek": 1,
      "timezone": "America/New_York",
      "isActive": true
    }
  }
}
```

#### 4.2 Get Scheduled Reports
```http
GET /reports/scheduled
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "_id": "report_id",
      "name": "Weekly Summary",
      "schedule": {
        "frequency": "weekly",
        "time": "09:00",
        "dayOfWeek": 1,
        "timezone": "America/New_York",
        "isActive": true
      }
    }
  ]
}
```

### 5. Report Analytics

#### 5.1 Get Report Analytics
```http
POST /reports/:id/analytics
```

**Request Body:**
```json
{
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "metrics": ["generation_count", "download_count", "user_engagement"]
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "generationCount": 45,
    "downloadCount": 38,
    "userEngagement": 0.84,
    "averageGenerationTime": 2.3,
    "popularFormats": ["PDF", "Excel"],
    "topUsers": ["user1", "user2", "user3"]
  }
}
```

### 6. Report Templates

#### 6.1 Get Report Templates
```http
GET /reports/templates
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "_id": "template_id",
      "name": "Standard Case Report",
      "type": "case",
      "category": "standard",
      "description": "Standard template for case reports",
      "parameters": {
        "defaultFilters": {
          "status": ["active", "pending"]
        },
        "defaultGrouping": ["status", "type"],
        "defaultSorting": [
          {
            "field": "openDate",
            "direction": "desc"
          }
        ]
      },
      "format": "PDF",
      "isActive": true
    }
  ]
}
```

#### 6.2 Create Report Template
```http
POST /reports/templates
```

**Request Body:**
```json
{
  "name": "Custom Client Report",
  "type": "client",
  "category": "custom",
  "description": "Custom template for client reports",
  "parameters": {
    "defaultFilters": {
      "status": ["active"]
    },
    "defaultGrouping": ["status"],
    "defaultSorting": [
      {
        "field": "lastActivity",
        "direction": "desc"
      }
    ]
  },
  "format": "Excel",
  "isActive": true
}
```

### 7. Report Categories

#### 7.1 Get Report Categories
```http
GET /reports/categories
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": "monthly",
      "name": "Monthly Reports",
      "description": "Reports generated monthly",
      "icon": "calendar",
      "color": "#3B82F6"
    },
    {
      "id": "weekly",
      "name": "Weekly Reports",
      "description": "Reports generated weekly",
      "icon": "clock",
      "color": "#10B981"
    }
  ]
}
```

#### 7.2 Get Report Types
```http
GET /reports/types
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": "case",
      "name": "Case Reports",
      "description": "Reports related to legal cases",
      "icon": "briefcase",
      "color": "#8B5CF6"
    },
    {
      "id": "client",
      "name": "Client Reports",
      "description": "Reports related to clients",
      "icon": "users",
      "color": "#F59E0B"
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "status": 400,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Report generation**: 10 requests per minute
- **Data export**: 5 requests per minute

## Pagination

All list endpoints support pagination with the following parameters:

- **page**: Page number (starts from 1)
- **limit**: Items per page (max 100)
- **sort**: Sort field and direction
- **search**: Search query

## Data Validation

### Report Parameters Validation
- `dateRange.start` must be before `dateRange.end`
- `filters` must contain valid field names
- `grouping` fields must exist in the data model
- `sorting` direction must be 'asc' or 'desc'

### Schedule Validation
- `frequency` must be one of: daily, weekly, monthly, quarterly, yearly, custom
- `time` must be in HH:MM format
- `dayOfWeek` must be 0-6 (Sunday = 0)
- `dayOfMonth` must be 1-31
- `timezone` must be a valid IANA timezone

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Role-based access control (attorney, paralegal, super admin)
3. **Data Privacy**: Reports only show data user has access to
4. **Rate Limiting**: Prevents abuse and ensures system stability
5. **Input Validation**: All inputs are validated and sanitized
6. **SQL Injection**: Parameterized queries prevent injection attacks

## Implementation Notes

### Database Schema
```sql
-- Reports collection
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  parameters JSONB,
  schedule JSONB,
  recipients TEXT[],
  format VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Report executions log
CREATE TABLE report_executions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  executed_at TIMESTAMP DEFAULT NOW(),
  executed_by UUID REFERENCES users(id),
  parameters JSONB,
  result_url VARCHAR(500),
  status VARCHAR(20),
  execution_time_ms INTEGER
);
```

### Caching Strategy
- **Report metadata**: Cache for 1 hour
- **Generated reports**: Cache for 24 hours
- **Analytics data**: Cache for 1 hour
- **User permissions**: Cache for 30 minutes

### Background Jobs
- **Report scheduling**: Use cron jobs or task queues
- **Report generation**: Async processing for large reports
- **Email delivery**: Queue-based email sending
- **Data aggregation**: Scheduled data processing

## Testing

### Test Endpoints
```bash
# Health check
curl -X GET https://api.example.com/api/v1/reports/health

# Test report generation
curl -X POST https://api.example.com/api/v1/reports/test-generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "case", "format": "PDF"}'
```

### Test Data
```json
{
  "testCases": [
    {
      "name": "Empty data set",
      "parameters": {"dateRange": {"start": "2025-01-01", "end": "2025-01-31"}},
      "expectedResult": "Empty report with appropriate message"
    },
    {
      "name": "Large data set",
      "parameters": {"dateRange": {"start": "2020-01-01", "end": "2025-01-31"}},
      "expectedResult": "Paginated report with performance optimization"
    }
  ]
}
```

---

*Last updated: January 2025*
*Version: 1.0.0*
*API Version: v1*
