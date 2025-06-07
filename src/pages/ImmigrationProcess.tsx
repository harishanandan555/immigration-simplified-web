import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ImmigrationProcess,
  ProcessStep,
  ProcessDocument,
  ImmigrationCategory
} from '../types/immigration';
import { immigrationApi } from '../services/api/immigrationProcess';
import { FormProcessor } from '../components/forms/FormProcessor';
import { DocumentUpload } from '../components/forms/DocumentUpload';
import CaseWizard from '../components/case/CaseWizard';
import '../styles/ImmigrationProcess.css';
import { useAuth } from '../controllers/AuthControllers';
import { IMMIGRATION_END_POINTS, APPCONSTANTS } from '../utils/constants';

const ImmigrationProcessPage: React.FC = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<ImmigrationProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'type' | 'documents' | 'form' | 'foia' | 'client' | 'autofill' | 'download' | 'case-forms'>('type');
  const [selectedType, setSelectedType] = useState<{ type: string; subCategory: string } | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<ProcessDocument[]>([]);
  const [currentForm, setCurrentForm] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [foiaCase, setFoiaCase] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [autofilledForms, setAutofilledForms] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    console.log('Component mounted, processId:', processId);
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to access this page');
      navigate('/login', { state: { from: '/immigration-process' } });
      return;
    }

    if (processId) {
      loadProcess();
    } else {
      console.log('No processId, setting loading to false');
      setLoading(false);
    }
  }, [processId, navigate]);

  const loadProcess = async () => {
    try {
      console.log('Loading process for ID:', processId);
      setLoading(true);
      setError(null);

      if (!processId) {
        console.error('No process ID provided');
        setError('Process ID is required');
        return;
      }

      // Log the API endpoint being called
      const endpoint = IMMIGRATION_END_POINTS.GET_PROCESS.replace(':processId', processId);
      console.log('API Endpoint:', endpoint);
      console.log('Full URL:', `${APPCONSTANTS.API_BASE_URL}${endpoint}`);

      const response = await immigrationApi.getProcess(processId);
      console.log('Process loaded:', response);

      if (!response) {
        console.error('Empty response from API');
        setError('Failed to load process: Empty response from server');
        return;
      }

      setProcess(response);
      
      // Set current step based on process status
      if (response.currentStep === 'documents') {
        setCurrentStep('documents');
        setSelectedType({
          type: response.categoryId,
          subCategory: response.subcategoryId
        });
      } else if (response.currentStep === 'form') {
        setCurrentStep('form');
        setSelectedType({
          type: response.categoryId,
          subCategory: response.subcategoryId
        });
        setCurrentForm(`${response.categoryId}_${response.subcategoryId}`);
      }
    } catch (error: any) {
      console.error('Error loading process:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
      }

      let errorMessage = 'Failed to load process';
      
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        navigate('/login', { state: { from: '/immigration-process' } });
      } else if (error.response?.status === 404) {
        errorMessage = 'Process not found. Please start a new process.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleCaseComplete = (newProcessId: string) => {
    navigate(`/immigration-process/${newProcessId}`);
  };

  // Add loading overlay component
  const LoadingOverlay = () => (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>Processing your request...</p>
    </div>
  );

  // Add error message component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="error-message">
      <p>{message}</p>
      <button onClick={() => setError(null)}>Dismiss</button>
    </div>
  );

  if (loading && !process) {
    console.log('Rendering loading state');
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading process...</p>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadProcess}>Retry</button>
      </div>
    );
  }

  // If no processId, show the case wizard
  if (!processId) {
    return <CaseWizard onComplete={handleCaseComplete} />;
  }

  return (
    <div className="immigration-process-container">
      {loading && <LoadingOverlay />}
      {error && <ErrorMessage message={error} />}
      
      <header className="process-header">
        <h1>Immigration Process</h1>
        <div className="process-steps-indicator">
          <div className={`step ${currentStep === 'type' ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Select Category</span>
          </div>
          <div className={`step ${currentStep === 'documents' ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Upload Documents</span>
          </div>
          <div className={`step ${currentStep === 'form' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Complete Form</span>
          </div>
          <div className={`step ${currentStep === 'foia' ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">FOIA Case</span>
          </div>
          <div className={`step ${currentStep === 'client' ? 'active' : ''}`}>
            <span className="step-number">5</span>
            <span className="step-label">Client Creation</span>
          </div>
          <div className={`step ${currentStep === 'autofill' ? 'active' : ''}`}>
            <span className="step-number">6</span>
            <span className="step-label">Auto-fill Forms</span>
          </div>
          <div className={`step ${currentStep === 'case-forms' ? 'active' : ''}`}>
            <span className="step-number">7</span>
            <span className="step-label">Case Forms</span>
          </div>
          <div className={`step ${currentStep === 'download' ? 'active' : ''}`}>
            <span className="step-number">8</span>
            <span className="step-label">Download Forms</span>
          </div>
        </div>
      </header>

      <div className="process-content">
        {currentStep === 'documents' && selectedType && (
          <DocumentUpload
            requiredDocuments={getRequiredDocuments(selectedType.type, selectedType.subCategory)}
            onUploadComplete={handleDocumentsUploaded}
            disabled={loading}
            error={error}
          />
        )}

        {currentStep === 'form' && currentForm && (
          <FormProcessor
            processId={processId}
            formId={currentForm}
            onComplete={handleFormComplete}
            onError={handleFormError}
          />
        )}

        {currentStep === 'foia' && foiaCase && (
          <div className="foia-case-container">
            <h2>FOIA Case Created</h2>
            <p>Case ID: {foiaCase.id}</p>
            <p>Status: {foiaCase.status}</p>
          </div>
        )}

        {currentStep === 'client' && clientData && (
          <div className="client-container">
            <h2>Client Created</h2>
            <p>Client ID: {clientData.id}</p>
            <p>Name: {clientData.name}</p>
          </div>
        )}

        {currentStep === 'autofill' && autofilledForms.length > 0 && (
          <div className="autofill-container">
            <h2>Forms Auto-filled</h2>
            <ul>
              {autofilledForms.map(form => (
                <li key={form.id}>{form.name}</li>
              ))}
            </ul>
          </div>
        )}

        {currentStep === 'case-forms' && processId && (
          <div className="case-forms-container">
            <h2>Case Forms</h2>
            <p>View and manage forms for this case</p>
            <button
              onClick={() => navigate(`/case-forms/${processId}`)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              View Case Forms
            </button>
          </div>
        )}

        {currentStep === 'download' && (
          <div className="download-container">
            <h2>Forms Ready for Download</h2>
            <button onClick={() => immigrationApi.downloadForms(processId)}>
              Download All Forms
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const getRequiredDocuments = (type: string, subCategory: string): string[] => {
  // This would typically come from your API or configuration
  const documentMap: Record<string, Record<string, string[]>> = {
    family: {
      spouse: ['Marriage Certificate', 'Proof of Relationship', 'Financial Documents'],
      children: ['Birth Certificates', 'Proof of Custody', 'Financial Documents']
    },
    work: {
      employer: ['Job Offer Letter', 'LMIA', 'Qualifications'],
      open: ['Passport', 'Qualifications', 'Financial Documents']
    },
    study: {
      university: ['Letter of Acceptance', 'Proof of Funds', 'Academic Records'],
      college: ['Letter of Acceptance', 'Proof of Funds', 'Academic Records']
    },
    permanent: {
      express: ['Language Test Results', 'Education Assessment', 'Work Experience'],
      provincial: ['Provincial Nomination', 'Work Experience', 'Language Test Results']
    }
  };

  return documentMap[type]?.[subCategory] || [];
};

export default ImmigrationProcessPage; 