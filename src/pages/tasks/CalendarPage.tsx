import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckSquare,
  Clock,
  AlertCircle
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, isWithinInterval, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { getTasks } from '../../controllers/TaskControllers';
import api from '../../utils/api';

type Task = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  clientName?: string;
  relatedCaseId?: string;
  caseId?: string; // For backward compatibility
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedTo: string | any;
  notes?: string;
  tags?: string[];
  reminders?: string[];
  createdAt?: string;
  updatedAt?: string;
};

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
  imsUserId?: string;
  hasImsUser?: boolean;
};

const CalendarPage = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  // State for real data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from TasksPage logic
  useEffect(() => {
    loadData();
  }, []);

  // Function to fetch clients and cases from workflows API (same as TasksPage)
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
          const clientData = workflow.client;
          const caseData = workflow.case;
          
          if (clientData && clientData.name && clientData.email) {
            const clientId = clientData.email;
            
            // Add client if not already exists
            if (!clientsMap.has(clientId)) {
              clientsMap.set(clientId, {
                _id: workflow._id || workflow.id,
                id: clientId,
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
              Object.entries(caseData.formCaseIds).forEach(([formType, caseNumber]: [string, any]) => {
                const caseItem: Case = {
                  id: `${workflow._id}_${formType}`,
                  caseNumber: caseNumber,
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
      
      // Fetch clients and cases from workflows API
      const { clients: workflowClients, cases: workflowCases } = await fetchWorkflowsFromAPI();
      
      setClients(workflowClients);
      setCases(workflowCases || []);
      
  // Fetch actual tasks from API
      try {
        const tasksFromAPI = await getTasks();
        
        // Ensure all tasks have priority and status for calendar display
        const tasksWithDefaults = tasksFromAPI.map(task => ({
          ...task,
          priority: task.priority || 'Medium',
          status: task.status || 'Pending'
        }));
        
       setTasks(tasksWithDefaults);
      } catch (error) {
        console.error('❌ Error fetching tasks for calendar:', error);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setClients([]);
      setCases([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Get tasks for the selected month
  const monthTasks = tasks.filter((task: Task) => {
    const taskDate = new Date(task.dueDate);
    return isWithinInterval(taskDate, {
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth)
    });
  });

  // Get tasks for the selected date
  const selectedDateTasks = selectedDate 
    ? monthTasks.filter((task: Task) => isSameDay(new Date(task.dueDate), selectedDate))
    : [];

  const getTaskStatusColor = (status: 'Pending' | 'In Progress' | 'Completed') => {
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

  const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
          <p className="text-gray-500 mt-1">View and manage tasks by date</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/tasks"
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md transition-colors"
          >
            <CheckSquare size={18} />
            <span>List View</span>
          </Link>
          {/* <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            modifiers={{
              hasTasks: (day) => monthTasks.some((task: Task) => 
                isSameDay(new Date(task.dueDate), day)
              )
            }}
            modifiersStyles={{
              hasTasks: {
                fontWeight: 'bold'
              }
            }}
            components={{
              DayContent: ({ date }) => {
                const dayTasks = monthTasks.filter((task: Task) => 
                  isSameDay(new Date(task.dueDate), date)
                );
                
                return (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* Task name above the date */}
                    {dayTasks.length > 0 && (
                      <div className="text-xs text-gray-600 mb-1 max-w-full text-center">
                        {dayTasks.slice(0, 1).map((task, index) => (
                          <div key={index} className="truncate leading-tight">
                            {task.title.length > 10 ? task.title.substring(0, 10) + '...' : task.title}
                          </div>
                        ))}
                        {dayTasks.length > 1 && (
                          <div className="text-xs text-gray-400">+{dayTasks.length - 1}</div>
                        )}
                      </div>
                    )}
                    
                    {/* Date number with priority color border */}
                    <div className={`font-medium text-center w-8 h-8 rounded-full flex items-center justify-center ${
                      dayTasks.length > 0 
                        ? dayTasks.some(task => task.priority === 'High')
                          ? 'border-2 border-red-500 bg-red-50 text-red-700'
                          : dayTasks.some(task => task.priority === 'Medium')
                          ? 'border-2 border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-2 border-green-500 bg-green-50 text-green-700'
                        : ''
                    }`}>
                      {format(date, 'd')}
                    </div>
                    
                    {/* Task indicators below the date */}
                    {dayTasks.length > 0 && (
                      <div className="flex flex-col items-center mt-1">
                        <div className="flex gap-1">
                          {dayTasks.some((task: Task) => 
                            new Date(task.dueDate) < new Date() && task.status !== 'Completed'
                          ) && (
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          )}
                          {dayTasks.some((task: Task) => task.priority === 'High') && (
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          )}
                          {!dayTasks.some((task: Task) => 
                            new Date(task.dueDate) < new Date() && task.status !== 'Completed'
                          ) && !dayTasks.some((task: Task) => task.priority === 'High') && (
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            }}
            styles={{
              months: { margin: '0' },
              caption: { marginBottom: '1rem' },
              caption_label: { fontSize: '1.1rem', fontWeight: '600' },
              nav_button: { 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '0.5rem',
                color: '#4b5563'
              },
              table: { width: '100%' },
              head_cell: { 
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              },
              cell: { 
                padding: '0.5rem',
                fontSize: '0.875rem',
                height: '4rem', // Increased height to accommodate task name
                verticalAlign: 'middle'
              },
              day: {
                margin: '0',
                width: '100%',
                height: '100%',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }}
            className="w-full"
          />
        </div>

        {/* Tasks for selected date */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
            </h2>
            {selectedDate && (
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Task
              </button>
            )}
          </div>

          {selectedDateTasks.length > 0 ? (
            <div className="space-y-4">
              {selectedDateTasks.map((task: Task) => {
                // Handle both old format (caseId) and new format (relatedCaseId)
                const caseIdentifier = task.caseId || task.relatedCaseId;
                const relatedCase = cases.find((c: Case) => 
                  c.id === caseIdentifier || 
                  c.caseNumber === caseIdentifier?.split(' ')[0]
                );
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                
                return (
                  <div 
                    key={task._id || task.id}
                    className={`p-4 rounded-lg border ${
                      isOverdue 
                        ? 'border-error-200 bg-error-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {task.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {task.description}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          {relatedCase && (
                            <Link 
                              to={`/cases/${relatedCase.id}`}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              {relatedCase.caseNumber}
                            </Link>
                          )}
                          {task.clientName && (
                            <span className="text-xs text-gray-500">
                              Client: {task.clientName}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>
                      {isOverdue && (
                        <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks scheduled</h3>
              {selectedDate && (
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new task for this date.
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-error-500" />
                <span className="text-sm text-gray-600">Overdue Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning-500" />
                <span className="text-sm text-gray-600">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary-500" />
                <span className="text-sm text-gray-600">Normal Tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;