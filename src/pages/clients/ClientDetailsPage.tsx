import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, FileText, Briefcase, PlusCircle } from 'lucide-react';
import { getClientById } from '../../controllers/ClientControllers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ClientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingCases, setLoadingCases] = useState(false);

  // Function to fetch workflows and extract client cases
  const fetchClientCasesFromWorkflows = async (clientId: string, clientData?: any) => {
    try {
      console.log('🔄 Fetching client cases from workflows for client:', clientId);
      console.log('🔍 Using client data:', clientData || client);
      setLoadingCases(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('❌ No authentication token available');
        toast('No authentication token - please login first');
        return [];
      }

      console.log('✅ Authentication token found, fetching workflows...');

      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100
        }
      });
      
      console.log('📥 Response from workflows API:', response.data);
      
      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        console.log(`✅ Successfully loaded ${workflows.length} workflows`);
        
        // Filter workflows for this specific client and extract cases
        const currentClient = clientData || client;
        const clientWorkflows = workflows.filter((workflow: any) => {
          const workflowClient = workflow.client || {};
          
          // Debug: Log each workflow client for comparison
          console.log('🔍 Comparing workflow client:', {
            workflowId: workflow._id,
            workflowClientId: workflowClient.id || 'EMPTY',
            workflowClientEmail: workflowClient.email || 'NO EMAIL',
            workflowClientName: workflowClient.name || 'NO NAME',
            workflowClientFirstName: workflowClient.firstName || '',
            workflowClientLastName: workflowClient.lastName || '',
            searchingForClientId: clientId,
            searchingForClientEmail: currentClient?.email || 'CLIENT NOT LOADED',
            searchingForClientName: currentClient?.name || 'CLIENT NOT LOADED'
          });
          
          // Since workflow client IDs are empty, prioritize email and name matching
          let isMatch = false;
          let matchType = '';
          
          // 1. Try exact client ID match first (if both IDs exist and are not empty)
          if (workflowClient.id && workflowClient.id !== '' && clientId && clientId !== '') {
            if (workflowClient.id === clientId || workflowClient._id === clientId) {
              isMatch = true;
              matchType = 'ID';
            }
          }
          
          // 2. Try email match (most reliable when IDs are empty)
          if (!isMatch && currentClient && workflowClient.email && currentClient.email) {
            if (workflowClient.email.toLowerCase().trim() === currentClient.email.toLowerCase().trim()) {
              isMatch = true;
              matchType = 'Email';
            }
          }
          
          // 3. Try exact name match
          if (!isMatch && currentClient && workflowClient.name && currentClient.name) {
            if (workflowClient.name.toLowerCase().trim() === currentClient.name.toLowerCase().trim()) {
              isMatch = true;
              matchType = 'Exact Name';
            }
          }
          
          // 4. Try firstName + lastName combination
          if (!isMatch && currentClient && workflowClient.firstName && workflowClient.lastName && currentClient.name) {
            const fullName = `${workflowClient.firstName} ${workflowClient.lastName}`.toLowerCase().trim();
            if (fullName === currentClient.name.toLowerCase().trim()) {
              isMatch = true;
              matchType = 'Full Name (firstName + lastName)';
            }
          }
          
          // 5. Try partial name matches (be more flexible)
          if (!isMatch && currentClient && currentClient.name && workflowClient.name) {
            const clientNameLower = currentClient.name.toLowerCase().trim();
            const workflowNameLower = workflowClient.name.toLowerCase().trim();
            
            if (clientNameLower.includes(workflowNameLower) || workflowNameLower.includes(clientNameLower)) {
              isMatch = true;
              matchType = 'Partial Name';
            }
          }
          
          if (isMatch) {
            console.log('✅ FOUND MATCH! Workflow match for client:', {
              workflowId: workflow._id,
              matchType: matchType,
              workflowClientData: {
                id: workflowClient.id || 'EMPTY',
                email: workflowClient.email,
                name: workflowClient.name,
                firstName: workflowClient.firstName,
                lastName: workflowClient.lastName
              },
              searchCriteria: {
                clientId: clientId,
                clientEmail: currentClient?.email,
                clientName: currentClient?.name
              }
            });
          }
          
          return isMatch;
        });

        console.log(`📋 Found ${clientWorkflows.length} workflows for client ${clientId}`);
        
        // If no workflows found, log all available workflow clients for debugging
        if (clientWorkflows.length === 0) {
          console.log('❌ No workflows found for this client. Available workflow clients:');
          workflows.forEach((workflow: any, index: number) => {
            const wfClient = workflow.client || {};
            console.log(`Workflow ${index + 1}:`, {
              workflowId: workflow._id,
              clientId: wfClient.id || wfClient._id || 'No ID',
              clientEmail: wfClient.email || 'No email',
              clientName: wfClient.name || `${wfClient.firstName || ''} ${wfClient.lastName || ''}`.trim() || 'No name',
              clientPhone: wfClient.phone || 'No phone'
            });
          });
          
          console.log('💡 Consider checking if:');
          console.log('1. This client has any workflows created');
          console.log('2. The client ID matches between the clients and workflows databases');
          console.log('3. The client might be identified by email or name instead of ID');
        }
        
        // Extract cases from client workflows
        const extractedCases = clientWorkflows.map((workflow: any) => {
          const workflowCase = workflow.case || {};
          
          return {
            id: workflowCase.id || workflowCase._id || workflow._id,
            caseNumber: workflowCase.caseNumber || 
                       (workflow.formCaseIds && Object.values(workflow.formCaseIds)[0]) || 
                       `WF-${workflow._id?.slice(-8)}`,
            type: workflowCase.category || workflowCase.subcategory || 'Immigration Case',
            status: workflowCase.status || workflow.status || 'In Progress',
            openDate: workflow.createdAt || new Date().toISOString(),
            description: workflowCase.title || workflowCase.description || 'Workflow Case',
            workflowId: workflow._id,
            formCaseIds: workflow.formCaseIds || {}
          };
        });
        
        console.log(`✅ Extracted ${extractedCases.length} cases for client`);
        console.log('📋 Sample extracted case:', extractedCases[0]);
        
        return extractedCases;
      } else {
        console.log('⚠️ No workflow data available in API response');
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching client cases from workflows:', error);
      
      if (error.response?.status === 404) {
        console.log('🔍 Server workflows endpoint not found');
        toast('Server workflows endpoint not available');
      } else if (error.response?.status === 401) {
        console.log('🔐 Authentication failed');
        toast('Authentication failed - please login again');
      } else {
        console.log('💥 Other API error:', error.response?.status || 'Unknown');
        toast.error('Failed to load client cases from workflows');
      }
      
      return [];
    } finally {
      setLoadingCases(false);
      console.log('🏁 Finished client cases workflow request');
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        if (!id) {
          throw new Error('Client ID is required');
        }
        
        // Fetch client data first
        const clientData = await getClientById(id);
        setClient(clientData);
        console.log('✅ Client data loaded:', clientData);
        
        // Wait a moment to ensure client state is updated, then fetch workflows
        setTimeout(async () => {
          console.log('🔄 Starting workflow fetch with client data:', clientData);
          const casesData = await fetchClientCasesFromWorkflows(id, clientData);
          setClientCases(casesData);
        }, 100);
        
      } catch (err) {
        console.error('❌ Error in fetchClientData:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading client details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">{error}</p>
        <Link to="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Clients
        </Link>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
        <p>The client you are looking for does not exist or has been removed.</p>
        <Link to="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Clients
        </Link>
      </div>
    );
  }

  // Ensure client has minimum required fields
  const safeClient = {
    name: client.name || 'Unknown Client',
    email: client.email || 'No email provided',
    phone: client.phone || 'No phone provided',
    status: client.status || 'Unknown',
    address: client.address || null,
    dateOfBirth: client.dateOfBirth || null,
    alienNumber: client.alienNumber || null,
    nationality: client.nationality || null,
    passportNumber: client.passportNumber || null,
    entryDate: client.entryDate || null,
    visaCategory: client.visaCategory || null,
    notes: client.notes || null,
    ...client
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/clients" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{safeClient.name}</h1>
          <span className={`ml-4 px-3 py-1 text-sm font-medium rounded-full ${
            safeClient.status === 'Active' 
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {safeClient.status}
          </span>
        </div>
        <Link 
          to={`/clients/${id}/edit`}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Edit size={16} className="mr-2" />
          Edit Client
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main client information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <div className="flex items-center mt-1">
                    <Mail size={16} className="text-gray-400 mr-2" />
                    <a href={`mailto:${safeClient.email}`} className="text-primary-600 hover:text-primary-700">
                      {safeClient.email}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <div className="flex items-center mt-1">
                    <Phone size={16} className="text-gray-400 mr-2" />
                    <a href={`tel:${safeClient.phone}`} className="text-primary-600 hover:text-primary-700">
                      {safeClient.phone}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <div className="flex items-center mt-1">
                    <MapPin size={16} className="text-gray-400 mr-2" />
                    <span>
                      {safeClient.address ? 
                        `${safeClient.address.street || ''}, ${safeClient.address.city || ''}, ${safeClient.address.state || ''} ${safeClient.address.zipCode || ''}, ${safeClient.address.country || ''}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '') || 'No address provided'
                        : 'No address provided'
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <div className="flex items-center mt-1">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span>{safeClient.dateOfBirth ? new Date(safeClient.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Immigration Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Alien Number</p>
                  <p className="font-medium mt-1">{safeClient.alienNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium mt-1">{safeClient.nationality || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Passport Number</p>
                  <p className="font-medium mt-1">{safeClient.passportNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entry Date</p>
                  <p className="font-medium mt-1">{safeClient.entryDate ? new Date(safeClient.entryDate).toLocaleDateString() : 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visa Category</p>
                  <p className="font-medium mt-1">{safeClient.visaCategory || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium mt-1">{safeClient.status || 'Not provided'}</p>
                </div>
              </div>
              {safeClient.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium mt-1">{safeClient.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cases from Workflows</h2>
              <Link
                to="/cases/new"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + New Case
              </Link>
            </div>
            <div className="p-4">
              {loadingCases ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading cases from workflows...</span>
                </div>
              ) : clientCases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Open Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workflow ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientCases.map((caseItem) => (
                        <tr key={caseItem.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              to={`/cases/${caseItem.id}`}
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              {caseItem.caseNumber}
                            </Link>
                            {/* Show form case IDs if available */}
                            {caseItem.formCaseIds && Object.keys(caseItem.formCaseIds).length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Object.entries(caseItem.formCaseIds).map(([formName, caseId]) => (
                                  <div key={formName}>
                                    {formName}: {String(caseId)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {caseItem.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              caseItem.status === 'Active' || caseItem.status === 'In Progress' ? 'bg-green-100 text-green-800' :
                              caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {caseItem.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(caseItem.openDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {caseItem.workflowId?.slice(-8)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No workflow cases found for this client.
                  </p>
                  
                  {/* Debug section - will be removed later */}
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Information:</h4>
                    <div className="text-xs text-yellow-700">
                      <p><strong>Current Client ID:</strong> {id}</p>
                      <p><strong>Client Name:</strong> {safeClient?.name || 'Not loaded'}</p>
                      <p><strong>Client Email:</strong> {safeClient?.email || 'Not loaded'}</p>
                      <p className="mt-2">
                        <strong>Possible Solutions:</strong><br/>
                        1. Create a new workflow for this client<br/>
                        2. Check if client exists in workflow database<br/>
                        3. Verify client ID consistency between databases
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link
                      to="/legal-firm-workflow"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Create New Workflow
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Documents</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {/* Example documents - replace with actual documents */}
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Passport.pdf</p>
                    <p className="text-xs text-gray-500">Added on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Birth Certificate.pdf</p>
                    <p className="text-xs text-gray-500">Added on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <Link
                to="/documents"
                className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700"
              >
                View all documents
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Activity</h2>
            </div>
            <div className="p-4">
              <div className="flow-root">
                <ul className="-mb-8">
                  <li className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                          <FileText className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            New document uploaded: <span className="font-medium text-gray-900">Passport.pdf</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2023-09-20">1h ago</time>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <Briefcase className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            New case created: <span className="font-medium text-gray-900">I-130 Petition</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2023-09-20">3h ago</time>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="mt-6 text-center">
                <button className="text-sm text-primary-600 hover:text-primary-700">
                  View full activity log
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsPage;