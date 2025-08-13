import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FileText,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Users,
  FileCheck,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import { mockCases, mockTasks, mockClients } from '../utils/mockData';
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
  const { user, isClient, isAttorney, isParalegal, isSuperAdmin } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attorneyAssignments, setAttorneyAssignments] = useState<any[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [loadingAttorneyQuestionnaires, setLoadingAttorneyQuestionnaires] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Workflow states
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    draft: 0
  });

  // Load questionnaire assignments for clients
  useEffect(() => {
    if (isClient) {
      const loadAssignments = async () => {
        try {
          setLoadingQuestionnaires(true);
          const data = await questionnaireAssignmentService.getMyAssignments();
          setAssignments(data);
          
          // Check for pending questionnaires to show notification
          const pendingAssignments = data.filter((a: any) => a.status === 'pending');
          setPendingCount(pendingAssignments.length);
          setShowNotification(pendingAssignments.length > 0);
        } catch (error) {
          console.error('Error loading questionnaire assignments:', error);
        } finally {
          setLoadingQuestionnaires(false);
        }
      };

      loadAssignments();
    }
  }, [isClient]);

  // Load questionnaire assignments for attorneys/superadmins
  useEffect(() => {
    if (isAttorney || isSuperAdmin) {
      const loadAttorneyAssignments = async () => {
        try {
          setLoadingAttorneyQuestionnaires(true);
          const data = await questionnaireAssignmentService.getAllAssignments({ 
            status: 'completed',
            limit: 5 
          });
          setAttorneyAssignments(data);
        } catch (error) {
          console.error('Error loading attorney questionnaire assignments:', error);
        } finally {
          setLoadingAttorneyQuestionnaires(false);
        }
      };

      loadAttorneyAssignments();
    }
  }, [isAttorney, isSuperAdmin]);

  // Load workflows data
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!isAttorney && !isSuperAdmin) return; // Only load for attorneys/admins
      
      try {
        setLoadingWorkflows(true);
        const workflowData = await fetchWorkflowsFromAPI();
        setWorkflows(workflowData);
        
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

  // Fetch workflows from API function
  const fetchWorkflowsFromAPI = async () => {
    try {
      console.log('🔄 Fetching workflows from API...');
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('❌ No authentication token available');
        return [];
      }

      console.log('✅ Authentication token found, making API request...');

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

      if (error.response?.status === 404) {
        console.log('🔍 Server workflows endpoint not found');
      } else if (error.response?.status === 401) {
        console.log('🔐 Authentication failed');
      } else {
        console.log('💥 Other API error:', error.response?.status || 'Unknown');
      }

      return [];
    } finally {
      console.log('🏁 Finished workflow API request');
    }
  };

  // Filter cases if user is a client
  const filteredCases = isClient
    ? mockCases.filter(c => c.clientId === user?.id)
    : mockCases;

  // Filter upcoming tasks
  const upcomingDeadlines = mockTasks
    .filter(task =>
      task.dueDate && new Date(task.dueDate) > new Date() &&
      (!isClient || task.assignedTo === user?.id)
    )
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  // Status counts for charts
  const statusCounts = filteredCases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  const typeData = [
    { name: 'Family', cases: filteredCases.filter(c => c.type === 'Family-Based').length },
    { name: 'Employment', cases: filteredCases.filter(c => c.type === 'Employment-Based').length },
    { name: 'Humanitarian', cases: filteredCases.filter(c => c.type === 'Humanitarian').length },
    { name: 'Naturalization', cases: filteredCases.filter(c => c.type === 'Naturalization').length },
    {
      name: 'Other', cases: filteredCases.filter(c =>
        !['Family-Based', 'Employment-Based', 'Humanitarian', 'Naturalization'].includes(c.type)
      ).length
    }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName} {user?.lastName}</p>
      </div>

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

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Forms</p>
              <p className="text-2xl font-bold mt-1">{
                filteredCases.reduce((sum, c) => sum + (c.pendingForms || 0), 0)
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
        </div>

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
                <p className="text-2xl font-bold mt-1">{mockClients.length}</p>
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
                  filteredCases.reduce((sum, c) => sum + (c.documents?.length || 0), 0)
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
              <ResponsiveContainer width="100%" height="100%">
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
                <ResponsiveContainer width="100%" height="100%">
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
                  {filteredCases.slice(0, 5).map((caseItem) => {
                    const client = mockClients.find(c => c.id === caseItem.clientId);
                    return (
                      <tr key={caseItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/cases/${caseItem.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                            {caseItem.caseNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {caseItem.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${caseItem.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              caseItem.status === 'Document Collection' ? 'bg-yellow-100 text-yellow-800' :
                                caseItem.status === 'Waiting on USCIS' ? 'bg-purple-100 text-purple-800' :
                                  caseItem.status === 'RFE Received' ? 'bg-orange-100 text-orange-800' :
                                    caseItem.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                      caseItem.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {caseItem.status}
                          </span>
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
                upcomingDeadlines.map((task) => {
                  const caseItem = mockCases.find(c => c.id === task.caseId);
                  const daysLeft = Math.ceil(
                    (new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = daysLeft <= 3;

                  return (
                    <div
                      key={task.id}
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
                              {task.title}
                            </p>
                            <p className={`text-xs font-medium ${isUrgent ? 'text-error-600' : 'text-gray-500'
                              }`}>
                              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Case: {caseItem?.caseNumber}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Due: {new Date(task.dueDate!).toLocaleDateString()}
                            </p>
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {task.status}
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
                  assignments.map(assignment => (
                    <div
                      key={assignment.id}
                      className="p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.questionnaire.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <Link
                            to={`/questionnaires/fill/${assignment._id}`}
                            className="inline-flex items-center px-3 py-1 text-xs rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200"
                          >
                            {assignment.status === 'completed' ? 'View Responses' : 'Continue Questionnaire'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm">No questionnaires assigned</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Workflows for Attorneys/Superadmins */}
          {(isAttorney || isSuperAdmin) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Recent Workflows</h2>
                <Link to="/workflows" className="text-sm text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {loadingWorkflows ? (
                  <div className="py-4 text-center text-gray-500">
                    <p className="text-sm">Loading workflows...</p>
                  </div>
                ) : workflows.length > 0 ? (
                  workflows.slice(0, 5).map(workflow => (
                    <div
                      key={workflow._id || workflow.id}
                      className="p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 ${
                          workflow.status === 'in-progress' ? 'text-blue-500' : 
                          workflow.status === 'completed' ? 'text-green-500' : 
                          'text-gray-400'
                        }`}>
                          {workflow.status === 'in-progress' ? <Clock size={18} /> : 
                           workflow.status === 'completed' ? <CheckCircle size={18} /> : 
                           <FileText size={18} />}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {workflow.case?.title || 'Untitled Case'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Step {workflow.currentStep || 1}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Client: {workflow.client?.firstName} {workflow.client?.lastName}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Category: {workflow.case?.category || 'Unknown'}
                            </p>
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                ${workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  workflow.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {workflow.status || 'draft'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end mt-2">
                            <Link
                              to={`/workflow/${workflow._id || workflow.id}`}
                              className="inline-flex items-center px-3 py-1 text-xs rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200"
                            >
                              {workflow.status === 'completed' ? 'View Details' : 'Continue Workflow'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm">No workflows found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Questionnaire Responses for Attorneys/Superadmins */}
          {(isAttorney || isSuperAdmin) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Recent Questionnaire Responses</h2>
                <Link to="/questionnaires/responses" className="text-sm text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {loadingAttorneyQuestionnaires ? (
                  <div className="py-4 text-center text-gray-500">
                    <p className="text-sm">Loading recent responses...</p>
                  </div>
                ) : attorneyAssignments.length > 0 ? (
                  attorneyAssignments.map(assignment => (
                    <div
                      key={assignment._id}
                      className="p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex items-start">
                        <div className="text-green-500 flex-shrink-0">
                          <CheckCircle size={18} />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {assignment.questionnaireId?.title || 'Untitled Questionnaire'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(assignment.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Client: {assignment.clientId?.firstName} {assignment.clientId?.lastName}
                          </p>
                          <div className="flex items-center justify-end mt-2">
                            <Link
                              to={`/questionnaires/response/${assignment._id}`}
                              className="inline-flex items-center px-3 py-1 text-xs rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200"
                            >
                              View Response
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm">No recent questionnaire responses</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/cases/new"
                className="block w-full btn btn-primary text-center"
              >
                Create New Case
              </Link>

              {(isAttorney || isSuperAdmin) && (
                <Link
                  to="/legal-firm-workflow"
                  className="block w-full btn btn-secondary text-center"
                >
                  Start New Workflow
                </Link>
              )}

              <Link
                to="/forms"
                className="block w-full btn btn-secondary text-center"
              >
                Fill Out Form
              </Link>

              <Link
                to="/documents"
                className="block w-full btn btn-outline text-center"
              >
                Upload Document
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;