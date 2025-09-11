/**
 * FRONTEND ALTERNATIVE FIX: Client Name Missing Issue
 * 
 * If you can't modify the backend immediately, you can update the frontend
 * to fetch client data separately or use different field mappings.
 */

// =============================================================================
// OPTION 1: Update QuestionnaireResponses.tsx to fetch client data separately
// =============================================================================

/**
 * Add this to QuestionnaireResponses.tsx after the existing imports
 */

import { getClientById } from '../controllers/ClientControllers';

/**
 * Add this helper function to fetch client names
 */
const fetchClientNames = async (assignments) => {
  const assignmentsWithClientNames = await Promise.all(
    assignments.map(async (assignment) => {
      try {
        // If we already have client name, skip fetching
        if (assignment.actualClient?.firstName && assignment.actualClient?.lastName) {
          return assignment;
        }
        
        // Try to get client data using clientId
        if (assignment.clientId) {
          let clientData = null;
          
          // If clientId is just a string, fetch the full client data
          if (typeof assignment.clientId === 'string') {
            clientData = await getClientById(assignment.clientId);
          } else if (assignment.clientId._id) {
            // If clientId is already populated but missing name fields
            clientData = await getClientById(assignment.clientId._id);
          } else if (assignment.clientId.firstName) {
            // If clientId is already populated with name data
            clientData = assignment.clientId;
          }
          
          return {
            ...assignment,
            actualClient: clientData || assignment.actualClient,
            clientUserId: clientData || assignment.clientUserId
          };
        }
        
        return assignment;
      } catch (error) {
        console.error('Error fetching client data for assignment:', assignment._id, error);
        return assignment;
      }
    })
  );
  
  return assignmentsWithClientNames;
};

/**
 * Update the loadAssignments function in QuestionnaireResponses.tsx
 */
const loadAssignments = async () => {
  try {
    setLoading(true);
    
    const responseData = await getClientResponses({
      page: 1,
      limit: 50
    });
    
    const assignmentsData = responseData.data.assignments || [];
    
    // Filter to only show completed assignments
    const completedAssignments = assignmentsData.filter((assignment) => 
      assignment.status === 'completed'
    );
    
    // 🔧 NEW: Fetch missing client names
    const assignmentsWithNames = await fetchClientNames(completedAssignments);
    
    setAssignments(assignmentsWithNames);
    setError(null);
    
    // ... rest of the existing logic
    
  } catch (error) {
    console.error('Error loading assignments:', error);
    setError('Failed to load questionnaire responses');
  } finally {
    setLoading(false);
  }
};

// =============================================================================
// OPTION 2: Update the client name display logic
// =============================================================================

/**
 * Replace the existing client name display logic in QuestionnaireResponses.tsx
 * Find this section and replace it:
 */

// BEFORE (❌ Limited fallback options):
{assignment.actualClient?.firstName && assignment.actualClient?.lastName ? 
  `${assignment.actualClient.firstName} ${assignment.actualClient.lastName}` :
  assignment.clientUserId?.firstName && assignment.clientUserId?.lastName ? 
  `${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}` : 
  'Client Name Not Available'
}

// AFTER (✅ More comprehensive fallback):
{(() => {
  // Try actualClient first
  if (assignment.actualClient?.firstName && assignment.actualClient?.lastName) {
    return `${assignment.actualClient.firstName} ${assignment.actualClient.lastName}`;
  }
  
  // Try clientUserId second
  if (assignment.clientUserId?.firstName && assignment.clientUserId?.lastName) {
    return `${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}`;
  }
  
  // Try clientId if it's populated with client data
  if (assignment.clientId?.firstName && assignment.clientId?.lastName) {
    return `${assignment.clientId.firstName} ${assignment.clientId.lastName}`;
  }
  
  // Try to extract from nested client data
  if (assignment.client?.firstName && assignment.client?.lastName) {
    return `${assignment.client.firstName} ${assignment.client.lastName}`;
  }
  
  // If we have just an ID, show it as fallback
  if (assignment.clientId && typeof assignment.clientId === 'string') {
    return `Client ID: ${assignment.clientId}`;
  }
  
  // Last resort - check if there's any client identifier
  const clientIdentifier = assignment.clientId?._id || assignment.clientId;
  if (clientIdentifier) {
    return `Client: ${clientIdentifier}`;
  }
  
  return 'Client Name Not Available';
})()}

// =============================================================================
// OPTION 3: Create a custom hook for client data
// =============================================================================

/**
 * Create a new file: src/hooks/useClientData.ts
 */

import { useState, useEffect } from 'react';
import { getClientById } from '../controllers/ClientControllers';

interface ClientData {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const useClientData = (clientId: string | ClientData | null) => {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setClientData(null);
        return;
      }
      
      // If clientId is already a full object with name data, use it
      if (typeof clientId === 'object' && clientId.firstName && clientId.lastName) {
        setClientData(clientId);
        return;
      }
      
      // If clientId is just a string, fetch the full data
      if (typeof clientId === 'string') {
        try {
          setLoading(true);
          setError(null);
          
          const client = await getClientById(clientId);
          setClientData(client);
        } catch (err) {
          console.error('Error fetching client data:', err);
          setError('Failed to fetch client data');
          setClientData(null);
        } finally {
          setLoading(false);
        }
      }
      
      // If clientId is an object but missing name, try to fetch by ID
      if (typeof clientId === 'object' && clientId._id && !clientId.firstName) {
        try {
          setLoading(true);
          setError(null);
          
          const client = await getClientById(clientId._id);
          setClientData(client);
        } catch (err) {
          console.error('Error fetching client data:', err);
          setError('Failed to fetch client data');
          setClientData(null);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchClientData();
  }, [clientId]);
  
  const getClientName = () => {
    if (clientData?.firstName && clientData?.lastName) {
      return `${clientData.firstName} ${clientData.lastName}`;
    }
    return null;
  };
  
  return {
    clientData,
    loading,
    error,
    getClientName
  };
};

/**
 * Use the hook in QuestionnaireResponses.tsx
 */

// Add this component for displaying client names
const ClientNameDisplay = ({ assignment }) => {
  const { clientData, loading, getClientName } = useClientData(
    assignment.actualClient || assignment.clientUserId || assignment.clientId
  );
  
  if (loading) {
    return <span className="text-gray-500">Loading...</span>;
  }
  
  const clientName = getClientName();
  if (clientName) {
    return <span>{clientName}</span>;
  }
  
  return <span className="text-gray-400">Client Name Not Available</span>;
};

// Then use it in your JSX:
<ClientNameDisplay assignment={assignment} />

// =============================================================================
// SUMMARY: Which option to choose?
// =============================================================================

/**
 * RECOMMENDATION: Use the BACKEND FIX (BACKEND_CLIENT_NAME_FIX.js)
 * 
 * Why?
 * 1. ✅ More efficient - no extra API calls
 * 2. ✅ Better performance - data comes with initial request
 * 3. ✅ Proper data modeling - populate() is the MongoDB way
 * 4. ✅ Consistent - all client data comes from one source
 * 
 * Frontend fixes above are good for:
 * - Quick temporary solutions
 * - When you can't modify the backend immediately
 * - Testing and debugging purposes
 * 
 * NEXT STEPS:
 * 1. Implement the backend fix first
 * 2. Test with the debug script
 * 3. If backend fix doesn't work, use Option 2 (improved fallback logic)
 */
