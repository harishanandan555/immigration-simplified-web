import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Briefcase, PlusCircle, Download, Eye, Clock, FolderOpen, CheckCircle } from 'lucide-react';
import {
  Document,
  getDocuments,
  downloadDocument,
  previewDocument
} from '../../controllers/DocumentControllers';
import { getClientById, Client, getClientCases } from '../../controllers/ClientControllers';
import { getWorkflowsByClient, fetchWorkflows } from '../../controllers/LegalFirmWorkflowController';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ClientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Document-related state
  const [clientDocuments, setClientDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Activity-related state
  const [activities, setActivities] = useState<any[]>([]);

  // Workflow-related state
  const [clientWorkflows, setClientWorkflows] = useState<any[]>([]);

  // Function to refresh workflows (keeping for potential future use)
  // const refreshWorkflows = async () => {
  //   if (id && client) {
  //     await fetchClientWorkflows(id, client);
  //   }
  // };
  const fetchClientWorkflows = async (clientId: string, clientData?: any) => {
    try {
      // Clear any previous error

      const clientEmail = (clientData || client)?.email?.trim().toLowerCase() || '';

      console.log('🔄 Starting comprehensive workflow fetch for client:', {
        clientId,
        clientEmail,
        clientName: (clientData || client)?.name,
        hasClientData: !!clientData
      });

      let workflows: any[] = [];
      let workflowFetchSuccess = false;

      // Strategy 1: Use enhanced getWorkflowsByClient with client ID (primary method)
      try {
        console.log('📡 Strategy 1: Using enhanced getWorkflowsByClient with client ID...');
        const workflowResponse = await getWorkflowsByClient(clientId, {
          page: 1,
          limit: 50,
          includeQuestions: true
        });

        console.log("Response", workflowResponse);



        if (workflowResponse.success && workflowResponse.data && workflowResponse.data.length > 0) {
          workflows = workflowResponse.data;
          workflowFetchSuccess = true;
          console.log('✅ Strategy 1 SUCCESS: Found workflows by client ID:', workflows.length);

          // Extract and update client data from workflow response
          if (workflows[0]?.client) {
            const clientFromWorkflow = workflows[0].client;
            console.log('🔄 Updating client data from workflow response:', clientFromWorkflow);

            // Update the client state with the more complete data from workflow
            if (clientFromWorkflow._id === clientId || clientFromWorkflow.clientId === clientId) {
              setClient(prevClient => ({
                ...prevClient,
                ...clientFromWorkflow,
                // Ensure proper field mapping
                _id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?._id,
                id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?.id,
                name: clientFromWorkflow.name || `${clientFromWorkflow.firstName || ''} ${clientFromWorkflow.lastName || ''}`.trim(),
                // Preserve any existing data while updating with workflow data
                address: clientFromWorkflow.address || prevClient?.address,
                phone: clientFromWorkflow.phone || prevClient?.phone,
                email: clientFromWorkflow.email || prevClient?.email,
                socialSecurityNumber: (clientFromWorkflow as any).socialSecurityNumber || (prevClient as any)?.socialSecurityNumber,
                uscisOnlineAccountNumber: (clientFromWorkflow as any).uscisOnlineAccountNumber || (prevClient as any)?.uscisOnlineAccountNumber,
                alienRegistrationNumber: clientFromWorkflow.alienRegistrationNumber || prevClient?.alienRegistrationNumber,
                nationalIdNumber: (clientFromWorkflow as any).nationalIdNumber || (prevClient as any)?.nationalIdNumber,
                immigrationPurpose: (clientFromWorkflow as any).immigrationPurpose || (prevClient as any)?.immigrationPurpose,
                placeOfBirth: (clientFromWorkflow as any).placeOfBirth || (prevClient as any)?.placeOfBirth,
                nationality: clientFromWorkflow.nationality || prevClient?.nationality,
                passportNumber: clientFromWorkflow.passportNumber || prevClient?.passportNumber,
                dateOfBirth: clientFromWorkflow.dateOfBirth || prevClient?.dateOfBirth,
                status: clientFromWorkflow.status || prevClient?.status
              } as Client));
            }
          }

        } else if (workflowResponse.success && workflowResponse.count === 0) {
          console.log('ℹ️ Strategy 1: No workflows found for client ID, this is normal for new clients');
        } else {
          console.log('⚠️ Strategy 1: API returned unsuccessful response:', workflowResponse.error);
        }
      } catch (error) {
        console.warn('⚠️ Strategy 1 FAILED: getWorkflowsByClient with ID failed:', error);
      }

      // Strategy 2: Try with client email if ID approach didn't work and we have an email
      if (!workflowFetchSuccess && clientEmail) {
        try {
          console.log('� Strategy 2: Using enhanced getWorkflowsByClient with client email...');
          const emailWorkflowResponse = await getWorkflowsByClient(clientEmail, {
            page: 1,
            limit: 50,

          });

          console.log("EMAIL RESPONSE", emailWorkflowResponse);

          if (emailWorkflowResponse.success && emailWorkflowResponse.data && emailWorkflowResponse.data.length > 0) {
            workflows = emailWorkflowResponse.data;
            workflowFetchSuccess = true;
            console.log('✅ Strategy 2 SUCCESS: Found workflows by client email:', workflows.length);

            // Extract and update client data from workflow response
            if (workflows[0]?.client) {
              const clientFromWorkflow = workflows[0].client;
              console.log('🔄 Strategy 2: Updating client data from workflow response:', clientFromWorkflow);

              setClient(prevClient => ({
                ...prevClient,
                ...clientFromWorkflow,
                _id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?._id,
                id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?.id,
                name: clientFromWorkflow.name || `${clientFromWorkflow.firstName || ''} ${clientFromWorkflow.lastName || ''}`.trim(),
              } as Client));
            }

          } else if (emailWorkflowResponse.success && emailWorkflowResponse.count === 0) {
            console.log('ℹ️ Strategy 2: No workflows found for client email');
          }
        } catch (emailError) {
          console.warn('⚠️ Strategy 2 FAILED: getWorkflowsByClient with email failed:', emailError);
        }
      }

      // Strategy 3: Fallback to general workflow search and filter locally (proven working method)
      if (!workflowFetchSuccess) {
        try {
          console.log('📡 Strategy 3: Fallback to general workflow fetch and local filtering...');

          console.log('🔍 Strategy 3: Calling fetchWorkflows with parameters:', {
            limit: 100,
            endpoint: '/api/v1/workflows',
            timestamp: new Date().toISOString()
          });

          const allWorkflows = await fetchWorkflows({
            limit: 100
          });


          console.log('📊 Strategy 3: fetchWorkflows raw response:', {
            type: typeof allWorkflows,
            isArray: Array.isArray(allWorkflows),
            length: Array.isArray(allWorkflows) ? allWorkflows.length : 'N/A',
            response: allWorkflows
          });

          if (Array.isArray(allWorkflows) && allWorkflows.length > 0) {
            console.log('📊 Fetched all workflows for filtering:', allWorkflows.length);

            // Filter workflows for this specific client with detailed logging
            workflows = allWorkflows.filter((workflow: any) => {
              const workflowClientId = workflow.clientId || workflow.client?.clientId || workflow.client?.id || workflow.client?._id;
              const workflowClientEmail = workflow.client?.email?.trim().toLowerCase();

              // Match by ID or email
              const matchesId = workflowClientId === clientId;
              const matchesEmail = clientEmail && workflowClientEmail === clientEmail;

              console.log('🔍 Workflow filter analysis:', {
                workflowId: workflow.id || workflow._id,
                workflowClientId,
                workflowClientEmail,
                targetClientId: clientId,
                targetClientEmail: clientEmail,
                matchesId,
                matchesEmail,
                finalMatch: matchesId || matchesEmail
              });

              return matchesId || matchesEmail;
            });

            if (workflows.length > 0) {
              workflowFetchSuccess = true;
              console.log('✅ Strategy 3 SUCCESS: Found workflows after local filtering:', workflows.length);

              // Extract and update client data from workflow response
              if (workflows[0]?.client) {
                const clientFromWorkflow = workflows[0].client;
                console.log('🔄 Strategy 3: Updating client data from workflow response:', clientFromWorkflow);

                setClient(prevClient => ({
                  ...prevClient,
                  ...clientFromWorkflow,
                  _id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?._id,
                  id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?.id,
                  name: clientFromWorkflow.name || `${clientFromWorkflow.firstName || ''} ${clientFromWorkflow.lastName || ''}`.trim(),
                } as Client));
              }

            } else {
              console.log('ℹ️ Strategy 3: No workflows matched after filtering');
            }
          } else {
            console.log('⚠️ Strategy 3: No workflows available to filter');
          }
        } catch (generalError: any) {
          console.error('❌ Strategy 3 FAILED: General workflow fetch failed:', {
            error: generalError,
            message: generalError?.message,
            status: generalError?.response?.status,
            statusText: generalError?.response?.statusText,
            data: generalError?.response?.data,
            stack: generalError?.stack
          });
        }
      }

      // Strategy 4: Direct API call test if all other strategies failed
      if (!workflowFetchSuccess) {
        try {
          console.log('📡 Strategy 4: Direct API test to check server connectivity...');

          const directResponse = await api.get('/api/v1/workflows', {
            params: { limit: 5 }
          });

          console.log('📊 Strategy 4: Direct API response:', {
            status: directResponse.status,
            statusText: directResponse.statusText,
            hasData: !!directResponse.data,
            dataKeys: directResponse.data ? Object.keys(directResponse.data) : [],
            dataType: typeof directResponse.data,
            rawResponse: directResponse.data
          });

          if (directResponse.data) {
            const directWorkflows = directResponse.data.data || directResponse.data.workflows || directResponse.data || [];
            console.log('📊 Strategy 4: Extracted workflows:', {
              type: typeof directWorkflows,
              isArray: Array.isArray(directWorkflows),
              length: Array.isArray(directWorkflows) ? directWorkflows.length : 'N/A'
            });

            if (Array.isArray(directWorkflows)) {
              // Try filtering these workflows
              workflows = directWorkflows.filter((workflow: any) => {
                const workflowClientId = workflow.clientId || workflow.client?.clientId || workflow.client?.id || workflow.client?._id;
                const workflowClientEmail = workflow.client?.email?.trim().toLowerCase();

                const matchesId = workflowClientId === clientId;
                const matchesEmail = clientEmail && workflowClientEmail === clientEmail;

                return matchesId || matchesEmail;
              });

              if (workflows.length > 0) {
                workflowFetchSuccess = true;
                console.log('✅ Strategy 4 SUCCESS: Found workflows after direct API filtering:', workflows.length);

                // Extract and update client data from workflow response
                if (workflows[0]?.client) {
                  const clientFromWorkflow = workflows[0].client;
                  console.log('🔄 Strategy 4: Updating client data from workflow response:', clientFromWorkflow);

                  setClient(prevClient => ({
                    ...prevClient,
                    ...clientFromWorkflow,
                    _id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?._id,
                    id: clientFromWorkflow._id || clientFromWorkflow.clientId || prevClient?.id,
                    name: clientFromWorkflow.name || `${clientFromWorkflow.firstName || ''} ${clientFromWorkflow.lastName || ''}`.trim(),
                  } as Client));
                }
              }
            }
          }
        } catch (directError: any) {
          console.error('❌ Strategy 4 FAILED: Direct API test failed:', {
            error: directError,
            message: directError?.message,
            status: directError?.response?.status,
            statusText: directError?.response?.statusText,
            data: directError?.response?.data
          });
        }
      }

      console.log('📊 Final workflow processing result:', {
        totalFound: workflows.length,
        fetchMethod: workflowFetchSuccess ? 'Direct API Success' : 'Fallback Method',
        workflowSummary: workflows.map(w => ({
          id: w.id || w._id,
          workflowId: w.workflowId,
          status: w.status,
          currentStep: w.currentStep,
          clientEmail: w.client?.email,
          clientId: w.clientId || w.client?.clientId || w.client?.id || w.client?._id,
          hasCase: !!w.case,
          hasQuestionnaireAssignment: !!w.questionnaireAssignment,
          selectedFormsCount: w.selectedForms?.length || 0,
          formCaseIdsCount: w.formCaseIds ? Object.keys(w.formCaseIds).length : 0
        }))
      });

      // Process workflows to extract case information and activities
      const processedWorkflows = workflows.map((workflow: any) => {
        // Enhanced case number extraction using the detailed workflow data
        let caseNumber = 'No Case Number';

        // Enhanced formCaseIds extraction from multiple sources
        const cleanFormCaseIds: Record<string, string> = {};

        // Method 1: Traditional formCaseIds object (legacy structure)
        if (workflow.formCaseIds && typeof workflow.formCaseIds === 'object') {
          Object.keys(workflow.formCaseIds).forEach(key => {
            // Skip Mongoose internal properties
            if (!key.startsWith('$') && !key.startsWith('_') && typeof workflow.formCaseIds[key] === 'string') {
              cleanFormCaseIds[key] = workflow.formCaseIds[key];
            }
          });
        }

        // Method 2: Extract from formNumber and questionnaireAssignment (new structure)
        if (workflow.formNumber && workflow.questionnaireAssignment?.formCaseIdGenerated) {
          cleanFormCaseIds[workflow.formNumber] = workflow.questionnaireAssignment.formCaseIdGenerated;
        }

        // Method 3: Extract from formNumber and case.caseNumber (fallback)
        if (workflow.formNumber && workflow.case?.caseNumber && !cleanFormCaseIds[workflow.formNumber]) {
          cleanFormCaseIds[workflow.formNumber] = workflow.case.caseNumber;
        }

        // Priority 1: Case object case number
        if (workflow.case?.caseNumber) {
          caseNumber = workflow.case.caseNumber;
        }
        // Priority 2: Form case IDs from questionnaire assignment
        else if (workflow.questionnaireAssignment?.formCaseIdGenerated) {
          caseNumber = workflow.questionnaireAssignment.formCaseIdGenerated;
        }
        // Priority 3: Form case IDs (common forms)
        else if (Object.keys(cleanFormCaseIds).length > 0) {
          const commonForms = ['I-485', 'I-130', 'I-765', 'I-131', 'N-400', 'G-884'];
          for (const form of commonForms) {
            if (cleanFormCaseIds[form]) {
              caseNumber = cleanFormCaseIds[form];
              break;
            }
          }
          // If no common forms, use the first available form case ID
          if (caseNumber === 'No Case Number' && Object.keys(cleanFormCaseIds).length > 0) {
            const firstForm = Object.keys(cleanFormCaseIds)[0];
            caseNumber = `${firstForm}: ${cleanFormCaseIds[firstForm]}`;
          }
        }

        // Enhanced title extraction
        let title = `Workflow ${(workflow.id || workflow._id || '').slice(-8)}`;
        if (workflow.case?.title) {
          title = workflow.case.title;
        } else if (workflow.title) {
          title = workflow.title;
        } else if (workflow.formNumber) {
          title = `${workflow.formNumber} Application`;
        } else if (workflow.selectedForms && workflow.selectedForms.length > 0) {
          title = `${workflow.selectedForms.join(', ')} Application`;
        }

        // Enhanced selectedForms array construction
        const enhancedSelectedForms = [];
        if (workflow.selectedForms && workflow.selectedForms.length > 0) {
          enhancedSelectedForms.push(...workflow.selectedForms);
        }
        if (workflow.formNumber && !enhancedSelectedForms.includes(workflow.formNumber)) {
          enhancedSelectedForms.push(workflow.formNumber);
        }

        // Debug logging for enhanced form processing
        console.log('🔍 Enhanced Workflow Processing:', {
          workflowId: workflow.workflowId || workflow._id,
          originalFormCaseIds: workflow.formCaseIds,
          originalSelectedForms: workflow.selectedForms,
          formNumber: workflow.formNumber,
          questionnaireFormCaseId: workflow.questionnaireAssignment?.formCaseIdGenerated,
          caseNumber: workflow.case?.caseNumber,
          enhancedFormCaseIds: cleanFormCaseIds,
          enhancedSelectedForms,
          finalCaseNumber: caseNumber
        });

        return {
          ...workflow,
          id: workflow.id || workflow._id,
          workflowId: workflow.workflowId || workflow.id || workflow._id,
          caseNumber,
          title,
          status: workflow.status || 'unknown',
          formCaseIds: cleanFormCaseIds, // Use enhanced cleaned object
          selectedForms: enhancedSelectedForms, // Use enhanced forms array
          formNumber: workflow.formNumber, // Preserve original formNumber
          currentStep: workflow.currentStep || 0,
          createdAt: workflow.createdAt || new Date().toISOString(),
          updatedAt: workflow.updatedAt || new Date().toISOString(),
          // Additional metadata from enhanced API
          questionnaireAssignment: workflow.questionnaireAssignment,
          client: workflow.client,
          case: workflow.case
        };
      });

      setClientWorkflows(processedWorkflows);

      // Check if workflow fetching completely failed and set appropriate error state
      if (!workflowFetchSuccess && processedWorkflows.length === 0) {
        console.warn('⚠️ All workflow fetching strategies failed - workflow data unavailable');
      } else {
        // Clear any previous error
      }

      // Show success message if workflows found
      if (processedWorkflows.length > 0) {
        console.log(`✅ Successfully loaded ${processedWorkflows.length} workflow(s) for client using ${workflowFetchSuccess ? 'direct API' : 'fallback method'}`);

        // Log detailed workflow information for debugging
        processedWorkflows.forEach((workflow, index) => {
          console.log(`📋 Processed Workflow ${index + 1}:`, {
            workflowId: workflow.workflowId,
            title: workflow.title,
            caseNumber: workflow.caseNumber,
            status: workflow.status,
            currentStep: workflow.currentStep,
            selectedForms: workflow.selectedForms,
            hasQuestionnaireAssignment: !!workflow.questionnaireAssignment,
            questionnaireStatus: workflow.questionnaireAssignment?.status,
            questionnaireResponses: workflow.questionnaireAssignment?.responses ? 'Available' : 'None'
          });
        });
      } else {
        console.log('ℹ️ No workflows found for this client');
      }

      // Generate enhanced workflow activities for the activity timeline
      const workflowActivities: any[] = [];

      processedWorkflows.forEach((workflow: any) => {
        // Main workflow creation activity
        workflowActivities.push({
          id: `workflow-${workflow.id}`,
          type: 'workflow_created',
          description: `Workflow "${workflow.title}" created`,
          timestamp: workflow.createdAt,
          icon: 'FolderOpen',
          data: {
            workflowId: workflow.workflowId,
            caseNumber: workflow.caseNumber,
            status: workflow.status,
            selectedForms: workflow.selectedForms
          }
        });

        // Add questionnaire-related activities if available
        if (workflow.questionnaireAssignment) {
          const qa = workflow.questionnaireAssignment;

          // Questionnaire assignment activity
          workflowActivities.push({
            id: `questionnaire-assigned-${workflow.id}`,
            type: 'questionnaire_assigned',
            description: `Questionnaire "${qa.questionnaire_title || 'Immigration Forms'}" assigned`,
            timestamp: qa.assigned_at || workflow.createdAt,
            icon: 'FileText',
            data: {
              workflowId: workflow.workflowId,
              questionnaireId: qa.questionnaire_id,
              questionnaireTitle: qa.questionnaire_title,
              status: qa.status
            }
          });

          // Questionnaire submission activity if completed
          if (qa.submitted_at && qa.responses) {
            workflowActivities.push({
              id: `questionnaire-submitted-${workflow.id}`,
              type: 'questionnaire_submitted',
              description: `Questionnaire responses submitted`,
              timestamp: qa.submitted_at,
              icon: 'CheckCircle',
              data: {
                workflowId: workflow.workflowId,
                questionnaireTitle: qa.questionnaire_title,
                responseCount: qa.responses ? Object.keys(qa.responses).length : 0,
                status: qa.status
              }
            });
          }
        }

        // Add case-related activities if available
        if (workflow.case && workflow.case.createdAt) {
          workflowActivities.push({
            id: `case-created-${workflow.id}`,
            type: 'case_created',
            description: `Case "${workflow.case.title || workflow.caseNumber}" created`,
            timestamp: workflow.case.createdAt,
            icon: 'Briefcase',
            data: {
              workflowId: workflow.workflowId,
              caseId: workflow.case._id || workflow.case.id,
              caseNumber: workflow.caseNumber,
              caseTitle: workflow.case.title,
              category: workflow.case.category,
              status: workflow.case.status
            }
          });
        }
      });

      // Merge with existing activities
      setActivities(prev => {
        const combined = [...prev, ...workflowActivities];
        return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });

    } catch (error) {
      console.error('❌ Error fetching client workflows:', error);
      setClientWorkflows([]);

      // Show user-friendly error message
      toast.error('Some workflow information could not be loaded, but the page will continue to function normally.');
    } finally {
      // Cleanup if needed
    }
  };
  const fetchClientDocuments = async (clientId: string, clientData?: any) => {
    try {
      setLoadingDocuments(true);

      const response = await getDocuments();

      if (response.success) {
        // Handle the actual API response structure - same fix as DocumentsPage
        const responseData = response.data as any;
        const allDocuments = responseData.data?.documents || responseData.documents || [];

        // Filter documents by client email (primary method)
        const clientEmail = (clientData || client)?.email?.trim().toLowerCase() || '';

        const filteredDocuments = allDocuments.filter((doc: Document) => {
          // Primary strategy: Match by client email
          // This works with the new clientEmail field we added to document uploads
          const docClientEmail = (doc as any).clientEmail?.toString().trim().toLowerCase() || '';
          const docUploadedBy = (doc as any).uploadedBy?.toString().trim().toLowerCase() || '';

          // Strategy 1: Direct email match in clientEmail field (new field)
          const matchesClientEmail = docClientEmail === clientEmail;

          // Strategy 2: Email match in uploadedBy field (fallback)
          const matchesUploadedByEmail = docUploadedBy === clientEmail;

          // Strategy 3: For backward compatibility, check if clientId matches our client
          const docClientId = (doc as any).clientId?.toString().trim().toLowerCase() || '';
          const searchClientId = clientId?.toString().trim().toLowerCase() || '';
          const clientActualId = (clientData || client)?._id?.toString().trim().toLowerCase() || '';
          const matchesClientId = docClientId === searchClientId || docClientId === clientActualId;

          const isMatch = matchesClientEmail || matchesUploadedByEmail || matchesClientId;

          return isMatch;
        });

        // Process documents for display with formatted data
        const processedDocuments = processDocumentsForDisplay(filteredDocuments);
        setClientDocuments(processedDocuments);

        // Generate activity log only from the client's documents (not all documents)
        const documentActivities = processedDocuments.map((doc: Document) => ({
          id: `doc-${doc._id}`,
          type: 'document_upload',
          description: `Document "${doc.name}" uploaded`,
          timestamp: doc.uploadedAt || doc.createdAt,
          icon: 'FileText',
          data: {
            documentName: doc.name,
            documentType: doc.type,
            documentId: doc._id
          }
        }));

        // Sort activities by timestamp (newest first)
        const sortedActivities = documentActivities.sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(sortedActivities);
      } else {
        console.error('Failed to fetch documents:', response.message);
        setClientDocuments([]);
        setActivities([]);
      }
    } catch (error) {
      console.error('❌ Error fetching client documents:', error);
      setClientDocuments([]);
      setActivities([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Helper function to get time ago string
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return past.toLocaleDateString();
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper function to process documents for display
  const processDocumentsForDisplay = (documents: any[]): Document[] => {
    return documents.map(doc => ({
      ...doc,
      sizeFormatted: formatFileSize(doc.size || 0),
      uploadedAt: doc.uploadedAt || doc.createdAt,
      uploadedBy: doc.uploadedBy || 'Unknown User'
    }));
  };

  // Document action handlers
  const handleDownloadDocument = async (documentId: string, documentName: string) => {
    try {
      await downloadDocument(documentId, documentName);
    } catch (error) {
      console.error('Failed to download document', error);
      toast.error('Failed to download document');
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      await previewDocument(documentId);
    } catch (error) {
      console.error('Failed to preview document', error);
      toast.error('Failed to preview document');
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        if (!id) {
          throw new Error('Client ID is required');
        }

        setLoading(true);

        // Fetch client data using getClientById
        const clientData = await getClientById(id);
        setClient(clientData);

        // Fetch client cases using proper API
        try {
          console.log('🔄 Fetching client cases for client:', id);
          const cases = await getClientCases(id);
          console.log('✅ Client cases fetched:', cases);
          setClientCases(Array.isArray(cases) ? cases : []);
        } catch (caseError) {
          console.warn('⚠️ Could not fetch client cases from ClientControllers, trying direct API:', caseError);
          try {
            // Fallback to direct API call
            const directApiResponse = await api.get(`/api/v1/clients/${id}/cases`);
            setClientCases(directApiResponse.data || []);
          } catch (directApiError) {
            console.warn('⚠️ Direct API call also failed:', directApiError);
            setClientCases([]);
          }
        }

        // Fetch client workflows
        await fetchClientWorkflows(id, clientData);

        // Log the final client state after all data fetching
        console.log('🔍 Final client state after all data fetching:', {
          originalClientData: clientData,
          currentClientState: client,
          hasWorkflows: clientWorkflows.length > 0
        });

        // Fetch client documents
        await fetchClientDocuments(id, clientData);

      } catch (err) {
        console.error('❌ Error in fetchClientData:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading client details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-600">{error}</p>
        <Link to="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Clients
        </Link>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
        <p>The client you are looking for does not exist or has been removed.</p>
        <Link to="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Clients
        </Link>
      </div>
    );
  }

  // Ensure client has minimum required fields
  const safeClient = {
    ...client,
    name: client?.name || `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Unknown Client',
    email: client?.email || 'No email provided',
    phone: client?.phone || 'No phone provided',
    status: client?.status || 'Unknown'
  };

  // Debug information - remove this in production
  console.log('🔍 Client Debug Info:', {
    rawClient: client,
    safeClient: safeClient,
    hasAddress: !!client?.address,
    addressKeys: client?.address ? Object.keys(client.address) : [],
    hasWorkflows: clientWorkflows.length,
    hasCases: clientCases.length,
    hasDocuments: clientDocuments.length
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link to="/clients" className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{safeClient.name}</h1>
          <span className={`ml-4 px-3 py-1 text-sm font-medium rounded-full ${safeClient.status === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
            }`}>
            {safeClient.status}
          </span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* Main client information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <div className="flex items-center mt-1">
                    <Mail size={16} className="text-gray-400 mr-2" />
                    {safeClient.email && safeClient.email !== 'No email provided' ? (
                      <a href={`mailto:${safeClient.email}`} className="text-primary-600 hover:text-primary-700">
                        {safeClient.email}
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">No email provided</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <div className="flex items-center mt-1">
                    <Phone size={16} className="text-gray-400 mr-2" />
                    {safeClient.phone && safeClient.phone !== 'No phone provided' ? (
                      <a href={`tel:${safeClient.phone}`} className="text-primary-600 hover:text-primary-700">
                        {safeClient.phone}
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">No phone provided</span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <div className="flex items-start mt-1">
                    <MapPin size={16} className="text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {safeClient.address ? (
                        <div className="space-y-1">
                          {/* Primary address line */}
                          <div className="font-medium">
                            {(safeClient.address as any)?.formattedAddress ||
                              `${safeClient.address.street || ''}${(safeClient.address as any)?.aptSuiteFlr && (safeClient.address as any)?.aptNumber ? `, ${(safeClient.address as any).aptSuiteFlr} ${(safeClient.address as any).aptNumber}` : ''}`
                            }
                          </div>

                          {/* City, State, ZIP */}
                          <div className="text-sm text-gray-600">
                            {[
                              safeClient.address.city,
                              safeClient.address.state || (safeClient.address as any)?.province,
                              safeClient.address.zipCode || (safeClient.address as any)?.postalCode
                            ].filter(Boolean).join(', ')}
                          </div>

                          {/* Country */}
                          {safeClient.address.country && (
                            <div className="text-sm text-gray-500">
                              {safeClient.address.country}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No address provided</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <div className="flex items-center mt-1">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span>{safeClient.dateOfBirth ? new Date(safeClient.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Immigration Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Alien Registration Number</p>
                  <p className="font-medium mt-1">{safeClient.alienRegistrationNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">USCIS Online Account Number</p>
                  <p className="font-medium mt-1">{(safeClient as any)?.uscisOnlineAccountNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Social Security Number</p>
                  <p className="font-medium mt-1">
                    {(safeClient as any)?.socialSecurityNumber || (safeClient as any)?.ssn || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium mt-1">{safeClient.nationality || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Passport Number</p>
                  <p className="font-medium mt-1">{safeClient.passportNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">National ID Number</p>
                  <p className="font-medium mt-1">{(safeClient as any)?.nationalIdNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Immigration Purpose</p>
                  <p className="font-medium mt-1">
                    {(safeClient as any)?.immigrationPurpose ?
                      (safeClient as any).immigrationPurpose.replace(/[-_]/g, ' ').split(' ').map((word: string) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Place of Birth</p>
                  <p className="font-medium mt-1">
                    {(safeClient as any)?.placeOfBirth && ((safeClient as any).placeOfBirth.city !== 'TBD' || (safeClient as any).placeOfBirth.country !== 'TBD') ?
                      `${(safeClient as any).placeOfBirth.city || ''}, ${(safeClient as any).placeOfBirth.country || ''}`.replace(/^,\s*|\s*,\s*$/g, '') :
                      'Not provided'
                    }
                  </p>
                </div>
              </div>
              {safeClient.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium mt-1">{safeClient.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Case Details</h2>
            </div>
            <div className="p-4">
              {clientWorkflows && clientWorkflows.length > 0 ? (
                <div className="space-y-6">
                  {clientWorkflows.map((workflow, index) => (
                    <div key={workflow._id || workflow.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Case Information */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Case Category</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {workflow.case?.category ?
                                workflow.case.category.replace(/[-_]/g, ' ').split(' ').map((word: string) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ') : 'Unknown'
                              }
                            </span>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Case Title</p>
                            <p className="font-medium">{workflow.case?.title || 'Not specified'}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Case Status</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${workflow.case?.status === 'Active' ? 'bg-green-100 text-green-800' :
                              workflow.case?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                workflow.case?.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {workflow.case?.status || workflow.status || 'Unknown'}
                            </span>
                          </div>
                        </div>

                        {/* Form Information */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Assigned Forms</p>
                            <div className="space-y-1">
                              {workflow.case?.assignedForms && workflow.case.assignedForms.length > 0 ? (
                                workflow.case.assignedForms.map((form: string) => (
                                  <span key={form} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                                    📋 {form}
                                  </span>
                                ))
                              ) : workflow.selectedForms && workflow.selectedForms.length > 0 ? (
                                workflow.selectedForms.map((form: string) => (
                                  <span key={form} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                                    📋 {form}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 italic">No forms assigned</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Priority</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${workflow.case?.priority === 'High' ? 'bg-red-100 text-red-800' :
                              workflow.case?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                workflow.case?.priority === 'Low' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {workflow.case?.priority || 'Medium'}
                            </span>
                          </div>
                        </div>

                        {/* Case Numbers */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Form Case Numbers</p>
                            <div className="space-y-2">
                              {workflow.formCaseIds && typeof workflow.formCaseIds === 'object' && Object.keys(workflow.formCaseIds).length > 0 ? (
                                Object.entries(workflow.formCaseIds)
                                  .filter(([key, value]) => !key.startsWith('$') && !key.startsWith('_') && typeof value === 'string')
                                  .map(([form, caseId]) => (
                                    <div key={form} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                      <span className="text-xs font-medium text-gray-700">{form}</span>
                                      <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                        {String(caseId)}
                                      </span>
                                    </div>
                                  ))
                              ) : workflow.case?.formCaseIds && typeof workflow.case.formCaseIds === 'object' && Object.keys(workflow.case.formCaseIds).length > 0 ? (
                                Object.entries(workflow.case.formCaseIds)
                                  .filter(([key, value]) => !key.startsWith('$') && !key.startsWith('_') && typeof value === 'string')
                                  .map(([form, caseId]) => (
                                    <div key={form} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                      <span className="text-xs font-medium text-gray-700">{form}</span>
                                      <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                        {String(caseId)}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <span className="text-gray-500 italic text-sm">No case numbers available</span>
                              )}
                            </div>
                          </div>

                          {workflow.case?.dueDate && (
                            <div>
                              <p className="text-sm text-gray-500">Due Date</p>
                              <p className="font-medium text-sm">{new Date(workflow.case.dueDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {workflow.case?.description && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="text-sm mt-1">{workflow.case.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No case details found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No case information is available for this client yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Client Cases</h2>
              <Link
                to="/cases/new"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + New Case
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading cases...</span>
                </div>
              ) : clientCases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientCases.map((caseItem) => (
                        <tr key={caseItem.id || caseItem._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              to={`/cases/${caseItem.id || caseItem._id}`}
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              {caseItem.caseNumber || caseItem.title || `Case ${(caseItem.id || caseItem._id).slice(-8)}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {caseItem.type || caseItem.category || 'Immigration Case'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              caseItem.status === 'Active' || caseItem.status === 'In Progress' ? 'bg-green-100 text-green-800' :
                              caseItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {caseItem.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No cases found for this client.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/cases/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Create New Case
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div> */}

        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Documents</h2>
            </div>
            <div className="p-4">
              {loadingDocuments ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
                </div>
              ) : clientDocuments.length > 0 ? (
                <div className="space-y-3">
                  {clientDocuments.slice(0, 5).map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                      <div className="flex items-center flex-1">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.size || 0)} • {getTimeAgo(doc.uploadedAt || doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreviewDocument(doc._id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Preview document"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc._id, doc.name)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Download document"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {clientDocuments.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Showing 5 of {clientDocuments.length} documents
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No documents have been uploaded for this client yet.
                  </p>
                </div>
              )}
              <Link
                to={`/documents?client=${id}`}
                className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700"
              >
                View all documents
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>
            <div className="p-4">
              {activities.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {activities.slice(0, 10).map((activity, index) => (
                      <li key={activity.id} className={index !== activities.length - 1 && index !== 9 ? "relative pb-8" : "relative"}>
                        {index !== activities.length - 1 && index !== 9 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                              {activity.icon === 'FileText' ? (
                                <FileText className="h-4 w-4 text-white" />
                              ) : activity.icon === 'FolderOpen' ? (
                                <FolderOpen className="h-4 w-4 text-white" />
                              ) : activity.icon === 'CheckCircle' ? (
                                <CheckCircle className="h-4 w-4 text-white" />
                              ) : activity.icon === 'Briefcase' ? (
                                <Briefcase className="h-4 w-4 text-white" />
                              ) : (
                                <Clock className="h-4 w-4 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.description}
                                {activity.data?.documentType && (
                                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {activity.data.documentType}
                                  </span>
                                )}
                                {activity.data?.caseNumber && activity.data.caseNumber !== 'No Case Number' && (
                                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Case: {activity.data.caseNumber}
                                  </span>
                                )}
                                {activity.data?.status && (
                                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    {activity.data.status}
                                  </span>
                                )}
                                {activity.data?.questionnaireTitle && (
                                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    {activity.data.questionnaireTitle}
                                  </span>
                                )}
                                {activity.data?.responseCount && (
                                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {activity.data.responseCount} responses
                                  </span>
                                )}
                                {activity.data?.category && (
                                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {activity.data.category}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={activity.timestamp}>
                                {getTimeAgo(activity.timestamp)}
                              </time>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Activity will appear here when documents are uploaded or cases are created.
                  </p>
                </div>
              )}
              {activities.length > 10 && (
                <div className="mt-6 text-center">
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    View full activity log ({activities.length} total activities)
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Assigned Forms</h2>
              <div className="p-4">
                {clientWorkflows && clientWorkflows.length > 0 ? (
                  <div className="space-y-6">
                    {clientWorkflows.map((workflow, index) => (
                      <div key={workflow._id || workflow.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Assigned Forms</p>
                            <div className="space-y-1">
                              {workflow.case?.assignedForms && workflow.case.assignedForms.length > 0 ? (
                                workflow.case.assignedForms.map((form: string) => (
                                  <span key={form} className="inline-flex items-center px-2 py-0.5 rounded text-m font-medium bg-blue-100 text-blue-900 mr-1">
                                    📋 {form}
                                  </span>
                                ))
                              ) : workflow.selectedForms && workflow.selectedForms.length > 0 ? (
                                workflow.selectedForms.map((form: string) => (
                                  <span key={form} className="inline-flex items-center px-2 py-0.5 rounded text-m font-medium bg-blue-100 text-blue-900 mr-1">
                                    📋 {form}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 italic">No forms assigned</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Form Case Numbers</p>
                              <div className="space-y-2">
                                {workflow.formCaseIds && typeof workflow.formCaseIds === 'object' && Object.keys(workflow.formCaseIds).length > 0 ? (
                                  Object.entries(workflow.formCaseIds)
                                    .filter(([key, value]) => !key.startsWith('$') && !key.startsWith('_') && typeof value === 'string')
                                    .map(([form, caseId]) => (
                                      <div key={form} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        
                                        <span className="font-mono text-m bg-white px-2 py-1 rounded border">
                                          {String(caseId)}
                                        </span>
                                      </div>
                                    ))
                                ) : workflow.case?.formCaseIds && typeof workflow.case.formCaseIds === 'object' && Object.keys(workflow.case.formCaseIds).length > 0 ? (
                                  Object.entries(workflow.case.formCaseIds)
                                    .filter(([key, value]) => !key.startsWith('$') && !key.startsWith('_') && typeof value === 'string')
                                    .map(([form, caseId]) => (
                                      <div key={form} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                       
                                        <span className="font-mono text-m bg-white px-2 py-1 rounded border">
                                          {String(caseId)}
                                        </span>
                                      </div>
                                    ))
                                ) : (
                                  <span className="text-gray-500 italic text-sm">No case numbers available</span>
                                )}
                              </div>
                            </div>

                          
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No forms assigned</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No forms have been assigned to this client yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default ClientDetailsPage;