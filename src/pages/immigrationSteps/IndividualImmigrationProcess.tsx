import React, { useState, useEffect } from 'react';
import { useAuth } from '../../controllers/AuthControllers';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Heart,
  Shield,
  Plane,
  Building,
  FileText,
  Upload,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Download,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Trash2,
  Star,
  Clock,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Home,
  Settings,
  Bell,
  Search,
  Loader2,
  Edit3
} from 'lucide-react';
import questionnaireService from '../../services/questionnaireService';
import { FormTemplate } from '../../controllers/SettingsControllers';
import {
  prepareFormData,
  downloadPdfFile,
  createPdfBlobUrl,
  revokePdfBlobUrl
} from '../../controllers/FormAutoFillControllers';
import { 
  getAnvilTemplatesList, 
  fillPdfTemplateBlob, 
  getTemplateIdsByFormNumber,
  saveEditedPdf,
  getPdfPreviewBlob
} from '../../controllers/AnvilControllers';
import api from '../../utils/api';
import { generateObjectId } from '../../utils/idValidation';
import { toast } from 'react-hot-toast';
import { getClientById, updateClient } from '../../controllers/ClientControllers';
import { 
  generateMultipleCaseIds, 
  generateMultipleCaseIdsFromAPI 
} from '../../utils/caseIdGenerator';
import {
  validateFormData
} from '../../controllers/LegalFirmWorkflowController';
import PdfEditor from '../../components/pdf/PdfEditor';
import Button from '../../components/common/Button';

// Immigration Process Categories
interface ImmigrationCategory {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  forms: string[];
  documents: string[];
  subcategories: ImmigrationSubcategory[];
}

interface ImmigrationSubcategory {
  id: string;
  title: string;
  description: string;
  forms: string[];
  documents: string[];
  eligibilityRequirements: string[];
  processingTime: string;
}

// Add interface for loaded questionnaires near the top
interface LoadedQuestionnaire {
  id: string;
  title: string;
  description: string;
  category: string;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
    help_text?: string;
    eligibility_impact?: 'high' | 'medium' | 'low';
  }>;
}

// Add interfaces for case management (same as LegalFirmWorkflow)
interface Client {
  id?: string;
  _id?: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    aptSuiteFlr?: string;
    aptNumber?: string;
    city: string;
    state: string;
    zipCode: string;
    province?: string;
    postalCode?: string;
    country: string;
  };
  status?: string;
}

interface Case {
  id: string;
  _id?: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: 'draft' | 'in-progress' | 'review' | 'completed' | 'Active' | 'Pending' | 'Closed' | 'On Hold';
  priority: 'low' | 'medium' | 'high' | 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedForms: string[];
  questionnaires: string[];
  createdAt: string;
  dueDate: string;
  visaType?: string;
  priorityDate?: string;
  type?: string;
  assignedTo?: string;
  assignedAttorney?: string;
  courtLocation?: string;
  judge?: string;
  openDate?: string;
  startDate?: string;
  expectedClosureDate?: string;
  formCaseIds?: Record<string, string>;
}

interface FormCaseIds {
  [key: string]: string;
}

// Define immigration categories and subcategories
const immigrationCategories: ImmigrationCategory[] = [
  {
    id: 'family-based',
    title: 'Family-Based Immigration',
    description: 'Obtain permanent residence through family relationships',
    icon: <Users className="h-8 w-8" />,
    estimatedTime: '12-24 months',
    difficulty: 'Medium',
    forms: ['I-130', 'I-485', 'I-864'],
    documents: ['Marriage Certificate', 'Birth Certificate', 'Passport'],
    subcategories: [
      {
        id: 'spouse-citizen',
        title: 'Spouse of U.S. Citizen',
        description: 'Marriage-based green card for spouse of U.S. citizen',
        forms: ['I-130', 'I-485', 'I-864', 'I-693', 'I-765', 'I-131'],
        documents: [
          'Marriage Certificate',
          'Birth Certificate',
          'Passport & I-94',
          'Joint Financial Documents',
          'Photos Together',
          'Sponsor\'s Proof of Citizenship',
          'Tax Returns (3 years)',
          'Employment Authorization (if applicable)'
        ],
        eligibilityRequirements: [
          'Legal marriage to U.S. citizen',
          'Marriage entered in good faith',
          'Sponsor meets income requirements',
          'No criminal inadmissibility issues'
        ],
        processingTime: '8-15 months'
      },
      {
        id: 'parent-citizen',
        title: 'Parent of U.S. Citizen (21+)',
        description: 'Immediate relative petition for parent',
        forms: ['I-130', 'I-485', 'I-864', 'I-693'],
        documents: [
          'Birth Certificate (petitioner)',
          'Birth Certificate (parent)',
          'Passport',
          'Proof of U.S. Citizenship',
          'Financial Support Documents'
        ],
        eligibilityRequirements: [
          'U.S. citizen petitioner must be 21+',
          'Biological or legal parent relationship',
          'Financial sponsor available'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'child-citizen',
        title: 'Child of U.S. Citizen (Under 21)',
        description: 'Unmarried child under 21 of U.S. citizen',
        forms: ['I-130', 'I-485', 'I-864', 'I-693'],
        documents: [
          'Birth Certificate',
          'Passport',
          'Parent\'s Proof of Citizenship',
          'School Records',
          'Medical Records'
        ],
        eligibilityRequirements: [
          'Unmarried and under 21',
          'Biological or legally adopted child',
          'Financial sponsor available'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'sibling-citizen',
        title: 'Brother/Sister of U.S. Citizen',
        description: 'Family preference category F4',
        forms: ['I-130'],
        documents: [
          'Birth Certificates (both siblings)',
          'Parent\'s Marriage Certificate',
          'Proof of U.S. Citizenship'
        ],
        eligibilityRequirements: [
          'U.S. citizen petitioner must be 21+',
          'Same parents (biological or adopted)',
          'Long wait times (10+ years)'
        ],
        processingTime: '10-15 years'
      }
    ]
  },
  {
    id: 'employment-based',
    title: 'Employment-Based Immigration',
    description: 'Work visas and employment green cards',
    icon: <Briefcase className="h-8 w-8" />,
    estimatedTime: '6-24 months',
    difficulty: 'Hard',
    forms: ['I-140', 'I-485', 'ETA-9089'],
    documents: ['Degree Certificate', 'Employment Letter', 'Labor Certification'],
    subcategories: [
      {
        id: 'eb1-extraordinary',
        title: 'EB-1A Extraordinary Ability',
        description: 'Outstanding individuals in sciences, arts, education, business, or athletics',
        forms: ['I-140', 'I-485', 'I-765', 'I-131'],
        documents: [
          'Evidence of Extraordinary Ability',
          'Awards and Recognition',
          'Publications',
          'Media Coverage',
          'Expert Opinion Letters',
          'Employment Records'
        ],
        eligibilityRequirements: [
          'National or international acclaim',
          'Recognition by peers',
          'Sustained national/international acclaim',
          'Evidence of achievements'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'eb2-advanced',
        title: 'EB-2 Advanced Degree',
        description: 'Professionals with advanced degrees or exceptional ability',
        forms: ['I-140', 'I-485', 'ETA-9089', 'I-765', 'I-131'],
        documents: [
          'Advanced Degree Certificate',
          'Labor Certification',
          'Employment Offer',
          'Academic Transcripts',
          'Professional Licenses'
        ],
        eligibilityRequirements: [
          'Advanced degree (Master\'s+) or bachelor\'s + 5 years experience',
          'Job offer from U.S. employer',
          'Labor certification (unless NIW)',
          'Meets prevailing wage'
        ],
        processingTime: '12-18 months'
      },
      {
        id: 'eb3-skilled',
        title: 'EB-3 Skilled Workers',
        description: 'Skilled workers, professionals, and other workers',
        forms: ['I-140', 'I-485', 'ETA-9089', 'I-765'],
        documents: [
          'Education Records',
          'Work Experience Letters',
          'Skills Certificates',
          'Labor Certification',
          'Job Offer Letter'
        ],
        eligibilityRequirements: [
          'Bachelor\'s degree or 2+ years work experience',
          'Job offer from U.S. employer',
          'Labor certification approved',
          'Meets job requirements'
        ],
        processingTime: '18-24 months'
      }
    ]
  },
  {
    id: 'humanitarian',
    title: 'Humanitarian Relief',
    description: 'Asylum, refugee status, and special programs',
    icon: <Heart className="h-8 w-8" />,
    estimatedTime: '6-36 months',
    difficulty: 'Hard',
    forms: ['I-589', 'I-765'],
    documents: ['Identity Documents', 'Evidence of Persecution'],
    subcategories: [
      {
        id: 'asylum',
        title: 'Asylum Application',
        description: 'Protection for those persecuted in their home country',
        forms: ['I-589', 'I-765', 'I-131'],
        documents: [
          'Identity Documents',
          'Evidence of Persecution',
          'Country Conditions Reports',
          'Personal Statement',
          'Supporting Affidavits',
          'Medical Records (if applicable)',
          'Police Reports'
        ],
        eligibilityRequirements: [
          'Physically present in the U.S.',
          'Apply within 1 year of arrival (with exceptions)',
          'Well-founded fear of persecution',
          'Persecution based on protected ground',
          'Unable/unwilling to return home'
        ],
        processingTime: '6-24 months'
      },
      {
        id: 'u-visa',
        title: 'U Visa (Crime Victims)',
        description: 'For victims of certain crimes who assist law enforcement',
        forms: ['I-918', 'I-765'],
        documents: [
          'Law Enforcement Certification',
          'Evidence of Crime',
          'Medical Records',
          'Court Documents',
          'Personal Statement'
        ],
        eligibilityRequirements: [
          'Victim of qualifying crime',
          'Substantial physical/mental abuse',
          'Helpful/likely to help law enforcement',
          'Crime occurred in U.S.'
        ],
        processingTime: '12-36 months'
      }
    ]
  },
  {
    id: 'citizenship',
    title: 'Citizenship & Naturalization',
    description: 'Become a U.S. citizen through naturalization',
    icon: <Star className="h-8 w-8" />,
    estimatedTime: '8-12 months',
    difficulty: 'Medium',
    forms: ['N-400'],
    documents: ['Green Card', 'Tax Returns', 'Travel Records'],
    subcategories: [
      {
        id: 'naturalization-5year',
        title: '5-Year Naturalization Rule',
        description: 'Standard naturalization after 5 years as permanent resident',
        forms: ['N-400'],
        documents: [
          'Green Card',
          'Tax Returns (5 years)',
          'Travel Records',
          'Selective Service Registration',
          'Court Records (if applicable)'
        ],
        eligibilityRequirements: [
          'Permanent resident for 5+ years',
          'Physical presence in U.S. (30+ months)',
          'Good moral character',
          'English and civics knowledge',
          'Attachment to U.S. Constitution'
        ],
        processingTime: '8-12 months'
      },
      {
        id: 'naturalization-3year',
        title: '3-Year Rule (Spouse of Citizen)',
        description: 'Naturalization after 3 years for spouse of U.S. citizen',
        forms: ['N-400'],
        documents: [
          'Green Card',
          'Marriage Certificate',
          'Spouse\'s Proof of Citizenship',
          'Tax Returns (3 years)',
          'Joint Documents'
        ],
        eligibilityRequirements: [
          'Married to U.S. citizen for 3+ years',
          'Permanent resident for 3+ years',
          'Living in marital union',
          'Spouse has been citizen for 3+ years',
          'Good moral character'
        ],
        processingTime: '8-12 months'
      }
    ]
  },
  {
    id: 'temporary-visas',
    title: 'Temporary Visas & Status',
    description: 'Work authorization, travel documents, and temporary status',
    icon: <Clock className="h-8 w-8" />,
    estimatedTime: '3-8 months',
    difficulty: 'Easy',
    forms: ['I-765', 'I-131'],
    documents: ['Passport', 'I-94', 'Supporting Documents'],
    subcategories: [
      {
        id: 'work-authorization',
        title: 'Work Authorization (EAD)',
        description: 'Employment authorization document',
        forms: ['I-765'],
        documents: [
          'Copy of I-94',
          'Passport Bio Page',
          'Evidence of Eligibility',
          'Pending Application Receipt'
        ],
        eligibilityRequirements: [
          'Eligible category (pending AOS, asylum, etc.)',
          'Valid underlying petition',
          'Proper supporting documentation'
        ],
        processingTime: '3-6 months'
      },
      {
        id: 'advance-parole',
        title: 'Advance Parole (Travel Document)',
        description: 'Permission to re-enter U.S. while application pending',
        forms: ['I-131'],
        documents: [
          'Copy of Passport',
          'Pending Application Receipt',
          'Travel Itinerary',
          'Emergency Documentation (if applicable)'
        ],
        eligibilityRequirements: [
          'Pending adjustment of status',
          'Valid reason for travel',
          'Proper supporting documentation'
        ],
        processingTime: '3-6 months'
      }
    ]
  },
  {
    id: 'nonimmigrant-work',
    title: 'Non-immigrant Work Visas',
    description: 'Temporary work visas for foreign nationals',
    icon: <Briefcase className="h-8 w-8" />,
    estimatedTime: '2-6 months',
    difficulty: 'Medium',
    forms: ['I-129', 'DS-160'],
    documents: ['Passport', 'Job Offer', 'Educational Credentials'],
    subcategories: [
      {
        id: 'h1b-specialty',
        title: 'H-1B Specialty Occupation',
        description: 'Temporary visa for workers in specialty occupations',
        forms: ['I-129', 'DS-160', 'LCA'],
        documents: [
          'Bachelor\'s Degree or Higher',
          'Job Offer Letter',
          'Labor Condition Application (LCA)',
          'Company Support Letter',
          'Passport & I-94',
          'Resume/CV',
          'Previous H-1B Approvals (if applicable)'
        ],
        eligibilityRequirements: [
          'Bachelor\'s degree or equivalent',
          'Job offer in specialty occupation',
          'Employer files LCA with DOL',
          'Prevailing wage requirements met'
        ],
        processingTime: '3-6 months'
      },
      {
        id: 'l1-intracompany',
        title: 'L-1 Intracompany Transfer',
        description: 'Transfer from foreign office to US office of same company',
        forms: ['I-129', 'DS-160'],
        documents: [
          'Employment History',
          'Company Organizational Chart',
          'Business Registration Documents',
          'Job Description',
          'Passport',
          'Financial Statements'
        ],
        eligibilityRequirements: [
          '1+ years employment with foreign company',
          'Managerial/executive role or specialized knowledge',
          'Qualifying relationship between companies',
          'Coming to work for related US entity'
        ],
        processingTime: '2-4 months'
      },
      {
        id: 'o1-extraordinary',
        title: 'O-1 Extraordinary Ability',
        description: 'For individuals with extraordinary ability in sciences, arts, education, business, or athletics',
        forms: ['I-129', 'DS-160'],
        documents: [
          'Evidence of Extraordinary Ability',
          'Awards and Recognition',
          'Publications/Media Coverage',
          'Letters from Experts',
          'Contracts/Agreements',
          'Passport'
        ],
        eligibilityRequirements: [
          'Extraordinary ability in field',
          'National or international recognition',
          'Coming to continue work in area of expertise',
          'Consultation from appropriate peer group'
        ],
        processingTime: '2-4 months'
      },
      {
        id: 'tn-nafta',
        title: 'TN NAFTA Professional',
        description: 'Temporary visa for Canadian and Mexican professionals',
        forms: ['DS-160 (Mexican)', 'I-94 (Canadian)'],
        documents: [
          'Job Offer Letter',
          'Educational Credentials',
          'Professional License (if required)',
          'Passport',
          'Evidence of Profession'
        ],
        eligibilityRequirements: [
          'Canadian or Mexican citizenship',
          'Job offer in NAFTA profession',
          'Proper educational credentials',
          'Temporary stay intent'
        ],
        processingTime: '1-2 months'
      }
    ]
  },
  {
    id: 'student-exchange',
    title: 'Student & Exchange Visas',
    description: 'Educational and cultural exchange programs',
    icon: <FileText className="h-8 w-8" />,
    estimatedTime: '2-4 months',
    difficulty: 'Easy',
    forms: ['DS-160', 'I-20', 'DS-2019'],
    documents: ['Passport', 'School Acceptance', 'Financial Support'],
    subcategories: [
      {
        id: 'f1-student',
        title: 'F-1 Student Visa',
        description: 'Academic studies in the United States',
        forms: ['DS-160', 'I-20', 'SEVIS'],
        documents: [
          'I-20 Form from School',
          'Passport',
          'Financial Support Documents',
          'Academic Transcripts',
          'English Proficiency Test',
          'SEVIS Fee Receipt'
        ],
        eligibilityRequirements: [
          'Accepted by SEVP-approved school',
          'Full-time enrollment',
          'Sufficient financial resources',
          'Intent to return home after studies'
        ],
        processingTime: '2-4 months'
      },
      {
        id: 'j1-exchange',
        title: 'J-1 Exchange Visitor',
        description: 'Cultural and educational exchange programs',
        forms: ['DS-160', 'DS-2019'],
        documents: [
          'DS-2019 Form',
          'Passport',
          'Program Documentation',
          'Financial Support Evidence',
          'SEVIS Fee Receipt'
        ],
        eligibilityRequirements: [
          'Approved exchange program',
          'Sponsor organization designation',
          'Sufficient English proficiency',
          'Financial support arrangements'
        ],
        processingTime: '2-3 months'
      },
      {
        id: 'm1-vocational',
        title: 'M-1 Vocational Student',
        description: 'Vocational or technical studies',
        forms: ['DS-160', 'I-20'],
        documents: [
          'I-20 Form from School',
          'Passport',
          'Financial Documents',
          'Academic Records',
          'SEVIS Fee Receipt'
        ],
        eligibilityRequirements: [
          'Accepted by approved vocational school',
          'Full-time enrollment',
          'Sufficient financial resources',
          'Intent to return home'
        ],
        processingTime: '2-4 months'
      }
    ]
  },
  {
    id: 'business-tourism',
    title: 'Business & Tourism Visas',
    description: 'Temporary visits for business or tourism',
    icon: <Plane className="h-8 w-8" />,
    estimatedTime: '2-8 weeks',
    difficulty: 'Easy',
    forms: ['DS-160'],
    documents: ['Passport', 'Travel Itinerary', 'Financial Support'],
    subcategories: [
      {
        id: 'b1-business',
        title: 'B-1 Business Visitor',
        description: 'Temporary business visits',
        forms: ['DS-160'],
        documents: [
          'Passport',
          'Business Invitation Letter',
          'Company Registration',
          'Financial Documents',
          'Travel Itinerary',
          'Return Ticket'
        ],
        eligibilityRequirements: [
          'Legitimate business purpose',
          'Temporary stay intent',
          'Sufficient funds for trip',
          'Strong ties to home country'
        ],
        processingTime: '2-8 weeks'
      },
      {
        id: 'b2-tourism',
        title: 'B-2 Tourist Visitor',
        description: 'Tourism and leisure visits',
        forms: ['DS-160'],
        documents: [
          'Passport',
          'Travel Itinerary',
          'Hotel Reservations',
          'Financial Support Evidence',
          'Return Ticket',
          'Employment Letter'
        ],
        eligibilityRequirements: [
          'Tourism or leisure purpose',
          'Temporary stay intent',
          'Sufficient funds for trip',
          'Strong ties to home country'
        ],
        processingTime: '2-8 weeks'
      }
    ]
  }
];

// Simplified immigration categories for case setup
const IMMIGRATION_CATEGORIES = [
  {
    id: 'family-based',
    name: 'Family-Based Immigration',
    subcategories: [
      { id: 'spouse-citizen', name: 'Spouse of U.S. Citizen', forms: ['I-130', 'I-485', 'I-864'] },
      { id: 'parent-citizen', name: 'Parent of U.S. Citizen (21+)', forms: ['I-130', 'I-485', 'I-864'] },
      { id: 'child-citizen', name: 'Child of U.S. Citizen (Under 21)', forms: ['I-130', 'I-485', 'I-864'] },
      { id: 'sibling-citizen', name: 'Brother/Sister of U.S. Citizen', forms: ['I-130'] }
    ]
  },
  {
    id: 'employment-based',
    name: 'Employment-Based Immigration',
    subcategories: [
      { id: 'eb1-extraordinary', name: 'EB-1A Extraordinary Ability', forms: ['I-140', 'I-485'] },
      { id: 'eb2-advanced', name: 'EB-2 Advanced Degree', forms: ['I-140', 'I-485', 'ETA-9089'] },
      { id: 'eb3-skilled', name: 'EB-3 Skilled Workers', forms: ['I-140', 'I-485', 'ETA-9089'] }
    ]
  },
  {
    id: 'humanitarian',
    name: 'Humanitarian Relief',
    subcategories: [
      { id: 'asylum', name: 'Asylum Application', forms: ['I-589', 'I-765'] },
      { id: 'u-visa', name: 'U Visa (Crime Victims)', forms: ['I-918', 'I-765'] }
    ]
  },
  {
    id: 'citizenship',
    name: 'Citizenship & Naturalization',
    subcategories: [
      { id: 'naturalization-5year', name: '5-Year Naturalization Rule', forms: ['N-400'] },
      { id: 'naturalization-3year', name: '3-Year Rule (Spouse of Citizen)', forms: ['N-400'] }
    ]
  },
  {
    id: 'temporary-visas',
    name: 'Temporary Visas & Status',
    subcategories: [
      { id: 'work-authorization', name: 'Work Authorization (EAD)', forms: ['I-765'] },
      { id: 'advance-parole', name: 'Advance Parole (Travel Document)', forms: ['I-131'] }
    ]
  },
  {
    id: 'nonimmigrant-work',
    name: 'Non-immigrant Work Visas',
    subcategories: [
      { id: 'h1b-specialty', name: 'H-1B Specialty Occupation', forms: ['I-129', 'DS-160'] },
      { id: 'l1-intracompany', name: 'L-1 Intracompany Transfer', forms: ['I-129', 'DS-160'] },
      { id: 'o1-extraordinary', name: 'O-1 Extraordinary Ability', forms: ['I-129', 'DS-160'] },
      { id: 'tn-nafta', name: 'TN NAFTA Professional', forms: ['DS-160'] }
    ]
  },
  {
    id: 'student-exchange',
    name: 'Student & Exchange Visas',
    subcategories: [
      { id: 'f1-student', name: 'F-1 Student Visa', forms: ['DS-160', 'I-20'] },
      { id: 'j1-exchange', name: 'J-1 Exchange Visitor', forms: ['DS-160', 'DS-2019'] },
      { id: 'm1-vocational', name: 'M-1 Vocational Student', forms: ['DS-160', 'I-20'] }
    ]
  },
  {
    id: 'business-tourism',
    name: 'Business & Tourism Visas',
    subcategories: [
      { id: 'b1-business', name: 'B-1 Business Visitor', forms: ['DS-160'] },
      { id: 'b2-tourism', name: 'B-2 Tourist Visitor', forms: ['DS-160'] }
    ]
  }
];

interface ImmigrationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface FormData {
  personalInfo: {
    // Basic Information
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    nationality: string;
    dateOfBirth: string;

    // Address Information
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };

    // Place of Birth
    placeOfBirth: {
      city: string;
      state: string;
      country: string;
    };

    // Personal Information
    gender: string;
    maritalStatus: string;
    immigrationPurpose: string;

    // Identification
    passportNumber: string;
    alienRegistrationNumber: string;
    nationalIdNumber: string;

    // Spouse Information
    spouse: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      nationality: string;
      alienRegistrationNumber: string;
    };

    // Children Information
    children: Array<{
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      nationality: string;
      alienRegistrationNumber: string;
    }>;

    // Employment Information
    employment: {
      currentEmployer: {
        name: string;
        address: {
          street: string;
          city: string;
          state: string;
          zipCode: string;
          country: string;
        };
      };
      jobTitle: string;
      employmentStartDate: string;
      annualIncome: number;
    };

    // Education Information
    education: {
      highestLevel: string;
      institutionName: string;
      datesAttended: {
        startDate: string;
        endDate: string;
      };
      fieldOfStudy: string;
    };

    // Travel History
    travelHistory: Array<{
      country: string;
      visitDate: string;
      purpose: string;
      duration: number;
    }>;

    // Financial Information
    financialInfo: {
      annualIncome: number;
      sourceOfFunds: string;
      bankAccountBalance: number;
    };

    // Criminal History
    criminalHistory: {
      hasCriminalRecord: boolean;
      details: string;
    };

    // Medical History
    medicalHistory: {
      hasMedicalConditions: boolean;
      details: string;
    };

    // Additional Information
    bio: string;
    
    // Case Description
    caseDescription: string;
  };
  immigrationInfo: {
    currentStatus: string;
    entryDate: string;
    visaType: string;
    intendedCategory: string;
    familyMembers: Array<{
      name: string;
      relationship: string;
      age: number;
      status: string;
    }>;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    isRequired: boolean;
    isUploaded: boolean;
    file?: File;
  }>;
  forms: Array<{
    id: string;
    name: string;
    description: string;
    isCompleted: boolean;
    isRequired: boolean;
  }>;
}

const IndividualImmigrationProcess: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ImmigrationCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<ImmigrationSubcategory | null>(null);
  const [questionnaireStep, setQuestionnaireStep] = useState<'category' | 'subcategory' | 'confirmation'>('category');
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      // Basic Information
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      nationality: '',
      dateOfBirth: '',

      // Address Information
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
      },

      // Place of Birth
      placeOfBirth: {
        city: '',
        state: '',
        country: '',
      },

      // Personal Information
      gender: '',
      maritalStatus: '',
      immigrationPurpose: '',

      // Identification
      passportNumber: '',
      alienRegistrationNumber: '',
      nationalIdNumber: '',

      // Spouse Information
      spouse: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        alienRegistrationNumber: '',
      },

      // Children Information
      children: [],

      // Employment Information
      employment: {
        currentEmployer: {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
        },
        jobTitle: '',
        employmentStartDate: '',
        annualIncome: 0,
      },

      // Education Information
      education: {
        highestLevel: '',
        institutionName: '',
        datesAttended: {
          startDate: '',
          endDate: '',
        },
        fieldOfStudy: '',
      },

      // Travel History
      travelHistory: [],

      // Financial Information
      financialInfo: {
        annualIncome: 0,
        sourceOfFunds: '',
        bankAccountBalance: 0,
      },

      // Criminal History
      criminalHistory: {
        hasCriminalRecord: false,
        details: '',
      },

      // Medical History
      medicalHistory: {
        hasMedicalConditions: false,
        details: '',
      },

      // Additional Information
      bio: '',
      
      // Case Description
      caseDescription: '',
    },
    immigrationInfo: {
      currentStatus: '',
      entryDate: '',
      visaType: '',
      intendedCategory: '',
      familyMembers: [],
    },
    documents: [
      { id: '1', name: 'Passport', type: 'identity', isRequired: true, isUploaded: false },
      { id: '2', name: 'Birth Certificate', type: 'identity', isRequired: true, isUploaded: false },
      { id: '3', name: 'Marriage Certificate', type: 'family', isRequired: false, isUploaded: false },
      { id: '4', name: 'Employment Records', type: 'employment', isRequired: false, isUploaded: false },
      { id: '5', name: 'Financial Documents', type: 'financial', isRequired: true, isUploaded: false },
      { id: '6', name: 'Medical Records', type: 'medical', isRequired: true, isUploaded: false },
    ],
    forms: [
      { id: '1', name: 'I-130', description: 'Petition for Alien Relative', isCompleted: false, isRequired: true },
      { id: '2', name: 'I-485', description: 'Application to Register Permanent Residence', isCompleted: false, isRequired: true },
      { id: '3', name: 'I-864', description: 'Affidavit of Support', isCompleted: false, isRequired: true },
      { id: '4', name: 'I-693', description: 'Report of Medical Examination', isCompleted: false, isRequired: true },
      { id: '5', name: 'I-765', description: 'Application for Employment Authorization', isCompleted: false, isRequired: false },
      { id: '6', name: 'I-131', description: 'Application for Travel Document', isCompleted: false, isRequired: false },
    ],
  });

  // State for custom questionnaires
  const [showCustomQuestionnaire, setShowCustomQuestionnaire] = useState(false);
  const [selectedCustomQuestionnaire, setSelectedCustomQuestionnaire] = useState<LoadedQuestionnaire | null>(null);
  const [customQuestionnaireAnswers, setCustomQuestionnaireAnswers] = useState<Record<string, any>>({});
  const [customQuestionnaires, setCustomQuestionnaires] = useState<LoadedQuestionnaire[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);

  // State for form templates from API
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loadingFormTemplates, setLoadingFormTemplates] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add state variables for case management (same as LegalFirmWorkflow)
  const [client, setClient] = useState<Client>({
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      aptSuiteFlr: '',
      aptNumber: '',
      city: '',
      state: '',
      zipCode: '',
      province: '',
      postalCode: '',
      country: 'United States'
    },
    status: 'active'
  });

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
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    visaType: '',
    priorityDate: new Date().toISOString(),
    openDate: new Date().toISOString()
  });

  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [formCaseIds, setFormCaseIds] = useState<FormCaseIds>({});
  const [formDetailsId, setFormDetailsId] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string>('');
  const [generatingCaseIds, setGeneratingCaseIds] = useState(false);
  const [completeWorkflowDetails, setCompleteWorkflowDetails] = useState<any>(null);

  // State for auto-fill forms functionality
  const [generatedForms, setGeneratedForms] = useState<Array<{
    formName: string;
    templateId: string;
    blob: Blob;
    downloadUrl: string;
    fileName: string;
    pdfId?: string;
    status: 'generating' | 'success' | 'error';
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
  }>>([]);
  const [generatingForms, setGeneratingForms] = useState(false);
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});
  const [showUnfilledFields, setShowUnfilledFields] = useState<Record<string, boolean>>({});
  const [showEditor, setShowEditor] = useState<Record<string, boolean>>({});
  
  // State for PDF preview data
  const [pdfPreviewData, setPdfPreviewData] = useState<Record<string, {
    blob: Blob;
    metadata: any;
    pdfId: string;
  }>>({});
  const [loadingPreview, setLoadingPreview] = useState<Record<string, boolean>>({});

  // Client loading/sync state
  const [clientId, setClientId] = useState<string | null>(null);
  const [loadingClient, setLoadingClient] = useState<boolean>(false);
  const suppressNextAutoSaveRef = React.useRef<boolean>(false);
  const autoSaveTimerRef = React.useRef<number | null>(null);

  // Helper: map API client payload to local personalInfo structure
  const mapClientToPersonalInfo = (apiClient: any): FormData['personalInfo'] => {
    const c = apiClient || {};
    return {
      // Basic Information
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      email: c.email || '',
      password: '',
      confirmPassword: '',
      phone: c.phone || '',
      nationality: c.nationality || '',
      dateOfBirth: c.dateOfBirth ? String(c.dateOfBirth).substring(0, 10) : '',

      // Address Information
      address: {
        street: c.address?.street || '',
        city: c.address?.city || '',
        state: c.address?.state || '',
        zipCode: c.address?.zipCode || '',
        country: c.address?.country || 'United States',
      },

      // Place of Birth
      placeOfBirth: {
        city: c.placeOfBirth?.city || '',
        state: c.placeOfBirth?.state || '',
        country: c.placeOfBirth?.country || '',
      },

      // Personal Information
      gender: c.gender || '',
      maritalStatus: c.maritalStatus || '',
      immigrationPurpose: c.immigrationPurpose || '',

      // Identification
      passportNumber: c.passportNumber || '',
      alienRegistrationNumber: c.alienRegistrationNumber || '',
      nationalIdNumber: c.nationalIdNumber || '',

      // Spouse Information
      spouse: {
        firstName: c.spouse?.firstName || '',
        lastName: c.spouse?.lastName || '',
        dateOfBirth: c.spouse?.dateOfBirth ? String(c.spouse.dateOfBirth).substring(0, 10) : '',
        nationality: c.spouse?.nationality || '',
        alienRegistrationNumber: c.spouse?.alienRegistrationNumber || '',
      },

      // Children Information
      children: Array.isArray(c.children) ? c.children.map((ch: any) => ({
        firstName: ch.firstName || '',
        lastName: ch.lastName || '',
        dateOfBirth: ch.dateOfBirth ? String(ch.dateOfBirth).substring(0, 10) : '',
        nationality: ch.nationality || '',
        alienRegistrationNumber: ch.alienRegistrationNumber || '',
      })) : [],

      // Employment Information
      employment: {
        currentEmployer: {
          name: c.employment?.currentEmployer?.name || '',
          address: {
            street: c.employment?.currentEmployer?.address?.street || '',
            city: c.employment?.currentEmployer?.address?.city || '',
            state: c.employment?.currentEmployer?.address?.state || '',
            zipCode: c.employment?.currentEmployer?.address?.zipCode || '',
            country: c.employment?.currentEmployer?.address?.country || '',
          },
        },
        jobTitle: c.employment?.jobTitle || '',
        employmentStartDate: c.employment?.employmentStartDate ? String(c.employment.employmentStartDate).substring(0, 10) : '',
        annualIncome: c.employment?.annualIncome ?? 0,
      },

      // Education Information
      education: {
        highestLevel: c.education?.highestLevel || '',
        institutionName: c.education?.institutionName || '',
        datesAttended: {
          startDate: c.education?.datesAttended?.startDate ? String(c.education.datesAttended.startDate).substring(0, 10) : '',
          endDate: c.education?.datesAttended?.endDate ? String(c.education.datesAttended.endDate).substring(0, 10) : '',
        },
        fieldOfStudy: c.education?.fieldOfStudy || '',
      },

      // Travel History
      travelHistory: Array.isArray(c.travelHistory) ? c.travelHistory.map((tr: any) => ({
        country: tr.country || '',
        visitDate: tr.visitDate ? String(tr.visitDate).substring(0, 10) : '',
        purpose: tr.purpose || '',
        duration: typeof tr.duration === 'number' ? tr.duration : 0,
      })) : [],

      // Financial Information
      financialInfo: {
        annualIncome: c.financialInfo?.annualIncome ?? 0,
        sourceOfFunds: c.financialInfo?.sourceOfFunds || '',
        bankAccountBalance: c.financialInfo?.bankAccountBalance ?? 0,
      },

      // Criminal History
      criminalHistory: {
        hasCriminalRecord: !!c.criminalHistory?.hasCriminalRecord,
        details: c.criminalHistory?.details || '',
      },

      // Medical History
      medicalHistory: {
        hasMedicalConditions: !!c.medicalHistory?.hasMedicalConditions,
        details: c.medicalHistory?.details || '',
      },

      // Additional Information
      bio: c.bio || '',
      
      // Case Description
      caseDescription: c.caseDescription || '',
    };
  };

  // Helper: build update payload expected by API from personalInfo
  const buildUpdatePayload = (pi: FormData['personalInfo']) => {
    return {
      // send top-level basic fields for compatibility
      firstName: pi.firstName,
      lastName: pi.lastName,
      email: pi.email,
      phone: pi.phone,
      name: `${pi.firstName} ${pi.lastName}`.trim(),
      nationality: pi.nationality,
      dateOfBirth: pi.dateOfBirth || undefined,
      address: pi.address,
      placeOfBirth: pi.placeOfBirth,
      gender: pi.gender,
      maritalStatus: pi.maritalStatus,
      immigrationPurpose: pi.immigrationPurpose,
      passportNumber: pi.passportNumber,
      alienRegistrationNumber: pi.alienRegistrationNumber,
      nationalIdNumber: pi.nationalIdNumber,
      spouse: pi.spouse,
      children: pi.children,
      employment: {
        currentEmployer: pi.employment.currentEmployer,
        jobTitle: pi.employment.jobTitle,
        employmentStartDate: pi.employment.employmentStartDate,
        annualIncome: pi.employment.annualIncome,
      },
      education: pi.education,
      travelHistory: pi.travelHistory,
      financialInfo: pi.financialInfo,
      criminalHistory: pi.criminalHistory,
      medicalHistory: pi.medicalHistory,
      bio: pi.bio,
      caseDescription: pi.caseDescription,
      // also nest under personalInfo
      personalInfo: { ...pi },
    };
  };

  // Determine clientId and load client on mount/user change
  useEffect(() => {
    const determineClientId = () => {
      const fromStorage = localStorage.getItem('currentClientId');
      if (fromStorage) return fromStorage;
      // Prefer explicit client id on user if available, else fallback to user _id for client roles
      // @ts-ignore optional shape
      if ((user as any)?._id) return (user as any)._id as string;
      if (user?.role === 'client' && user?._id) return user._id;
      return null;
    };

    const id = determineClientId();
    if (!id) return;
    setClientId(id);

    const load = async () => {
      try {
        setLoadingClient(true);
        const apiClient = await getClientById(id);
        const pi = mapClientToPersonalInfo(apiClient);
        suppressNextAutoSaveRef.current = true; // avoid autosave immediately after loading
        setFormData(prev => ({ ...prev, personalInfo: pi }));
        // also seed local client state used elsewhere
        setClient(prev => ({
          ...prev,
          name: `${pi.firstName} ${pi.lastName}`.trim(),
          firstName: pi.firstName,
          lastName: pi.lastName,
          email: pi.email,
          phone: pi.phone,
          dateOfBirth: pi.dateOfBirth,
          nationality: pi.nationality,
          address: {
            street: pi.address.street,
            aptSuiteFlr: '',
            aptNumber: '',
            city: pi.address.city,
            state: pi.address.state,
            zipCode: pi.address.zipCode,
            province: '',
            postalCode: '',
            country: pi.address.country,
          },
        }));
      } catch (e: any) {
        console.error('Failed to load client', e);
        toast.error('Failed to load client details');
      } finally {
        setLoadingClient(false);
      }
    };

    load();
  }, [user]);

  // Debounced auto-save when personal info changes
  // useEffect(() => {
  //   if (!clientId) return;
  //   if (suppressNextAutoSaveRef.current) {
  //     suppressNextAutoSaveRef.current = false;
  //     return;
  //   }

  //   if (autoSaveTimerRef.current) {
  //     window.clearTimeout(autoSaveTimerRef.current);
  //   }

  //   autoSaveTimerRef.current = window.setTimeout(async () => {
  //     try {
  //       const payload = buildUpdatePayload(formData.personalInfo);
  //       await updateClient(clientId, payload as any);
  //       toast.success('Saved');
  //     } catch (e: any) {
  //       console.error('Auto-save failed', e);
  //       toast.error('Failed to save changes');
  //     }
  //   }, 800);

  //   return () => {
  //     if (autoSaveTimerRef.current) {
  //       window.clearTimeout(autoSaveTimerRef.current);
  //     }
  //   };
  // }, [formData.personalInfo, clientId]);

  // This effect now *only* marks the form as dirty on change.
  useEffect(() => {
    if (!clientId) return;

    // If we are just loading data, don't mark as dirty
    if (suppressNextAutoSaveRef.current) {
      suppressNextAutoSaveRef.current = false;
      setIsDirty(false); // Ensure it's not dirty on load
      return;
    }

    // Any other change marks it as dirty
    setIsDirty(true);

  }, [formData.personalInfo, clientId]);

  // Load custom questionnaires from API
  useEffect(() => {
    const loadCustomQuestionnaires = async () => {
      try {
        setLoadingQuestionnaires(true);

        // Load from API
        const response = await questionnaireService.getQuestionnaires();

        // Convert API questionnaires to local format and filter for active ones
        const convertedQuestionnaires: LoadedQuestionnaire[] = response.questionnaires
          .filter(q => q.is_active)
          .map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            category: q.category,
            fields: q.fields.map(field => ({
              id: field.id,
              type: field.type,
              label: field.label,
              required: field.required,
              options: field.options,
              help_text: field.help_text,
              eligibility_impact: field.eligibility_impact
            }))
          }));

        setCustomQuestionnaires(convertedQuestionnaires);

        // Also make available globally for other components
        (window as any).getImmigrationQuestionnaires = () => convertedQuestionnaires;
        (window as any).getQuestionnaireByCategory = (category: string) =>
          convertedQuestionnaires.filter(q => q.category === category);

      } catch (error) {
        console.error('Error loading questionnaires:', error);
        // Fallback to empty array on error
        setCustomQuestionnaires([]);
      } finally {
        setLoadingQuestionnaires(false);
      }
    };

    loadCustomQuestionnaires();
  }, []);

  // Load available form templates for Select Forms screen
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingFormTemplates(true);
      try {
        const response = await getAnvilTemplatesList();
        const templates = response.data?.data?.templates || [];
        
        // Map the Anvil templates response to FormTemplate structure
        const mappedTemplates: FormTemplate[] = templates.map((template: any) => ({
          _id: template.templateId,
          name: template.formNumber,
          formNumber: template.formNumber,
          description: template.description || '',
          category: 'USCIS' as any,
          type: 'uscis' as any,
          status: template.isActive ? 'active' as any : 'inactive' as any,
          fields: [], // Empty fields array for now
          version: '1.0',
          effectiveDate: template.createdAt || new Date().toISOString(),
          expirationDate: template.expirationDate,
          isActive: template.isActive || false,
          createdBy: 'system',
          updatedBy: 'system',
          createdAt: template.createdAt || new Date().toISOString(),
          updatedAt: template.updatedAt || new Date().toISOString(),
          metadata: {
            uscisFormNumber: template.formNumber,
            templateId: template.templateId,
            isFieldsValidated: template.isFieldsValidated,
            instructions: template.description
          }
        }));
        
        setFormTemplates(mappedTemplates);
      } catch (error) {
        console.error('Error loading form templates:', error);
        setFormTemplates([]);
        toast.error('Failed to load form templates. Please refresh the page.');
      } finally {
        setLoadingFormTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Sync client and case data when form data changes
  useEffect(() => {
    if (formData.personalInfo.firstName && formData.personalInfo.lastName) {
      updateClientFromFormData();
    }
  }, [formData.personalInfo]);

  useEffect(() => {
    if (selectedCategory && selectedSubcategory && formData.personalInfo.firstName) {
      updateCaseFromFormData();
    }
  }, [selectedCategory, selectedSubcategory, selectedForms]);

  // Add case creation functions (same as LegalFirmWorkflow)
  const saveWorkflowProgress = async () => {
    try {
      // Prepare comprehensive workflow data
      const workflowData = {
        // Workflow metadata
        workflowId: workflowId || `workflow_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentStep,
        status: 'in-progress',

        // Client information
        client: {
          ...client,
          // Explicitly include all name fields
          firstName: client.firstName,
          middleName: client.middleName || '',
          lastName: client.lastName,
          name: client.name, // Full name
          // Explicitly include complete address information
          address: {
            street: client.address?.street || '',
            aptSuiteFlr: client.address?.aptSuiteFlr || '',
            aptNumber: client.address?.aptNumber || '',
            city: client.address?.city || '',
            state: client.address?.state || '',
            zipCode: client.address?.zipCode || '',
            province: client.address?.province || '',
            postalCode: client.address?.postalCode || '',
            country: client.address?.country || 'United States'
          }
        },

        // Case details
        case: {
          ...caseData,
          // Ensure we have valid IDs
          id: caseData.id || generateObjectId(),
          _id: caseData._id || caseData.id || generateObjectId()
        },

        // Selected forms and case IDs
        selectedForms,
        formCaseIds,
        formTemplates: formTemplates.filter(template => selectedForms.includes(template.formNumber)),

        // Workflow steps progress
        stepsProgress: [
          { title: 'Personal Information', status: 'completed', index: 0 },
          { title: 'Immigration Details', status: 'completed', index: 1 },
          { title: 'Document Upload', status: 'completed', index: 2 },
          { title: 'Form Selection', status: 'completed', index: 3 },
          { title: 'Review & Submit', status: 'current', index: 4 }
        ]
      };

      // Check if we should save to API
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Save to API only
          const response = await api.post('/api/v1/workflows/progress', workflowData);

          // Store the workflow ID from API response
          if (response.data?.workflowId) {
            workflowData.workflowId = response.data.workflowId;
            setWorkflowId(response.data.workflowId);
          }

          // Workflow progress saved to server
          toast.success('Workflow progress saved successfully');
          return workflowData;

        } catch (apiError: any) {
          // Check if it's a 404 (endpoint doesn't exist)
          if (apiError.response?.status === 404) {
            toast.error('Workflow save endpoint not available', { duration: 3000 });
          } else {
            toast.error('Failed to save workflow progress to server', { duration: 3000 });
          }
          throw apiError;
        }
      } else {
        toast.error('Authentication required to save workflow');
        throw new Error('No authentication token available');
      }

    } catch (error) {
      toast.error('Failed to save workflow progress');
      throw error;
    }
  };

  // Function to generate form case IDs
  const generateFormCaseIds = (forms: string[]) => {
    const newFormCaseIds: FormCaseIds = {};
    forms.forEach(form => {
      // Generate USCIS-style case ID (MSC + 9 digits)
      const timestamp = Date.now().toString();
      const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const caseId = `MSC${timestamp.slice(-3)}${randomDigits}`;
      newFormCaseIds[form] = caseId;
    });
    setFormCaseIds(newFormCaseIds);
    return newFormCaseIds;
  };

  // Function to update client data from form data
  const updateClientFromFormData = () => {
    const newClient: Client = {
      ...client,
      name: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim(),
      firstName: formData.personalInfo.firstName,
      lastName: formData.personalInfo.lastName,
      email: formData.personalInfo.email,
      phone: formData.personalInfo.phone,
      dateOfBirth: formData.personalInfo.dateOfBirth,
      nationality: formData.personalInfo.nationality,
      address: {
        street: formData.personalInfo.address.street,
        city: formData.personalInfo.address.city,
        state: formData.personalInfo.address.state,
        zipCode: formData.personalInfo.address.zipCode,
        country: formData.personalInfo.address.country
      }
    };
    setClient(newClient);
    return newClient;
  };

  // Function to update case data from form data
  const updateCaseFromFormData = () => {
    const newCase: Case = {
      ...caseData,
      title: `${selectedCategory?.title || 'Immigration'} Case - ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
      description: formData.personalInfo.caseDescription || `Immigration case for ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
      category: selectedCategory?.id || 'immigration',
      subcategory: selectedSubcategory?.id || 'general',
      visaType: formData.immigrationInfo.visaType,
      assignedForms: selectedForms,
      clientId: client.id || client._id || generateObjectId()
    };
    setCaseData(newCase);
    return newCase;
  };

  const steps: ImmigrationStep[] = [
    { id: 'personal-details', title: 'Personal Details', description: 'Basic personal information', isCompleted: false, isActive: true },
    { id: 'select-form', title: 'Select Forms', description: 'Choose required forms for filing', isCompleted: false, isActive: false },
    { id: 'form-details', title: 'All Details Summary', description: 'Complete workflow details overview', isCompleted: false, isActive: false },
    { id: 'auto-fill', title: 'Auto-fill Forms', description: 'Generate completed forms', isCompleted: false, isActive: false }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Mark current step as completed
      steps[currentStep].isCompleted = true;
      steps[currentStep + 1].isActive = true;
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleSaveAndNext = async () => {
    // If not dirty, just go next
    if (!isDirty) {
      handleNext(); // Assumes handleNext() exists in this scope
      return;
    }

    // If it is dirty, save first
    setIsSaving(true);

    try {
      const payload = buildUpdatePayload(formData.personalInfo);
      if (clientId) {
        await updateClient(clientId, payload as any);
      }
      toast.success('Saved');
      setIsDirty(false); // Saved, no longer dirty
      setIsSaving(false); // No longer saving
      
      // Go to next step AFTER successful save
      handleNext(); 
    } catch (e: any) {
      console.error('Save failed', e);
      toast.error('Failed to save changes');
      setIsSaving(false); // No longer saving, but still dirty
      // Do NOT go to next step on failure
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        address: {
          ...prev.personalInfo.address,
          [field]: value
        }
      }
    }));
  };

  const handleImmigrationInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      immigrationInfo: {
        ...prev.immigrationInfo,
        [field]: value
      }
    }));
  };

  const handleFileUpload = (documentId: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, isUploaded: true, file }
          : doc
      )
    }));
  };

  const handleRemoveFile = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, isUploaded: false, file: undefined }
          : doc
      )
    }));
  };

  const handleFormToggle = (formId: string) => {
    setFormData(prev => ({
      ...prev,
      forms: prev.forms.map(form =>
        form.id === formId
          ? { ...form, isCompleted: !form.isCompleted }
          : form
      )
    }));
  };

  const handleSubmit = async () => {
    try {
      // Update client and case data from form data
      const updatedClient = updateClientFromFormData();
      const updatedCase = updateCaseFromFormData();

      // Generate form case IDs if forms are selected
      if (selectedForms.length > 0) {
        generateFormCaseIds(selectedForms);
      }

      // Save workflow progress to backend
      try {
        await saveWorkflowProgress();

        toast.success('Immigration case created successfully!');

        // Navigate to case details or dashboard
        navigate('/cases');

      } catch (error) {
        console.error('Error saving to backend:', error);
        // Fallback to local storage if API fails
        const caseData = {
          id: generateObjectId(),
          client: updatedClient,
          case: updatedCase,
          selectedForms,
          formCaseIds,
          createdAt: new Date().toISOString(),
          status: 'draft'
        };

        localStorage.setItem(`immigration-case-${caseData.id}`, JSON.stringify(caseData));
        toast.success('Case saved locally. Please check your internet connection and try again later.');
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error submitting application. Please try again.');
    }
  };

  // Add form selection handler
  const handleFormSelection = (formName: string) => {
    if (!formName) {
      console.error('handleFormSelection called with empty formName');
      return;
    }
    
    if (selectedForms.includes(formName)) {
      setSelectedForms([]); // Deselect if clicking the same form
    } else {
      setSelectedForms([formName]); // Select only this form
    }
  };

  // Handle forms submit with case ID generation (matching LegalFirmWorkflow)
  const handleFormsSubmit = async () => {
    if (selectedForms.length === 0) {
      toast.error('Please select a form');
      return;
    }

    setGeneratingCaseIds(true);

    try {
      let caseIds: Record<string, string> = {};

      try {
        // Try to generate case IDs from API first
        caseIds = await generateMultipleCaseIdsFromAPI(selectedForms);
      } catch (error) {
        // Fallback to client-side generation
        caseIds = await generateMultipleCaseIds(selectedForms);
      }

      // Store the generated case IDs
      setFormCaseIds(caseIds);

      // Update case with selected forms and case IDs
      const updatedCase = {
        ...caseData,
        assignedForms: selectedForms,
        formCaseIds: caseIds
      };
      setCaseData(updatedCase);

      // Just proceed to next step without saving
      handleNext();
    } catch (error) {
      toast.error('Failed to generate case IDs. Please try again.');
    } finally {
      setGeneratingCaseIds(false);
    }
  };

  // Questionnaire handlers
  const handleCategorySelection = (category: ImmigrationCategory) => {
    setSelectedCategory(category);
    if (category.subcategories.length > 0) {
      setQuestionnaireStep('subcategory');
    } else {
      setQuestionnaireStep('confirmation');
    }
  };

  const handleSubcategorySelection = (subcategory: ImmigrationSubcategory) => {
    setSelectedSubcategory(subcategory);
    setQuestionnaireStep('confirmation');
  };

  const handleCustomQuestionnaireSelect = (questionnaire: LoadedQuestionnaire) => {
    setSelectedCustomQuestionnaire(questionnaire);
    setShowCustomQuestionnaire(true);
    setCustomQuestionnaireAnswers({});
  };

  const handleCustomQuestionnaireAnswer = (questionId: string, answer: any) => {
    setCustomQuestionnaireAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleCustomQuestionnaireSubmit = async () => {
    if (!selectedCustomQuestionnaire) return;

    try {
      // Submit via API
      const response = await questionnaireService.submitQuestionnaireResponse(
        selectedCustomQuestionnaire.id,
        {
          responses: customQuestionnaireAnswers,
          auto_save: false
        }
      );

      setShowCustomQuestionnaire(false);
      setShowQuestionnaire(false);
    } catch (error: any) {
      console.error('Error submitting questionnaire:', error);
      console.error('Failed to submit questionnaire: ' + error.message);
    }
  };

  // Auto-fill forms functionality
  const handleAutoGenerateForms = async () => {
    try {
      setGeneratingForms(true);
      setGeneratedForms([]);

      // Prepare comprehensive form data from all collected information
      const autoFillFormData = {
        // Required fields for validation
        clientId: (client as any)?.clientId || client?._id || client?.id || clientId || '',
        formNumber: selectedForms && selectedForms.length > 0 ? selectedForms[0] : 'workflow-step',

        // Client information
        clientFirstName: formData.personalInfo.firstName || client?.firstName || '',
        clientLastName: formData.personalInfo.lastName || client?.lastName || '',
        clientEmail: formData.personalInfo.email || client?.email || '',
        clientPhone: formData.personalInfo.phone || client?.phone || '',
        clientDateOfBirth: formData.personalInfo.dateOfBirth || client?.dateOfBirth || '',
        clientNationality: formData.personalInfo.nationality || client?.nationality || '',

        // Client address
        clientStreet: formData.personalInfo.address?.street || client?.address?.street || '',
        clientCity: formData.personalInfo.address?.city || client?.address?.city || '',
        clientState: formData.personalInfo.address?.state || client?.address?.state || '',
        clientZipCode: formData.personalInfo.address?.zipCode || client?.address?.zipCode || '',
        clientCountry: formData.personalInfo.address?.country || client?.address?.country || '',

        // Case information
        caseCategory: caseData.category || selectedCategory?.id || '',
        caseSubcategory: caseData.subcategory || selectedSubcategory?.id || '',
        visaType: caseData.visaType || formData.immigrationInfo.visaType || '',
        priorityDate: caseData.priorityDate || '',

        // Form details
        selectedForms: selectedForms || [],
        questionnaireResponses: {},

        // Additional metadata
        workflowStep: currentStep,
        timestamp: new Date().toISOString(),
        autoFillSource: 'IndividualImmigrationProcess'
      };

      // Validate the form data
      const validation = validateFormData(autoFillFormData);
      if (!validation.isValid) {
        toast.error(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }

      // Prepare the data for the API
      const preparedData = prepareFormData(autoFillFormData);

      // Generate forms for each selected form
      const newGeneratedForms = [];

      for (const formName of selectedForms) {
        try {
          // Find the form template that matches the selected form name
          const formTemplate = formTemplates.find(template => 
            template.formNumber === formName || 
            template.metadata?.uscisFormNumber === formName
          );
          
          // Get the form number from the template metadata, or fallback to form name
          const rawFormNumber = formTemplate?.metadata?.uscisFormNumber || formName;
          
          // Normalize form number by removing "Form " prefix if present
          const formNumber = rawFormNumber.replace(/^Form\s+/i, '');

          // Add a placeholder for generating status
          newGeneratedForms.push({
            formName,
            templateId: '',
            blob: new Blob(),
            downloadUrl: '',
            fileName: `${formName}_${new Date().toISOString().split('T')[0]}.pdf`,
            status: 'generating' as const
          });

          // Fetch template IDs for this form number using Anvil API
          const templatesResponse = await getTemplateIdsByFormNumber(formNumber);
          
          if (!templatesResponse.data.success || !templatesResponse.data.data.templates.length) {
            throw new Error(`No Anvil templates found for form ${formNumber}`);
          }

          // Use the first available template (you might want to add logic to select the best one)
          const anvilTemplate = templatesResponse.data.data.templates[0];
          const templateId = anvilTemplate.templateId;

          // Update the template ID in the form
          const formIndex: number = newGeneratedForms.findIndex(f => f.formName === formName);
          if (formIndex !== -1) {
            newGeneratedForms[formIndex].templateId = templateId;
          }

          // Use Anvil API to fill the PDF template
          const anvilResponse = await fillPdfTemplateBlob(
            templateId,
            preparedData,
            {
              title: `${formName} - ${autoFillFormData.clientFirstName} ${autoFillFormData.clientLastName}`,
              fontFamily: 'Arial',
              fontSize: 12,
              textColor: '#000000',
              useInteractiveFields: true
            }
          );

          if (anvilResponse.data) {
            // Create download URL
            const downloadUrl = createPdfBlobUrl(anvilResponse.data.blob);
            const fileName = anvilResponse.data.metadata?.filename || `${formName}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Update the form with success status
            if (formIndex !== -1) {
              newGeneratedForms[formIndex] = {
                formName,
                templateId,
                blob: anvilResponse.data.blob,
                downloadUrl,
                fileName,
                pdfId: anvilResponse.data.pdfId,
                status: 'success' as const,
                filledPercentage: anvilResponse.data.filledPercentage,
                unfilledFields: anvilResponse.data.unfilledFields,
                metadata: anvilResponse.data.metadata
              };
            }

            // Generated form successfully
          } else {
            throw new Error('No data returned from Anvil API');
          }
        } catch (error) {
          // Update the form with error status
          const formIndex: number = newGeneratedForms.findIndex(f => f.formName === formName);
          if (formIndex !== -1) {
            newGeneratedForms[formIndex] = {
              formName,
              templateId: '',
              blob: new Blob(),
              downloadUrl: '',
              fileName: '',
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }

          toast.error(`Failed to generate ${formName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setGeneratedForms(newGeneratedForms);

      if (newGeneratedForms.some(f => f.status === 'success')) {
        // Forms generated successfully
      }

    } catch (error) {
      toast.error('Failed to generate forms. Please try again.');
    } finally {
      setGeneratingForms(false);
    }
  };

  // Function to download a specific form
  const handleDownloadForm = (formName: string) => {
    const form = generatedForms.find(f => f.formName === formName);
    if (form && form.status === 'success') {
      downloadPdfFile(form.blob, form.fileName);
    }
  };

  // Function to preview a specific form
  const handlePreviewForm = async (formName: string) => {
    const form = generatedForms.find(f => f.formName === formName);
    if (!form) {
      toast.error(`Form ${formName} not found`);
      return;
    }

    // If preview is already showing, just toggle it off
    if (showPreview[formName]) {
      setShowPreview(prev => ({
        ...prev,
        [formName]: false
      }));
      return;
    }

    // Always try to show preview - use existing blob first, then try to fetch fresh data
    if (form.blob) {
      // Show existing preview immediately
      setShowPreview(prev => ({
        ...prev,
        [formName]: true
      }));
      
      // If we have a pdfId, also try to fetch fresh data in background
      if (form.pdfId) {
        try {
          setLoadingPreview(prev => ({ ...prev, [formName]: true }));
          
          const previewResponse = await getPdfPreviewBlob({ pdfId: form.pdfId });
          
          if (previewResponse.data.blob) {
            const { blob, metadata, pdfId } = previewResponse.data;
            
            // Update preview data state
            setPdfPreviewData(prev => ({
              ...prev,
              [formName]: {
                blob,
                metadata,
                pdfId
              }
            }));

            // Update the form with new preview data
            const updatedForms = generatedForms.map(f => 
              f.formName === formName 
                ? { 
                    ...f, 
                    blob,
                    downloadUrl: URL.createObjectURL(blob)
                  }
                : f
            );
            setGeneratedForms(updatedForms);

            toast.success('PDF preview refreshed from backend');
          }
        } catch (error) {
          console.error('Error refreshing PDF preview:', error);
          // Don't show error toast since we're already showing the cached version
        } finally {
          setLoadingPreview(prev => ({ ...prev, [formName]: false }));
        }
      }
    } else if (form.pdfId) {
      // No existing blob, try to fetch from backend
      try {
        setLoadingPreview(prev => ({ ...prev, [formName]: true }));
        
        const previewResponse = await getPdfPreviewBlob({ pdfId: form.pdfId });
        
        if (previewResponse.data.blob) {
          const { blob, metadata, pdfId } = previewResponse.data;
          
          // Update preview data state
          setPdfPreviewData(prev => ({
            ...prev,
            [formName]: {
              blob,
              metadata,
              pdfId
            }
          }));

          // Update the form with new preview data
          const updatedForms = generatedForms.map(f => 
            f.formName === formName 
              ? { 
                  ...f, 
                  blob,
                  downloadUrl: URL.createObjectURL(blob)
                }
              : f
          );
          setGeneratedForms(updatedForms);

          // Show the preview
          setShowPreview(prev => ({
            ...prev,
            [formName]: true
          }));

          toast.success('PDF preview loaded from backend');
        } else {
          throw new Error('Failed to load PDF preview - no blob data received');
        }
      } catch (error) {
        console.error('Error loading PDF preview:', error);
        toast.error('Failed to load PDF preview');
      } finally {
        setLoadingPreview(prev => ({ ...prev, [formName]: false }));
      }
    } else {
      toast.error('No PDF data available for preview');
    }
  };

  // Function to close preview
  const handleClosePreview = (formName: string) => {
    setShowPreview(prev => ({
      ...prev,
      [formName]: false
    }));
    
    // Clean up blob URL to prevent memory leaks
    const form = generatedForms.find(f => f.formName === formName);
    if (form && form.downloadUrl && form.downloadUrl.startsWith('blob:')) {
      URL.revokeObjectURL(form.downloadUrl);
    }
  };

  // Function to toggle unfilled fields display
  const handleToggleUnfilledFields = (formName: string) => {
    setShowUnfilledFields(prev => ({
      ...prev,
      [formName]: !prev[formName]
    }));
  };

  // Function to open PDF editor
  const handleEditForm = (formName: string) => {
    setShowEditor(prev => ({
      ...prev,
      [formName]: !prev[formName]
    }));
  };

  // Function to close PDF editor
  const handleCloseEditor = (formName: string) => {
    setShowEditor(prev => ({
      ...prev,
      [formName]: false
    }));
  };

  // Function to handle saving edited PDF
  const handleSaveEditedPdf = async (formName: string, editedPdfBlob: Blob) => {
    try {
      const form = generatedForms.find(f => f.formName === formName);
      if (!form) return;

      // Get current client and case information
      const currentClient = client; // Use the client state from IndividualImmigrationProcess
      const currentCase = caseData;

      // Save to backend database
      const clientIdValue = currentClient?._id || (currentClient as any)?.clientId || currentClient?.id || clientId || '';
      const formNumber = formName; // formName should be the form number
      const templateId = form.templateId;
      
      // Ensure we have a valid pdfId
      if (!form.pdfId) {
        toast.error(`Cannot save edited PDF: Missing pdfId for form ${formName}`);
        return;
      }

      const saveResponse = await saveEditedPdf(
        editedPdfBlob,
        formNumber,
        clientIdValue,
        templateId,
        form.pdfId, // Use the existing pdfId
        {
          caseId: currentCase?._id || currentCase?.id,
          workflowId: workflowId, // Use the workflowId from IndividualImmigrationProcess
          filename: form.fileName
        }
      );

      if (saveResponse.data.success) {
        // Update the form with the edited PDF and new backend data
        const updatedForms = generatedForms.map(f => 
          f.formName === formName 
            ? { 
                ...f, 
                blob: editedPdfBlob, 
                downloadUrl: saveResponse.data.data?.downloadUrl || URL.createObjectURL(editedPdfBlob),
                pdfId: saveResponse.data.data?.pdfId,
                savedToBackend: true
              }
            : f
        );
        setGeneratedForms(updatedForms);

        toast.success('PDF saved successfully to database');
        handleCloseEditor(formName);
      } else {
        throw new Error(saveResponse.data.message || 'Failed to save PDF to database');
      }
    } catch (error) {
      console.error('Error saving edited PDF:', error);
      toast.error('Failed to save PDF to database');
      
      // Fallback: still update local state even if backend save fails
      try {
        const form = generatedForms.find(f => f.formName === formName);
        if (form) {
          const updatedForms = generatedForms.map(f => 
            f.formName === formName 
              ? { ...f, blob: editedPdfBlob, downloadUrl: URL.createObjectURL(editedPdfBlob) }
              : f
          );
          setGeneratedForms(updatedForms);
          toast.success('PDF saved locally (backend save failed)');
          handleCloseEditor(formName);
        }
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
      }
    }
  };

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      generatedForms.forEach(form => {
        if (form.downloadUrl) {
          revokePdfBlobUrl(form.downloadUrl);
        }
      });
    };
  }, [generatedForms]);

  // Add a general deep update handler for nested fields in personalInfo
  const handlePersonalInfoNestedChange = (path: string[], value: any) => {
    setFormData(prev => {
      let obj = { ...prev.personalInfo };
      let current: any = obj;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return {
        ...prev,
        personalInfo: obj
      };
    });
  };

  const handleAddChild = () => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        children: [
          ...prev.personalInfo.children,
          { firstName: '', lastName: '', dateOfBirth: '', nationality: '', alienRegistrationNumber: '' }
        ]
      }
    }));
  };

  const handleRemoveChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        children: prev.personalInfo.children.filter((_, i) => i !== index)
      }
    }));
  };

  const handleUpdateChild = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        children: prev.personalInfo.children.map((child, i) =>
          i === index ? { ...child, [field]: value } : child
        )
      }
    }));
  };

  const handleAddTravelHistory = () => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        travelHistory: [
          ...prev.personalInfo.travelHistory,
          { country: '', visitDate: '', purpose: '', duration: 0 }
        ]
      }
    }));
  };

  const handleRemoveTravelHistory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        travelHistory: prev.personalInfo.travelHistory.filter((_, i) => i !== index)
      }
    }));
  };

  const handleUpdateTravelHistory = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        travelHistory: prev.personalInfo.travelHistory.map((travel, i) =>
          i === index ? { ...travel, [field]: value } : travel
        )
      }
    }));
  };
  
  // Add the missing renderCustomQuestionnaire function
  const renderCustomQuestionnaire = () => {
    if (!selectedCustomQuestionnaire) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowCustomQuestionnaire(false)}
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors mb-4 mx-auto"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Categories
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {selectedCustomQuestionnaire.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {selectedCustomQuestionnaire.description}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              {selectedCustomQuestionnaire.fields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.help_text && (
                    <p className="text-sm text-gray-500">{field.help_text}</p>
                  )}

                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={customQuestionnaireAnswers[field.id] || ''}
                      onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={customQuestionnaireAnswers[field.id] || ''}
                      onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {field.options.map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'yesno' && (
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={field.id}
                          value="yes"
                          checked={customQuestionnaireAnswers[field.id] === 'yes'}
                          onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={field.id}
                          value="no"
                          checked={customQuestionnaireAnswers[field.id] === 'no'}
                          onChange={(e) => handleCustomQuestionnaireAnswer(field.id, e.target.value)}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  )}

                  {field.eligibility_impact && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${field.eligibility_impact === 'high' ? 'bg-red-100 text-red-800' :
                      field.eligibility_impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {field.eligibility_impact} impact
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => setShowCustomQuestionnaire(false)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomQuestionnaireSubmit}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Functions
  const renderQuestionnaire = () => {
    if (showCustomQuestionnaire) {
      return renderCustomQuestionnaire();
    }

    if (questionnaireStep === 'category') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Immigration Category Selection
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the immigration category that best fits your situation.
                We'll guide you through the specific requirements and forms needed.
              </p>
            </div>

            {/* Custom Questionnaires Section */}
            {customQuestionnaires.length > 0 && (
              <div className="mb-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Custom Assessment Questionnaires
                  </h2>
                  <p className="text-gray-600">
                    Complete a custom questionnaire designed by our attorneys for your specific situation.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {customQuestionnaires.map((questionnaire) => (
                    <motion.div
                      key={questionnaire.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500"
                      onClick={() => handleCustomQuestionnaireSelect(questionnaire)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-purple-500 text-2xl">
                          <HelpCircle className="h-8 w-8" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Custom
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {questionnaire.title}
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {questionnaire.description || 'Custom questionnaire to assess your immigration situation.'}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          {questionnaire.fields.length} question(s)
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="h-4 w-4 mr-2" />
                          {questionnaire.category.charAt(0).toUpperCase() + questionnaire.category.slice(1).replace('-', ' ')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-purple-600 font-medium">Start Assessment</span>
                        <ArrowRight className="h-5 w-5 text-purple-600" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center text-gray-500">
                    <div className="h-px bg-gray-300 flex-1 mr-4"></div>
                    <span className="text-sm">OR</span>
                    <div className="h-px bg-gray-300 flex-1 ml-4"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {immigrationCategories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => handleCategorySelection(category)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-blue-500 text-3xl">
                      {category.icon}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${category.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        category.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {category.difficulty}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {category.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {category.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      {category.estimatedTime}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-2" />
                      {category.forms.length} form(s)
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Upload className="h-4 w-4 mr-2" />
                      {category.documents.length} document(s)
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium">Learn More</span>
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (questionnaireStep === 'subcategory' && selectedCategory) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <button
                onClick={() => setQuestionnaireStep('category')}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4 mx-auto"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Categories
              </button>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedCategory.title}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Choose the specific subcategory that applies to your situation
              </p>
            </div>

            <div className="space-y-6">
              {selectedCategory.subcategories.map((subcategory) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => handleSubcategorySelection(subcategory)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {subcategory.title}
                    </h3>
                    <span className="text-blue-600 font-medium text-sm">
                      {subcategory.processingTime}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {subcategory.description}
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Forms:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {subcategory.forms.map((form, idx) => (
                          <li key={idx}>{form}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Documents:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {subcategory.documents.slice(0, 3).map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                        {subcategory.documents.length > 3 && (
                          <li className="text-gray-500">+{subcategory.documents.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium">Select This Option</span>
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (questionnaireStep === 'confirmation' && selectedCategory && selectedSubcategory) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Selection Confirmed
              </h1>
              <p className="text-lg text-gray-600">
                You've selected: <span className="font-semibold">{selectedSubcategory.title}</span>
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Your Immigration Process Summary
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Forms You'll Need to Complete:</h3>
                  <div className="space-y-3">
                    {selectedSubcategory.forms.map((form, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="text-gray-900 font-medium">{form}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Documents to Prepare:</h3>
                  <div className="space-y-3">
                    {selectedSubcategory.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-green-50 rounded-lg">
                        <Upload className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-900">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Eligibility Requirements:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {selectedSubcategory.eligibilityRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setQuestionnaireStep('subcategory')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => setShowQuestionnaire(false)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                Start Application
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderFormSelectionStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Select Immigration Form</h3>
        <p className="text-blue-700">Choose one immigration form needed for this case.</p>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Available Forms (Select One)</h4>
        {loadingFormTemplates ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <div className="text-gray-500">Loading forms...</div>
          </div>
        ) : formTemplates.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">No forms available</p>
            <p className="text-sm text-gray-600 mt-1">Please contact support if forms should be available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formTemplates.map((template) => {
              // Get form number with fallback
              const formNumber = template.formNumber || template.metadata?.uscisFormNumber || '';
              
              if (!formNumber) {
                console.warn('Template missing formNumber:', template);
                return null;
              }
              
              const isSelected = selectedForms.includes(formNumber);
              
              return (
                <div
                  key={formNumber || template._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Form clicked:', formNumber);
                    handleFormSelection(formNumber);
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{formNumber}</h5>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {template.category && (
                          <span className="text-xs text-gray-400">Category: {template.category}</span>
                        )}
                        {template.type && (
                          <span className="text-xs text-gray-400">• Type: {template.type}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-500 ml-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Back</span>
        </button>
        <button
          onClick={handleFormsSubmit}
          disabled={selectedForms.length === 0 || generatingCaseIds}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${selectedForms.length > 0 && !generatingCaseIds
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {generatingCaseIds ? 'Generating Case IDs...' : 'Continue with Selected Forms'}
          <ArrowRight className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );  

  // const renderPersonalDetailsStepExpanded = () => (
  //   <div className="space-y-8">
  //     <div className="border-b border-gray-200 pb-4">
  //       <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
  //       <p className="text-gray-600 mt-2">All details required for your immigration process</p>
  //     </div>

  //     {/* Basic Information */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
  //           <input type="text" value={formData.personalInfo.firstName} onChange={e => handlePersonalInfoChange('firstName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
  //           <input type="text" value={formData.personalInfo.lastName} onChange={e => handlePersonalInfoChange('lastName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
  //         </div>
  //       </div>
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
  //           <input type="email" value={formData.personalInfo.email} onChange={e => handlePersonalInfoChange('email', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
  //           <input type="password" value={formData.personalInfo.password} onChange={e => handlePersonalInfoChange('password', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
  //           <input type="password" value={formData.personalInfo.confirmPassword} onChange={e => handlePersonalInfoChange('confirmPassword', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
  //           <input type="tel" value={formData.personalInfo.phone} onChange={e => handlePersonalInfoChange('phone', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
  //           <input type="text" value={formData.personalInfo.nationality} onChange={e => handlePersonalInfoChange('nationality', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
  //           <input type="date" value={formData.personalInfo.dateOfBirth} onChange={e => handlePersonalInfoChange('dateOfBirth', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>
  //     </section>

  //     {/* Address & Place of Birth */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
  //           <input type="text" value={formData.personalInfo.address.street} onChange={e => handlePersonalInfoNestedChange(['address', 'street'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
  //           <input type="text" value={formData.personalInfo.address.city} onChange={e => handlePersonalInfoNestedChange(['address', 'city'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
  //           <input type="text" value={formData.personalInfo.address.state} onChange={e => handlePersonalInfoNestedChange(['address', 'state'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
  //           <input type="text" value={formData.personalInfo.address.zipCode} onChange={e => handlePersonalInfoNestedChange(['address', 'zipCode'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
  //           <input type="text" value={formData.personalInfo.address.country} onChange={e => handlePersonalInfoNestedChange(['address', 'country'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>
  //       <h4 className="mt-6 font-medium text-gray-900 mb-2">Place of Birth</h4>
  //       <div className="grid md:grid-cols-3 gap-6">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
  //           <input type="text" value={formData.personalInfo.placeOfBirth.city} onChange={e => handlePersonalInfoNestedChange(['placeOfBirth', 'city'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
  //           <input type="text" value={formData.personalInfo.placeOfBirth.state} onChange={e => handlePersonalInfoNestedChange(['placeOfBirth', 'state'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
  //           <input type="text" value={formData.personalInfo.placeOfBirth.country} onChange={e => handlePersonalInfoNestedChange(['placeOfBirth', 'country'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>
  //     </section>

  //     {/* Personal Details */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
  //           <select value={formData.personalInfo.gender} onChange={e => handlePersonalInfoChange('gender', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
  //             <option value="">Select Gender</option>
  //             <option value="male">Male</option>
  //             <option value="female">Female</option>
  //             <option value="other">Other</option>
  //             <option value="prefer_not_to_say">Prefer not to say</option>
  //           </select>
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
  //           <select value={formData.personalInfo.maritalStatus} onChange={e => handlePersonalInfoChange('maritalStatus', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
  //             <option value="">Select Marital Status</option>
  //             <option value="single">Single</option>
  //             <option value="married">Married</option>
  //             <option value="divorced">Divorced</option>
  //             <option value="widowed">Widowed</option>
  //             <option value="separated">Separated</option>
  //             <option value="civil_union">Civil Union</option>
  //           </select>
  //         </div>
  //       </div>
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">Immigration Purpose</label>
  //         <select value={formData.personalInfo.immigrationPurpose} onChange={e => handlePersonalInfoChange('immigrationPurpose', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
  //           <option value="">Select Immigration Purpose</option>
  //           <option value="family_reunification">Family Reunification</option>
  //           <option value="employment">Employment</option>
  //           <option value="education">Education</option>
  //           <option value="asylum">Asylum</option>
  //           <option value="investment">Investment</option>
  //           <option value="diversity_lottery">Diversity Lottery</option>
  //           <option value="other">Other</option>
  //         </select>
  //       </div>
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">Bio/Additional Information</label>
  //         <textarea rows={4} value={formData.personalInfo.bio} onChange={e => handlePersonalInfoChange('bio', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Tell us about yourself, your background, or any additional information..." />
  //       </div>
  //     </section>

  //     {/* Identification */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Identification</h3>
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
  //           <input type="text" value={formData.personalInfo.passportNumber} onChange={e => handlePersonalInfoChange('passportNumber', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">A-Number (Alien Registration)</label>
  //           <input type="text" value={formData.personalInfo.alienRegistrationNumber} onChange={e => handlePersonalInfoChange('alienRegistrationNumber', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div className="md:col-span-2">
  //           <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number</label>
  //           <input type="text" value={formData.personalInfo.nationalIdNumber} onChange={e => handlePersonalInfoChange('nationalIdNumber', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>
  //     </section>

  //     {/* Spouse */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Spouse Information</h3>
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Spouse First Name</label>
  //           <input type="text" value={formData.personalInfo.spouse.firstName} onChange={e => handlePersonalInfoNestedChange(['spouse', 'firstName'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Last Name</label>
  //           <input type="text" value={formData.personalInfo.spouse.lastName} onChange={e => handlePersonalInfoNestedChange(['spouse', 'lastName'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Date of Birth</label>
  //           <input type="date" value={formData.personalInfo.spouse.dateOfBirth} onChange={e => handlePersonalInfoNestedChange(['spouse', 'dateOfBirth'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Nationality</label>
  //           <input type="text" value={formData.personalInfo.spouse.nationality} onChange={e => handlePersonalInfoNestedChange(['spouse', 'nationality'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Spouse A-Number</label>
  //           <input type="text" value={formData.personalInfo.spouse.alienRegistrationNumber} onChange={e => handlePersonalInfoNestedChange(['spouse', 'alienRegistrationNumber'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>
  //     </section>

  //     {/* Children */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">Children Information
  //         <button type="button" onClick={handleAddChild} className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 flex items-center ml-4">Add Child</button>
  //       </h3>
  //       {formData.personalInfo.children.length === 0 && <div className="text-gray-500">No children added.</div>}
  //       {formData.personalInfo.children.map((child, index) => (
  //         <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
  //           <div className="flex items-center justify-between mb-4">
  //             <h4 className="text-md font-medium text-gray-800">Child {index + 1}</h4>
  //             <button type="button" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveChild(index)}>Remove</button>
  //           </div>
  //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">First Name</label>
  //               <input type="text" value={child.firstName} onChange={e => handleUpdateChild(index, 'firstName', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Last Name</label>
  //               <input type="text" value={child.lastName} onChange={e => handleUpdateChild(index, 'lastName', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
  //               <input type="date" value={child.dateOfBirth} onChange={e => handleUpdateChild(index, 'dateOfBirth', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Nationality</label>
  //               <input type="text" value={child.nationality} onChange={e => handleUpdateChild(index, 'nationality', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">A-Number</label>
  //               <input type="text" value={child.alienRegistrationNumber} onChange={e => handleUpdateChild(index, 'alienRegistrationNumber', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </section>

  //     {/* Employment */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //         <div className="md:col-span-2">
  //           <label className="block text-sm font-medium text-gray-700">Current Employer Name</label>
  //           <input type="text" value={formData.personalInfo.employment.currentEmployer.name} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'name'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Job Title</label>
  //           <input type="text" value={formData.personalInfo.employment.jobTitle} onChange={e => handlePersonalInfoNestedChange(['employment', 'jobTitle'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Employment Start Date</label>
  //           <input type="date" value={formData.personalInfo.employment.employmentStartDate} onChange={e => handlePersonalInfoNestedChange(['employment', 'employmentStartDate'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Annual Income ($)</label>
  //           <input type="number" value={formData.personalInfo.employment.annualIncome || ''} onChange={e => handlePersonalInfoNestedChange(['employment', 'annualIncome'], Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>

  //       <div className="mt-4">
  //         <h4 className="font-medium text-gray-900 mb-2">Employer Address</h4>
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //           <div className="md:col-span-2">
  //             <label className="block text-sm font-medium text-gray-700">Street Address</label>
  //             <input type="text" value={formData.personalInfo.employment.currentEmployer.address.street} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'street'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">City</label>
  //             <input type="text" value={formData.personalInfo.employment.currentEmployer.address.city} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'city'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">State</label>
  //             <input type="text" value={formData.personalInfo.employment.currentEmployer.address.state} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'state'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
  //             <input type="text" value={formData.personalInfo.employment.currentEmployer.address.zipCode} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'zipCode'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">Country</label>
  //             <input type="text" value={formData.personalInfo.employment.currentEmployer.address.country} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'country'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //           </div>
  //         </div>
  //       </div>
  //     </section>

  //     {/* Education */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Education Information</h3>
  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Highest Education Level</label>
  //           <select value={formData.personalInfo.education.highestLevel} onChange={e => handlePersonalInfoNestedChange(['education', 'highestLevel'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
  //             <option value="">Select Education Level</option>
  //             <option value="high_school">High School</option>
  //             <option value="associate">Associate Degree</option>
  //             <option value="bachelor">Bachelor's Degree</option>
  //             <option value="master">Master's Degree</option>
  //             <option value="doctorate">Doctorate</option>
  //             <option value="other">Other</option>
  //           </select>
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Institution Name</label>
  //           <input type="text" value={formData.personalInfo.education.institutionName} onChange={e => handlePersonalInfoNestedChange(['education', 'institutionName'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Start Date</label>
  //           <input type="date" value={formData.personalInfo.education.datesAttended.startDate} onChange={e => handlePersonalInfoNestedChange(['education', 'datesAttended', 'startDate'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">End Date</label>
  //           <input type="date" value={formData.personalInfo.education.datesAttended.endDate} onChange={e => handlePersonalInfoNestedChange(['education', 'datesAttended', 'endDate'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Field of Study</label>
  //           <input type="text" value={formData.personalInfo.education.fieldOfStudy} onChange={e => handlePersonalInfoNestedChange(['education', 'fieldOfStudy'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>
  //     </section>

  //     {/* Travel History */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">Travel History
  //         <button type="button" onClick={handleAddTravelHistory} className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 flex items-center ml-4">Add Travel</button>
  //       </h3>
  //       {formData.personalInfo.travelHistory.length === 0 && <div className="text-gray-500">No travel records added.</div>}
  //       {formData.personalInfo.travelHistory.map((travel, index) => (
  //         <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
  //           <div className="flex items-center justify-between mb-4">
  //             <h4 className="text-md font-medium text-gray-800">Travel Record {index + 1}</h4>
  //             <button type="button" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveTravelHistory(index)}>Remove</button>
  //           </div>
  //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Country</label>
  //               <input type="text" value={travel.country} onChange={e => handleUpdateTravelHistory(index, 'country', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Visit Date</label>
  //               <input type="date" value={travel.visitDate} onChange={e => handleUpdateTravelHistory(index, 'visitDate', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Purpose</label>
  //               <select value={travel.purpose} onChange={e => handleUpdateTravelHistory(index, 'purpose', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
  //                 <option value="">Select Purpose</option>
  //                 <option value="tourism">Tourism</option>
  //                 <option value="business">Business</option>
  //                 <option value="education">Education</option>
  //                 <option value="family">Family</option>
  //                 <option value="other">Other</option>
  //               </select>
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
  //               <input type="number" value={travel.duration} onChange={e => handleUpdateTravelHistory(index, 'duration', Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </section>

  //     {/* Financial Information */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Annual Income ($)</label>
  //           <input type="number" value={formData.personalInfo.financialInfo.annualIncome || ''} onChange={e => handlePersonalInfoNestedChange(['financialInfo', 'annualIncome'], Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Source of Funds</label>
  //           <select value={formData.personalInfo.financialInfo.sourceOfFunds} onChange={e => handlePersonalInfoNestedChange(['financialInfo', 'sourceOfFunds'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
  //             <option value="">Select Source</option>
  //             <option value="employment">Employment</option>
  //             <option value="investment">Investment</option>
  //             <option value="family">Family</option>
  //             <option value="savings">Savings</option>
  //             <option value="other">Other</option>
  //           </select>
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700">Bank Account Balance ($)</label>
  //           <input type="number" value={formData.personalInfo.financialInfo.bankAccountBalance || ''} onChange={e => handlePersonalInfoNestedChange(['financialInfo', 'bankAccountBalance'], Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
  //         </div>
  //       </div>
  //     </section>

  //     {/* Criminal History */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Criminal History</h3>
  //       <div className="space-y-4">
  //         <div className="flex items-center">
  //           <input type="checkbox" id="criminalHistory.hasCriminalRecord" checked={formData.personalInfo.criminalHistory.hasCriminalRecord} onChange={e => handlePersonalInfoNestedChange(['criminalHistory', 'hasCriminalRecord'], e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
  //           <label htmlFor="criminalHistory.hasCriminalRecord" className="ml-2 block text-sm text-gray-900">I have a criminal record</label>
  //         </div>
  //         {formData.personalInfo.criminalHistory.hasCriminalRecord && (
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">Details</label>
  //             <textarea value={formData.personalInfo.criminalHistory.details} onChange={e => handlePersonalInfoNestedChange(['criminalHistory', 'details'], e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Please provide details about your criminal history..." />
  //           </div>
  //         )}
  //       </div>
  //     </section>

  //     {/* Medical History */}
  //     <section className="bg-gray-50 rounded-xl p-6 mb-6">
  //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
  //       <div className="space-y-4">
  //         <div className="flex items-center">
  //           <input type="checkbox" id="medicalHistory.hasMedicalConditions" checked={formData.personalInfo.medicalHistory.hasMedicalConditions} onChange={e => handlePersonalInfoNestedChange(['medicalHistory', 'hasMedicalConditions'], e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
  //           <label htmlFor="medicalHistory.hasMedicalConditions" className="ml-2 block text-sm text-gray-900">I have medical conditions</label>
  //         </div>
  //         {formData.personalInfo.medicalHistory.hasMedicalConditions && (
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700">Details</label>
  //             <textarea value={formData.personalInfo.medicalHistory.details} onChange={e => handlePersonalInfoNestedChange(['medicalHistory', 'details'], e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Please provide details about your medical conditions..." />
  //           </div>
  //         )}
  //       </div>
  //     </section>
  //   </div>
  // );

  const renderPersonalDetailsStepExpanded = () => (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
        <p className="text-gray-600 mt-2">All details required for your immigration process</p>
      </div>

      {/* Basic Information */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input type="text" value={formData.personalInfo.firstName} onChange={e => handlePersonalInfoChange('firstName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input type="text" value={formData.personalInfo.lastName} onChange={e => handlePersonalInfoChange('lastName', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={formData.personalInfo.email} onChange={e => handlePersonalInfoChange('email', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input type="password" value={formData.personalInfo.password} onChange={e => handlePersonalInfoChange('password', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
            <input type="password" value={formData.personalInfo.confirmPassword} onChange={e => handlePersonalInfoChange('confirmPassword', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div> */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input type="tel" value={formData.personalInfo.phone} onChange={e => handlePersonalInfoChange('phone', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
            <input type="text" value={formData.personalInfo.nationality} onChange={e => handlePersonalInfoChange('nationality', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input type="date" value={formData.personalInfo.dateOfBirth} onChange={e => handlePersonalInfoChange('dateOfBirth', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Address & Place of Birth */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            <input type="text" value={formData.personalInfo.address.street} onChange={e => handlePersonalInfoNestedChange(['address', 'street'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input type="text" value={formData.personalInfo.address.city} onChange={e => handlePersonalInfoNestedChange(['address', 'city'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input type="text" value={formData.personalInfo.address.state} onChange={e => handlePersonalInfoNestedChange(['address', 'state'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
            <input type="text" value={formData.personalInfo.address.zipCode} onChange={e => handlePersonalInfoNestedChange(['address', 'zipCode'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input type="text" value={formData.personalInfo.address.country} onChange={e => handlePersonalInfoNestedChange(['address', 'country'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <h4 className="mt-6 font-medium text-gray-900 mb-2">Place of Birth</h4>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input type="text" value={formData.personalInfo.placeOfBirth.city} onChange={e => handlePersonalInfoNestedChange(['placeOfBirth', 'city'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input type="text" value={formData.personalInfo.placeOfBirth.state} onChange={e => handlePersonalInfoNestedChange(['placeOfBirth', 'state'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input type="text" value={formData.personalInfo.placeOfBirth.country} onChange={e => handlePersonalInfoNestedChange(['placeOfBirth', 'country'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Personal Details */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select value={formData.personalInfo.gender} onChange={e => handlePersonalInfoChange('gender', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
            <select value={formData.personalInfo.maritalStatus} onChange={e => handlePersonalInfoChange('maritalStatus', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
              <option value="">Select Marital Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
              <option value="civil_union">Civil Union</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Immigration Purpose</label>
          <select value={formData.personalInfo.immigrationPurpose} onChange={e => handlePersonalInfoChange('immigrationPurpose', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
            <option value="">Select Immigration Purpose</option>
            <option value="family_reunification">Family Reunification</option>
            <option value="employment">Employment</option>
            <option value="education">Education</option>
            <option value="asylum">Asylum</option>
            <option value="investment">Investment</option>
            <option value="diversity_lottery">Diversity Lottery</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio/Additional Information</label>
          <textarea rows={4} value={formData.personalInfo.bio} onChange={e => handlePersonalInfoChange('bio', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Tell us about yourself, your background, or any additional information..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Case Description</label>
          <textarea rows={3} value={formData.personalInfo.caseDescription} onChange={e => handlePersonalInfoChange('caseDescription', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Describe your immigration case, goals, and any specific details about your situation..." />
        </div>
      </section>

      {/* Identification */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identification</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
            <input type="text" value={formData.personalInfo.passportNumber} onChange={e => handlePersonalInfoChange('passportNumber', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">A-Number (Alien Registration)</label>
            <input type="text" value={formData.personalInfo.alienRegistrationNumber} onChange={e => handlePersonalInfoChange('alienRegistrationNumber', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number</label>
            <input type="text" value={formData.personalInfo.nationalIdNumber} onChange={e => handlePersonalInfoChange('nationalIdNumber', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Spouse */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spouse Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spouse First Name</label>
            <input type="text" value={formData.personalInfo.spouse.firstName} onChange={e => handlePersonalInfoNestedChange(['spouse', 'firstName'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Last Name</label>
            <input type="text" value={formData.personalInfo.spouse.lastName} onChange={e => handlePersonalInfoNestedChange(['spouse', 'lastName'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Date of Birth</label>
            <input type="date" value={formData.personalInfo.spouse.dateOfBirth} onChange={e => handlePersonalInfoNestedChange(['spouse', 'dateOfBirth'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Nationality</label>
            <input type="text" value={formData.personalInfo.spouse.nationality} onChange={e => handlePersonalInfoNestedChange(['spouse', 'nationality'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spouse A-Number</label>
            <input type="text" value={formData.personalInfo.spouse.alienRegistrationNumber} onChange={e => handlePersonalInfoNestedChange(['spouse', 'alienRegistrationNumber'], e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Children */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">Children Information
          <button type="button" onClick={handleAddChild} className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 flex items-center ml-4">Add Child</button>
        </h3>
        {formData.personalInfo.children.length === 0 && <div className="text-gray-500">No children added.</div>}
        {formData.personalInfo.children.map((child, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-800">Child {index + 1}</h4>
              <button type="button" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveChild(index)}>Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input type="text" value={child.firstName} onChange={e => handleUpdateChild(index, 'firstName', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input type="text" value={child.lastName} onChange={e => handleUpdateChild(index, 'lastName', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" value={child.dateOfBirth} onChange={e => handleUpdateChild(index, 'dateOfBirth', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nationality</label>
                <input type="text" value={child.nationality} onChange={e => handleUpdateChild(index, 'nationality', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">A-Number</label>
                <input type="text" value={child.alienRegistrationNumber} onChange={e => handleUpdateChild(index, 'alienRegistrationNumber', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Employment */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Current Employer Name</label>
            <input type="text" value={formData.personalInfo.employment.currentEmployer.name} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'name'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input type="text" value={formData.personalInfo.employment.jobTitle} onChange={e => handlePersonalInfoNestedChange(['employment', 'jobTitle'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Employment Start Date</label>
            <input type="date" value={formData.personalInfo.employment.employmentStartDate} onChange={e => handlePersonalInfoNestedChange(['employment', 'employmentStartDate'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Annual Income ($)</label>
            <input type="number" value={formData.personalInfo.employment.annualIncome || ''} onChange={e => handlePersonalInfoNestedChange(['employment', 'annualIncome'], Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Employer Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input type="text" value={formData.personalInfo.employment.currentEmployer.address.street} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'street'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" value={formData.personalInfo.employment.currentEmployer.address.city} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'city'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input type="text" value={formData.personalInfo.employment.currentEmployer.address.state} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'state'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input type="text" value={formData.personalInfo.employment.currentEmployer.address.zipCode} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'zipCode'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input type="text" value={formData.personalInfo.employment.currentEmployer.address.country} onChange={e => handlePersonalInfoNestedChange(['employment', 'currentEmployer', 'address', 'country'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Education Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Highest Education Level</label>
            <select value={formData.personalInfo.education.highestLevel} onChange={e => handlePersonalInfoNestedChange(['education', 'highestLevel'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Education Level</option>
              <option value="high_school">High School</option>
              <option value="associate">Associate Degree</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="doctorate">Doctorate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Institution Name</label>
            <input type="text" value={formData.personalInfo.education.institutionName} onChange={e => handlePersonalInfoNestedChange(['education', 'institutionName'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" value={formData.personalInfo.education.datesAttended.startDate} onChange={e => handlePersonalInfoNestedChange(['education', 'datesAttended', 'startDate'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" value={formData.personalInfo.education.datesAttended.endDate} onChange={e => handlePersonalInfoNestedChange(['education', 'datesAttended', 'endDate'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Field of Study</label>
            <input type="text" value={formData.personalInfo.education.fieldOfStudy} onChange={e => handlePersonalInfoNestedChange(['education', 'fieldOfStudy'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Travel History */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">Travel History
          <button type="button" onClick={handleAddTravelHistory} className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 flex items-center ml-4">Add Travel</button>
        </h3>
        {formData.personalInfo.travelHistory.length === 0 && <div className="text-gray-500">No travel records added.</div>}
        {formData.personalInfo.travelHistory.map((travel, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-800">Travel Record {index + 1}</h4>
              <button type="button" className="text-red-600 hover:text-red-700" onClick={() => handleRemoveTravelHistory(index)}>Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input type="text" value={travel.country} onChange={e => handleUpdateTravelHistory(index, 'country', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visit Date</label>
                <input type="date" value={travel.visitDate} onChange={e => handleUpdateTravelHistory(index, 'visitDate', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <select value={travel.purpose} onChange={e => handleUpdateTravelHistory(index, 'purpose', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select Purpose</option>
                  <option value="tourism">Tourism</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
                <input type="number" value={travel.duration} onChange={e => handleUpdateTravelHistory(index, 'duration', Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Financial Information */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Annual Income ($)</label>
            <input type="number" value={formData.personalInfo.financialInfo.annualIncome || ''} onChange={e => handlePersonalInfoNestedChange(['financialInfo', 'annualIncome'], Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source of Funds</label>
            <select value={formData.personalInfo.financialInfo.sourceOfFunds} onChange={e => handlePersonalInfoNestedChange(['financialInfo', 'sourceOfFunds'], e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Source</option>
              <option value="employment">Employment</option>
              <option value="investment">Investment</option>
              <option value="family">Family</option>
              <option value="savings">Savings</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Account Balance ($)</label>
            <input type="number" value={formData.personalInfo.financialInfo.bankAccountBalance || ''} onChange={e => handlePersonalInfoNestedChange(['financialInfo', 'bankAccountBalance'], Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Criminal History */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Criminal History</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="criminalHistory.hasCriminalRecord" checked={formData.personalInfo.criminalHistory.hasCriminalRecord} onChange={e => handlePersonalInfoNestedChange(['criminalHistory', 'hasCriminalRecord'], e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
            <label htmlFor="criminalHistory.hasCriminalRecord" className="ml-2 block text-sm text-gray-900">I have a criminal record</label>
          </div>
          {formData.personalInfo.criminalHistory.hasCriminalRecord && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Details</label>
              <textarea value={formData.personalInfo.criminalHistory.details} onChange={e => handlePersonalInfoNestedChange(['criminalHistory', 'details'], e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Please provide details about your criminal history..." />
            </div>
          )}
        </div>
      </section>

      {/* Medical History */}
      <section className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="medicalHistory.hasMedicalConditions" checked={formData.personalInfo.medicalHistory.hasMedicalConditions} onChange={e => handlePersonalInfoNestedChange(['medicalHistory', 'hasMedicalConditions'], e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
            <label htmlFor="medicalHistory.hasMedicalConditions" className="ml-2 block text-sm text-gray-900">I have medical conditions</label>
          </div>
          {formData.personalInfo.medicalHistory.hasMedicalConditions && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Details</label>
              <textarea value={formData.personalInfo.medicalHistory.details} onChange={e => handlePersonalInfoNestedChange(['medicalHistory', 'details'], e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Please provide details about your medical conditions..." />
            </div>
          )}
        </div>
      </section>

      {/* --- NAVIGATION BUTTONS --- */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious} // Assumes handlePrevious() exists
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 hover:shadow-md"
          disabled={isSaving} // Disable if saving
        >
          {/* <ArrowLeft className="h-5 w-5" /> You may need to import this icon */}
          <span>Previous</span>
        </button>
        
        <button
          onClick={handleSaveAndNext} // Use our new handler
          disabled={isSaving} // Disable button while saving
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : isDirty ? (
            <span>Update and Next</span>
          ) : (
            <span>Next Step</span>
          )}
          {/* <ChevronRight className="h-5 w-5" /> You may need to import this icon */}
        </button>
      </div>
      {/* --- END NAVIGATION BUTTONS --- */}

    </div>
  );

  const renderFormDetailsStep = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-purple-900 mb-3 flex items-center">
          <FileText className="w-6 h-6 mr-3" />
          Complete Workflow Details Summary
        </h3>
        <p className="text-purple-700 text-lg">All collected information at a glance</p>
      </div>

      {/* Client Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Client Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Full Name:</span>
            <span className="ml-2 text-gray-900">{formData.personalInfo.firstName} {formData.personalInfo.lastName}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-600">{formData.personalInfo.email || 'Not provided'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone:</span>
            <span className="ml-2 text-gray-600">{formData.personalInfo.phone || 'Not provided'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Date of Birth:</span>
            <span className="ml-2 text-gray-600">
              {formData.personalInfo.dateOfBirth ? new Date(formData.personalInfo.dateOfBirth).toLocaleDateString() : 'Not provided'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Nationality:</span>
            <span className="ml-2 text-gray-600">{formData.personalInfo.nationality || 'Not provided'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">A-Number:</span>
            <span className="ml-2 text-gray-600">{formData.personalInfo.alienRegistrationNumber || 'Not provided'}</span>
          </div>
        </div>
        
        {/* Address Information */}
        {formData.personalInfo.address && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h5 className="font-medium text-gray-700 mb-3">Address Information:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {formData.personalInfo.address.street && (
                <div>
                  <span className="font-medium text-gray-700">Street:</span>
                  <span className="ml-2 text-gray-600">{formData.personalInfo.address.street}</span>
                </div>
              )}
              {formData.personalInfo.address.city && (
                <div>
                  <span className="font-medium text-gray-700">City:</span>
                  <span className="ml-2 text-gray-600">{formData.personalInfo.address.city}</span>
                </div>
              )}
              {formData.personalInfo.address.state && (
                <div>
                  <span className="font-medium text-gray-700">State:</span>
                  <span className="ml-2 text-gray-600">{formData.personalInfo.address.state}</span>
                </div>
              )}
              {formData.personalInfo.address.zipCode && (
                <div>
                  <span className="font-medium text-gray-700">ZIP Code:</span>
                  <span className="ml-2 text-gray-600">{formData.personalInfo.address.zipCode}</span>
                </div>
              )}
              {formData.personalInfo.address.country && (
                <div>
                  <span className="font-medium text-gray-700">Country:</span>
                  <span className="ml-2 text-gray-600">{formData.personalInfo.address.country}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Case Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" />
          Case Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Case Title:</span>
            <span className="ml-2 text-gray-900">{caseData.title || 'Not set'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Category:</span>
            <span className="ml-2 text-gray-600">{caseData.category || selectedCategory?.title || 'Not set'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Subcategory:</span>
            <span className="ml-2 text-gray-600">{caseData.subcategory || selectedSubcategory?.title || 'Not set'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              caseData.status === 'Active' ? 'bg-green-100 text-green-800' :
              caseData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {caseData.status}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Priority:</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              caseData.priority === 'High' ? 'bg-red-100 text-red-800' :
              caseData.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {caseData.priority}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Due Date:</span>
            <span className="ml-2 text-gray-600">
              {caseData.dueDate ? new Date(caseData.dueDate).toLocaleDateString() : 'Not set'}
            </span>
          </div>
        </div>
        
        {caseData.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h5 className="font-medium text-gray-700 mb-2">Description:</h5>
            <p className="text-sm text-gray-600">{caseData.description}</p>
          </div>
        )}
      </div>

      {/* Selected Forms and Case IDs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Selected Forms & Case IDs
        </h4>
        <div className="space-y-3">
          {selectedForms.map(form => (
            <div key={form} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-blue-500 mr-3" />
                <span className="font-medium text-gray-900">{form}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Case ID: </span>
                <span className="font-mono text-blue-600">{formCaseIds[form] || 'Not generated'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Previous</span>
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center space-x-2"
        >
          <span>Continue to Auto-fill Forms</span>
          <ArrowRight className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderAutoFillStep = () => (
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

        {/* Auto-Generate Forms Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Auto-Generate Forms</h4>
          <p className="text-gray-600 mb-4">
            Use the advanced auto-generation feature to create forms with all collected data.
          </p>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleAutoGenerateForms}
              disabled={generatingForms || selectedForms.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generatingForms ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Auto-Generating Forms...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Auto Generate Forms
                </>
              )}
            </Button>
          </div>

          {/* Generated Forms Display */}
          {generatedForms.length > 0 && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Generated Forms</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedForms.map((form) => (
                  <div key={form.formName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="font-medium text-gray-900">{form.formName}</span>
                      </div>
                      <div className="flex items-center">
                        {form.status === 'generating' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                        {form.status === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {form.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    {form.status === 'generating' && (
                      <div className="text-sm text-blue-600">Generating...</div>
                    )}

                    {form.status === 'success' && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">{form.fileName}</div>
                        
                        {/* Enhanced Percentage Display */}
                        {form.filledPercentage !== undefined && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Initial Fill:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${form.filledPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(form.filledPercentage)}%
                            </span>
                          </div>
                        )}

                        {/* Unfilled Fields Toggle */}
                        {form.unfilledFields && Object.keys(form.unfilledFields).length > 0 && (
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleToggleUnfilledFields(form.formName)}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {showUnfilledFields[form.formName] ? 'Hide' : 'Show'} Unfilled Fields ({Object.keys(form.unfilledFields).length})
                            </Button>
                            
                            {showUnfilledFields[form.formName] && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <h6 className="text-sm font-medium text-yellow-800 mb-2">Unfilled Fields:</h6>
                                <div className="space-y-1">
                                  {Object.entries(form.unfilledFields).map(([fieldName, fieldValue]) => (
                                    <div key={fieldName} className="text-xs text-yellow-700">
                                      <span className="font-medium">{fieldName}:</span> {fieldValue || 'Empty'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            onClick={() => handleDownloadForm(form.formName)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            onClick={() => handlePreviewForm(form.formName)}
                            size="sm"
                            variant="outline"
                            disabled={loadingPreview[form.formName]}
                          >
                            {loadingPreview[form.formName] ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 mr-1" />
                            )}
                            {loadingPreview[form.formName] ? 'Loading...' : 'Preview'}
                          </Button>
                          <Button
                            onClick={() => handleEditForm(form.formName)}
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}

                    {form.status === 'error' && (
                      <div className="text-sm text-red-600">
                        Error: {form.error || 'Unknown error'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Preview Modal */}
          {Object.entries(showPreview).map(([formName, isVisible]) => {
            if (!isVisible) return null;
            const form = generatedForms.find(f => f.formName === formName);
            if (!form || form.status !== 'success') return null;

            return (
              <div key={formName} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-4 max-w-4xl w-full h-5/6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Preview: {formName}</h3>
                    <Button
                      onClick={() => handleClosePreview(formName)}
                      variant="outline"
                      size="sm"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="flex-1">
                    {form.blob ? (
                      <iframe
                        src={URL.createObjectURL(form.blob)}
                        className="w-full h-full border-0"
                        title={`Preview of ${formName}`}
                        onError={() => {
                          console.error('PDF preview failed to load');
                          toast.error('Failed to load PDF preview');
                        }}
                      />
                    ) : loadingPreview[formName] ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                          <p className="text-gray-600">Loading PDF preview...</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Fetching fresh data from backend
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                          <p className="text-gray-600">No PDF data available</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Try refreshing the preview or regenerating the form
                          </p>
                          <Button
                            onClick={() => handlePreviewForm(formName)}
                            size="sm"
                            className="mt-4"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Retry Preview
                          </Button>
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
            const form = generatedForms.find(f => f.formName === formName);
            if (!form || form.status !== 'success') return null;

            return (
              <PdfEditor
                key={formName}
                pdfUrl={form.downloadUrl}
                filename={form.fileName}
                onClose={() => handleCloseEditor(formName)}
                onSave={(editedPdfBlob) => handleSaveEditedPdf(formName, editedPdfBlob)}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalDetailsStepExpanded();
      case 1:
        return renderFormSelectionStep();
      case 2:
        return renderFormDetailsStep();
      case 3:
        return renderAutoFillStep();
      default:
        return null;
    }
  };

  // Show questionnaire first, then form steps
  if (showQuestionnaire) {
    return renderQuestionnaire();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matching LegalFirmWorkflow style */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-center h-16">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">
                Individual Immigration Process
              </h1>
              <p className="text-sm text-gray-500">
                Personal immigration application and form filing
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps - Enhanced styling */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${index <= currentStep
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-500'
                  }`}>
                  {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                <span className={`ml-3 text-sm font-medium transition-colors duration-300 ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 transition-colors duration-300 ${index < currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content - Enhanced card styling */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualImmigrationProcess;



