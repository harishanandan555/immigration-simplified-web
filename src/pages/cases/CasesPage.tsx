import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../../utils/api';

type Client = {
  _id: string;
  name: string;
  email: string;
};

type Case = {
  _id: string;
  caseNumber: string;
  type: string;
  status: string;
  clientId: Client | null;
  assignedTo: string | null;
  description: string;
  timeline: Array<{
    action: string;
    user: string;
    notes: string;
    _id: string;
    date: string;
  }>;
  documents: any[];
  tasks: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type SortField = 'caseNumber' | 'description' | 'clientId' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const CasesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Workflow-related state
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  // Function to fetch workflows from API
  const fetchWorkflowsFromAPI = async () => {
    try {
      console.log('🔄 Fetching workflows from API...');
      setLoadingWorkflows(true);
      const token = localStorage.getItem('token');
      
      // Check token availability
      if (!token) {
        console.log('❌ No authentication token available');
        toast('No authentication token - please login first');
        return [];
      }

      console.log('✅ Authentication token found, making API request...');

      // Request ALL workflows from API (not just in-progress)
      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100 // Get more workflows
        }
      });
      
      console.log('📥 Response from workflows API:', response.data);
      
      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        setAvailableWorkflows(workflows);
        console.log(`✅ Successfully loaded ${workflows.length} workflows from API`);
        
        // Log some workflow details for debugging
        if (workflows.length > 0) {
          console.log('📋 Sample workflow data:', {
            sampleWorkflow: workflows[0],
            formCaseIds: workflows[0].formCaseIds,
            caseInfo: workflows[0].case,
            clientInfo: workflows[0].client
          });
        }
        
        return workflows;
      } else {
        console.log('⚠️ No workflow data available in API response');
        return [];
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching workflows from API:', error);
      
      // If 404, the endpoint might not be available
      if (error.response?.status === 404) {
        console.log('🔍 Server workflows endpoint not found');
        toast('Server workflows endpoint not available');
      } else if (error.response?.status === 401) {
        console.log('🔐 Authentication failed');
        toast('Authentication failed - please login again');
      } else {
        console.log('💥 Other API error:', error.response?.status || 'Unknown');
        toast.error('Failed to load workflows from server');
      }
      
      return [];
    } finally {
      setLoadingWorkflows(false);
      console.log('🏁 Finished workflow API request');
    }
  };

  useEffect(() => {
    const loadWorkflows = async () => {
      const workflows = await fetchWorkflowsFromAPI();
      
      // Extract cases from workflows instead of calling separate cases API
      if (workflows && workflows.length > 0) {
        console.log('🔄 Extracting cases from workflows...');
        
        const extractedCases: Case[] = workflows.map((workflow: any) => {
          const workflowCase = workflow.case || {};
          const workflowClient = workflow.client || {};
          
          // Create a case object from workflow data
          const extractedCase: Case = {
            _id: workflowCase.id || workflowCase._id || workflow._id,
            caseNumber: workflowCase.caseNumber || 
                       (workflow.formCaseIds && Object.values(workflow.formCaseIds)[0]) || 
                       `WF-${workflow._id?.slice(-8)}`,
            type: workflowCase.category || workflowCase.subcategory || 'Immigration',
            status: workflowCase.status || workflow.status || 'In Progress',
            clientId: workflowClient ? {
              _id: workflowClient.id || workflowClient._id || workflow._id,
              name: workflowClient.name || 
                    `${workflowClient.firstName || ''} ${workflowClient.lastName || ''}`.trim() || 
                    'Unknown Client',
              email: workflowClient.email || 'No email'
            } : null,
            assignedTo: workflow.createdBy?.firstName ? 
                       `${workflow.createdBy.firstName} ${workflow.createdBy.lastName}` : 
                       null,
            description: workflowCase.title || workflowCase.description || 'Workflow Case',
            timeline: [],
            documents: [],
            tasks: [],
            createdAt: workflow.createdAt || new Date().toISOString(),
            updatedAt: workflow.updatedAt || workflow.createdAt || new Date().toISOString(),
            __v: 0
          };
          
          return extractedCase;
        }).filter((case_: any) => case_.clientId); // Only include cases with valid client data
        
        console.log(`✅ Extracted ${extractedCases.length} cases from workflows`);
        console.log('📋 Sample extracted case:', extractedCases[0]);
        
        setCases(extractedCases);
      } else {
        console.log('⚠️ No workflows available to extract cases from');
        setCases([]);
      }
    };
    
    // Load workflows and extract cases
    loadWorkflows();
  }, []);

  // Function to get workflow case number for a case
  const getWorkflowCaseNumber = (caseItem: Case) => {
    if (!availableWorkflows.length) {
      console.log("❌ No workflows available for matching");
      return null;
    }

    console.log("🔍 Searching for workflow match:");
    console.log("📋 Available workflows count:", availableWorkflows.length);
    console.log("📄 Case item to match:", {
      id: caseItem._id,
      caseNumber: caseItem.caseNumber,
      description: caseItem.description,
      clientId: caseItem.clientId?._id,
      clientName: caseItem.clientId?.name,
      clientEmail: caseItem.clientId?.email,
      type: caseItem.type,
      status: caseItem.status
    });

    // Log first few workflow structures for debugging
    if (availableWorkflows.length > 0) {
      console.log("📝 Sample workflow structures:");
      availableWorkflows.slice(0, 2).forEach((workflow, idx) => {
        console.log(`Workflow ${idx + 1}:`, {
          workflowId: workflow._id,
          hasCase: !!workflow.case,
          caseId: workflow.case?.id || workflow.case?._id,
          caseTitle: workflow.case?.title,
          caseCategory: workflow.case?.category,
          caseStatus: workflow.case?.status,
          hasClient: !!workflow.client,
          clientId: workflow.client?.id || workflow.client?._id,
          clientEmail: workflow.client?.email,
          clientName: workflow.client?.name || `${workflow.client?.firstName || ''} ${workflow.client?.lastName || ''}`.trim(),
          formCaseIds: workflow.formCaseIds,
          selectedForms: workflow.selectedForms
        });
      });
    }

    // Try to find a matching workflow by various criteria
    const matchingWorkflow = availableWorkflows.find((workflow: any, index: number) => {
      console.log(`🔎 Checking workflow ${index + 1}/${availableWorkflows.length}:`, {
        workflowId: workflow._id || workflow.id,
        caseId: workflow.case?.id || workflow.case?._id,
        caseTitle: workflow.case?.title,
        clientEmail: workflow.client?.email,
        clientName: workflow.client?.name || `${workflow.client?.firstName || ''} ${workflow.client?.lastName || ''}`.trim(),
        formCaseIds: workflow.formCaseIds
      });

      // Match by case ID first (most reliable)
      if (workflow.case?.id && caseItem._id) {
        const idMatch = workflow.case.id === caseItem._id || workflow.case._id === caseItem._id;
        if (idMatch) {
          console.log("✅ Found match by case ID");
          return true;
        }
      }

      // Match by case number if available
      if (workflow.case?.caseNumber && caseItem.caseNumber) {
        const caseNumberMatch = workflow.case.caseNumber === caseItem.caseNumber;
        if (caseNumberMatch) {
          console.log("✅ Found match by case number");
          return true;
        }
      }

      // Match by form case IDs (check if case number matches any form case ID)
      if (workflow.formCaseIds && Object.keys(workflow.formCaseIds).length > 0) {
        const formCaseIdMatch = Object.values(workflow.formCaseIds).some(formCaseId => 
          formCaseId === caseItem.caseNumber
        );
        if (formCaseIdMatch) {
          console.log("✅ Found match by form case ID matching case number:", {
            caseNumber: caseItem.caseNumber,
            matchingFormCaseId: Object.entries(workflow.formCaseIds).find(([, id]) => id === caseItem.caseNumber)
          });
          return true;
        }
      }

      // Match by case title/description
      if (workflow.case?.title && caseItem.description) {
        const titleMatch = workflow.case.title.toLowerCase().includes(caseItem.description.toLowerCase()) ||
            caseItem.description.toLowerCase().includes(workflow.case.title.toLowerCase());
        if (titleMatch) {
          console.log("✅ Found match by case title/description");
          return true;
        }
      }

      // Match by client email if available
      if (workflow.client?.email && caseItem.clientId?.email) {
        const emailMatch = workflow.client.email.toLowerCase() === caseItem.clientId.email.toLowerCase();
        if (emailMatch) {
          console.log("✅ Found match by client email");
          return true;
        }
      }

      // Match by client name if available
      if (workflow.client && caseItem.clientId?.name) {
        const workflowClientName = workflow.client.name || 
          `${workflow.client.firstName || ''} ${workflow.client.lastName || ''}`.trim();
        const nameMatch = workflowClientName.toLowerCase() === caseItem.clientId.name.toLowerCase();
        if (nameMatch) {
          console.log("✅ Found match by client name");
          return true;
        }
      }

      // Match by client ID if available
      if (workflow.client?.id && caseItem.clientId?._id) {
        const clientIdMatch = workflow.client.id === caseItem.clientId._id || workflow.client._id === caseItem.clientId._id;
        if (clientIdMatch) {
          console.log("✅ Found match by client ID");
          return true;
        }
      }

      // Fuzzy match by case type/category
      if (workflow.case?.category && caseItem.type) {
        const categoryMatch = workflow.case.category.toLowerCase().includes(caseItem.type.toLowerCase()) ||
            caseItem.type.toLowerCase().includes(workflow.case.category.toLowerCase());
        if (categoryMatch) {
          console.log("✅ Found match by case type/category");
          return true;
        }
      }

      return false;
    });

    if (matchingWorkflow) {
      console.log("🎯 Found matching workflow:", {
        workflowId: matchingWorkflow._id,
        caseTitle: matchingWorkflow.case?.title,
        formCaseIds: matchingWorkflow.formCaseIds,
        assignedForms: matchingWorkflow.selectedForms
      });
    } else {
      console.log("❌ No matching workflow found for case:", caseItem._id);
      console.log("💡 Consider creating a workflow for this case or check if the case data matches any workflow criteria");
    }

    return matchingWorkflow;
  };

  // Function to get workflow case numbers for display
  const getWorkflowCaseNumbers = (workflow: any) => {
    const caseNumbers = [];
    
    // Get case number from case object
    if (workflow.case?.caseNumber) {
      caseNumbers.push({
        type: 'Case',
        number: workflow.case.caseNumber,
        source: 'case'
      });
    }
    
    // Get form case IDs
    if (workflow.formCaseIds && Object.keys(workflow.formCaseIds).length > 0) {
      Object.entries(workflow.formCaseIds).forEach(([formName, caseId]) => {
        caseNumbers.push({
          type: formName,
          number: caseId,
          source: 'form'
        });
      });
    }
    
    return caseNumbers;
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredCases = cases.filter((caseItem) => {
    const matchingWorkflow = getWorkflowCaseNumber(caseItem);
    const workflowCaseNumbers = matchingWorkflow ? getWorkflowCaseNumbers(matchingWorkflow) : [];
    
    // Check if search term matches any workflow case numbers
    const workflowMatches = workflowCaseNumbers.some(({ number }) => 
      number && number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
      caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflowMatches ||
      (caseItem.clientId && (
        caseItem.clientId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.clientId.email.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    const aValue = a[sortField] ?? '';
    const bValue = b[sortField] ?? '';
    
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
          {availableWorkflows.length > 0 && !loadingWorkflows && (
            <p className="text-sm text-green-600 mt-1">
              ✅ {availableWorkflows.length} workflows loaded
            </p>
          )}
        </div>
        <Link
          to="/cases/new"
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
              placeholder="Search cases, workflow numbers, clients..."
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('caseNumber')}
                  >
                    <span>Case Number</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('description')}
                  >
                    <span>Description</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('clientId')}
                  >
                    <span>Client ID</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span>Date Created</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingWorkflows ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading cases from workflows...
                  </td>
                </tr>
              ) : paginatedCases.length > 0 ? (
                paginatedCases.map((caseItem) => {
                  const matchingWorkflow = getWorkflowCaseNumber(caseItem);
                  const workflowCaseNumbers = matchingWorkflow ? getWorkflowCaseNumbers(matchingWorkflow) : [];
                  
                  return (
                    <tr key={caseItem._id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        <Link to={`/cases/${caseItem._id}`} className="block">
                          <div>{caseItem.caseNumber}</div>
                          {workflowCaseNumbers.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {workflowCaseNumbers.map((caseNum, index) => (
                                <div 
                                  key={index}
                                  className={`text-xs font-mono px-2 py-1 rounded inline-block mr-1 ${
                                    caseNum.source === 'case' 
                                      ? 'text-blue-600 bg-blue-50' 
                                      : 'text-green-600 bg-green-50'
                                  }`}
                                >
                                  {caseNum.type}: {caseNum.number}
                                </div>
                              ))}
                            </div>
                          )}
                          {matchingWorkflow && (
                            <div className="text-xs text-purple-600 mt-1">
                              📋 Workflow Status: {matchingWorkflow.status || 'in-progress'}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Link to={`/cases/${caseItem._id}`}>
                          <div>{caseItem.description}</div>
                          {matchingWorkflow?.case?.title && matchingWorkflow.case.title !== caseItem.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              Workflow: {matchingWorkflow.case.title}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {caseItem.clientId ? (
                          <div>
                            <div className="font-medium">{caseItem.clientId.name}</div>
                            <div className="text-xs text-gray-400">{caseItem.clientId.email}</div>
                            {matchingWorkflow?.client && (
                              <div className="text-xs text-blue-600 mt-1">
                                🔗 Linked to workflow
                              </div>
                            )}
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          caseItem.status === 'New' 
                            ? 'bg-blue-100 text-blue-800'
                            : caseItem.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {caseItem.status}
                        </span>
                        {matchingWorkflow && (
                          <div className="mt-1">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Step {matchingWorkflow.currentStep || 1}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{caseItem.type}</div>
                        {matchingWorkflow?.selectedForms && matchingWorkflow.selectedForms.length > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            Forms: {matchingWorkflow.selectedForms.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{new Date(caseItem.createdAt).toLocaleDateString()}</div>
                        {matchingWorkflow?.createdAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            Workflow: {new Date(matchingWorkflow.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No cases found matching your search criteria.
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