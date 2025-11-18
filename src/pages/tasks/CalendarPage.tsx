import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
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

  // State for real data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
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
              Object.entries(caseData.formCaseIds).forEach(([formNumber, caseNumber]: [string, any]) => {
                const caseItem: Case = {
                  id: `${workflow._id}_${formNumber}`,
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
      const { cases: workflowCases } = await fetchWorkflowsFromAPI();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Calendar</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {format(selectedMonth, 'MMMM yyyy')} • {monthTasks.length} tasks this month
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-md shadow-sm text-sm font-medium transition-colors">
                  <Grid3X3 size={16} />
                  Month
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 rounded-md text-sm font-medium transition-colors">
                  <List size={16} />
                  List
                </button>
              </div>
              
              <Link
                to="/tasks"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <CheckSquare size={18} />
                <span>Manage Tasks</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Calendar Section */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    {format(selectedMonth, 'MMMM yyyy')}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setSelectedMonth(new Date())}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Body */}
              <div className="p-6">
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

                      const highPriorityTasks = dayTasks.filter(task => task.priority === 'High');
                      const overdueTasks = dayTasks.filter(task => 
                        new Date(task.dueDate) < new Date() && task.status !== 'Completed'
                      );

                      return (
                        <div className="relative w-full h-full">
                          {/* Task indicators at top */}
                          {dayTasks.length > 0 && (
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                              {overdueTasks.length > 0 && (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              )}
                              {highPriorityTasks.length > 0 && !overdueTasks.length && (
                                <div className="w-2 h-2 rounded-full bg-orange-400" />
                              )}
                              {dayTasks.length > 0 && !overdueTasks.length && !highPriorityTasks.length && (
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                              )}
                            </div>
                          )}

                          {/* Date number */}
                          <div className={`w-full h-full flex flex-col items-center justify-center rounded-lg transition-all hover:bg-gray-50 ${
                            dayTasks.length > 0
                              ? overdueTasks.length > 0
                                ? 'bg-red-50 border border-red-200 text-red-700'
                                : highPriorityTasks.length > 0
                                ? 'bg-orange-50 border border-orange-200 text-orange-700'
                                : 'bg-blue-50 border border-blue-200 text-blue-700'
                              : ''
                          }`}>
                            <span className="text-sm font-medium">
                              {format(date, 'd')}
                            </span>
                            
                            {/* Task count */}
                            {dayTasks.length > 0 && (
                              <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                                overdueTasks.length > 0
                                  ? 'bg-red-200 text-red-700'
                                  : highPriorityTasks.length > 0
                                  ? 'bg-orange-200 text-orange-700'
                                  : 'bg-blue-200 text-blue-700'
                              }`}>
                                {dayTasks.length}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  }}
                  styles={{
                    months: { margin: '0' },
                    caption: { display: 'none' }, // Hide default caption
                    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '4px' },
                    head_cell: {
                      padding: '12px 4px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    },
                    cell: {
                      padding: '2px',
                      height: '60px',
                      verticalAlign: 'middle'
                    },
                    day: {
                      margin: '0',
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Selected Date Tasks */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a Date'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'}
                </p>
              </div>
              
              <div className="p-4">
                {selectedDateTasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateTasks.map((task: Task) => {
                      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';

                      return (
                        <div
                          key={task._id || task.id}
                          className={`p-3 rounded-lg border-l-4 transition-all hover:shadow-md ${
                            isOverdue
                              ? 'border-red-500 bg-red-50'
                              : task.priority === 'High'
                              ? 'border-orange-500 bg-orange-50'
                              : task.priority === 'Medium'
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-blue-500 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {task.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  task.priority === 'High'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  task.status === 'Completed'
                                    ? 'bg-green-100 text-green-700'
                                    : task.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              
                              {task.clientName && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Client: {task.clientName}
                                </p>
                              )}
                            </div>
                            
                            {isOverdue && (
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">No tasks scheduled</h4>
                    <p className="text-xs text-gray-500">
                      {selectedDate ? 'No tasks for this date' : 'Select a date to view tasks'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Overdue</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {monthTasks.filter(task => new Date(task.dueDate) < new Date() && task.status !== 'Completed').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">High Priority</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    {monthTasks.filter(task => task.priority === 'High').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {monthTasks.filter(task => task.status === 'Completed').length}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Tasks</span>
                    <span className="text-lg font-bold text-gray-900">
                      {monthTasks.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              
              <div className="p-4 space-y-3">
                <Link
                  to="/tasks"
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                >
                  <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manage Tasks</p>
                    <p className="text-xs text-gray-500">View all tasks in list format</p>
                  </div>
                </Link>
                
                <button className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors group w-full">
                  <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-lg">
                    <Filter className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Filter Tasks</p>
                    <p className="text-xs text-gray-500">Filter by priority or status</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;