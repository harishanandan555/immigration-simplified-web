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
import questionnaireAssignmentService from '../services/questionnaireAssignmentService';
import toast from 'react-hot-toast';

interface QuestionnaireAssignment {
  _id: string;
  questionnaireId: {
    _id: string;
    title: string;
    category: string;
    description: string;
  };
  clientId: {
    _id: string;
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
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  responseId?: string;
  isOverdue?: boolean;
}

const QuestionnaireResponses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<QuestionnaireAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<QuestionnaireAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
    
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => 
        assignment.questionnaireId?.title?.toLowerCase().includes(term) ||
        `${assignment.clientId?.firstName} ${assignment.clientId?.lastName}`.toLowerCase().includes(term) ||
        assignment.caseId?.title?.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }
    
    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, statusFilter]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsData = await questionnaireAssignmentService.getAllAssignments();
      setAssignments(assignmentsData);
      setFilteredAssignments(assignmentsData);
      setError(null);
    } catch (err) {
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

  const handleViewResponse = (assignmentId: string) => {
    // Validate assignmentId is a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(assignmentId)) {
      toast.error('Invalid assignment ID format');
      return;
    }
    navigate(`/questionnaires/response/${assignmentId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Questionnaire Responses</h1>
        <button 
          onClick={loadAssignments}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
        >
          Refresh
        </button>
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
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-600">Loading questionnaire responses...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={loadAssignments}
            className="mt-2 text-red-700 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Questionnaire Responses</h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' ? 
              'No responses match your search criteria.' : 
              'There are no questionnaire responses available.'}
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
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.clientId?.firstName} {assignment.clientId?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.clientId?.email}
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
                  <td className="px-6 py-4">
                    <span 
                      className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${getStatusColor(assignment.status, assignment.isOverdue)}`}
                    >
                      {getStatusIcon(assignment.status, assignment.isOverdue)}
                      <span className="ml-1">
                        {assignment.isOverdue ? 'Overdue' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </span>
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
                    <button
                      onClick={() => handleViewResponse(assignment._id)}
                      disabled={assignment.status !== 'completed'}
                      className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 ${
                        assignment.status === 'completed'
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
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
