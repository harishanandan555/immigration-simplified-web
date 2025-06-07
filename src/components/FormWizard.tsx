import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressIndicator from './ProgressIndicator';
import NavigationButtons from './NavigationButtons';
import FormSelection from './steps/FormSelection';
import CategorySelection from './steps/CategorySelection';
import ClientCreation from './steps/ClientCreation';
import FoiaRequirement from './steps/FoiaRequirement';
import CaseCreation from './steps/CaseCreation';
import DocumentUpload from './steps/DocumentUpload';
import FormProcessing from './steps/FormProcessing';
import WizardCompleted from './steps/WizardCompleted';

export type Step = {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
};

export type Document = {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
};

export type Form = {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
};

export type FormData = {
  selectedForms: string[];
  selectedCategories: {
    categoryId: string;
    subcategoryId: string;
  };
  clientInfo: {
    clientId: string;
  };
  foiaInfo: {
    foiaRequired: boolean;
    foiaStatus: string;
  };
  caseInfo: {
    caseNumber: string;
    priorityDate: string;
    assignedStaff: string;
    caseNotes: string;
  };
  documents: {
    documents: Document[];
  };
  processedForms: {
    forms: Form[];
  };
};

const FormWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    selectedForms: [],
    selectedCategories: {
      categoryId: '',
      subcategoryId: ''
    },
    clientInfo: {
      clientId: ''
    },
    foiaInfo: {
      foiaRequired: false,
      foiaStatus: 'not_required'
    },
    caseInfo: {
      caseNumber: '',
      priorityDate: '',
      assignedStaff: '',
      caseNotes: ''
    },
    documents: {
      documents: []
    },
    processedForms: {
      forms: []
    }
  });

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'forms',
      title: 'Form Selection',
      description: 'Select required USCIS forms',
      isCompleted: false,
      isCurrent: true
    },
    {
      id: 'categories',
      title: 'Category Selection',
      description: 'Choose case categories',
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'client',
      title: 'Client Information',
      description: 'Enter client details',
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'foia',
      title: 'FOIA Requirements',
      description: 'FOIA request details',
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'case',
      title: 'Case Details',
      description: 'Document case information',
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload required documents',
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'processing',
      title: 'Form Processing',
      description: 'Process and generate forms',
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'complete',
      title: 'Completion',
      description: 'Review and submit',
      isCompleted: false,
      isCurrent: false
    }
  ]);

  useEffect(() => {
    setSteps(prevSteps => prevSteps.map((step, index) => ({
      ...step,
      isCurrent: index === currentStep,
      isCompleted: getStepCompletionStatus(index)
    })));
  }, [currentStep, formData]);

  const getStepCompletionStatus = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return formData.selectedForms.length > 0;
      case 1:
        return formData.selectedCategories.categoryId !== '' && formData.selectedCategories.subcategoryId !== '';
      case 2:
        return !!formData.clientInfo.clientId;
      case 3:
        return !!formData.foiaInfo.foiaRequired && formData.foiaInfo.foiaStatus !== 'not_required';
      case 4:
        return !!formData.caseInfo.caseNumber && !!formData.caseInfo.priorityDate && !!formData.caseInfo.assignedStaff && !!formData.caseInfo.caseNotes;
      case 5:
        return formData.documents.documents.length > 0;
      case 6:
        return formData.processedForms.forms.length > 0;
      case 7:
        return true; // Always allow completion of the last step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepUpdate = (stepData: any) => {
    setFormData(prev => {
      // Create a new object with the updated data
      const updatedData = { ...prev };
      
      // Update the specific fields based on the current step
      switch (currentStep) {
        case 0:
          updatedData.selectedForms = stepData.selectedForms;
          break;
        case 1:
          updatedData.selectedCategories = stepData;
          break;
        case 2:
          updatedData.clientInfo = stepData;
          break;
        case 3:
          updatedData.foiaInfo = stepData;
          break;
        case 4:
          updatedData.caseInfo = stepData;
          break;
        case 5:
          updatedData.documents = stepData;
          break;
        case 6:
          updatedData.processedForms = stepData;
          break;
      }
      
      return updatedData;
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <FormSelection onUpdate={handleStepUpdate} data={formData.selectedForms} />;
      case 1:
        return <CategorySelection onUpdate={handleStepUpdate} data={formData.selectedCategories} />;
      case 2:
        return <ClientCreation onUpdate={handleStepUpdate} data={formData.clientInfo} />;
      case 3:
        return <FoiaRequirement onUpdate={handleStepUpdate} data={formData.foiaInfo} />;
      case 4:
        return <CaseCreation onUpdate={handleStepUpdate} data={formData.caseInfo} />;
      case 5:
        return <DocumentUpload onUpdate={handleStepUpdate} data={formData.documents} />;
      case 6:
        return <FormProcessing onUpdate={handleStepUpdate} data={formData.processedForms} />;
      case 7:
        return (
          <WizardCompleted
            data={{
              caseNumber: formData.caseInfo.caseNumber,
              category: formData.selectedCategories.categoryId,
              subcategory: formData.selectedCategories.subcategoryId,
              clientName: formData.clientInfo.clientId,
              documents: formData.documents.documents.map(doc => ({
                name: doc.name,
                status: doc.status
              })),
              forms: formData.processedForms.forms.map(form => ({
                name: form.name,
                status: form.status
              }))
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-card rounded-lg p-6">
        <ProgressIndicator steps={steps} />
        <div className="mt-8">
          {renderStep()}
        </div>
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onBack={handleBack}
          isNextDisabled={!steps[currentStep].isCompleted}
        />
      </div>
    </div>
  );
};

export default FormWizard; 