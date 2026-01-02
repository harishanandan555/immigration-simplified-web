import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Mail, Phone, Users, UserCheck, CreditCard, Edit2, MoreVertical } from 'lucide-react';
import { getIndividualClients, Client, updateClient } from '../../controllers/ClientControllers';
import { useAuth } from '../../controllers/AuthControllers';
import { getCurrentSubscription, Subscription } from '../../controllers/BillingControllers';

interface ClientWithSubscription extends Client {
  subscription?: Subscription;
}

const IndividualClientsPage = () => {
  const { user, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientWithSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [showEditMenu, setShowEditMenu] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [clientToUpdate, setClientToUpdate] = useState<{ id: string; name: string; currentStatus: string } | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await getIndividualClients({
          search: searchTerm || undefined
        });

        if (response.success && response.clients) {
          // For individual clients, check if they have a companyId and fetch subscription
          const clientsWithSubscriptions = await Promise.all(
            response.clients.map(async (client: Client) => {
              if (client.companyId) {
                try {
                  const subscriptionResponse = await getCurrentSubscription(client.companyId);
                  return {
                    ...client,
                    subscription: subscriptionResponse.data || undefined
                  } as ClientWithSubscription;
                } catch (error) {
                  console.error(`Error fetching subscription for client ${client._id}:`, error);
                }
              }
              return {
                ...client,
                subscription: undefined
              } as ClientWithSubscription;
            })
          );
          
          setClients(clientsWithSubscriptions);
        } else {
          setClients([]);
        }
      } catch (error) {
        console.error('Error fetching individual clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [searchTerm, isSuperAdmin]);

  const filteredClients = clients.filter(
    (client) =>
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.alienRegistrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.nationality || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatusClick = (clientId: string, clientName: string, currentStatus: string) => {
    setClientToUpdate({ id: clientId, name: clientName, currentStatus });
    setShowConfirmDialog(true);
    setShowEditMenu(null);
  };

  const handleConfirmToggleStatus = async () => {
    if (!clientToUpdate) return;

    try {
      setUpdatingClientId(clientToUpdate.id);
      setShowConfirmDialog(false);
      
      const newStatus = clientToUpdate.currentStatus === 'Active' ? 'Inactive' : 'Active';
      
      await updateClient(clientToUpdate.id, { status: newStatus as 'Active' | 'Inactive' });
      
      // Update the local state
      setClients(prevClients =>
        prevClients.map(client =>
          client._id === clientToUpdate.id
            ? { ...client, status: newStatus as 'Active' | 'Inactive' }
            : client
        )
      );
    } catch (error) {
      console.error('Error updating client status:', error);
      alert('Failed to update client status. Please try again.');
    } finally {
      setUpdatingClientId(null);
      setClientToUpdate(null);
    }
  };

  const handleCancelToggleStatus = () => {
    setShowConfirmDialog(false);
    setClientToUpdate(null);
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Individual Clients
              </h1>
              <p className="text-sm text-gray-600">Manage and view all individual immigration clients</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Individual Clients</p>
                <p className="text-xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-blue-600" />
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
                <Users className="h-4 w-4 text-purple-600" />
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
                    Subscription
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors duration-200">
                      <span>Created</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
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
                              {client.firstName && client.lastName 
                                ? `${client.firstName} ${client.lastName}`
                                : client.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Individual Client</div>
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
                        {client.subscription ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-blue-600" />
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                client.subscription.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : client.subscription.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : client.subscription.status === 'expired'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {client.subscription.status?.toUpperCase() || 'N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              ${client.subscription.amount}/{client.subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </div>
                            {client.subscription.endDate && (
                              <div className="text-xs text-gray-500">
                                Expires: {new Date(client.subscription.endDate as any).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No subscription</span>
                        )}
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
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setShowEditMenu(showEditMenu === client._id ? null : client._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
                            disabled={updatingClientId === client._id}
                          >
                            {updatingClientId === client._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <MoreVertical className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                            )}
                          </button>
                          
                          {showEditMenu === client._id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowEditMenu(null)}
                              > 
                              </div>
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                <button
                                  onClick={() => {
                                    const clientName = client.firstName && client.lastName 
                                      ? `${client.firstName} ${client.lastName}`
                                      : client.name || 'this client';
                                    handleToggleStatusClick(client._id, clientName, client.status || 'Pending');
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  <span>
                                    {client.status === 'Active' ? 'Set to Inactive' : 'Set to Active'}
                                  </span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                          <UserCheck className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="space-y-1 text-center">
                          <h3 className="text-lg font-semibold text-gray-900">No individual clients found</h3>
                          <p className="text-gray-500 text-sm max-w-md">
                            {searchTerm 
                              ? "Try adjusting your search criteria or clear the search to view all clients."
                              : "No individual clients have been registered yet."
                            }
                          </p>
                        </div>
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
                  <span className="font-semibold text-gray-900">{clients.length}</span> individual clients
                  {searchTerm && (
                    <span className="ml-2 text-blue-600">
                      • Filtered by "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && clientToUpdate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Status Change
              </h3>
              <p className="text-gray-500 mb-2">
                Are you sure you want to change the status of <span className="font-semibold text-gray-900">{clientToUpdate.name}</span> from{' '}
                <span className={`font-semibold ${
                  clientToUpdate.currentStatus === 'Active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {clientToUpdate.currentStatus}
                </span> to{' '}
                <span className={`font-semibold ${
                  clientToUpdate.currentStatus === 'Active' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {clientToUpdate.currentStatus === 'Active' ? 'Inactive' : 'Active'}
                </span>?
              </p>
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  onClick={handleCancelToggleStatus}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  disabled={updatingClientId === clientToUpdate.id}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmToggleStatus}
                  className={`px-4 py-2 text-white rounded-md transition-colors duration-200 ${
                    clientToUpdate.currentStatus === 'Active'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={updatingClientId === clientToUpdate.id}
                >
                  {updatingClientId === clientToUpdate.id ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </span>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualClientsPage;




