import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, FileText, Briefcase, PlusCircle } from 'lucide-react';
import { mockCases } from '../../utils/mockData';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getClientById } from '../../controllers/ClientControllers';

const ClientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        if (!id) {
          throw new Error('Client ID is required');
        }
        const clientData = await getClientById(id);
        const relatedCases = mockCases.filter(c => c.clientId === id);
        setClient(clientData);
        setClientCases(relatedCases);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/clients" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <span className={`ml-4 px-3 py-1 text-sm font-medium rounded-full ${
            client.status === 'Active' 
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {client.status}
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
                    <a href={`mailto:${client.email}`} className="text-primary-600 hover:text-primary-700">
                      {client.email}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <div className="flex items-center mt-1">
                    <Phone size={16} className="text-gray-400 mr-2" />
                    <a href={`tel:${client.phone}`} className="text-primary-600 hover:text-primary-700">
                      {client.phone}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <div className="flex items-center mt-1">
                    <MapPin size={16} className="text-gray-400 mr-2" />
                    <span>
                      {client.address.street}, {client.address.city}, {client.address.state} {client.address.zipCode}, {client.address.country}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <div className="flex items-center mt-1">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span>{new Date(client.dateOfBirth).toLocaleDateString()}</span>
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
                  <p className="font-medium mt-1">{client.alienNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium mt-1">{client.nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Passport Number</p>
                  <p className="font-medium mt-1">{client.passportNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entry Date</p>
                  <p className="font-medium mt-1">{new Date(client.entryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visa Category</p>
                  <p className="font-medium mt-1">{client.visaCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium mt-1">{client.status}</p>
                </div>
              </div>
              {client.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium mt-1">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cases</h2>
              <Link
                to="/cases/new"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + New Case
              </Link>
            </div>
            <div className="p-4">
              {clientCases.length > 0 ? (
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {caseItem.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              caseItem.status === 'Active' ? 'bg-green-100 text-green-800' :
                              caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {caseItem.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(caseItem.openDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No cases</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new case for this client.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/cases/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      New Case
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