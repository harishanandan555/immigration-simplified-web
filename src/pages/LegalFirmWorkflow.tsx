import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, ClipboardList, Send, Download, CheckCircle, 
  ArrowRight, ArrowLeft, Plus, User, Briefcase, FormInput,
  MessageSquare, FileCheck, AlertCircle, Clock, Star
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import FileUpload from '../components/common/FileUpload';
import { downloadFilledI130PDF, I130FormData } from '../utils/pdfUtils';
import questionnaireService from '../services/questionnaireService';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth: string;
  nationality: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Case {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: 'draft' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedForms: string[];
  questionnaires: string[];
  createdAt: string;
  dueDate: string;
}

interface QuestionnaireAssignment {
  id: string;
  caseId: string;
  clientId: string;
  questionnaireId: string;
  questionnaireName: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  responses: Record<string, any>;
}

interface FormData {
  formType: string;
  data: Record<string, any>;
  status: 'draft' | 'review' | 'completed';
}

const IMMIGRATION_CATEGORIES = [
  {
    id: 'family-based',
    name: 'Family-Based Immigration',
    subcategories: [
      { id: 'immediate-relative', name: 'Immediate Relative (I-130)', forms: ['I-130', 'I-485'] },
      { id: 'family-preference', name: 'Family Preference Categories', forms: ['I-130', 'I-824'] },
      { id: 'adjustment-status', name: 'Adjustment of Status', forms: ['I-485', 'I-864'] }
    ]
  },
  {
    id: 'employment-based',
    name: 'Employment-Based Immigration',
    subcategories: [
      { id: 'professional-worker', name: 'Professional Worker (EB-2/EB-3)', forms: ['I-140', 'I-485'] },
      { id: 'temporary-worker', name: 'Temporary Worker', forms: ['I-129', 'I-94'] },
      { id: 'investment-based', name: 'Investment-Based (EB-5)', forms: ['I-526', 'I-485'] }
    ]
  },
  {
    id: 'citizenship',
    name: 'Citizenship & Naturalization',
    subcategories: [
      { id: 'naturalization', name: 'Naturalization Application', forms: ['N-400'] },
      { id: 'certificate-citizenship', name: 'Certificate of Citizenship', forms: ['N-600'] }
    ]
  }
];

const WORKFLOW_STEPS = [
  { id: 'client', title: 'Create Client', icon: Users, description: 'Add new client information' },
  { id: 'case', title: 'Create Case', icon: Briefcase, description: 'Set up case details and category' },
  { id: 'forms', title: 'Select Forms', icon: FileText, description: 'Choose required forms for filing' },
  { id: 'questionnaire', title: 'Assign Questions', icon: ClipboardList, description: 'Send questionnaire to client' },
  { id: 'answers', title: 'Collect Answers', icon: MessageSquare, description: 'Review client responses' },
  { id: 'form-details', title: 'Form Details', icon: FormInput, description: 'Complete form information' },
  { id: 'auto-fill', title: 'Auto-fill Forms', icon: FileCheck, description: 'Generate completed forms' }
];

const LegalFirmWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Client data
  const [client, setClient] = useState<Client>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    dateOfBirth: '',
    nationality: '',
    status: 'active',
    createdAt: ''
  });

  // Case data
  const [caseData, setCaseData] = useState<Case>({
    id: '',
    clientId: '',
    title: '',
    description: '',
    category: '',
    subcategory: '',
    status: 'draft',
    priority: 'medium',
    assignedForms: [],
    questionnaires: [],
    createdAt: '',
    dueDate: ''
  });

  // Selected forms and questionnaires
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>('');
  
  // Questionnaire assignment and responses
  const [questionnaireAssignment, setQuestionnaireAssignment] = useState<QuestionnaireAssignment | null>(null);
  const [clientResponses, setClientResponses] = useState<Record<string, any>>({});
  
  // Form details
  const [formDetails, setFormDetails] = useState<FormData[]>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  // Load available questionnaires
  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      const isAPIAvailable = await questionnaireService.isAPIAvailable();
      
      if (isAPIAvailable) {
        const response = await questionnaireService.getQuestionnaires({
          is_active: true,
          limit: 50
        });
        setAvailableQuestionnaires(response.questionnaires);
      } else {
        // Fallback to localStorage
        const savedQuestionnaires = localStorage.getItem('immigration-questionnaires');
        if (savedQuestionnaires) {
          setAvailableQuestionnaires(JSON.parse(savedQuestionnaires));
        }
      }
    } catch (error) {
      console.error('Error loading questionnaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    console.log('Current step:', currentStep, 'Moving to:', currentStep + 1);
    if (currentStep < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClientSubmit = () => {
    console.log('Client submit called with data:', client);
    
    // Generate client ID and save
    const clientId = `client_${Date.now()}`;
    const updatedClient = {
      ...client,
      id: clientId,
      createdAt: new Date().toISOString()
    };
    setClient(updatedClient);
    
    // Save to localStorage (in real app, this would be API call)
    const existingClients = JSON.parse(localStorage.getItem('legal-firm-clients') || '[]');
    existingClients.push(updatedClient);
    localStorage.setItem('legal-firm-clients', JSON.stringify(existingClients));
    
    console.log('Client saved, calling handleNext');
    handleNext();
  };

  const handleCaseSubmit = () => {
    // Generate case ID and save
    const caseId = `case_${Date.now()}`;
    const updatedCase = {
      ...caseData,
      id: caseId,
      clientId: client.id,
      createdAt: new Date().toISOString()
    };
    setCaseData(updatedCase);
    
    // Save to localStorage
    const existingCases = JSON.parse(localStorage.getItem('legal-firm-cases') || '[]');
    existingCases.push(updatedCase);
    localStorage.setItem('legal-firm-cases', JSON.stringify(existingCases));
    
    handleNext();
  };

  const handleFormsSubmit = () => {
    // Update case with selected forms
    const updatedCase = {
      ...caseData,
      assignedForms: selectedForms
    };
    setCaseData(updatedCase);
    handleNext();
  };

  const handleQuestionnaireAssignment = () => {
    if (!selectedQuestionnaire) return;
    
    const assignment: QuestionnaireAssignment = {
      id: `assignment_${Date.now()}`,
      caseId: caseData.id,
      clientId: client.id,
      questionnaireId: selectedQuestionnaire,
      questionnaireName: availableQuestionnaires.find(q => q.id === selectedQuestionnaire)?.title || 'Questionnaire',
      status: 'pending',
      assignedAt: new Date().toISOString(),
      responses: {}
    };
    
    setQuestionnaireAssignment(assignment);
    
    // Save assignment
    const existingAssignments = JSON.parse(localStorage.getItem('questionnaire-assignments') || '[]');
    existingAssignments.push(assignment);
    localStorage.setItem('questionnaire-assignments', JSON.stringify(existingAssignments));
    
    handleNext();
  };

  const handleResponseSubmit = () => {
    if (!questionnaireAssignment) return;
    
    const updatedAssignment = {
      ...questionnaireAssignment,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      responses: clientResponses
    };
    
    setQuestionnaireAssignment(updatedAssignment);
    handleNext();
  };

  const handleFormDetailsSubmit = () => {
    handleNext();
  };

  const handleAutoFillForms = async () => {
    try {
      setLoading(true);
      
      // For I-130 form auto-fill
      if (selectedForms.includes('I-130')) {
        const i130Data = {
          relationshipType: caseData.subcategory.includes('spouse') ? 'Spouse' : 'Child',
          petitionerFamilyName: client.lastName,
          petitionerGivenName: client.firstName,
          petitionerMiddleName: '',
          petitionerBirthCity: clientResponses.birthCity || '',
          petitionerBirthCountry: clientResponses.birthCountry || client.nationality,
          petitionerDateOfBirth: client.dateOfBirth,
          petitionerSex: clientResponses.gender || 'Male',
          petitionerMailingAddress: `${client.address.street}, ${client.address.city}, ${client.address.state} ${client.address.zipCode}`,
          petitionerCurrentStatus: 'U.S. Citizen',
          petitionerDaytimePhone: client.phone,
          petitionerEmail: client.email,
          beneficiaryFamilyName: clientResponses.beneficiaryLastName || '',
          beneficiaryGivenName: clientResponses.beneficiaryFirstName || '',
          beneficiaryMiddleName: clientResponses.beneficiaryMiddleName || '',
          beneficiaryBirthCity: clientResponses.beneficiaryBirthCity || '',
          beneficiaryBirthCountry: clientResponses.beneficiaryBirthCountry || '',
          beneficiaryDateOfBirth: clientResponses.beneficiaryDateOfBirth || '',
          beneficiarySex: clientResponses.beneficiaryGender || 'Female',
          beneficiaryMailingAddress: clientResponses.beneficiaryAddress || ''
        };
        
        await downloadFilledI130PDF(i130Data);
      }
      
      // Here you would handle other forms similarly
      
    } catch (error) {
      console.error('Error auto-filling forms:', error);
      alert('Error generating forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Create Client
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
              <p className="text-blue-700">Enter the client's personal details to create their profile.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="firstName"
                label="First Name"
                value={client.firstName}
                onChange={(e) => setClient({...client, firstName: e.target.value})}
                required
              />
              <Input
                id="lastName"
                label="Last Name"
                value={client.lastName}
                onChange={(e) => setClient({...client, lastName: e.target.value})}
                required
              />
              <Input
                id="email"
                label="Email Address"
                type="email"
                value={client.email}
                onChange={(e) => setClient({...client, email: e.target.value})}
                required
              />
              <Input
                id="phone"
                label="Phone Number"
                value={client.phone}
                onChange={(e) => setClient({...client, phone: e.target.value})}
                required
              />
              <Input
                id="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={client.dateOfBirth}
                onChange={(e) => setClient({...client, dateOfBirth: e.target.value})}
                required
              />
              <Input
                id="nationality"
                label="Nationality"
                value={client.nationality}
                onChange={(e) => setClient({...client, nationality: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="street"
                  label="Street Address"
                  value={client.address.street}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, street: e.target.value}
                  })}
                  className="md:col-span-2"
                />
                <Input
                  id="city"
                  label="City"
                  value={client.address.city}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, city: e.target.value}
                  })}
                />
                <Input
                  id="state"
                  label="State"
                  value={client.address.state}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, state: e.target.value}
                  })}
                />
                <Input
                  id="zipCode"
                  label="ZIP Code"
                  value={client.address.zipCode}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, zipCode: e.target.value}
                  })}
                />
                <Input
                  id="country"
                  label="Country"
                  value={client.address.country}
                  onChange={(e) => setClient({
                    ...client, 
                    address: {...client.address, country: e.target.value}
                  })}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleClientSubmit}
                disabled={!client.firstName || !client.lastName || !client.email}
              >
                Create Client & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 1: // Create Case
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Case Setup</h3>
              <p className="text-green-700">Create a new case for client: <strong>{client.firstName} {client.lastName}</strong></p>
            </div>
            
            <div className="space-y-4">
              <Input
                id="caseTitle"
                label="Case Title"
                value={caseData.title}
                onChange={(e) => setCaseData({...caseData, title: e.target.value})}
                placeholder="e.g., Family-Based Immigration - Spouse Petition"
                required
              />
              
              <TextArea
                id="caseDescription"
                label="Case Description"
                value={caseData.description}
                onChange={(e) => setCaseData({...caseData, description: e.target.value})}
                placeholder="Brief description of the case..."
                rows={3}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  id="category"
                  label="Immigration Category"
                  value={caseData.category}
                  onChange={(e) => setCaseData({...caseData, category: e.target.value, subcategory: ''})}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...IMMIGRATION_CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))
                  ]}
                  required
                />
                
                {caseData.category && (
                  <Select
                    id="subcategory"
                    label="Subcategory"
                    value={caseData.subcategory}
                    onChange={(e) => setCaseData({...caseData, subcategory: e.target.value})}
                    options={[
                      { value: '', label: 'Select Subcategory' },
                      ...(IMMIGRATION_CATEGORIES.find(cat => cat.id === caseData.category)?.subcategories.map(sub => ({ value: sub.id, label: sub.name })) || [])
                    ]}
                    required
                  />
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  id="priority"
                  label="Priority Level"
                  value={caseData.priority}
                  onChange={(e) => setCaseData({...caseData, priority: e.target.value as any})}
                  options={[
                    { value: 'low', label: 'Low Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'high', label: 'High Priority' }
                  ]}
                />
                
                <Input
                  id="dueDate"
                  label="Due Date"
                  type="date"
                  value={caseData.dueDate}
                  onChange={(e) => setCaseData({...caseData, dueDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleCaseSubmit}
                disabled={!caseData.title || !caseData.category || !caseData.subcategory}
              >
                Create Case & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2: // Select Forms
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Required Forms</h3>
              <p className="text-purple-700">Select the forms required for this case based on the selected category.</p>
            </div>
            
            {caseData.subcategory && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Recommended Forms for {
                  IMMIGRATION_CATEGORIES
                    .find(cat => cat.id === caseData.category)?.subcategories
                    .find(sub => sub.id === caseData.subcategory)?.name
                }</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {IMMIGRATION_CATEGORIES
                    .find(cat => cat.id === caseData.category)?.subcategories
                    .find(sub => sub.id === caseData.subcategory)?.forms.map(form => (
                    <label key={form} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedForms.includes(form)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedForms([...selectedForms, form]);
                          } else {
                            setSelectedForms(selectedForms.filter(f => f !== form));
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{form}</div>
                        <div className="text-sm text-gray-500">
                          {form === 'I-130' && 'Petition for Alien Relative'}
                          {form === 'I-485' && 'Application to Register Permanent Residence'}
                          {form === 'I-864' && 'Affidavit of Support'}
                          {form === 'I-140' && 'Immigrant Petition for Alien Worker'}
                          {form === 'N-400' && 'Application for Naturalization'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleFormsSubmit}
                disabled={selectedForms.length === 0}
              >
                Confirm Forms & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3: // Assign Questionnaire
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Assign Questionnaire</h3>
              <p className="text-orange-700">Send a questionnaire to the client to collect required information.</p>
            </div>
            
            <div className="space-y-4">
              <Select
                id="questionnaire"
                label="Select Questionnaire"
                value={selectedQuestionnaire}
                onChange={(e) => setSelectedQuestionnaire(e.target.value)}
                options={[
                  { value: '', label: 'Choose a questionnaire' },
                  ...availableQuestionnaires
                    .filter(q => q.category === caseData.category || q.category === 'general')
                    .map(questionnaire => ({
                      value: questionnaire.id,
                      label: `${questionnaire.title} (${questionnaire.fields?.length || 0} questions)`
                    }))
                ]}
                required
              />
              
              {selectedQuestionnaire && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Questionnaire Preview</h4>
                  {(() => {
                    const questionnaire = availableQuestionnaires.find(q => q.id === selectedQuestionnaire);
                    return questionnaire ? (
                      <div>
                        <p className="text-gray-700 mb-2">{questionnaire.description}</p>
                        <p className="text-sm text-gray-500">
                          This questionnaire contains {questionnaire.fields?.length || 0} questions covering:
                        </p>
                        <ul className="text-sm text-gray-500 mt-1 ml-4">
                          {questionnaire.fields?.slice(0, 3).map((field: any, index: number) => (
                            <li key={index}>• {field.label}</li>
                          ))}
                          {questionnaire.fields?.length > 3 && <li>• And {questionnaire.fields.length - 3} more...</li>}
                        </ul>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleQuestionnaireAssignment}
                disabled={!selectedQuestionnaire}
              >
                Assign to Client & Continue
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 4: // Collect Answers (Simulate client responses)
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Client Responses</h3>
              <p className="text-indigo-700">Review and simulate client responses to the questionnaire.</p>
            </div>
            
            {questionnaireAssignment && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{questionnaireAssignment.questionnaireName}</h4>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {questionnaireAssignment.status}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Simulate common questions for demo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary First Name
                      </label>
                      <Input
                        id="beneficiaryFirstName"
                        label=""
                        value={clientResponses.beneficiaryFirstName || ''}
                        onChange={(e) => setClientResponses({
                          ...clientResponses,
                          beneficiaryFirstName: e.target.value
                        })}
                        placeholder="Enter beneficiary's first name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Last Name
                      </label>
                      <Input
                        id="beneficiaryLastName"
                        label=""
                        value={clientResponses.beneficiaryLastName || ''}
                        onChange={(e) => setClientResponses({
                          ...clientResponses,
                          beneficiaryLastName: e.target.value
                        })}
                        placeholder="Enter beneficiary's last name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Date of Birth
                      </label>
                      <Input
                        id="beneficiaryDateOfBirth"
                        label=""
                        type="date"
                        value={clientResponses.beneficiaryDateOfBirth || ''}
                        onChange={(e) => setClientResponses({
                          ...clientResponses,
                          beneficiaryDateOfBirth: e.target.value
                        })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Birth City
                      </label>
                      <Input
                        id="beneficiaryBirthCity"
                        label=""
                        value={clientResponses.beneficiaryBirthCity || ''}
                        onChange={(e) => setClientResponses({
                          ...clientResponses,
                          beneficiaryBirthCity: e.target.value
                        })}
                        placeholder="City of birth"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beneficiary Birth Country
                      </label>
                      <Input
                        id="beneficiaryBirthCountry"
                        label=""
                        value={clientResponses.beneficiaryBirthCountry || ''}
                        onChange={(e) => setClientResponses({
                          ...clientResponses,
                          beneficiaryBirthCountry: e.target.value
                        })}
                        placeholder="Country of birth"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship to Petitioner
                      </label>
                      <Select
                        id="relationship"
                        label=""
                        value={clientResponses.relationship || ''}
                        onChange={(e) => setClientResponses({
                          ...clientResponses,
                          relationship: e.target.value
                        })}
                        options={[
                          { value: '', label: 'Select relationship' },
                          { value: 'spouse', label: 'Spouse' },
                          { value: 'child', label: 'Child' },
                          { value: 'parent', label: 'Parent' },
                          { value: 'sibling', label: 'Sibling' }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleResponseSubmit}
                disabled={Object.keys(clientResponses).length === 0}
              >
                Responses Complete & Continue
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 5: // Form Details
        return (
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-teal-900 mb-2">Form Details</h3>
              <p className="text-teal-700">Review and complete additional form information before auto-filling.</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Selected Forms Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedForms.map(form => (
                  <div key={form} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">{form}</h5>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ready for auto-fill with client data
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Data Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Client:</strong> {client.firstName} {client.lastName}
                  </div>
                  <div>
                    <strong>Email:</strong> {client.email}
                  </div>
                  <div>
                    <strong>Case:</strong> {caseData.title}
                  </div>
                  <div>
                    <strong>Category:</strong> {IMMIGRATION_CATEGORIES.find(c => c.id === caseData.category)?.name}
                  </div>
                  <div>
                    <strong>Responses:</strong> {Object.keys(clientResponses).length} answers collected
                  </div>
                  <div>
                    <strong>Forms:</strong> {selectedForms.length} forms selected
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleFormDetailsSubmit}>
                Proceed to Auto-Fill
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 6: // Auto-fill Forms
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Auto-Fill Forms</h3>
              <p className="text-green-700">Generate completed forms with all collected information.</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Ready to Generate Forms</h4>
                
                <div className="space-y-3">
                  {selectedForms.map(form => (
                    <div key={form} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-500 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{form}</div>
                          <div className="text-sm text-gray-500">
                            Will be auto-filled with client and case data
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900">Auto-Fill Process</h5>
                      <p className="text-blue-700 text-sm mt-1">
                        The forms will be automatically filled with:
                      </p>
                      <ul className="text-blue-700 text-sm mt-2 ml-4 space-y-1">
                        <li>• Client personal information</li>
                        <li>• Address and contact details</li>
                        <li>• Questionnaire responses</li>
                        <li>• Case-specific information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleAutoFillForms}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating Forms...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Download Forms
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Legal Firm Workflow</h1>
          <p className="text-gray-600 mt-2">Complete immigration case management from client to forms</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 
                      'bg-white border-gray-300 text-gray-400'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 max-w-20">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default LegalFirmWorkflow; 