import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Upload,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  FolderPlus,
  Eye,
  Users
} from 'lucide-react';
import { mockClients } from '../../utils/mockData';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const documentTypes = ['all', ...new Set(mockDocuments.map(doc => doc.type))];
  const statusTypes = ['all', 'Verified', 'Pending Review', 'Needs Update'];

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    const matchesClient = selectedClient === 'all' || doc.clientId === selectedClient;
    return matchesSearch && matchesType && matchesStatus && matchesClient;
  });

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
              <option value="all">All Clients</option>
              {mockClients.map(client => (
                <option key={client.id} value={client.id}>
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

        {/* Client Groups */}
        {selectedClient === 'all' && (
          <div className="mb-6">
            {mockClients.map(client => {
              const clientDocs = filteredDocuments.filter(doc => doc.clientId === client.id);
              if (clientDocs.length === 0) return null;

              return (
                <div key={client.id} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-gray-400" size={20} />
                    <h2 className="text-lg font-medium text-gray-900">{client.name}</h2>
                    <span className="text-sm text-gray-500">
                      ({clientDocs.length} document{clientDocs.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Document
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
                        {clientDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50">
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
                              {doc.size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button className="text-gray-400 hover:text-gray-500">
                                  <Eye size={18} />
                                </button>
                                <button className="text-gray-400 hover:text-gray-500">
                                  <Download size={18} />
                                </button>
                                <button className="text-gray-400 hover:text-gray-500">
                                  <Trash2 size={18} />
                                </button>
                                <button className="text-gray-400 hover:text-gray-500">
                                  <MoreVertical size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Single Client View */}
        {selectedClient !== 'all' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
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
                  <tr key={doc.id} className="hover:bg-gray-50">
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
                      {doc.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-gray-400 hover:text-gray-500">
                          <Eye size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-500">
                          <Download size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-500">
                          <Trash2 size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-500">
                          <MoreVertical size={18} />
                        </button>
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
        )}

        {filteredDocuments.length > 0 && (
          <div className="flex justify-between items-center mt-4 py-3">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredDocuments.length}</span> of{" "}
              <span className="font-medium">{mockDocuments.length}</span> documents
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
                          <select className="mt-1 form-select">
                            {mockClients.map(client => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Document Type
                          </label>
                          <select className="mt-1 form-select">
                            <option>Identity Document</option>
                            <option>Supporting Document</option>
                            <option>Financial Document</option>
                            <option>Legal Document</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Related Case
                          </label>
                          <select className="mt-1 form-select">
                            <option>CF-2023-1001</option>
                            <option>CF-2023-1002</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea 
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
                                  <span>Upload a file</span>
                                  <input id="file-upload" name="file-upload" type="file" className="sr-only" />
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
    </div>
  );
};

export default DocumentsPage;