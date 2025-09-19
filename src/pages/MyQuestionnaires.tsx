import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import { useQuestionnaireAssignments } from '../hooks/useQuestionnaireAssignments';
import { APPCONSTANTS } from '../utils/constants';
import toast from 'react-hot-toast';

const MyQuestionnaires: React.FC = () => {
  const navigate = useNavigate();
  const { user, isClient } = useAuth();
  const { 
    assignments, 
    loading, 
    error, 
    loadAssignments 
  } = useQuestionnaireAssignments('client', localStorage.getItem('token') || undefined);

  useEffect(() => {
    // Redirect if not a client
    if (!isClient && user) {
      navigate('/dashboard');
      return;
    }
    
    // Load assignments when component mounts
    if (isClient && user) {
      loadAssignments();
    }
  }, [isClient, user, navigate, loadAssignments]);

  // Test direct API call to diagnose the issue
  const testDirectAPICall = async () => {
    try {
      const token = localStorage.getItem('token');
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userObj.id || userObj._id || userObj.userId || userObj.user_id;

      console.log('🧪 Testing direct API call with:', {
        userId,
        token: token ? 'present' : 'missing',
        endpoint: `/api/v1/questionnaire-assignments?clientId=${userId}`
      });

      // Test the specific endpoint format you mentioned works
      console.log('🧪 Testing /my-assignments endpoint:');
      const myAssignmentsResponse = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/questionnaire-assignments/my-assignments`, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });

      const myAssignmentsData = await myAssignmentsResponse.json();
      
      console.log('🧪 /my-assignments test results:', {
        status: myAssignmentsResponse.status,
        ok: myAssignmentsResponse.ok,
        data: myAssignmentsData,
        assignmentCount: myAssignmentsData.assignments?.length || myAssignmentsData.data?.length || 0
      });

      // Also test the clientId approach for comparison
      const response = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/questionnaire-assignments?clientId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      console.log('🧪 Direct clientId query test results:', {
        status: response.status,
        ok: response.ok,
        data: data,
        assignmentCount: data.assignments?.length || data.data?.length || 0
      });

      toast.success(`API tests complete - check console for details`);
    } catch (error) {
      console.error('🧪 API tests failed:', error);
      toast.error('API tests failed - check console');
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

  const handleStartQuestionnaire = (assignmentId: string) => {
    // Validate assignmentId is a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(assignmentId)) {
      toast.error('Invalid assignment ID format');
      return;
    }
    navigate(`/questionnaires/fill/${assignmentId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Questionnaires</h1>
        <div className="flex gap-2">
         
          <button 
            onClick={loadAssignments}
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-600">Loading your questionnaires...</span>
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
      ) : assignments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Questionnaires Assigned</h2>
          <p className="text-gray-600 mb-4">
            You don't have any questionnaires assigned to you at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map(assignment => (
            <div 
              key={assignment._id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {(assignment as any).questionnaireDetails?.title || 
                   'Untitled Questionnaire'}
                </h2>
                <span 
                  className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusColor(assignment.status, assignment.isOverdue)}`}
                >
                  {getStatusIcon(assignment.status, assignment.isOverdue)}
                  <span className="ml-1">
                    {assignment.isOverdue ? 'Overdue' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                  </span>
                </span>
              </div>
              
              {(assignment as any).caseId && (
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Related Case:</span> {(assignment as any).caseId.title}
                </div>
              )}
              
              {(assignment as any).wasOrphaned && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="text-sm text-orange-800 font-medium">Assignment Reset</span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    This questionnaire was previously completed but the response data was removed. You can now resubmit it.
                  </p>
                </div>
              )}
              
              <div className="text-sm text-gray-600 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Assigned: {formatDate(assignment.assignedAt)}</span>
              </div>
              
              {assignment.dueDate && (
                <div className={`text-sm mb-4 flex items-center ${assignment.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Due: {formatDate(assignment.dueDate)}</span>
                </div>
              )}
              
              {assignment.completedAt && (
                <div className="text-sm text-green-600 mb-4 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Completed: {formatDate(assignment.completedAt)}</span>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  onClick={() => handleStartQuestionnaire(assignment._id)}
                  disabled={assignment.status === 'completed'}
                  className={`flex items-center justify-center px-4 py-2 rounded-md w-full font-medium ${
                    assignment.status === 'completed'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {assignment.status === 'completed' ? (
                    'Completed'
                  ) : assignment.status === 'in-progress' ? (
                    'Continue Questionnaire'
                  ) : (
                    <>
                      Start Questionnaire
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuestionnaires;
