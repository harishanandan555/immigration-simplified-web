import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  FileCheck,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import { getTasks } from '../controllers/TaskControllers';
import questionnaireAssignmentService from '../services/questionnaireAssignmentService';
import api from '../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { user, isClient, isAttorney, isSuperAdmin } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Workflow API data states
  const [clients, setClients] = useState<any[]>([]);
  const [workflowClients, setWorkflowClients] = useState<any[]>([]); // Dedicated client count from workflows
  const [cases, setCases] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingWorkflowData, setLoadingWorkflowData] = useState(false);
  
  // Workflow states
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    draft: 0
  });
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);

  // Load questionnaire assignments for clients
  useEffect(() => {
    if (isClient) {
      const loadAssignments = async () => {
        try {
          setLoadingQuestionnaires(true);
          const data = await questionnaireAssignmentService.getMyAssignments();
          
          console.log('Raw assignment data:', data); // Debug log
          
          // Ensure data is an array and filter out any invalid entries
          const validAssignments = Array.isArray(data) ? data.filter((item: any) => {
            const isValid = item && typeof item === 'object' && 
              (item.assignment_id || item._id || item.id);
            
            if (!isValid) {
              console.warn('Invalid assignment item filtered out:', item);
            }
            
            return isValid;
          }).map((item: any) => ({
            // Normalize the assignment object to ensure consistent structure
            assignment_id: item.assignment_id || item._id || item.id,
            _id: item._id || item.assignment_id || item.id,
            id: item.id || item.assignment_id || item._id,
            questionnaire_title: item.questionnaire_title || item.questionnaire?.title || 'Untitled',
            formType: item.formType || 'Unknown Form',
            status: item.status || 'pending',
            dueDate: item.dueDate,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          })) : [];
          
          console.log('Processed assignments:', validAssignments); // Debug log
          
          setAssignments(validAssignments);
          
          // Check for pending questionnaires to show notification
          const pendingAssignments = validAssignments.filter((a: any) => a.status === 'pending');
          setPendingCount(pendingAssignments.length);
          setShowNotification(pendingAssignments.length > 0);
        } catch (error) {
          console.error('Error loading questionnaire assignments:', error);
          // Set empty array on error to prevent rendering issues
          setAssignments([]);
        } finally {
          setLoadingQuestionnaires(false);
        }
      };

      loadAssignments();
    }
  }, [isClient]);

  // Load workflows data
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!isAttorney && !isSuperAdmin) return; // Only load for attorneys/admins
      
      try {
        setLoadingWorkflows(true);
        const workflowData = await fetchWorkflowsFromAPI();
        
        // Store workflows for case number matching
        setAvailableWorkflows(workflowData);
        
        // Calculate workflow stats
        const stats = {
          total: workflowData.length,
          inProgress: workflowData.filter((w: any) => w.status === 'in-progress').length,
          completed: workflowData.filter((w: any) => w.status === 'completed').length,
          draft: workflowData.filter((w: any) => w.status === 'draft').length
        };
        setWorkflowStats(stats);
        
      } catch (error) {
        console.error('Error loading workflows:', error);
      } finally {
        setLoadingWorkflows(false);
      }
    };

    loadWorkflows();
  }, [isAttorney, isSuperAdmin]);

  // Load dashboard data from workflow API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingWorkflowData(true);
        
        // Fetch clients, cases from workflows API
        const workflowData = await fetchClientsAndCasesFromAPI();
        setClients(workflowData.clients);
        setCases(workflowData.cases);
        
        // Fetch unique clients using ClientsPage logic for accurate count
        const uniqueClients = await fetchWorkflowClientsFromAPI();
        setWorkflowClients(uniqueClients);
        
        // Fetch tasks from tasks API
        const tasksData = await getTasks();
        setTasks(tasksData);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoadingWorkflowData(false);
      }
    };

    loadDashboardData();
  }, []);

  // Function to fetch clients and cases from workflows API
  const fetchClientsAndCasesFromAPI = async (): Promise<{ clients: any[], cases: any[] }> => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return { clients: [], cases: [] };
      }

      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100
        }
      });


      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
       
        const clientsMap = new Map<string, any>();
        const casesArray: any[] = [];

        workflows.forEach((workflow: any) => {
          // Extract client info
          if (workflow.client && workflow.client.id) {
            const clientData = {
              id: workflow.client.id,
              _id: workflow.client.id,
              name: workflow.client.name,
              email: workflow.client.email,
              phone: workflow.client.phone,
              imsUserId: workflow.client.imsUserId,
              hasImsUser: !!workflow.client.imsUserId
            };
            clientsMap.set(workflow.client.id, clientData);
          }

          // Extract case info from workflow
          if (workflow.case) {
            const enhancedCase = {
              id: workflow.case.id || workflow.case._id,
              _id: workflow.case.id || workflow.case._id,
              clientId: workflow.client?.id,
              clientName: workflow.client?.name,
              caseNumber: workflow.case.caseNumber || workflow.case.title,
              formType: workflow.case.assignedForms?.[0] || 'Unknown',
              status: workflow.case.status || 'draft',
              type: formatCaseCategory(workflow.case.category), // Use category directly from case
              category: workflow.case.category,
              subcategory: workflow.case.subcategory,
              visaType: workflow.case.visaType,
              priority: workflow.case.priority || 'medium',
              title: workflow.case.title,
              description: workflow.case.description,
              createdAt: workflow.case.createdAt,
              updatedAt: workflow.case.updatedAt,
              openDate: workflow.case.openDate,
              dueDate: workflow.case.dueDate,
              priorityDate: workflow.case.priorityDate
            };
            casesArray.push(enhancedCase);
          }
        });

        const clientsArray = Array.from(clientsMap.values());
        
        
        return { clients: clientsArray, cases: casesArray };
      }

      return { clients: [], cases: [] };
    } catch (error) {
      console.error('Error fetching dashboard data from API:', error);
      return { clients: [], cases: [] };
    }
  };

  // Function to fetch clients from workflows API (using ClientsPage logic)
  const fetchWorkflowClientsFromAPI = async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return [];
      }

      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100
        }
      });


      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        
        // Extract unique clients from workflows (using ClientsPage logic)
        const clientsMap = new Map<string, any>();
        
        workflows.forEach((workflow: any) => {
          const clientData = workflow.client;
          const caseData = workflow.case;
          
          if (clientData && clientData.name && clientData.email) {
            const clientId = clientData.email; // Use email as unique identifier
            
            if (!clientsMap.has(clientId)) {
              clientsMap.set(clientId, {
                _id: workflow._id || workflow.id,
                id: clientId,
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone || 'N/A',
                status: clientData.status || 'Active',
                createdAt: workflow.createdAt || caseData?.openDate || '',
                alienNumber: clientData.alienNumber || 'N/A',
                address: clientData.address?.formattedAddress || 'N/A',
                nationality: clientData.nationality || 'N/A',
                dateOfBirth: clientData.dateOfBirth || 'N/A',
                // Workflow-specific fields
                workflowId: workflow._id || workflow.id,
                caseType: caseData?.category || caseData?.subcategory || 'N/A',
                formCaseIds: workflow.formCaseIds,
                openDate: caseData?.openDate || 'N/A',
                priorityDate: caseData?.priorityDate || 'N/A'
              });
            }
          }
        });

        const uniqueClients = Array.from(clientsMap.values());
        return uniqueClients;
      } else {
        return [];
      }

    } catch (error: any) {
      console.error('❌ Error fetching clients from workflows API:', error);
      return [];
    }
  };

  // Helper function to format case category for display
  const formatCaseCategory = (category: string): string => {
    if (!category) return 'Other';
    
    // Map workflow categories to display categories
    switch (category.toLowerCase()) {
      case 'family-based':
        return 'Family-Based';
      case 'employment-based':
        return 'Employment-Based';
      case 'humanitarian':
        return 'Humanitarian';
      case 'naturalization':
        return 'Naturalization';
      case 'business':
        return 'Business';
      default:
        return category.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  // Function to get client name for a case (from TasksPage)
  const getClientNameForCase = (caseId: string) => {
    if (!caseId) return '';
    
    // Handle formatted case numbers like "CR-2025-9382 (G-28)"
    let selectedCase;
    if (caseId.includes('CR-')) {
      // Extract case number from formatted string
      const caseNumber = caseId.split(' ')[0];
      selectedCase = cases.find((c: any) => c.caseNumber === caseNumber);
    } else {
      // Handle database IDs (for backward compatibility)
      selectedCase = cases.find((c: any) => c.id === caseId);
    }
    
    if (selectedCase) {
      const client = clients.find((c: any) => c.id === selectedCase.clientId);
      return client ? client.name : 'Unknown Client';
    }
    return '';
  };

  // Function to get workflow case number for a case (from CasesPage)
  const getWorkflowCaseNumber = (caseItem: any) => {
    if (!availableWorkflows.length) {
      return null;
    }

    // Try to find a matching workflow by various criteria
    const matchingWorkflow = availableWorkflows.find((workflow: any) => {
      // Match by case ID first (most reliable)
      if (workflow.case?.id && caseItem._id) {
        const idMatch = workflow.case.id === caseItem._id || workflow.case._id === caseItem._id;
        if (idMatch) {
          return true;
        }
      }

      // Match by case number if available
      if (workflow.case?.caseNumber && caseItem.caseNumber) {
        const caseNumberMatch = workflow.case.caseNumber === caseItem.caseNumber;
        if (caseNumberMatch) {
          return true;
        }
      }

      // Match by form case IDs (check if case number matches any form case ID)
      if (workflow.formCaseIds && Object.keys(workflow.formCaseIds).length > 0) {
        const formCaseIdMatch = Object.values(workflow.formCaseIds).some(formCaseId => 
          formCaseId === caseItem.caseNumber
        );
        if (formCaseIdMatch) {
          return true;
        }
      }

      // Match by case title/description
      if (workflow.case?.title && caseItem.description) {
        const titleMatch = workflow.case.title.toLowerCase().includes(caseItem.description.toLowerCase()) ||
            caseItem.description.toLowerCase().includes(workflow.case.title.toLowerCase());
        if (titleMatch) {
          return true;
        }
      }

      // Match by client email if available
      if (workflow.client?.email && caseItem.clientName) {
        const client = clients.find((c: any) => c.id === caseItem.clientId);
        if (client?.email) {
          const emailMatch = workflow.client.email.toLowerCase() === client.email.toLowerCase();
          if (emailMatch) {
            return true;
          }
        }
      }

      // Match by client name if available
      if (workflow.client && caseItem.clientName) {
        const workflowClientName = workflow.client.name || 
          `${workflow.client.firstName || ''} ${workflow.client.lastName || ''}`.trim();
        const nameMatch = workflowClientName.toLowerCase() === caseItem.clientName.toLowerCase();
        if (nameMatch) {
          return true;
        }
      }

      // Match by client ID if available
      if (workflow.client?.id && caseItem.clientId) {
        const clientIdMatch = workflow.client.id === caseItem.clientId || workflow.client._id === caseItem.clientId;
        if (clientIdMatch) {
          return true;
        }
      }

      // Fuzzy match by case type/category
      if (workflow.case?.category && caseItem.type) {
        const categoryMatch = workflow.case.category.toLowerCase().includes(caseItem.type.toLowerCase()) ||
            caseItem.type.toLowerCase().includes(workflow.case.category.toLowerCase());
        if (categoryMatch) {
          return true;
        }
      }

      return false;
    });

    return matchingWorkflow;
  };

  // Function to get workflow case numbers for display (from CasesPage)
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

  // Fetch workflows from API function
  const fetchWorkflowsFromAPI = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return [];
      }

      const response = await api.get('/api/v1/workflows', {
        params: {
          status: 'in-progress',
          page: 1,
          limit: 50
        }
      });

      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        return workflows;
      } else {
        return [];
      }

    } catch (error: any) {
      console.error('❌ Error fetching workflows from API:', error);


      return [];
    } finally {
    }
  };

  // Filter cases if user is a client
  const filteredCases = isClient
    ? cases.filter((c: any) => c.clientId === user?.id)
    : cases;

  // Filter upcoming tasks
  const upcomingDeadlines = tasks
    .filter((task: any) =>
      task.dueDate && new Date(task.dueDate) > new Date() &&
      (!isClient || task.assignedTo === user?.id)
    )
    .sort((a: any, b: any) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  // Status counts for charts
  const statusCounts = filteredCases.reduce((acc: any, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  const typeData = [
    { name: 'Family-Based', cases: filteredCases.filter((c: any) => c.type === 'Family-Based').length },
    { name: 'Employment-Based', cases: filteredCases.filter((c: any) => c.type === 'Employment-Based').length },
    { name: 'Humanitarian', cases: filteredCases.filter((c: any) => c.type === 'Humanitarian').length },
    { name: 'Naturalization', cases: filteredCases.filter((c: any) => c.type === 'Naturalization').length },
    { name: 'Business', cases: filteredCases.filter((c: any) => c.type === 'Business').length },
    {
      name: 'Other', cases: filteredCases.filter((c: any) =>
        !['Family-Based', 'Employment-Based', 'Humanitarian', 'Naturalization', 'Business'].includes(c.type)
      ).length
    }
  ].filter(item => item.cases > 0); // Only show categories with cases

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName} {user?.lastName}</p>
      </div>

      {/* Loading indicator */}
      {loadingWorkflowData && (
        <div className="mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Notification for new questionnaires */}
      {showNotification && isClient && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You have {pendingCount} {pendingCount === 1 ? 'questionnaire' : 'questionnaires'} pending completion.
              </p>
              <div className="mt-2">
                <Link 
                  to="/my-questionnaires"
                  className="text-sm font-medium text-blue-700 hover:text-blue-600"
                >
                  View questionnaires <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setShowNotification(false)}
                  className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Cases</p>
              <p className="text-2xl font-bold mt-1">{filteredCases.filter(c => c.status !== 'Closed').length}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/cases" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all cases →
            </Link>
          </div>
        </div> */}

        {/* <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Forms</p>
              <p className="text-2xl font-bold mt-1">{
                filteredCases.reduce((sum: number, c: any) => sum + (c.pendingForms || 0), 0)
              }</p>
            </div>
            <div className="p-2 bg-secondary-100 rounded-lg text-secondary-600">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/forms" className="text-sm text-secondary-600 hover:text-secondary-700 font-medium">
              Manage forms →
            </Link>
          </div>
        </div> */}

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming Deadlines</p>
              <p className="text-2xl font-bold mt-1">{upcomingDeadlines.length}</p>
            </div>
            <div className="p-2 bg-accent-100 rounded-lg text-accent-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4">
            <Link to="/tasks" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
              View deadlines →
            </Link>
          </div>
        </div>

        {!isClient && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Clients</p>
                <p className="text-2xl font-bold mt-1">{workflowClients.length}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/clients" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View clients →
              </Link>
            </div>
          </div>
        )}

        {/* Workflows Stats for Attorneys/Admins */}
        {(isAttorney || isSuperAdmin) && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Workflows</p>
                <p className="text-2xl font-bold mt-1">
                  {loadingWorkflows ? '...' : workflowStats.inProgress}
                </p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <FileText size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/workflows" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Manage workflows →
              </Link>
            </div>
          </div>
        )}

        {isClient && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Documents</p>
                <p className="text-2xl font-bold mt-1">{
                  filteredCases.reduce((sum: number, c: any) => sum + (c.documents?.length || 0), 0)
                }</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <FileCheck size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/documents" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View documents →
              </Link>
            </div>
          </div>
        )}

        {/* Client Questionnaires */}
        {isClient && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Questionnaires</p>
                <p className="text-2xl font-bold mt-1">
                  {loadingQuestionnaires 
                    ? '...' 
                    : assignments.filter(a => a.status !== 'completed').length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <ClipboardList size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/my-questionnaires" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Complete questionnaires →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Case charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Case Type Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Cases by Type</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeframe('week')}
                  className={`px-3 py-1 text-xs rounded-md ${timeframe === 'week'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1 text-xs rounded-md ${timeframe === 'month'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeframe('quarter')}
                  className={`px-3 py-1 text-xs rounded-md ${timeframe === 'quarter'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  Quarter
                </button>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="90%" height="100%">
                <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cases" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workflow Status Chart for Attorneys/Admins */}
          {(isAttorney || isSuperAdmin) && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Workflow Status Overview</h2>
                <div className="text-sm text-gray-500">
                  Total: {workflowStats.total} workflows
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="90%" height="100%">
                  <BarChart data={[
                    { name: 'In Progress', count: workflowStats.inProgress },
                    { name: 'Completed', count: workflowStats.completed },
                    { name: 'Draft', count: workflowStats.draft }
                  ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Cases */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent Cases</h2>
              <Link to="/cases" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Case Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCases.slice(0, 4).map((caseItem: any, caseIndex: number) => {
                    // Comprehensive safety check
                    if (!caseItem || typeof caseItem !== 'object' || Array.isArray(caseItem)) {
                      console.warn('Invalid case item at index', caseIndex, caseItem);
                      return null;
                    }

                    // Ensure all case properties are strings/primitives
                    const caseId = String(caseItem.id || caseItem._id || '');
                    const caseNumber = String(caseItem.caseNumber || 'No Case Number');
                    const caseType = String(caseItem.type || 'Unknown');
                    const caseStatus = String(caseItem.status || 'Unknown');
                    const clientName = String(caseItem.clientName || 'Unknown Client');

                    if (!caseId) {
                      console.warn('Skipping case without valid ID', caseItem);
                      return null;
                    }

                    const client = clients.find((c: any) => c.id === caseItem.clientId);
                    const matchingWorkflow = getWorkflowCaseNumber(caseItem);
                    const workflowCaseNumbers = matchingWorkflow ? getWorkflowCaseNumbers(matchingWorkflow) : [];
                    
                    return (
                      <tr key={caseId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/cases/${caseId}`} className="text-primary-600 hover:text-primary-700 font-medium">
                            <div>{caseNumber}</div>
                            {workflowCaseNumbers.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {workflowCaseNumbers.map((caseNum, index) => {
                                  // Safety check to ensure we have valid data
                                  if (!caseNum || typeof caseNum !== 'object' || !caseNum.type || !caseNum.number) {
                                    return null;
                                  }
                                  return (
                                    <div 
                                      key={index}
                                      className={`text-xs font-mono px-2 py-1 rounded inline-block mr-1 ${
                                        caseNum.source === 'case' 
                                          ? 'text-blue-600 bg-blue-50' 
                                          : 'text-green-600 bg-green-50'
                                      }`}
                                    >
                                      {String(caseNum.type)}: {String(caseNum.number)}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {matchingWorkflow && (
                              <div className="text-xs text-purple-600 mt-1">
                                📋 Workflow Status: {String(matchingWorkflow.status || 'in-progress')}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{caseType}</div>
                          {matchingWorkflow?.selectedForms && Array.isArray(matchingWorkflow.selectedForms) && matchingWorkflow.selectedForms.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              Forms: {matchingWorkflow.selectedForms.map((form: any) => String(form)).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="font-medium">{String(client?.name || clientName)}</div>
                            {client?.email && (
                              <div className="text-xs text-gray-400">{String(client.email)}</div>
                            )}
                            {matchingWorkflow?.client && (
                              <div className="text-xs text-blue-600 mt-1">
                                🔗 Linked to workflow
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${caseStatus === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              caseStatus === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                caseStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                  caseStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    caseStatus === 'Document Collection' ? 'bg-yellow-100 text-yellow-800' :
                                      caseStatus === 'Waiting on USCIS' ? 'bg-purple-100 text-purple-800' :
                                        caseStatus === 'RFE Received' ? 'bg-orange-100 text-orange-800' :
                                          caseStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                                            caseStatus === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {caseStatus}
                          </span>
                          {matchingWorkflow && (
                            <div className="mt-1">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                Step {String(matchingWorkflow.currentStep || 1)}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column - Case status & tasks */}
        <div className="space-y-8">
          {/* Case Status Chart */}
          <div className="card">
            <h2 className="text-lg font-medium mb-4">Case Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workflow Progress for Attorneys/Admins */}
          {(isAttorney || isSuperAdmin) && (
            <div className="card">
              <h2 className="text-lg font-medium mb-4">Workflow Progress</h2>
              <div className="space-y-4">
                {loadingWorkflows ? (
                  <div className="py-4 text-center text-gray-500">
                    <p className="text-sm">Loading workflow data...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">In Progress</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{workflowStats.inProgress}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-900">Completed</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{workflowStats.completed}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">Draft</span>
                      </div>
                      <span className="text-lg font-bold text-gray-600">{workflowStats.draft}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link 
                        to="/workflows" 
                        className="block w-full text-center py-2 px-4 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 font-medium"
                      >
                        Manage All Workflows
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Upcoming Deadlines</h2>
              <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task: any, taskIndex: number) => {
                  // Safety check to prevent rendering objects
                  if (!task || typeof task !== 'object' || !task.id) {
                    console.warn('Skipping invalid task at index', taskIndex, task);
                    return null;
                  }
                  
                  // Ensure all task properties are strings/primitives
                  const taskId = String(task.id);
                  const taskTitle = String(task.title || 'Untitled Task');
                  const taskStatus = String(task.status || 'Pending');
                  const taskDueDate = task.dueDate;
                  
                  // Handle both old format (caseId) and new format (relatedCaseId) - from TasksPage logic
                  const caseIdentifier = task.caseId || task.relatedCaseId;
                  const relatedCase = cases.find((c: any) => 
                    c.id === caseIdentifier || 
                    c.caseNumber === caseIdentifier?.split(' ')[0] ||
                    c._id === caseIdentifier
                  );
                  
                  const matchingWorkflow = relatedCase ? getWorkflowCaseNumber(relatedCase) : null;
                  const workflowCaseNumbers = matchingWorkflow ? getWorkflowCaseNumbers(matchingWorkflow) : [];
                  
                  const daysLeft = taskDueDate ? Math.ceil(
                    (new Date(taskDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  ) : 0;
                  const isUrgent = daysLeft <= 3 && daysLeft > 0;

                  return (
                    <div
                      key={taskId}
                      className={`p-3 rounded-lg border ${isUrgent
                        ? 'border-error-200 bg-error-50'
                        : 'border-gray-200 bg-white'
                        }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 ${isUrgent ? 'text-error-500' : 'text-gray-400'}`}>
                          {isUrgent ? <AlertCircle size={18} /> : <CalendarDays size={18} />}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${isUrgent ? 'text-error-600' : 'text-gray-900'}`}>
                              {taskTitle}
                            </p>
                            <p className={`text-xs font-medium ${isUrgent ? 'text-error-600' : 'text-gray-500'
                              }`}>
                              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span>Client: {getClientNameForCase(caseIdentifier)}</span>
                                <span className="ml-2">Case: {relatedCase?.caseNumber || caseIdentifier}</span>
                              </div>
                            </div>
                            {workflowCaseNumbers.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {workflowCaseNumbers.map((caseNum, index) => {
                                  // Safety check to ensure we have valid data
                                  if (!caseNum || typeof caseNum !== 'object' || !caseNum.type || !caseNum.number) {
                                    return null;
                                  }
                                  return (
                                    <span 
                                      key={index}
                                      className={`text-xs font-mono px-2 py-1 rounded inline-block mr-1 ${
                                        caseNum.source === 'case' 
                                          ? 'text-blue-600 bg-blue-50' 
                                          : 'text-green-600 bg-green-50'
                                      }`}
                                    >
                                      {caseNum.type}: {caseNum.number}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {matchingWorkflow && (
                              <div className="text-xs text-purple-600 mt-1">
                                📋 Workflow Status: {matchingWorkflow.status || 'in-progress'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Due: {taskDueDate ? new Date(taskDueDate).toLocaleDateString() : 'No due date'}
                            </p>
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                ${taskStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                                  taskStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    taskStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {taskStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>

          {/* Questionnaires */}
          {isClient && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Questionnaires</h2>
                <Link to="/my-questionnaires" className="text-sm text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {loadingQuestionnaires ? (
                  <div className="py-4 text-center text-gray-500">
                    <p className="text-sm">Loading your questionnaires...</p>
                  </div>
                ) : assignments.length > 0 ? (
                  assignments.map((assignment, index) => {
                    // Extra safety check to prevent rendering objects
                    if (!assignment || typeof assignment !== 'object') {
                      console.warn('Skipping invalid assignment at index', index, assignment);
                      return null;
                    }
                    
                    const assignmentId = assignment.assignment_id || assignment._id || assignment.id;
                    const title = String(assignment.questionnaire_title || assignment.formType || 'Questionnaire');
                    const status = String(assignment.status || 'pending');
                    const dueDate = assignment.dueDate;
                    
                    if (!assignmentId) {
                      console.warn('Skipping assignment without valid ID', assignment);
                      return null;
                    }
                    
                    return (
                      <div
                        key={assignmentId}
                        className="p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                            </p>
                          </div>
                          <div>
                            <Link
                              to={`/questionnaires/fill/${assignmentId}`}
                              className="inline-flex items-center px-3 py-1 text-xs rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200"
                            >
                              {status === 'completed' ? 'View Responses' : 'Continue Questionnaire'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm">No questionnaires assigned</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;