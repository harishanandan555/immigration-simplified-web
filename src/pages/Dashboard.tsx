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
import { getDocumentsByClient } from '../controllers/DocumentControllers';
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
  const [documents, setDocuments] = useState<any[]>([]);
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
              clientId: user._id || user.id, // Individual user is their own client
              userId: user._id || user.id,
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

          // Load documents for individual user
          try {
            const docsResponse = await getDocumentsByClient(user._id);
            console.log('📄 Document response:', docsResponse);
            
            // Check if documents exist in the response
            const responseDocuments = docsResponse.data?.data?.documents || docsResponse.data?.documents || [];
            
            if (docsResponse.success && responseDocuments.length > 0) {
              setDocuments(responseDocuments);
              console.log('✅ Loaded documents for individual user:', responseDocuments.length);
            } else {
              // If no documents found by client, try loading by cases
              console.log('⚠️ No documents found by clientId, trying to load from cases...');
              const allCaseDocuments: any[] = [];
              
              if (casesResponse.success && casesResponse.cases) {
                casesResponse.cases.forEach((caseItem: any) => {
                  console.log('📦 Case documents:', caseItem.caseNumber, caseItem.documents?.length || 0, caseItem.documents);
                  if (caseItem.documents && Array.isArray(caseItem.documents)) {
                    allCaseDocuments.push(...caseItem.documents);
                  }
                });
              }
              
              setDocuments(allCaseDocuments);
              console.log(`✅ Loaded ${allCaseDocuments.length} documents from cases`);
            }
          } catch (docError) {
            console.error('❌ Error loading documents for individual user:', docError);
            setDocuments([]);
          }
        } catch (error) {
          console.error('Error loading cases for individual user:', error);
          setCases([]);
          setDocuments([]);
        } finally {
          setLoadingWorkflowData(false);
          setLoadingWorkflows(false);
        }
        return;
      }
      
      // Only load workflow data for attorneys and super admins
      if (!isAttorney && !isSuperAdmin) {
        // For company clients, still load their documents
        if (isClient && user?.userType === 'companyClient') {
          try {
            setLoadingWorkflowData(true);
            const userId = user._id || user.id;
            
            // Load documents for company client
            const docsResponse = await getDocumentsByClient(userId);
            console.log('📄 Company client document response:', docsResponse);
            
            const responseDocuments = docsResponse.data?.data?.documents || docsResponse.data?.documents || [];
            
            if (docsResponse.success && responseDocuments.length > 0) {
              setDocuments(responseDocuments);
              console.log('✅ Loaded documents for company client:', responseDocuments.length);
            } else {
              setDocuments([]);
              console.log('⚠️ No documents found for company client');
            }
          } catch (error) {
            console.error('❌ Error loading documents for company client:', error);
            setDocuments([]);
          } finally {
            setLoadingWorkflowData(false);
          }
        } else {
          setLoadingWorkflowData(false);
        }
        
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
  const filteredCases = isClient && (user?.id || user?._id)
    ? cases.filter((c: any) => 
        c.clientId === user.id || 
        c.clientId === user._id || 
        c.userId === user.id || 
        c.userId === user._id
      )
    : cases;

  // Filter upcoming tasks with better validation and mapping from tasksFromAPI
  // For individual users, use case due dates as deadlines
  const upcomingDeadlines = (isClient && user?.userType === 'individualUser') 
    ? filteredCases
        .filter((c: any) => c.dueDate)
        .map((c: any) => {
          const dueDate = new Date(c.dueDate);
          const now = new Date();
          const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0;
          const isUrgent = daysLeft <= 3 && daysLeft >= 0;

          return {
            id: c._id || c.id,
            title: c.description || c.title || c.caseNumber || 'Immigration Case',
            dueDate: c.dueDate,
            daysLeft: Math.abs(daysLeft),
            isOverdue,
            isUrgent,
            caseId: c._id || c.id
          };
        })
        .filter((d: any) => {
          const dueDate = new Date(d.dueDate);
          const now = new Date();
          const daysDifference = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysDifference >= -7; // Show upcoming or recently overdue (within 7 days)
        })
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
    : tasks
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

  // Status counts for charts with validation - normalize to avoid duplicates
  const statusCounts = filteredCases.reduce((acc: any, c: any) => {
    if (c && c.status && typeof c.status === 'string') {
      // Normalize status to title case to avoid duplicates like "active" and "Active"
      const normalizedStatus = c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase();
      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
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
              <Link to="/cases" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                View deadlines →
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Documents</p>
                <p className="text-2xl font-bold mt-1">
                  {(isClient && user?.userType === 'individualUser') 
                    ? (documents.length > 0 ? documents.length : filteredCases.reduce((sum: number, c: any) => sum + (c.documents?.length || 0), 0))
                    : filteredCases.reduce((sum: number, c: any) => sum + (c.documents?.length || 0), 0)
                  }
                </p>
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
                  {filteredCases.slice(0, 3).map((caseItem: any) => {
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
            {/* Case Status Overview */}
            {filteredCases.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-medium mb-4">My Case Status</h2>
                
                <div className="space-y-3">
                  {statusData.length > 0 ? (
                    statusData.map((status, index) => {
                      const percentage = filteredCases.length > 0 
                        ? ((status.value / filteredCases.length) * 100).toFixed(0) 
                        : 0;
                      const statusColors: Record<string, { bg: string; text: string; bar: string }> = {
                        'pending': { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500' },
                        'in-progress': { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
                        'completed': { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
                        'draft': { bg: 'bg-gray-50', text: 'text-gray-700', bar: 'bg-gray-500' },
                        'active': { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-500' },
                        'new': { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' }
                      };
                      
                      const statusKey = status.name.toLowerCase().replace(/\s+/g, '-');
                      const colors = statusColors[statusKey] || { 
                        bg: 'bg-gray-50', 
                        text: 'text-gray-700', 
                        bar: COLORS[index % COLORS.length].replace('#', 'bg-[#') + ']'
                      };
                      
                      return (
                        <div key={index} className={`${colors.bg} rounded-lg p-3 border border-gray-200`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${colors.bar}`}></div>
                              <span className={`text-sm font-semibold ${colors.text} uppercase tracking-wide`}>
                                {status.name}
                              </span>
                            </div>
                            <span className={`text-xl font-bold ${colors.text}`}>{status.value}</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>{percentage}% of total</span>
                              <span className="font-medium">{status.value} / {filteredCases.length}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${colors.bar} h-2 rounded-full transition-all duration-700`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-2 text-sm">No cases to display</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Deadlines */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Upcoming Deadlines</h2>
                <Link to="/documents" className="text-sm text-primary-600 hover:text-primary-700">
                  View documents
                </Link>
              </div>

              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((task: any) => {
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
                <p className="text-gray-500 text-sm">My Documents</p>
                <p className="text-2xl font-bold mt-1">
                  {loadingWorkflowData ? '...' : documents.length}
                </p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Case overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Type Distribution - Modern Vertical Bar Chart */}
          {!(isClient && user?.userType === 'companyClient') && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Cases by Type</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{filteredCases.length} total cases</p>
                </div>
              </div>

              <div className="space-y-4">
                {typeData.map((item, index) => {
                  const percentage = filteredCases.length > 0 
                    ? ((item.cases / filteredCases.length) * 100) 
                    : 0;
                  const barColors = [
                    '#3b82f6', // blue
                    '#10b981', // emerald
                    '#f59e0b', // amber
                    '#8b5cf6', // violet
                    '#ef4444', // rose
                    '#6366f1'  // indigo
                  ];
                  const barColor = barColors[index];
                  
                  return (
                    <div key={index} className="flex items-center gap-4">
                      {/* Label */}
                      <div className="w-32 text-sm font-medium text-gray-700">
                        {item.name}
                      </div>
                      
                      {/* Bar */}
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3"
                            style={{ 
                              width: `${percentage}%`,
                              minWidth: item.cases > 0 ? '60px' : '0%',
                              backgroundColor: barColor
                            }}
                          >
                            <span className="text-white text-sm font-semibold">{item.cases}</span>
                          </div>
                        </div>
                        
                        {/* Percentage */}
                        <div className="w-16 text-sm text-gray-600 font-medium text-right">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
          )}

          {/* Workflow Status Overview for Attorneys/Admins */}
          {(isAttorney || isSuperAdmin) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Workflow Status</h2>
                <p className="text-sm text-gray-500 mt-0.5">{workflowStats.total} total workflows</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg mb-3">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{workflowStats.inProgress}</p>
                  <p className="text-xs text-gray-600 mt-1">In Progress</p>
                </div>

                <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-lg mb-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{workflowStats.completed}</p>
                  <p className="text-xs text-gray-600 mt-1">Completed</p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-400 rounded-lg mb-3">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{workflowStats.draft}</p>
                  <p className="text-xs text-gray-600 mt-1">Draft</p>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold text-gray-900">
                    {workflowStats.total > 0 
                      ? ((workflowStats.completed / workflowStats.total) * 100).toFixed(0) 
                      : 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ 
                      width: `${workflowStats.total > 0 ? (workflowStats.completed / workflowStats.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Status & Quick Info */}
        <div className="space-y-6">
          {/* Case Status Overview - Professional Pie Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Status Distribution</h2>
            
            {statusData.length > 0 ? (
              <div className="space-y-6">
                {/* Pie Chart Visual */}
                <div className="relative h-48 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    {/* Donut Chart */}
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {statusData.map((status, index) => {
                        const statusColors: Record<string, string> = {
                          'pending': '#f59e0b',
                          'in-progress': '#3b82f6',
                          'completed': '#10b981',
                          'draft': '#9ca3af',
                          'active': '#6366f1',
                          'new': '#8b5cf6'
                        };
                        
                        const statusKey = status.name.toLowerCase().replace(/\s+/g, '-');
                        const fillColor = statusColors[statusKey] || COLORS[index % COLORS.length];
                        
                        // Calculate arc parameters
                        const total = statusData.reduce((sum, s) => sum + s.value, 0);
                        const percentage = (status.value / total) * 100;
                        const previousPercentage = statusData.slice(0, index).reduce((sum, s) => sum + (s.value / total) * 100, 0);
                        
                        const radius = 40;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((previousPercentage / 100) * circumference);
                        
                        return (
                          <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={fillColor}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-700"
                          />
                        );
                      })}
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-gray-900">{filteredCases.length}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3">
                  {statusData.map((status, index) => {
                    const percentage = filteredCases.length > 0 
                      ? ((status.value / filteredCases.length) * 100).toFixed(1) 
                      : 0;
                    const statusColors: Record<string, { dot: string; bg: string }> = {
                      'pending': { dot: 'bg-amber-500', bg: 'bg-amber-50' },
                      'in-progress': { dot: 'bg-blue-500', bg: 'bg-blue-50' },
                      'completed': { dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
                      'draft': { dot: 'bg-gray-400', bg: 'bg-gray-50' },
                      'active': { dot: 'bg-indigo-500', bg: 'bg-indigo-50' },
                      'new': { dot: 'bg-violet-500', bg: 'bg-violet-50' }
                    };
                    
                    const statusKey = status.name.toLowerCase().replace(/\s+/g, '-');
                    const colors = statusColors[statusKey] || { dot: 'bg-gray-400', bg: 'bg-gray-50' };
                    
                    return (
                      <div key={index} className={`${colors.bg} rounded-lg p-3 border border-gray-200`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                          <span className="text-xs font-medium text-gray-700">{status.name}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">{status.value}</span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="mx-auto h-10 w-10 mb-2" />
                <p className="text-sm">No cases yet</p>
              </div>
            )}
          </div>

          {/* Quick Stats for Attorneys/Admins */}
          {(isAttorney || isSuperAdmin) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <span className="text-lg font-bold">{workflowStats.inProgress}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Done</span>
                  </div>
                  <span className="text-lg font-bold">{workflowStats.completed}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl text-white">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Clients</span>
                  </div>
                  <span className="text-lg font-bold">{workflowClients.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Deadlines</h2>
              <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>

            <div className="space-y-2.5">{upcomingDeadlines.length > 0 ? (
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
                      className={`p-3 rounded-lg border transition-all ${isUrgent || task.isOverdue
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-0.5 ${isUrgent || task.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                          {isUrgent || task.isOverdue ? <AlertCircle size={16} /> : <CalendarDays size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isUrgent || task.isOverdue ? 'text-red-900' : 'text-gray-900'}`}>
                            {taskTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {taskDueDate ? new Date(taskDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                            </p>
                            <span className="text-xs text-gray-300">•</span>
                            <p className={`text-xs font-medium ${isUrgent || task.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                              {task.isOverdue ? 'Overdue' : `${daysLeft}d left`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">All clear!</p>
                </div>
              )}
            </div>
          </div>

          {/* Questionnaires */}
          {isClient && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Questionnaires</h2>
                <Link to="/my-questionnaires" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all →
                </Link>
              </div>

              <div className="space-y-2.5">{loadingQuestionnaires ? (
                  <div className="py-8 text-center text-gray-400">
                    <p className="text-sm">Loading...</p>
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
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Due: {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                            </p>
                          </div>
                          <Link
                            to={`/questionnaires/fill/${assignmentId}`}
                            className="ml-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            {status === 'completed' ? 'View' : 'Start'}
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <ClipboardList className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">No questionnaires</p>
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