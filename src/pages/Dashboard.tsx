import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  FileCheck,
  CalendarDays,
  ClipboardList,
  Folder,
  ArrowRight,
  FileSearch,
  Plus
} from 'lucide-react';
import { useAuth } from '../controllers/AuthControllers';
import questionnaireAssignmentService from '../services/questionnaireAssignmentService';
import { fetchWorkflows } from '../controllers/LegalFirmWorkflowController';
import { getCasesBasedOnUserType } from '../controllers/CaseControllers';
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
import {getTasks} from '../controllers/TaskControllers';

const Dashboard = () => {
  const { user, isClient, isAttorney, isSuperAdmin } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Workflow API data states
  const [clients, setClients] = useState<any[]>([]);
  const [workflowClients, setWorkflowClients] = useState<any[]>([]); // Dedicated client count from workflows
  const [cases, setCases] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingWorkflowData, setLoadingWorkflowData] = useState(false);
  
  // Workflow states
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    draft: 0
  });
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);

  // Consolidated workflow data loading
  useEffect(() => {
    const loadDashboardData = async () => {
      // For individual users, load their specific cases
      if (isClient && user?.userType === 'individualUser') {
        try {
          setLoadingWorkflowData(true);
          setLoadingWorkflows(true);
          
          // Load cases specifically for individual users
          const casesResponse = await getCasesBasedOnUserType(user, { limit: 100 });
          
          if (casesResponse.success && casesResponse.cases) {
            // Transform cases into the format expected by the dashboard
            const transformedCases = casesResponse.cases.map((caseItem: any) => ({
              id: caseItem._id,
              _id: caseItem._id,
              caseNumber: caseItem.caseNumber || 'N/A',
              title: caseItem.title || 'Untitled Case',
              description: caseItem.description || '',
              type: caseItem.type || 'Immigration Case',
              category: caseItem.category || '',
              subcategory: caseItem.subcategory || '',
              status: caseItem.status || 'Active',
              priority: caseItem.priority || 'Medium',
              dueDate: caseItem.dueDate,
              formNumber: caseItem.formNumber || '',
              clientId: user._id, // Individual user is their own client
              documents: caseItem.documents || [],
              tasks: caseItem.tasks || [],
              timeline: caseItem.timeline || [],
              createdAt: caseItem.createdAt,
              updatedAt: caseItem.updatedAt
            }));
            
            setCases(transformedCases);
          } else {
            setCases([]);
          }
        } catch (error) {
          console.error('Error loading cases for individual user:', error);
          setCases([]);
        } finally {
          setLoadingWorkflowData(false);
          setLoadingWorkflows(false);
        }
        return;
      }
      
      // Only load workflow data for attorneys and super admins
      if (!isAttorney && !isSuperAdmin) {
        
        setLoadingWorkflowData(false);
        setLoadingWorkflows(false);
        return;
      }

      try {
        setLoadingWorkflowData(true);
        setLoadingWorkflows(true);


        // Fetch all workflows with comprehensive data
        const workflowData = await fetchWorkflows({
          limit: 500, // Increased limit for comprehensive data
          offset: 0
        });


   

        // Store workflows for case number matching
        setAvailableWorkflows(workflowData);

        // Extract clients from workflows
        const clientsMap = new Map<string, any>();
        const casesArray: any[] = [];

        workflowData.forEach((workflow: any) => {
          // Extract client data with enhanced error handling
          if (workflow.client) {
            try {
              const clientEmail = workflow.client.email;
              const clientName = workflow.client.name || 
                               `${workflow.client.firstName || ''} ${workflow.client.lastName || ''}`.trim() ||
                               'Unknown Client';

              if (clientEmail && clientName !== 'Unknown Client') {
                const clientData = {
                  id: workflow.client.clientId || workflow.client._id || clientEmail,
                  _id: workflow.client._id || workflow.client.clientId,
                  name: clientName,
                  email: clientEmail,
                  phone: workflow.client.phone || 'N/A',
                  status: workflow.client.status || 'Active',
                  createdAt: workflow.createdAt || workflow.client.createdAt || '',
                  
                  // Enhanced client fields from workflow data
                  alienNumber: workflow.client.alienRegistrationNumber || workflow.client.alienNumber || 'N/A',
                  socialSecurityNumber: workflow.client.socialSecurityNumber || workflow.client.ssn || 'N/A',
                  uscisAccountNumber: workflow.client.uscisOnlineAccountNumber || 'N/A',
                  nationalIdNumber: workflow.client.nationalIdNumber || 'N/A',
                  passportNumber: workflow.client.passportNumber || 'N/A',
                  
                  address: workflow.client.address?.formattedAddress || 
                           (workflow.client.address ? 
                             `${workflow.client.address.street || ''} ${workflow.client.address.city || ''} ${workflow.client.address.state || ''}`.trim() : 
                             'N/A'),
                  nationality: workflow.client.nationality || 'N/A',
                  dateOfBirth: workflow.client.dateOfBirth || 'N/A',
                  placeOfBirth: workflow.client.placeOfBirth ? 
                    `${workflow.client.placeOfBirth.city || ''}, ${workflow.client.placeOfBirth.country || ''}`.replace(', ', ', ').trim() : 
                    'N/A',
                  gender: workflow.client.gender || 'N/A',
                  maritalStatus: workflow.client.maritalStatus || 'N/A',
                  
                  // IMS User data
                  imsUserId: workflow.client.imsUserId,
                  hasImsUser: !!workflow.client.imsUserId,
                  
                  // Workflow-specific fields
                  workflowId: workflow._id || workflow.id,
                  caseType: workflow.case?.category || workflow.case?.subcategory || 'N/A',
                  formCaseIds: workflow.formCaseIds,
                  openDate: workflow.case?.openDate || 'N/A',
                  priorityDate: workflow.case?.priorityDate || 'N/A'
                };

                // Use email as unique identifier for clients
                clientsMap.set(clientEmail, clientData);
              }
            } catch (clientError) {
              console.warn('⚠️ Error processing client data:', clientError, workflow.client);
            }
          }

          // Extract case data with enhanced error handling
          if (workflow.case) {
            try {
              // Clean form case IDs by filtering out Mongoose metadata
              const cleanFormCaseIds = workflow.formCaseIds && typeof workflow.formCaseIds === 'object' 
                ? Object.fromEntries(
                    Object.entries(workflow.formCaseIds).filter(([key, value]) => 
                      !key.startsWith('$') && typeof key === 'string' && value && typeof value === 'string'
                    )
                  )
                : {};

              const caseData = {
                id: workflow.case.id || workflow.case._id,
                _id: workflow.case.id || workflow.case._id,
                clientId: workflow.client?.clientId || workflow.client?._id,
                clientName: workflow.client?.name || 
                           `${workflow.client?.firstName || ''} ${workflow.client?.lastName || ''}`.trim() ||
                           'Unknown Client',
                caseNumber: workflow.case.caseNumber || workflow.case.title || 'No Case Number',
                formNumber: workflow.selectedForms?.[0] || workflow.case.assignedForms?.[0] || 'Unknown',
                status: workflow.case.status || workflow.status || 'draft',
                type: formatCaseCategory(workflow.case.category, workflow.case.subcategory),
                category: workflow.case.category,
                subcategory: workflow.case.subcategory,
                visaType: workflow.case.visaType,
                priority: workflow.case.priority || 'medium',
                title: workflow.case.title,
                description: workflow.case.description,
                createdAt: workflow.case.createdAt || workflow.createdAt,
                updatedAt: workflow.case.updatedAt || workflow.updatedAt,
                openDate: workflow.case.openDate,
                dueDate: workflow.case.dueDate,
                priorityDate: workflow.case.priorityDate,
                
                // Enhanced workflow fields (cleaned)
                workflowId: workflow._id || workflow.id,
                workflowStatus: workflow.status,
                currentStep: workflow.currentStep,
                selectedForms: workflow.selectedForms,
                formCaseIds: cleanFormCaseIds, // Use cleaned form case IDs
                
                // Additional case metadata
                assignedForms: workflow.case.assignedForms,
                questionnaires: workflow.case.questionnaires,
                
                // Questionnaire data if available
                hasQuestionnaireAssignment: !!workflow.questionnaireAssignment,
                questionnaireStatus: workflow.questionnaireAssignment?.status,
                questionnaireTitle: workflow.questionnaireAssignment?.questionnaire_title,
                
                // Client responses data
                hasClientResponses: !!workflow.clientResponses,
                clientResponsesComplete: workflow.clientResponses?.is_complete || false
              };

              casesArray.push(caseData);
            } catch (caseError) {
              console.warn('⚠️ Error processing case data:', caseError, workflow.case);
            }
          }
        });

        // Set extracted data
        const clientsArray = Array.from(clientsMap.values());
        setClients(clientsArray);
        setWorkflowClients(clientsArray); // Use same client data for consistency
        setCases(casesArray); //

        // Calculate workflow stats with correct mapping
        const stats = {
          total: workflowData.length,
          inProgress: workflowData.filter((w: any) => w.status === 'in-progress').length,
          completed: workflowData.filter((w: any) => w.status === 'completed').length,
          draft: workflowData.filter((w: any) => w.status === 'draft').length
        };
        setWorkflowStats(stats);

        console.log('✅ Dashboard: Processed data successfully:', {
          totalWorkflows: workflowData.length,
          clients: clientsArray.length,
          cases: casesArray.length,
          workflowStats: stats,
          sampleWorkflowStatuses: workflowData.slice(0, 5).map((w: any) => w.status),
          sampleCaseCategories: casesArray.slice(0, 5).map((c: any) => ({ category: c.category, subcategory: c.subcategory, type: c.type }))
        });

        // Debug: Log sample extracted data
        if (clientsArray.length > 0) {
          console.log('📊 Dashboard: Sample client data:', clientsArray[0]);
        }
        if (casesArray.length > 0) {
          console.log('📊 Dashboard: Sample case data:', {
            ...casesArray[0],
            cleanFormCaseIds: casesArray[0].formCaseIds,
            originalWorkflowFormCaseIds: workflowData[0]?.formCaseIds
          });
        }

        // Fetch tasks separately with error handling
        try {
          const tasksData = await getTasks();
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        } catch (taskError) {
          console.error('❌ Error loading tasks:', taskError);
          setTasks([]);
        }

      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        // Set empty arrays on error to prevent undefined issues
        setClients([]);
        setWorkflowClients([]);
        setCases([]);
        setTasks([]);
        setAvailableWorkflows([]);
        setWorkflowStats({
          total: 0,
          inProgress: 0,
          completed: 0,
          draft: 0
        });
      } finally {
        setLoadingWorkflowData(false);
        setLoadingWorkflows(false);
      }
    };

    loadDashboardData();
  }, [isAttorney, isSuperAdmin]);

  // Load questionnaire assignments for clients
  useEffect(() => {
    if (isClient) {
      const loadAssignments = async () => {
        try {
          setLoadingQuestionnaires(true);
          const data = await questionnaireAssignmentService.getMyAssignments();
          
          // Ensure data is an array and filter out any invalid entries
          const validAssignments = Array.isArray(data) ? data.filter((item: any) => {
            const isValid = item && typeof item === 'object' && 
              (item.assignment_id || item._id || item.id);
            
            if (!isValid) {
              console.warn('Invalid assignment item filtered out:', item);
            }
            
            return isValid;
          }).map((item: any) => ({
            // Normalize the assignment object to ensure consistent structure
            assignment_id: item.assignment_id || item._id || item.id,
            _id: item._id || item.assignment_id || item.id,
            id: item.id || item.assignment_id || item._id,
            questionnaire_title: item.questionnaire_title || item.questionnaire?.title || 'Untitled',
            formNumber: item.formNumber || 'Unknown Form',
            status: item.status || 'pending',
            dueDate: item.dueDate,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          })) : [];
          
          setAssignments(validAssignments);
          
          // Check for pending questionnaires to show notification
          const pendingAssignments = validAssignments.filter((a: any) => a.status === 'pending');
          setPendingCount(pendingAssignments.length);
          setShowNotification(pendingAssignments.length > 0);
        } catch (error) {
          console.error('Error loading questionnaire assignments:', error);
          // Set empty array on error to prevent rendering issues
          setAssignments([]);
        } finally {
          setLoadingQuestionnaires(false);
        }
      };

      loadAssignments();
    }
  }, [isClient]);

useEffect(() => {
  const fetchTasks = async () => {
    try {
      const tasksFromAPI = await getTasks();
      console.log('✅ Fetched tasks for dashboard:', tasksFromAPI);
      
      
      setTasks(tasksFromAPI);
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      setTasks([]);
    }
  };

  fetchTasks();
}, []); // ← Add dependency array (run once on mount)


  // Helper function to format case category for display - Enhanced for API response
  const formatCaseCategory = (category: string, subcategory?: string): string => {
    if (!category) return 'Other';
    
    // Handle specific category-subcategory combinations from API
    if (category === 'citizenship' && subcategory === 'naturalization') {
      return 'Naturalization';
    }
    
    // Map workflow categories to display categories
    switch (category.toLowerCase()) {
      case 'family-based':
      case 'family':
        return 'Family-Based';
      case 'employment-based':
      case 'employment':
        return 'Employment-Based';
      case 'humanitarian':
        return 'Humanitarian';
      case 'naturalization':
      case 'citizenship':
        return 'Naturalization';
      case 'business':
        return 'Business';
      case 'other':
        return 'Other';
      default:
        // Capitalize and format unknown categories
        return category.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  // Function to get client name for a case (from TasksPage)
  const getClientNameForCase = (caseId: string) => {
    if (!caseId) return '';
    
    // Handle formatted case numbers like "CR-2025-9382 (G-28)"
    let selectedCase;
    if (caseId.includes('CR-')) {
      // Extract case number from formatted string
      const caseNumber = caseId.split(' ')[0];
      selectedCase = cases.find((c: any) => c.caseNumber === caseNumber);
    } else {
      // Handle database IDs (for backward compatibility)
      selectedCase = cases.find((c: any) => c.id === caseId);
    }
    
    if (selectedCase) {
      const client = clients.find((c: any) => c.id === selectedCase.clientId);
      return client ? client.name : 'Unknown Client';
    }
    return '';
  };

  // Function to get workflow case number for a case (from CasesPage)
  const getWorkflowCaseNumber = (caseItem: any) => {
    if (!availableWorkflows.length) {
      return null;
    }

    // Try to find a matching workflow by various criteria
    const matchingWorkflow = availableWorkflows.find((workflow: any) => {
      // Match by case ID first (most reliable)
      if (workflow.case?.id && caseItem._id) {
        const idMatch = workflow.case.id === caseItem._id || workflow.case._id === caseItem._id;
        if (idMatch) {
          return true;
        }
      }

      // Match by case number if available
      if (workflow.case?.caseNumber && caseItem.caseNumber) {
        const caseNumberMatch = workflow.case.caseNumber === caseItem.caseNumber;
        if (caseNumberMatch) {
          return true;
        }
      }

      // Match by form case IDs (check if case number matches any form case ID)
      if (workflow.formCaseIds && Object.keys(workflow.formCaseIds).length > 0) {
        const formCaseIdMatch = Object.values(workflow.formCaseIds).some(formCaseId => 
          formCaseId === caseItem.caseNumber
        );
        if (formCaseIdMatch) {
          return true;
        }
      }

      // Match by case title/description
      if (workflow.case?.title && caseItem.description) {
        const titleMatch = workflow.case.title.toLowerCase().includes(caseItem.description.toLowerCase()) ||
            caseItem.description.toLowerCase().includes(workflow.case.title.toLowerCase());
        if (titleMatch) {
          return true;
        }
      }

      // Match by client email if available
      if (workflow.client?.email && caseItem.clientName) {
        const client = clients.find((c: any) => c.id === caseItem.clientId);
        if (client?.email) {
          const emailMatch = workflow.client.email.toLowerCase() === client.email.toLowerCase();
          if (emailMatch) {
            return true;
          }
        }
      }

      // Match by client name if available
      if (workflow.client && caseItem.clientName) {
        const workflowClientName = workflow.client.name || 
          `${workflow.client.firstName || ''} ${workflow.client.lastName || ''}`.trim();
        const nameMatch = workflowClientName.toLowerCase() === caseItem.clientName.toLowerCase();
        if (nameMatch) {
          return true;
        }
      }

      // Match by client ID if available
      if (workflow.client?.clientId && caseItem.clientId) {
        const clientIdMatch = workflow.client.clientId === caseItem.clientId || workflow.client._id === caseItem.clientId;
        if (clientIdMatch) {
          return true;
        }
      }

      // Fuzzy match by case type/category
      if (workflow.case?.category && caseItem.type) {
        const categoryMatch = workflow.case.category.toLowerCase().includes(caseItem.type.toLowerCase()) ||
            caseItem.type.toLowerCase().includes(workflow.case.category.toLowerCase());
        if (categoryMatch) {
          return true;
        }
      }

      return false;
    });

    return matchingWorkflow;
  };

  // Function to get workflow case numbers for display (from CasesPage)
  const getWorkflowCaseNumbers = (workflow: any) => {
    const caseNumbers: Array<{type: string, number: string, source: string}> = [];
    
    // Ensure workflow is an object
    if (!workflow || typeof workflow !== 'object') {
      return caseNumbers;
    }
    
    // Get case number from case object
    if (workflow.case?.caseNumber && typeof workflow.case.caseNumber === 'string') {
      caseNumbers.push({
        type: 'Case',
        number: String(workflow.case.caseNumber),
        source: 'case'
      });
    }
    
    // Get form case IDs
    if (workflow.formCaseIds && typeof workflow.formCaseIds === 'object' && Object.keys(workflow.formCaseIds).length > 0) {
      Object.entries(workflow.formCaseIds).forEach(([formName, caseId]) => {
        if (typeof formName === 'string' && caseId) {
          caseNumbers.push({
            type: String(formName),
            number: String(caseId),
            source: 'form'
          });
        }
      });
    }
    
    return caseNumbers;
  };

  // Filter cases if user is a client
  const filteredCases = isClient && user?.id
    ? cases.filter((c: any) => c.clientId === user.id)
    : cases;

  // Filter upcoming tasks with better validation and mapping from tasksFromAPI
  const upcomingDeadlines = tasks
    .filter((task: any) => {
      // Validate task structure from API response
      if (!task || typeof task !== 'object' || !task.dueDate) {
        console.log('❌ Filtering out task - missing structure or dueDate:', task);
        return false;
      }
      
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      
      // Check if due date is valid
      if (isNaN(dueDate.getTime())) {
        console.log('❌ Filtering out task - invalid dueDate:', task.dueDate, task);
        return false;
      }
      
      // Include tasks that are due in the future OR overdue by less than 7 days
      const daysDifference = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isRecentOrUpcoming = daysDifference >= -7; // Include tasks overdue by up to 7 days
      
      if (!isRecentOrUpcoming) {
        console.log('❌ Filtering out task - too old (more than 7 days overdue):', {
          dueDate: dueDate.toISOString(),
          now: now.toISOString(),
          daysDifference,
          task: task.title
        });
        return false;
      }
      
      // Filter by user if client - check assignedTo object and other possible user references
      if (isClient && user?.id) {
        const assignedToId = task.assignedTo?._id || task.assignedTo?.id || task.assignedTo;
        const createdById = task.createdBy?._id || task.createdBy?.id || task.createdBy;
        
        const isAssignedToUser = assignedToId === user.id || 
                                createdById === user.id ||
                                task.clientId === user.id;
        if (!isAssignedToUser) {
          console.log('❌ Filtering out task - not assigned to client:', {
            taskTitle: task.title,
            assignedToId,
            createdById,
            clientId: task.clientId,
            userId: user.id
          });
          return false;
        }
      }
      
      
      return true;
    })
    .map((task: any) => {
      // Enhanced mapping from tasksFromAPI response structure
      const assignedTo = task.assignedTo || {};
      const createdBy = task.createdBy || {};
      
      return {
        id: task._id || task.id,
        title: task.title || task.name || task.description || 'Untitled Task',
        description: task.description || task.notes || '',
        status: task.status || 'Pending',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        
        // Case relationship mapping - using relatedCaseId from API
        caseId: task.relatedCaseId || task.caseId,
        caseName: task.caseName || task.relatedCase?.title || task.relatedCase?.name,
        caseNumber: task.caseNumber || task.relatedCase?.caseNumber || task.relatedCaseId,
        
        // Client relationship mapping
        clientId: task.clientId,
        clientName: task.clientName || task.client?.name || 
                   (task.client?.firstName && task.client?.lastName ? 
                    `${task.client.firstName} ${task.client.lastName}` : ''),
        
        // Assignment mapping - handle nested objects from API
        assignedTo: assignedTo._id || assignedTo.id || assignedTo,
        assignedToName: assignedTo.firstName && assignedTo.lastName ? 
                       `${assignedTo.firstName} ${assignedTo.lastName}` : 
                       assignedTo.name || '',
        assignedToEmail: assignedTo.email || '',
        
        assignedBy: createdBy._id || createdBy.id || createdBy,
        assignedByName: createdBy.firstName && createdBy.lastName ? 
                       `${createdBy.firstName} ${createdBy.lastName}` : 
                       createdBy.name || '',
        
        // Additional API fields
        type: task.type || 'General',
        category: task.category || 'Task',
        isUrgent: task.isUrgent || task.priority === 'High' || task.priority === 'Urgent',
        isOverdue: task.isOverdue || false,
        daysUntilDue: task.daysUntilDue || 0,
        reminderSent: task.reminderSent || false,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        
        // Additional metadata
        attachments: task.attachments || [],
        reminders: task.reminders || [],
        tags: task.tags || [],
        history: task.history || [],
        notes: task.notes || '',
        
        // Form and workflow relationships
        formNumber: task.formNumber || task.form?.number,
        workflowId: task.workflowId || task.workflow?._id,
        
        // Computed fields
        daysLeft: Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
    })
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Debug upcoming deadlines mapping
  // console.log('📊 Dashboard: Upcoming deadlines mapping result:', {
  //   totalTasksFromAPI: tasks.length,
  //   filteredUpcomingDeadlines: upcomingDeadlines.length,
  //   sampleTasks: tasks.slice(0, 3).map(task => ({
  //     id: task._id || task.id,
  //     title: task.title,
  //     dueDate: task.dueDate,
  //     dueDateParsed: task.dueDate ? new Date(task.dueDate).toISOString() : null,
  //     isValidDate: task.dueDate ? !isNaN(new Date(task.dueDate).getTime()) : false,
  //     isFuture: task.dueDate ? new Date(task.dueDate) > new Date() : false,
  //     assignedTo: task.assignedTo,
  //     clientId: task.clientId
  //   })),
  //   userContext: { isClient, userId: user?.id },
  //   currentTime: new Date().toISOString(),
  //   upcomingDeadlinesSample: upcomingDeadlines.slice(0, 2).map(task => ({
  //     id: task.id,
  //     title: task.title,
  //     dueDate: task.dueDate,
  //     caseId: task.caseId,
  //     clientName: task.clientName,
  //     assignedToName: task.assignedToName,
  //     isOverdue: task.isOverdue,
  //     isUrgent: task.isUrgent,
  //     daysLeft: task.daysLeft
  //   }))
  // });

  // console.log('🔍 Using deadlines for display:', {
  //   deadlinesCount: upcomingDeadlines.length,
  //   realDeadlines: upcomingDeadlines.slice(0, 2)
  // });

  // Status counts for charts with validation
  const statusCounts = filteredCases.reduce((acc: any, c: any) => {
    if (c && c.status && typeof c.status === 'string') {
      acc[c.status] = (acc[c.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  // Type data for charts with proper mapping from API response
  const typeData = [
    { name: 'Naturalization', cases: filteredCases.filter((c: any) => c?.type === 'Naturalization').length },
    { name: 'Family-Based', cases: filteredCases.filter((c: any) => c?.type === 'Family-Based').length },
    { name: 'Employment-Based', cases: filteredCases.filter((c: any) => c?.type === 'Employment-Based').length },
    { name: 'Humanitarian', cases: filteredCases.filter((c: any) => c?.type === 'Humanitarian').length },
    { name: 'Business', cases: filteredCases.filter((c: any) => c?.type === 'Business').length },
    {
      name: 'Other', cases: filteredCases.filter((c: any) =>
        c?.type && !['Naturalization', 'Family-Based', 'Employment-Based', 'Humanitarian', 'Business'].includes(c.type)
      ).length
    }
  ].filter(item => item.cases > 0); // Only show categories with cases

  

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Individual User Dashboard Layout - No questionnaires, focused on immigration process
  const renderIndividualUserDashboard = () => {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}</h1>
          <p className="text-gray-500">Track your personal immigration journey and manage your case.</p>
        </div>

        {/* Quick Stats for Individual Users */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">My Cases</p>
                <p className="text-2xl font-bold mt-1">{filteredCases.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <FileText size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/cases" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View my cases →
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Upcoming Deadlines</p>
                <p className="text-2xl font-bold mt-1">{upcomingDeadlines.length}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/tasks" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                View deadlines →
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Documents</p>
                <p className="text-2xl font-bold mt-1">{
                  filteredCases.reduce((sum: number, c: any) => sum + (c.documents?.length || 0), 0)
                }</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <FileCheck size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/documents" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Manage documents →
              </Link>
            </div>
          </div>
        </div>

        {/* Main Individual User Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Primary actions and case overview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Start New Immigration Process */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Immigration Process</h2>
                  <p className="text-sm text-gray-500 mt-1">Start your immigration application journey</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
                    <FileText size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Immigration Case</h3>
                    <p className="text-gray-600 mb-4">
                      Begin your immigration application with our step-by-step process. We'll guide you through 
                      personal details, case setup, form selection, and auto-fill capabilities.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/immigration-process/individual"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Start New Application
                      </Link>
                      <Link
                        to="/cases"
                        className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        <Folder className="w-5 h-5 mr-2" />
                        View Existing Cases
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Cases */}
            {filteredCases.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">My Immigration Cases</h2>
                  <Link to="/cases" className="text-sm text-primary-600 hover:text-primary-700">
                    View all
                  </Link>
                </div>

                <div className="space-y-4">
                  {filteredCases.slice(0, 3).map((caseItem: any, caseIndex: number) => {
                    if (!caseItem || typeof caseItem !== 'object') {
                      return null;
                    }

                    const caseId = String(caseItem.id || caseItem._id || '');
                    const caseNumber = String(caseItem.caseNumber || caseItem.title || 'No Case Number');
                    const caseType = String(caseItem.type || 'Immigration Case');
                    const caseStatus = String(caseItem.status || 'Unknown');

                    if (!caseId) return null;

                    return (
                      <Link
                        key={caseId}
                        to={`/cases/${caseId}`}
                        className="block p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-base font-medium text-gray-900">{caseNumber}</h3>
                            <p className="text-sm text-gray-600 mt-1">{caseType}</p>
                            {caseItem.description && (
                              <p className="text-xs text-gray-500 mt-1">{caseItem.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              caseStatus.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              caseStatus.toLowerCase() === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              caseStatus.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                              caseStatus.toLowerCase() === 'draft' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {caseStatus}
                            </span>
                            {caseItem.dueDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {new Date(caseItem.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions for Individual Users */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/documents"
                  className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
                    <Folder size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">Manage Documents</p>
                    <p className="text-sm text-gray-500">Upload and organize your documents</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>

                <Link
                  to="/foia-tracker"
                  className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <FileSearch size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">Case Status Tracker</p>
                    <p className="text-sm text-gray-500">Track your case progress with USCIS</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>

                <Link
                  to="/forms"
                  className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-3 bg-purple-100 rounded-lg text-purple-600 mr-4">
                    <FileCheck size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">My Forms</p>
                    <p className="text-sm text-gray-500">View and download completed forms</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>

                <Link
                  to="/immigration-process/individual"
                  className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-3 bg-orange-100 rounded-lg text-orange-600 mr-4">
                    <Plus size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900">New Application</p>
                    <p className="text-sm text-gray-500">Start a new immigration case</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right column - Status and deadlines */}
          <div className="space-y-8">
            {/* Case Status Chart */}
            {filteredCases.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-medium mb-4">My Case Status</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
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
                  upcomingDeadlines.map((task: any, taskIndex: number) => {
                    if (!task || typeof task !== 'object' || !task.id) {
                      return null;
                    }
                    
                    const taskId = String(task.id);
                    const taskTitle = String(task.title);
                    const taskDueDate = task.dueDate;
                    const daysLeft = task.daysLeft || 0;
                    const isUrgent = task.isUrgent || task.isOverdue || daysLeft <= 3;

                    return (
                      <div
                        key={taskId}
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
                            <p className={`text-sm font-medium ${isUrgent ? 'text-error-600' : 'text-gray-900'}`}>
                              {taskTitle}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">
                                Due: {taskDueDate ? new Date(taskDueDate).toLocaleDateString() : 'No due date'}
                              </p>
                              <p className={`text-xs font-medium ${isUrgent ? 'text-error-600' : 'text-gray-500'}`}>
                                {task.isOverdue ? 'Overdue' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                              </p>
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

            {/* Immigration Resources */}
            <div className="card">
              <h2 className="text-lg font-medium mb-4">Resources</h2>
              <div className="space-y-3">
                <a
                  href="https://www.uscis.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">USCIS Official Website</p>
                    <p className="text-xs text-gray-500">Forms, guides, and updates</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </a>

                <a
                  href="https://egov.uscis.gov/casestatus/landing.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg text-green-600 mr-3">
                    <FileSearch size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Check Case Status</p>
                    <p className="text-xs text-gray-500">Track your USCIS case</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Company Client Layout - Simplified and focused
  const renderCompanyClientDashboard = () => {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}</h1>
          <p className="text-gray-500">Track your immigration progress and manage your documents.</p>
        </div>

        {/* Loading indicator */}
        {loadingQuestionnaires && (
          <div className="mb-6 flex justify-center items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-sm text-gray-600">Loading your information...</span>
          </div>
        )}

        {/* Notification for new questionnaires */}
        {showNotification && (
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
                    Complete questionnaires <span aria-hidden="true">&rarr;</span>
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

        {/* Quick Stats for Company Clients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
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

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Documents</p>
                <p className="text-2xl font-bold mt-1">{
                  filteredCases.reduce((sum: number, c: any) => sum + (c.documents?.length || 0), 0)
                }</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <FileCheck size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/documents" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Manage documents →
              </Link>
            </div>
          </div>
        </div>

        {/* Main Company Client Layout - Single Column */}
        <div className="space-y-8">
          {/* Questionnaires Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Questionnaires</h2>
                <p className="text-sm text-gray-500 mt-1">Complete your assigned questionnaires to move your case forward</p>
              </div>
              <Link to="/my-questionnaires" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all →
              </Link>
            </div>

            <div className="space-y-4">
              {loadingQuestionnaires ? (
                <div className="py-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-sm">Loading your questionnaires...</p>
                </div>
              ) : assignments.length > 0 ? (
                assignments.slice(0, 3).map((assignment) => {
                  if (!assignment || typeof assignment !== 'object') {
                    return null;
                  }
                  
                  const assignmentId = assignment.assignment_id || assignment._id || assignment.id;
                  const title = String(assignment.questionnaire_title || assignment.formNumber || 'Questionnaire');
                  const status = String(assignment.status || 'pending');
                  const dueDate = assignment.dueDate;
                  
                  if (!assignmentId) {
                    return null;
                  }
                  
                  return (
                    <div
                      key={assignmentId}
                      className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-gray-900">{title}</h3>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              status === 'completed' ? 'bg-green-100 text-green-800' :
                              status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {status === 'completed' ? 'Completed' : 
                               status === 'in-progress' ? 'In Progress' : 'Pending'}
                            </span>
                            {dueDate && (
                              <span className="text-sm text-gray-500">
                                Due: {new Date(dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/questionnaires/fill/${assignmentId}`}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                          >
                            {status === 'completed' ? 'View' : 'Continue'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires assigned</h3>
                  <p className="text-sm">Your attorney will assign questionnaires when ready.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                to="/documents"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
                  <Folder size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">Manage Documents</p>
                  <p className="text-sm text-gray-500">Upload and view your documents</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                to="/foia-tracker"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                  <FileSearch size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">Case Status Tracker</p>
                  <p className="text-sm text-gray-500">Track your case progress</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                to="/my-questionnaires"
                className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600 mr-4">
                  <ClipboardList size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">My Questionnaires</p>
                  <p className="text-sm text-gray-500">Complete assigned forms</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Return appropriate layout based on user type
  if (isClient && user?.userType === 'companyClient') {
    return renderCompanyClientDashboard();
  }

  // Individual users get their own simplified dashboard
  if (isClient && user?.userType === 'individualUser') {
    return renderIndividualUserDashboard();
  }

  // Original dashboard layout for attorneys, paralegals, admins
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName} {user?.lastName}</p>
      </div>

      {/* Loading indicator */}
      {(loadingWorkflowData || loadingWorkflows || loadingQuestionnaires) && (
        <div className="mb-6 flex justify-center items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-sm text-gray-600">
            {loadingWorkflowData ? 'Loading dashboard data...' : 
             loadingWorkflows ? 'Loading workflows...' : 
             'Loading questionnaires...'}
          </span>
        </div>
      )}

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

        {/* <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Forms</p>
              <p className="text-2xl font-bold mt-1">{
                filteredCases.reduce((sum: number, c: any) => sum + (c.pendingForms || 0), 0)
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
        </div> */}

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
                <p className="text-2xl font-bold mt-1">{workflowClients.length}</p>
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
                <p className="text-gray-500 text-sm">Total Workflows</p>
                <p className="text-2xl font-bold mt-1">
                  {loadingWorkflows ? '...' : workflowStats.total}
                </p>
                {/* <p className="text-xs text-gray-500 mt-1">
                  {workflowStats.inProgress} in progress, {workflowStats.completed} completed
                </p> */}
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <FileText size={20} />
              </div>
            </div>
            {/* <div className="mt-4">
              <Link to="/workflows" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Manage workflows →
              </Link>
            </div> */}
          </div>
        )}

        {isClient && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Documents</p>
                <p className="text-2xl font-bold mt-1">{
                  filteredCases.reduce((sum: number, c: any) => sum + (c.documents?.length || 0), 0)
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
          {/* Case Type Chart - Hide for company clients */}
          {!(isClient && user?.userType === 'companyClient') && (
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
              <ResponsiveContainer width="90%" height="100%">
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
            
            {/* Debug info for case type mapping */}
            <div className="mt-2 text-xs text-gray-500">
              Total Cases: {filteredCases.length} | 
              {typeData.map(item => ` ${item.name}: ${item.cases}`).join(' |')}
            </div>
          </div>
          )}

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
                <ResponsiveContainer width="90%" height="100%">
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
              
              {/* Debug info for workflow status mapping */}
              <div className="mt-2 text-xs text-gray-500">
                Workflows: {workflowStats.total} | In Progress: {workflowStats.inProgress} | Completed: {workflowStats.completed} | Draft: {workflowStats.draft}
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
                  {filteredCases.slice(0, 4).map((caseItem: any, caseIndex: number) => {
                    // Comprehensive safety check and data cleaning
                    if (!caseItem || typeof caseItem !== 'object' || Array.isArray(caseItem)) {
                      console.warn('Invalid case item at index', caseIndex, caseItem);
                      return null;
                    }

                    // Clean the case data by removing Mongoose metadata
                    const cleanCaseData = {
                      id: caseItem.id || caseItem._id,
                      _id: caseItem._id || caseItem.id,
                      caseNumber: caseItem.caseNumber || caseItem.title || 'No Case Number',
                      type: caseItem.type || 'Unknown',
                      status: caseItem.status || 'Unknown',
                      clientId: caseItem.clientId,
                      clientName: caseItem.clientName || 'Unknown Client',
                      workflowId: caseItem.workflowId,
                      formCaseIds: caseItem.formCaseIds && typeof caseItem.formCaseIds === 'object' 
                        ? Object.fromEntries(
                            Object.entries(caseItem.formCaseIds).filter(([key, value]) => 
                              !key.startsWith('$') && typeof key === 'string' && value
                            )
                          )
                        : {}
                    };

                    // Ensure all properties are strings/primitives for display
                    const caseId = String(cleanCaseData.id || '');
                    const caseNumber = String(cleanCaseData.caseNumber);
                    const caseType = String(cleanCaseData.type);
                    const caseStatus = String(cleanCaseData.status);
                    const clientName = String(cleanCaseData.clientName);

                    if (!caseId) {
                      console.warn('Skipping case without valid ID', cleanCaseData);
                      return null;
                    }

                    const client = clients.find((c: any) => c.id === cleanCaseData.clientId);
                    const matchingWorkflow = getWorkflowCaseNumber(cleanCaseData);
                    
                    return (
                      <tr key={caseId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/cases/${caseId}`} className="text-primary-600 hover:text-primary-700 font-medium">
                            <div className="font-medium">{caseNumber}</div>
                            {Object.keys(cleanCaseData.formCaseIds).length > 0 && (
                              <div className="mt-1 space-y-1">
                                {Object.entries(cleanCaseData.formCaseIds).map(([formType, caseNum], index) => (
                                  <div 
                                    key={index}
                                    className="text-xs font-mono px-2 py-1 rounded inline-block mr-1 bg-green-50 text-green-600"
                                  >
                                    {String(formType)}: {String(caseNum)}
                                  </div>
                                ))}
                              </div>
                            )}
                            {matchingWorkflow && (
                              <div className="text-xs text-purple-600 mt-1">
                                📋 Workflow Status: {String(matchingWorkflow.status || 'in-progress')}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium">{caseType}</div>
                          {matchingWorkflow?.selectedForms && Array.isArray(matchingWorkflow.selectedForms) && matchingWorkflow.selectedForms.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              Forms: {matchingWorkflow.selectedForms.map((form: any) => String(form)).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="font-medium">{String(client?.name || clientName)}</div>
                            {client?.email && (
                              <div className="text-xs text-gray-400">{String(client.email)}</div>
                            )}
                            {matchingWorkflow?.client && (
                              <div className="text-xs text-blue-600 mt-1">
                                🔗 Linked to workflow
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${caseStatus.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              caseStatus.toLowerCase() === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                caseStatus.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                                  caseStatus.toLowerCase() === 'draft' ? 'bg-gray-100 text-gray-800' :
                                    caseStatus === 'Document Collection' ? 'bg-yellow-100 text-yellow-800' :
                                      caseStatus === 'Waiting on USCIS' ? 'bg-purple-100 text-purple-800' :
                                        caseStatus === 'RFE Received' ? 'bg-orange-100 text-orange-800' :
                                          caseStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                                            caseStatus === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {caseStatus}
                          </span>
                          {matchingWorkflow && (
                            <div className="mt-1">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                Step {String(matchingWorkflow.currentStep || 1)}
                              </span>
                            </div>
                          )}
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
                    label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="#2d66c2ff" 
                          textAnchor={x > cx ? 'start' : 'end'} 
                          dominantBaseline="central"
                          fontSize="14"
                          fontWeight="500"
                        >
                          {`${name}: ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    outerRadius={60}
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

                    {/* <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">
                        Total: {workflowStats.total} workflows from {availableWorkflows.length} records
                      </div>
                      <Link 
                        to="/workflows" 
                        className="block w-full text-center py-2 px-4 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 font-medium"
                      >
                        Manage All Workflows
                      </Link>
                    </div> */}
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
                upcomingDeadlines.map((task: any, taskIndex: number) => {
                  // Safety check to prevent rendering objects
                  if (!task || typeof task !== 'object' || !task.id) {
                    console.warn('Skipping invalid task at index', taskIndex, task);
                    return null;
                  }
                  
                  // Use the mapped task properties from tasksFromAPI
                  const taskId = String(task.id);
                  const taskTitle = String(task.title);
                  const taskStatus = String(task.status);
                  const taskDueDate = task.dueDate;
                  const taskDescription = String(task.description || '');
                  const taskPriority = String(task.priority);
                  
                  // Use the mapped case identifier from API (relatedCaseId)
                  const caseIdentifier = task.caseId; // This is now correctly mapped from relatedCaseId
                  const relatedCase = cases.find((c: any) => 
                    c.id === caseIdentifier || 
                    c.caseNumber === caseIdentifier?.split(' ')[0] ||
                    c._id === caseIdentifier ||
                    c.caseNumber === caseIdentifier
                  );
                  
                  const matchingWorkflow = relatedCase ? getWorkflowCaseNumber(relatedCase) : null;
                  const workflowCaseNumbers = matchingWorkflow ? getWorkflowCaseNumbers(matchingWorkflow) : [];
                  
                  // Use the pre-calculated daysLeft from mapping or calculate fresh
                  const daysLeft = task.daysLeft || Math.ceil(
                    (new Date(taskDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  // Enhanced urgency detection using API data
                  const isUrgent = task.isUrgent || task.isOverdue || 
                                  taskPriority === 'High' || taskPriority === 'Urgent' ||
                                  daysLeft <= 3;

                  return (
                    <div
                      key={taskId}
                      className={`p-3 rounded-lg border ${isUrgent || task.isOverdue
                        ? 'border-error-200 bg-error-50'
                        : 'border-gray-200 bg-white'
                        }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 ${isUrgent || task.isOverdue ? 'text-error-500' : 'text-gray-400'}`}>
                          {isUrgent || task.isOverdue ? <AlertCircle size={18} /> : <CalendarDays size={18} />}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${isUrgent || task.isOverdue ? 'text-error-600' : 'text-gray-900'}`}>
                                {taskTitle}
                              </p>
                              {taskDescription && (
                                <p className="text-xs text-gray-500 mt-1">{taskDescription}</p>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              <p className={`text-xs font-medium ${isUrgent || task.isOverdue ? 'text-error-600' : 'text-gray-500'}`}>
                                {task.isOverdue ? 'Overdue' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                              </p>
                              {taskPriority && taskPriority !== 'Medium' && (
                                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                                  taskPriority === 'High' || taskPriority === 'Urgent' 
                                    ? 'bg-red-100 text-red-800' 
                                    : taskPriority === 'Low' 
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {taskPriority}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <div className="flex items-center justify-between">
                              <div>
                                {/* Use mapped task data for client and case information */}
                                <span>Client: {task.clientName || getClientNameForCase(caseIdentifier) || 'Unknown Client'}</span>
                                <span className="ml-2">Case: {task.caseNumber || relatedCase?.caseNumber || caseIdentifier || 'No Case'}</span>
                              </div>
                            </div>
                            
                            {/* Show assigned to information from API */}
                            {task.assignedToName && (
                              <div className="mt-1">
                                <span className="text-blue-600">
                                  Assigned to: {task.assignedToName}
                                </span>
                                {task.assignedToEmail && (
                                  <span className="ml-1 text-gray-400">({task.assignedToEmail})</span>
                                )}
                              </div>
                            )}
                            
                            {workflowCaseNumbers.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {workflowCaseNumbers.map((caseNum: any, index: number) => {
                                  // Safety check to ensure we have valid data
                                  if (!caseNum || typeof caseNum !== 'object' || !caseNum.type || !caseNum.number) {
                                    return null;
                                  }
                                  return (
                                    <span 
                                      key={index}
                                      className={`text-xs font-mono px-2 py-1 rounded inline-block mr-1 ${
                                        caseNum.source === 'case' 
                                          ? 'text-blue-600 bg-blue-50' 
                                          : 'text-green-600 bg-green-50'
                                      }`}
                                    >
                                      {caseNum.type}: {caseNum.number}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {matchingWorkflow && (
                              <div className="text-xs text-purple-600 mt-1">
                                📋 Workflow Status: {String(matchingWorkflow.status || 'in-progress')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Due: {taskDueDate ? new Date(taskDueDate).toLocaleDateString() : 'No due date'}
                            </p>
                            <div className="flex gap-2">
                              {/* Show task tags if available from API */}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {task.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                                    <span key={tagIndex} className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                ${taskStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                                  taskStatus === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    taskStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {taskStatus}
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
                  assignments.map((assignment, index) => {
                    // Extra safety check to prevent rendering objects
                    if (!assignment || typeof assignment !== 'object') {
                      console.warn('Skipping invalid assignment at index', index, assignment);
                      return null;
                    }
                    
                    const assignmentId = assignment.assignment_id || assignment._id || assignment.id;
                    const title = String(assignment.questionnaire_title || assignment.formNumber || 'Questionnaire');
                    const status = String(assignment.status || 'pending');
                    const dueDate = assignment.dueDate;
                    
                    if (!assignmentId) {
                      console.warn('Skipping assignment without valid ID', assignment);
                      return null;
                    }
                    
                    return (
                      <div
                        key={assignmentId}
                        className="p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                            </p>
                          </div>
                          <div>
                            <Link
                              to={`/questionnaires/fill/${assignmentId}`}
                              className="inline-flex items-center px-3 py-1 text-xs rounded-md bg-primary-100 text-primary-700 hover:bg-primary-200"
                            >
                              {status === 'completed' ? 'View Responses' : 'Continue Questionnaire'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <ClipboardList className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm">No questionnaires assigned</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;