# Immigration-Simplified API Documentation

## Authentication

All API requests must include an authentication token in the Authorization header:

```
Authorization: Bearer <api_token>
```

## Base URL

```
https://api.immigration-simplified.com/v1
```

## Endpoints

### Cases

#### GET /cases

Retrieve a list of cases.

**Query Parameters:**
- `status`: Filter by case status
- `type`: Filter by case type
- `client`: Filter by client ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "cases": [
    {
      "id": "case-123",
      "caseNumber": "CF-2023-1001",
      "type": "Family-Based",
      "status": "In Progress",
      "clientId": "client-123",
      "assignedTo": "attorney-123",
      "createdAt": "2023-06-15T10:30:00Z",
      "updatedAt": "2023-06-30T15:45:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

#### POST /cases

Create a new case.

**Request:**
```json
{
  "type": "Family-Based",
  "clientId": "client-123",
  "assignedTo": "attorney-123",
  "description": "I-130 Petition for spouse"
}
```

#### GET /cases/{id}

Retrieve case details.

**Response:**
```json
{
  "id": "case-123",
  "caseNumber": "CF-2023-1001",
  "type": "Family-Based",
  "status": "In Progress",
  "clientId": "client-123",
  "assignedTo": "attorney-123",
  "description": "I-130 Petition for spouse",
  "documents": [],
  "tasks": [],
  "createdAt": "2023-06-15T10:30:00Z",
  "updatedAt": "2023-06-30T15:45:00Z"
}
```

### Clients

#### GET /clients

Retrieve a list of clients.

**Query Parameters:**
- `status`: Filter by client status
- `search`: Search by name or email
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "clients": [
    {
      "id": "client-123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-123-4567",
      "status": "Active",
      "createdAt": "2023-06-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

#### POST /clients

Create a new client.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "address": "123 Main St",
  "dateOfBirth": "1990-01-01"
}
```

### Forms

#### GET /forms

Retrieve available forms.

**Query Parameters:**
- `category`: Filter by form category
- `search`: Search by form name or number
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "forms": [
    {
      "id": "form-123",
      "name": "I-130",
      "title": "Petition for Alien Relative",
      "category": "Family-Based",
      "version": "10/21/19",
      "fee": 535,
      "processingTime": "7-9 months"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Settings

#### Database Settings

##### GET /settings/database

Retrieve database configuration settings.

**Response:**
```json
{
  "connection": {
    "host": "localhost",
    "port": 5432,
    "database": "immigration_db",
    "schema": "public"
  },
  "backup": {
    "schedule": "daily",
    "retentionDays": 30,
    "compression": true,
    "lastBackup": "2023-06-30T00:00:00Z",
    "nextBackup": "2023-07-01T00:00:00Z"
  },
  "performance": {
    "poolSize": 10,
    "queryTimeout": 30,
    "queryCacheEnabled": true
  }
}
```

##### PUT /settings/database

Update database configuration settings.

**Request:**
```json
{
  "connection": {
    "host": "localhost",
    "port": 5432,
    "database": "immigration_db",
    "schema": "public"
  },
  "backup": {
    "schedule": "daily",
    "retentionDays": 30,
    "compression": true
  },
  "performance": {
    "poolSize": 10,
    "queryTimeout": 30,
    "queryCacheEnabled": true
  }
}
```

##### POST /settings/database/backup

Trigger a manual database backup.

**Response:**
```json
{
  "backupId": "backup-123",
  "startedAt": "2023-06-30T15:30:00Z",
  "status": "in_progress",
  "estimatedCompletionTime": "2023-06-30T15:35:00Z"
}
```

#### API Settings

##### GET /settings/api

Retrieve API configuration settings.

**Response:**
```json
{
  "keys": {
    "production": {
      "key": "pk_prod_xxx",
      "lastUsed": "2023-06-30T15:30:00Z",
      "createdAt": "2023-01-01T00:00:00Z"
    },
    "development": {
      "key": "pk_dev_xxx",
      "lastUsed": "2023-06-30T15:25:00Z",
      "createdAt": "2023-01-01T00:00:00Z"
    }
  },
  "rateLimiting": {
    "requestsPerMinute": 100,
    "burstLimit": 200
  },
  "cors": {
    "allowedOrigins": [
      "https://example.com",
      "https://app.example.com"
    ],
    "allowCredentials": true
  }
}
```

##### PUT /settings/api

Update API configuration settings.

**Request:**
```json
{
  "rateLimiting": {
    "requestsPerMinute": 100,
    "burstLimit": 200
  },
  "cors": {
    "allowedOrigins": [
      "https://example.com",
      "https://app.example.com"
    ],
    "allowCredentials": true
  }
}
```

##### POST /settings/api/keys/regenerate

Regenerate API keys.

**Request:**
```json
{
  "type": "production"
}
```

**Response:**
```json
{
  "key": "pk_prod_xxx",
  "createdAt": "2023-06-30T15:30:00Z",
  "expiresAt": "2024-06-30T15:30:00Z"
}
```

#### Performance Monitoring

##### GET /settings/performance/metrics

Retrieve system performance metrics.

**Query Parameters:**
- `period`: Time period for metrics (1h, 24h, 7d, 30d)
- `metrics`: Comma-separated list of requested metrics

**Response:**
```json
{
  "system": {
    "cpu": {
      "current": 45,
      "average": 38,
      "peak": 78
    },
    "memory": {
      "used": 2.1,
      "total": 8,
      "peak": 4.2
    },
    "storage": {
      "used": 45.3,
      "total": 100,
      "available": 54.7
    }
  },
  "api": {
    "responseTimes": {
      "p50": 120,
      "p95": 350,
      "p99": 500
    },
    "errorRates": {
      "4xx": 2.3,
      "5xx": 0.1
    }
  },
  "cache": {
    "hitRate": 89.5,
    "missRate": 10.5,
    "size": "256MB"
  },
  "activeUsers": {
    "current": 127,
    "peak24h": 256
  }
}
```

##### GET /settings/performance/alerts

Retrieve performance alert configurations.

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-123",
      "type": "cpu_usage",
      "threshold": 80,
      "duration": "5m",
      "actions": ["email", "slack"],
      "enabled": true
    }
  ]
}
```

##### POST /settings/performance/alerts

Create a new performance alert.

**Request:**
```json
{
  "type": "cpu_usage",
  "threshold": 80,
  "duration": "5m",
  "actions": ["email", "slack"],
  "description": "High CPU usage alert"
}
```

### Error Responses

All endpoints may return the following error responses:

#### 400 Bad Request
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Invalid request parameters",
    "details": {
      "field": "description of the error"
    }
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or missing API token"
  }
}
```

#### 403 Forbidden
```json
{
  "error": {
    "code": "forbidden",
    "message": "Insufficient permissions to perform this action"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "not_found",
    "message": "The requested resource was not found"
  }
}
```

#### 429 Too Many Requests
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "internal_error",
    "message": "An unexpected error occurred"
  }
}
```