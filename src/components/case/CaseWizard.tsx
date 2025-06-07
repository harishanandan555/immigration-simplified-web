import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthControllers';
import { immigrationApi } from '../../services/api/immigrationProcess';
import { ImmigrationCategory, ImmigrationProcessForm } from '../../types/immigration';
import '../../styles/CaseWizard.css';
import { DocumentUpload } from '../forms/DocumentUpload';
import { ProcessDocument } from '../../types/immigration';

interface Category {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
  }[];
}

interface Form {
  id: string;
  name: string;
  formNumber: string;
  description: string;
  filingFee: number;
  processingTime: string;
  categoryId: string;
}

const categories: Category[] = [
  {
    id: 'family',
    name: 'Family-based',
    subcategories: [
      { id: 'i130', name: 'I-130 (Spouse of U.S. Citizen)' },
      { id: 'i485', name: 'I-485 (Adjustment of Status)' }
    ]
  },
  {
    id: 'employment',
    name: 'Employment-based',
    subcategories: [
      { id: 'i140', name: 'I-140 (Immigrant Petition)' },
      { id: 'h1b', name: 'H1B (Specialty Occupation)' }
    ]
  },
  {
    id: 'naturalization',
    name: 'Naturalization',
    subcategories: [
      { id: 'n400', name: 'N-400 (Application for Naturalization)' },
      { id: 'n600', name: 'N-600 (Certificate of Citizenship)' }
    ]
  }
];

const mockForms: Form[] = [
  {
    id: 'i130',
    name: 'Petition for Alien Relative',
    formNumber: 'I-130',
    description: 'Used to establish the relationship between certain alien relatives who want to immigrate to the United States and U.S. citizens or lawful permanent residents.',
    filingFee: 535,
    processingTime: '6-12 months',
    categoryId: 'family'
  },
  {
    id: 'i485',
    name: 'Application to Register Permanent Residence or Adjust Status',
    formNumber: 'I-485',
    description: 'Used to apply for lawful permanent resident status while in the United States.',
    filingFee: 1140,
    processingTime: '8-14 months',
    categoryId: 'family'
  },
  {
    id: 'i140',
    name: 'Immigrant Petition for Alien Worker',
    formNumber: 'I-140',
    description: 'Used to petition for an alien to come to the United States to work permanently.',
    filingFee: 700,
    processingTime: '6-8 months',
    categoryId: 'employment'
  },
  {
    id: 'h1b',
    name: 'Petition for a Nonimmigrant Worker',
    formNumber: 'I-129',
    description: 'Used to petition for a nonimmigrant worker to come to the United States temporarily.',
    filingFee: 460,
    processingTime: '2-4 months',
    categoryId: 'employment'
  }
];

interface CaseFormData {
  caseType: string;
  subCategory: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  documents: string[];
  forms: string[];
}

interface CaseWizardProps {
  onComplete: (processId: string) => void;
}

const CaseWizard: React.FC<CaseWizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);

  // Form state
  const [clientId, setClientId] = useState<string>('');
  const [caseType, setCaseType] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [assignedStaff, setAssignedStaff] = useState<string>('');
  const [priorityDate, setPriorityDate] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [caseNotes, setCaseNotes] = useState<string>('');
  const [relatedCases, setRelatedCases] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [requiredForms, setRequiredForms] = useState<Form[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<ProcessDocument[]>([]);

  const steps = [
    { id: 1, title: 'Client Selection', description: 'Select or create a new client' },
    { id: 2, title: 'Case Type', description: 'Choose the type of immigration case' },
    { id: 3, title: 'Staff Assignment', description: 'Assign staff to the case' },
    { id: 4, title: 'Priority & Deadlines', description: 'Set case priority and deadlines' },
    { id: 5, title: 'Case Details', description: 'Add case notes and related cases' },
    { id: 6, title: 'Document Upload', description: 'Upload required documents' },
    { id: 7, title: 'Review', description: 'Review and submit case' }
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await immigrationApi.getClients();
      setClients(response);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients. Please try again.');
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    setCaseType(category);
    setSubcategory('');
    setRequiredForms([]);
    setSelectedForms([]);
    
    try {
      // In a real application, this would be an API call
      const categoryForms = mockForms.filter(form => form.categoryId === category);
      setRequiredForms(categoryForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setError('Failed to load required forms');
    }
  };

  const getRequiredDocuments = (category: string, subcategory: string): string[] => {
    const documentMap: Record<string, Record<string, string[]>> = {
      family: {
        i130: ['Marriage Certificate', 'Proof of Relationship', 'Financial Documents'],
        i485: ['Birth Certificate', 'Medical Exam', 'Passport Copy']
      },
      employment: {
        i140: ['Job Offer Letter', 'Qualifications', 'Resume'],
        h1b: ['Degree Certificate', 'Employer Letter', 'Passport Copy']
      },
      naturalization: {
        n400: ['Green Card Copy', 'Passport Photos', 'Tax Returns'],
        n600: ['Birth Certificate', "Parent's Naturalization Certificate"]
      }
    };
    return documentMap[category]?.[subcategory] || [];
  };

  const handleDocumentsUploaded = (documents: ProcessDocument[]) => {
    setUploadedDocuments(documents);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const caseData = {
        caseId: `CASE-${Date.now()}`,
        clientId,
        categoryId: caseType,
        subcategoryId: subcategory,
        visaType: subcategory,
        assignedStaff,
        priorityDate,
        deadline,
        caseNotes,
        relatedCases,
        status: 'pending' as const,
        currentStep: 'type',
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        forms: selectedForms,
        documents: uploadedDocuments
      };

      // In a real application, this would be an API call
      const response = { id: caseData.caseId };
      onComplete(response.id);
    } catch (error) {
      console.error('Error creating case:', error);
      setError('Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    navigate('/clients/create');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step">
            <h3>Client Selection</h3>
            <div className="form-group">
              <label>Select Client</label>
              <select 
                value={clientId} 
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {`${client.firstName} ${client.lastName}`}
                  </option>
                ))}
              </select>
              <button 
                className="secondary-button"
                onClick={handleCreateClient}
              >
                Create New Client
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="wizard-step">
            <h3>Case Type Selection</h3>
            <div className="form-group">
              <label htmlFor="caseType">Case Type</label>
              <select 
                value={caseType} 
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
              >
                <option value="">Select case type</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="required-forms-section">
                <h3 className="text-lg font-semibold mb-4">Required Forms</h3>
                {loading ? (
                  <div className="loading-spinner">Loading forms...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : requiredForms.length > 0 ? (
                  <div className="forms-grid">
                    {requiredForms.map((form) => (
                      <div key={form.id} className="form-card">
                        <div className="form-header">
                          <h4 className="form-title">{form.name}</h4>
                          <span className="form-number">{form.formNumber}</span>
                        </div>
                        <p className="form-description">{form.description}</p>
                        <div className="form-details">
                          <span className="filing-fee">Filing Fee: ${form.filingFee}</span>
                          <span className="processing-time">
                            Processing Time: {form.processingTime}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No forms required for this case type.</p>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="subcategory">Subcategory</label>
              <select
                id="subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                required
                disabled={!caseType}
              >
                <option value="">Select subcategory</option>
                {categories
                  .find(cat => cat.id === caseType)
                  ?.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            </div>

            {subcategory && (
              <div className="form-group">
                <label htmlFor="requiredForms">Required Forms</label>
                <div className="forms-multiselect">
                  {loading ? (
                    <div className="loading-spinner">Loading forms...</div>
                  ) : error ? (
                    <div className="error-message">{error}</div>
                  ) : requiredForms.length > 0 ? (
                    <div className="forms-checkbox-list">
                      {requiredForms.map((form) => (
                        <div key={form.id} className="form-checkbox-item">
                          <input
                            type="checkbox"
                            id={`form-${form.id}`}
                            checked={selectedForms.includes(form.id)}
                            onChange={(e) => {
                              const newForms = e.target.checked
                                ? [...selectedForms, form.id]
                                : selectedForms.filter(id => id !== form.id);
                              setSelectedForms(newForms);
                            }}
                          />
                          <label htmlFor={`form-${form.id}`}>
                            <div className="form-checkbox-content">
                              <div className="form-checkbox-header">
                                <span className="form-name">{form.name}</span>
                                <span className="form-number">{form.formNumber}</span>
                              </div>
                              <div className="form-checkbox-details">
                                <span className="filing-fee">Filing Fee: ${form.filingFee}</span>
                                <span className="processing-time">
                                  Processing Time: {form.processingTime}
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No forms required for this subcategory.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="wizard-step">
            <h3>Staff Assignment</h3>
            <div className="form-group">
              <label>Assign Staff</label>
              <select 
                value={assignedStaff} 
                onChange={(e) => setAssignedStaff(e.target.value)}
                required
              >
                <option value="">Select staff member</option>
                <option value="attorney1">Attorney John Doe</option>
                <option value="paralegal1">Paralegal Jane Smith</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step">
            <h3>Priority & Deadlines</h3>
            <div className="form-group">
              <label>Priority Date</label>
              <input 
                type="date" 
                value={priorityDate} 
                onChange={(e) => setPriorityDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input 
                type="date" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="wizard-step">
            <h3>Case Details</h3>
            <div className="form-group">
              <label>Case Notes</label>
              <textarea 
                value={caseNotes} 
                onChange={(e) => setCaseNotes(e.target.value)}
                placeholder="Add internal notes for attorney/paralegal communication"
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Related Cases</label>
              <div className="related-cases">
                <input 
                  type="text" 
                  placeholder="Enter case number"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      setRelatedCases([...relatedCases, input.value]);
                      input.value = '';
                    }
                  }}
                />
                <ul className="related-cases-list">
                  {relatedCases.map((caseId, index) => (
                    <li key={index}>
                      {caseId}
                      <button onClick={() => setRelatedCases(relatedCases.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="wizard-step">
            <h3>Document Upload</h3>
            <DocumentUpload
              requiredDocuments={getRequiredDocuments(caseType, subcategory)}
              onUploadComplete={handleDocumentsUploaded}
              disabled={loading}
              error={error}
            />
          </div>
        );

      case 7:
        return (
          <div className="wizard-step">
            <h3>Review Case Details</h3>
            <div className="review-section">
              <h4>Client Information</h4>
              <p>Client ID: {clientId}</p>
              
              <h4>Case Information</h4>
              <p>Case Type: {caseType}</p>
              <p>Subcategory: {subcategory}</p>
              
              <h4>Staff Assignment</h4>
              <p>Assigned Staff: {assignedStaff}</p>
              
              <h4>Timeline</h4>
              <p>Priority Date: {priorityDate}</p>
              <p>Deadline: {deadline}</p>
              
              <h4>Additional Information</h4>
              <p>Case Notes: {caseNotes}</p>
              <p>Related Cases: {relatedCases.join(', ') || 'None'}</p>
              <h4>Uploaded Documents</h4>
              {uploadedDocuments.length > 0 ? (
                <ul>
                  {uploadedDocuments.map((doc) => (
                    <li key={doc.id}>
                      {doc.name} ({doc.type}) - {doc.status}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No documents uploaded.</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="case-wizard">
      <div className="wizard-header">
        <h2>New Case Wizard</h2>
        <div className="steps-indicator">
          {steps.map(step => (
            <div 
              key={step.id} 
              className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            >
              <span className="step-number">{step.id}</span>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        {error && <div className="error-message">{error}</div>}
        {renderStep()}
      </div>

      <div className="wizard-footer">
        {currentStep > 1 && (
          <button 
            className="back-button" 
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
        )}
        
        {currentStep < steps.length ? (
          <button 
            className="next-button" 
            onClick={handleNext}
            disabled={loading}
          >
            Next
          </button>
        ) : (
          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating Case...' : 'Create Case'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CaseWizard; 