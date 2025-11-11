import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  FileText,
  CheckSquare,
  MessageCircle,
  Download,
  Edit3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../controllers/AuthControllers";
import { getCasesBasedOnUserType } from "../../controllers/CaseControllers";
import { getTasks, Task } from "../../controllers/TaskControllers";
import { getDocuments, Document } from "../../controllers/DocumentControllers";
import Button from "../../components/common/Button";
import PdfEditor from "../../components/pdf/PdfEditor";
import {
  getPdfPreviewBlob,
  saveEditedPdf,
  getFilledPdfsByClientAndCase,
  base64ToBlob,
} from "../../controllers/AnvilControllers";
import { downloadPdfFile } from "../../controllers/FormAutoFillControllers";

// Types for workflow case data
type WorkflowCase = {
  _id: string;
  workflowId: string;
  caseNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedForms: string[];
  formCaseIds: { [key: string]: string };
  client: {
    _id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    nationality?: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  currentStep: number;
  selectedForms: string[];
  questionnaireAssignment?: {
    questionnaire_id: string;
    questionnaire_title: string;
    response_id?: string;
    is_complete: boolean;
    submitted_at?: string;
    responses?: any;
  };
  createdAt: string;
  updatedAt: string;
};

type GeneratedForm = {
  formName: string;
  templateId: string;
  blob: Blob;
  downloadUrl: string;
  fileName: string;
  pdfId?: string;
  status: "generating" | "success" | "error";
  error?: string;
  filledPercentage?: number;
  unfilledFields?: Record<string, any>;
  metadata?: {
    filename: string;
    fileSize: number;
    contentType: string;
    createdAt: string;
    validationDetails: {
      totalFields: number;
      filledFields: number;
      unfilledFieldsCount: number;
      openaiValidationUsed: boolean;
    };
  };
};

const CaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<WorkflowCase | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for generated forms
  const [generatedForms, setGeneratedForms] = useState<GeneratedForm[]>([]);
  const [loadingForms, setLoadingForms] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});
  const [showEditor, setShowEditor] = useState<Record<string, boolean>>({});
  const [loadingPreview, setLoadingPreview] = useState<Record<string, boolean>>(
    {}
  );

  // Helper function to load tasks and documents
  const loadTasksAndDocuments = async (caseIdentifier: string) => {
    // Fetch related tasks
    console.log("📋 Fetching tasks for case:", caseIdentifier);
    try {
      const allTasks = await getTasks();
      const caseTasks = allTasks.filter((task: Task) => {
        const taskCaseId = (task as any).caseId || task.relatedCaseId;
        return taskCaseId === caseIdentifier || taskCaseId?.includes(caseIdentifier);
      });
      console.log("📋 Found tasks for case:", caseTasks.length);
      setTasks(caseTasks);
    } catch (taskError) {
      console.error("❌ Error fetching tasks:", taskError);
      setTasks([]);
    }

    // Fetch related documents  
    console.log("📄 Fetching documents for case:", caseIdentifier);
    try {
      const documentsResponse = await getDocuments();
      if (documentsResponse.success) {
        const filteredDocuments = documentsResponse.data.documents.filter(
          (doc: Document) => {
            return (
              doc.caseNumber === caseIdentifier ||
              doc.caseNumber?.includes(caseIdentifier) ||
              (doc as any).relatedCaseId === caseIdentifier
            );
          }
        );
        console.log("📄 Found documents for case:", filteredDocuments.length);
        setDocuments(filteredDocuments);
      } else {
        setDocuments([]);
      }
    } catch (docError) {
      console.error("❌ Error fetching documents:", docError);
      setDocuments([]);
    }
  };

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Fetching case data for ID:", id);
        
        if (!user) {
          setError("User not authenticated. Please login.");
          return;
        }

        // Use getCasesBasedOnUserType API for all cases - it's more reliable
        console.log("📋 Fetching all user cases to find specific case");
        let allCases = [];
        
        if (user.userType === 'individualUser') {
          // For individual users, get their filtered cases
          const casesResponse = await getCasesBasedOnUserType(user, { limit: 100 });
          allCases = casesResponse?.cases || [];
          console.log("📋 Found individual user cases:", allCases.length);
        } else {
          // For company users, try workflows API as fallback
          console.log("🏢 Company user - fetching from workflows API");
          const workflowResponse = await api.get("/api/v1/workflows", {
            params: { page: 1, limit: 100 },
          });

          if (workflowResponse.data?.success && workflowResponse.data?.data) {
            allCases = workflowResponse.data.data;
          }
        }

        if (!allCases || allCases.length === 0) {
          setError("No cases found for this user.");
          return;
        }

        // Find the specific case
        const caseItem = allCases.find((c: any) => c._id === id);

        if (!caseItem) {
          setError("Case not found or you don't have access to this case.");
          return;
        }

        console.log("✅ Found case:", caseItem.caseNumber || caseItem._id);

        // For individual users, double-check ownership
        if (user.userType === 'individualUser') {
          let caseClientId: string = '';
          if (typeof caseItem.clientId === 'string') {
            caseClientId = caseItem.clientId;
          } else if (typeof caseItem.clientId === 'object' && caseItem.clientId !== null) {
            caseClientId = (caseItem.clientId as any)._id || (caseItem.clientId as any).id || '';
          }
          
          const userOwnsCase = caseClientId === user._id && caseItem.userType === 'individualUser';
          
          if (!userOwnsCase) {
            setError("Access denied. You can only view your own cases.");
            return;
          }
        }

        // Transform case data to WorkflowCase format for consistent rendering
        let transformedCase: WorkflowCase;

        if (user.userType === 'individualUser') {
          // Transform MongoDB case to WorkflowCase format with full details
          transformedCase = {
            _id: caseItem._id,
            workflowId: caseItem._id,
            caseNumber: caseItem.caseNumber || `CASE-${caseItem._id?.slice(-8)}`,
            title: caseItem.title || 'Immigration Case',
            description: caseItem.description || '',
            category: caseItem.category || 'immigration',
            subcategory: caseItem.subcategory || '',
            status: caseItem.status || 'Active',
            priority: caseItem.priority || 'Medium',
            dueDate: caseItem.dueDate || '',
            assignedForms: caseItem.formNumber ? [caseItem.formNumber] : [],
            formCaseIds: {},
            client: {
              _id: user._id,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              email: user.email || '',
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              phone: (user as any).phone || '',
              nationality: (user as any).nationality || ''
            },
            createdBy: caseItem.createdByUser ? {
              _id: caseItem.createdByUser.userId || user._id,
              firstName: caseItem.createdByUser.name?.split(' ')[0] || user.firstName || '',
              lastName: caseItem.createdByUser.name?.split(' ').slice(1).join(' ') || user.lastName || '',
              email: caseItem.createdByUser.email || user.email || '',
              role: caseItem.createdByUser.role || user.role || 'client'
            } : {
              _id: user._id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              role: user.role || 'client'
            },
            currentStep: 1,
            selectedForms: caseItem.formNumber ? [caseItem.formNumber] : [],
            questionnaireAssignment: undefined,
            createdAt: caseItem.createdAt || new Date().toISOString(),
            updatedAt: caseItem.updatedAt || caseItem.createdAt || new Date().toISOString()
          };
        } else {
          // Transform workflow case with full details
          const workflowClient = caseItem.client || {};
          const workflowCase = caseItem.case || {};
          const formCaseIds = caseItem.formCaseIds || {};
          const primaryCaseNumber =
            (Object.values(formCaseIds)[0] as string) ||
            workflowCase.caseNumber ||
            `WF-${caseItem._id?.slice(-8)}`;

          transformedCase = {
            _id: caseItem._id,
            workflowId: caseItem.workflowId || caseItem._id,
            caseNumber: primaryCaseNumber,
            title: workflowCase.title || workflowCase.description || "Immigration Case",
            description: workflowCase.description || workflowCase.title || "Immigration workflow case",
            category: workflowCase.category || "immigration",
            subcategory: workflowCase.subcategory || "",
            status: workflowCase.status || caseItem.status || "in-progress",
            priority: workflowCase.priority || "Medium",
            dueDate: workflowCase.dueDate || "",
            assignedForms: workflowCase.assignedForms || caseItem.selectedForms || [],
            formCaseIds: formCaseIds,
            client: {
              _id: workflowClient.id || workflowClient._id || "",
              name: workflowClient.name || `${workflowClient.firstName || ""} ${workflowClient.lastName || ""}`.trim(),
              email: workflowClient.email || "",
              firstName: workflowClient.firstName || "",
              lastName: workflowClient.lastName || "",
              phone: workflowClient.phone || "",
              nationality: workflowClient.nationality || "",
            },
            createdBy: caseItem.createdBy || {
              _id: "",
              firstName: "Unknown",
              lastName: "User",
              email: "",
              role: "attorney",
            },
            currentStep: caseItem.currentStep || 1,
            selectedForms: caseItem.selectedForms || [],
            questionnaireAssignment: caseItem.questionnaireAssignment,
            createdAt: caseItem.createdAt || new Date().toISOString(),
            updatedAt: caseItem.updatedAt || caseItem.createdAt || new Date().toISOString(),
          };
        }

        setCaseData(transformedCase);
        console.log("✅ Case loaded successfully via getCases API");

        // Load tasks and documents
        await loadTasksAndDocuments(transformedCase.caseNumber);

        // Fetch generated forms for this case (if it's a workflow case)
        if (user.userType !== 'individualUser' || caseItem.workflowId) {
          await fetchGeneratedForms(caseItem);
        }

      } catch (error: any) {
        console.error("❌ Error fetching case data:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load case data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchCaseData();
    }
  }, [id, user]);

  // Function to fetch generated forms for the case
  const fetchGeneratedForms = async (workflow: any) => {
    try {
      setLoadingForms(true);
      
      const workflowClient = workflow.client || {};
      const workflowCase = workflow.case || {};
      const formCaseIds = workflow.formCaseIds || {};
      const caseNumber =
        (Object.values(formCaseIds)[0] as string) ||
        workflowCase.caseNumber ||
        `WF-${workflow._id?.slice(-8)}`;
      
      console.log("📄 Fetching generated forms for case:", caseNumber);

      const forms: GeneratedForm[] = [];
      const clientId = workflowClient.clientId || "";
      const caseId = workflowCase.caseId;

      // Fetch filled PDFs using getFilledPdfsByClientAndCase
      const filledPdfsResponse = await getFilledPdfsByClientAndCase(
        clientId,
        caseId
      );

      if (
        filledPdfsResponse.data.success &&
        filledPdfsResponse.data.data?.filledPdfs
      ) {
        const filledPdfs = filledPdfsResponse.data.data.filledPdfs;
        console.log("📄 Found filled PDFs from API:", filledPdfs.length);

        // Process each filled PDF
        for (const filledPdf of filledPdfs) {
          try {
            if (!filledPdf.pdfData) {
              console.warn(
                `⚠️ No pdfData found for ${filledPdf.formNumber}, falling back to API call`
              );
              // Fallback to API call if pdfData is not available
              try {
                const previewResponse = await getPdfPreviewBlob({
                  pdfId: filledPdf._id,
                });

                if (previewResponse.data && previewResponse.data.blob) {
                  const { blob, metadata, pdfId } = previewResponse.data;

                  forms.push({
                    formName: filledPdf.formNumber,
                    templateId: filledPdf.templateId || metadata?.templateId || "",
                    blob: blob,
                    downloadUrl: URL.createObjectURL(blob),
                    fileName: filledPdf.filename || metadata?.filename || `${filledPdf.formNumber}_${Date.now()}.pdf`,
                    pdfId: pdfId || filledPdf._id,
                    status: "success",
                    filledPercentage: metadata?.validationDetails?.filledFields
                      ? (metadata.validationDetails.filledFields / metadata.validationDetails.totalFields) * 100
                      : undefined,
                    metadata: {
                      ...metadata,
                      fileSize: filledPdf.fileSize || metadata?.fileSize,
                      contentType: filledPdf.contentType || metadata?.contentType,
                      createdAt: filledPdf.createdAt || metadata?.createdAt,
                      updatedAt: filledPdf.updatedAt || metadata?.updatedAt,
                    },
                  });
                } else {
                  throw new Error("PDF blob not available from API");
                }
              } catch (apiError) {
                forms.push({
                  formName: filledPdf.formNumber,
                  templateId: filledPdf.templateId || "",
                  blob: new Blob(),
                  downloadUrl: "",
                  fileName: filledPdf.filename || `${filledPdf.formNumber}.pdf`,
                  pdfId: filledPdf._id,
                  status: "error",
                  error: "PDF data not available",
                });
              }
            } else {
              // Convert base64 pdfData to Blob
              const blob = base64ToBlob(
                filledPdf.pdfData,
                filledPdf.contentType || "application/pdf"
              );

              forms.push({
                formName: filledPdf.formNumber,
                templateId: filledPdf.templateId || "",
                blob: blob,
                downloadUrl: URL.createObjectURL(blob),
                fileName: filledPdf.filename || `${filledPdf.formNumber}_${Date.now()}.pdf`,
                pdfId: filledPdf._id,
                status: "success",
                filledPercentage: undefined,
                metadata: {
                  filename: filledPdf.filename,
                  fileSize: filledPdf.fileSize,
                  contentType: filledPdf.contentType,
                  createdAt: filledPdf.createdAt,
                  validationDetails: {
                    totalFields: 0,
                    filledFields: 0,
                    unfilledFieldsCount: 0,
                    openaiValidationUsed: false,
                  },
                },
              });
            }
          } catch (formError: any) {
            console.error(`❌ Error processing PDF for ${filledPdf.formNumber}:`, formError);
            forms.push({
              formName: filledPdf.formNumber,
              templateId: filledPdf.templateId || "",
              blob: new Blob(),
              downloadUrl: "",
              fileName: filledPdf.filename || `${filledPdf.formNumber}.pdf`,
              pdfId: filledPdf._id,
              status: "error",
              error: formError.message || "Failed to process PDF data",
            });
          }
        }
      } else {
        console.warn("⚠️ No filled PDFs found or API returned unsuccessful response");
      }

      setGeneratedForms(forms);
      console.log("📄 Found generated forms:", forms.length);
    } catch (error: any) {
      console.error("❌ Error fetching generated forms:", error);
      toast.error("Failed to fetch generated forms");
    } finally {
      setLoadingForms(false);
    }
  };

  // Function to handle form download
  const handleDownloadForm = (formName: string) => {
    const form = generatedForms.find((f) => f.formName === formName);
    if (form && form.blob) {
      downloadPdfFile(form.blob, form.fileName);
    }
  };

  // Function to preview a specific form
  const handlePreviewForm = async (formName: string) => {
    const form = generatedForms.find((f) => f.formName === formName);
    if (!form) {
      toast.error(`Form ${formName} not found`);
      return;
    }

    // If preview is already showing, just toggle it off
    if (showPreview[formName]) {
      setShowPreview((prev) => ({
        ...prev,
        [formName]: false,
      }));
      return;
    }

    // Always try to show preview - use existing blob first, then try to fetch fresh data
    if (form.blob) {
      // Show existing preview immediately
      setShowPreview((prev) => ({
        ...prev,
        [formName]: true,
      }));

      // If we have a pdfId, also try to fetch fresh data in background
      if (form.pdfId) {
        try {
          setLoadingPreview((prev) => ({ ...prev, [formName]: true }));

          const previewResponse = await getPdfPreviewBlob({
            pdfId: form.pdfId,
          });

          if (previewResponse.data.blob) {
            const { blob } = previewResponse.data;

            // Update the form with new preview data
            const updatedForms = generatedForms.map((f) =>
              f.formName === formName
                ? {
                    ...f,
                    blob,
                    downloadUrl: URL.createObjectURL(blob),
                  }
                : f
            );
            setGeneratedForms(updatedForms);

            toast.success("PDF preview refreshed from backend");
          }
        } catch (error) {
          console.error("Error refreshing PDF preview:", error);
        } finally {
          setLoadingPreview((prev) => ({ ...prev, [formName]: false }));
        }
      }
    } else {
      toast.error("No PDF data available for preview");
    }
  };

  // Function to close preview
  const handleClosePreview = (formName: string) => {
    setShowPreview((prev) => ({
      ...prev,
      [formName]: false,
    }));
  };

  // Function to handle opening PDF editor
  const handleEditForm = (formName: string) => {
    setShowEditor((prev) => ({
      ...prev,
      [formName]: !prev[formName],
    }));
  };

  // Function to close PDF editor
  const handleCloseEditor = (formName: string) => {
    setShowEditor((prev) => ({
      ...prev,
      [formName]: false,
    }));
  };

  // Function to handle saving edited PDF
  const handleSaveEditedPdf = async (formName: string, editedPdfBlob: Blob) => {
    try {
      const form = generatedForms.find((f) => f.formName === formName);
      if (!form) return;

      if (!caseData) {
        toast.error("Case data not available");
        return;
      }

      // Save to backend database
      const clientId = caseData.client._id;
      const formNumber = formName;
      const templateId = form.templateId;

      // Ensure we have a valid pdfId
      if (!form.pdfId) {
        toast.error(`Cannot save edited PDF: Missing pdfId for form ${formName}`);
        return;
      }

      const saveResponse = await saveEditedPdf(
        editedPdfBlob,
        formNumber,
        clientId,
        templateId,
        form.pdfId,
        {
          caseId: caseData._id,
          workflowId: caseData._id,
          filename: form.fileName,
        }
      );

      if (saveResponse.data.success) {
        // Update the form with the edited PDF and new backend data
        const updatedForms = generatedForms.map((f) =>
          f.formName === formName
            ? {
                ...f,
                blob: editedPdfBlob,
                downloadUrl: saveResponse.data.data?.downloadUrl || URL.createObjectURL(editedPdfBlob),
                pdfId: saveResponse.data.data?.pdfId || f.pdfId,
              }
            : f
        );
        setGeneratedForms(updatedForms);

        toast.success("PDF saved successfully to database");
        handleCloseEditor(formName);
      } else {
        throw new Error(saveResponse.data.message || "Failed to save PDF to database");
      }
    } catch (error: any) {
      console.error("Error saving edited PDF:", error);
      toast.error(error.message || "Failed to save PDF to database");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading case details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-red-800 mb-2">
            Error Loading Case
          </h1>
          <p className="text-red-600">{error}</p>
          <Link
            to="/cases"
            className="text-red-700 hover:text-red-900 mt-4 inline-block"
          >
            &larr; Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Case Not Found</h1>
        <p>The case you are looking for does not exist or has been removed.</p>
        <Link
          to="/cases"
          className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
        >
          &larr; Back to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/cases" 
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{caseData.title}</h1>
                <p className="text-blue-100 mt-1">Case #{caseData.caseNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                caseData.status === 'Active' || caseData.status === 'New'
                  ? 'bg-green-500 text-white'
                  : caseData.status === 'Pending'
                  ? 'bg-yellow-500 text-white'
                  : caseData.status === 'Completed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}>
                {caseData.status}
              </span>
              <Link
                to={`/cases/${id}/edit`}
                className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                <Edit size={16} className="mr-2" />
                Edit Case
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main case information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText size={24} className="mr-3 text-blue-600" />
                  Case Overview
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Case Number</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{caseData.caseNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Category</p>
                      <p className="text-lg font-medium text-gray-900 mt-1 capitalize">{caseData.category}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Priority</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                        caseData.priority === 'High'
                          ? 'bg-red-100 text-red-800'
                          : caseData.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {caseData.priority}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Subcategory</p>
                      <p className="text-lg font-medium text-gray-900 mt-1 capitalize">
                        {caseData.subcategory || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Created By</p>
                      <p className="text-lg font-medium text-gray-900 mt-1">
                        {caseData.createdBy.firstName} {caseData.createdBy.lastName}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Step</p>
                      <div className="flex items-center mt-1">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {caseData.currentStep}
                        </div>
                        <span className="ml-2 text-lg font-medium text-gray-900">Step {caseData.currentStep}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {caseData.description && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Description</p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-800 leading-relaxed">{caseData.description}</p>
                    </div>
                  </div>
                )}

                {caseData.assignedForms && caseData.assignedForms.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Assigned Forms</p>
                    <div className="flex flex-wrap gap-2">
                      {caseData.assignedForms.map((form, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          <FileText size={14} className="mr-1" />
                          {form}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
                <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl font-bold">
                      {caseData.client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Link
                    to={`/clients/${caseData.client._id}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {caseData.client.name}
                  </Link>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-gray-900">{caseData.client.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{caseData.client.phone || "N/A"}</p>
                    </div>
                  </div>
                  {caseData.client.nationality && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Nationality</p>
                        <p className="text-sm font-medium text-gray-900">{caseData.client.nationality}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline/Due Date Card */}
            {caseData.dueDate && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
                  <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
                </div>
                <div className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">
                      {new Date(caseData.dueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      new Date(caseData.dueDate) < new Date()
                        ? 'bg-red-100 text-red-800'
                        : new Date(caseData.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {new Date(caseData.dueDate) < new Date()
                        ? 'Overdue'
                        : new Date(caseData.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? 'Due Soon'
                        : 'On Track'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Questionnaire Status */}
            {caseData.questionnaireAssignment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
                  <h2 className="text-lg font-semibold text-gray-900">Questionnaire</h2>
                </div>
                <div className="p-6">
                  <p className="font-medium text-gray-900 mb-2">
                    {caseData.questionnaireAssignment.questionnaire_title}
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      caseData.questionnaireAssignment.is_complete
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {caseData.questionnaireAssignment.is_complete
                      ? "✓ Completed"
                      : "⏳ Pending"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center">
              <CheckSquare size={24} className="mr-3 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
              <span className="ml-3 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <Link
              to="/tasks"
              className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              View All Tasks →
            </Link>
          </div>
          <div className="p-6">
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((task: Task) => (
                  <div key={task._id || task.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span>👤 {typeof task.assignedTo === "object" && task.assignedTo
                            ? `${(task.assignedTo as any).firstName || ""} ${(task.assignedTo as any).lastName || ""}`.trim() || "Unassigned"
                            : task.assignedTo || "Unassigned"}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          task.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          task.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : task.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {task.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500">No tasks are currently associated with this case.</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center">
              <FileText size={24} className="mr-3 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
              <span className="ml-3 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </span>
            </div>
            <Link
              to="/documents"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              View All Documents →
            </Link>
          </div>
          <div className="p-6">
            {documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc: Document) => (
                  <div key={doc._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors">
                            {doc.name}
                          </h3>
                          {doc.description && (
                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>📄 {doc.type}</span>
                            <span>📦 {doc.sizeFormatted || "N/A"}</span>
                            <span>📅 {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</span>
                            {doc.uploadedBy && <span>👤 {doc.uploadedBy}</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        doc.status === "Verified"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "Pending Review"
                          ? "bg-yellow-100 text-yellow-800"
                          : doc.status === "Needs Update"
                          ? "bg-orange-100 text-orange-800"
                          : doc.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500">No documents are currently associated with this case.</p>
              </div>
            )}
          </div>
        </div>

        {/* Generated Forms section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-xl">
            <div className="flex items-center">
              <FileText size={24} className="mr-3 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Generated Forms</h2>
              <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {generatedForms.length} {generatedForms.length === 1 ? 'form' : 'forms'}
              </span>
            </div>
          </div>
          <div className="p-6">
            {loadingForms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-600 font-medium">Loading forms...</span>
              </div>
            ) : generatedForms.length > 0 ? (
              <div className="space-y-6">
                {generatedForms.map((form) => (
                  <div key={form.formName} className="border border-gray-200 rounded-xl overflow-hidden">
                    {form.status === "success" ? (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{form.formName}</h3>
                              {form.metadata && (
                                <p className="text-sm text-gray-500">
                                  {form.metadata.filename} • {form.metadata.fileSize
                                    ? `${(form.metadata.fileSize / 1024).toFixed(2)} KB`
                                    : "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                          {form.filledPercentage !== undefined && (
                            <div className="text-right">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                form.filledPercentage >= 90
                                  ? "bg-green-100 text-green-800"
                                  : form.filledPercentage >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {form.filledPercentage.toFixed(0)}% Filled
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 flex-wrap">
                          <Button
                            onClick={() => handleDownloadForm(form.formName)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            onClick={() => handlePreviewForm(form.formName)}
                            size="sm"
                            variant="outline"
                            disabled={loadingPreview[form.formName]}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            {loadingPreview[form.formName] ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 mr-2" />
                            )}
                            {loadingPreview[form.formName] ? "Loading..." : "Preview"}
                          </Button>
                          <Button
                            onClick={() => handleEditForm(form.formName)}
                            size="sm"
                            variant="outline"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-red-50">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <h3 className="font-medium text-red-900">{form.formName}</h3>
                            <p className="text-sm text-red-600">Error: {form.error || "Unknown error"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
                <p className="text-gray-500">No generated forms are currently associated with this case.</p>
              </div>
            )}
          </div>
        </div>

        {/* Communication section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-xl">
            <div className="flex items-center">
              <MessageCircle size={24} className="mr-3 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Communications & Notes</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No communications yet</h3>
              <p className="text-gray-500 mb-4">Communication logs will appear here as they are added to the case.</p>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {Object.entries(showPreview).map(([formName, isVisible]) => {
        if (!isVisible) return null;
        const form = generatedForms.find((f) => f.formName === formName);
        if (!form || form.status !== "success") return null;

        return (
          <div
            key={formName}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-6xl w-full h-5/6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Preview: {formName}</h3>
                <Button
                  onClick={() => handleClosePreview(formName)}
                  variant="outline"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </Button>
              </div>
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                {form.blob ? (
                  <iframe
                    src={URL.createObjectURL(form.blob)}
                    className="w-full h-full border-0"
                    title={`Preview of ${formName}`}
                    onError={() => {
                      console.error("PDF preview failed to load");
                      toast.error("Failed to load PDF preview");
                    }}
                  />
                ) : loadingPreview[formName] ? (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Loading PDF preview...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-600">No PDF data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* PDF Editor Modal */}
      {Object.entries(showEditor).map(([formName, isVisible]) => {
        if (!isVisible) return null;
        const form = generatedForms.find((f) => f.formName === formName);
        if (!form || form.status !== "success") return null;

        return (
          <PdfEditor
            key={formName}
            pdfUrl={form.downloadUrl}
            filename={form.fileName}
            onClose={() => handleCloseEditor(formName)}
            onSave={(editedPdfBlob) =>
              handleSaveEditedPdf(formName, editedPdfBlob)
            }
          />
        );
      })}
    </div>
  );
};

export default CaseDetailsPage;