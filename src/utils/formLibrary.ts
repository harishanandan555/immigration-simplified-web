// Comprehensive USCIS Form Library with Automatic Updates
export interface USCISForm {
  id: string;
  formNumber: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  version: string;
  effectiveDate: string;
  expirationDate?: string;
  filingFee: number;
  processingTime: string;
  uscisLink: string;
  pdfUrl: string;
  instructions: string;
  requirements: string[];
  commonErrors: string[];
  tips: string[];
  isActive: boolean;
  lastUpdated: string;
  nextUpdateCheck: string;
  fields: FormField[];
  dependencies: string[]; // Other forms that might be required
  alternatives: string[]; // Alternative forms for similar purposes
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio' | 'number';
  required: boolean;
  validationRules: string[];
  helpText: string;
  placeholder: string;
  options?: string[];
  defaultValue?: any;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  order: number;
}

// Comprehensive USCIS Forms Database
export const USCIS_FORMS: USCISForm[] = [
  // Family-Based Immigration Forms
  {
    id: 'i-130',
    formNumber: 'I-130',
    name: 'Petition for Alien Relative',
    description: 'Petition to establish a relationship between a U.S. citizen/permanent resident and an alien relative',
    category: 'Family-Based Immigration',
    subcategory: 'Petitions',
    version: '12/23/2022',
    effectiveDate: '2022-12-23',
    filingFee: 535,
    processingTime: '6-12 months',
    uscisLink: 'https://www.uscis.gov/i-130',
    pdfUrl: 'https://www.uscis.gov/sites/default/files/document/forms/i-130.pdf',
    instructions: 'Complete this form to petition for a family member to immigrate to the United States.',
    requirements: [
      'Must be a U.S. citizen or permanent resident',
      'Must have a qualifying family relationship',
      'Must provide evidence of the relationship',
      'Must meet income requirements for affidavit of support'
    ],
    commonErrors: [
      'Incorrect petitioner information',
      'Missing relationship evidence',
      'Incomplete beneficiary information',
      'Missing filing fee or fee waiver request'
    ],
    tips: [
      'Double-check all dates and names',
      'Include certified copies of supporting documents',
      'Use the correct filing address based on your location',
      'Consider filing I-485 concurrently if beneficiary is in the U.S.'
    ],
    isActive: true,
    lastUpdated: '2024-01-15',
    nextUpdateCheck: '2024-04-15',
    fields: [
      {
        id: 'petitioner_name',
        name: 'petitionerName',
        label: 'Petitioner Name',
        type: 'text',
        required: true,
        validationRules: ['required', 'min_length_2'],
        helpText: 'Enter your full legal name as it appears on your birth certificate or naturalization certificate',
        placeholder: 'Enter your full name',
        order: 1
      },
      {
        id: 'beneficiary_name',
        name: 'beneficiaryName',
        label: 'Beneficiary Name',
        type: 'text',
        required: true,
        validationRules: ['required', 'min_length_2'],
        helpText: 'Enter the full legal name of the person you are petitioning for',
        placeholder: 'Enter beneficiary full name',
        order: 2
      },
      {
        id: 'relationship',
        name: 'relationship',
        label: 'Relationship to Petitioner',
        type: 'select',
        required: true,
        validationRules: ['required'],
        helpText: 'Select the type of family relationship',
        placeholder: 'Select relationship',
        options: [
          'Spouse',
          'Parent',
          'Child (under 21)',
          'Child (21 or older)',
          'Sibling',
          'Fiancé(e)'
        ],
        order: 3
      }
    ],
    dependencies: ['i-864', 'i-693'],
    alternatives: ['i-129f']
  },
  {
    id: 'i-485',
    formNumber: 'I-485',
    name: 'Application to Register Permanent Residence or Adjust Status',
    description: 'Application for adjustment of status to permanent resident',
    category: 'Adjustment of Status',
    subcategory: 'Applications',
    version: '12/23/2022',
    effectiveDate: '2022-12-23',
    filingFee: 1225,
    processingTime: '8-14 months',
    uscisLink: 'https://www.uscis.gov/i-485',
    pdfUrl: 'https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf',
    instructions: 'Complete this form to apply for a green card while in the United States.',
    requirements: [
      'Must have an approved immigrant petition',
      'Must be physically present in the U.S.',
      'Must be eligible for adjustment of status',
      'Must not have any bars to adjustment'
    ],
    commonErrors: [
      'Missing approved petition',
      'Incorrect eligibility category',
      'Missing medical examination',
      'Incomplete employment authorization request'
    ],
    tips: [
      'File I-765 and I-131 together with I-485',
      'Include medical examination results',
      'Provide all required supporting documents',
      'Pay attention to filing deadlines'
    ],
    isActive: true,
    lastUpdated: '2024-01-15',
    nextUpdateCheck: '2024-04-15',
    fields: [
      {
        id: 'applicant_name',
        name: 'applicantName',
        label: 'Applicant Name',
        type: 'text',
        required: true,
        validationRules: ['required', 'min_length_2'],
        helpText: 'Enter your full legal name',
        placeholder: 'Enter your full name',
        order: 1
      },
      {
        id: 'alien_number',
        name: 'alienNumber',
        label: 'Alien Registration Number (A-Number)',
        type: 'text',
        required: false,
        validationRules: ['alien_number_format'],
        helpText: 'Enter your A-Number if you have one (format: A123456789)',
        placeholder: 'A123456789',
        order: 2
      },
      {
        id: 'current_status',
        name: 'currentStatus',
        label: 'Current Immigration Status',
        type: 'select',
        required: true,
        validationRules: ['required'],
        helpText: 'Select your current immigration status',
        placeholder: 'Select status',
        options: [
          'B-1/B-2 Visitor',
          'F-1 Student',
          'H-1B Worker',
          'L-1 Intracompany Transfer',
          'Other'
        ],
        order: 3
      }
    ],
    dependencies: ['i-693', 'i-864'],
    alternatives: []
  },
  {
    id: 'n-400',
    formNumber: 'N-400',
    name: 'Application for Naturalization',
    description: 'Application for U.S. citizenship through naturalization',
    category: 'Naturalization',
    subcategory: 'Applications',
    version: '12/23/2022',
    effectiveDate: '2022-12-23',
    filingFee: 640,
    processingTime: '8-12 months',
    uscisLink: 'https://www.uscis.gov/n-400',
    pdfUrl: 'https://www.uscis.gov/sites/default/files/document/forms/n-400.pdf',
    instructions: 'Complete this form to apply for U.S. citizenship.',
    requirements: [
      'Must be at least 18 years old',
      'Must be a permanent resident for at least 5 years (or 3 years if married to U.S. citizen)',
      'Must have continuous residence and physical presence',
      'Must be of good moral character',
      'Must pass English and civics tests'
    ],
    commonErrors: [
      'Insufficient residence time',
      'Missing tax returns',
      'Incomplete travel history',
      'Missing evidence of good moral character'
    ],
    tips: [
      'Gather all tax returns for the past 5 years',
      'Document all international travel',
      'Prepare for English and civics tests',
      'Include evidence of good moral character'
    ],
    isActive: true,
    lastUpdated: '2024-01-15',
    nextUpdateCheck: '2024-04-15',
    fields: [
      {
        id: 'applicant_name',
        name: 'applicantName',
        label: 'Applicant Name',
        type: 'text',
        required: true,
        validationRules: ['required', 'min_length_2'],
        helpText: 'Enter your full legal name as it appears on your green card',
        placeholder: 'Enter your full name',
        order: 1
      },
      {
        id: 'permanent_resident_date',
        name: 'permanentResidentDate',
        label: 'Date Became Permanent Resident',
        type: 'date',
        required: true,
        validationRules: ['required', 'date_format', 'past_date'],
        helpText: 'Enter the date you first became a permanent resident',
        placeholder: 'MM/DD/YYYY',
        order: 2
      },
      {
        id: 'marital_status',
        name: 'maritalStatus',
        label: 'Marital Status',
        type: 'select',
        required: true,
        validationRules: ['required'],
        helpText: 'Select your current marital status',
        placeholder: 'Select status',
        options: [
          'Single',
          'Married',
          'Divorced',
          'Widowed',
          'Legally Separated'
        ],
        order: 3
      }
    ],
    dependencies: [],
    alternatives: ['n-600']
  }
];

// Form Library Management System
export class FormLibraryManager {
  private forms: Map<string, USCISForm> = new Map();
  private updateInterval: number = 24 * 60 * 60 * 1000; // 24 hours
  private lastUpdateCheck: Date = new Date();

  constructor() {
    this.initializeForms();
  }

  private initializeForms() {
    USCIS_FORMS.forEach(form => {
      this.forms.set(form.id, form);
    });
  }

  // Get all forms
  getAllForms(): USCISForm[] {
    return Array.from(this.forms.values());
  }

  // Get form by ID
  getFormById(id: string): USCISForm | undefined {
    return this.forms.get(id);
  }

  // Get forms by category
  getFormsByCategory(category: string): USCISForm[] {
    return Array.from(this.forms.values()).filter(form => form.category === category);
  }

  // Get forms by form number
  getFormByNumber(formNumber: string): USCISForm | undefined {
    return Array.from(this.forms.values()).find(form => form.formNumber === formNumber);
  }

  // Search forms
  searchForms(query: string): USCISForm[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.forms.values()).filter(form => 
      form.name.toLowerCase().includes(lowerQuery) ||
      form.description.toLowerCase().includes(lowerQuery) ||
      form.formNumber.toLowerCase().includes(lowerQuery) ||
      form.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get active forms
  getActiveForms(): USCISForm[] {
    return Array.from(this.forms.values()).filter(form => form.isActive);
  }

  // Check for form updates
  async checkForUpdates(): Promise<{ updated: boolean; changes: string[] }> {
    const now = new Date();
    const changes: string[] = [];

    // Simulate checking for updates (in real implementation, this would call USCIS API)
    for (const form of this.forms.values()) {
      if (new Date(form.nextUpdateCheck) <= now) {
        // Check if form needs update
        const needsUpdate = await this.checkFormUpdate(form);
        if (needsUpdate) {
          changes.push(`Form ${form.formNumber} has been updated`);
          await this.updateForm(form.id);
        }
        
        // Update next check date
        form.nextUpdateCheck = new Date(now.getTime() + this.updateInterval).toISOString();
      }
    }

    this.lastUpdateCheck = now;
    return { updated: changes.length > 0, changes };
  }

  // Simulate checking for form updates
  private async checkFormUpdate(form: USCISForm): Promise<boolean> {
    // In real implementation, this would check USCIS website or API
    // For now, simulate 10% chance of update
    return Math.random() < 0.1;
  }

  // Update form
  private async updateForm(formId: string): Promise<void> {
    const form = this.forms.get(formId);
    if (form) {
      // In real implementation, this would fetch updated form data from USCIS
      form.lastUpdated = new Date().toISOString();
      form.version = new Date().toISOString().split('T')[0];
    }
  }

  // Get form dependencies
  getFormDependencies(formId: string): USCISForm[] {
    const form = this.forms.get(formId);
    if (!form) return [];

    return form.dependencies
      .map(depId => this.forms.get(depId))
      .filter((dep): dep is USCISForm => dep !== undefined);
  }

  // Get alternative forms
  getAlternativeForms(formId: string): USCISForm[] {
    const form = this.forms.get(formId);
    if (!form) return [];

    return form.alternatives
      .map(altId => this.forms.get(altId))
      .filter((alt): alt is USCISForm => alt !== undefined);
  }

  // Get form categories
  getCategories(): string[] {
    const categories = new Set(Array.from(this.forms.values()).map(form => form.category));
    return Array.from(categories).sort();
  }

  // Get form subcategories
  getSubcategories(category: string): string[] {
    const subcategories = new Set(
      Array.from(this.forms.values())
        .filter(form => form.category === category && form.subcategory)
        .map(form => form.subcategory!)
    );
    return Array.from(subcategories).sort();
  }

  // Get forms that need attention (expiring soon, outdated, etc.)
  getFormsNeedingAttention(): USCISForm[] {
    const now = new Date();
    return Array.from(this.forms.values()).filter(form => {
      // Check if form is expiring soon
      if (form.expirationDate && new Date(form.expirationDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        return true;
      }
      
      // Check if form needs update check
      if (new Date(form.nextUpdateCheck) <= now) {
        return true;
      }
      
      return false;
    });
  }

  // Export form data
  exportFormData(): string {
    return JSON.stringify(Array.from(this.forms.values()), null, 2);
  }

  // Import form data
  importFormData(data: string): void {
    try {
      const forms = JSON.parse(data) as USCISForm[];
      this.forms.clear();
      forms.forEach(form => {
        this.forms.set(form.id, form);
      });
    } catch (error) {
      console.error('Error importing form data:', error);
    }
  }
}

// Create singleton instance
export const formLibrary = new FormLibraryManager();

// Utility functions for form management
export const FormUtils = {
  // Get form by number
  getFormByNumber: (formNumber: string) => formLibrary.getFormByNumber(formNumber),
  
  // Search forms
  searchForms: (query: string) => formLibrary.searchForms(query),
  
  // Get forms by category
  getFormsByCategory: (category: string) => formLibrary.getFormsByCategory(category),
  
  // Get all categories
  getCategories: () => formLibrary.getCategories(),
  
  // Get subcategories
  getSubcategories: (category: string) => formLibrary.getSubcategories(category),
  
  // Check for updates
  checkForUpdates: () => formLibrary.checkForUpdates(),
  
  // Get forms needing attention
  getFormsNeedingAttention: () => formLibrary.getFormsNeedingAttention(),
  
  // Format filing fee
  formatFilingFee: (fee: number) => `$${fee.toLocaleString()}`,
  
  // Get processing time range
  getProcessingTimeRange: (processingTime: string) => {
    const match = processingTime.match(/(\d+)-(\d+)/);
    if (match) {
      return { min: parseInt(match[1]), max: parseInt(match[2]) };
    }
    return null;
  }
}; 