import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../../utils/api';
import { useAuth } from '../../controllers/AuthControllers';

type Client = {
  _id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  nationality?: string;
};

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
  client: Client;
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

type SortField = 'caseNumber' | 'title' | 'clientName' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

const CasesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [workflowCases, setWorkflowCases] = useState<WorkflowCase[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Workflow-related state
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  // Determine the correct "New Case" link based on user type
  const getNewCaseLink = () => {
    // For individual users, use the individual immigration process
    if (user?.userType === 'individualUser') {
      return '/immigration-process/individual';
    }
    // For attorneys and other legal professionals, use the legal firm workflow
    return '/legal-firm-workflow';
  };

  // Function to fetch workflows from API
  const fetchWorkflowsFromAPI = async () => {
    try {
      setLoadingWorkflows(true);
      const token = localStorage.getItem('token');
      
      // Check token availability
      if (!token) {
        toast('No authentication token - please login first');
        return [];
      }

      // Request ALL workflows from API
      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100 // Get more workflows
        }
      });
      
      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        return workflows;
      } else {
        setWorkflowCases([]);
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching workflows from API:', error);
      
      // If 404, the endpoint might not be available
      if (error.response?.status === 404) {
        toast('Server workflows endpoint not available');
      } else if (error.response?.status === 401) {
        toast('Authentication failed - please login again');
      } else {
        toast.error('Failed to load workflows from server');
      }
      
      return [];
    } finally {
      setLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    const loadWorkflows = async () => {
      const workflows = await fetchWorkflowsFromAPI();
      
      // Transform workflows into WorkflowCase objects
      if (workflows && workflows.length > 0) {
        const transformedCases: WorkflowCase[] = workflows.map((workflow: any) => {
          const workflowCase = workflow.case || {};
          const workflowClient = workflow.client || {};
          
          // Get primary case number from formCaseIds or generate one
          const formCaseIds = workflow.formCaseIds || {};
          const primaryCaseNumber = Object.values(formCaseIds)[0] as string || 
                                  workflowCase.caseNumber || 
                                  `WF-${workflow._id?.slice(-8)}`;
          
          return {
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
            questionnaireAssignment: workflow.questionnaireAssignment ? {
              questionnaire_id: workflow.questionnaireAssignment.questionnaire_id,
              questionnaire_title: workflow.questionnaireAssignment.questionnaire_title,
              response_id: workflow.questionnaireAssignment.response_id,
              is_complete: workflow.questionnaireAssignment.is_complete || false,
              submitted_at: workflow.questionnaireAssignment.submitted_at,
              responses: workflow.questionnaireAssignment.responses
            } : undefined,
            createdAt: workflow.createdAt || new Date().toISOString(),
            updatedAt: workflow.updatedAt || workflow.createdAt || new Date().toISOString()
          };
        }).filter((workflowCase: WorkflowCase) => workflowCase.client.name); // Only include cases with valid client data
        
        setWorkflowCases(transformedCases);
      } else {
        setWorkflowCases([]);
      }
    };
    
    // Load workflows and transform to cases
    loadWorkflows();
  }, []);

  // Helper function to get all case numbers for a workflow
  const getAllCaseNumbers = (workflowCase: WorkflowCase): string[] => {
    const numbers: string[] = [];
    
    // Add primary case number if it exists and is a string
    if (workflowCase.caseNumber && typeof workflowCase.caseNumber === 'string') {
      numbers.push(workflowCase.caseNumber);
    }
    
    // Add form case IDs, filtering out Mongoose metadata
    if (workflowCase.formCaseIds && typeof workflowCase.formCaseIds === 'object') {
      Object.entries(workflowCase.formCaseIds).forEach(([key, value]) => {
        // Skip Mongoose metadata properties
        if (!key.startsWith('$') && !key.startsWith('_') && typeof value === 'string' && value.trim() !== '') {
          numbers.push(value);
        }
      });
    }
    
    return numbers.filter(num => num && typeof num === 'string' && num.trim() !== '');
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredCases = workflowCases.filter((workflowCase) => {
    const allCaseNumbers = getAllCaseNumbers(workflowCase);
    
    // Check if search term matches any case numbers
    const caseNumberMatches = allCaseNumbers.some(number => 
      number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
      workflowCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseNumberMatches ||
      workflowCase.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.selectedForms.some(form => form.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'caseNumber':
        aValue = a.caseNumber;
        bValue = b.caseNumber;
        break;
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'clientName':
        aValue = a.client.name;
        bValue = b.client.name;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedCases.length / itemsPerPage);
  const paginatedCases = sortedCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cases</h1>
          {loadingWorkflows && (
            <p className="text-sm text-blue-600 mt-1">Loading workflow data...</p>
          )}
          
        </div>
        <Link
          to={getNewCaseLink()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <PlusCircle size={18} />
          <span>New Case</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search cases by title, case number, client name, forms..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        <div className="w-full">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/7 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('caseNumber')}
                  >
                    <span>Case Number</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="w-1/4 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('clientName')}
                  >
                    <span>Client</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="w-1/7 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <span>Status</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="w-1/7 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="w-1/7 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span>Due Date</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingWorkflows ? (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-gray-500">
                    Loading workflow cases...
                  </td>
                </tr>
              ) : paginatedCases.length > 0 ? (
                paginatedCases.map((workflowCase) => {
                  return (
                    <tr key={workflowCase._id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-3 py-3 text-sm font-medium text-indigo-600">
                        <Link to={`/cases/${workflowCase._id}`} className="block">
                          <div className="font-bold truncate">{workflowCase.caseNumber}</div>
                          {workflowCase.formCaseIds && Object.keys(workflowCase.formCaseIds).length > 0 && (
                            <div className="mt-1 space-y-1">
                              {/* {Object.entries(workflowCase.formCaseIds)
                                .filter(([key, value]) => !key.startsWith('$') && !key.startsWith('_') && typeof value === 'string')
                                .slice(0, 2) // Limit to first 2 form case IDs to save space
                                .map(([formName]) => (
                                <div 
                                  key={formName}
                                  className="text-xs font-mono px-1 py-0.5 rounded bg-green-50 text-green-600 truncate"
                                  title={`${formName}`}
                                >
                                  {formName}
                                </div>
                              ))} */}
                              {/* {Object.keys(workflowCase.formCaseIds).length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{Object.keys(workflowCase.formCaseIds).length - 2} more
                                </div>
                              )} */}
                            </div>
                          )}
                      
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        <div className="truncate" title={workflowCase.description}>
                          {workflowCase.description || 'No description provided'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        <div>
                          <div className="font-medium truncate" title={workflowCase.client.name}>{workflowCase.client.name}</div>
                          {/* <div className="text-xs text-gray-400 truncate" title={workflowCase.client.email}>{workflowCase.client.email}</div>
                          {workflowCase.client.phone && (
                            <div className="text-xs text-gray-400 truncate">{workflowCase.client.phone}</div>
                          )}
                          {workflowCase.client.nationality && (
                            <div className="text-xs text-blue-600 mt-1 truncate">
                              🌍 {workflowCase.client.nationality}
                            </div>
                          )} */}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          workflowCase.status === 'active' || workflowCase.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : workflowCase.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : workflowCase.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workflowCase.status}
                        </span>
                        {workflowCase.priority && (
                          <div className="mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              workflowCase.priority === 'High' 
                                ? 'bg-red-100 text-red-800'
                                : workflowCase.priority === 'Medium'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {workflowCase.priority}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        <div className="capitalize truncate">{workflowCase.category}</div>
                        {workflowCase.selectedForms.length > 0 && (
                          <div className="text-xs text-green-600 mt-1 truncate" title={workflowCase.selectedForms.join(', ')}>
                            Forms: {workflowCase.selectedForms.slice(0, 2).join(', ')}
                            {workflowCase.selectedForms.length > 2 && ` +${workflowCase.selectedForms.length - 2}`}
                          </div>
                        )}
                      
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                         {workflowCase.dueDate && (
                          <div className="text-xs text-orange-600 mt-1">
                         {new Date(workflowCase.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-gray-500">
                    No workflow cases found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredCases.length > 0 && (
          <div className="flex justify-between items-center mt-4 py-3">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCases.length)}</span> of{" "}
              <span className="font-medium">{filteredCases.length}</span> cases
            </div>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50">
                {currentPage}
              </button>
              <button 
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasesPage;