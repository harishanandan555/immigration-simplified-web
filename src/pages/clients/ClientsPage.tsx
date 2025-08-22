import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ArrowUpDown, Mail, Phone } from 'lucide-react';

import { getClients } from '../../controllers/ClientControllers';
import api from '../../utils/api';

type Client = {
  _id: string;
  id: string;
  createdAt: string;
  email: string;
  name: string;
  phone: string;
  status: string;
  alienNumber: string;
  address: string;
  nationality: string;
  // Additional fields from workflow API
  workflowId?: string;
  caseType?: string;
  formCaseIds?: Record<string, string>;
  openDate?: string;
  priorityDate?: string;
  dateOfBirth?: string;
};

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch clients from workflows API
  const fetchWorkflowsFromAPI = async (): Promise<Client[]> => {
    try {
      console.log('🔄 Fetching workflows from API...');
      const token = localStorage.getItem('token');

      // Check token availability
      if (!token) {
        console.log('❌ No authentication token available');
        return [];
      }

      // Request workflows from API
      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100 // Get more workflows to find more clients and cases
        }
      });

      console.log('📥 Workflows API response:', response.data);

      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        console.log(`✅ Successfully loaded ${workflows.length} workflows from API`);
        
        // Extract unique clients from workflows
        const clientsMap = new Map<string, Client>();
        
        workflows.forEach((workflow: any) => {
          // Extract client data from the nested client object
          const clientData = workflow.client;
          const caseData = workflow.case;
          
          if (clientData && clientData.name && clientData.email) {
            const clientId = clientData.email; // Use email as unique identifier
            
            if (!clientsMap.has(clientId)) {
              clientsMap.set(clientId, {
                _id: workflow._id || workflow.id,
                id: clientId,
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone || 'N/A',
                status: clientData.status || 'Active',
                createdAt: workflow.createdAt || caseData?.openDate || '',
                alienNumber: clientData.alienNumber || 'N/A',
                address: clientData.address?.formattedAddress || 'N/A',
                nationality: clientData.nationality || 'N/A',
                dateOfBirth: clientData.dateOfBirth || 'N/A',
                // Workflow-specific fields
                workflowId: workflow._id || workflow.id,
                caseType: caseData?.category || caseData?.subcategory || 'N/A',
                formCaseIds: workflow.formCaseIds,
                openDate: caseData?.openDate || 'N/A',
                priorityDate: caseData?.priorityDate || 'N/A'
              });
            }
          }
        });

        return Array.from(clientsMap.values());
      } else {
        console.log('⚠️ No workflow data available in API response');
        return [];
      }

    } catch (error: any) {
      console.error('❌ Error fetching workflows from API:', error);
      if (error?.response?.status === 401) {
        console.log('🔑 Authentication failed - token may be expired');
      }
      return [];
    }
  };

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        
        // Try to fetch clients from workflows API first
        const workflowClients = await fetchWorkflowsFromAPI();
        
        if (workflowClients.length > 0) {
          console.log('✅ Using clients from workflows API:', workflowClients.length);
          setClients(workflowClients);
        } else {
          // Fallback to original client API
          console.log('⚠️ No workflow clients found, falling back to client API');
          const clientData: any = await getClients();
          console.log('Fetched clients from client API:', clientData);
          
          if (clientData && clientData.length > 0) {
            setClients(clientData);
          } else {
            setClients([]);
          }
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.alienNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.caseType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.nationality || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.openDate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.priorityDate || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <Link
          to="/clients/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <PlusCircle size={18} />
          <span>New Client</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by name, email, case type, dates, alien number, or nationality..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-md px-4 py-2 text-gray-600 hover:bg-gray-50">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Name</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Case Type</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Alien Number</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Open Date</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Priority Date</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading clients...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/clients/${client._id}`} className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                          {client.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name || 'N/A'}</div>
                          {client.workflowId && (
                            <div className="text-xs text-gray-500">ID: {client.workflowId.slice(-8)}</div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Mail size={14} />
                          <a href={`mailto:${client.email}`} className="hover:text-primary-600">
                            {client.email || 'N/A'}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Phone size={14} />
                          <a href={`tel:${client.phone}`} className="hover:text-primary-600">
                            {client.phone || 'N/A'}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {client.caseType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.alienNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.nationality || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'Active' || client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {client.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.openDate && client.openDate !== 'N/A' 
                        ? new Date(client.openDate).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.priorityDate && client.priorityDate !== 'N/A' 
                        ? new Date(client.priorityDate).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No clients found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredClients.length > 0 && (
          <div className="flex justify-between items-center mt-4 py-3">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredClients.length}</span> of{" "}
              <span className="font-medium">{clients.length}</span> clients
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;