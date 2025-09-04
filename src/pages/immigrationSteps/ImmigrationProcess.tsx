import React, { useState, useEffect, useRef } from 'react';
import type { ImmigrationProcess } from '../../types/immigration';
import api from '../../utils/api';
import { IMMIGRATION_END_POINTS } from '../../utils/constants';
import { FileCheck, AlertCircle, Users, Briefcase, Heart, Shield, Plane, Building, HelpCircle, CheckCircle, Upload, X, ChevronRight, FileText, User, Building2, ArrowLeft, Download, Info, AlertTriangle, Loader2, Plus, Calendar } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockForms } from '../../utils/mockData';
import { downloadFilledI130PDF } from '../../utils/pdfUtils';

interface SubCategory {
  id: string;
  title: string;
  description: string;
  forms: string[];
  documents: string[];
}

interface Step {
  id: number;
  name: string;
}

const progressSteps: Step[] = [
  { id: 1, name: 'Select Category' },
  { id: 2, name: 'Upload Documents' },
  { id: 3, name: 'I-130 Form Data' },
  { id: 4, name: 'Download Forms' },
];

interface MainCategory {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  forms: string[];
  documents: string[];
  subCategories: SubCategory[];
}

interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  options: MainCategory[];
}

const steps: QuestionnaireStep[] = [
  {
    id: 'immigration-type',
    title: 'What type of immigration benefit are you seeking?',
    description: 'Select the category that best matches your situation',
    options: [
      {
        id: 'family',
        title: 'Family-Based Immigration',
        description: 'Green card through family relationship',
        icon: <Users className="h-6 w-6" />,
        forms: ['I-130', 'I-485', 'I-864', 'I-693', 'I-765', 'I-131'],
        documents: [
          'Marriage Certificate',
          'Birth Certificate',
          'Passport',
          'Joint Financial Documents',
          'Photos Together',
          'Affidavit of Support Evidence'
        ],
        subCategories: [
          {
            id: 'spouse',
            title: 'Spouse of U.S. Citizen',
            description: 'Marriage-based green card',
            forms: ['I-130', 'I-485', 'I-864', 'I-693', 'I-765', 'I-131'],
            documents: [
              'Marriage Certificate',
              'Birth Certificate',
              'Passport',
              'Joint Financial Documents',
              'Photos Together',
              'Affidavit of Support Evidence'
            ]
          },
          {
            id: 'parent',
            title: 'Parent of U.S. Citizen',
            description: 'Green card for parent',
            forms: ['I-130', 'I-485', 'I-864', 'I-693', 'I-765'],
            documents: [
              'Birth Certificate',
              'Passport',
              'Child\'s Birth Certificate',
              'Proof of U.S. Citizenship',
              'Financial Documents'
            ]
          },
          {
            id: 'child',
            title: 'Child of U.S. Citizen',
            description: 'Green card for child under 21',
            forms: ['I-130', 'I-485', 'I-864', 'I-693'],
            documents: [
              'Birth Certificate',
              'Passport',
              'Parent\'s Proof of Citizenship',
              'School Records'
            ]
          },
          {
            id: 'sibling',
            title: 'Sibling of U.S. Citizen',
            description: 'Green card for brother or sister',
            forms: ['I-130', 'I-485', 'I-864', 'I-693'],
            documents: [
              'Birth Certificates',
              'Passport',
              'Parent\'s Documents',
              'Proof of Relationship'
            ]
          }
        ]
      },
      {
        id: 'employment',
        title: 'Employment-Based Immigration',
        description: 'Work visas and employment green cards',
        icon: <Briefcase className="h-6 w-6" />,
        forms: [],
        documents: [],
        subCategories: [
          {
            id: 'eb1',
            title: 'EB-1 Priority Workers',
            description: 'Extraordinary ability, Outstanding researchers, Multinational executives',
            forms: ['I-140', 'I-485', 'I-907', 'I-765', 'I-131'],
            documents: [
              'Evidence of Achievements',
              'Publications',
              'Awards',
              'Employment Records',
              'Expert Letters'
            ]
          },
          {
            id: 'eb2',
            title: 'EB-2 Advanced Degree',
            description: 'Advanced degree or exceptional ability',
            forms: ['I-140', 'I-485', 'ETA-9089', 'I-765', 'I-131'],
            documents: [
              'Advanced Degree Certificate',
              'Employment Records',
              'Skills Evidence',
              'Labor Certification'
            ]
          },
          {
            id: 'eb3',
            title: 'EB-3 Skilled Workers',
            description: 'Skilled workers, professionals, other workers',
            forms: ['I-140', 'I-485', 'ETA-9089', 'I-765'],
            documents: [
              'Education Records',
              'Work Experience Letters',
              'Skills Certificates',
              'Labor Certification'
            ]
          },
          {
            id: 'eb5',
            title: 'EB-5 Investors',
            description: 'Investment-based immigration',
            forms: ['I-526', 'I-485', 'I-829'],
            documents: [
              'Investment Documentation',
              'Business Plan',
              'Source of Funds',
              'Job Creation Evidence'
            ]
          }
        ]
      },
      {
        id: 'humanitarian',
        title: 'Humanitarian Relief',
        description: 'Asylum, refugee, or special programs',
        icon: <Heart className="h-6 w-6" />,
        forms: [],
        documents: [],
        subCategories: [
          {
            id: 'asylum',
            title: 'Asylum',
            description: 'Protection based on persecution',
            forms: ['I-589', 'I-765', 'I-131'],
            documents: [
              'Identity Documents',
              'Evidence of Persecution',
              'Country Conditions Reports',
              'Personal Statement',
              'Supporting Affidavits'
            ]
          },
          {
            id: 'vawa',
            title: 'VAWA Self-Petition',
            description: 'For victims of domestic violence',
            forms: ['I-360', 'I-485', 'I-765'],
            documents: [
              'Evidence of Abuse',
              'Police Reports',
              'Medical Records',
              'Witness Statements'
            ]
          },
          {
            id: 'u-visa',
            title: 'U Visa',
            description: 'For victims of certain crimes',
            forms: ['I-918', 'I-918A', 'I-765'],
            documents: [
              'Police Certification',
              'Criminal Records',
              'Medical Records',
              'Victim Impact Statement'
            ]
          },
          {
            id: 't-visa',
            title: 'T Visa',
            description: 'For trafficking victims',
            forms: ['I-914', 'I-914A', 'I-765'],
            documents: [
              'Evidence of Trafficking',
              'Law Enforcement Statement',
              'Personal Statement',
              'Supporting Evidence'
            ]
          }
        ]
      },
      {
        id: 'citizenship',
        title: 'Citizenship & Naturalization',
        description: 'Become a U.S. citizen',
        icon: <Shield className="h-6 w-6" />,
        forms: [],
        documents: [],
        subCategories: [
          {
            id: 'naturalization',
            title: 'Naturalization',
            description: 'General naturalization path',
            forms: ['N-400', 'N-445', 'N-426'],
            documents: [
              'Green Card',
              'Tax Returns',
              'Travel History',
              'Criminal Records',
              'Selective Service'
            ]
          },
          {
            id: 'military',
            title: 'Military Service',
            description: 'Naturalization through military service',
            forms: ['N-400', 'N-426', 'G-325'],
            documents: [
              'Military Service Records',
              'Green Card',
              'Deployment Records',
              'Character References'
            ]
          },
          {
            id: 'derivative',
            title: 'Derivative Citizenship',
            description: 'Citizenship through parents',
            forms: ['N-600', 'N-600K'],
            documents: [
              'Parent\'s Naturalization Certificate',
              'Birth Certificate',
              'Parent\'s Marriage Certificate',
              'Legal Custody Documents'
            ]
          }
        ]
      },
      {
        id: 'temporary',
        title: 'Temporary Visas',
        description: 'Non-immigrant visas for temporary stay',
        icon: <Plane className="h-6 w-6" />,
        forms: [],
        documents: [],
        subCategories: [
          {
            id: 'student',
            title: 'Student Visas',
            description: 'F-1 and M-1 visas',
            forms: ['I-20', 'I-901', 'DS-160'],
            documents: [
              'Acceptance Letter',
              'Financial Documents',
              'Academic Records',
              'SEVIS Payment Receipt'
            ]
          },
          {
            id: 'work',
            title: 'Temporary Work Visas',
            description: 'H-1B, L-1, O-1 visas',
            forms: ['I-129', 'I-907', 'LCA'],
            documents: [
              'Employment Contract',
              'Educational Credentials',
              'Company Documents',
              'Specialty Documentation'
            ]
          },
          {
            id: 'exchange',
            title: 'Exchange Visitor',
            description: 'J-1 visa programs',
            forms: ['DS-2019', 'DS-160'],
            documents: [
              'Program Acceptance',
              'Financial Support',
              'Insurance Coverage',
              'Skills/Qualifications'
            ]
          }
        ]
      },
      {
        id: 'business',
        title: 'Business Immigration',
        description: 'Business and investment-based options',
        icon: <Building className="h-6 w-6" />,
        forms: [],
        documents: [],
        subCategories: [
          {
            id: 'l1',
            title: 'L-1 Intracompany Transfer',
            description: 'For multinational executives and managers',
            forms: ['I-129', 'I-129S', 'I-907'],
            documents: [
              'Corporate Documents',
              'Business Plans',
              'Financial Statements',
              'Organizational Charts'
            ]
          },
          {
            id: 'e2',
            title: 'E-2 Treaty Investor',
            description: 'Investment-based temporary visa',
            forms: ['I-129', 'DS-160'],
            documents: [
              'Investment Documentation',
              'Business Plan',
              'Financial Statements',
              'Treaty Country Evidence'
            ]
          },
          {
            id: 'regional-center',
            title: 'Regional Center EB-5',
            description: 'Investment through approved centers',
            forms: ['I-526', 'I-485', 'I-829'],
            documents: [
              'Investment Agreement',
              'Source of Funds',
              'Regional Center Approval',
              'Project Documents'
            ]
          }
        ]
      }
    ]
  }
];

// Helper function to get document description
const getDocumentDescription = (docName: string): string => {
  
  const descriptions: { [key: string]: string } = {
    'Marriage Certificate': 'Official document proving your marriage',
    'Birth Certificate': 'Official document proving your birth',
    'Passport': 'Current valid passport',
    'Joint Financial Documents': 'Documents showing shared finances',
    'Photos Together': 'Recent photos of you together',
    'Affidavit of Support Evidence': 'Financial documents for support',
    'Child\'s Birth Certificate': 'Birth certificate of your child',
    'Proof of U.S. Citizenship': 'Document proving U.S. citizenship',
    'Financial Documents': 'Bank statements, tax returns, etc.',
    'Parent\'s Proof of Citizenship': 'Document proving parent\'s citizenship',
    'School Records': 'Academic records and transcripts',
    'Birth Certificates': 'Birth certificates of all parties',
    'Parent\'s Documents': 'Documents proving parent-child relationship',
    'Proof of Relationship': 'Documents proving family relationship',
    'Evidence of Achievements': 'Awards, publications, etc.',
    'Publications': 'Published works and research',
    'Awards': 'Certificates and recognition',
    'Employment Records': 'Work history and experience',
    'Expert Letters': 'Recommendation letters from experts',
    'Advanced Degree Certificate': 'Certificate of advanced degree',
    'Skills Evidence': 'Proof of specialized skills',
    'Labor Certification': 'Approved labor certification',
    'Education Records': 'Academic transcripts and diplomas',
    'Work Experience Letters': 'Letters from previous employers',
    'Skills Certificates': 'Professional certifications',
    'Investment Documentation': 'Proof of investment',
    'Business Plan': 'Detailed business plan',
    'Source of Funds': 'Documentation of fund sources',
    'Job Creation Evidence': 'Proof of job creation',
    'Identity Documents': 'Government-issued ID documents',
    'Evidence of Persecution': 'Documentation of persecution',
    'Country Conditions Reports': 'Reports about country conditions',
    'Personal Statement': 'Detailed personal statement',
    'Supporting Affidavits': 'Sworn statements from witnesses',
    'Evidence of Abuse': 'Documentation of abuse',
    'Police Reports': 'Official police reports',
    'Medical Records': 'Medical documentation',
    'Witness Statements': 'Statements from witnesses',
    'Police Certification': 'Certification from law enforcement',
    'Criminal Records': 'Records of criminal activity',
    'Victim Impact Statement': 'Statement about impact of crime',
    'Evidence of Trafficking': 'Documentation of trafficking',
    'Law Enforcement Statement': 'Statement from law enforcement',
    'Green Card': 'Current valid green card',
    'Tax Returns': 'Recent tax returns',
    'Travel History': 'Record of international travel',
    'Criminal History': 'Record of any criminal history',
    'Selective Service': 'Selective service registration',
    'Military Service Records': 'Records of military service',
    'Deployment Records': 'Records of military deployments',
    'Character References': 'Letters of recommendation',
    'Parent\'s Naturalization Certificate': 'Certificate of naturalization',
    'Parent\'s Marriage Certificate': 'Marriage certificate of parents',
    'Legal Custody Documents': 'Documents proving legal custody',
    'Acceptance Letter': 'Letter of acceptance from institution',
    'Financial Support Documents': 'Proof of financial support',
    'Academic Records': 'Educational transcripts',
    'SEVIS Payment Receipt': 'Receipt of SEVIS payment',
    'Employment Contract': 'Contract with employer',
    'Educational Credentials': 'Academic credentials',
    'Company Documents': 'Business registration documents',
    'Specialty Documentation': 'Documents proving specialty occupation',
    'Program Acceptance': 'Acceptance into exchange program',
    'Insurance Coverage': 'Health insurance documentation',
    'Skills/Qualifications': 'Proof of skills and qualifications',
    'Corporate Documents': 'Business registration and documents',
    'Business Plans': 'Detailed business plans',
    'Company Financial Statements': 'Company financial statements',
    'Organizational Charts': 'Company structure charts',
    'Investment Documentation EB5': 'Proof of investment for EB-5',
    'Business Plan EB5': 'Detailed business plan for EB-5',
    'Treaty Country Evidence': 'Proof of treaty country citizenship',
    'Investment Agreement': 'Agreement for investment',
    'Source of Funds EB5': 'Documentation of fund sources for EB-5',
    'Regional Center Approval': 'Approval from regional center',
    'Project Documents': 'Documents related to investment project'
  };

  return descriptions[docName] || 'Required document for your application';
  
};

const ImmigrationProcess: React.FC = () => {
  const navigate = useNavigate();
  const [showProcessChoice, setShowProcessChoice] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState<'individualUser' | 'legal-firm' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({
    // Part 1. Relationship
    relationshipType: '', // Spouse, Parent, Brother/Sister, Child
    childRelationshipType: '', // For child/parent relationships
    relatedByAdoption: '', // Yes/No for brother/sister
    
    // Part 2. Petitioner Information
    petitionerFamilyName: '',
    petitionerGivenName: '',
    petitionerMiddleName: '',
    petitionerBirthCity: '',
    petitionerBirthCountry: '',
    petitionerDateOfBirth: '',
    petitionerSex: '',
    petitionerMailingAddress: '',
    petitionerPhysicalAddress: '',
    petitionerCurrentStatus: '', // U.S. Citizen or Lawful Permanent Resident
    petitionerCitizenshipAcquired: '', // Birth, Naturalization, Parents
    petitionerDaytimePhone: '',
    petitionerMobilePhone: '',
    petitionerEmail: '',
    
    // Part 3. Beneficiary Information
    beneficiaryFamilyName: '',
    beneficiaryGivenName: '',
    beneficiaryMiddleName: '',
    beneficiaryBirthCity: '',
    beneficiaryBirthCountry: '',
    beneficiaryDateOfBirth: '',
    beneficiarySex: '',
    beneficiaryMailingAddress: '',
    beneficiaryPhysicalAddress: '',
    
    // Part 4. Additional Information
    additionalInformation: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProcess, setCurrentProcess] = useState<ImmigrationProcess | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [formRequirements, setFormRequirements] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const isParalegal = true;
  const [formCompletion, setFormCompletion] = useState(0);

  // Legal Firm specific state
  const [clients, setClients] = useState([
    { id: '1', name: 'Maria Rodriguez', caseType: 'Family-Based', status: 'In Progress', lastUpdate: '2024-01-15' },
    { id: '2', name: 'Ahmed Hassan', caseType: 'Employment-Based', status: 'Pending Review', lastUpdate: '2024-01-14' },
    { id: '3', name: 'Li Wei', caseType: 'Student Visa', status: 'Approved', lastUpdate: '2024-01-13' },
    { id: '4', name: 'John Smith', caseType: 'Naturalization', status: 'Documents Needed', lastUpdate: '2024-01-12' }
  ]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState('');
  const [caseStats, setCaseStats] = useState({
    totalCases: 45,
    activeCases: 32,
    approvedCases: 8,
    pendingCases: 5,
    thisMonth: 12
  });

  const handleProcessSelection = (process: 'individualUser' | 'legal-firm') => {
    setSelectedProcess(process);
    if (process === 'individualUser') {
      // Navigate to individual immigration process
      navigate('/immigration-process/individual');
    } else {
      // Continue with legal firm process
      setShowProcessChoice(false);
      setCurrentStep(0);
    }
  };

  const handleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleBulkOperation = async () => {
    if (selectedClients.length === 0 || !bulkOperation) {
      console.error('Please select clients and operation');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate bulk operation
      if (bulkOperation === 'generate-forms') {
        // Special handling for bulk I-130 form generation
        console.error(`Generating I-130 forms for ${selectedClients.length} selected clients...\n\nThis would typically:\n• Pull client data from case files\n• Generate pre-filled I-130 forms\n• Save forms to client folders\n• Send notifications to assigned attorneys`);
        
        // In production, this would iterate through each selected client
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
        
        console.error(`✅ Success! Generated I-130 forms for ${selectedClients.length} clients.\n\nForms have been saved to:\n• Client case folders\n• Document management system\n• Attorney review queue`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.error(`${bulkOperation} completed for ${selectedClients.length} clients`);
      }
      
      setSelectedClients([]);
      setBulkOperation('');
    } catch (error) {
      console.error('Bulk operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const startNewCase = () => {
    setCurrentStep(1);
  };

  const renderLegalFirmDashboard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Cases</p>
              <p className="text-2xl font-bold text-blue-900">{caseStats.totalCases}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Active Cases</p>
              <p className="text-2xl font-bold text-green-900">{caseStats.activeCases}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{caseStats.pendingCases}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Approved</p>
              <p className="text-2xl font-bold text-purple-900">{caseStats.approvedCases}</p>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-indigo-600">This Month</p>
              <p className="text-2xl font-bold text-indigo-900">{caseStats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={startNewCase}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Case
        </button>
        <button
          onClick={() => setCurrentStep(2)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Users className="h-5 w-5 mr-2" />
          Bulk Operations
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center"
        >
          <FileText className="h-5 w-5 mr-2" />
          Form Templates
        </button>
        <button
          onClick={() => setCurrentStep(4)}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center"
        >
          <Briefcase className="h-5 w-5 mr-2" />
          Case Reports
        </button>
      </div>

      {/* Recent Cases Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Cases</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.caseType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      client.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      client.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.lastUpdate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                    <button className="text-purple-600 hover:text-purple-900">Forms</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const renderNewCaseForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentStep(0)}
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Case Setup</h2>
          <p className="text-gray-600">Create a new immigration case for a client</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Client Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country of Birth *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        {/* Case Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Type *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Case Type</option>
                <option value="family">Family-Based Immigration</option>
                <option value="employment">Employment-Based Immigration</option>
                <option value="humanitarian">Humanitarian Relief</option>
                <option value="citizenship">Citizenship & Naturalization</option>
                <option value="temporary">Temporary Visas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Attorney</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Attorney</option>
                <option value="att1">Sarah Johnson, Esq.</option>
                <option value="att2">Michael Chen, Esq.</option>
                <option value="att3">Maria Garcia, Esq.</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Filing Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Case Notes</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Initial case notes and observations..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentStep(0)}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            console.log('Case created successfully!');
            setCurrentStep(0);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Case
        </button>
      </div>
    </motion.div>
  );

  const renderBulkOperations = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="flex items-center mb-6">
        <button
          onClick={() => setCurrentStep(0)}
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
          <p className="text-gray-600">Perform operations on multiple cases simultaneously</p>
        </div>
      </div>

      {/* Bulk Operation Controls */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Operation</label>
            <select
              value={bulkOperation}
              onChange={(e) => setBulkOperation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose Operation</option>
              <option value="status-update">Update Status</option>
              <option value="generate-forms">Generate Forms</option>
              <option value="send-reminders">Send Reminders</option>
              <option value="export-data">Export Data</option>
              <option value="archive-cases">Archive Cases</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBulkOperation}
              disabled={selectedClients.length === 0 || !bulkOperation || isProcessing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `Apply to ${selectedClients.length} Selected`}
            </button>
          </div>
        </div>
        {selectedClients.length > 0 && (
          <p className="text-sm text-blue-700">
            {selectedClients.length} clients selected for {bulkOperation || 'operation'}
          </p>
        )}
      </div>

      {/* Client Selection Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClients(clients.map(c => c.id));
                    } else {
                      setSelectedClients([]);
                    }
                  }}
                  checked={selectedClients.length === clients.length}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className={`hover:bg-gray-50 ${selectedClients.includes(client.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => handleClientSelection(client.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.caseType}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    client.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    client.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    client.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.lastUpdate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderProcessChoice = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Immigration Process Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your immigration process type to get started with the appropriate workflow
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Individual Immigration Process */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-8 border-2 border-transparent hover:border-blue-200 transition-all duration-300 cursor-pointer"
            onClick={() => handleProcessSelection('individualUser')}
          >
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Individual Immigration
              </h3>
              <p className="text-gray-600 mb-6">
                I'm an individual seeking immigration benefits. I want to fill out forms and submit my own application.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Personal information collection
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Document upload and validation
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Step-by-step form guidance
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Direct submission to USCIS
                </div>
              </div>
            </div>
          </motion.div>

          {/* Legal Firm Process */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-8 border-2 border-transparent hover:border-indigo-200 transition-all duration-300 cursor-pointer"
            onClick={() => handleProcessSelection('legal-firm')}
          >
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Legal Firm Services
              </h3>
              <p className="text-gray-600 mb-6">
                I'm a legal professional managing multiple immigration cases for clients.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Multi-client case management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Bulk form processing
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Document verification tools
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Professional case tracking
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 text-sm">
            Need help choosing? <Link to="/help" className="text-blue-600 hover:underline">Contact our support team</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );

  const handlePrefillOfficialI130 = async () => {
    // Check if we have the required data
    if (!formData.petitionerGivenName || !formData.petitionerFamilyName || !formData.beneficiaryGivenName || !formData.relationshipType) {
      console.error('Please fill in the basic form data first (Petitioner Name, Beneficiary Name, and Relationship)');
      return;
    }

    setIsPdfProcessing(true);
    try {
      console.log('=== Starting Legal Firm I-130 Auto-Fill Process ===');
      console.log('Form data being used:', formData);

      // First, let's test if the PDF has fillable fields
      const { PDFDocument } = await import('pdf-lib');
      
      // Load the PDF to check for fillable fields
      const response = await fetch('/forms/i-130.pdf');
      if (!response.ok) {
        throw new Error('Could not load the I-130 PDF from local storage');
      }
      
      const pdfArrayBuffer = await response.arrayBuffer();
      const testDoc = await PDFDocument.load(pdfArrayBuffer);
      
      let hasForm = false;
      let fieldCount = 0;
      
      try {
        const testForm = testDoc.getForm();
        const testFields = testForm.getFields();
        fieldCount = testFields.length;
        hasForm = fieldCount > 0;
        
        console.log(`PDF Analysis: ${fieldCount} fillable fields found`);
        if (fieldCount > 0) {
          console.log('Field names:', testFields.map(f => f.getName()));
        }
      } catch (formError) {
        console.log('PDF does not contain fillable form fields');
        hasForm = false;
      }

      if (!hasForm) {
        // If no fillable fields, offer alternative solutions
        const useAlternative = confirm(
          `⚠️ The I-130 PDF appears to be a scanned document without fillable fields.\n\n` +
          `Would you like to:\n` +
          `• Click "OK" to download the blank PDF and fill it manually\n` +
          `• Click "Cancel" to generate an HTML reference form instead`
        );
        
        if (useAlternative) {
          // Download blank PDF
          const link = document.createElement('a');
          link.href = '/forms/i-130.pdf';
          link.download = `I-130_Blank_${formData.petitionerFamilyName}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Blank I-130 PDF downloaded. You can print this and fill it manually with the information you entered.');
        } else {
          // Generate HTML form instead
          handleGenerateHTMLI130();
        }
        return;
      }

      // If we have fillable fields, proceed with auto-fill
      const { fillI130PDF } = await import('../../utils/pdfUtils');
      
      // Cast formData to the expected type
      const i130FormData = formData as any; // We'll cast to bypass type checking since we know the structure
      
      // Fill the PDF with the current form data
      const filledPdfBytes = await fillI130PDF(i130FormData);
      
      // Create download
      const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `I-130_AutoFilled_${formData.petitionerFamilyName}_${formData.beneficiaryGivenName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.error(`✅ Success! Auto-filled I-130 form has been downloaded.\n\nFile: I-130_AutoFilled_${formData.petitionerFamilyName}_${formData.beneficiaryGivenName}_${new Date().toISOString().split('T')[0]}.pdf\n\nThe form has been pre-filled with:\n• Petitioner: ${formData.petitionerGivenName} ${formData.petitionerFamilyName}\n• Beneficiary: ${formData.beneficiaryGivenName} ${formData.beneficiaryFamilyName || formData.beneficiaryGivenName}\n• Relationship: ${formData.relationshipType}`);
      
    } catch (error: any) {
      console.error('Error in Legal Firm I-130 auto-fill:', error);
      
      // Provide specific error handling based on error type
      let errorMessage = 'Error generating auto-filled form. ';
      let showAlternatives = true;
      
      if (error?.message?.includes('fillable') || error?.message?.includes('scanned')) {
        errorMessage += 'The PDF appears to be a scanned document without fillable fields.';
      } else if (error?.message?.includes('load') || error?.message?.includes('fetch')) {
        errorMessage += 'Could not load the I-130 form file.';
        showAlternatives = false;
      } else {
        errorMessage += 'Please try an alternative option below.';
      }
      
      if (showAlternatives) {
        const choice = confirm(
          `❌ ${errorMessage}\n\n` +
          `Would you like to:\n` +
          `• Click "OK" to download the blank PDF\n` +
          `• Click "Cancel" to generate an HTML reference form`
        );
        
        if (choice) {
          handleDownloadBlankI130();
        } else {
          handleGenerateHTMLI130();
        }
      } else {
        console.error(`❌ ${errorMessage}`);
      }
    } finally {
      setIsPdfProcessing(false);
    }
  };

  const handleDownloadBlankI130 = async () => {
    setLoading(true);
    try {
      // Download the blank I-130 form
      const link = document.createElement('a');
      link.href = '/forms/i-130.pdf';
      link.download = 'I-130_Blank_Form.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Blank I-130 form downloaded successfully!');
    } catch (error) {
      console.error('Error downloading blank form:', error);
      console.error('❌ Error downloading blank form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHTMLI130 = () => {
    // Check if we have some basic data
    if (!formData.petitionerGivenName || !formData.beneficiaryGivenName) {
      console.error('Please fill in at least the Petitioner and Beneficiary names first');
      return;
    }

    // Create HTML version of I-130 form
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>I-130 Form - ${formData.petitionerFamilyName}, ${formData.petitionerGivenName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { background-color: #f0f8ff; padding: 8px; font-weight: bold; border-left: 4px solid #0066cc; }
        .form-row { display: flex; margin-bottom: 10px; }
        .form-label { font-weight: bold; width: 200px; }
        .form-value { flex: 1; border-bottom: 1px dotted #666; min-height: 20px; padding-left: 10px; }
        .checkbox { width: 15px; height: 15px; border: 1px solid #333; display: inline-block; margin-right: 5px; text-align: center; }
        .checked { background-color: #333; color: white; }
        .note { background-color: #fff3cd; padding: 10px; border: 1px solid #ffc107; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>USCIS Form I-130</h1>
        <h2>Petition for Alien Relative</h2>
        <p><strong>Generated for Legal Firm</strong> | Date: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <div class="section-title">Part 1. Relationship</div>
        <div class="form-row">
            <div class="form-label">I am petitioning for my:</div>
            <div class="form-value">
                ${formData.relationshipType === 'spouse' ? '☑' : '☐'} Spouse
                ${formData.relationshipType === 'child' ? '☑' : '☐'} Child
                ${formData.relationshipType === 'parent' ? '☑' : '☐'} Parent
                ${formData.relationshipType === 'sibling' ? '☑' : '☐'} Brother/Sister
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Part 2. Information About You (Petitioner)</div>
        <div class="form-row">
            <div class="form-label">Family Name (Last Name):</div>
            <div class="form-value">${formData.petitionerFamilyName || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Given Name (First Name):</div>
            <div class="form-value">${formData.petitionerGivenName || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Middle Name:</div>
            <div class="form-value">${formData.petitionerMiddleName || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Date of Birth:</div>
            <div class="form-value">${formData.petitionerDateOfBirth || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">City of Birth:</div>
            <div class="form-value">${formData.petitionerBirthCity || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Country of Birth:</div>
            <div class="form-value">${formData.petitionerBirthCountry || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Mailing Address:</div>
            <div class="form-value">${formData.petitionerMailingAddress || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Daytime Phone Number:</div>
            <div class="form-value">${formData.petitionerDaytimePhone || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Email Address:</div>
            <div class="form-value">${formData.petitionerEmail || ''}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Part 3. Information About the Person You Are Filing For (Beneficiary)</div>
        <div class="form-row">
            <div class="form-label">Family Name (Last Name):</div>
            <div class="form-value">${formData.beneficiaryFamilyName || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Given Name (First Name):</div>
            <div class="form-value">${formData.beneficiaryGivenName || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Middle Name:</div>
            <div class="form-value">${formData.beneficiaryMiddleName || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Date of Birth:</div>
            <div class="form-value">${formData.beneficiaryDateOfBirth || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">City of Birth:</div>
            <div class="form-value">${formData.beneficiaryBirthCity || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Country of Birth:</div>
            <div class="form-value">${formData.beneficiaryBirthCountry || ''}</div>
        </div>
        <div class="form-row">
            <div class="form-label">Mailing Address:</div>
            <div class="form-value">${formData.beneficiaryMailingAddress || ''}</div>
        </div>
    </div>

    <div class="note">
        <h4>Legal Firm Notes:</h4>
        <p><strong>Client:</strong> ${formData.petitionerGivenName} ${formData.petitionerFamilyName}</p>
        <p><strong>Relationship:</strong> Petitioning for ${formData.relationshipType}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> Draft - Review and verify all information before submission</p>
    </div>
</body>
</html>`;

    // Create and download HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `I-130_${formData.petitionerFamilyName}_${formData.beneficiaryGivenName}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ HTML I-130 form generated and downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showProcessChoice ? (
        renderProcessChoice()
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Header with back button */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => setShowProcessChoice(true)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Process Selection
                  </button>
                </div>
                <div className="text-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    Legal Firm Immigration Services
                  </h1>
                  <p className="text-sm text-gray-500">
                    Professional case management and form processing
                  </p>
                </div>
                <div className="w-32"></div> {/* Spacer for centering */}
              </div>
            </div>
          </div>

          {/* Legal Firm Process Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentStep === 0 && renderLegalFirmDashboard()}
            {currentStep === 1 && renderNewCaseForm()}
            {currentStep === 2 && renderBulkOperations()}
            
            {/* Form Templates */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg p-8"
              >
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="mr-4 text-blue-600 hover:text-blue-800"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Form Templates & Auto-Fill</h2>
                    <p className="text-gray-600">Generate and auto-fill immigration forms for clients</p>
                  </div>
                </div>

                {/* I-130 Auto-Fill Section */}
                <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-xl font-semibold text-blue-900">I-130 Auto-Fill Generator</h3>
                      <p className="text-blue-700">Generate pre-filled I-130 forms for family-based petitions</p>
                    </div>
                  </div>

                  {/* Client Selection for Auto-Fill */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Choose client for I-130 form</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>{client.name} - {client.caseType}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Form Options</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 mr-2" defaultChecked />
                          <span className="text-sm">Include client data</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 mr-2" defaultChecked />
                          <span className="text-sm">Auto-populate from case file</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* I-130 Download Options */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <button
                      onClick={handleDownloadBlankI130}
                      disabled={loading}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {loading ? 'Downloading...' : 'Download Blank Form'}
                    </button>

                    <button
                      onClick={handlePrefillOfficialI130}
                      disabled={isPdfProcessing}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isPdfProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5 mr-2" />
                          Auto-Fill Official PDF
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleGenerateHTMLI130}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Generate HTML Form
                    </button>
                  </div>

                  {/* Debug Option */}
                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        try {
                          const { PDFDocument } = await import('pdf-lib');
                          const response = await fetch('/forms/i-130.pdf');
                          const arrayBuffer = await response.arrayBuffer();
                          const doc = await PDFDocument.load(arrayBuffer);
                          
                          try {
                            const form = doc.getForm();
                            const fields = form.getFields();
                            console.log(`=== PDF DEBUG INFO ===`);
                            console.log(`Total fields: ${fields.length}`);
                            fields.forEach((field, i) => {
                              console.log(`${i + 1}. "${field.getName()}" (${field.constructor.name})`);
                            });
                            console.error(`PDF Analysis Complete!\n\nFound ${fields.length} fillable fields.\nCheck the browser console (F12) for detailed field names.`);
                          } catch (formError) {
                            console.error('❌ This PDF does not contain fillable form fields.\nIt appears to be a scanned image.');
                          }
                        } catch (error) {
                          console.error('Error analyzing PDF: ' + (error as any)?.message);
                        }
                      }}
                      className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
                    >
                      🔍 Debug PDF Fields
                    </button>
                    <span className="ml-2 text-xs text-gray-600">
                      (Developers: Use this to see available PDF field names)
                    </span>
                  </div>

                  {/* Quick Form Data Entry for Demo */}
                  <div className="mt-6 p-4 bg-white rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-3">Quick Form Data (Demo)</h4>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Petitioner Name</label>
                        <input
                          type="text"
                          value={formData.petitionerGivenName}
                          onChange={(e) => setFormData(prev => ({ ...prev, petitionerGivenName: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Petitioner Last Name</label>
                        <input
                          type="text"
                          value={formData.petitionerFamilyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, petitionerFamilyName: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Beneficiary Name</label>
                        <input
                          type="text"
                          value={formData.beneficiaryGivenName}
                          onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryGivenName: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Maria"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
                        <select
                          value={formData.relationshipType}
                          onChange={(e) => setFormData(prev => ({ ...prev, relationshipType: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="spouse">Spouse</option>
                          <option value="child">Child</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      💡 In production, this data would be automatically populated from the client's case file
                    </div>
                  </div>
                </div>

                {/* Other Form Templates */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Form Templates</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { id: 'i-485', name: 'I-485 Adjustment', description: 'Application to Register Permanent Residence', status: 'Active' },
                      { id: 'i-864', name: 'I-864 Affidavit', description: 'Affidavit of Support', status: 'Active' },
                      { id: 'i-140', name: 'I-140 Employment', description: 'Employment-Based Petition', status: 'Active' },
                      { id: 'n-400', name: 'N-400 Naturalization', description: 'Application for Naturalization', status: 'Active' },
                      { id: 'i-589', name: 'I-589 Asylum', description: 'Application for Asylum', status: 'Active' }
                    ].map((form) => (
                      <div key={form.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            {form.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{form.description}</p>
                        <div className="flex gap-2">
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                            Edit Template
                          </button>
                          <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
                            Generate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Template
                  </button>
                </div>
              </motion.div>
            )}

            {/* Case Reports */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg p-8"
              >
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="mr-4 text-blue-600 hover:text-blue-800"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Case Reports & Analytics</h2>
                    <p className="text-gray-600">Comprehensive reporting and business intelligence</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Quick Reports */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Monthly Case Summary', icon: Calendar },
                        { name: 'Client Status Report', icon: Users },
                        { name: 'Revenue Analysis', icon: Briefcase },
                        { name: 'Form Completion Rates', icon: FileText },
                        { name: 'Attorney Performance', icon: Shield }
                      ].map((report, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <report.icon className="h-5 w-5 text-gray-600 mr-3" />
                            <span className="text-gray-900">{report.name}</span>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Generate</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Reports */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Report Builder</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Case Analysis</option>
                          <option>Financial Report</option>
                          <option>Timeline Report</option>
                          <option>Document Status</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <input type="date" className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded border-gray-300 mr-2" />
                            <span className="text-sm">Active cases only</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded border-gray-300 mr-2" />
                            <span className="text-sm">Include archived cases</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded border-gray-300 mr-2" />
                            <span className="text-sm">High priority cases</span>
                          </label>
                        </div>
                      </div>
                      <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                        Generate Custom Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Export Options</h4>
                  <div className="flex gap-3">
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                      Export to Excel
                    </button>
                    <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                      Export to PDF
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                      Send via Email
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImmigrationProcess;
