import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FileText,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Users,
  FileCheck,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import { mockCases, mockTasks, mockClients } from '../utils/mockData';
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
  const { user, isClient } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
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
        </div>

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