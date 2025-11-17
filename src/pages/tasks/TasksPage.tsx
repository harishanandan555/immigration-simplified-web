import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { getUsers, User } from '../../controllers/ClientControllers';
import { getTasks, createTask, Task } from '../../controllers/TaskControllers';
import { useAuth } from '../../controllers/AuthControllers';

const TasksPage = () => {
  const { user, isClient } = useAuth();
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Innovative UI states
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [lastCreatedTask, setLastCreatedTask] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  
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
        const clientsMap = new Map<string, Client>();
        const casesArray: Case[] = [];
        
        workflows.forEach((workflow: any) => {
          console.log('📋 Processing workflow:', {
            id: workflow._id,
            client: workflow.client,
            case: workflow.case,
            formCaseIds: workflow.case?.formCaseIds,
            hasFormCaseIds: !!(workflow.case?.formCaseIds && Object.keys(workflow.case.formCaseIds).length > 0),
            workflowStructure: JSON.stringify(workflow, null, 2) // Show full structure
          });
          
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
              Object.entries(caseData.formCaseIds).forEach(([formNumber, caseNumber]: [string, any]) => {
                const caseItem: Case = {
                  id: `${workflow._id}_${formNumber}`, // Unique ID combining workflow and form number
                  caseNumber: caseNumber, // Use the actual case number like "CR-2025-0373"
                  clientId: clientId,
                  category: caseData.category || '',
                  subcategory: caseData.subcategory || '',
                  openDate: workflow.createdAt || '',
                  priorityDate: caseData.priorityDate || workflow.createdAt || ''
                };
                
                console.log('➕ Adding case:', caseItem);
                casesArray.push(caseItem);
                
                // Add case to client's cases array
                const client = clientsMap.get(clientId);
                if (client && client.cases) {
                  client.cases.push(caseItem);
                }
              });
            } else if (caseData && (caseData.caseNumber || caseData.receiptNumber)) {
              // Alternative: Check for direct case number fields
              console.log('📋 Found direct case number field:', {
                caseNumber: caseData.caseNumber,
                receiptNumber: caseData.receiptNumber,
                caseId: caseData.caseId
              });
              
              const actualCaseNumber = caseData.caseNumber || caseData.receiptNumber || `CASE-${workflow._id?.slice(-8)}`;
              
              const caseItem: Case = {
                id: workflow._id || workflow.id,
                caseNumber: actualCaseNumber,
                clientId: clientId,
                category: caseData.category || '',
                subcategory: caseData.subcategory || '',
                openDate: workflow.createdAt || '',
                priorityDate: caseData.priorityDate || workflow.createdAt || ''
              };
              
              console.log('➕ Adding direct case:', caseItem);
              casesArray.push(caseItem);
              
              // Add case to client's cases array
              const client = clientsMap.get(clientId);
              if (client && client.cases) {
                client.cases.push(caseItem);
              }
            } else if (caseData) {
              // Fallback: if no formCaseIds, create a generic case
              console.log('⚠️ No formCaseIds found, using fallback for workflow:', workflow._id);
              console.log('📄 Available case data:', caseData);
              
              // Generate a better case number based on available data
              const workflowIdShort = workflow._id?.slice(-8) || 'UNKNOWN';
              const currentYear = new Date().getFullYear();
              let caseNumber;
              
              // Try to create a more meaningful case number
              if (caseData.category) {
                const categoryCode = caseData.category.substring(0, 3).toUpperCase();
                caseNumber = `${categoryCode}-${currentYear}-${workflowIdShort}`;
              } else {
                caseNumber = `WF-${currentYear}-${workflowIdShort}`;
              }
              
              // Normalize category names
              const normalizeCategory = (cat: string) => {
                return cat.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
              };
              
              const caseItem: Case = {
                id: workflow._id || workflow.id,
                caseNumber: caseNumber,
                clientId: clientId,
                category: caseData.category ? normalizeCategory(caseData.category) : '',
                subcategory: caseData.subcategory ? normalizeCategory(caseData.subcategory) : '',
                openDate: workflow.createdAt || '',
                priorityDate: caseData.priorityDate || workflow.createdAt || ''
              };
              
              console.log('➕ Adding improved fallback case:', caseItem);
              casesArray.push(caseItem);
              
              // Add case to client's cases array
              const client = clientsMap.get(clientId);
              if (client && client.cases) {
                client.cases.push(caseItem);
              }
            }
          }
        });


        return { 
          clients: Array.from(clientsMap.values()), 
          cases: casesArray 
        };
      } else {
        return { clients: [], cases: [] };
      }

    } catch (error: any) {
      console.error('❌ Error fetching workflows from API:', error);

      return { clients: [], cases: [] };
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch clients and cases from workflows API (for case selection only)
      const { clients: workflowClients, cases: workflowCases } = await fetchWorkflowsFromAPI();
      
      
      let allUsers: User[] = [];
      
      try {
        // Get all users from the new client users endpoint
        const response = await api.get('/api/v1/clients/users/all');
        allUsers = response.data?.users || response.data || [];
        setAllUsers(allUsers);
        
       
        // Filter users by role to get assignable users (attorneys and paralegals)
        const assignableUsers = allUsers.filter((user: User) => 
          user.role === 'attorney' || user.role === 'paralegal' || user.role === 'admin' || user.role === 'super_admin'
        );
        
     
        setUsers(assignableUsers);
        
      } catch (error) {
        console.error('❌ Error fetching users from /api/v1/clients/users/all:', error);
        
        // Fallback to the old method if the new endpoint fails
        try {
          console.log('🔄 Fallback: Trying original getUsers method...');
          const usersApiResponse = await getUsers({ limit: 100 });
          allUsers = usersApiResponse.users || [];
          setAllUsers(allUsers);
          
          const assignableUsers = allUsers.filter((user: User) => 
            user.role === 'attorney' || user.role === 'paralegal' || user.role === 'admin' || user.role === 'super_admin'
          );
          
          console.log('👥 Assignable users found (fallback):', {
            count: assignableUsers.length,
            users: assignableUsers.map(u => ({ name: `${u.firstName} ${u.lastName}`, role: u.role }))
          });
          
          setUsers(assignableUsers);
        } catch (fallbackError) {
          console.error('❌ Fallback method also failed:', fallbackError);
          setUsers([]);
          setAllUsers([]);
        }
      }
      
      // Set workflow clients and cases (primary source for client/case selection)
      if (workflowClients && workflowClients.length > 0) {
        
        // Enhance workflow clients with ims_user mapping for clientId
        const enhancedClients = workflowClients.map((client: any) => {
          // Try to find corresponding user in ims_user database by email
          const imsUser = allUsers.find((user: User) => user.email === client.clientId);
          
          
          return {
            ...client,
            imsUserId: imsUser?._id, // Add ims_user ID if found
            hasImsUser: !!imsUser
          };
        });
        
        setClients(enhancedClients);
        setCases(workflowCases || []);
      } else {
        setClients([]);
        setCases([]);
      }
      
      // Fetch actual tasks from API
      try {
        const tasksFromAPI = await getTasks();
        console.log("✅ Tasks fetched from API:", tasksFromAPI);
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

  // Handle new task form submission
  const handleCreateTask = async () => {
    try {
      
      // Validate required fields
      if (!newTask.title.trim()) {
        toast.error('Please enter a task title');
        setIsCreating(false);
        return;
      }
      
      if (!newTask.clientId || !newTask.clientName) {
        toast.error('Please select a client');
        setIsCreating(false);
        return;
      }
      
      if (!newTask.caseId) {
        toast.error('Please select a case');
        setIsCreating(false);
        return;
      }
      
      if (!newTask.dueDate) {
        toast.error('Please select a due date');
        setIsCreating(false);
        return;
      }
      
      if (!newTask.assignedTo) {
        toast.error('Please assign the task to someone');
        setIsCreating(false);
        return;
      }
      
      setIsCreating(true);
      
      // Find the selected case to get proper case number and form type
      const selectedCase = cases.find((c: any) => c.id === newTask.caseId);
      let relatedCaseId = newTask.caseId;
      
      if (selectedCase) {
        // Extract form type from case ID if it contains form info
        const formNumber = selectedCase.id.includes('_') ? selectedCase.id.split('_')[1] : '';
        
        if (formNumber) {
          // Send only case number and form number: "CR-2025-9382 (G-28)"
          relatedCaseId = `${selectedCase.caseNumber} (${formNumber})`;
        } else {
          // If no form type, just send case number
          relatedCaseId = selectedCase.caseNumber;
        }
        
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
      
      await createTask(taskData);
      
      // Store created task for preview and trigger success animation
      setLastCreatedTask({
        ...newTask,
        selectedCase,
        priority: newTask.priority
      });
      
      // Show success animations
      setShowSuccessAnimation(true);
      
      // Enhanced toast with rich content
      toast.success(
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900">Task Created Successfully! 🎉</p>
            <p className="text-sm text-gray-600">
              "{newTask.title}" assigned to {newTask.assignedTo}
            </p>
          </div>
        </div>,
        { 
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #0ea5e9',
            borderRadius: '12px',
            padding: '16px'
          }
        }
      );
      
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
      
      // Hide animations after delay
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setLastCreatedTask(null);
      }, 4000);
      
      // Reload tasks to show the new one
      await loadData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setIsCreating(false);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom styles for animations */}
      <style>{`
        @keyframes slideUpBounce {
          0% {
            transform: translateY(100px);
            opacity: 0;
          }
          60% {
            transform: translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up-bounce {
          animation: slideUpBounce 0.6s ease-out;
        }
        
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-confetti {
          animation: confetti 3s ease-out infinite;
        }
      `}</style>
      
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and track case-related tasks</p>
        </div>
        <div className="flex gap-3">
          {!(isClient && user?.userType === 'individualUser') && (
            <Link
              to="/calendar"
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors"
            >
              <Calendar size={18} />
              <span>Calendar View</span>
            </Link>
          )}
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
              <span>Sort</span>  {/* NOT WORKING YET */}
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
                         
                            
                            setNewTask({
                              ...newTask, 
                              clientId: clientIdToUse,
                              clientName: e.target.value, 
                              caseId: ''
                            });
                          }}
                        >
                          <option key="select-client" value="">Select a client...</option>
                          {clients.map((client: any) => (
                            <option key={client.clientId} value={client.name}>
                              {client.name} ({client.email})
                            </option>
                          ))}
                        </select>
                        {/* <p className="mt-1 text-xs text-gray-400">
                          Workflow clients: {clients.length} | With ims_user mapping: {clients.filter(c => c.hasImsUser).length} | Cases: {cases.length}
                        </p> */}
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
                          <option key="select-case" value="">
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
                              const formNumber = caseItem.id.includes('_') ? caseItem.id.split('_')[1] : '';
                              const displayText = formNumber 
                                ? `${caseItem.caseNumber} (${formNumber}) - ${caseItem.category || caseItem.subcategory || 'General'}`
                                : `${caseItem.caseNumber} - ${caseItem.category || caseItem.subcategory || 'General'}`;
                              
                            
                              
                              return (
                                <option key={caseItem.id} value={caseItem.id}>
                                  {displayText}
                                </option>
                              );
                            })}
                        </select>
                     
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
                            <option key="high" value="High">High</option>
                            <option key="medium" value="Medium">Medium</option>
                            <option key="low" value="Low">Low</option>
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
                          <option key="select-assignee" value="">
                            {users.length > 0 ? "Select assignee..." : "No assignable users found"}
                          </option>
                          {users.map((user: User) => (
                            <option key={user._id} value={`${user.firstName} ${user.lastName}`}>
                              {user.firstName} {user.lastName} ({user.role})
                            </option>
                          ))}
                          {users.length === 0 && allUsers.length > 0 && (
                            <option key="no-assignable" value="" disabled>
                              No attorneys or paralegals available
                            </option>
                          )}
                        </select>
                        {/* <p className="mt-1 text-xs text-gray-400">
                          Available assignees: {users.length} (attorneys & paralegals)
                        </p> */}
                        {/* Debug info */}
                       
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={isCreating}
                  className={`w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm ${
                    isCreating 
                      ? 'bg-blue-400 cursor-not-allowed transform scale-95' 
                      : 'bg-primary-600 hover:bg-primary-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                  }`}
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
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

      {/* Confetti Animation */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Confetti particles */}
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 animate-ping opacity-75 ${
                  i % 4 === 0 ? 'bg-yellow-400' :
                  i % 4 === 1 ? 'bg-green-400' :
                  i % 4 === 2 ? 'bg-blue-400' : 'bg-pink-400'
                }`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Success checkmark animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-6 shadow-2xl border-4 border-green-500 animate-bounce">
              <div className="text-green-500 text-6xl">✅</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Task Preview Card */}
      {lastCreatedTask && showSuccessAnimation && (
        <div className="fixed bottom-4 right-4 z-[90] transform transition-all duration-500 animate-bounce">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-semibold text-gray-900">Task Created!</p>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{lastCreatedTask.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{lastCreatedTask.description || 'No description'}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>👤 {lastCreatedTask.assignedTo}</p>
                  <p>📅 {new Date(lastCreatedTask.dueDate).toLocaleDateString()}</p>
                  <p>📋 {lastCreatedTask.selectedCase?.caseNumber}</p>
                </div>
              </div>
              <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                lastCreatedTask.priority === 'High' ? 'bg-red-100 text-red-700' :
                lastCreatedTask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {lastCreatedTask.priority}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default TasksPage;