import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../../utils/api';
import { useAuth } from '../../controllers/AuthControllers';
import { getCasesBasedOnUserType } from '../../controllers/CaseControllers';

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
  const [regularCases, setRegularCases] = useState<any[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Workflow-related state
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [loadingRegularCases, setLoadingRegularCases] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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
    
    
    const loadRegularCases = async () => {
      // For individual users, load their specific cases from the cases API
      if (user?.userType === 'individualUser') {
        try {
          setLoadingRegularCases(true);
          const casesResponse = await getCasesBasedOnUserType(user, { limit: 100 });
          
          if (casesResponse.success && casesResponse.cases) {
            console.log('✅ Loaded', casesResponse.cases.length, 'cases for individual user');
            // Transform regular cases to match the WorkflowCase structure for consistent rendering
            const transformedRegularCases = casesResponse.cases.map((caseItem: any) => ({
              _id: caseItem._id,
              workflowId: caseItem._id, // Use case ID as workflow ID
              caseNumber: caseItem.caseNumber || 'N/A',
              title: caseItem.title || 'Immigration Case',
              description: caseItem.description || '',
              category: caseItem.category || 'immigration',
              subcategory: caseItem.subcategory || '',
              status: caseItem.status || 'Active',
              priority: caseItem.priority || 'Medium',
              dueDate: caseItem.dueDate || '',
              assignedForms: [],
              formCaseIds: {},
              client: {
                _id: user._id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: '',
                nationality: ''
              },
              createdBy: {
                _id: user._id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                role: user.role || 'client'
              },
              currentStep: 1,
              totalSteps: 1,
              progressPercentage: 100,
              isCompleted: caseItem.status === 'Closed',
              selectedForms: [],
              questionnaireAssignment: undefined,
              createdAt: caseItem.createdAt || '',
              updatedAt: caseItem.updatedAt || ''
            }));

            setRegularCases(transformedRegularCases);
          } else {
            setRegularCases([]);
          }
        } catch (error) {
          console.error('Error loading regular cases for individual user:', error);
          setRegularCases([]);
        } finally {
          setLoadingRegularCases(false);
        }
      }
    };
    
    // Load workflows for attorneys and non-individual users
    if (user?.userType !== 'individualUser') {
      loadWorkflows();
    }
    
    // Load regular cases for individual users
    loadRegularCases();
  }, [user]);

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

  // Use regularCases for individual users, workflowCases for others
  const casesToDisplay = user?.userType === 'individualUser' ? regularCases : workflowCases;
  
  const filteredCases = casesToDisplay.filter((workflowCase) => {
    const allCaseNumbers = getAllCaseNumbers(workflowCase);
    
    // Check if search term matches any case numbers
    const caseNumberMatches = allCaseNumbers.some(number => 
      number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Search filter
    const searchMatch = (
      workflowCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseNumberMatches ||
      workflowCase.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowCase.selectedForms.some((form: string) => form.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Category filter
    const categoryMatch = categoryFilter === 'all' || 
      workflowCase.category.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      workflowCase.subcategory.toLowerCase().includes(categoryFilter.toLowerCase());

    // Priority filter
    const priorityMatch = priorityFilter === 'all' || 
      workflowCase.priority?.toLowerCase() === priorityFilter.toLowerCase();

    return searchMatch && categoryMatch && priorityMatch;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cases</h1>
              <p className="text-blue-100 mt-1 text-sm">
                {(loadingWorkflows || loadingRegularCases) 
                  ? "Loading cases..." 
                  : `Manage and track ${casesToDisplay.length} ${casesToDisplay.length === 1 ? 'case' : 'cases'}`}
              </p>
            </div>
            <Link
              to={getNewCaseLink()}
              className="flex items-center gap-2 bg-white text-blue-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-lg text-sm"
            >
              <PlusCircle size={16} />
              <span>New Case</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Search and Filters Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <h2 className="text-base font-semibold text-gray-900">Search & Filters</h2>
          </div>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search cases by title, case number, client name, forms..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-2 text-sm transition-colors ${
                  showFilters || categoryFilter !== 'all' || priorityFilter !== 'all'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} />
                <span>Filters</span>
                {(categoryFilter !== 'all' || priorityFilter !== 'all') && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[categoryFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Options Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Categories</option>
                      <option value="employment-based">Employment-Based</option>
                      <option value="family-based">Family-Based</option>
                      <option value="citizenship">Citizenship</option>
                      <option value="humanitarian">Humanitarian</option>
                      <option value="temporary-visas">Temporary Visas</option>
                      <option value="student-visa">Student Visa</option>
                      <option value="business-visa">Business Visa</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => {
                        setPriorityFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(categoryFilter !== 'all' || priorityFilter !== 'all') && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setCategoryFilter('all');
                        setPriorityFilter('all');
                        setCurrentPage(1);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cases Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-base font-semibold text-gray-900">Your Cases</h2>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Sort by:</span>
                  <button
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => handleSort('caseNumber')}
                  >
                    Case Number
                    <ArrowUpDown size={12} />
                  </button>
                  <span>•</span>
                  <button
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                    <ArrowUpDown size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            {(loadingWorkflows || loadingRegularCases) ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 font-medium">Loading cases...</span>
              </div>
            ) : paginatedCases.length > 0 ? (
              <div className="grid gap-3">
                {paginatedCases.map((workflowCase) => {
                  return (
                    <Link
                      key={workflowCase._id}
                      to={`/cases/${workflowCase._id}`}
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between">
                        {/* Left content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start space-x-3">
                            {/* Case number and status indicator */}
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {workflowCase.caseNumber.split('-')[0] || 'CS'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Main case info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                                    {workflowCase.title}
                                  </h3>
                                  <p className="text-xs font-medium text-blue-600 mb-2">
                                    Case #{workflowCase.caseNumber}
                                  </p>
                                  {workflowCase.description && (
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {workflowCase.description}
                                    </p>
                                  )}
                                  
                                  {/* Client info */}
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                      <span className="text-xs font-medium text-gray-900">
                                        {workflowCase.client.name}
                                      </span>
                                    </div>
                                    {workflowCase.client.email && (
                                      <span className="text-xs text-gray-500">
                                        {workflowCase.client.email}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Tags and metadata */}
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span className="capitalize bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                                      {workflowCase.category}
                                    </span>
                                    {workflowCase.selectedForms.length > 0 && (
                                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                        {workflowCase.selectedForms.length} form{workflowCase.selectedForms.length === 1 ? '' : 's'}
                                      </span>
                                    )}
                                    {workflowCase.dueDate && (
                                      <span className="text-orange-600 text-xs">
                                        Due: {new Date(workflowCase.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                    <span className="text-xs">
                                      Created: {new Date(workflowCase.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Right side - Status and Priority badges */}
                                <div className="flex flex-col items-end space-y-1 ml-3">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      workflowCase.priority === 'High' 
                                        ? 'bg-red-100 text-red-800'
                                        : workflowCase.priority === 'Medium'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {workflowCase.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <PlusCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  {user?.userType === 'individualUser' 
                    ? "You don't have any cases yet. Start your immigration process to create your first case."
                    : "No workflow cases found matching your search criteria."
                  }
                </p>
                <Link
                  to={getNewCaseLink()}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm"
                >
                  <PlusCircle size={16} />
                  Create Your First Case
                </Link>
              </div>
            )}
          </div>
          
          {filteredCases.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCases.length)}</span> of{" "}
                  <span className="font-medium">{filteredCases.length}</span> cases
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-50 bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-50 bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
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

export default CasesPage;