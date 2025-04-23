import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, Clock, Users, Calendar, CheckSquare } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// This would normally come from an API
const mockCaseData = {
  id: '1',
  title: 'Johnson v. Smith',
  caseNumber: 'CV-2023-12345',
  caseType: 'Civil Litigation',
  status: 'Active',
  openDate: '2023-08-15',
  assignedTo: 'Sarah Reynolds',
  courtLocation: 'Central District Court',
  judge: 'Hon. Marcus Williams',
  description: 'Personal injury case resulting from automobile accident on July 10, 2023. Client seeking compensatory damages for medical expenses and lost wages.',
  clientId: '1',
  clientName: 'Robert Johnson',
  clientEmail: 'robert.johnson@example.com',
  clientPhone: '(555) 123-4567',
  nextHearing: '2023-12-10',
  tasks: [
    { id: '1', title: 'Prepare discovery documents', dueDate: '2023-09-20', status: 'Completed' },
    { id: '2', title: 'Deposition of defendant', dueDate: '2023-10-15', status: 'Pending' },
    { id: '3', title: 'File motion for summary judgment', dueDate: '2023-11-30', status: 'Not Started' }
  ],
  documents: [
    { id: '1', title: 'Complaint', dateAdded: '2023-08-15', category: 'Pleadings' },
    { id: '2', title: 'Police Report', dateAdded: '2023-08-20', category: 'Evidence' },
    { id: '3', title: 'Medical Records', dateAdded: '2023-09-05', category: 'Evidence' }
  ],
  notes: [
    { id: '1', content: 'Initial consultation with client. Discussed case details and strategy.', date: '2023-08-15', author: 'Sarah Reynolds' },
    { id: '2', content: 'Received police report. Notes indicate defendant ran red light.', date: '2023-08-20', author: 'Sarah Reynolds' }
  ]
};

const CaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // In a real application, this would be an API call
    const fetchCaseData = () => {
      // Simulate API delay
      setTimeout(() => {
        setCaseData(mockCaseData);
        setLoading(false);
      }, 500);
    };

    fetchCaseData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Case Not Found</h1>
        <p>The case you are looking for does not exist or has been removed.</p>
        <Link to="/cases" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/cases" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{caseData.title}</h1>
          <span className="ml-4 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
            {caseData.status}
          </span>
        </div>
        <Link 
          to={`/cases/${id}/edit`}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Edit size={16} className="mr-2" />
          Edit Case
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main case information */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="border-b p-4">
            <h2 className="text-xl font-semibold">Case Information</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Case Number</p>
                <p className="font-medium">{caseData.caseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Case Type</p>
                <p className="font-medium">{caseData.caseType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Open Date</p>
                <p className="font-medium">{caseData.openDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned Attorney</p>
                <p className="font-medium">{caseData.assignedTo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Court Location</p>
                <p className="font-medium">{caseData.courtLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Judge</p>
                <p className="font-medium">{caseData.judge}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{caseData.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client information */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b p-4">
            <h2 className="text-xl font-semibold">Client Information</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                <Link to={`/clients/${caseData.clientId}`} className="text-blue-600 hover:text-blue-800">
                  {caseData.clientName}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{caseData.clientEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{caseData.clientPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Hearing</p>
              <p className="font-medium">{caseData.nextHearing}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks section */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center">
            <CheckSquare size={20} className="mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold">Tasks</h2>
          </div>
          <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-800">
            View All Tasks
          </Link>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {caseData.tasks.map((task: any) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{task.dueDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Documents section */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center">
            <FileText size={20} className="mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold">Documents</h2>
          </div>
          <Link to="/documents" className="text-sm text-blue-600 hover:text-blue-800">
            View All Documents
          </Link>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {caseData.documents.map((doc: any) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                        {doc.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{doc.dateAdded}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{doc.category}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes section */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="border-b p-4">
          <h2 className="text-xl font-semibold">Case Notes</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {caseData.notes.map((note: any) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{note.author}</p>
                  <p className="text-sm text-gray-500">{note.date}</p>
                </div>
                <p className="text-gray-700">{note.content}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Add Note</h3>
            <textarea
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter your note here..."
            ></textarea>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsPage;