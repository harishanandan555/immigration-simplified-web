import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, FileText, Briefcase, PlusCircle, Download, Eye, Clock } from 'lucide-react';
import { 
  Document, 
  getDocuments,
  downloadDocument,
  previewDocument
} from '../../controllers/DocumentControllers';
import { getClientById, Client } from '../../controllers/ClientControllers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ClientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Document-related state
  const [clientDocuments, setClientDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  // Activity-related state
  const [activities, setActivities] = useState<any[]>([]);

  // Function to fetch client documents
  const fetchClientDocuments = async (clientId: string, clientData?: any) => {
    try {
      setLoadingDocuments(true);
      
      const response = await getDocuments();
      
      if (response.success) {
        // Handle the actual API response structure - same fix as DocumentsPage
        const responseData = response.data as any;
        const allDocuments = responseData.data?.documents || responseData.documents || [];
        
        // Filter documents by client email (primary method)
        const clientEmail = (clientData || client)?.email?.trim().toLowerCase() || '';
        
        const filteredDocuments = allDocuments.filter((doc: Document) => {
          // Primary strategy: Match by client email
          // This works with the new clientEmail field we added to document uploads
          const docClientEmail = (doc as any).clientEmail?.toString().trim().toLowerCase() || '';
          const docUploadedBy = (doc as any).uploadedBy?.toString().trim().toLowerCase() || '';
          
          // Strategy 1: Direct email match in clientEmail field (new field)
          const matchesClientEmail = docClientEmail === clientEmail;
          
          // Strategy 2: Email match in uploadedBy field (fallback)
          const matchesUploadedByEmail = docUploadedBy === clientEmail;
          
          // Strategy 3: For backward compatibility, check if clientId matches our client
          const docClientId = (doc as any).clientId?.toString().trim().toLowerCase() || '';
          const searchClientId = clientId?.toString().trim().toLowerCase() || '';
          const clientActualId = (clientData || client)?._id?.toString().trim().toLowerCase() || '';
          const matchesClientId = docClientId === searchClientId || docClientId === clientActualId;
          
          const isMatch = matchesClientEmail || matchesUploadedByEmail || matchesClientId;
          
          return isMatch;
        });
        
        // Process documents for display with formatted data
        const processedDocuments = processDocumentsForDisplay(filteredDocuments);
        setClientDocuments(processedDocuments);
        
        // Generate activity log only from the client's documents (not all documents)
        const documentActivities = processedDocuments.map((doc: Document) => ({
          id: `doc-${doc._id}`,
          type: 'document_upload',
          description: `Document "${doc.name}" uploaded`,
          timestamp: doc.uploadedAt || doc.createdAt,
          icon: 'FileText',
          data: {
            documentName: doc.name,
            documentType: doc.type,
            documentId: doc._id
          }
        }));
        
        // Sort activities by timestamp (newest first)
        const sortedActivities = documentActivities.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setActivities(sortedActivities);
      } else {
        console.error('Failed to fetch documents:', response.message);
        setClientDocuments([]);
        setActivities([]);
      }
    } catch (error) {
      console.error('❌ Error fetching client documents:', error);
      setClientDocuments([]);
      setActivities([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Helper function to get time ago string
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return past.toLocaleDateString();
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper function to process documents for display
  const processDocumentsForDisplay = (documents: any[]): Document[] => {
    return documents.map(doc => ({
      ...doc,
      sizeFormatted: formatFileSize(doc.size || 0),
      uploadedAt: doc.uploadedAt || doc.createdAt,
      uploadedBy: doc.uploadedBy || 'Unknown User'
    }));
  };

  // Document action handlers
  const handleDownloadDocument = async (documentId: string, documentName: string) => {
    try {
      await downloadDocument(documentId, documentName);
    } catch (error) {
      console.error('Failed to download document', error);
      toast.error('Failed to download document');
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      await previewDocument(documentId);
    } catch (error) {
      console.error('Failed to preview document', error);
      toast.error('Failed to preview document');
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        if (!id) {
          throw new Error('Client ID is required');
        }
        
        setLoading(true);
        
        // Fetch client data using getClientById
        const clientData = await getClientById(id);
        setClient(clientData);
        
        // Fetch client cases (if available)
        try {
          const cases = await api.get(`/api/v1/clients/${id}/cases`);
          setClientCases(cases.data || []);
        } catch (caseError) {
          console.warn('Could not fetch client cases:', caseError);
          setClientCases([]);
        }
        
        // Fetch client documents
        await fetchClientDocuments(id, clientData);
        
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
    ...client,
    name: client?.name || 'Unknown Client',
    email: client?.email || 'No email provided',
    phone: client?.phone || 'No phone provided',
    status: client?.status || 'Unknown'
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
                  <p className="font-medium mt-1">{safeClient.alienRegistrationNumber || 'Not provided'}</p>
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
              <h2 className="text-xl font-semibold">Client Cases</h2>
              <Link
                to="/cases/new"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + New Case
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading cases...</span>
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
                          Created Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientCases.map((caseItem) => (
                        <tr key={caseItem.id || caseItem._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              to={`/cases/${caseItem.id || caseItem._id}`}
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              {caseItem.caseNumber || caseItem.title || `Case ${(caseItem.id || caseItem._id).slice(-8)}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {caseItem.type || caseItem.category || 'Immigration Case'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              caseItem.status === 'Active' || caseItem.status === 'In Progress' ? 'bg-green-100 text-green-800' :
                              caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {caseItem.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : 'N/A'}
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
                    No cases found for this client.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/cases/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Create New Case
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
              {loadingDocuments ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
                </div>
              ) : clientDocuments.length > 0 ? (
                <div className="space-y-3">
                  {clientDocuments.slice(0, 5).map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                      <div className="flex items-center flex-1">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.size || 0)} • {getTimeAgo(doc.uploadedAt || doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreviewDocument(doc._id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Preview document"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc._id, doc.name)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Download document"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {clientDocuments.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Showing 5 of {clientDocuments.length} documents
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No documents have been uploaded for this client yet.
                  </p>
                </div>
              )}
              <Link
                to={`/documents?client=${id}`}
                className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700"
              >
                View all documents
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>
            <div className="p-4">
              {activities.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {activities.slice(0, 10).map((activity, index) => (
                      <li key={activity.id} className={index !== activities.length - 1 && index !== 9 ? "relative pb-8" : "relative"}>
                        {index !== activities.length - 1 && index !== 9 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                              {activity.icon === 'FileText' ? (
                                <FileText className="h-4 w-4 text-white" />
                              ) : (
                                <Clock className="h-4 w-4 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.description}
                                {activity.data?.documentType && (
                                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {activity.data.documentType}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={activity.timestamp}>
                                {getTimeAgo(activity.timestamp)}
                              </time>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Activity will appear here when documents are uploaded or cases are created.
                  </p>
                </div>
              )}
              {activities.length > 10 && (
                <div className="mt-6 text-center">
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    View full activity log ({activities.length} total activities)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsPage;