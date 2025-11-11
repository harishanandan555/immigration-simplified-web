import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

interface EnhancedResponseData extends Record<string, any> {
  // No special metadata structure needed - field titles are saved directly as keys
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
  responses: EnhancedResponseData;
  is_complete: boolean;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface NavigationState {
  assignmentData?: QuestionnaireAssignment;
  responseData?: any;
  fromQuestionnaireResponses?: boolean;
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
  formCaseIdGenerated?: string; // Generated case ID from form processing
  formNumber?: string; // Form number information
  clientEmail?: string; // Client email from assignment
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
  response?: QuestionnaireResponse | any; // Allow any structure for response
  responseId?: QuestionnaireResponse;
}

const ResponseView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
  }, [id, user, navigate, location.state]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      
      // Check if assignment data was passed from QuestionnaireResponses page
      const navigationState = location.state as NavigationState | null;
      
      if (navigationState?.assignmentData && navigationState?.fromQuestionnaireResponses) {
        
        // Normalize the assignment data to ensure proper mapping
        const normalizedAssignment = normalizeAssignmentData(
          navigationState.assignmentData, 
          navigationState.responseData
        );
        
        setAssignment(normalizedAssignment);
        setError(null);
        return;
      }
      
      // Use the dedicated endpoint to get assignment with response data
      const responseData = await questionnaireAssignmentService.getAssignmentResponse(id as string);
      
      
      if (!responseData.data) {
        setError('Assignment not found');
        return;
      }
      
      const assignmentData = responseData.data;
      setAssignment(assignmentData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading assignment response:', err);
      
      // If the dedicated endpoint fails, try the fallback approach
      try {
        const fallbackData = await questionnaireAssignmentService.getClientResponses({
          status: 'completed',
          page: 1,
          limit: 100
        });
        
        if (fallbackData.data?.assignments) {
          const assignmentData = fallbackData.data.assignments.find((a: any) => a._id === id);
          if (assignmentData) {
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
    if (client && client.firstName && client.lastName) {
      // Check for undefined values
      const firstName = client.firstName === 'undefined' ? '' : client.firstName;
      const lastName = client.lastName === 'undefined' ? '' : client.lastName;
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName || lastName) {
        return firstName || lastName;
      }
    }
    
    // Fallback to client ID if available
    if (client && client._id) {
      return `Client ID: ${client._id}`;
    }
    
    return 'Client Name Not Available';
  };

  const getClientEmail = (assignment: QuestionnaireAssignment) => {
    // Try assignment.clientEmail first, then fallback to client object email
    return assignment.clientEmail || 
           getClientInfo(assignment)?.email || 
           'No email available';
  };

  // Helper to get questionnaire info from either structure
  const getQuestionnaireInfo = (assignment: QuestionnaireAssignment) => {
    return assignment.questionnaire || assignment.questionnaireId;
  };

  // Helper to get response info from either structure  
  const getResponseInfo = (assignment: QuestionnaireAssignment) => {
    // Try different response sources in order of preference
    const responseInfo = assignment.response || assignment.responseId;
    
    return responseInfo;
  };

  const getCaseInfo = (assignment: QuestionnaireAssignment) => {
    // First check for traditional case linking
    if (typeof assignment.caseId === 'object' && assignment.caseId) {
      return assignment.caseId;
    }
    
    // Then check for workflow case data (using type assertion for workflow-enhanced assignments)
    const workflowAssignment = assignment as any;
    if (workflowAssignment.workflowCase) {
      return {
        _id: workflowAssignment.workflowCase._id || workflowAssignment.workflowCase.id || '',
        title: workflowAssignment.workflowCase.title || '',
        category: workflowAssignment.workflowCase.category || '',
        status: workflowAssignment.workflowCase.status || '',
        caseNumber: workflowAssignment.workflowCase.caseNumber || '',
        subcategory: workflowAssignment.workflowCase.subcategory || '',
        priority: workflowAssignment.workflowCase.priority || '',
        description: workflowAssignment.workflowCase.description || ''
      };
    }
    
    return null;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString || dateString === 'undefined' || dateString === 'null') {
      return 'Not available';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Not available';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Not available';
    }
  };

  // Function to normalize assignment data from different sources
  const normalizeAssignmentData = (assignmentData: any, responseData?: any) => {
    console.log('🔍 DEBUG: normalizeAssignmentData input:', {
      assignmentData,
      hasWorkflowFormCaseIds: !!assignmentData.workflowFormCaseIds,
      workflowFormCaseIds: assignmentData.workflowFormCaseIds,
      formCaseIdGenerated: assignmentData.formCaseIdGenerated,
      enhancedWithWorkflow: assignmentData.enhancedWithWorkflow,
      existingFormNumber: assignmentData.formNumber
    });
    
    // Extract form number from multiple workflow sources
    // ALWAYS prioritize workflow data over existing formNumber when enhanced with workflow
    let formNumber = null;
    
    // First try to get form number from workflowQuestionnaireAssignment
    if (assignmentData.workflowQuestionnaireAssignment && assignmentData.workflowQuestionnaireAssignment.formNumber) {
      formNumber = assignmentData.workflowQuestionnaireAssignment.formNumber;
      console.log('🔍 DEBUG: Found form number in workflowQuestionnaireAssignment:', {
        formNumber,
        source: 'workflowQuestionnaireAssignment'
      });
    }
    
    // Then try workflowFormCaseIds mapping if not found
    if (!formNumber && assignmentData.workflowFormCaseIds && assignmentData.formCaseIdGenerated && assignmentData.enhancedWithWorkflow) {
      // Find the form number that maps to the current formCaseIdGenerated
      formNumber = Object.keys(assignmentData.workflowFormCaseIds).find(key => 
        assignmentData.workflowFormCaseIds[key] === assignmentData.formCaseIdGenerated
      );
      console.log('🔍 DEBUG: Extracted form number from workflowFormCaseIds:', {
        formCaseIdGenerated: assignmentData.formCaseIdGenerated,
        workflowFormCaseIds: assignmentData.workflowFormCaseIds,
        extractedFormNumber: formNumber,
        source: 'workflowFormCaseIds'
      });
    }
    
    // Only fallback to existing formNumber if no workflow form number was found
    if (!formNumber) {
      formNumber = assignmentData.formNumber;
      console.log('🔍 DEBUG: Using fallback form number:', {
        formNumber,
        source: 'existing'
      });
    }
    
    // Create a normalized assignment object that maps all possible data sources
    const normalizedAssignment: QuestionnaireAssignment = {
      _id: assignmentData._id,
      
      // Map questionnaire information
      questionnaire: assignmentData.questionnaire || assignmentData.questionnaireId,
      questionnaireId: assignmentData.questionnaireId || assignmentData.questionnaire,
      
      // Map client information with multiple fallbacks
      client: assignmentData.client || assignmentData.clientId,
      clientId: assignmentData.clientId || assignmentData.client,
      clientUserId: assignmentData.clientUserId,
      actualClient: assignmentData.actualClient,
      clientEmail: assignmentData.clientEmail,
      
      // Map response information - handle different response data structures
      // Priority: responseData from API > assignmentData.response > assignmentData.responseId
      response: responseData || assignmentData.response || assignmentData.responseId,
      responseId: assignmentData.responseId || assignmentData.response || responseData,
      
      // Map other assignment details
      submittedBy: assignmentData.submittedBy,
      assignedBy: assignmentData.assignedBy,
      attorneyInfo: assignmentData.attorneyInfo,
      caseId: assignmentData.caseId,
      formCaseIdGenerated: assignmentData.formCaseIdGenerated,
      formNumber: formNumber, // Use the extracted form number
      
      // Map status and dates with proper validation
      status: (assignmentData.status && typeof assignmentData.status === 'string' && assignmentData.status.trim() !== '') 
        ? assignmentData.status 
        : 'pending',
      assignedAt: assignmentData.assignedAt,
      completedAt: assignmentData.completedAt,
      dueDate: assignmentData.dueDate,
      notes: assignmentData.notes
    };

    console.log('🔍 DEBUG: normalizeAssignmentData output:', {
      formNumber: normalizedAssignment.formNumber,
      formCaseIdGenerated: normalizedAssignment.formCaseIdGenerated,
      source: assignmentData.enhancedWithWorkflow && assignmentData.workflowFormCaseIds ? 'workflow' : 'fallback'
    });

    return normalizedAssignment;
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
  
  // Extract responses with multiple fallback strategies
  let responses: EnhancedResponseData = {};
  
  // From the console log, we can see the structure is assignment.response.responses
  if ((assignment as any)?.response?.responses) {
    responses = (assignment as any).response.responses;
  } else if (assignment?.responseId?.responses) {
    responses = assignment.responseId.responses;
  } else if (responseInfo?.responses) {
    responses = responseInfo.responses;
  } else if (responseInfo && typeof responseInfo === 'object' && !responseInfo.responses) {
    // If responseInfo is the direct responses object (without .responses property)
    responses = responseInfo;
  }
  
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
          
          {/* Status Banner */}
          {assignment.completedAt ? (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center mb-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Completed by client on {formatDate(assignment.completedAt)}</span>
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg flex items-center mb-4">
              <Clock className="w-5 h-5 mr-2" />
              <span>Status: {assignment.status && typeof assignment.status === 'string' && assignment.status.length > 0 ? (assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)) : 'Unknown'}</span>
              {assignment.dueDate && (
                <span className="ml-2">• Due: {formatDate(assignment.dueDate)}</span>
              )}
            </div>
          )}
          
          {/* Response Info */}
          {responseInfo ? (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2" />
              <span>
                Response submitted: {responseInfo.createdAt ? formatDate(responseInfo.createdAt) : 'Not available'} | {Object.keys(responses).length} fields completed
              </span>
            </div>
          ) : (
            <div className="bg-gray-50 text-gray-700 p-3 rounded-lg flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2" />
              <span>Response submitted: Not available | {Object.keys(responses).length} fields completed</span>
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
                {/* <p className="text-xs text-blue-600 mt-1">
                  Click to edit responses →
                </p> */}
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
            {assignment.formCaseIdGenerated ? (
              <div>
                <p className="font-medium text-lg text-blue-900">{assignment.formCaseIdGenerated}</p>
                <p className="text-sm text-gray-500 mb-2">Generated Case ID</p>
                {assignment.formNumber && (
                  <p className="text-sm text-gray-600 mb-2">Form Number: {assignment.formNumber}</p>
                )}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      // Navigate to case details or show more case info
                      if (assignment.formCaseIdGenerated) {
                        toast.success(`Case ID: ${assignment.formCaseIdGenerated} copied to clipboard`);
                        navigator.clipboard.writeText(assignment.formCaseIdGenerated);
                      }
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <File className="w-4 h-4 mr-2" />
                    Copy Case ID
                  </button>
                </div>
              </div>
            ) : getCaseInfo(assignment) && getCaseInfo(assignment)?.title !== "No case linked" ? (
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
              <div className="text-center py-4">
                <File className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 italic">No case linked to this questionnaire</p>
                <p className="text-xs text-gray-400 mt-1">Case will be created when forms are processed</p>
              </div>
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
              {assignment.completedAt ? (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Completed: {formatDate(assignment.completedAt)}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                  <span>Status: {assignment.status && typeof assignment.status === 'string' && assignment.status.length > 0 ? (assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)) : 'Unknown'}</span>
                </div>
              )}
              {(assignment.assignedBy || assignment.attorneyInfo) ? (
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Assigned by: {
                    assignment.assignedBy && assignment.assignedBy.firstName && assignment.assignedBy.lastName ? 
                      `${assignment.assignedBy.firstName} ${assignment.assignedBy.lastName}` :
                      assignment.attorneyInfo && assignment.attorneyInfo.firstName && assignment.attorneyInfo.lastName ? 
                        `${assignment.attorneyInfo.firstName} ${assignment.attorneyInfo.lastName}` :
                        'Not available'
                  }</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Assigned by: Not available</span>
                </div>
              )}
              {assignment.formNumber && (
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Form Number: {assignment.formNumber}</span>
                </div>
              )}
              {assignment.notes && (
                <div className="mt-2 p-2 bg-yellow-50 rounded border">
                  <p className="text-xs text-gray-600 font-medium">Assignment Notes:</p>
                  <p className="text-sm text-gray-700 mt-1">{assignment.notes}</p>
                </div>
              )}
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Client Responses</h3>
              {Object.keys(responses).length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {(() => {
                    // Count unique fields (prioritize field titles over field IDs)
                    const titleKeys = Object.keys(responses).filter(key => !key.startsWith('field_'));
                    const fieldIdKeys = Object.keys(responses).filter(key => key.startsWith('field_'));
                    
                    // If we have field titles, count those; otherwise count field IDs
                    const uniqueFieldCount = titleKeys.length > 0 ? titleKeys.length : fieldIdKeys.length;
                    return `${uniqueFieldCount} fields completed`;
                  })()}
                </span>
              )}
            </div>
            {responseInfo?.notes && (
              <p className="text-sm text-gray-600 mt-1">Notes: {responseInfo.notes}</p>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {Object.keys(responses).length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">No Response Data Available</h4>
                <p className="text-gray-500 mb-4">
                  This questionnaire assignment doesn't have any response data yet.
                </p>
                {assignment.status !== 'completed' && (
                  <p className="text-sm text-gray-400">
                    Response data will appear here once the client completes the questionnaire.
                  </p>
                )}
                {assignment.status === 'completed' && !responseInfo && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                    <p className="text-yellow-700 text-sm">
                      This assignment is marked as completed but response data is missing.
                    </p>
                  </div>
                )}
              </div>
            ) : fields.length > 0 ? (
              // If we have field definitions, prioritize field titles over field IDs
              (() => {
                const displayedKeys = new Set();
                const responseEntries = Object.entries(responses);
                
                // First, show entries that are field titles (readable names)
                const titleEntries = responseEntries.filter(([key]) => !key.startsWith('field_'));
                // Then, show field ID entries that don't have corresponding titles
                const fieldIdEntries = responseEntries.filter(([key]) => key.startsWith('field_'));
                
                const entriesToDisplay: Array<[string, any, 'title' | 'fieldId']> = [];
                
                // Add title entries first
                titleEntries.forEach(([key, value]) => {
                  entriesToDisplay.push([key, value, 'title']);
                  displayedKeys.add(key);
                });
                
                // Add field ID entries only if there's no corresponding title
                fieldIdEntries.forEach(([fieldKey, value]) => {
                  const field = fields.find(f => f.id === fieldKey);
                  const fieldTitle = field?.label || field?.question;
                  
                  // Only show this field ID if we don't already have its title displayed
                  if (!fieldTitle || !displayedKeys.has(fieldTitle)) {
                    entriesToDisplay.push([fieldKey, value, 'fieldId']);
                  }
                });
                
                return entriesToDisplay.map(([key, value, type]) => {
                  if (type === 'title') {
                    // This is a field title, display it with blue styling
                    return (
                      <div key={key} className="p-6 hover:bg-gray-50">
                        <div className="mb-1 font-medium text-blue-700">
                          {key}
                        </div>
                        <div className="mt-2 text-gray-700">
                          {value !== undefined && value !== null && value !== '' ? 
                            String(value) : 
                            <span className="text-gray-400 italic">Not provided</span>
                          }
                        </div>
                      </div>
                    );
                  } else {
                    // This is a field ID, display it normally
                    const field = fields.find(f => f.id === key);
                    return (
                      <div key={key} className="p-6 hover:bg-gray-50">
                        <div className="mb-1 font-medium text-gray-900">
                          {field?.label || field?.question || key}
                          {field?.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="mt-2 text-gray-700">
                          {field ? renderResponseValue(field, value) : (
                            value !== undefined && value !== null && value !== '' ? 
                              String(value) : 
                              <span className="text-gray-400 italic">Not provided</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                });
              })()
            ) : (
              // If we don't have field definitions, prioritize field titles over field IDs
              (() => {
                const responseEntries = Object.entries(responses);
                const titleEntries = responseEntries.filter(([key]) => !key.startsWith('field_'));
                const fieldIdEntries = responseEntries.filter(([key]) => key.startsWith('field_'));
                
                // If we have field titles, show only those; otherwise show field IDs
                const entriesToShow = titleEntries.length > 0 ? titleEntries : fieldIdEntries;
                
                return entriesToShow.map(([fieldKey, value]) => (
                  <div key={fieldKey} className="p-6 hover:bg-gray-50">
                    <div className="mb-1 font-medium text-gray-900">
                      {fieldKey.startsWith('field_') ? `Field ${fieldKey}` : fieldKey}
                    </div>
                    <div className="mt-2 text-gray-700">
                      {value !== undefined && value !== null && value !== '' ? 
                        String(value) : 
                        <span className="text-gray-400 italic">Not provided</span>
                      }
                    </div>
                  </div>
                ));
              })()
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
