import { useState, useEffect } from 'react';
import { 
  Search, 
  Upload,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  FolderPlus,
  Eye,
  Users,
  CheckCircle,
  XCircle,
  Pencil
} from 'lucide-react';
import { 
  Document, 
  getDocuments,
  deleteDocument,
  downloadDocument,
  previewDocument,
  verifyDocument,
  rejectDocument,
  updateDocument
} from '../../controllers/DocumentControllers';
import { getCompanyClients, Client as BaseClient } from '../../controllers/ClientControllers';
import api from '../../utils/api';

// Extend Client type to allow _id for MongoDB compatibility
type Client = BaseClient & { _id?: string };

// Types for workflow data
type WorkflowClient = {
  id?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type WorkflowCase = {
  id?: string;
  _id?: string;
  caseNumber?: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  status?: string;
};

type Workflow = {
  _id: string;
  client?: WorkflowClient;
  case?: WorkflowCase;
  formCaseIds?: Record<string, string>;
  status?: string;
  createdAt?: string;
};

type CaseOption = {
  id: string;
  caseNumber: string;
  clientName: string;
  clientId: string;
  workflowId: string;
  formName?: string; // Optional form name (e.g., "G-28")
};

// Enhanced mock data with client associations
const mockDocuments = [
  {
    id: 'doc1',
    name: 'Passport.pdf',
    type: 'Identity Document',
    size: '2.4 MB',
    uploadedBy: 'Maria Garcia',
    uploadedAt: '2023-06-15',
    status: 'Verified',
    caseNumber: 'CF-2023-1001',
    clientId: 'client-1'
  },
  {
    id: 'doc2',
    name: 'Birth_Certificate.pdf',
    type: 'Identity Document',
    size: '1.8 MB',
    uploadedBy: 'Maria Garcia',
    uploadedAt: '2023-06-14',
    status: 'Pending Review',
    caseNumber: 'CF-2023-1001',
    clientId: 'client-1'
  },
  {
    id: 'doc3',
    name: 'Marriage_Certificate.pdf',
    type: 'Supporting Document',
    size: '3.1 MB',
    uploadedBy: 'Maria Garcia',
    uploadedAt: '2023-06-13',
    status: 'Verified',
    caseNumber: 'CF-2023-1001',
    clientId: 'client-1'
  },
  {
    id: 'doc4',
    name: 'Employment_Letter.pdf',
    type: 'Supporting Document',
    size: '1.2 MB',
    uploadedBy: 'John Smith',
    uploadedAt: '2023-06-12',
    status: 'Needs Update',
    caseNumber: 'CF-2023-1002',
    clientId: 'client-2'
  },
  {
    id: 'doc5',
    name: 'Tax_Returns_2022.pdf',
    type: 'Financial Document',
    size: '4.5 MB',
    uploadedBy: 'John Smith',
    uploadedAt: '2023-06-11',
    status: 'Verified',
    caseNumber: 'CF-2023-1002',
    clientId: 'client-2'
  }
];

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Workflow-related state
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowClients, setWorkflowClients] = useState<WorkflowClient[]>([]);
  const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  // Upload state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadClientId, setUploadClientId] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Identity Document');
  const [uploadCaseNumber, setUploadCaseNumber] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [updateName, setUpdateName] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');

  // Enhanced function to fetch workflows and extract client names and case IDs
  const fetchWorkflowsFromAPI = async () => {
    try {
      setLoadingWorkflows(true);
      const token = localStorage.getItem('token');

      // Check token availability
      if (!token) {
        return { workflows: [], clients: [], cases: [] };
      }

      // Request workflows from API
      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100 // Get more workflows to find more clients and cases
        }
      });

      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        // Extract unique clients from workflows
        const clientsMap = new Map<string, WorkflowClient>();
        const casesArray: CaseOption[] = [];

        workflows.forEach((workflow: Workflow) => {
          const workflowClient = workflow.client || {};
          const workflowCase = workflow.case || {};
          
          
          // Extract client information
          if (workflowClient.email || workflowClient.name || workflowClient.firstName) {
            // Use email as primary identifier since workflow client IDs are often empty
            const clientEmail = workflowClient.email;
            const clientId = clientEmail || workflowClient.id || workflowClient._id || workflow._id;
            const clientName = workflowClient.name || 
                             (workflowClient.firstName && workflowClient.lastName ? 
                              `${workflowClient.firstName} ${workflowClient.lastName}` : 
                              workflowClient.firstName || workflowClient.lastName || 
                              workflowClient.email || 'Unknown Client');

            if (!clientsMap.has(clientId)) {
              clientsMap.set(clientId, {
                id: clientId,
                _id: clientId,
                name: clientName,
                firstName: workflowClient.firstName,
                lastName: workflowClient.lastName,
                email: workflowClient.email,
                phone: workflowClient.phone
              });
            }

            // Extract case information - handle multiple form case IDs
            if (workflow.formCaseIds && Object.keys(workflow.formCaseIds).length > 0) {
              // Extract all form case IDs from the formCaseIds object
              Object.entries(workflow.formCaseIds).forEach(([formName, caseId]) => {
                if (caseId && String(caseId).trim() !== '') {
                  casesArray.push({
                    id: `${workflow._id}_${formName}`,
                    caseNumber: String(caseId), // This will be like "CR-2025-3672"
                    clientName: clientName,
                    clientId: clientId,
                    workflowId: workflow._id,
                    formName: formName // Add form name for reference (e.g., "G-28")
                  });
                }
              });
            } else if (workflowCase.caseNumber) {
              // Fallback to workflow case number if no formCaseIds
              casesArray.push({
                id: workflowCase.id || workflowCase._id || workflow._id,
                caseNumber: String(workflowCase.caseNumber),
                clientName: clientName,
                clientId: clientId,
                workflowId: workflow._id
              });
            } else {
              // Generate a fallback case ID
              casesArray.push({
                id: workflow._id,
                caseNumber: `WF-${workflow._id?.slice(-8)}`,
                clientName: clientName,
                clientId: clientId,
                workflowId: workflow._id
              });
            }
          }
        });

        const uniqueClients = Array.from(clientsMap.values());
        
        
        return {
          workflows: workflows,
          clients: uniqueClients,
          cases: casesArray
        };
      } else {
        return { workflows: [], clients: [], cases: [] };
      }

    } catch (error: any) {
      console.error('❌ Error fetching workflows:', error);
      

      return { workflows: [], clients: [], cases: [] };
    } finally {
      setLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await getDocuments();
        if (response.success) {
          setDocuments(response.data.documents || []);
        } else {
          console.error("Failed to fetch documents", response.message);
          setDocuments(mockDocuments.map(d => ({...d, _id: d.id, size: parseInt(d.size), mimeType: 'application/pdf', uploadedAt: new Date(d.uploadedAt).toISOString(), version: 1, isPublic: false, createdAt: new Date(d.uploadedAt).toISOString(), updatedAt: new Date(d.uploadedAt).toISOString(), status: d.status as any, sizeFormatted: d.size })));
        }
      } catch (error) {
        console.error("Failed to fetch documents", error);
        setDocuments(mockDocuments.map(d => ({...d, _id: d.id, size: parseInt(d.size), mimeType: 'application/pdf', uploadedAt: new Date(d.uploadedAt).toISOString(), version: 1, isPublic: false, createdAt: new Date(d.uploadedAt).toISOString(), updatedAt: new Date(d.uploadedAt).toISOString(), status: d.status as any, sizeFormatted: d.size })));
      }
    };
    const fetchClients = async () => {
      try {
        const clientResponse = await getCompanyClients();
        const clientList = clientResponse.clients || [];
        setClients(clientList);
      } catch (error) {
        console.error('Failed to fetch clients', error);
        setClients([]);
      }
    };
    
    const fetchWorkflowData = async () => {
      try {
        const workflowData = await fetchWorkflowsFromAPI();
        setWorkflows(workflowData.workflows);
        setWorkflowClients(workflowData.clients);
        setAvailableCases(workflowData.cases);
        
        // Merge workflow clients with existing clients (avoid duplicates by email)
        if (workflowData.clients.length > 0) {
          setClients(prev => {
            const existingClientEmails = new Set(prev.map(c => c.email?.toLowerCase()));
            const newClients = workflowData.clients.filter(wc => 
              wc.email && !existingClientEmails.has(wc.email.toLowerCase())
            );
            
            const convertedClients = newClients.map(wc => ({
              id: wc.email || wc.id || wc._id || '', // Use email as ID for workflow clients
              _id: wc.email || wc._id || wc.id,      // Use email as _id for workflow clients
              name: wc.name || '',
              email: wc.email || '',
              phone: wc.phone || '',
              dateOfBirth: '',
              nationality: '',
              alienNumber: '',
              passportNumber: '',
              entryDate: '',
              visaCategory: '',
              notes: '',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'United States'
              }
            } as Client));

            return [...prev, ...convertedClients];
          });
        }
      } catch (error) {
        console.error('Failed to fetch workflow data', error);
      }
    };
    
    fetchDocuments();
    fetchClients();
    fetchWorkflowData();
  }, []);

  // Defensive fallback in case documents is undefined
  const documentTypes = ['all', ...new Set((documents || []).map(doc => doc.type))];
  const statusTypes = ['all', 'Verified', 'Pending Review', 'Needs Update', 'Rejected', 'Archived'];

  const filteredDocuments = documents.filter(doc => {
    const docName = doc.name || '';
    const caseNum = doc.caseNumber || '';
    const matchesSearch = docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseNum.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    const matchesClient = selectedClient === 'all' || doc.clientId === selectedClient;
    return matchesSearch && matchesType && matchesStatus && matchesClient;
  });

  // Helper function to get client name by ID
  const getClientNameById = (clientId: string): string => {
    const client = clients.find(c => (c._id || c.id) === clientId);
    return client?.name || 'Unknown Client';
  };

  // Helper function to get cases for the selected client
  const getAvailableCasesForClient = () => {
    if (!uploadClientId) {
      return availableCases;
    }
    
    // Find the selected client to get their email for matching
    const selectedClient = clients.find(c => (c._id || c.id) === uploadClientId);
    const selectedClientEmail = selectedClient?.email;
    
    // Filter cases by both client ID and email (since workflow clients use email as ID)
    return availableCases.filter(caseOption => {
      return caseOption.clientId === uploadClientId || 
             (selectedClientEmail && caseOption.clientId === selectedClientEmail);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload || !uploadClientId) {
      console.error('Please select a file and a client.');
      return;
    }

    try {
      // Find the selected client to get their name and email
      const selectedClient = clients.find(c => (c._id || c.id) === uploadClientId);
      const clientName = selectedClient?.name || 'Unknown Client';
      const clientEmail = selectedClient?.email || '';

      // Use the direct API endpoint for document upload
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('clientId', uploadClientId);
      formData.append('clientName', clientName);
      if (clientEmail) {
        formData.append('clientEmail', clientEmail);
      }
      formData.append('type', uploadDocType);
      
      // Add optional fields if they exist
      if (uploadCaseNumber) {
        formData.append('caseNumber', uploadCaseNumber);
      }
      if (uploadDescription) {
        formData.append('description', uploadDescription);
      }

      const token = localStorage.getItem('token');
      
      const response = await api.post('/api/v1/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      
      if (response.data?.success) {
        // Add the new document to the list
        if (response.data.data) {
          setDocuments([response.data.data, ...documents]);
        }
        setShowUploadModal(false);
        // Reset form
        setFileToUpload(null);
        setUploadClientId('');
        setUploadCaseNumber('');
        setUploadDescription('');
      } else {
        const errorMessage = response.data?.message || 'Upload failed';
        console.error(`Upload failed: ${errorMessage}`);
        console.error('❌ Upload failed:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Failed to upload document:', error);
      
      let errorMessage = 'An error occurred during upload';
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        // Error in setting up request
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      console.error(`Upload error: ${errorMessage}`);
    }
  };

  const handleOpenEditModal = (doc: Document) => {
    setEditingDocument(doc);
    setUpdateName(doc.name);
    setUpdateDescription(doc.description || '');
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleUpdate = async () => {
    if (!editingDocument) return;

    try {
      const response = await updateDocument(editingDocument._id, {
        name: updateName,
        description: updateDescription,
      });

      if (response.success) {
        setDocuments(documents.map(d => (d._id === editingDocument._id ? response.data : d)));
        setShowEditModal(false);
        setEditingDocument(null);
      } else {
        console.error(`Update failed: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update document', error);
      console.error('An error occurred during update.');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await deleteDocument(documentId);
        if (response.success) {
          setDocuments(documents.filter(d => d._id !== documentId));
        } else {
          console.error(`Failed to delete document: ${response.message}`);
        }
      } catch (error) {
        console.error('Failed to delete document', error);
        console.error('An error occurred while deleting the document.');
      }
    }
  };

  const handleDownload = async (documentId: string, documentName: string) => {
    try {
      await downloadDocument(documentId, documentName);
    } catch (error) {
      console.error('Failed to download document', error);
      console.error('An error occurred while downloading the document.');
    }
  };

  const handlePreview = async (documentId: string) => {
    try {
      await previewDocument(documentId);
    } catch (error) {
      console.error('Failed to preview document', error);
      console.error('An error occurred while previewing the document.');
    }
  };

  const handleVerify = async (documentId: string) => {
    try {
      const response = await verifyDocument(documentId);
      if (response.success) {
        setDocuments(documents.map(d => d._id === documentId ? {...d, status: 'Verified'} : d));
      } else {
        console.error(`Failed to verify document: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to verify document', error);
      console.error('An error occurred while verifying the document.');
    }
  };

  const handleReject = async (documentId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        const response = await rejectDocument(documentId, reason);
        if (response.success) {
          setDocuments(documents.map(d => d._id === documentId ? {...d, status: 'Rejected'} : d));
        } else {
          console.error(`Failed to reject document: ${response.message}`);
        }
      } catch (error) {
        console.error('Failed to reject document', error);
        console.error('An error occurred while rejecting the document.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            <Upload size={18} />
            <span>Upload Document</span>
          </button>
          <button className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors">
            <FolderPlus size={18} />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 bg-white"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option key="all" value="all">All Clients</option>
              {clients.map(client => (
                <option key={client._id || client.id} value={client._id || client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 bg-white"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {documentTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 bg-white"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusTypes.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents Table with Client Name Column */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500">{doc.uploadedBy}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{getClientNameById(doc.clientId)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doc.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-primary-600">{doc.caseNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doc.status === 'Verified' 
                        ? 'bg-green-100 text-green-800'
                        : doc.status === 'Pending Review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.uploadedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.sizeFormatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => handlePreview(doc._id)} className="text-gray-400 hover:text-gray-500">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleDownload(doc._id, doc.name)} className="text-gray-400 hover:text-gray-500">
                        <Download size={18} />
                      </button>
                      <button onClick={() => handleDelete(doc._id)} className="text-gray-400 hover:text-gray-500">
                        <Trash2 size={18} />
                      </button>
                      <div className="relative inline-block text-left">
                        <button onClick={() => setOpenMenuId(openMenuId === doc._id ? null : doc._id)} className="text-gray-400 hover:text-gray-500">
                          <MoreVertical size={18} />
                        </button>
                        {openMenuId === doc._id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                              <button onClick={() => { handleVerify(doc._id); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <CheckCircle size={16} /> Verify
                              </button>
                              <button onClick={() => { handleReject(doc._id); setOpenMenuId(null); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <XCircle size={16} /> Reject
                              </button>
                              <button onClick={() => handleOpenEditModal(doc)} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Pencil size={16} /> Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading a new document.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Upload className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Upload Document
                </button>
              </div>
            </div>
          )}
        </div>

        {filteredDocuments.length > 0 && (
          <div className="flex justify-between items-center mt-4 py-3">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredDocuments.length}</span> of{" "}
              <span className="font-medium">{documents.length}</span> documents
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Upload Document
                    </h3>
                    <div className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Client
                          </label>
                          <select 
                            value={uploadClientId} 
                            onChange={(e) => {
                              setUploadClientId(e.target.value);
                              setUploadCaseNumber(''); // Clear case selection when client changes
                            }} 
                            className="mt-1 form-select"
                            disabled={loadingWorkflows}
                          >
                            <option value="" disabled>
                              {loadingWorkflows ? 'Loading clients...' : 'Select a client'}
                            </option>
                            {clients.map(client => (
                              <option key={client._id || client.id} value={client._id || client.id}>
                                {client.name} {client.email ? `(${client.email})` : ''}
                              </option>
                            ))}
                            {/* Temporary: Show workflow clients directly if regular clients are empty */}
                            {clients.length === 0 && workflowClients.length > 0 && workflowClients.map(wc => (
                              <option key={wc.email || wc.id} value={wc.email || wc.id}>
                                [WF] {wc.name} {wc.email ? `(${wc.email})` : ''}
                              </option>
                            ))}
                          </select>
                          {loadingWorkflows && (
                            <p className="mt-1 text-xs text-gray-500">
                              Loading clients and cases from workflows...
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Document Type
                          </label>
                          <select value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} className="mt-1 form-select">
                            <option key="identity">Identity Document</option>
                            <option key="supporting">Supporting Document</option>
                            <option key="financial">Financial Document</option>
                            <option key="legal">Legal Document</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Related Case
                          </label>
                          <select 
                            value={uploadCaseNumber} 
                            onChange={(e) => setUploadCaseNumber(e.target.value)} 
                            className="mt-1 form-select"
                            disabled={loadingWorkflows || !uploadClientId}
                          >
                            <option value="" disabled>
                              {loadingWorkflows ? 'Loading cases...' : 
                               !uploadClientId ? 'Select a client first' : 'Select a case'}
                            </option>
                            {getAvailableCasesForClient().map((caseOption) => (
                              <option key={caseOption.id} value={caseOption.caseNumber}>
                                {caseOption.caseNumber} - {caseOption.clientName}
                                {caseOption.formName ? ` (${caseOption.formName})` : ''}
                              </option>
                            ))}
                            {/* Temporary: Show all cases if filtered list is empty */}
                            {uploadClientId && getAvailableCasesForClient().length === 0 && availableCases.slice(0, 5).map((caseOption) => (
                              <option key={`all_${caseOption.id}`} value={caseOption.caseNumber}>
                                [ALL] {caseOption.caseNumber} - {caseOption.clientName}
                                {caseOption.formName ? ` (${caseOption.formName})` : ''}
                              </option>
                            ))}
                            {/* Show all cases if no client selected */}
                            {!uploadClientId && availableCases.map((caseOption) => (
                              <option key={caseOption.id} value={caseOption.caseNumber}>
                                {caseOption.caseNumber} - {caseOption.clientName}
                                {caseOption.formName ? ` (${caseOption.formName})` : ''}
                              </option>
                            ))}
                            {/* Fallback options if no workflow cases available */}
                            {availableCases.length === 0 && !loadingWorkflows && (
                              <>
                                <option value="CF-2023-1001">CF-2023-1001 - Sample Case</option>
                                <option value="CF-2023-1002">CF-2023-1002 - Sample Case</option>
                              </>
                            )}
                          </select>
                          {uploadClientId && getAvailableCasesForClient().length === 0 && !loadingWorkflows && (
                            <p className="mt-1 text-xs text-orange-600">
                              No cases found for this client. You can still enter a case number manually.
                            </p>
                          )}
                          {/* Debug info */}
                          {import.meta.env.DEV && (
                            <div className="mt-2 text-xs text-gray-500">
                              <p>Workflows loaded: {workflows.length}</p>
                              <p>Workflow clients: {workflowClients.length}</p>
                              <p>Available cases: {availableCases.length}</p>
                              <p>Total clients in dropdown: {clients.length}</p>
                              {clients.length > 0 && (
                                <details className="mt-1">
                                  <summary>Sample clients</summary>
                                  <pre className="text-xs mt-1">
                                    {JSON.stringify(clients.slice(0, 2).map(c => ({
                                      id: c.id,
                                      _id: c._id,
                                      name: c.name,
                                      email: c.email
                                    })), null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea 
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            className="mt-1 form-input"
                            rows={3}
                            placeholder="Enter a brief description of the document"
                          />
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                                >
                                  <span>{fileToUpload ? fileToUpload.name : 'Upload a file'}</span>
                                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSelect} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PDF, PNG, JPG up to 10MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpload}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Upload
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edit Document
                    </h3>
                    <div className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Document Name
                          </label>
                          <input 
                            type="text"
                            value={updateName}
                            onChange={(e) => setUpdateName(e.target.value)}
                            className="mt-1 form-input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea 
                            value={updateDescription}
                            onChange={(e) => setUpdateDescription(e.target.value)}
                            className="mt-1 form-input"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Update
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
