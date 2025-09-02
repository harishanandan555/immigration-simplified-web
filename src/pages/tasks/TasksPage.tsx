import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import api from '../../utils/api';
import { getUsers, User } from '../../controllers/ClientControllers';
import { getTasks, createTask, Task } from '../../controllers/TaskControllers';

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  type Case = { 
    id: string; 
    caseNumber: string; 
    clientId: string;
    category?: string;
    subcategory?: string;
    openDate?: string;
    priorityDate?: string;
  };
  
  type Client = {
    _id: string;
    id: string;
    name: string;
    email: string;
    phone?: string;
    workflowId?: string;
    caseType?: string;
    cases?: Case[];
    imsUserId?: string; // ims_user database ID when available
    hasImsUser?: boolean; // whether this client exists in ims_user database
  };
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    clientId: '',
    clientName: '',
    caseId: '',
    dueDate: '',
    priority: 'Medium',
    assignedTo: '',
    notes: '',
    tags: [] as string[],
    reminders: [] as string[]
  });

  const statusTypes = ['all', 'Pending', 'In Progress', 'Completed'];
  const priorityLevels = ['all', 'High', 'Medium', 'Low'];

  // Load data from API on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Function to fetch clients and cases from workflows API
  const fetchWorkflowsFromAPI = async (): Promise<{ clients: Client[], cases: Case[] }> => {
    try {
      console.log('🔄 Fetching workflows from API for tasks...');
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('❌ No authentication token available');
        return { clients: [], cases: [] };
      }

      const response = await api.get('/api/v1/workflows', {
        params: {
          page: 1,
          limit: 100
        }
      });

      console.log('📥 Workflows API response for tasks:', response.data);

      if (response.data?.success && response.data?.data) {
        const workflows = response.data.data;
        console.log(`✅ Successfully loaded ${workflows.length} workflows for tasks`);
        
        const clientsMap = new Map<string, Client>();
        const casesArray: Case[] = [];
        
        workflows.forEach((workflow: any) => {
          const clientData = workflow.client;
          const caseData = workflow.case;
          
          if (clientData && clientData.name && clientData.email) {
            const clientId = clientData.email;
            
            // Add client if not already exists
            if (!clientsMap.has(clientId)) {
              clientsMap.set(clientId, {
                _id: workflow._id || workflow.id, // The workflow ID is the actual client ObjectId
                id: clientId, // Keep email as display ID
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone || '',
                workflowId: workflow._id || workflow.id,
                caseType: caseData?.category || caseData?.subcategory || '',
                cases: []
              });
            }
            
            // Extract case numbers from formCaseIds
            if (caseData && caseData.formCaseIds) {
              // formCaseIds is an object like { "G-1566": "CR-2025-0373" }
              Object.entries(caseData.formCaseIds).forEach(([formType, caseNumber]: [string, any]) => {
                const caseItem: Case = {
                  id: `${workflow._id}_${formType}`, // Unique ID combining workflow and form type
                  caseNumber: caseNumber, // Use the actual case number like "CR-2025-0373"
                  clientId: clientId,
                  category: caseData.category || '',
                  subcategory: caseData.subcategory || '',
                  openDate: workflow.createdAt || '',
                  priorityDate: caseData.priorityDate || workflow.createdAt || ''
                };
                
                casesArray.push(caseItem);
                
                // Add case to client's cases array
                const client = clientsMap.get(clientId);
                if (client && client.cases) {
                  client.cases.push(caseItem);
                }
              });
            } else if (caseData) {
              // Fallback: if no formCaseIds, create a generic case
              const caseItem: Case = {
                id: workflow._id || workflow.id,
                caseNumber: `WF-${workflow.workflowId || workflow._id?.slice(-8) || 'UNKNOWN'}`,
                clientId: clientId,
                category: caseData.category || '',
                subcategory: caseData.subcategory || '',
                openDate: workflow.createdAt || '',
                priorityDate: caseData.priorityDate || workflow.createdAt || ''
              };
              
              casesArray.push(caseItem);
              
              // Add case to client's cases array
              const client = clientsMap.get(clientId);
              if (client && client.cases) {
                client.cases.push(caseItem);
              }
            }
          }
        });

        console.log('📊 Processed data:', {
          clients: Array.from(clientsMap.values()).length,
          cases: casesArray.length,
          clientsWithCases: Array.from(clientsMap.values()).map(c => ({ 
            name: c.name, 
            casesCount: c.cases?.length || 0 
          }))
        });

        return { 
          clients: Array.from(clientsMap.values()), 
          cases: casesArray 
        };
      } else {
        console.log('⚠️ No workflow data available in API response');
        return { clients: [], cases: [] };
      }

    } catch (error: any) {
      console.error('❌ Error fetching workflows from API:', error);
      if (error?.response?.status === 401) {
        console.log('🔑 Authentication failed - token may be expired');
      }
      return { clients: [], cases: [] };
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch clients and cases from workflows API (for case selection only)
      const { clients: workflowClients, cases: workflowCases } = await fetchWorkflowsFromAPI();
      
      // Fetch all users (including clients) from ims_user database
      console.log('🔄 Fetching all users from ims_user database...');
      
      let allUsers: User[] = [];
      let clientUsers: User[] = [];
      
      try {
        // Get all users from ims_user database
        allUsers = await getUsers();
        console.log('📋 All users from ims_user:', allUsers.length);
        
        // Filter users by role to get clients and assignable users
        clientUsers = allUsers.filter((user: User) => user.role === 'client');
        const assignableUsers = allUsers.filter((user: User) => 
          user.role === 'attorney' || user.role === 'paralegal'
        );
        
        console.log('� Client users:', clientUsers.length);
        console.log('📋 Assignable users:', assignableUsers.length);
        
        setUsers(assignableUsers);
        
      } catch (error) {
        console.error('❌ Error fetching users from ims_user database:', error);
        setUsers([]);
        clientUsers = [];
      }
      
      // Set workflow clients and cases (primary source for client/case selection)
      if (workflowClients && workflowClients.length > 0) {
        console.log('✅ Using workflow clients for selection:', workflowClients.length);
        console.log('✅ Using workflow cases:', workflowCases?.length || 0);
        
        // Enhance workflow clients with ims_user mapping for clientId
        const enhancedClients = workflowClients.map((client: any) => {
          // Try to find corresponding user in ims_user database by email
          const imsUser = allUsers.find((user: User) => user.email === client.id);
          
          console.log('🔍 Client mapping:', {
            workflowClient: {
              name: client.name,
              id: client.id, // This should be email
              _id: client._id, // This is workflow client _id
            },
            imsUser: imsUser ? {
              _id: imsUser._id,
              email: imsUser.email,
              name: `${imsUser.firstName} ${imsUser.lastName}`
            } : null,
            mapped: !!imsUser
          });
          
          return {
            ...client,
            imsUserId: imsUser?._id, // Add ims_user ID if found
            hasImsUser: !!imsUser
          };
        });
        
        console.log('📋 Enhanced clients with ims_user mapping:', 
          enhancedClients.map((c: any) => `${c.name} (${c.id}) -> ims_user: ${c.hasImsUser ? c.imsUserId : 'NOT_FOUND'}`));
        
        setClients(enhancedClients);
        setCases(workflowCases || []);
      } else {
        console.log('⚠️ No workflow data found, using empty arrays');
        setClients([]);
        setCases([]);
      }
      
      // Fetch actual tasks from API
      try {
        console.log('🔄 Fetching tasks from API...');
        const tasksFromAPI = await getTasks();
        console.log('📋 Tasks fetched:', tasksFromAPI);
        setTasks(tasksFromAPI);
      } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        setTasks([]);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading data:', error.message);
      } else {
        console.error('Error loading data:', error);
      }
      setClients([]);
      setCases([]);
      setUsers([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get client name for a case
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

  // Get user name for assignment
  const getUserNameForTask = (assignedTo: string | User | any) => {
    // Handle both object format (from API) and string format (from form)
    if (typeof assignedTo === 'object' && assignedTo) {
      return `${assignedTo.firstName} ${assignedTo.lastName}`;
    }
    return assignedTo || 'Unassigned';
  };

  // Handle new task form submission
  const handleCreateTask = async () => {
    try {
      console.log('Creating task:', newTask);
      
      // Validate required fields
      if (!newTask.title.trim()) {
        console.error('Please enter a task title');
        return;
      }
      
      if (!newTask.clientId || !newTask.clientName) {
        console.error('Please select a client');
        return;
      }
      
      if (!newTask.caseId) {
        console.error('Please select a case');
        return;
      }
      
      if (!newTask.dueDate) {
        console.error('Please select a due date');
        return;
      }
      
      if (!newTask.assignedTo) {
        console.error('Please assign the task to someone');
        return;
      }
      
      // Find the selected case to get proper case number and form type
      const selectedCase = cases.find((c: any) => c.id === newTask.caseId);
      let relatedCaseId = newTask.caseId;
      
      if (selectedCase) {
        // Extract form type from case ID if it contains form info
        const formType = selectedCase.id.includes('_') ? selectedCase.id.split('_')[1] : '';
        
        if (formType) {
          // Send only case number and form type: "CR-2025-9382 (G-28)"
          relatedCaseId = `${selectedCase.caseNumber} (${formType})`;
        } else {
          // If no form type, just send case number
          relatedCaseId = selectedCase.caseNumber;
        }
        
        console.log('📋 Case formatting:', {
          originalId: selectedCase.id,
          caseNumber: selectedCase.caseNumber,
          formType: formType,
          formattedRelatedCaseId: relatedCaseId
        });
      }
      
      // Create the task using the API - send only required fields
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        clientName: newTask.clientName,
        relatedCaseId: relatedCaseId,
        dueDate: newTask.dueDate,
        priority: newTask.priority as 'High' | 'Medium' | 'Low',
        assignedTo: newTask.assignedTo,
        notes: newTask.notes || '',
        tags: newTask.tags || [],
        reminders: newTask.reminders || []
      };
      
      console.log('🔄 Creating task with streamlined data:', taskData);
      console.log('📋 Task creation details:', {
        title: taskData.title,
        clientName: taskData.clientName,
        relatedCaseId: taskData.relatedCaseId,
        assignedTo: taskData.assignedTo,
        priority: taskData.priority
      });
      
      const createdTask = await createTask(taskData);
      
      console.log('✅ Task created successfully:', createdTask);
      
      // Reset form and close modal
      setNewTask({
        title: '',
        description: '',
        clientId: '',
        clientName: '',
        caseId: '',
        dueDate: '',
        priority: 'Medium',
        assignedTo: '',
        notes: '',
        tags: [],
        reminders: []
      });
      setShowNewTaskModal(false);
      
      // Reload tasks to show the new one
      await loadData();
    } catch (error) {
      console.error('Error creating task:', error);
      console.error('Failed to create task. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and track case-related tasks</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/calendar"
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors"
          >
            <Calendar size={18} />
            <span>Calendar View</span>
          </Link>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex gap-4">
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusTypes.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              {priorityLevels.map((priority) => (
                <option key={priority} value={priority}>
                  {priority === 'all' ? 'All Priority' : priority}
                </option>
              ))}
            </select>

            <button className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors">
              <ArrowUpDown size={16} />
              <span>Sort</span>
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            {filteredTasks.length > 0 && (
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task: Task) => {
                  // Handle both old format (caseId) and new format (relatedCaseId)
                  const caseIdentifier = (task as any).caseId || task.relatedCaseId;
                  const relatedCase = cases.find((c: any) => c.id === caseIdentifier || c.caseNumber === caseIdentifier?.split(' ')[0]);
                  const daysUntilDue = getDaysUntilDue(task.dueDate);
                  const isOverdue = daysUntilDue < 0;
                  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;
                  
                  return (
                    <tr key={task._id || task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getClientNameForCase(caseIdentifier)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/cases/${relatedCase?.id}`} className="text-sm text-primary-600 hover:text-primary-700">
                          {relatedCase?.caseNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status || 'Pending')}`}>
                          {task.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isOverdue ? (
                            <AlertCircle className="h-4 w-4 text-error-500 mr-1" />
                          ) : isDueSoon ? (
                            <Clock className="h-4 w-4 text-warning-500 mr-1" />
                          ) : (
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          )}
                          <span className={`text-sm ${
                            isOverdue ? 'text-error-600 font-medium' :
                            isDueSoon ? 'text-warning-600 font-medium' :
                            'text-gray-500'
                          }`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                            {isOverdue && ' (Overdue)'}
                            {isDueSoon && !isOverdue && ' (Due Soon)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getUserNameForTask(task.assignedTo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-500">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new task.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Task
                </button>
              </div>
            </div>
          )}
        </div>

        {filteredTasks.length > 0 && (
          <div className="flex justify-between items-center mt-4 py-3">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredTasks.length}</span> of{" "}
              <span className="font-medium">{tasks.length}</span> tasks
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

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-screen overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Create New Task
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Task Title
                        </label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2"
                          placeholder="Enter task title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Select Client
                        </label>
                        <select 
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2"
                          value={newTask.clientName}
                          onChange={(e) => {
                            const selectedClient = clients.find(c => c.name === e.target.value);
                            // Use ims_user ID if available, otherwise use workflow client ID
                            const clientIdToUse = selectedClient?.imsUserId || selectedClient?._id || '';
                            console.log('🔄 Client selected:', {
                              name: e.target.value,
                              workflowId: selectedClient?._id,
                              imsUserId: selectedClient?.imsUserId,
                              usingId: clientIdToUse,
                              hasImsUser: selectedClient?.hasImsUser
                            });
                            
                            setNewTask({
                              ...newTask, 
                              clientId: clientIdToUse,
                              clientName: e.target.value, 
                              caseId: ''
                            });
                          }}
                        >
                          <option value="">Select a client...</option>
                          {clients.map((client: any) => (
                            <option key={client.id} value={client.name}>
                              {client.name} ({client.email})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">
                          Workflow clients: {clients.length} | With ims_user mapping: {clients.filter(c => c.hasImsUser).length} | Cases: {cases.length}
                        </p>
                        {/* {clients.length > 0 && (
                          <p className="mt-1 text-xs text-blue-600">
                            Clients: {clients.map(c => c.name).join(', ')}
                          </p>
                        )} */}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2"
                          rows={3}
                          placeholder="Enter task description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        />
                      </div>


                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Related Case
                        </label>
                        <select 
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2"
                          value={newTask.caseId}
                          onChange={(e) => setNewTask({...newTask, caseId: e.target.value})}
                          disabled={!newTask.clientId}
                        >
                          <option value="">
                            {newTask.clientId ? "Select a case..." : "Please select a client first"}
                          </option>
                          {cases
                            .filter((caseItem: any) => {
                              if (!newTask.clientId) return false;
                              // Find the client by _id and then compare with case's clientId (which is email)
                              const selectedClient = clients.find(c => c._id === newTask.clientId);
                              return selectedClient && caseItem.clientId === selectedClient.id;
                            })
                            .map((caseItem: any) => {
                              // Extract form type from case ID if it contains form info
                              const formType = caseItem.id.includes('_') ? caseItem.id.split('_')[1] : '';
                              const displayText = formType 
                                ? `${caseItem.caseNumber} (${formType}) - ${caseItem.category || caseItem.subcategory || 'General'}`
                                : `${caseItem.caseNumber} - ${caseItem.category || caseItem.subcategory || 'General'}`;
                              
                              return (
                                <option key={caseItem.id} value={caseItem.id}>
                                  {displayText}
                                </option>
                              );
                            })}
                        </select>
                        {newTask.clientId && (
                          <div className="mt-1 text-sm text-gray-500">
                            <p>Selected Client: {newTask.clientName}</p>
                            <p className="text-xs">Available cases for this client: {cases.filter(c => {
                              const selectedClient = clients.find(cl => cl._id === newTask.clientId);
                              return selectedClient && c.clientId === selectedClient.id;
                            }).length}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Due Date
                          </label>
                          <input
                            type="date"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Priority
                          </label>
                          <select 
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2"
                            value={newTask.priority}
                            onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Assign To
                        </label>
                        <select 
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2"
                          value={newTask.assignedTo}
                          onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                        >
                          <option value="">Select assignee...</option>
                          {users.map((user: User) => (
                            <option key={user._id} value={`${user.firstName} ${user.lastName}`}>
                              {user.firstName} {user.lastName} ({user.role})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">
                          Available assignees: {users.length} (attorneys & paralegals)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateTask}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowNewTaskModal(false)}
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

export default TasksPage;