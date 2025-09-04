# Updated Client Management API Integration

## Overview

This document outlines the updates made to the frontend Client Management API integration to align with the comprehensive API documentation provided. The updates include new endpoints, enhanced TypeScript interfaces, and improved error handling.

## Changes Made

### 1. Updated API Constants (`src/utils/constants.ts`)

#### Added New Endpoints:
- `CREATECOMPANYCLIENT: "/api/v1/clients/company"` - For creating company clients

#### Updated Endpoints:
- `USER_END_POINTS.GET_ALL_USERS` changed from `/api/v1/clients/users/all` to `/api/v1/users/all`

### 2. Enhanced TypeScript Interfaces (`src/controllers/ClientControllers.tsx`)

#### New Interfaces Added:
- `PlaceOfBirth` - For birth location information
- `Spouse` - For spouse information
- `Child` - For children information
- `Employment` - For employment details
- `Education` - For education information
- `TravelHistory` - For travel history
- `FinancialInfo` - For financial information
- `CriminalHistory` - For criminal background
- `MedicalHistory` - For medical information
- `Document` - For document management
- `Company` - For company information
- `Attorney` - For attorney details
- `PaginationInfo` - For pagination metadata
- `ClientsApiResponse` - For clients API responses
- `UsersApiResponse` - For users API responses

#### Updated Interfaces:
- `Client` - Enhanced with comprehensive fields matching the new API schema
- `User` - Updated with new fields like `userType`, `companyId`, etc.

### 3. Updated Controller Functions

#### Enhanced Functions:
- `getClients()` - Now supports pagination and filtering parameters
- `getUsers()` - Updated to use new API endpoint with comprehensive filtering
- `getAttorneys()` - Simplified to use the new `getUsers()` function
- `getParalegals()` - Simplified to use the new `getUsers()` function
- `createClient()` - Updated for individual client creation
- `updateClient()` - Enhanced with proper typing

#### New Functions Added:
- `getAssignableUsers()` - Helper function to get attorneys and paralegals
- `createCompanyClient()` - For creating company clients
- `addClientDocument()` - For adding documents to clients

## Usage Examples

### 1. Fetching Clients with Pagination and Filtering

```typescript
import { getClients } from '../controllers/ClientControllers';

// Get first page with default limit
const clientsResponse = await getClients();

// Get specific page with custom limit
const page2Response = await getClients({ page: 2, limit: 10 });

// Search for clients
const searchResults = await getClients({ search: 'john' });

// Filter by status
const activeClients = await getClients({ status: 'Active' });

console.log('Clients:', clientsResponse.clients);
console.log('Pagination:', clientsResponse.pagination);
```

### 2. Creating Individual Clients

```typescript
import { createClient } from '../controllers/ClientControllers';

const individualClientData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "555-123-4567",
  nationality: "United States",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States"
  },
  dateOfBirth: "1990-01-01",
  placeOfBirth: {
    city: "New York",
    state: "NY",
    country: "United States"
  },
  gender: "male",
  maritalStatus: "single",
  immigrationPurpose: "employment",
  passportNumber: "P123456789",
  alienRegistrationNumber: "A123456789",
  status: "Active"
};

try {
  const newClient = await createClient(individualClientData);
  console.log('Client created:', newClient);
} catch (error) {
  console.error('Failed to create client:', error.message);
}
```

### 3. Creating Company Clients

```typescript
import { createCompanyClient } from '../controllers/ClientControllers';

const companyClientData = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@company.com",
  phone: "555-987-6543",
  nationality: "United States",
  address: {
    street: "456 Business Ave",
    city: "New York",
    state: "NY",
    zipCode: "10002",
    country: "United States"
  },
  companyId: "64f8a1b2c3d4e5f6a7b8c9d1",
  attorneyIds: ["64f8a1b2c3d4e5f6a7b8c9d2"],
  status: "Active",
  sendPassword: true
};

try {
  const newCompanyClient = await createCompanyClient(companyClientData);
  console.log('Company client created:', newCompanyClient);
} catch (error) {
  console.error('Failed to create company client:', error.message);
}
```

### 4. Fetching Users with Filtering

```typescript
import { getUsers, getAssignableUsers } from '../controllers/ClientControllers';

// Get all users
const allUsersResponse = await getUsers();

// Get attorneys only
const attorneysResponse = await getUsers({ role: 'attorney' });

// Get multiple roles
const staffResponse = await getUsers({ role: 'attorney,admin' });

// Search users
const searchResponse = await getUsers({ search: 'jane' });

// Get assignable users (attorneys and paralegals)
const assignableUsers = await getAssignableUsers();

console.log('Users:', allUsersResponse.users);
console.log('Pagination:', allUsersResponse.pagination);
```

### 5. Updating Clients

```typescript
import { updateClient } from '../controllers/ClientControllers';

const updateData = {
  firstName: 'John',
  lastName: 'Smith',
  status: 'Active',
  phone: '555-999-8888'
};

try {
  const updatedClient = await updateClient('64f8a1b2c3d4e5f6a7b8c9d0', updateData);
  console.log('Client updated:', updatedClient);
} catch (error) {
  console.error('Failed to update client:', error.message);
}
```

### 6. Adding Documents to Clients

```typescript
import { addClientDocument } from '../controllers/ClientControllers';

const documentData = {
  type: 'passport',
  name: 'Passport Copy',
  fileUrl: 'https://example.com/documents/passport.pdf',
  notes: 'Passport copy for immigration case'
};

try {
  const updatedClient = await addClientDocument('64f8a1b2c3d4e5f6a7b8c9d0', documentData);
  console.log('Document added:', updatedClient);
} catch (error) {
  console.error('Failed to add document:', error.message);
}
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { getClients, createClient, updateClient } from '../controllers/ClientControllers';

export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchClients = async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getClients(params);
      setClients(result.clients);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createNewClient = async (clientData) => {
    try {
      const result = await createClient(clientData);
      setClients(prev => [result, ...prev]);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateExistingClient = async (clientId, updateData) => {
    try {
      const result = await updateClient(clientId, updateData);
      setClients(prev => prev.map(client => 
        client._id === clientId ? result : client
      ));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { 
    clients, 
    loading, 
    error, 
    pagination,
    fetchClients, 
    createNewClient, 
    updateExistingClient 
  };
}
```

## Error Handling

The updated controllers include comprehensive error handling:

```typescript
try {
  const clients = await getClients({ status: 'Active' });
  // Handle success
} catch (error) {
  if (error.message.includes('not found')) {
    showErrorMessage('Client not found');
  } else if (error.message.includes('already exists')) {
    showErrorMessage('A client with this email already exists');
  } else {
    showErrorMessage('Failed to load clients');
  }
}
```

## Migration Notes

### Breaking Changes:
1. `getClients()` now returns `ClientsApiResponse` instead of `Client[]`
2. `getUsers()` now returns `UsersApiResponse` instead of `User[]`
3. Client interface now uses `_id` instead of `id` (with backward compatibility)

### Backward Compatibility:
- Legacy `id` field is still supported in the Client interface
- Existing function signatures are maintained where possible
- Error handling remains consistent

## Testing

Test the updated API integration:

```typescript
// Test client fetching
const testClients = async () => {
  try {
    const response = await getClients({ page: 1, limit: 10 });
    console.log('✅ Clients fetched successfully:', response.clients.length);
  } catch (error) {
    console.error('❌ Failed to fetch clients:', error.message);
  }
};

// Test user fetching
const testUsers = async () => {
  try {
    const response = await getUsers({ role: 'attorney' });
    console.log('✅ Attorneys fetched successfully:', response.users.length);
  } catch (error) {
    console.error('❌ Failed to fetch attorneys:', error.message);
  }
};
```

## Support

For issues with the updated API integration:
1. Check browser console for detailed error messages
2. Verify JWT token is valid and not expired
3. Ensure all required fields are provided in requests
4. Check server logs for detailed error information
5. Validate data types and formats before sending requests

The updated integration provides comprehensive support for the new Client Management API with enhanced type safety, better error handling, and improved developer experience.
