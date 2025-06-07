export type UserRole = 'client' | 'paralegal' | 'attorney' | 'admin';

export interface ImmigrationCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  subcategories?: string[];
  allowedRoles?: string[];
  categoryId: string;
  subcategoryId: string;
  visaType: string;
  priorityDate: string;
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
  _id?: string;
  id: string;
  caseId: string;
  categoryId: string;
  subcategoryId: string;
  visaType: string;
  clientId: string;
  priorityDate: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  currentStep: 'type' | 'documents' | 'form';
  steps: ProcessStep[];
  documents: ProcessDocument[];
  formData: Record<string, any>;
  validationResults: ValidationResult | null;
  assignedStaff?: string;
  caseNotes?: string;
  relatedCases?: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  auditLog?: AuditLogEntry[];
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requiredDocuments: string[];
  requiredForms: string[];
  formData?: Record<string, any>;
}

export interface ProcessDocument {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'uploaded' | 'validated' | 'rejected';
  url?: string;
  metadata?: Record<string, any>;
  extractedData?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
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

export interface ReviewData {
  confirmed: boolean;
  notes: string;
  specialInstructions: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'document_upload' | 'form_submit';
  userId: string;
  userName: string;
  timestamp: string;
  details: Record<string, any>;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
} 