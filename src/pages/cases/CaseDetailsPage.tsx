import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, CheckSquare, MessageCircle } from 'lucide-react';
import api from '../../utils/api';
import { getTasks, Task } from '../../controllers/TaskControllers';
import { getDocuments, Document } from '../../controllers/DocumentControllers';

// Types for workflow case data
type WorkflowCase = {
  _id: string;
  workflowId: string;
  caseNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedForms: string[];
  formCaseIds: { [key: string]: string };
  client: {
    _id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    nationality?: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  currentStep: number;
  selectedForms: string[];
  questionnaireAssignment?: {
    questionnaire_id: string;
    questionnaire_title: string;
    response_id?: string;
    is_complete: boolean;
    submitted_at?: string;
    responses?: any;
  };
  createdAt: string;
  updatedAt: string;
};

// This would normally come from an API

const CaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<WorkflowCase | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the specific workflow/case
        console.log('🔍 Fetching case data for ID:', id);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found. Please login.');
          return;
        }

        // Get all workflows and find the specific one
        const workflowResponse = await api.get('/api/v1/workflows', {
          params: { page: 1, limit: 100 }
        });

        if (!workflowResponse.data?.success || !workflowResponse.data?.data) {
          setError('Failed to fetch case data');
          return;
        }

        const workflows = workflowResponse.data.data;
        const workflow = workflows.find((w: any) => w._id === id);

        if (!workflow) {
          setError('Case not found');
          return;
        }

        // Transform workflow to WorkflowCase format
        const workflowClient = workflow.client || {};
        const workflowCase = workflow.case || {};
        
        const formCaseIds = workflow.formCaseIds || {};
        const primaryCaseNumber = Object.values(formCaseIds)[0] as string || 
                                workflowCase.caseNumber || 
                                `WF-${workflow._id?.slice(-8)}`;

        const transformedCase: WorkflowCase = {
          _id: workflow._id,
          workflowId: workflow.workflowId || workflow._id,
          caseNumber: primaryCaseNumber,
          title: workflowCase.title || workflowCase.description || 'Immigration Case',
          description: workflowCase.description || workflowCase.title || 'Immigration workflow case',
          category: workflowCase.category || 'immigration',
          subcategory: workflowCase.subcategory || '',
          status: workflowCase.status || workflow.status || 'in-progress',
          priority: workflowCase.priority || 'Medium',
          dueDate: workflowCase.dueDate || '',
          assignedForms: workflowCase.assignedForms || workflow.selectedForms || [],
          formCaseIds: formCaseIds,
          client: {
            _id: workflowClient.id || workflowClient._id || '',
            name: workflowClient.name || 
                  `${workflowClient.firstName || ''} ${workflowClient.lastName || ''}`.trim(),
            email: workflowClient.email || '',
            firstName: workflowClient.firstName || '',
            lastName: workflowClient.lastName || '',
            phone: workflowClient.phone || '',
            nationality: workflowClient.nationality || ''
          },
          createdBy: workflow.createdBy || {
            _id: '',
            firstName: 'Unknown',
            lastName: 'User',
            email: '',
            role: 'attorney'
          },
          currentStep: workflow.currentStep || 1,
          selectedForms: workflow.selectedForms || [],
          questionnaireAssignment: workflow.questionnaireAssignment,
          createdAt: workflow.createdAt || new Date().toISOString(),
          updatedAt: workflow.updatedAt || workflow.createdAt || new Date().toISOString()
        };

        setCaseData(transformedCase);

        // Fetch related tasks
        console.log('📋 Fetching tasks for case:', primaryCaseNumber);
        try {
          const allTasks = await getTasks();
          // Filter tasks related to this case
          const caseTasks = allTasks.filter((task: Task) => {
            const taskCaseId = (task as any).caseId || task.relatedCaseId;
            // Check if task is related to this case by case number or workflow ID
            return taskCaseId === primaryCaseNumber || 
                   taskCaseId === workflow._id ||
                   taskCaseId?.includes(primaryCaseNumber) ||
                   (taskCaseId && Object.values(formCaseIds).some(caseNum => 
                     taskCaseId.includes(String(caseNum))
                   ));
          });
          
          console.log('📋 Found tasks for case:', caseTasks.length);
          setTasks(caseTasks);
        } catch (taskError) {
          console.error('❌ Error fetching tasks:', taskError);
          setTasks([]);
        }

        // Fetch related documents
        console.log('📄 Fetching documents for case:', primaryCaseNumber);
        try {
          const documentsResponse = await getDocuments();
          
          if (documentsResponse.success) {
            const responseData = documentsResponse.data as any;
            const allDocuments = responseData.data?.documents || responseData.documents || [];
            
            // Filter documents related to this case
            const caseDocuments = allDocuments.filter((doc: Document) => {
              return doc.caseNumber === primaryCaseNumber ||
                     doc.caseNumber === workflow._id ||
                     (doc.caseNumber && Object.values(formCaseIds).some(caseNum => 
                       doc.caseNumber?.includes(String(caseNum))
                     )) ||
                     doc.clientId === workflowClient.email ||
                     doc.clientId === workflowClient.id;
            });
            
            console.log('📄 Found documents for case:', caseDocuments.length);
            setDocuments(caseDocuments);
          } else {
            console.warn('⚠️ Documents API returned unsuccessful response');
            setDocuments([]);
          }
        } catch (docError) {
          console.error('❌ Error fetching documents:', docError);
          setDocuments([]);
        }

      } catch (error: any) {
        console.error('❌ Error fetching case data:', error);
        setError(error.response?.data?.message || error.message || 'Failed to load case data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCaseData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading case details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-red-800 mb-2">Error Loading Case</h1>
          <p className="text-red-600">{error}</p>
          <Link to="/cases" className="text-red-700 hover:text-red-900 mt-4 inline-block">
            &larr; Back to Cases
          </Link>
        </div>
      </div>
    );
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
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium capitalize">{caseData.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subcategory</p>
                <p className="font-medium capitalize">{caseData.subcategory || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <p className="font-medium">{caseData.priority}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{caseData.createdBy.firstName} {caseData.createdBy.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Step</p>
                <p className="font-medium">Step {caseData.currentStep}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{caseData.description}</p>
              </div>
              {caseData.assignedForms && caseData.assignedForms.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Assigned Forms</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {caseData.assignedForms.map((form, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {form}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {caseData.formCaseIds && Object.keys(caseData.formCaseIds).length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Form Case IDs</p>
                  <div className="space-y-1 mt-1">
                    {Object.entries(caseData.formCaseIds)
                      .filter(([key, value]) => !key.startsWith('$') && !key.startsWith('_') && typeof value === 'string')
                      .map(([formName, caseId]) => (
                      <div key={formName} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm font-medium">{formName}:</span>
                        <span className="text-sm text-blue-600 font-mono">{String(caseId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <Link to={`/clients/${caseData.client._id}`} className="text-blue-600 hover:text-blue-800">
                  {caseData.client.name}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{caseData.client.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{caseData.client.phone || 'N/A'}</p>
            </div>
            {caseData.client.nationality && (
              <div>
                <p className="text-sm text-gray-500">Nationality</p>
                <p className="font-medium">{caseData.client.nationality}</p>
              </div>
            )}
            {caseData.dueDate && (
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{new Date(caseData.dueDate).toLocaleDateString()}</p>
              </div>
            )}
            {caseData.questionnaireAssignment && (
              <div>
                <p className="text-sm text-gray-500">Questionnaire</p>
                <p className="font-medium text-sm">
                  {caseData.questionnaireAssignment.questionnaire_title}
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    caseData.questionnaireAssignment.is_complete 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {caseData.questionnaireAssignment.is_complete ? 'Completed' : 'Pending'}
                  </span>
                </p>
              </div>
            )}
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
          {tasks.length > 0 ? (
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
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task: Task) => (
                    <tr key={task._id || task.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {typeof task.assignedTo === 'object' && task.assignedTo 
                            ? `${(task.assignedTo as any).firstName || ''} ${(task.assignedTo as any).lastName || ''}`.trim() || 'Unassigned'
                            : task.assignedTo || 'Unassigned'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                          {task.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No tasks are currently associated with this case.
              </p>
            </div>
          )}
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
          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc: Document) => (
                    <tr key={doc._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                              {doc.name}
                            </div>
                            {doc.description && (
                              <div className="text-sm text-gray-500">{doc.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{doc.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{doc.sizeFormatted || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                        </div>
                        {doc.uploadedBy && (
                          <div className="text-xs text-gray-400">by {doc.uploadedBy}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === 'Verified' ? 'bg-green-100 text-green-800' :
                          doc.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                          doc.status === 'Needs Update' ? 'bg-orange-100 text-orange-800' :
                          doc.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No documents are currently associated with this case.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Communication section */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="border-b p-4">
          <h2 className="text-xl font-semibold">Communications & Notes</h2>
        </div>
        <div className="p-4">
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No communications yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Communication logs will appear here as they are added to the case.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsPage;