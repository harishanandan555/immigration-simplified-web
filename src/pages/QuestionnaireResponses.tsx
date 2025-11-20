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

    loadClientResponsesFromWorkflows();
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

  const loadClientResponsesFromWorkflows = async () => {
    try {
      setLoading(true);

      // Get workflows from API instead of assignments
      const workflows = await fetchWorkflowsFromAPI();

      console.log('Fetched workflows for client responses:', workflows);

      if (!workflows || workflows.length === 0) {
        setAssignments([]);
        setError(null);
        setLoading(false);
        return;
      }

      // Transform workflows into assignment format
      const transformedAssignments: QuestionnaireAssignment[] = [];

      workflows.forEach((workflow: any, index: number) => {
        // Check if workflow has questionnaire assignment with responses
        const hasQuestionnaireAssignment = workflow.questionnaireAssignment && 
          Object.keys(workflow.questionnaireAssignment).length > 0;
        
        // Check for responses in questionnaireAssignment.responses OR clientResponses.responses
        const hasQuestionnaireResponses = (
          (workflow.questionnaireAssignment?.responses && Object.keys(workflow.questionnaireAssignment.responses).length > 0) ||
          (workflow.clientResponses?.responses && Object.keys(workflow.clientResponses.responses).length > 0)
        );
        
        console.log('🔍 Processing workflow:', {
          workflowId: workflow.workflowId,
          caseNumber: workflow.case?.caseNumber,
          hasQuestionnaireAssignment,
          hasQuestionnaireResponses,
          questionnaireAssignmentResponses: !!workflow.questionnaireAssignment?.responses,
          clientResponsesResponses: !!workflow.clientResponses?.responses,
          questionnaireStatus: workflow.questionnaireAssignment?.status,
          questionnaireIsComplete: workflow.questionnaireAssignment?.is_complete,
          workflowStatus: workflow.status,
          willInclude: hasQuestionnaireAssignment && hasQuestionnaireResponses
        });
        
        // Include workflows that have questionnaire assignments with responses
        if (hasQuestionnaireAssignment && hasQuestionnaireResponses) {
          // Determine status based on actual completion state
          // Priority: clientResponses.is_complete > questionnaireAssignment.is_complete > workflow.status
          let isCompleted = false;
          
          if (workflow.clientResponses?.is_complete !== undefined) {
            // Use clientResponses.is_complete if available
            isCompleted = workflow.clientResponses.is_complete === true;
          } else if (workflow.questionnaireAssignment?.is_complete !== undefined) {
            // Fall back to questionnaireAssignment.is_complete
            isCompleted = workflow.questionnaireAssignment.is_complete === true;
          } else {
            // Fall back to workflow status
            isCompleted = workflow.status === 'completed';
          }
          
          const assignment: QuestionnaireAssignment = {
            _id: workflow.questionnaireAssignment?.assignment_id || workflow.questionnaireAssignment?.id || workflow._id || `workflow_${index}`,
            questionnaireId: workflow.questionnaireAssignment?.questionnaire_id || workflow.questionnaireAssignment?.questionnaireId || '',
            questionnaireDetails: {
              title: workflow.questionnaireAssignment?.questionnaire_title || workflow.questionnaireAssignment?.questionnaireName || 'Questionnaire',
              category: workflow.case?.category || 'general',
              description: workflow.case?.description || '',
              fields: []
            },
            clientId: workflow.client?.email || workflow.client?._id || '',
            clientUserId: workflow.client ? {
              _id: workflow.client._id || '',
              firstName: workflow.client.firstName || '',
              lastName: workflow.client.lastName || '',
              email: workflow.client.email || ''
            } : undefined,
            actualClient: workflow.client ? {
              _id: workflow.client._id || '',
              firstName: workflow.client.firstName || '',
              lastName: workflow.client.lastName || '',
              email: workflow.client.email || '',
              client_id: workflow.client._id || ''
            } : undefined,
            responseId: (() => {
              // Check for responses in questionnaireAssignment first, then clientResponses
              if (workflow.questionnaireAssignment?.responses && Object.keys(workflow.questionnaireAssignment.responses).length > 0) {
                return {
                  _id: workflow.questionnaireAssignment.response_id || workflow.questionnaireAssignment.assignment_id || '',
                  responses: workflow.questionnaireAssignment.responses || {},
                  submittedAt: workflow.questionnaireAssignment.submitted_at || workflow.questionnaireAssignment.completedAt || '',
                  notes: workflow.questionnaireAssignment.notes || ''
                };
              } else if (workflow.clientResponses?.responses && Object.keys(workflow.clientResponses.responses).length > 0) {
                return {
                  _id: workflow.clientResponses.response_id || '',
                  responses: workflow.clientResponses.responses || {},
                  submittedAt: workflow.clientResponses.submitted_at || '',
                  notes: workflow.clientResponses.notes || ''
                };
              }
              return undefined;
            })(),
            status: isCompleted ? 'completed' : 'in-progress',
            assignedAt: workflow.createdAt || new Date().toISOString(),
            completedAt: workflow.questionnaireAssignment?.submitted_at || workflow.questionnaireAssignment?.completedAt || undefined,
            formCaseIdGenerated: workflow.questionnaireAssignment?.formCaseIdGenerated || '',

            // Enhanced workflow data fields
            workflowCase: workflow.case ? {
              id: workflow.case.caseId || workflow.case._id || workflow.case.id,
              _id: workflow.case._id || workflow.case.caseId || workflow.case.id,
              title: workflow.case.title || 'Case',
              caseNumber: workflow.case.caseNumber || '',
              category: workflow.case.category || 'family-based',
              subcategory: workflow.case.subcategory || '',
              status: workflow.case.status || 'draft',
              priority: workflow.case.priority || 'medium',
              visaType: workflow.case.visaType || '',
              description: workflow.case.description || ''
            } : undefined,
            workflowFormCaseIds: workflow.formCaseIds || {},
            workflowQuestionnaireAssignment: workflow.questionnaireAssignment ? {
              ...workflow.questionnaireAssignment,
              // Ensure form number is included from multiple sources
              formNumber: workflow.questionnaireAssignment.formNumber || 
                         workflow.formNumber || 
                         workflow.questionnaireAssignment.formCaseIdGenerated ||
                         '',
            } : undefined,
            workflowSelectedForms: workflow.selectedForms || [],
            workflowId: workflow._id || workflow.id,
            workflowStatus: workflow.status || 'unknown',
            enhancedWithWorkflow: true
          };

          transformedAssignments.push(assignment);

          // Debug log for each assignment
          console.log(`📋 Assignment ${index + 1}:`, {
            caseNumber: workflow.case?.caseNumber,
            clientEmail: workflow.client?.email,
            assignmentId: workflow.questionnaireAssignment?.assignment_id || workflow.questionnaireAssignment?.id,
            workflowId: workflow._id,
            clientResponsesComplete: workflow.clientResponses?.is_complete,
            questionnaireIsComplete: workflow.questionnaireAssignment?.is_complete,
            questionnaireStatus: workflow.questionnaireAssignment?.status,
            workflowStatus: workflow.status,
            calculatedIsCompleted: isCompleted,
            finalStatus: assignment.status,
            statusSource: workflow.clientResponses?.is_complete !== undefined ? 'clientResponses' : 
                         workflow.questionnaireAssignment?.is_complete !== undefined ? 'questionnaireAssignment' : 'workflowStatus',
            hasQuestionnaireAssignmentResponses: !!workflow.questionnaireAssignment?.responses,
            hasClientResponsesResponses: !!workflow.clientResponses?.responses,
            questionnaireResponseCount: workflow.questionnaireAssignment?.responses ? Object.keys(workflow.questionnaireAssignment.responses).length : 0,
            clientResponseCount: workflow.clientResponses?.responses ? Object.keys(workflow.clientResponses.responses).length : 0
          });
        }
      });

      console.log('📋 Loaded client responses from workflows:', {
        totalWorkflows: workflows.length,
        totalAssignments: transformedAssignments.length,
        completedAssignments: transformedAssignments.filter(a => a.status === 'completed').length,
        inProgressAssignments: transformedAssignments.filter(a => a.status === 'in-progress').length,
        enhancedWithWorkflow: transformedAssignments.filter((a: any) => a.enhancedWithWorkflow).length,
        caseNumbers: transformedAssignments.map(a => a.workflowCase?.caseNumber).filter(Boolean),
        clientEmails: [...new Set(transformedAssignments.map(a => a.actualClient?.email).filter(Boolean))]
      });

      setAssignments(transformedAssignments);
      setError(null);

    } catch (err) {
      console.error('Failed to load client responses from workflows:', err);
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
            id: matchingWorkflow.case?.caseId || matchingWorkflow.case?._id || matchingWorkflow.case?.id,
            caseId: matchingWorkflow.case?.caseId || matchingWorkflow.case?._id || matchingWorkflow.case?.id,
            _id: matchingWorkflow.case?._id || matchingWorkflow.case?.caseId || matchingWorkflow.case?.id,
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

          // Form data from workflow - sanitized (legacy support)
          selectedForms: sanitizeObject(matchingWorkflow.selectedForms || []),
          formCaseIds: sanitizeObject(matchingWorkflow.formCaseIds || {}),
          formNumber: matchingWorkflow.formNumber || '',
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

    // Validate assignmentId (MongoDB ObjectId OR custom assignment ID)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(originalAssignmentId);
    const isCustomAssignmentId = /^assignment_\d+$/.test(originalAssignmentId);
    
    if (!isMongoId && !isCustomAssignmentId) {
      toast.error('Invalid assignment ID format');
      console.error('Invalid assignment ID:', { assignmentId, originalAssignmentId, isMongoId, isCustomAssignmentId });
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
      let responseData = null;
      
      // For workflow-based assignments, we already have the response data
      if (assignment.responseId && assignment.responseId.responses) {
        responseData = {
          data: {
            responses: assignment.responseId.responses,
            submittedAt: assignment.responseId.submittedAt,
            notes: assignment.responseId.notes || ''
          }
        };
      } else {
        // For traditional assignments, fetch from API
        console.log('Fetching response data from API for assignment:', originalAssignmentId);
        responseData = await getAssignmentResponse(originalAssignmentId);
      }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Questionnaire Responses</h1>
              <p className="mt-1 text-sm text-gray-600">Manage and review completed client questionnaires</p>
            </div>
            <div className="mt-3 lg:mt-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 px-3 py-1 rounded-md">
                  <span className="text-xs font-medium text-blue-700">
                    {filteredAssignments.length} Total Response{filteredAssignments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="bg-green-50 px-3 py-1 rounded-md">
                  <span className="text-xs font-medium text-green-700">
                    {filteredAssignments.filter(a => a.status === 'completed').length} Completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Filters and Search */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search Responses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by client name, questionnaire, or case..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="lg:w-56">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Loading Responses</h3>
              <p className="text-gray-600 text-sm">Fetching questionnaire responses...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <div className="flex items-center justify-center text-red-700">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <div>
                <h3 className="text-lg font-semibold mb-1">Error Loading Responses</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-3">No Questionnaire Responses</h2>
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                {searchTerm || statusFilter !== 'all' ?
                  'No responses match your search criteria. Try adjusting your filters.' :
                  'There are no completed questionnaire responses available yet. Responses will appear here once clients complete their assigned questionnaires.'}
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map(assignment => (
              <div key={assignment._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                    
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        
                        {/* Client Information */}
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="ml-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {assignment.actualClient?.firstName && assignment.actualClient?.lastName ?
                                  `${assignment.actualClient.firstName} ${assignment.actualClient.lastName}` :
                                  assignment.clientUserId?.firstName && assignment.clientUserId?.lastName ?
                                    `${assignment.clientUserId.firstName} ${assignment.clientUserId.lastName}` :
                                    'Client Name Not Available'
                                }
                              </h3>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {assignment.actualClient?.email || assignment.clientUserId?.email || 'No email available'}
                          </p>
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <span>Client Profile</span>
                          </div>
                        </div>

                        {/* Questionnaire & Case Info */}
                        <div>
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 text-green-600 mr-1" />
                            <h4 className="font-medium text-gray-900 text-sm">
                              {assignment.questionnaireDetails?.title ||
                                assignment.workflowQuestionnaireAssignment?.questionnaire_title ||
                                assignment.workflowQuestionnaireAssignment?.formNumber ||
                                'Untitled Questionnaire'}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            Category: {assignment.questionnaireDetails?.category ||
                              assignment.workflowQuestionnaireAssignment?.formNumber ||
                              assignment.workflowCase?.category ||
                              'No category'}
                          </p>
                          {(assignment.formCaseIdGenerated || 
                            assignment.workflowQuestionnaireAssignment?.formCaseIdGenerated || 
                            assignment.workflowCase?.caseNumber) && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              Case: {assignment.formCaseIdGenerated ||
                                assignment.workflowQuestionnaireAssignment?.formCaseIdGenerated ||
                                assignment.workflowCase?.caseNumber ||
                                assignment.workflowCase?.title ||
                                'No case linked'}
                            </div>
                          )}
                        </div>

                        {/* Status & Dates */}
                        <div>
                          <div className="flex items-center mb-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${getStatusColor(assignment.status, assignment.isOverdue)}`}
                            >
                              {getStatusIcon(assignment.status, assignment.isOverdue)}
                              <span className="ml-1">
                                {assignment.isOverdue ? 'Overdue' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </span>
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            {assignment.completedAt && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                <span>Completed: {formatDate(assignment.completedAt)}</span>
                              </div>
                            )}
                            {assignment.dueDate && !assignment.completedAt && (
                              <div className={`flex items-center ${assignment.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                                <Clock className="w-3 h-3 mr-1" />
                                <span>Due: {formatDate(assignment.dueDate)}</span>
                              </div>
                            )}
                          </div>

                          {assignment.workflowQuestionnaireAssignment?.reuseMetadata?.isReused && (
                            <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                              🔄 Reused Response
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-40">
                      <button
                        onClick={() => handleClientClick(assignment)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                        title="Edit client responses in Legal Firm Workflow"
                      >
                        <User className="w-4 h-4 mr-1" />
                        {assignment.responseId?.responses ? 'Edit Responses' : 'Create Responses'}
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('🔘 View Response button clicked for assignment:', {
                            assignmentId: assignment._id,
                            status: assignment.status,
                            hasResponseId: !!assignment.responseId,
                            hasResponses: !!assignment.responseId?.responses,
                            responseCount: assignment.responseId?.responses ? Object.keys(assignment.responseId.responses).length : 0,
                            isDisabled: !assignment.responseId || !assignment.responseId.responses
                          });
                          handleViewResponse(assignment._id);
                        }}
                        disabled={!assignment.responseId || !assignment.responseId.responses}
                        className={`flex items-center justify-center px-3 py-2 rounded-md border font-medium transition-colors text-sm ${
                          assignment.responseId?.responses
                            ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            : 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                        }`}
                        title={
                          !assignment.responseId
                            ? 'No response data available'
                            : !assignment.responseId.responses
                              ? 'Response data is empty'
                              : assignment.status === 'completed'
                                ? 'View the completed response'
                                : 'View the current response (in-progress)'
                        }
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Additional Status Indicators */}
                  {assignment.status === 'completed' && !assignment.responseId && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                        <span className="text-xs font-medium text-orange-800">Missing Response Data</span>
                      </div>
                      <p className="text-xs text-orange-600 mt-1">This response is marked as completed but the response data is not available.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireResponses;


