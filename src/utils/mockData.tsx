import { 
  AlertCircle, 
  FilePlus, 
  FileText, 
  MessageSquare, 
  Clock,
  CheckCircle
} from 'lucide-react';

// Mock Users
export const mockUsers = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@caseflo.io',
    role: 'admin',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    id: 'attorney-1',
    name: 'Jennifer Lee',
    email: 'attorney@caseflo.io',
    role: 'attorney',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    id: 'paralegal-1',
    name: 'Michael Chen',
    email: 'paralegal@caseflo.io',
    role: 'paralegal',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
  },
  {
    id: 'client-1',
    name: 'Maria Garcia',
    email: 'client@example.com',
    role: 'client',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
  }
];

// Mock Clients
export const mockClients = [
  {
    _id: 'client-1',
    id: 'client-1',
    name: 'Maria Garcia',
    email: 'client@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    dateOfBirth: '1985-06-12',
    nationality: 'Mexico',
    alienNumber: 'A123456789',
    status: 'Active',
    createdAt: '2023-01-15',
    userId: 'client-1'
  },
  {
    _id: 'client-2',
    id: 'client-2',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    dateOfBirth: '1990-03-22',
    nationality: 'Canada',
    alienNumber: 'A987654321',
    status: 'Active',
    createdAt: '2023-02-10'
  },
  {
    _id: 'client-3',
    id: 'client-3',
    name: 'Wei Zhang',
    email: 'wei.zhang@example.com',
    phone: '(555) 555-1212',
    address: '789 Pine St, San Francisco, CA 94111',
    dateOfBirth: '1982-11-30',
    nationality: 'China',
    alienNumber: 'A567891234',
    status: 'Active',
    createdAt: '2023-03-05'
  },
  {
    _id: 'client-4',
    id: 'client-4',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '(555) 333-4444',
    address: '101 Maple Dr, Chicago, IL 60601',
    dateOfBirth: '1995-08-17',
    nationality: 'India',
    alienNumber: 'A234567891',
    status: 'Active',
    createdAt: '2023-04-20'
  },
  {
    _id: 'client-5',
    id: 'client-5',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@example.com',
    phone: '(555) 777-8888',
    address: '222 Cedar Ln, Boston, MA 02108',
    dateOfBirth: '1988-01-23',
    nationality: 'Egypt',
    alienNumber: 'A891234567',
    status: 'Inactive',
    createdAt: '2023-05-12'
  }
];

// Mock Cases
export const mockCases = [
  {
    id: 'case-1',
    caseNumber: 'CF-2023-1001',
    clientId: 'client-1',
    type: 'Family-Based',
    subType: 'I-130 Petition for Alien Relative',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'attorney-1',
    openDate: '2023-01-20',
    pendingForms: 2,
    documents: [
      { id: 'doc-1', name: 'Birth Certificate', type: 'Identity Document', uploadDate: '2023-01-22', verified: true },
      { id: 'doc-2', name: 'Marriage Certificate', type: 'Supporting Document', uploadDate: '2023-01-22', verified: true },
      { id: 'doc-3', name: 'Passport Copy', type: 'Identity Document', uploadDate: '2023-01-25', verified: false }
    ],
    notes: [
      { id: 'note-1', text: 'Initial consultation completed', createdBy: 'attorney-1', createdAt: '2023-01-20' },
      { id: 'note-2', text: 'Missing birth certificate translation', createdBy: 'paralegal-1', createdAt: '2023-01-23' }
    ]
  },
  {
    id: 'case-2',
    caseNumber: 'CF-2023-1002',
    clientId: 'client-2',
    type: 'Employment-Based',
    subType: 'I-140 Immigrant Petition for Alien Worker',
    status: 'Document Collection',
    priority: 'Medium',
    assignedTo: 'attorney-1',
    openDate: '2023-02-15',
    pendingForms: 1,
    documents: [
      { id: 'doc-4', name: 'Resume', type: 'Supporting Document', uploadDate: '2023-02-16', verified: true },
      { id: 'doc-5', name: 'Degree Certificate', type: 'Education Document', uploadDate: '2023-02-18', verified: true }
    ],
    notes: [
      { id: 'note-3', text: 'Employer letter requested', createdBy: 'attorney-1', createdAt: '2023-02-15' }
    ]
  },
  {
    id: 'case-3',
    caseNumber: 'CF-2023-1003',
    clientId: 'client-3',
    type: 'Naturalization',
    subType: 'N-400 Application for Naturalization',
    status: 'Waiting on USCIS',
    priority: 'Medium',
    assignedTo: 'paralegal-1',
    openDate: '2023-03-10',
    pendingForms: 0,
    documents: [
      { id: 'doc-6', name: 'Green Card Copy', type: 'Identity Document', uploadDate: '2023-03-11', verified: true },
      { id: 'doc-7', name: 'Tax Returns (5 years)', type: 'Financial Document', uploadDate: '2023-03-12', verified: true }
    ],
    notes: [
      { id: 'note-4', text: 'Biometrics appointment scheduled for April 15', createdBy: 'paralegal-1', createdAt: '2023-03-20' }
    ]
  },
  {
    id: 'case-4',
    caseNumber: 'CF-2023-1004',
    clientId: 'client-4',
    type: 'Family-Based',
    subType: 'I-485 Adjustment of Status',
    status: 'RFE Received',
    priority: 'High',
    assignedTo: 'attorney-1',
    openDate: '2023-04-25',
    pendingForms: 3,
    documents: [
      { id: 'doc-8', name: 'I-94 Record', type: 'Immigration Document', uploadDate: '2023-04-26', verified: true }
    ],
    notes: [
      { id: 'note-5', text: 'RFE received requesting additional financial evidence', createdBy: 'attorney-1', createdAt: '2023-05-30' }
    ]
  },
  {
    id: 'case-5',
    caseNumber: 'CF-2023-1005',
    clientId: 'client-5',
    type: 'Humanitarian',
    subType: 'I-589 Application for Asylum',
    status: 'Approved',
    priority: 'High',
    assignedTo: 'attorney-1',
    openDate: '2023-01-05',
    closeDate: '2023-06-20',
    pendingForms: 0,
    documents: [
      { id: 'doc-9', name: 'Personal Statement', type: 'Supporting Document', uploadDate: '2023-01-06', verified: true },
      { id: 'doc-10', name: 'Country Conditions Reports', type: 'Supporting Document', uploadDate: '2023-01-08', verified: true }
    ],
    notes: [
      { id: 'note-6', text: 'Asylum granted on June 20, 2023', createdBy: 'attorney-1', createdAt: '2023-06-20' }
    ]
  },
  {
    id: 'case-6',
    caseNumber: 'CF-2023-1006',
    clientId: 'client-1',
    type: 'Employment-Based',
    subType: 'I-765 Application for Employment Authorization',
    status: 'In Progress',
    priority: 'Medium',
    assignedTo: 'paralegal-1',
    openDate: '2023-05-15',
    pendingForms: 1,
    documents: [
      { id: 'doc-11', name: 'Passport Photos', type: 'Identity Document', uploadDate: '2023-05-16', verified: true }
    ],
    notes: []
  }
];

// Mock Tasks
export const mockTasks = [
  {
    id: 'task-1',
    caseId: 'case-1',
    title: 'Submit I-130 Form',
    description: 'Complete and submit I-130 Petition for Alien Relative',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'attorney-1',
    createdAt: '2023-01-20',
    dueDate: '2025-07-10'
  },
  {
    id: 'task-2',
    caseId: 'case-1',
    title: 'Translate Birth Certificate',
    description: 'Get certified translation of birth certificate',
    status: 'Pending',
    priority: 'Medium',
    assignedTo: 'client-1',
    createdAt: '2023-01-23',
    dueDate: '2025-07-05'
  },
  {
    id: 'task-3',
    caseId: 'case-2',
    title: 'Obtain Employment Letter',
    description: 'Request letter from employer confirming position and salary',
    status: 'Pending',
    priority: 'High',
    assignedTo: 'client-2',
    createdAt: '2023-02-15',
    dueDate: '2025-07-06'
  },
  {
    id: 'task-4',
    caseId: 'case-3',
    title: 'Prepare for Citizenship Interview',
    description: 'Schedule mock interview and review civics questions',
    status: 'Pending',
    priority: 'Medium',
    assignedTo: 'paralegal-1',
    createdAt: '2023-03-25',
    dueDate: '2025-07-20'
  },
  {
    id: 'task-5',
    caseId: 'case-4',
    title: 'Respond to RFE',
    description: 'Prepare and submit response to Request for Evidence',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'attorney-1',
    createdAt: '2023-05-30',
    dueDate: '2025-07-03'
  },
  {
    id: 'task-6',
    caseId: 'case-6',
    title: 'Biometrics Appointment',
    description: 'Attend biometrics appointment at USCIS center',
    status: 'Pending',
    priority: 'Medium',
    assignedTo: 'client-1',
    createdAt: '2023-05-20',
    dueDate: '2025-07-15'
  }
];

// Mock Forms
export const mockForms = [
  // Family-Based Immigration Forms
  {
    id: 'form-1',
    name: 'I-130, Petition for Alien Relative',
    category: 'Family-Based',
    description: 'Used to establish relationship to a qualifying relative who intends to immigrate to the United States.',
    pages: 12,
    fee: 535,
    processingTime: '7-15 months',
    commonUses: 'Family-based green card, Spouse visa',
    lastUpdated: '2023-10-01',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-2',
    name: 'I-485, Application to Register Permanent Residence',
    category: 'Family-Based',
    description: 'Used to apply for lawful permanent resident status (Green Card) while in the United States.',
    pages: 20,
    fee: 1225,
    processingTime: '8-14 months',
    commonUses: 'Green card, Adjustment of status',
    lastUpdated: '2023-09-15',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-3',
    name: 'I-751, Petition to Remove Conditions on Residence',
    category: 'Family-Based',
    description: 'Used to remove conditions on permanent resident status obtained through marriage.',
    pages: 11,
    fee: 595,
    processingTime: '12-18 months',
    commonUses: 'Remove conditional status from 2-year Green Card',
    lastUpdated: '2023-06-20',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-4',
    name: 'I-129F, Petition for Alien Fiancé(e)',
    category: 'Family-Based',
    description: 'Used to bring a foreign-citizen fiancé(e) to the United States for marriage.',
    pages: 13,
    fee: 535,
    processingTime: '8-10 months',
    commonUses: 'K-1 fiancé(e) visa',
    lastUpdated: '2023-09-05',
    icon: <FileText className="h-10 w-10" />
  },

  // Employment-Based Immigration Forms
  {
    id: 'form-5',
    name: 'I-140, Immigrant Petition for Alien Worker',
    category: 'Employment-Based',
    description: 'Used by employers to petition for eligible foreign nationals to become permanent residents based on employment.',
    pages: 9,
    fee: 700,
    processingTime: '6-8 months',
    commonUses: 'Employment-based green card',
    lastUpdated: '2023-08-15',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-6',
    name: 'I-765, Application for Employment Authorization',
    category: 'Employment-Based',
    description: 'Used to request an Employment Authorization Document (work permit).',
    pages: 7,
    fee: 410,
    processingTime: '3-5 months',
    commonUses: 'Work permit',
    lastUpdated: '2023-11-01',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-7',
    name: 'I-907, Request for Premium Processing',
    category: 'Employment-Based',
    description: 'Used to request faster processing of certain employment-based petitions and applications.',
    pages: 5,
    fee: 2500,
    processingTime: '15 calendar days',
    commonUses: 'Expedited processing of eligible employment petitions',
    lastUpdated: '2023-07-20',
    icon: <FileText className="h-10 w-10" />
  },

  // Citizenship and Naturalization Forms
  {
    id: 'form-8',
    name: 'N-400, Application for Naturalization',
    category: 'Citizenship',
    description: 'Used to apply for U.S. citizenship through naturalization.',
    pages: 20,
    fee: 725,
    processingTime: '14-18 months',
    commonUses: 'U.S. citizenship',
    lastUpdated: '2023-08-30',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-9',
    name: 'N-600, Application for Certificate of Citizenship',
    category: 'Citizenship',
    description: 'Used to obtain proof of U.S. citizenship for individuals who derived or acquired citizenship through parents.',
    pages: 15,
    fee: 1170,
    processingTime: '8-12 months',
    commonUses: 'Certificate of citizenship',
    lastUpdated: '2023-09-10',
    icon: <FileText className="h-10 w-10" />
  },

  // Humanitarian Forms
  {
    id: 'form-10',
    name: 'I-589, Application for Asylum',
    category: 'Humanitarian',
    description: 'Used to apply for asylum in the United States and for withholding of removal.',
    pages: 12,
    fee: 0,
    processingTime: '6-24 months',
    commonUses: 'Asylum, Withholding of removal',
    lastUpdated: '2023-10-15',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-11',
    name: 'I-918, Petition for U Nonimmigrant Status',
    category: 'Humanitarian',
    description: 'Used by victims of certain crimes who have suffered mental or physical abuse.',
    pages: 17,
    fee: 0,
    processingTime: '18-24 months',
    commonUses: 'U visa for crime victims',
    lastUpdated: '2023-11-05',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-12',
    name: 'I-914, Application for T Nonimmigrant Status',
    category: 'Humanitarian',
    description: 'Used by victims of human trafficking and their immediate family members.',
    pages: 19,
    fee: 0,
    processingTime: '12-18 months',
    commonUses: 'T visa for trafficking victims',
    lastUpdated: '2023-10-20',
    icon: <FileText className="h-10 w-10" />
  },

  // Travel and Status Documents
  {
    id: 'form-13',
    name: 'I-131, Application for Travel Document',
    category: 'Travel',
    description: 'Used to apply for travel documents, re-entry permits, or advance parole.',
    pages: 13,
    fee: 575,
    processingTime: '3-5 months',
    commonUses: 'Travel document, Advance parole',
    lastUpdated: '2023-10-15',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-14',
    name: 'I-90, Application to Replace Permanent Resident Card',
    category: 'Status Documents',
    description: 'Used to replace or renew a Green Card.',
    pages: 7,
    fee: 455,
    processingTime: '8-12 months',
    commonUses: 'Green card renewal or replacement',
    lastUpdated: '2023-07-12',
    icon: <FileText className="h-10 w-10" />
  },

  // Business and Investment Forms
  {
    id: 'form-15',
    name: 'I-526, Immigrant Petition by Standalone Investor',
    category: 'Business',
    description: 'Used by investors to petition for permanent residence through qualifying investments.',
    pages: 15,
    fee: 3675,
    processingTime: '24-36 months',
    commonUses: 'EB-5 investor visa',
    lastUpdated: '2023-11-15',
    icon: <FileText className="h-10 w-10" />
  },
  {
    id: 'form-16',
    name: 'I-829, Petition to Remove Conditions on Residence for Entrepreneurs',
    category: 'Business',
    description: 'Used by EB-5 investors to remove conditions on their permanent resident status.',
    pages: 11,
    fee: 3750,
    processingTime: '24-48 months',
    commonUses: 'Remove conditions on EB-5 visa',
    lastUpdated: '2023-11-20',
    icon: <FileText className="h-10 w-10" />
  }
];

// Mock Notifications
export const mockNotifications = [
  {
    id: 'notif-1',
    title: 'Deadline Approaching',
    message: 'RFE response for Maria Garcia (CF-2023-1004) is due in 3 days',
    type: 'deadline',
    icon: <Clock className="h-6 w-6" />,
    createdAt: '2023-06-30T10:30:00Z',
    read: false
  },
  {
    id: 'notif-2',
    title: 'New Document Uploaded',
    message: 'John Smith uploaded employment verification letter',
    type: 'document',
    icon: <FilePlus className="h-6 w-6" />,
    createdAt: '2023-06-29T15:45:00Z',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Case Status Updated',
    message: 'Wei Zhang (CF-2023-1003) case status changed to "Waiting on USCIS"',
    type: 'update',
    icon: <CheckCircle className="h-6 w-6" />,
    createdAt: '2023-06-28T09:15:00Z',
    read: false
  },
  {
    id: 'notif-4',
    title: 'New Comment',
    message: 'Jennifer Lee added a comment to Ahmed Hassan\'s case',
    type: 'comment',
    icon: <MessageSquare className="h-6 w-6" />,
    createdAt: '2023-06-27T14:20:00Z',
    read: true
  },
  {
    id: 'notif-5',
    title: 'RFE Received',
    message: 'USCIS issued an RFE for Priya Patel (CF-2023-1004)',
    type: 'alert',
    icon: <AlertCircle className="h-6 w-6" />,
    createdAt: '2023-06-25T11:10:00Z',
    read: true
  }
];