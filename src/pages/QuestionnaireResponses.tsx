import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  Eye,
  Loader2,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  User
} from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import { useQuestionnaireAssignments } from '../hooks/useQuestionnaireAssignments';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface QuestionnaireAssignment {
  _id: string;
  questionnaireId: {
    _id: string;
    title: string;
    category: string;
    description: string;
    fields?: any[]; // Add this line to include the fields property
  };
  clientId: string; // This is just a string ID, not an object
  clientUserId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  actualClient?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    client_id: string;
  };
  submittedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attorneyInfo?: {
    _id: string;
    attorney_id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  caseId?: {
    _id: string;
    title: string;
    category: string;
    status: string;
  };
  responseId?: {
    _id: string;
    responses: Record<string, any>;
    submittedAt: string;
    notes?: string;
  };
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  isOverdue?: boolean;
}

const QuestionnaireResponses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getClientResponses } = useQuestionnaireAssignments('attorney', localStorage.getItem('token') || undefined);
  const [assignments, setAssignments] = useState<QuestionnaireAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<QuestionnaireAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadingWorkflows, setLoadingWorkflows] = useState<boolean>(false);
  
  // Function to fetch workflows from API for auto-fill
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

      // Request workflows from API
      const response = await api.get('/api/v1/workflows', {
        params: {
          status: 'in-progress',
          page: 1,
          limit: 50
        }
      });
      
      console.log('📥 Response from workflows API:', response.data);
      
      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        console.log(`✅ Successfully loaded ${workflows.length} workflows from API`);
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
    // Only attorneys, paralegals, and superadmins can access this page
    if (user && !['attorney', 'paralegal', 'superadmin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }

    loadAssignments();
  }, [user, navigate]);

  useEffect(() => {
    // Apply filters
    let filtered = [...assignments];
    
    console.log('Applying filters - initial assignments:', assignments.length);
    console.log('Search term:', searchTerm);
    console.log('Status filter:', statusFilter);
    
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => {
        // Safely get questionnaire title
        const questionnaireTitle = assignment.questionnaireId?.title?.toLowerCase() || '';
        
        // Safely get client name
        let clientName = '';
        if (assignment.actualClient?.firstName && assignment.actualClient?.lastName) {
          clientName = `${assignment.actualClient.firstName} ${assignment.actualClient.lastName}`.toLowerCase();
        } else if (assignment.clientUserId?.firstName && assignment.clientUserId?.lastName) {
          clientName = `${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}`.toLowerCase();
        }
        
        // Safely get case title
        const caseTitle = assignment.caseId?.title?.toLowerCase() || '';
        
        const matches = questionnaireTitle.includes(term) || 
               clientName.includes(term) || 
               caseTitle.includes(term);
        
        console.log('Search filter check:', {
          term,
          questionnaireTitle,
          clientName,
          caseTitle,
          matches
        });
        
        return matches;
      });
      console.log('After search filter:', filtered.length);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const beforeStatusFilter = filtered.length;
      filtered = filtered.filter(assignment => {
        const matches = assignment.status === statusFilter;
        console.log('Status filter check:', {
          assignmentStatus: assignment.status,
          filterStatus: statusFilter,
          matches
        });
        return matches;
      });
      console.log(`After status filter (${statusFilter}):`, filtered.length, 'from', beforeStatusFilter);
    }
    
    console.log('Final filtered assignments:', filtered.length);
    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, statusFilter]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // Get all questionnaire assignments, not just completed ones
      // This will help us see assignments that are marked as completed but have missing response data
      const responseData = await getClientResponses({
        // Remove status filter to get all assignments
        page: 1,
        limit: 50 // Get more results for better demo
      });
      
      console.log('Raw API Response:', responseData);
      
      const assignmentsData = responseData.data.assignments || [];
      
      // Filter to only show completed assignments in the UI
      // This way we can see completed assignments even if they have missing response data
      const completedAssignments = assignmentsData.filter((assignment: any) => 
        assignment.status === 'completed'
      );
      
      // Debug the data structure and response data
      console.log('All assignments data:', assignmentsData);
      console.log('Completed assignments:', completedAssignments.length);
      console.log('Assignments with missing response data:', 
        completedAssignments.filter((a: any) => !a.responseId).length
      );
      
      if (completedAssignments.length > 0) {
        console.log('First assignment structure:', JSON.stringify(completedAssignments[0], null, 2));
        // Check if we have response data
        const first = completedAssignments[0];
        console.log('clientId type:', typeof first.clientId, 'value:', first.clientId);
        console.log('actualClient type:', typeof first.actualClient, 'value:', first.actualClient);
        console.log('responseId data:', first.responseId);
        console.log('response data available:', !!first.responseId?.responses);
        if (first.responseId?.responses) {
          console.log('Sample response fields:', Object.keys(first.responseId.responses).slice(0, 3));
        }
      }
      
      setAssignments(completedAssignments);
      setError(null);
      
      console.log('State set - assignments:', completedAssignments.length, 'filtered will be set by useEffect');
      
      if (completedAssignments.length > 0) {
        const assignmentsWithResponses = completedAssignments.filter((a: any) => a.responseId?.responses);
        const assignmentsWithoutResponses = completedAssignments.length - assignmentsWithResponses.length;
        
        toast.success(`Loaded ${completedAssignments.length} completed questionnaires` + 
          (assignmentsWithoutResponses > 0 ? ` (${assignmentsWithoutResponses} missing response data)` : ''));
      }
    } catch (err) {
      console.error('Error loading responses:', err);
      setError('Failed to load questionnaire responses. Please try again.');
      toast.error('Error loading questionnaire responses');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, isOverdue?: boolean): string => {
    if (isOverdue) return 'text-red-600 bg-red-50 border-red-200';
    
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pending':
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return <AlertTriangle className="w-4 h-4" />;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'pending':
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClientClick = async (assignment: QuestionnaireAssignment) => {
    // Prepare the data to pass to the Legal Firm Workflow
    const clientInfo = assignment.actualClient || assignment.clientUserId;
    const questionnaireInfo = assignment.questionnaireId;
    const responseInfo = assignment.responseId;
    
    if (!clientInfo || !questionnaireInfo) {
      toast.error('Cannot navigate - missing client or questionnaire data');
      return;
    }

    console.log('🔄 Starting enhanced workflow navigation...');
    setLoadingWorkflows(true);

    try {
      // Fetch workflows from API to get complete workflow data
      const apiWorkflows = await fetchWorkflowsFromAPI();
      let matchingWorkflow = null;

      if (apiWorkflows && apiWorkflows.length > 0) {
        // Try to find a matching workflow by client email
        matchingWorkflow = apiWorkflows.find((workflow: any) => {
          const workflowEmail = workflow.client?.email?.toLowerCase();
          const clientEmail = clientInfo.email?.toLowerCase();
          return workflowEmail === clientEmail;
        });

        if (!matchingWorkflow) {
          // If no exact match, try to find by client name
          matchingWorkflow = apiWorkflows.find((workflow: any) => {
            const workflowClientName = `${workflow.client?.firstName || ''} ${workflow.client?.lastName || ''}`.toLowerCase();
            const clientName = `${clientInfo.firstName} ${clientInfo.lastName}`.toLowerCase();
            return workflowClientName === clientName;
          });
        }

        if (!matchingWorkflow) {
          // If still no match, get the most recent workflow
          matchingWorkflow = apiWorkflows
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
          console.log('⚠️ No exact match found, using most recent workflow');
        } else {
          console.log('✅ Found matching workflow for client');
        }
      }

      // Prepare comprehensive workflow data
      const workflowData = {
        clientId: clientInfo._id,
        clientEmail: clientInfo.email,
        clientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
        questionnaireId: questionnaireInfo._id,
        questionnaireTitle: questionnaireInfo.title,
        existingResponses: responseInfo?.responses || {},
        fields: questionnaireInfo.fields || [],
        mode: responseInfo?.responses ? 'edit' : 'new',
        originalAssignmentId: assignment._id,
        
        // Enhanced workflow data from API
        ...(matchingWorkflow && {
          // Client data from workflow
          workflowClient: {
            name: matchingWorkflow.client?.name || `${clientInfo.firstName} ${clientInfo.lastName}`,
            firstName: matchingWorkflow.client?.firstName || clientInfo.firstName,
            lastName: matchingWorkflow.client?.lastName || clientInfo.lastName,
            email: matchingWorkflow.client?.email || clientInfo.email,
            phone: matchingWorkflow.client?.phone || '',
            dateOfBirth: matchingWorkflow.client?.dateOfBirth || '',
            nationality: matchingWorkflow.client?.nationality || '',
            address: matchingWorkflow.client?.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'United States'
            }
          },
          
          // Case data from workflow
          workflowCase: {
            id: matchingWorkflow.case?.id || matchingWorkflow.case?._id,
            _id: matchingWorkflow.case?._id || matchingWorkflow.case?.id,
            title: matchingWorkflow.case?.title || 'Case',
            caseNumber: matchingWorkflow.case?.caseNumber || '',
            category: matchingWorkflow.case?.category || 'family-based',
            subcategory: matchingWorkflow.case?.subcategory || '',
            status: matchingWorkflow.case?.status || 'draft',
            priority: matchingWorkflow.case?.priority || 'medium',
            visaType: matchingWorkflow.case?.visaType || '',
            description: matchingWorkflow.case?.description || '',
            openDate: matchingWorkflow.case?.openDate || '',
            priorityDate: matchingWorkflow.case?.priorityDate || '',
            dueDate: matchingWorkflow.case?.dueDate || ''
          },
          
          // Form data from workflow
          selectedForms: matchingWorkflow.selectedForms || [],
          formCaseIds: matchingWorkflow.formCaseIds || {},
          selectedQuestionnaire: matchingWorkflow.selectedQuestionnaire || questionnaireInfo._id,
          
          // Client credentials from workflow
          clientCredentials: {
            email: matchingWorkflow.clientCredentials?.email || clientInfo.email,
            createAccount: matchingWorkflow.clientCredentials?.createAccount || true
          },
          
          // Set target step to Client Information (step 2) since we want to start from there
          targetStep: 2,
          autoFillMode: true, // Flag to indicate this is auto-fill mode (no saving)
          currentStep: matchingWorkflow.currentStep || 1
        })
      };
      
      console.log('📦 Enhanced workflow data prepared:', workflowData);
      
      // Store the workflow data in sessionStorage for the Legal Firm Workflow to pick up
      sessionStorage.setItem('legalFirmWorkflowData', JSON.stringify(workflowData));
      
      toast.success(`🚀 Loading complete workflow data for ${clientInfo.firstName}`);
      
    } catch (error) {
      console.error('❌ Error fetching workflow data:', error);
      
      // Fallback to basic data if API fails
      const basicWorkflowData = {
        clientId: clientInfo._id,
        clientEmail: clientInfo.email,
        clientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
        questionnaireId: questionnaireInfo._id,
        questionnaireTitle: questionnaireInfo.title,
        existingResponses: responseInfo?.responses || {},
        fields: questionnaireInfo.fields || [],
        mode: responseInfo?.responses ? 'edit' : 'new',
        originalAssignmentId: assignment._id,
        autoFillMode: true
      };
      
      sessionStorage.setItem('legalFirmWorkflowData', JSON.stringify(basicWorkflowData));
      toast('⚠️ Using basic client data (workflow API unavailable)');
      
    } finally {
      setLoadingWorkflows(false);
      
      // Navigate to the Legal Firm Workflow page with existing response parameter
      navigate('/legal-firm-workflow?fromQuestionnaireResponses=true');
      
      console.log('🎯 Navigated to Legal Firm Workflow with existing response data');
    }
  };

  const handleViewResponse = (assignmentId: string) => {
    // Validate assignmentId is a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(assignmentId)) {
      toast.error('Invalid assignment ID format');
      return;
    }
    
    // Find the assignment to check if response data exists
    const assignment = filteredAssignments.find(a => a._id === assignmentId);
    if (!assignment) {
      toast.error('Assignment not found');
      return;
    }
    
    // Check if responseId exists and has response data
    if (!assignment.responseId) {
      toast.error('No response data available for this assignment');
      console.warn('Assignment has no responseId:', assignmentId);
      return;
    }
    
    if (!assignment.responseId.responses) {
      toast.error('Response data is empty or corrupted');
      console.warn('Assignment responseId exists but no response data:', assignmentId);
      return;
    }
    
    // Log response data for debugging
    console.log('📋 Viewing response for assignment:', assignmentId);
    console.log('📝 Response data:', assignment.responseId.responses);
    console.log('📊 Number of fields completed:', Object.keys(assignment.responseId.responses).length);
    console.log('🗓️ Submitted at:', assignment.responseId.submittedAt);
    if (assignment.responseId.notes) {
      console.log('📝 Notes:', assignment.responseId.notes);
    }
    
    navigate(`/questionnaires/response/${assignmentId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Questionnaire Responses</h1>
      </div>
      
      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search questionnaires, clients or cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-3 text-gray-600">Loading questionnaire responses...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Completed Questionnaire Responses</h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' ? 
              'No completed responses match your search criteria.' : 
              'There are no completed questionnaire responses available yet.'}
          </p>
          <p className="text-sm text-gray-500">
            Responses will appear here once clients complete their assigned questionnaires.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questionnaire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map(assignment => (
                <tr key={assignment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                      onClick={() => handleClientClick(assignment)}
                      title="Click to edit client responses in Legal Firm Workflow"
                    >
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {assignment.actualClient?.firstName && assignment.actualClient?.lastName ? 
                            `${assignment.actualClient.firstName} ${assignment.actualClient.lastName}` :
                            assignment.clientUserId?.firstName && assignment.clientUserId?.lastName ? 
                            `${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}` : 
                            'Client Name Not Available'
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.actualClient?.email || assignment.clientUserId?.email || 'No email available'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Client ID: {String(assignment.actualClient?.client_id || assignment.clientId || assignment.clientUserId?._id || 'N/A')}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Click to {assignment.responseId?.responses ? 'edit' : 'create'} responses →
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{assignment.questionnaireId?.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{assignment.questionnaireId?.category || 'No category'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {assignment.caseId ? (
                      <div>
                        <div className="text-sm text-gray-900">{assignment.caseId.title}</div>
                        <div className="text-xs text-gray-500">{assignment.caseId.category}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No case linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.attorneyInfo?.firstName && assignment.attorneyInfo?.lastName ? 
                            `${assignment.attorneyInfo.firstName} ${assignment.attorneyInfo.lastName}` :
                            assignment.assignedBy?.firstName && assignment.assignedBy?.lastName ? 
                            `${assignment.assignedBy.firstName} ${assignment.assignedBy.lastName}` : 
                            'Attorney Not Available'
                          }
                        </div>
                        <div className="text-xs text-gray-400">
                          Attorney ID: {String(assignment.attorneyInfo?.attorney_id || assignment.assignedBy?._id || 'N/A')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${getStatusColor(assignment.status, assignment.isOverdue)}`}
                    >
                      {getStatusIcon(assignment.status, assignment.isOverdue)}
                      <span className="ml-1">
                        {assignment.isOverdue ? 'Overdue' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </span>
                    {assignment.status === 'completed' && !assignment.responseId && (
                      <div className="mt-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Missing Response Data
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Assigned: {formatDate(assignment.assignedAt)}</span>
                      </div>
                      {assignment.completedAt && (
                        <div className="flex items-center mb-1 text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>Completed: {formatDate(assignment.completedAt)}</span>
                        </div>
                      )}
                      {assignment.dueDate && !assignment.completedAt && (
                        <div className={`flex items-center ${assignment.isOverdue ? 'text-red-600' : ''}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleViewResponse(assignment._id)}
                        disabled={assignment.status !== 'completed' || !assignment.responseId || !assignment.responseId.responses}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 ${
                          assignment.status === 'completed' && assignment.responseId?.responses
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          assignment.status !== 'completed' 
                            ? 'Assignment not completed'
                            : !assignment.responseId 
                            ? 'No response data available'
                            : !assignment.responseId.responses
                            ? 'Response data is empty'
                            : 'View the completed response'
                        }
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Response
                      </button>
                      {assignment.responseId?.responses ? (
                        <div className="text-xs text-green-600">
                          {Object.keys(assignment.responseId.responses).length} fields completed
                        </div>
                      ) : assignment.status === 'completed' ? (
                        <div className="text-xs text-red-600">
                          No response data available
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireResponses;
