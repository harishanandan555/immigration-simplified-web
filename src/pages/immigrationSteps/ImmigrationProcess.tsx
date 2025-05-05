import React, { useState, useEffect } from 'react';
import type { ImmigrationProcess } from '../../types/immigration';
import api from '../../utils/api';
import { IMMIGRATION_END_POINTS } from '../../utils/constants';
import { FileCheck, AlertCircle, Users, Briefcase, Heart, Shield, Plane, Building, HelpCircle, CheckCircle, Upload, X, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubCategory {
  id: string;
  title: string;
  description: string;
  forms: string[];
  documents: string[];
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [currentProcess, setCurrentProcess] = useState<ImmigrationProcess | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [formRequirements, setFormRequirements] = useState<any>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const isParalegal = true;

  const progressSteps: QuestionnaireStep[] = [
    { 
      id: '1',
      title: 'Category Selection',
      description: 'Choose your immigration category',
      options: []
    },
    { 
      id: '2',
      title: 'Documents',
      description: 'Upload required documents',
      options: []
    },
    { 
      id: '3',
      title: 'Client Information',
      description: 'Enter client details',
      options: []
    },
    { 
      id: '4',
      title: 'Case Details',
      description: 'Provide case information',
      options: []
    },
    { 
      id: '5',
      title: 'Forms',
      description: 'Complete immigration forms',
      options: []
    },
    { 
      id: '6',
      title: 'Review',
      description: 'Review and submit your application',
      options: []
    }
  ];

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(IMMIGRATION_END_POINTS.GET_FORMS);
        if (response.data.success) {
          // No need to process categories since we're using static data
        } else {
          setError(response.data.message || 'Failed to load forms');
        }
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError('Failed to load forms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  // Set required documents when form data is received
  useEffect(() => {
    if (formRequirements?.requiredDocuments) {
      const docRequirements = formRequirements.requiredDocuments.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        documentType: doc.documentType,
        isRequired: true,
        isUploaded: false
      }));
      setRequiredDocuments(docRequirements);
    }
  }, [formRequirements]);

  const startProcess = async () => {
    if (!selectedCategory || !selectedSubCategory) {
      console.error('No category or subcategory selected');
      setError('Please select both a category and subcategory first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get the selected subcategory details
      const selectedSubCategoryDetails = selectedMainCategory?.subCategories.find(
        sub => sub.id === selectedSubCategory
      );

      if (!selectedSubCategoryDetails) {
        setError('Invalid subcategory selection');
        return;
      }

      // Create process data
      const processData: ImmigrationProcess = {
        id: Date.now().toString(), // Temporary ID
        categoryId: selectedCategory,
        subcategoryId: selectedSubCategory,
        visaType: selectedSubCategoryDetails.title,
        clientId: 'client123', // TODO: Get from auth context
        caseId: Date.now().toString(), // Temporary case ID
        priorityDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        currentStep: 'documents',
        steps: [],
        documents: [],
        formData: {},
        validationResults: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCurrentProcess(processData);
      
      // Create document requirements
      const docRequirements = selectedSubCategoryDetails.documents.map((docName: string) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: docName,
        description: getDocumentDescription(docName),
        documentType: 'pdf',
        isRequired: true,
        isUploaded: false
      }));
      
      setRequiredDocuments(docRequirements);
      setFormRequirements({
        requiredDocuments: docRequirements,
        requiredForms: selectedSubCategoryDetails.forms
      });

      setCurrentStep(1);
      setDocuments([]);
      setUploadError(null);
      
      console.log('Process started successfully:', {
        processId: processData.id,
        category: selectedCategory,
        subcategory: selectedSubCategory
      });

      // Navigate to document upload page
      // navigate('/immigration-process/documents', {
      //   state: {
      //     selectedOptions: {
      //       category: selectedCategory,
      //       subcategory: selectedSubCategory,
      //       visaType: selectedSubCategoryDetails.title
      //     },
      //     requiredDocuments: docRequirements
      //   }
      // });

    } catch (error: any) {
      console.error('Error starting process:', error);
      setError('Failed to start process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if process is started
    if (!currentProcess?.id) {
      setUploadError('Please start the immigration process first');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      // Upload each file individually
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        fileFormData.append('category', selectedCategory || '');
        fileFormData.append('clientId', 'client123');
        fileFormData.append('processId', currentProcess.id);
        fileFormData.append('documentType', file.type);

        try {
          console.log('Uploading file:', {
            fileName: file.name,
            processId: currentProcess.id,
            category: selectedCategory
          });

          const response = await api.post(IMMIGRATION_END_POINTS.ADD_DOCUMENT, fileFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Accept': 'application/json'
            }
          });

          console.log('File upload response:', {
            fileName: file.name,
            response: response.data
          });

          if (!response.data.success) {
            throw new Error(response.data.message || `Failed to upload ${file.name}`);
          }

          return {
            ...response.data.data,
            name: file.name,
            type: file.type
          };
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      // Update documents state with successful uploads
      setDocuments(prev => [...prev, ...results]);
      
      // Update required documents status
      setRequiredDocuments(prev => 
        prev.map(doc => ({
          ...doc,
          isUploaded: results.some(result => result.name === doc.name)
        }))
      );
      
      setUploadError(null);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setDocuments(prev => prev.filter(doc => doc.name !== fileName));
    setRequiredDocuments(prev => prev.map(doc => 
      doc.name === fileName ? { ...doc, isUploaded: false } : doc
    ));
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
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            {progressSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < progressSteps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= index
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.id}
                </div>
                <div className="ml-3">
                  <div
                    className={`text-sm font-medium ${
                      currentStep >= index ? 'text-primary-600' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400">{step.description}</div>
                </div>
                {index < progressSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > index ? 'bg-primary-600' : 'bg-gray-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {currentStep === 0 && (
          
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">{steps[0].title}</h1>
              <p className="mt-2 text-lg text-gray-500">{steps[0].description}</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {steps[0].options.map((category) => (
                <div
                  key={category.id}
                  className={`group relative p-6 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                  }`}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedMainCategory(category);
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedCategory === category.id ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-primary-50'
                    }`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        selectedCategory === category.id ? 'text-primary-700' : 'text-gray-900'
                      }`}>
                        {category.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedMainCategory?.subCategories && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Select Specific Category
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMainCategory.subCategories.map((subCategory) => (
                    <button
                      key={subCategory.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        selectedSubCategory === subCategory.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-200'
                      }`}
                      onClick={() => setSelectedSubCategory(subCategory.id)}
                    >
                      <h3 className="font-medium text-gray-900">
                        {subCategory.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {subCategory.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSubCategory && selectedMainCategory?.subCategories && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Required Forms & Documents
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Forms</h3>
                    <ul className="space-y-2">
                      {selectedMainCategory.subCategories
                        .find(sub => sub.id === selectedSubCategory)
                        ?.forms.map(form => (
                          <li 
                            key={form}
                            className="flex items-center text-sm text-gray-600"
                          >
                            <FileCheck className="h-4 w-4 text-primary-500 mr-2" />
                            {form}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Documents</h3>
                    <ul className="space-y-2">
                      {selectedMainCategory.subCategories
                        .find(sub => sub.id === selectedSubCategory)
                        ?.documents.map(doc => (
                          <li 
                            key={doc}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="flex items-center text-gray-600">
                              <AlertCircle className="h-4 w-4 text-error-500 mr-2" />
                              {doc}
                            </span>
                            <span className="text-error-500 text-xs font-medium">
                              Required
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                {(isParalegal) && (
                  <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Professional Guidance
                    </h4>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      <li>Verify client eligibility before proceeding</li>
                      <li>Check for any potential red flags</li>
                      <li>Review all supporting documentation thoroughly</li>
                      <li>Consider alternative immigration pathways if needed</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedSubCategory && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={startProcess}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Start Immigration Process
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Document Upload & Verification
              </h1>
              <p className="text-gray-600 mb-6">
                Upload the required documents for your application. All documents will be verified for completeness and accuracy.
              </p>

              {/* Help Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Tips for successful document upload:</h3>
                    <ul className="mt-2 text-sm text-blue-600 space-y-1">
                      <li>• Ensure all documents are clear and legible</li>
                      <li>• Include certified translations for non-English documents</li>
                      <li>• Name your files descriptively (e.g., "Birth_Certificate.pdf")</li>
                      <li>• Check file size limits before uploading</li>
                      <li>• Verify all pages are included in multi-page documents</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                {/* Document Requirements List */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Required Documents
                  </h2>
                  <div className="space-y-4">
                    {requiredDocuments.map((doc) => (
                      <div 
                        key={doc.name}
                        className={`p-4 rounded-lg border ${
                          doc.isUploaded
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {doc.isUploaded ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900">
                                {doc.name}
                                {doc.isRequired && (
                                  <span className="ml-2 text-xs text-red-500">Required</span>
                                )}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                doc.isUploaded
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {doc.isUploaded ? 'Uploaded' : 'Missing'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {doc.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const files = Array.from(e.dataTransfer.files);
                      handleFileUpload({ target: { files } } as any);
                    }}
                    className={`flex justify-center px-6 pt-5 pb-6 border-2 ${
                      dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                    } border-dashed rounded-md transition-colors duration-200`}
                  >
                    <div className="space-y-1 text-center">
                      <Upload className={`mx-auto h-12 w-12 ${
                        dragOver ? 'text-primary-500' : 'text-gray-400'
                      }`} />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            onChange={handleFileUpload}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, JPG up to 10MB each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {documents.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Uploaded Files
                    </h3>
                    <ul className="divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <li key={doc.name} className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div className="ml-2 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {doc.description}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 flex items-center space-x-4">
                              <button
                                onClick={() => handleRemoveFile(doc.name)}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Back to Category Selection
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Continue to Client Information
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Client Information</h1>
              <p className="mt-2 text-lg text-gray-500">Enter your personal details</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Client information form will go here */}
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Client Information Form</h3>
                <p className="mt-1 text-sm text-gray-500">Enter your personal details to proceed</p>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Documents
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Continue to Case Details
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Case Details</h1>
              <p className="mt-2 text-lg text-gray-500">Provide information about your case</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Case details form will go here */}
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Case Information Form</h3>
                <p className="mt-1 text-sm text-gray-500">Enter details about your immigration case</p>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Client Information
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Continue to Forms
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Complete Forms</h1>
              <p className="mt-2 text-lg text-gray-500">Fill out all required immigration forms</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Forms will go here */}
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Immigration Forms</h3>
                <p className="mt-1 text-sm text-gray-500">Complete all required forms for your application</p>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(3)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Case Details
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Continue to Review
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Review Application</h1>
              <p className="mt-2 text-lg text-gray-500">Review your application before final submission</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Review sections */}
              <div className="space-y-6">
                {/* Category Review */}
                <div className="border-b pb-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Category</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{selectedCategory}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedSubCategory}</p>
                  </div>
                </div>

                {/* Documents Review */}
                <div className="border-b pb-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h2>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.name} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm text-gray-600">{doc.name}</span>
                        </div>
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client Information Review */}
                <div className="border-b pb-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Client details will be displayed here</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Edit Client Information
                  </button>
                </div>

                {/* Case Details Review */}
                <div className="border-b pb-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Case Details</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Case information will be displayed here</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Edit Case Details
                  </button>
                </div>

                {/* Forms Review */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Completed Forms</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Form information will be displayed here</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Edit Forms
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(4)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Forms
              </button>
              <button
                onClick={() => {/* Handle final submission */}}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Submit Application
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
      </div>

      {/* Add loading and error states */}
      {loading && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
            <p className="mt-4 text-center text-gray-700">Starting your application...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-center text-gray-700 mb-4">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImmigrationProcess; 
