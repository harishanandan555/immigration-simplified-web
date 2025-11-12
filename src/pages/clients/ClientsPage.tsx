import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ArrowUpDown, Mail, Phone, Users } from 'lucide-react';

import { getCompanyClients, Client } from '../../controllers/ClientControllers';

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch clients from company clients API
  const fetchCompanyClients = async (): Promise<Client[]> => {
    try {
      const response = await getCompanyClients({
        search: searchTerm || undefined
      });

      if (response.success && response.clients) {
        return response.clients;
      } else {
        return [];
      }

    } catch (error: any) {
      console.error('❌ Error fetching company clients:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        
        const companyClients = await fetchCompanyClients();
        setClients(companyClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [searchTerm]);

  const filteredClients = clients.filter(
    (client) =>
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.alienRegistrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.nationality || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Clients
              </h1>
              <p className="text-sm text-gray-600">Manage and view all your immigration clients</p>
            </div>
            <Link
              to="/legal-firm-workflow"
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-200" />
              <span className="text-sm font-medium">New Client</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Clients</p>
                <p className="text-xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Clients</p>
                <p className="text-xl font-bold text-green-600">
                  {clients.filter(client => client.status === 'Active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">This Month</p>
                <p className="text-xl font-bold text-purple-600">
                  {clients.filter(client => {
                    const clientDate = new Date(client.createdAt || '');
                    const now = new Date();
                    return clientDate.getMonth() === now.getMonth() && 
                           clientDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <PlusCircle className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-grow group">
              <input
                type="text"
                placeholder="Search by name, email, phone, alien number, or nationality..."
                className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-gray-300 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" size={16} />
            </div>
            <button className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
              <Filter size={16} />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                      <span>Name</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                      <span>Alien Number</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                      <span>Created</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500 text-sm font-medium">Loading clients...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr key={client._id} className="hover:bg-blue-50/50 transition-all duration-200 group">
                      <td className="px-4 py-3">
                        <Link to={`/clients/${client._id}`} className="flex items-center group-hover:scale-105 transition-transform duration-200">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {client.firstName?.charAt(0) || client.name?.charAt(0) || '?'}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 border border-white rounded-full"></div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                              {client.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Client Profile</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <div className="p-0.5 bg-blue-100 rounded">
                              <Mail size={10} className="text-blue-600" />
                            </div>
                            <a href={`mailto:${client.email}`} className="hover:text-blue-600 transition-colors duration-200 truncate">
                              {client.email || 'N/A'}
                            </a>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <div className="p-0.5 bg-green-100 rounded">
                              <Phone size={10} className="text-green-600" />
                            </div>
                            <a href={`tel:${client.phone}`} className="hover:text-green-600 transition-colors duration-200">
                              {client.phone || 'N/A'}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                          {client.alienRegistrationNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full shadow-sm ${
                          client.status === 'Active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : client.status === 'Inactive'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {client.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          <div className="font-medium">
                            {client.createdAt 
                              ? new Date(client.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) 
                              : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {client.createdAt 
                              ? new Date(client.createdAt).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                }) 
                              : ''}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                          <Users className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="space-y-1 text-center">
                          <h3 className="text-lg font-semibold text-gray-900">No clients found</h3>
                          <p className="text-gray-500 text-sm max-w-md">
                            {searchTerm 
                              ? "Try adjusting your search criteria or clear the search to view all clients."
                              : "Get started by adding your first client to begin managing their immigration case."
                            }
                          </p>
                        </div>
                        {!searchTerm && (
                          <Link
                            to="/legal-firm-workflow"
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <PlusCircle size={16} className="mr-2" />
                            <span className="text-sm">Add Your First Client</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Section */}
          {filteredClients.length > 0 && (
            <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-xs text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredClients.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{clients.length}</span> clients
                  {searchTerm && (
                    <span className="ml-2 text-blue-600">
                      • Filtered by "{searchTerm}"
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-blue-500 bg-blue-500 text-white rounded-md text-xs font-medium shadow-sm">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;