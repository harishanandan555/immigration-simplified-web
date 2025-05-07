export type UserRole = 'client' | 'paralegal' | 'attorney' | 'admin';

export interface ImmigrationCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  subcategories?: string[];
  allowedRoles?: string[];
}

export interface ImmigrationSubcategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  processingTime: string;
  estimatedFees: number;
  requiredDocuments: DocumentRequirement[];
  requiredForms: FormRequirement[];
  redFlags: string[];
  alternativePathways: string[];
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  validationRules: string[];
  status?: 'missing' | 'verified' | 'processing';
  uploadGuidelines: string;
}

export interface FormRequirement {
  id: string;
  formNumber: string;
  name: string;
  description: string;
  uscisLink: string;
  estimatedProcessingTime: string;
  fee: number;
}

export interface ImmigrationProcessForm {
  formNumber: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  formFields: FormField[];
  requiredDocuments: RequiredDocument[];
  version: string;
  effectiveDate: string;
  expirationDate: string;
  isActive: boolean;
}

export interface FormField {
  fieldName: string;
  label: string;
  type: string;
  required: boolean;
  validationRules: string[];
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
}

export interface CaseStrategy {
  categoryId: string;
  tips: string[];
  commonMistakes: string[];
  successFactors: string[];
}

export interface ProgressStep {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface ImmigrationProcess {
  id: string;
  categoryId: string;
  subcategoryId: string;
  visaType: string;
  clientId: string;
  caseId: string;
  priorityDate: string;
  status: string;
  currentStep: string;
  steps: ProcessStep[];
  documents: ProcessDocument[];
  formData: Record<string, any>;
  validationResults: ValidationResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessStep {
  name: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ProcessDocument {
  documentId: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: string;
  notes?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields: string[];
  suggestions: ValidationSuggestion[];
  confidence: number;
}

export interface ValidationSuggestion {
  field: string;
  suggestion: string;
} 