import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle2, ArrowRight, HelpCircle, Save } from 'lucide-react';
import CaseTypeSelection from '../components/wizard/CaseTypeSelection';
import PersonalInformation from '../components/wizard/PersonalInformation';
import FormSpecificQuestions from '../components/wizard/FormSpecificQuestions';
import DocumentUpload from '../components/wizard/DocumentUpload';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

const NewClientWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    caseType: '',
    forms: [] as string[],
    personalInfo: {},
    formAnswers: {},
    documents: []
  });

  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Case Type Selection',
      description: 'Select your immigration benefit type',
      component: (
        <CaseTypeSelection
          onNext={(data) => {
            setFormData(prev => ({ ...prev, caseType: data.caseType, forms: data.forms }));
            setCurrentStep(2);
          }}
        />
      )
    },
    {
      id: 2,
      title: 'Personal Information',
      description: 'Enter your personal details',
      component: (
        <PersonalInformation
          onNext={(data) => {
            setFormData(prev => ({ ...prev, personalInfo: data }));
            setCurrentStep(3);
          }}
        />
      )
    },
    {
      id: 3,
      title: 'Form-Specific Questions',
      description: 'Answer form-specific questions',
      component: (
        <FormSpecificQuestions
          onNext={(data) => {
            setFormData(prev => ({ ...prev, formAnswers: data }));
            setCurrentStep(4);
          }}
          caseType={formData.caseType}
          forms={formData.forms}
        />
      )
    },
    {
      id: 4,
      title: 'Document Upload',
      description: 'Upload required documents',
      component: (
        <DocumentUpload
          onNext={(data) => {
            setFormData(prev => ({ ...prev, documents: data.documents }));
            setCurrentStep(5);
          }}
          caseType={formData.caseType}
          forms={formData.forms}
        />
      )
    },
    {
      id: 5,
      title: 'Review & Form Preview',
      description: 'Review your information',
      component: (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Review & Form Preview</h2>
          <p>Review step coming soon...</p>
        </div>
      )
    },
    {
      id: 6,
      title: 'Paralegal Review',
      description: 'Legal verification process',
      component: (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Paralegal Review</h2>
          <p>Paralegal review step coming soon...</p>
        </div>
      )
    },
    {
      id: 7,
      title: 'Filing Instructions',
      description: 'Submit your application',
      component: (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Filing Instructions</h2>
          <p>Filing instructions step coming soon...</p>
        </div>
      )
    },
    {
      id: 8,
      title: 'Case Status Tracking',
      description: 'Track your application status',
      component: (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Case Status Tracking</h2>
          <p>Case status tracking step coming soon...</p>
        </div>
      )
    },
    {
      id: 9,
      title: 'Reminders & Notifications',
      description: 'Set up notifications',
      component: (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Reminders & Notifications</h2>
          <p>Reminders and notifications step coming soon...</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">New Immigration Case</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <Save className="h-4 w-4 mr-2" />
                Save Progress
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <HelpCircle className="h-4 w-4 mr-2" />
                Get Help
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Side Menu */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
                <h2 className="text-lg font-semibold text-primary-900">Case Progress</h2>
                <p className="mt-1 text-sm text-primary-700">
                  Complete all steps to submit your case
                </p>
              </div>
              <nav className="p-4">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`mb-4 cursor-pointer transition-all duration-200 ${
                      currentStep === step.id 
                        ? 'bg-primary-50 rounded-lg' 
                        : 'hover:bg-gray-50 rounded-lg'
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <div className="flex items-center p-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        currentStep === step.id 
                          ? 'bg-primary-600 text-white ring-4 ring-primary-100' 
                          : step.id < currentStep
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {step.id < currentStep ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          currentStep === step.id ? 'text-primary-900' : 'text-gray-900'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-500">{step.description}</p>
                      </div>
                      {currentStep === step.id && (
                        <ChevronRight className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Progress Card */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Overall Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-medium text-primary-600">
                    {Math.round((currentStep / steps.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {steps.length - currentStep} steps remaining
                </p>
              </div>
            </div>

            {/* Help Card */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-blue-900">Need Assistance?</h3>
                  <p className="mt-2 text-sm text-blue-700">
                    Our immigration experts are here to help you through every step of the process.
                  </p>
                  <button className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
                    Contact Support
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {steps[currentStep - 1].title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {steps[currentStep - 1].description}
                  </p>
                </div>
                {steps[currentStep - 1].component}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewClientWizard; 