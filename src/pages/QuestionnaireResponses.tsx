import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  Eye,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  User
} from 'lucide-react';

import { useAuth } from '../controllers/AuthControllers';
import {
  getClientResponses,
  getWorkflowsFromAPI,
  getAssignmentResponse
} from '../controllers/QuestionnaireResponseControllers';
import toast from 'react-hot-toast';

interface QuestionnaireAssignment {
  _id: string;
  questionnaireId: string | { _id: string; id: string; title: string;[key: string]: any }; // Can be string ID or questionnaire object
  questionnaireDetails?: {
    title: string;
    category: string;
    description: string;
    fields?: any[];
  };
  clientId: string; // This is just a string ID, not an object
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
  };
  formCaseIdGenerated?: string; // Generated case ID from form processing
  responseId?: {
    _id: string;
    responses: Record<string, any>;
    submittedAt: string;
    notes?: string;
  };
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  isOverdue?: boolean;

  // Enhanced workflow data fields
  workflowCase?: {
    id?: string;
    _id?: string;
    title?: string;
    caseNumber?: string;
    category?: string;
    subcategory?: string;
    status?: string;
    priority?: string;
    visaType?: string;
    description?: string;
  };
  workflowFormCaseIds?: Record<string, string>;
  workflowQuestionnaireAssignment?: {
    assignment_id?: string;
    attorney_id?: string;
    formCaseIdGenerated?: string;
    formNumber?: string;
    is_complete?: boolean;
    notes?: string;
    responses?: Record<string, any>;
    questionnaire_title?: string;
    questionnaire_id?: string;
    response_id?: string;
    submitted_at?: string;
    reuseMetadata?: {
      isReused: boolean;
      originalAssignmentId?: string;
      originalResponseId?: string;
      reuseDate?: string;
      originalCompletedAt?: string;
    };
  };
  workflowSelectedForms?: string[];
  workflowId?: string;
  workflowStatus?: string;
  workflowIndex?: number;
  workflowTotal?: number;
  enhancedWithWorkflow?: boolean;
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
  const [, setLoadingWorkflows] = useState<boolean>(false);

  // Function to fetch workflows from API for auto-fill
  const fetchWorkflowsFromAPI = async () => {
    try {
      setLoadingWorkflows(true);
      const token = localStorage.getItem('token');

      // Check token availability
      if (!token) {
        return [];
      }

      // Fetch ALL workflows regardless of status to get complete data
      const workflows = await getWorkflowsFromAPI({
        // Remove status filter to get ALL workflows
        page: 1,
        limit: 100 // Increase limit to get more workflows
      });

      console.log('📊  ALL workflows ', workflows)

      return workflows;

    } catch (error: any) {
      console.error('Error fetching workflows:', error);
      return [];
    } finally {
      setLoadingWorkflows(false);
    }
  };

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
      filtered = filtered.filter(assignment => {
        // Safely get questionnaire title
        const questionnaireTitle = assignment.questionnaireDetails?.title?.toLowerCase() || '';

        // Safely get client name
        let clientName = '';
        if (assignment.actualClient?.firstName && assignment.actualClient?.lastName) {
          clientName = `${assignment.actualClient.firstName} ${assignment.actualClient.lastName}`.toLowerCase();
        } else if (assignment.clientUserId?.firstName && assignment.clientUserId?.lastName) {
          clientName = `${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}`.toLowerCase();
        }

        // Safely get case title and form case ID (original data)
        const caseTitle = assignment.caseId?.title?.toLowerCase() || '';
        const formCaseId = assignment.formCaseIdGenerated?.toLowerCase() || '';

        // Enhanced search: also check workflow case data
        const workflowCaseTitle = assignment.workflowCase?.title?.toLowerCase() || '';
        const workflowCaseNumber = assignment.workflowCase?.caseNumber?.toLowerCase() || '';
        const workflowFormCaseId = assignment.workflowQuestionnaireAssignment?.formCaseIdGenerated?.toLowerCase() || '';

        // Check workflow form case IDs
        const workflowFormCaseIdValues = assignment.workflowFormCaseIds ?
          Object.values(assignment.workflowFormCaseIds).join(' ').toLowerCase() : '';

        // Check workflow selected forms
        const workflowSelectedForms = assignment.workflowSelectedForms ?
          assignment.workflowSelectedForms.join(' ').toLowerCase() : '';

        const matches = questionnaireTitle.includes(term) ||
          clientName.includes(term) ||
          caseTitle.includes(term) ||
          formCaseId.includes(term) ||
          // Enhanced workflow data search
          workflowCaseTitle.includes(term) ||
          workflowCaseNumber.includes(term) ||
          workflowFormCaseId.includes(term) ||
          workflowFormCaseIdValues.includes(term) ||
          workflowSelectedForms.includes(term);

        return matches;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        const matches = assignment.status === statusFilter;
        return matches;
      });
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, statusFilter]);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      // Get all questionnaire assignments, not just completed ones
      // This will help us see assignments that are marked as completed but have missing response data
      const responseData = await getClientResponses({
        // Remove status filter to get all assignments
        page: 1,
        limit: 50 // Get more results for better demo
      });

      const assignmentsData = responseData.data.assignments || [];

      // Filter to only show completed assignments in the UI
      // This way we can see completed assignments even if they have missing response data
      const completedAssignments = assignmentsData.filter((assignment: any) =>
        assignment.status === 'completed'
      );

      setAssignments(completedAssignments);
      setError(null);

      console.log('📋 Loaded questionnaire responses:', {
        totalAssignments: assignmentsData.length,
        completedAssignments: completedAssignments.length,
        enhancedWithWorkflow: completedAssignments.filter((a: any) => a.enhancedWithWorkflow).length
      });

      // Debug: Check for specific client mentioned in issue
      const specificClientAssignments = assignmentsData.filter((assignment: any) => {
        const clientId = assignment.clientId || assignment.actualClient?._id || assignment.clientUserId?._id;
        const clientEmail = assignment.actualClient?.email || assignment.clientUserId?.email;
        return clientId === '68c1505149321ce701f936ae' || 
               (clientEmail && clientEmail.toLowerCase().includes('anjali_b@bullbox.in'));
      });

      if (specificClientAssignments.length > 0) {
        console.log('🎯 DEBUG: Found assignments for specific client:', {
          clientId: '68c1505149321ce701f936ae',
          clientEmail: 'anjali_b@bullbox.in',
          totalAssignments: specificClientAssignments.length,
          assignments: specificClientAssignments.map((a: any) => ({
            id: a._id,
            status: a.status,
            clientId: a.clientId,
            actualClientId: a.actualClient?._id,
            clientUserId: a.clientUserId?._id,
            clientEmail: a.actualClient?.email || a.clientUserId?.email,
            hasResponseId: !!a.responseId,
            hasResponses: !!a.responseId?.responses,
            responseCount: a.responseId?.responses ? Object.keys(a.responseId.responses).length : 0,
            questionnaireTitle: a.questionnaireDetails?.title
          }))
        });
      } else {
        console.log('⚠️ DEBUG: No assignments found for specific client:', {
          clientId: '68c1505149321ce701f936ae',
          clientEmail: 'anjali_b@bullbox.in',
          totalAssignmentsChecked: assignmentsData.length
        });
        
        // Check if there are any assignments for this client with different status
        const allClientAssignments = assignmentsData.filter((assignment: any) => {
          const clientId = assignment.clientId || assignment.actualClient?._id || assignment.clientUserId?._id;
          const clientEmail = assignment.actualClient?.email || assignment.clientUserId?.email;
          return clientId === '68c1505149321ce701f936ae' || 
                 (clientEmail && clientEmail.toLowerCase().includes('anjali_b@bullbox.in'));
        });
        
        if (allClientAssignments.length > 0) {
          console.log('🔍 DEBUG: Found assignments for specific client with different status:', {
            clientId: '68c1505149321ce701f936ae',
            clientEmail: 'anjali_b@bullbox.in',
            totalAssignments: allClientAssignments.length,
            assignments: allClientAssignments.map((a: any) => ({
              id: a._id,
              status: a.status,
              clientId: a.clientId,
              actualClientId: a.actualClient?._id,
              clientUserId: a.clientUserId?._id,
              clientEmail: a.actualClient?.email || a.clientUserId?.email,
              hasResponseId: !!a.responseId,
              hasResponses: !!a.responseId?.responses,
              responseCount: a.responseId?.responses ? Object.keys(a.responseId.responses).length : 0,
              questionnaireTitle: a.questionnaireDetails?.title
            }))
          });
        }
      }

      // Debug: Log detailed information about enhanced assignments
      completedAssignments.forEach((assignment: any, index: number) => {
        if (assignment.enhancedWithWorkflow) {
          console.log(`🔍 Enhanced Assignment ${index + 1}:`, {
            assignmentId: assignment._id,
            clientEmail: assignment.actualClient?.email,
            // Case ID debugging
            formCaseIdGenerated: assignment.formCaseIdGenerated,
            workflowFormCaseIdGenerated: assignment.workflowQuestionnaireAssignment?.formCaseIdGenerated,
            workflowFormCaseIds: assignment.workflowFormCaseIds,
            workflowCaseNumber: assignment.workflowCase?.caseNumber,
            // Workflow details
            hasWorkflowCase: !!assignment.workflowCase,
            workflowCaseDetails: assignment.workflowCase,
            hasWorkflowFormCaseIds: !!assignment.workflowFormCaseIds,
            hasWorkflowQuestionnaireAssignment: !!assignment.workflowQuestionnaireAssignment,
            workflowQuestionnaireAssignment: assignment.workflowQuestionnaireAssignment,
            hasWorkflowSelectedForms: !!assignment.workflowSelectedForms,
            workflowSelectedForms: assignment.workflowSelectedForms
          });
        }
      });
    } catch (err) {
      setError('Failed to load questionnaire responses. Please try again.');
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

  // Function to sanitize complex MongoDB objects and remove prototype chains
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    // Handle dates
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle primitive types
    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle objects - create clean plain object
    const cleanObj: any = {};

    // Only include enumerable own properties, skip prototype and MongoDB metadata
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !key.startsWith('$__') && !key.startsWith('_') && key !== '__v') {
        const value = obj[key];

        // Skip functions and complex objects that could cause issues
        if (typeof value === 'function') continue;

        // Recursively sanitize nested objects
        try {
          cleanObj[key] = sanitizeObject(value);
        } catch (error) {
          // Skip properties that can't be sanitized
          console.warn(`Skipping property ${key} due to sanitization error:`, error);
        }
      }
    }

    return cleanObj;
  };

  const handleClientClick = async (assignment: QuestionnaireAssignment) => {
    // Prepare the data to pass to the Legal Firm Workflow
    const clientInfo = assignment.actualClient || assignment.clientUserId;
    const questionnaireInfo = assignment.questionnaireDetails;
    const responseInfo = assignment.responseId;

    

    if (!clientInfo) {
      toast.error('Cannot navigate - missing client information');
    
      return;
    }

    // For questionnaire info, we can use either questionnaireDetails or fallback to basic questionnaire data
    const questionnaire = questionnaireInfo || {
      title: 'Questionnaire',
      category: 'general',
      description: 'Questionnaire response',
      fields: []
    };


    setLoadingWorkflows(true);

    let matchingWorkflow = null; // Declare at function scope

    try {
      // Fetch workflows from API to get complete workflow data
      const apiWorkflows = await fetchWorkflowsFromAPI();

      console.log('Fetched workflows for auto-fill:', apiWorkflows);
      if (apiWorkflows && apiWorkflows.length > 0) {
        // Find matching workflow - PRIORITY 1: Match by formCaseIdGenerated (specific form case)
        const targetFormCaseId = assignment.formCaseIdGenerated;
        const clientEmail = clientInfo.email?.toLowerCase();
        const clientName = `${clientInfo.firstName} ${clientInfo.lastName}`.toLowerCase();

        let allMatchingWorkflows = [];

        // First, try to find workflows that contain this specific formCaseIdGenerated
        if (targetFormCaseId) {
          allMatchingWorkflows = apiWorkflows.filter((workflow: any) => {
            // Check multiple locations for formCaseIdGenerated match
            const workflowFormCaseId = workflow.questionnaireAssignment?.formCaseIdGenerated;
            const workflowFormCaseIds = workflow.formCaseIds || {};
            
            // Check if formCaseIdGenerated matches
            if (workflowFormCaseId === targetFormCaseId) {
              return true;
            }
            
            // Check if any form case ID in formCaseIds matches
            if (Object.values(workflowFormCaseIds).includes(targetFormCaseId)) {
              return true;
            }
            
            return false;
          });

          console.log('🎯 Searching for workflow with formCaseIdGenerated:', {
            targetFormCaseId,
            foundWorkflows: allMatchingWorkflows.length,
            workflowDetails: allMatchingWorkflows.map((w: any) => ({
              id: w.id || w._id,
              formCaseId: w.questionnaireAssignment?.formCaseIdGenerated,
              formCaseIds: w.formCaseIds,
              status: w.status
            }))
          });
        }

        // If no specific form case match, fall back to assignment ID matching
        if (allMatchingWorkflows.length === 0 && assignment._id) {
          allMatchingWorkflows = apiWorkflows.filter((workflow: any) => {
            // Check if workflow contains this specific assignment
            const assignmentId = assignment._id.split('_workflow_')[0]; // Remove workflow suffix if present
            return workflow.questionnaireAssignment?.assignment_id === assignmentId ||
                   workflow.questionnaireAssignment?.id === assignmentId ||
                   workflow._id === assignmentId;
          });

          console.log('🔍 Searching by assignment ID:', {
            assignmentId: assignment._id,
            foundWorkflows: allMatchingWorkflows.length
          });
        }

        // If still no match, fall back to client matching with more specific criteria
        if (allMatchingWorkflows.length === 0) {
          allMatchingWorkflows = apiWorkflows.filter((workflow: any) => {
            const workflowEmail = workflow.client?.email?.toLowerCase();
            const workflowClientName = `${workflow.client?.firstName || ''} ${workflow.client?.lastName || ''}`.toLowerCase();

            return workflowEmail === clientEmail || workflowClientName === clientName;
          });

          console.log('📧 Falling back to client matching since no specific match found');
          
          // If multiple workflows found for client, try to pick the most relevant one
          if (allMatchingWorkflows.length > 1) {
            // Prefer workflows that have the same questionnaire assignment
            const preferredWorkflows = allMatchingWorkflows.filter((workflow: any) => {
              const workflowQuestionnaireId = workflow.questionnaireAssignment?.questionnaire_id || 
                                            workflow.questionnaireAssignment?.questionnaireId;
              const assignmentQuestionnaireId = typeof assignment.questionnaireId === 'string' 
                ? assignment.questionnaireId 
                : assignment.questionnaireId?._id || assignment.questionnaireId?.id;
              
              return workflowQuestionnaireId === assignmentQuestionnaireId;
            });
            
            if (preferredWorkflows.length > 0) {
              allMatchingWorkflows = preferredWorkflows;
              console.log('✅ Found preferred workflows with matching questionnaire');
            }
          }
        }

        console.log('🔍 Final workflow matching results:', {
          targetFormCaseId,
          clientEmail,
          clientName,
          matchingWorkflows: allMatchingWorkflows.length,
          workflowDetails: allMatchingWorkflows.map((w: any) => ({
            id: w.id || w._id,
            status: w.status,
            updatedAt: w.updatedAt,
            hasQuestionnaireAssignment: !!w.questionnaireAssignment,
            hasFormCaseIds: !!w.formCaseIds,
            formCaseIds: w.formCaseIds,
            assignmentFormCaseId: w.questionnaireAssignment?.formCaseIdGenerated
          }))
        });

        if (allMatchingWorkflows.length > 0) {
          // Use the most recent workflow as the primary match
          matchingWorkflow = allMatchingWorkflows
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

       
        } else {
          // If no client match, get the most recent workflow overall
          matchingWorkflow = apiWorkflows
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

          console.log('📝 No client match found, using most recent workflow overall');
        }
      }

      // Prepare comprehensive workflow data with sanitized objects
      const workflowData = {
        clientId: clientInfo._id,
        clientEmail: clientInfo.email,
        clientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
        questionnaireId: typeof assignment.questionnaireId === 'string'
          ? assignment.questionnaireId
          : (assignment.questionnaireId as any)?._id || (assignment.questionnaireId as any)?.id || 'unknown',
        questionnaireTitle: questionnaire?.title,
        existingResponses: sanitizeObject(responseInfo?.responses || {}),
        fields: sanitizeObject(questionnaire?.fields || []),
        mode: responseInfo?.responses ? 'edit' : 'new',
        originalAssignmentId: assignment._id,

        // Include specific assignment information to ensure correct mapping
        targetAssignment: {
          id: assignment._id,
          formCaseIdGenerated: assignment.formCaseIdGenerated,
          workflowFormCaseIdGenerated: assignment.workflowQuestionnaireAssignment?.formCaseIdGenerated,
          questionnaireId: typeof assignment.questionnaireId === 'string'
            ? assignment.questionnaireId
            : (assignment.questionnaireId as any)?._id || (assignment.questionnaireId as any)?.id,
          clientId: clientInfo._id,
          clientEmail: clientInfo.email,
          completedAt: responseInfo?.submittedAt || assignment.completedAt
        },

        // Include workflow IDs for All Details Summary
        ...(matchingWorkflow && {
          workflowId: matchingWorkflow.workflowId || matchingWorkflow._id || matchingWorkflow.id,
          databaseWorkflowId: matchingWorkflow._id, // MongoDB ObjectId
          selectedWorkflow: {
            _id: matchingWorkflow._id,
            id: matchingWorkflow.id,
            workflowId: matchingWorkflow.workflowId
          }
        }),

        // Enhanced workflow data from API - all sanitized
        ...(matchingWorkflow && {
          // Client data from workflow - sanitized
          workflowClient: sanitizeObject({
            name: matchingWorkflow.client?.name || `${clientInfo.firstName} ${clientInfo.lastName}`,
            firstName: matchingWorkflow.client?.firstName || clientInfo.firstName,
            lastName: matchingWorkflow.client?.lastName || clientInfo.lastName,
            email: matchingWorkflow.client?.email || clientInfo.email,
            phone: matchingWorkflow.client?.phone || '',
            dateOfBirth: matchingWorkflow.client?.dateOfBirth || '',
            nationality: matchingWorkflow.client?.nationality || '',
            address: matchingWorkflow.client?.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'United States'
            }
          }),

          // Case data from workflow - sanitized
          workflowCase: sanitizeObject({
            id: matchingWorkflow.case?.id || matchingWorkflow.case?._id,
            _id: matchingWorkflow.case?._id || matchingWorkflow.case?.id,
            title: matchingWorkflow.case?.title || 'Case',
            caseNumber: matchingWorkflow.case?.caseNumber || '',
            category: matchingWorkflow.case?.category || 'family-based',
            subcategory: matchingWorkflow.case?.subcategory || '',
            status: matchingWorkflow.case?.status || 'draft',
            priority: matchingWorkflow.case?.priority || 'medium',
            visaType: matchingWorkflow.case?.visaType || '',
            description: matchingWorkflow.case?.description || '',
            openDate: matchingWorkflow.case?.openDate || '',
            priorityDate: matchingWorkflow.case?.priorityDate || '',
            dueDate: matchingWorkflow.case?.dueDate || ''
          }),

          // Form data from workflow - sanitized
          selectedForms: sanitizeObject(matchingWorkflow.selectedForms || []),
          formCaseIds: sanitizeObject(matchingWorkflow.formCaseIds || {}),
          selectedQuestionnaire: matchingWorkflow.selectedQuestionnaire || assignment.questionnaireId,

          // Questionnaire assignment data - sanitized
          questionnaireAssignment: sanitizeObject({
            assignment_id: matchingWorkflow.questionnaireAssignment?.assignment_id || '',
            attorney_id: matchingWorkflow.questionnaireAssignment?.attorney_id || '',
            formCaseIdGenerated: matchingWorkflow.questionnaireAssignment?.formCaseIdGenerated || '',
            formNumber: matchingWorkflow.questionnaireAssignment?.formNumber || '',
            is_complete: matchingWorkflow.questionnaireAssignment?.is_complete || false,
            notes: matchingWorkflow.questionnaireAssignment?.notes || '',
            questionnaire_id: matchingWorkflow.questionnaireAssignment?.questionnaire_id || '',
            questionnaire_title: matchingWorkflow.questionnaireAssignment?.questionnaire_title || '',
            response_id: matchingWorkflow.questionnaireAssignment?.response_id || '',
            responses: sanitizeObject(matchingWorkflow.questionnaireAssignment?.responses || {}),
            submitted_at: matchingWorkflow.questionnaireAssignment?.submitted_at || ''
          }),

          // Client credentials from workflow - sanitized
          clientCredentials: sanitizeObject({
            email: matchingWorkflow.clientCredentials?.email || clientInfo.email,
            createAccount: matchingWorkflow.clientCredentials?.createAccount || true
          }),

          // Set target step to Review Responses (step 0) for edit mode with existing responses
          targetStep: responseInfo?.responses ? 0 : 2,
          autoFillMode: true, // Flag to indicate this is auto-fill mode (no saving)
          currentStep: matchingWorkflow.currentStep || 1
        })
      };

      // Store the sanitized workflow data in sessionStorage for the Legal Firm Workflow to pick up
      console.log('Storing sanitized workflow data:', JSON.stringify(workflowData, null, 2));
      sessionStorage.setItem('legalFirmWorkflowData', JSON.stringify(workflowData));

    } catch (error) {
      // Fallback to basic data if API fails - with sanitization
      const basicWorkflowData = {
        clientId: clientInfo._id,
        clientEmail: clientInfo.email,
        clientName: `${clientInfo.firstName} ${clientInfo.lastName}`,
        questionnaireId: assignment.questionnaireId,
        questionnaireTitle: questionnaireInfo?.title,
        existingResponses: sanitizeObject(responseInfo?.responses || {}),
        fields: sanitizeObject(questionnaireInfo?.fields || []),
        mode: responseInfo?.responses ? 'edit' : 'new',
        originalAssignmentId: assignment._id,
        autoFillMode: true
      };

      console.log('Storing basic sanitized workflow data:', JSON.stringify(basicWorkflowData, null, 2));
      sessionStorage.setItem('legalFirmWorkflowData', JSON.stringify(basicWorkflowData));

    } finally {
      setLoadingWorkflows(false);

      // Navigate to the Legal Firm Workflow page with existing response parameter and workflow ID
      // Priority: use workflowId first, then fallback to _id or id
      const workflowId = matchingWorkflow?.workflowId || matchingWorkflow?._id || matchingWorkflow?.id;
      
      // Console log the workflow ID values for debugging
   
      
      const navigationUrl = workflowId 
        ? `/legal-firm-workflow?fromQuestionnaireResponses=true&workflowId=${workflowId}`
        : '/legal-firm-workflow?fromQuestionnaireResponses=true';
      
      console.log('🔗 Navigating to LegalFirmWorkflow with workflow ID:', {
        workflowId,
        navigationUrl,
        hasWorkflowId: !!workflowId
      });
      
      navigate(navigationUrl);
    }
  };

  const handleViewResponse = async (assignmentId: string) => {
    // Handle composite IDs for multiple workflows
    const originalAssignmentId = assignmentId.includes('_workflow_')
      ? assignmentId.split('_workflow_')[0]
      : assignmentId;

    // Validate assignmentId is a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(originalAssignmentId)) {
      toast.error('Invalid assignment ID format');
      return;
    }

    // Find the assignment to check if response data exists
    const assignment = filteredAssignments.find(a => a._id === assignmentId);
    if (!assignment) {
      toast.error('Assignment not found');
      return;
    }

    // Check if responseId exists and has response data
    if (!assignment.responseId) {
      toast.error('No response data available for this assignment');
      return;
    }

    if (!assignment.responseId.responses) {
      toast.error('Response data is empty or corrupted');
      return;
    }

    try {
      // Use the original assignment ID for API calls
      const responseData = await getAssignmentResponse(originalAssignmentId);

      // Create a comprehensive assignment object with all necessary data
      const completeAssignment = {
        ...assignment,
        // Ensure we have the response data properly mapped
        response: responseData?.data || assignment.responseId,
        responseId: assignment.responseId || responseData?.data,
        // Preserve workflow-specific data for proper form number extraction
        workflowFormCaseIds: assignment.workflowFormCaseIds,
        workflowQuestionnaireAssignment: assignment.workflowQuestionnaireAssignment,
        workflowCase: assignment.workflowCase,
        workflowSelectedForms: assignment.workflowSelectedForms,
        enhancedWithWorkflow: assignment.enhancedWithWorkflow
      };
      // Pass the assignment data through navigation state to avoid refetching in ResponseView
      navigate(`/questionnaires/response/${originalAssignmentId}`, {
        state: {
          assignmentData: completeAssignment,
          responseData: responseData?.data,
          fromQuestionnaireResponses: true
        }
      });
    } catch (error) {
      console.error('Error fetching assignment response:', error);
      toast.error('Failed to load response data');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Questionnaire Responses</h1>
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
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-3 text-gray-600">Loading questionnaire responses...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Completed Questionnaire Responses</h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' ?
              'No completed responses match your search criteria.' :
              'There are no completed questionnaire responses available yet.'}
          </p>
          <p className="text-sm text-gray-500">
            Responses will appear here once clients complete their assigned questionnaires.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto sticky-scroll-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
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
                    <div
                      className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                      onClick={() => handleClientClick(assignment)}
                      title="Click to edit client responses in Legal Firm Workflow"
                    >
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {assignment.actualClient?.firstName && assignment.actualClient?.lastName ?
                            `${assignment.actualClient.firstName} ${assignment.actualClient.lastName}` :
                            assignment.clientUserId?.firstName && assignment.clientUserId?.lastName ?
                              `${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}` :
                              'Client Name Not Available'
                          }
                          {/* {assignment.workflowTotal && assignment.workflowTotal > 1 && (
                            <span className="ml-2 text-xs text-purple-600 font-medium">
                              (Workflow {assignment.workflowIndex}/{assignment.workflowTotal})
                            </span>
                          )} */}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.actualClient?.email || assignment.clientUserId?.email || 'No email available'}
                        </div>

                        <div className="text-xs text-blue-600 mt-1">
                          Click to {assignment.responseId?.responses ? 'edit' : 'create'} responses →
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {assignment.questionnaireDetails?.title ||
                        assignment.workflowQuestionnaireAssignment?.questionnaire_title ||
                        assignment.workflowQuestionnaireAssignment?.formNumber ||
                        'Untitled'}
                      {/* {assignment.workflowTotal && assignment.workflowTotal > 1 && (
                        <span className="ml-2 text-xs text-purple-600 font-medium">
                          (Workflow {assignment.workflowIndex}/{assignment.workflowTotal})
                        </span>
                      )} */}
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.questionnaireDetails?.category ||
                        assignment.workflowQuestionnaireAssignment?.formNumber ||
                        assignment.workflowCase?.category ||
                        'No category'}
                    </div>
                    {/* {assignment.enhancedWithWorkflow && (
                      <div className="text-xs text-blue-500 mt-1">
                        From workflow
                        {assignment.workflowStatus && (
                          <span className={`ml-1 px-1 rounded ${
                            assignment.workflowStatus === 'completed' ? 'bg-green-100 text-green-600' :
                            assignment.workflowStatus === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {assignment.workflowStatus}
                          </span>
                        )}
                      </div>
                    )} */}
                  </td>

                  <td className="px-6 py-4">
                    {assignment.formCaseIdGenerated ? (
                      <div>
                        <div className="text-sm text-gray-900 font-medium whitespace-nowrap">
                          {assignment.formCaseIdGenerated}
                        </div>
                        {assignment.workflowFormCaseIds && (
                          <div className="text-xs text-gray-500">
                            {Object.keys(assignment.workflowFormCaseIds).find(formNumber => 
                              assignment.workflowFormCaseIds && 
                              assignment.workflowFormCaseIds[formNumber] === assignment.formCaseIdGenerated
                            )}
                          </div>
                        )}
                      </div>
                    ) : assignment.workflowQuestionnaireAssignment?.formCaseIdGenerated ? (
                      <div>
                        <div className="text-sm text-gray-900 font-medium whitespace-nowrap">
                          {assignment.workflowQuestionnaireAssignment.formCaseIdGenerated}
                        </div>
                        {assignment.workflowFormCaseIds && assignment.workflowQuestionnaireAssignment && (
                          <div className="text-xs text-gray-500">
                            {Object.keys(assignment.workflowFormCaseIds).find(formNumber => 
                              assignment.workflowFormCaseIds && 
                              assignment.workflowQuestionnaireAssignment &&
                              assignment.workflowFormCaseIds[formNumber] === assignment.workflowQuestionnaireAssignment.formCaseIdGenerated
                            )}
                          </div>
                        )}
                      </div>
                    ) : assignment.workflowCase?.caseNumber ? (
                      <div className="text-sm text-gray-900 font-medium whitespace-nowrap">
                        {assignment.workflowCase.caseNumber}
                      </div>
                    ) : assignment.workflowCase?.title ? (
                      <div className="text-sm text-gray-900 font-medium whitespace-nowrap">
                        {assignment.workflowCase.title}
                      </div>
                    ) : assignment.caseId ? (
                      <div className="text-sm text-gray-900 font-medium whitespace-nowrap">
                        {assignment.caseId.title}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 whitespace-nowrap">No case linked</span>
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
                    {assignment.status === 'completed' && !assignment.responseId && (
                      <div className="mt-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Missing Response Data
                        </span>
                      </div>
                    )}
                    {assignment.workflowQuestionnaireAssignment?.reuseMetadata?.isReused && (
                      <div className="mt-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          🔄 Reused Response
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {/* <div className="flex items-center mb-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Assigned: {formatDate(assignment.assignedAt)}</span>
                      </div> */}
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
                      {assignment.workflowQuestionnaireAssignment?.reuseMetadata?.isReused && (
                        <div className="flex items-center text-blue-600 mt-1">
                          <span className="text-xs">🔄 Reused from: {formatDate(assignment.workflowQuestionnaireAssignment.reuseMetadata.originalCompletedAt)}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => handleViewResponse(assignment._id)}
                        disabled={assignment.status !== 'completed' || !assignment.responseId || !assignment.responseId.responses}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          assignment.status === 'completed' && assignment.responseId?.responses
                            ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                            : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                        }`}
                        title={
                          assignment.status !== 'completed'
                            ? 'Assignment not completed'
                            : !assignment.responseId
                              ? 'No response data available'
                              : !assignment.responseId.responses
                                ? 'Response data is empty'
                                : 'View the completed response'
                        }
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Response
                      </button>
                      {/* {assignment.responseId?.responses ? (
                        <div className="text-xs text-green-600 font-medium">
                          {Object.keys(assignment.responseId.responses).length} fields completed
                        </div>
                      ) : assignment.status === 'completed' ? (
                        <div className="text-xs text-red-600 font-medium">
                          No response data available
                        </div>
                      ) : null} */}
                    </div>
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


