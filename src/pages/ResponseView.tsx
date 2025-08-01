import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  User,
  Calendar,
  Clock,
  Download,
  Mail,
  MessageSquare,
  File,
  FileText
} from 'lucide-react';
import questionnaireAssignmentService from '../services/questionnaireAssignmentService';
import { useAuth } from '../controllers/AuthControllers';
import toast from 'react-hot-toast';

interface QuestionnaireField {
  id: string;
  type: string;
  label: string;
  question?: string;
  required: boolean;
  options?: string[];
}

interface QuestionnaireResponse {
  _id: string;
  questionnaire_id: string;
  client_id: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  submitted_by: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  responses: Record<string, any>;
  is_complete: boolean;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface QuestionnaireAssignment {
  _id: string;
  questionnaire?: {
    _id: string;
    title: string;
    description?: string;
    category: string;
    fields?: QuestionnaireField[];
    id?: string;
  };
  questionnaireId?: {
    _id: string;
    title: string;
    description?: string;
    category: string;
    fields?: QuestionnaireField[];
  };
  client?: string; // This is just the string ID
  clientId?: string; // This is just the string ID
  clientUserId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  actualClient?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    client_id: string;
  };
  submittedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attorneyInfo?: {
    _id: string;
    attorney_id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  caseId?: {
    _id: string;
    title: string;
    category: string;
    status: string;
  } | string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
  response?: QuestionnaireResponse;
  responseId?: QuestionnaireResponse;
}

const ResponseView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<QuestionnaireAssignment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  useEffect(() => {
    // Only attorneys, paralegals, and superadmins can access this page
    if (user && !['attorney', 'paralegal', 'superadmin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }

    if (!id) {
      navigate('/questionnaires/responses');
      return;
    }

    loadAssignment();
  }, [id, user, navigate]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      
      console.log('Loading assignment response for ID:', id);
      
      // Use the dedicated endpoint to get assignment with response data
      const responseData = await questionnaireAssignmentService.getAssignmentResponse(id as string);
      
      console.log('Raw assignment response:', responseData);
      
      if (!responseData.data) {
        setError('Assignment not found');
        return;
      }
      
      const assignmentData = responseData.data;
      
      console.log('Assignment data:', assignmentData);
      
      setAssignment(assignmentData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading assignment response:', err);
      
      // If the dedicated endpoint fails, try the fallback approach
      try {
        console.log('Trying fallback approach...');
        const fallbackData = await questionnaireAssignmentService.getClientResponses({
          status: 'completed',
          page: 1,
          limit: 100
        });
        
        if (fallbackData.data?.assignments) {
          const assignmentData = fallbackData.data.assignments.find((a: any) => a._id === id);
          if (assignmentData) {
            console.log('Found assignment via fallback:', assignmentData);
            setAssignment(assignmentData);
            setError(null);
            return;
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
      
      setError(err.message || 'Failed to load assignment response. Please try again.');
      toast.error('Error loading assignment response');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to get client information
  const getClientInfo = (assignment: QuestionnaireAssignment) => {
    // Try multiple possible locations for client info
    return assignment.actualClient || 
           assignment.clientUserId || 
           assignment.response?.client_id || 
           assignment.responseId?.client_id;
  };

  const getClientName = (assignment: QuestionnaireAssignment) => {
    const client = getClientInfo(assignment);
    if (client) {
      return `${client.firstName} ${client.lastName}`;
    }
    return 'Unknown Client';
  };

  const getClientEmail = (assignment: QuestionnaireAssignment) => {
    const client = getClientInfo(assignment);
    return client?.email || 'No email available';
  };

  // Helper to get questionnaire info from either structure
  const getQuestionnaireInfo = (assignment: QuestionnaireAssignment) => {
    return assignment.questionnaire || assignment.questionnaireId;
  };

  // Helper to get response info from either structure  
  const getResponseInfo = (assignment: QuestionnaireAssignment) => {
    return assignment.response || assignment.responseId;
  };

  const getCaseInfo = (assignment: QuestionnaireAssignment) => {
    return typeof assignment.caseId === 'object' ? assignment.caseId : null;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendEmail = async () => {
    if (!assignment) return;
    
    try {
      setSendingEmail(true);
      
      // TODO: Implement email sending functionality
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Email sent to ${getClientName(assignment)}`);
    } catch (err) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendMessage = async () => {
    if (!assignment) return;
    
    try {
      setSendingMessage(true);
      
      // TODO: Implement messaging functionality
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Message sent to ${getClientName(assignment)}`);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleClientClick = () => {
    if (!assignment) return;
    
    const responseInfo = getResponseInfo(assignment);
    const questionnaireInfo = getQuestionnaireInfo(assignment);
    const clientInfo = getClientInfo(assignment);
    
    if (!responseInfo?.responses || !questionnaireInfo || !clientInfo) {
      toast.error('Cannot navigate - missing required data');
      return;
    }
    
    // Prepare the data to pass to the Legal Firm Workflow
    const workflowData = {
      clientId: clientInfo._id,
      clientEmail: clientInfo.email,
      clientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
      questionnaireId: questionnaireInfo._id,
      questionnaireTitle: questionnaireInfo.title,
      existingResponses: responseInfo.responses,
      fields: questionnaireInfo.fields || [],
      mode: 'edit', // Indicate this is editing existing responses
      originalAssignmentId: assignment._id
    };
    
    console.log('Navigating to Legal Firm Workflow with data:', workflowData);
    
    // Store the workflow data in sessionStorage for the Legal Firm Workflow to pick up
    sessionStorage.setItem('legalFirmWorkflowData', JSON.stringify(workflowData));
    
    // Navigate to the Legal Firm Workflow page with existing response parameter
    navigate('/legal-firm-workflow?fromQuestionnaireResponses=true');
    
    toast.success(`Navigating to edit ${clientInfo.firstName}'s responses`);
  };

  const handleExportPDF = async () => {
    // TODO: Implement PDF export functionality
    toast.success('Exporting response as PDF...');
  };

  const renderResponseValue = (field: QuestionnaireField, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }
    
    switch (field.type) {
      case 'checkbox':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <ul className="list-disc pl-5">
              {value.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        }
        return <span className="text-gray-400 italic">None selected</span>;
        
      case 'yesno':
        return value === true ? 'Yes' : 'No';
        
      case 'date':
        return new Date(value).toLocaleDateString();
        
      default:
        return String(value);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-2" />
        <span className="text-gray-600">Loading questionnaire response...</span>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
          <div>
            <h2 className="font-medium">Error</h2>
            <p>{error || 'Questionnaire response not found'}</p>
            <button 
              onClick={() => navigate('/questionnaires/responses')}
              className="mt-2 text-red-700 hover:text-red-800 font-medium"
            >
              Back to Responses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get the response and questionnaire info using helper functions
  const responseInfo = getResponseInfo(assignment);
  const questionnaireInfo = getQuestionnaireInfo(assignment);
  const responses = responseInfo?.responses || {};
  const fields = questionnaireInfo?.fields || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/questionnaires/responses')}
            className="text-gray-600 hover:text-gray-800 flex items-center mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Responses
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {questionnaireInfo?.title || 'Questionnaire Response'}
          </h1>
          
          <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center mb-4">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Completed by client on {formatDate(assignment.completedAt)}</span>
          </div>
          
          {responseInfo && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2" />
              <span>Response submitted: {formatDate(responseInfo.createdAt)} | {Object.keys(responses).length} fields completed</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Client Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Client</h3>
            <div 
              className="flex items-center mb-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              onClick={handleClientClick}
              title="Click to edit client responses in Legal Firm Workflow"
            >
              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                  {getClientName(assignment)}
                </p>
                <p className="text-sm text-gray-500">
                  {getClientEmail(assignment)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Click to edit responses →
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <button 
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {sendingEmail ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Email
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={sendingMessage}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {sendingMessage ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Send Message
              </button>
            </div>
          </div>
          
          {/* Case Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Case Details</h3>
            {getCaseInfo(assignment) ? (
              <div>
                <p className="font-medium">{getCaseInfo(assignment)?.title}</p>
                <p className="text-sm text-gray-500 mb-2">Category: {getCaseInfo(assignment)?.category}</p>
                <p className="text-sm text-gray-500">Status: {getCaseInfo(assignment)?.status}</p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const caseInfo = getCaseInfo(assignment);
                      const caseId = caseInfo?._id;
                      if (caseId && /^[0-9a-fA-F]{24}$/.test(caseId)) {
                        navigate(`/cases/${caseId}`);
                      } else {
                        toast.error('Invalid case ID format');
                      }
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <File className="w-4 h-4 mr-2" />
                    View Case File
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No case linked to this questionnaire</p>
            )}
          </div>
          
          {/* Questionnaire Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Questionnaire Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span>Assigned: {formatDate(assignment.assignedAt)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span>Due: {formatDate(assignment.dueDate)}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Completed: {formatDate(assignment.completedAt)}</span>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Response Content */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Client Responses</h3>
            {responseInfo?.notes && (
              <p className="text-sm text-gray-600 mt-1">Notes: {responseInfo.notes}</p>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {Object.keys(responses).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No response data available.
              </div>
            ) : fields.length > 0 ? (
              // If we have field definitions, use them to render with labels
              Object.entries(responses).map(([fieldId, value]) => {
                // Find the corresponding field definition
                const field = fields.find(f => f.id === fieldId);
                
                if (field) {
                  // We have a field definition, use it to render properly
                  return (
                    <div key={fieldId} className="p-6 hover:bg-gray-50">
                      <div className="mb-1 font-medium text-gray-900">
                        {field.label || field.question || fieldId}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="mt-2 text-gray-700">
                        {renderResponseValue(field, value)}
                      </div>
                    </div>
                  );
                } else {
                  // No field definition found, show with generic label
                  return (
                    <div key={fieldId} className="p-6 hover:bg-gray-50">
                      <div className="mb-1 font-medium text-gray-900">
                        Question {fieldId}
                      </div>
                      <div className="mt-2 text-gray-700">
                        {value !== undefined && value !== null && value !== '' ? 
                          String(value) : 
                          <span className="text-gray-400 italic">Not provided</span>
                        }
                      </div>
                    </div>
                  );
                }
              })
            ) : (
              // If we don't have field definitions, just show the raw responses
              Object.entries(responses).map(([fieldId, value]) => (
                <div key={fieldId} className="p-6 hover:bg-gray-50">
                  <div className="mb-1 font-medium text-gray-900">
                    Field {fieldId}
                  </div>
                  <div className="mt-2 text-gray-700">
                    {value !== undefined && value !== null && value !== '' ? 
                      String(value) : 
                      <span className="text-gray-400 italic">Not provided</span>
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate('/questionnaires/responses')}
            className="mr-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Back to List
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Download className="w-4 h-4 inline mr-1" />
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseView;
