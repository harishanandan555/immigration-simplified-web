import { useState, useEffect } from 'react';
import {
  BarChart,
  PieChart,
  LineChart,
  Download,
  Filter,
  Plus,
  Calendar,
  Users,
  FileText,
  Briefcase,
  DollarSign,
  Settings,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../controllers/AuthControllers';
import {
  Report,
  ReportParameters,
  getReports,
  getCaseReportData,
  getClientReportData,
  getDocumentReportData,
  getUserReportData,
  getFinancialReportData,
  generateReport,
  downloadReport,
  CaseReportData,
  ClientReportData,
  DocumentReportData,
  UserReportData,
  FinancialReportData
} from '../../controllers/ReportControllers';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';
import CreateReportModal from '../../components/reports/CreateReportModal';
import './ReportsPage.css';

const ReportsPage = () => {
  const { user, isAttorney, isParalegal, isSuperAdmin } = useAuth();
  
  // State management
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Report data states
  const [caseData, setCaseData] = useState<CaseReportData[]>([]);
  const [clientData, setClientData] = useState<ClientReportData[]>([]);
  const [documentData, setDocumentData] = useState<DocumentReportData[]>([]);
  const [userData, setUserData] = useState<UserReportData[]>([]);
  const [financialData, setFinancialData] = useState<FinancialReportData[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState<ReportParameters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    filters: {
      status: [],
      type: [],
      priority: []
    }
  });
  
  // Chart states
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [groupBy, setGroupBy] = useState<string>('status');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load reports on component mount
  useEffect(() => {
    loadReports();
    // Load initial report data
    loadReportData('case');
    loadReportData('client');
    loadReportData('document');
    loadReportData('user');
  }, [currentPage]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await getReports({
        page: currentPage,
        limit: itemsPerPage
      });
      setReports(response.data.reports);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (report: Report, format: 'PDF' | 'Excel' | 'CSV' | 'HTML') => {
    try {
      const response = await generateReport({
        reportId: report._id,
        parameters: filters,
        format,
        includeCharts: true,
        includeSummary: true
      });
      
      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      } else {
        // Download the generated report
        const blob = await downloadReport(report._id, format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const loadReportData = async (reportType: string) => {
    try {
      switch (reportType) {
        case 'case':
          const caseResponse = await getCaseReportData(filters);
          setCaseData(caseResponse.data);
          break;
        case 'client':
          const clientResponse = await getClientReportData(filters);
          setClientData(clientResponse.data);
          break;
        case 'document':
          const documentResponse = await getDocumentReportData(filters);
          setDocumentData(documentResponse.data);
          break;
        case 'user':
          const userResponse = await getUserReportData(filters);
          setUserData(userResponse.data);
          break;
        case 'financial':
          const financialResponse = await getFinancialReportData(filters);
          setFinancialData(financialResponse.data);
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const getChartData = (data: any[], groupBy: string) => {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value
    }));
  };

  const renderChart = (data: any[], title: string) => {
    if (!data.length) return <div className="text-center text-gray-500 py-8">No data available</div>;

    const chartData = getChartData(data, groupBy);
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <RechartsBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3B82F6" />
              </RechartsBarChart>
            ) : chartType === 'pie' ? (
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            ) : (
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </RechartsLineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDataTable = (data: any[], title: string) => {
    if (!data.length) return <div className="text-center text-gray-500 py-8">No data available</div>;

    const columns = Object.keys(data[0]).filter(key => 
      !['_id', 'id'].includes(key) && typeof data[0][key] !== 'object'
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">Total records: {data.length}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(column => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 10).map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map(column => (
                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof row[column] === 'boolean' 
                        ? row[column] ? 'Yes' : 'No'
                        : row[column]?.toString() || 'N/A'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderQuickStats = () => {
    const stats = [
      { name: 'Total Cases', value: caseData.length, icon: Briefcase, color: 'bg-blue-500' },
      { name: 'Active Clients', value: clientData.length, icon: Users, color: 'bg-green-500' },
      { name: 'Documents', value: documentData.length, icon: FileText, color: 'bg-purple-500' },
      { name: 'Team Members', value: userData.length, icon: Users, color: 'bg-orange-500' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isAttorney && !isParalegal && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-gray-600">
                Generate comprehensive reports and analyze your immigration practice data
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange!, start: e.target.value }
                    }))}
                    className="form-input"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange!, end: e.target.value }
                    }))}
                    className="form-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'bar' | 'pie' | 'line')}
                  className="form-select"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="line">Line Chart</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="form-select"
                >
                  <option value="status">Status</option>
                  <option value="type">Type</option>
                  <option value="priority">Priority</option>
                  <option value="assignedTo">Assigned To</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  loadReportData('case');
                  loadReportData('client');
                  loadReportData('document');
                  loadReportData('user');
                }}
                className="btn btn-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {renderChart(caseData, 'Case Status Distribution')}
          {renderChart(clientData, 'Client Overview')}
        </div>

        {/* Data Tables */}
        <div className="space-y-8">
          {renderDataTable(caseData, 'Case Report Data')}
          {renderDataTable(clientData, 'Client Report Data')}
          {renderDataTable(documentData, 'Document Report Data')}
        </div>

        {/* Reports List */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Saved Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map(report => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-500">{report.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.format}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {report.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowEditModal(true)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleGenerateReport(report, 'PDF')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      <CreateReportModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadReports();
          setCurrentPage(1);
        }}
      />

      {/* Edit Report Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Report</h3>
              <p className="text-sm text-gray-500">Report editing modal coming soon...</p>
              <button
                onClick={() => setShowEditModal(false)}
                className="mt-4 btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
