import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Lock,
  User,
  Building,
  Mail,
  Globe,
  CreditCard,
  Save,
  ChevronRight,
  Users,
  Shield,
  Database,
  FileText,
  Settings,
  Activity,
  Trash2,
  Edit,
  BarChart,
  Briefcase,
  Key,
  Zap,
  HardDrive,
  Copy, 
  Download, 
  Trash,
  // Test,
  // Validate,
} from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth, updateUser, deleteUser, registerAttorney, registerUser, getUserById } from '../../controllers/AuthControllers';

import {
  getProfile,
  updateProfile,

  getOrganization,
  updateOrganization,

  getNotifications,
  updateNotifications,

  getSecurity,
  updateSecurity,
  signOutAllDevices,

  getEmailSettings,
  updateEmailSettings,

  getIntegrations,
  updateIntegrations,

  getBilling,
  updateBilling,

  updateUsers,

  getCaseSettings,
  updateCaseSettings,

  getFormTemplates,
  getFormTemplateById,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  duplicateFormTemplate,
  exportFormTemplate,
  importFormTemplate,

  getReportSettings,
  updateReportSettings,
  deleteReportSettings,

  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  updatePermissions,

  getDatabaseSettings,
  updateDatabaseSettings,
  vacuumDatabase,
  analyzeDatabase,
  exportDatabaseSchema,

  getSystemSettings,
  updateSystemSettings,
  clearSystemCache,
  optimizeSystemDatabase,
  updateMaintenanceMode,
  updateSystemPerformance,
  updateSystemSecurity,
  updateSystemNotifications,
  updateSystemLogging,

  getAuditLogs,
  updateAuditLogs,
  exportAuditLogs,
  archiveAuditLogs,
  filterAuditLogs,

  getBackupSettings,
  updateBackupSettings,

  getApiSettings,
  updateApiSettings,

  getPerformanceSettings,
  updatePerformanceSettings,
  optimizePerformance,
  updatePerformanceMonitoring,
  updatePerformanceCache,
  updatePerformanceDatabase,
  updatePerformanceAlerts,
  testPerformanceSettings,
  getPerformanceMetrics,
  validatePerformanceSettings,

  createBackup,
  restoreBackup,
  deleteBackup,
  testBackupConnection,
  validateBackupSettings,
  listBackups,

  regenerateApiKey,
  testApiConnection,
  validateApiSettings,

} from '../../controllers/SettingsControllers';
import { getAllCompaniesList, getCompanyUsers, getCompanyById, Company } from '../../controllers/CompanyControllers';
import {
  getCurrentSubscription,
  updateSubscription,
  updatePaymentMethod,
  cancelSubscription,
  renewSubscription
} from '../../controllers/BillingControllers';

import CompanySelect from '../../components/settings/CompanySelect';

import {
  ROLE_TYPES,
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../../utils/constants';

interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  profilePhoto?: File;
}

interface OrganizationData {
  organizationName: string;
  legalName: string;
  taxId: string;
  website: string;
  address: string;
  logo?: File;
}

interface FormTemplatesSectionProps {
  userId: string;
  isSuperAdmin: boolean;
  isAttorney: boolean;
}

interface NotificationData {
  caseUpdates: boolean;
  documentAlerts: boolean;
  taskReminders: boolean;
}

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  lastModifiedBy: string;
  lastPasswordChange: string;
  updatedAt: string;
}

interface EmailData {
  signature: string;
  templates: {
    welcome: string;
    caseUpdate: string;
  };
}

interface IntegrationData {
  googleCalendar: boolean;
  gmail: boolean;
}

interface BillingData {
  subscription: {
    plan: 'demo' | 'basic' | 'professional' | 'enterprise';
    billingCycle: 'monthly' | 'yearly';
    amount: number;
    currency: string;
    status: 'pending' | 'active' | 'cancelled' | 'expired' | 'failed';
    startDate: Date;
    endDate: Date;
    nextBillingDate: Date;
    autoRenew: boolean;
  };
  paymentMethod: {
    type: 'credit_card' | 'bank_transfer' | 'other';
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  paymentHistory: {
    amount: number;
    currency: string;
    status: 'succeeded' | 'failed' | 'pending' | 'refunded';
    paymentDate: Date;
    transactionId: string;
    receiptUrl: string;
  }[];
}

interface SystemData {
  systemName: string;
  timeZone: string;
  dateFormat: string;
  language: string;
  maintenance: {
    lastCacheClear: string;
    lastDatabaseOptimization: string;
    maintenanceMode: boolean;
    scheduledMaintenance: {
      enabled: boolean;
      startTime: string;
      duration: number;
      message: string;
    };
  };
  performance: {
    maxUploadSize: number;
    maxConcurrentUploads: number;
    sessionTimeout: number;
    idleTimeout: number;
  };
  security: {
    loginAttempts: number;
    lockoutDuration: number;
    passwordExpiry: number;
    sessionManagement: {
      allowMultipleSessions: boolean;
      maxConcurrentSessions: number;
    };
  };
  notifications: {
    systemAlerts: boolean;
    maintenanceNotifications: boolean;
    errorNotifications: boolean;
    recipients: string[];
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number;
    format: 'json' | 'text';
    includeStackTraces: boolean;
  };
}

interface CaseSettingsData {
  categories: {
    id: string;
    name: string;
    description: string;
    color: string;
  }[];
  statuses: {
    id: string;
    name: string;
    description: string;
    color: string;
    order: number;
  }[];
  defaultSettings: {
    autoAssign: boolean;
    notifyOnStatusChange: boolean;
    requireDocumentUpload: boolean;
    defaultPriority: 'low' | 'medium' | 'high';
  };
  customFields: {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }[];
}

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'superadmin' | 'attorney' | 'paralegal' | 'client';
  active: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  companyId?: string; // Add companyId field
}

interface DisplayUserData extends UserData {
  name: string;
  status: 'active' | 'inactive';
}

interface DatabaseSettingsData {
  connection: {
    host: string;
    port: number;
    database: string;
    schema: string;
  };
  backup: {
    schedule: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    compression: boolean;
  };
  performance: {
    poolSize: number;
    queryTimeout: number;
    queryCacheEnabled: boolean;
  };
}

interface PerformanceSettingsData {
  optimization: {
    cacheDuration: number;
    queryTimeout: number;
    maxConnections: number;
    compressionLevel: 'none' | 'low' | 'medium' | 'high';
    debugMode: boolean;
    maxUploadSize: number;
    maxConcurrentUploads: number;
    sessionTimeout: number;
    idleTimeout: number;
    queryCacheEnabled: boolean;
    poolSize: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    retentionPeriod: number;
    alertThresholds: {
      cpu: number;
      memory: number;
      storage: number;
      responseTime: number;
      errorRate: number;
      requestCount: number;
      concurrentUsers: number;
      databaseConnections: number;
    };
  };
  alerts: {
    email: boolean;
    slack: boolean;
    webhook: string;
    recipients: string[];
    notificationChannels: {
      email: boolean;
      slack: boolean;
      webhook: boolean;
      sms: boolean;
    };
    alertLevels: {
      critical: boolean;
      warning: boolean;
      info: boolean;
    };
  };
  caching: {
    enabled: boolean;
    type: 'memory' | 'redis' | 'file';
    ttl: number;
    maxSize: number;
    compression: boolean;
  };
  database: {
    connectionPool: {
      min: number;
      max: number;
      idleTimeout: number;
    };
    queryOptimization: {
      enabled: boolean;
      maxExecutionTime: number;
      slowQueryThreshold: number;
    };
    indexing: {
      autoIndex: boolean;
      backgroundIndexing: boolean;
    };
  };
}

interface ApiSettingsData {
  keys: {
    production: {
      key: string;
      lastUsed: string;
      createdAt: string;
      expiresAt: string;
    };
    development: {
      key: string;
      lastUsed: string;
      createdAt: string;
      expiresAt: string;
    };
  };
  rateLimiting: {
    requestsPerMinute: number;
    burstLimit: number;
    windowSize: number;
    enabled: boolean;
  };
  cors: {
    allowedOrigins: string[];
    allowCredentials: boolean;
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
  };
  security: {
    requireApiKey: boolean;
    ipWhitelist: string[];
    allowedMethods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
    requireHttps: boolean;
    jwtEnabled: boolean;
    jwtExpiry: number;
    refreshTokenEnabled: boolean;
    refreshTokenExpiry: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
    metricsEnabled: boolean;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      requestCount: number;
    };
  };
  documentation: {
    enabled: boolean;
    swaggerEnabled: boolean;
    redocEnabled: boolean;
    version: string;
    basePath: string;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
}

interface BackupSettingsData {
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    daysOfWeek?: number[]; // 0-6 for weekly backups
    dayOfMonth?: number; // 1-31 for monthly backups
  };
  retention: {
    days: number;
    maxBackups: number;
    deleteAfterRestore: boolean;
  };
  storage: {
    location: 'local' | 's3' | 'azure' | 'gcp';
    path: string;
    credentials?: {
      accessKey?: string;
      secretKey?: string;
      bucket?: string;
      region?: string;
    };
  };
  encryption: {
    enabled: boolean;
    algorithm: 'aes-256-gcm' | 'aes-256-cbc';
    keyRotation: number; // days
  };
  compression: {
    enabled: boolean;
    level: 'none' | 'low' | 'medium' | 'high';
  };
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    recipients: string[];
  };
  lastBackup?: {
    id: string;
    timestamp: string;
    size: number;
    status: 'success' | 'failed' | 'in_progress';
    location: string;
  };
}

interface AuditLogsData {
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    retentionPeriod: number;
    storageLocation: 'local' | 's3' | 'azure' | 'gcp';
    exportFormat: 'json' | 'csv' | 'xml';
    autoArchive: boolean;
  };
  events: {
    userActivity: boolean;
    systemChanges: boolean;
    securityEvents: boolean;
    dataAccess: boolean;
    apiCalls: boolean;
  };
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    eventTypes: string[];
    users: string[];
    ipAddresses: string[];
  };
  notifications: {
    onCritical: boolean;
    onWarning: boolean;
    recipients: string[];
  };
  export: {
    schedule: 'daily' | 'weekly' | 'monthly' | 'none';
    time: string;
    format: 'json' | 'csv' | 'xml';
    compression: boolean;
    encryption: boolean;
  };
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
}

interface ReportContent {
  caseStatusSummary: boolean;
  financialSummary: boolean;
  staffPerformance: boolean;
}

interface ReportParameters {
  dateRange: { start: string; end: string };
  caseStatus: string[];
  caseType: string[];
  assignedTo: string[];
  priority: string[];
  customFields: string[];
}

interface ReportExportOptions {
  includeCharts: boolean;
  includeTables: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  includeAttachments: boolean;
}

interface Report {
  _id?: string;
  name: string;
  category: string;
  description: string;
  schedule: ReportSchedule;
  content: ReportContent;
  recipients: string[];
  format: 'PDF' | 'Excel' | 'CSV' | 'HTML';
  parameters: ReportParameters;
  filters: ReportParameters;
  exportOptions: ReportExportOptions;
  deliveryMethod: 'email' | 'download' | 'both';
  emailTemplate: 'default' | 'custom';
  fileNameFormat: string;
  compression: boolean;
  passwordProtection: boolean;
}



interface Role {
  _id?: string;
  name: string;
  type: keyof typeof ROLE_TYPES;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Permission {
  module: keyof typeof PERMISSION_MODULES;
  actions: Array<keyof typeof PERMISSION_ACTIONS>;
}

const SettingsPage = () => {

  const { isAttorney, isSuperAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const POLLING_INTERVAL = 30000; // 30 seconds
  const { enqueueSnackbar } = useSnackbar();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isNewRoleDialogOpen, setIsNewRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    type: 'STAFF',
    description: '',
    permissions: [],
    isDefault: false,
  });

  // useEffect(() => {
  //   loadRoles();
  // }, []);


  // Profile form state
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  });

  // Organization form state
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    organizationName: '',
    legalName: '',
    taxId: '',
    website: '',
    address: '',
  });

  // Notification form state
  const [notificationData, setNotificationData] = useState<NotificationData>({
    caseUpdates: false,
    documentAlerts: false,
    taskReminders: false
  });

  // Security form state
  const [securityData, setSecurityData] = useState<SecurityData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    lastModifiedBy: '',
    lastPasswordChange: '',
    updatedAt: ''
  });

  // Email form state
  const [emailData, setEmailData] = useState<EmailData>({
    signature: '',
    templates: {
      welcome: '',
      caseUpdate: ''
    }
  });

  // Integration form state
  const [integrationData, setIntegrationData] = useState<IntegrationData>({
    googleCalendar: false,
    gmail: false
  });

  // Billing form state
  // const [billingData, setBillingData] = useState<BillingData>({
  //   plan: '',
  //   paymentMethod: {
  //     cardNumber: '',
  //     expiryDate: ''
  //   }
  // });

  const [billingData, setBillingData] = useState<BillingData>({
    subscription: {
      plan: 'demo',
      billingCycle: 'monthly',
      amount: 0,
      currency: 'USD',
      status: 'pending',
      startDate: new Date(),
      endDate: new Date(),
      nextBillingDate: new Date(),
      autoRenew: true
    },
    paymentMethod: {
      type: 'credit_card',
      last4: '',
      brand: '',
      expiryMonth: 0,
      expiryYear: 0
    },
    paymentHistory: []
  });

  // System form state
  const [systemData, setSystemData] = useState<SystemData>({
    systemName: '',
    timeZone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    maintenance: {
      lastCacheClear: '',
      lastDatabaseOptimization: '',
      maintenanceMode: false,
      scheduledMaintenance: {
        enabled: false,
        startTime: '',
        duration: 0,
        message: ''
      }
    },
    performance: {
      maxUploadSize: 0,
      maxConcurrentUploads: 0,
      sessionTimeout: 0,
      idleTimeout: 0
    },
    security: {
      loginAttempts: 0,
      lockoutDuration: 0,
      passwordExpiry: 0,
      sessionManagement: {
        allowMultipleSessions: false,
        maxConcurrentSessions: 0
      }
    },
    notifications: {
      systemAlerts: false,
      maintenanceNotifications: false,
      errorNotifications: false,
      recipients: []
    },
    logging: {
      enabled: true,
      level: 'info',
      retention: 0,
      format: 'json',
      includeStackTraces: false
    }
  });

  // Add these state variables after the existing state declarations
  const [usersData, setUsersData] = useState<{
    users: DisplayUserData[];
    totalUsers: number;
    activeUsers: number;
  }>({
    users: [],
    totalUsers: 0,
    activeUsers: 0
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [caseSettingsData, setCaseSettingsData] = useState<CaseSettingsData>({
    categories: [],
    statuses: [],
    defaultSettings: {
      autoAssign: false,
      notifyOnStatusChange: true,
      requireDocumentUpload: true,
      defaultPriority: 'medium'
    },
    customFields: []
  });
  // const [formTemplatesData, setFormTemplatesData] = useState<any>({});
  const [newReport, setNewReport] = useState<Report>({
    name: '',
    category: 'Case Reports',
    description: '',
    schedule: {
      frequency: 'weekly',
      time: '09:00'
    },
    content: {
      caseStatusSummary: false,
      financialSummary: false,
      staffPerformance: false
    },
    recipients: [],
    format: 'PDF',
    parameters: {
      dateRange: {
        start: '',
        end: ''
      },
      caseStatus: [],
      caseType: [],
      assignedTo: [],
      priority: [],
      customFields: []
    },
    filters: {
      dateRange: {
        start: '',
        end: ''
      },
      caseStatus: [],
      caseType: [],
      assignedTo: [],
      priority: [],
      customFields: []
    },
    exportOptions: {
      includeCharts: true,
      includeTables: true,
      includeSummary: true,
      includeDetails: false,
      includeAttachments: false
    },
    deliveryMethod: 'email',
    emailTemplate: 'default',
    fileNameFormat: '{report_name}_{date}',
    compression: false,
    passwordProtection: false
  });
  const [rolesData, setRolesData] = useState<any>({});
  const [databaseSettingsData, setDatabaseSettingsData] = useState<DatabaseSettingsData>({
    connection: {
      host: '',
      port: 5432,
      database: '',
      schema: 'public'
    },
    backup: {
      schedule: 'daily',
      retentionDays: 30,
      compression: true
    },
    performance: {
      poolSize: 10,
      queryTimeout: 30,
      queryCacheEnabled: true
    }
  });
  const [backupSettingsData, setBackupSettingsData] = useState<BackupSettingsData>({
    schedule: {
      frequency: 'daily',
      time: '00:00',
    },
    retention: {
      days: 30,
      maxBackups: 10,
      deleteAfterRestore: false,
    },
    storage: {
      location: 'local',
      path: '/backups',
    },
    encryption: {
      enabled: true,
      algorithm: 'aes-256-gcm',
      keyRotation: 90,
    },
    compression: {
      enabled: true,
      level: 'medium',
    },
    notifications: {
      onSuccess: true,
      onFailure: true,
      recipients: [],
    },
  });
  const [backupList, setBackupList] = useState<any[]>([]);
  const [apiSettingsData, setApiSettingsData] = useState<ApiSettingsData>({
    keys: {
      production: {
        key: '',
        lastUsed: '',
        createdAt: '',
        expiresAt: ''
      },
      development: {
        key: '',
        lastUsed: '',
        createdAt: '',
        expiresAt: ''
      }
    },
    rateLimiting: {
      requestsPerMinute: 100,
      burstLimit: 200,
      windowSize: 60,
      enabled: true
    },
    cors: {
      allowedOrigins: ['*'],
      allowCredentials: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400
    },
    security: {
      requireApiKey: true,
      ipWhitelist: [],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      requireHttps: true,
      jwtEnabled: true,
      jwtExpiry: 3600,
      refreshTokenEnabled: true,
      refreshTokenExpiry: 604800
    },
    monitoring: {
      enabled: true,
      logLevel: 'info',
      retentionDays: 30,
      metricsEnabled: true,
      alertThresholds: {
        errorRate: 5,
        responseTime: 1000,
        requestCount: 1000
      }
    },
    documentation: {
      enabled: true,
      swaggerEnabled: true,
      redocEnabled: true,
      version: '1.0.0',
      basePath: '/api/v1'
    },
    logging: {
      enabled: true,
      level: 'info',
      format: 'json'
    }
  });
  const [performanceSettingsData, setPerformanceSettingsData] = useState<PerformanceSettingsData>({
    optimization: {
      cacheDuration: 3600,
      queryTimeout: 30,
      maxConnections: 10,
      compressionLevel: 'medium',
      debugMode: false,
      maxUploadSize: 0,
      maxConcurrentUploads: 0,
      sessionTimeout: 0,
      idleTimeout: 0,
      queryCacheEnabled: true,
      poolSize: 0
    },
    monitoring: {
      enabled: true,
      metricsInterval: 60,
      retentionPeriod: 720,
      alertThresholds: {
        cpu: 80,
        memory: 70,
        storage: 80,
        responseTime: 100,
        errorRate: 2,
        requestCount: 0,
        concurrentUsers: 0,
        databaseConnections: 0
      }
    },
    alerts: {
      email: true,
      slack: false,
      webhook: '',
      recipients: [],
      notificationChannels: {
        email: false,
        slack: false,
        webhook: false,
        sms: false
      },
      alertLevels: {
        critical: true,
        warning: true,
        info: false
      }
    },
    caching: {
      enabled: false,
      type: 'memory',
      ttl: 0,
      maxSize: 0,
      compression: false
    },
    database: {
      connectionPool: {
        min: 0,
        max: 0,
        idleTimeout: 0
      },
      queryOptimization: {
        enabled: false,
        maxExecutionTime: 0,
        slowQueryThreshold: 0
      },
      indexing: {
        autoIndex: false,
        backgroundIndexing: false
      }
    }
  });

  const [auditLogsData, setAuditLogsData] = useState<AuditLogsData>({
    logging: {
      enabled: true,
      level: 'info',
      retentionPeriod: 90,
      storageLocation: 'local',
      exportFormat: 'json',
      autoArchive: true
    },
    events: {
      userActivity: true,
      systemChanges: true,
      securityEvents: true,
      dataAccess: true,
      apiCalls: true
    },
    filters: {
      dateRange: {
        start: '',
        end: ''
      },
      eventTypes: [],
      users: [],
      ipAddresses: []
    },
    notifications: {
      onCritical: true,
      onWarning: true,
      recipients: []
    },
    export: {
      schedule: 'daily',
      time: '00:00',
      format: 'json',
      compression: true,
      encryption: true
    }
  });

  // Add these state variables for modals
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);

  // Add these state variables for form data
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6' // Default blue color
  });

  const [newStatus, setNewStatus] = useState({
    name: '',
    description: '',
    color: '#3B82F6', // Default blue color
    order: 0
  });

  const [newField, setNewField] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'date' | 'select',
    required: false,
    options: [] as string[]
  });

  // Add these state variables for user management
  const [showAddUser, setShowAddUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '' as '' | 'attorney' | 'paralegal' | 'client',
    active: true,
    companyId: user?.companyId || '', // Set initial companyId from current user
    password: '',
    confirmPassword: ''
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState<string>('All Companies');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const [userCompany, setUserCompany] = useState<Company | null>(null);

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?._id) return;

      try {
        let data;
        switch (activeTab) {
          case 'profile':
            data = await getProfile(user._id);
            if (data?.data) {
              setProfileData(data.data.value);
            }
            break;
          case 'organization':
            data = await getOrganization(user._id);
            if (data?.data) {
              setOrganizationData(data.data.value);
            }
            break;
          case 'notifications':
            data = await getNotifications(user._id);
            if (data?.data) {
              setNotificationData(data.data.value);
            }
            break;
          case 'security':
            data = await getSecurity(user._id);
            if (data?.data) {
              setSecurityData(data.data.value);
            }
            break;
          case 'email':
            data = await getEmailSettings(user._id);
            if (data?.data) {
              setEmailData(data.data.value);
            }
            break;
          case 'integrations':
            data = await getIntegrations(user._id);
            if (data?.data) {
              setIntegrationData(data.data.value);
            }
            break;
          case 'billing':
            data = await getBilling(user._id);
            if (data?.data) {
              setBillingData(data.data.value);
            }
            break;
          case 'system':
            data = await getSystemSettings(user._id);
            if (data?.data) {
              setSystemData(data.data);
            }
            break;
          case 'users':
            data = await getUserById(user._id);
            if (data?.data) {
              const users = data.data.map((user: any) => ({
                ...user,
                name: `${user.firstName} ${user.lastName}`,
                status: user.active ? 'active' : 'inactive'
              }));

              // For superadmin, show all users by default
              if (isSuperAdmin) {
                setUsersData({
                  users,
                  totalUsers: users.length,
                  activeUsers: users.filter((u: DisplayUserData) => u.active).length
                });
              } else {
                // For other roles, only show users from their company
                const companyUsers = users.filter((u: DisplayUserData) => u.companyId === user.companyId);
                setUsersData({
                  users: companyUsers,
                  totalUsers: companyUsers.length,
                  activeUsers: companyUsers.filter((u: DisplayUserData) => u.active).length
                });
              }
            }
            // Load companies for the dropdown
            const companiesData = await getAllCompaniesList(user._id);
            if (companiesData?.data) {
              setCompanies(companiesData.data);
              // Set userCompany if user has a companyId
              if (user.companyId) {
                try {
                  const companyResponse = await getCompanyById(user.companyId);
                  if (companyResponse?.data) {
                    setUserCompany(companyResponse.data);
                  }
                } catch (error) {
                  console.error('Error fetching company details:', error);
                  // Fallback to finding company in the companies list if getCompanyById fails
                  const userCompanyData = companiesData.data.find((company: Company) => company._id === user.companyId);
                  if (userCompanyData) {
                    setUserCompany(userCompanyData);
                  }
                }
              }
            }
            break;
          case 'cases':
            data = await getCaseSettings(user._id);
            if (data?.data) {
              setCaseSettingsData(data.data.value);
            }
            break;
          case 'forms':
            data = await getFormTemplates(user._id);
            if (data?.data) {
              // setFormTemplatesData(data.data.value);
            }
            break;
          case 'reports':
            const reportData: { data: { value: Report | Report[], id: string } } = await getReportSettings(user._id);
            if (reportData?.data?.value) {
              // Ensure we're setting an array and include the ID
              const reportsData = Array.isArray(reportData.data.value)
                ? reportData.data.value.map((report: Report) => ({ ...report, _id: reportData.data.id }))
                : [{ ...reportData.data.value, _id: reportData.data.id }];
              setReports(reportsData);
            } else {
              setReports([]); // Set empty array if no data
            }
            break;
          case 'roles':
            // data = await getRoles(user._id);
            data = await getRoles();
            if (data?.data) {
              // setRolesData(data.data.value);
              setRoles(data.data.roles.map(role => ({
                ...role,
                type: ((role.type as string).toLowerCase() === 'admin' ? 'SUPER_ADMIN' : (role.type as string).toUpperCase()) as keyof typeof ROLE_TYPES
              })));
            }
            break;
          case 'database':
            data = await getDatabaseSettings(user._id);
            if (data?.data) {
              setDatabaseSettingsData(data.data.value);
            }
            break;
          case 'audit':
            data = await getAuditLogs(user._id);
            if (data?.data) {
              setAuditLogsData(data.data.value);
            }
            break;
          case 'backup':
            data = await getBackupSettings(user._id);
            if (data?.data) {
              setBackupSettingsData(data.data.value);
            }
            break;
          case 'api':
            data = await getApiSettings(user._id);
            if (data?.data) {
              const apiData: ApiSettingsData = {
                ...data.data,
                monitoring: data.data.monitoring || {
                  enabled: true,
                  logLevel: 'info',
                  retentionDays: 30,
                  metricsEnabled: true,
                  alertThresholds: {
                    errorRate: 5,
                    responseTime: 1000,
                    requestCount: 1000
                  }
                },
                documentation: data.data.documentation || {
                  enabled: true,
                  swaggerEnabled: true,
                  redocEnabled: true,
                  version: '1.0.0',
                  basePath: '/api/v1'
                }
              };
              setApiSettingsData(apiData);
            }
            break;
          case 'performance':
            data = await getPerformanceSettings(user._id);
            if (data?.data) {
              setPerformanceSettingsData(data.data.value);
            }
            break;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings. Please try again.');
      }
    };

    loadSettings();
  }, [activeTab, user?._id, updateTrigger]); // Add updateTrigger to dependencies

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileData(prev => ({
        ...prev,
        profilePhoto: e.target.files![0]
      }));
    }
  };

  const handleProfileSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateProfile(user._id, profileData);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrganizationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOrganizationLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOrganizationData(prev => ({
        ...prev,
        logo: e.target.files![0]
      }));
    }
  };

  const handleOrganizationSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateOrganization(user._id, organizationData);
      // Show success message
    } catch (error) {
      console.error('Error updating organization:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleNotificationSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateNotifications(user._id, notificationData);
      // Show success message
    } catch (error) {
      console.error('Error updating notifications:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSecuritySubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateSecurity(user._id, securityData);
      // Show success message
    } catch (error) {
      console.error('Error updating security:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEmailData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EmailData] as Record<string, string>),
          [child]: value
        }
      }));
    } else {
      setEmailData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEmailSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateEmailSettings(user._id, emailData);
      // Show success message
    } catch (error) {
      console.error('Error updating email:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setIntegrationData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleIntegrationSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateIntegrations(user._id, integrationData);
      // Show success message
    } catch (error) {
      console.error('Error updating integrations:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  // const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   if (name.includes('.')) {
  //     const [parent, child] = name.split('.');
  //     setBillingData(prev => ({
  //       ...prev,
  //       [parent]: {
  //         ...(prev[parent as keyof BillingData] as Record<string, string>),
  //         [child]: value
  //       }
  //     }));
  //   } else {
  //     setBillingData(prev => ({
  //       ...prev,
  //       [name]: value
  //     }));
  //   }
  // };

  // const handleBillingSubmit = async () => {
  //   if (!user?._id) return;
  //   setLoading(true);
  //   try {
  //     await updateBilling(user._id, billingData);
  //     // Show success message
  //   } catch (error) {
  //     console.error('Error updating billing:', error);
  //     // Show error message
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const [section, field] = name.split('.');

    setBillingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof BillingData],
        [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }
    }));
  };

  const handleBillingSubmit = async () => {
    if (!user?._id) return;
    try {
      const response = await updateSubscription(user._id, billingData.subscription);
      if (response.status === 200) {
        toast.success('Billing settings updated successfully');
      } else {
        toast.error('Failed to update billing settings');
      }
    } catch (error) {
      toast.error('Error updating billing settings');
    }
  };

  const handlePaymentMethodUpdate = async () => {
    if (!user?._id) return;
    try {
      const response = await updatePaymentMethod(user._id, billingData.paymentMethod);
      if (response.status === 200) {
        toast.success('Payment method updated successfully');
      } else {
        toast.error('Failed to update payment method');
      }
    } catch (error) {
      toast.error('Error updating payment method');
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?._id) return;
    try {
      const response = await cancelSubscription(user._id);
      if (response.status === 200) {
        toast.success('Subscription cancelled successfully');
        const updatedSubscription = await getCurrentSubscription(user._id);
        if (updatedSubscription.data) {
          // setBillingData(prev => ({
          //   ...prev,
          //   subscription: updatedSubscription.data
          // }));
        }
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Error cancelling subscription');
    }
  };

  const handleRenewSubscription = async () => {
    if (!user?._id) return;
    try {
      const response = await renewSubscription(user._id);
      if (response.status === 200) {
        toast.success('Subscription renewed successfully');
        const updatedSubscription = await getCurrentSubscription(user._id);
        if (updatedSubscription.data) {
          // setBillingData(prev => ({
          //   ...prev,
          //   subscription: updatedSubscription.data
          // }));
        }
      } else {
        toast.error('Failed to renew subscription');
      }
    } catch (error) {
      toast.error('Error renewing subscription');
    }
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    setSystemData(prev => {
      const newData = { ...prev };
      const keys = name.split('.');
      let current: any = newData;

      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      // Handle array values
      if (name.includes('recipients') || name.includes('allowedOrigins') || name.includes('ipWhitelist')) {
        current[keys[keys.length - 1]] = value.split(',').map(item => item.trim());
      } else {
        current[keys[keys.length - 1]] = newValue;
      }

      return newData;
    });
  };

  const handleSystemSubmit = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await updateSystemSettings(user._id, systemData);
      if (response.status === 200) {
        toast.success('System settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast.error('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenance = async (operation: 'cache' | 'database') => {
    if (!user?._id) return;
    try {
      setLoading(true);
      let response;

      if (operation === 'cache') {
        response = await clearSystemCache(user._id);
      } else {
        response = await optimizeSystemDatabase(user._id);
      }

      if (response.status === 200) {
        toast.success(`${operation === 'cache' ? 'Cache cleared' : 'Database optimized'} successfully`);
      }
    } catch (error) {
      console.error(`Error performing ${operation} operation:`, error);
      toast.error(`Failed to ${operation === 'cache' ? 'clear cache' : 'optimize database'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceModeToggle = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await updateMaintenanceMode(user._id, {
        maintenanceMode: !systemData.maintenance.maintenanceMode
      });

      if (response.status === 200) {
        setSystemData(prev => ({
          ...prev,
          maintenance: {
            ...prev.maintenance,
            maintenanceMode: !prev.maintenance.maintenanceMode
          }
        }));
        toast.success(`Maintenance mode ${!systemData.maintenance.maintenanceMode ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('Failed to update maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduledMaintenanceUpdate = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await updateMaintenanceMode(user._id, {
        scheduledMaintenance: systemData.maintenance.scheduledMaintenance
      });

      if (response.status === 200) {
        toast.success('Scheduled maintenance updated successfully');
      }
    } catch (error) {
      console.error('Error updating scheduled maintenance:', error);
      toast.error('Failed to update scheduled maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformanceUpdate = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await updateSystemPerformance(user._id, systemData.performance);

      if (response.status === 200) {
        toast.success('Performance settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating performance settings:', error);
      toast.error('Failed to update performance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await updateSystemSecurity(user._id, systemData.security);

      if (response.status === 200) {
        toast.success('Security settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsUpdate = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await updateSystemNotifications(user._id, systemData.notifications);

      if (response.status === 200) {
        toast.success('Notification settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLoggingUpdate = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await updateSystemLogging(user._id, systemData.logging);

      if (response.status === 200) {
        toast.success('Logging settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating logging settings:', error);
      toast.error('Failed to update logging settings');
    } finally {
      setLoading(false);
    }
  };

  // Add continuous polling effect
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!user?._id) return;

      try {
        const currentTime = Date.now();
        const timeSinceLastUpdate = currentTime - lastUpdateTime;

        // Only poll if it's been at least POLLING_INTERVAL since last update
        if (timeSinceLastUpdate >= POLLING_INTERVAL) {
          let data;
          switch (activeTab) {
            case 'profile':
              data = await getProfile(user._id);
              if (data?.data) {
                setProfileData(data.data.value);
              }
              break;
            case 'organization':
              data = await getOrganization(user._id);
              if (data?.data) {
                setOrganizationData(data.data.value);
              }
              break;
            case 'notifications':
              data = await getNotifications(user._id);
              if (data?.data) {
                setNotificationData(data.data.value);
              }
              break;
            case 'security':
              data = await getSecurity(user._id);
              if (data?.data) {
                setSecurityData(data.data.value);
              }
              break;
            case 'email':
              data = await getEmailSettings(user._id);
              if (data?.data) {
                setEmailData(data.data.value);
              }
              break;
            case 'integrations':
              data = await getIntegrations(user._id);
              if (data?.data) {
                setIntegrationData(data.data.value);
              }
              break;
            case 'billing':
              data = await getBilling(user._id);
              if (data?.data) {
                setBillingData(data.data.value);
              }
              break;
            case 'users':
              data = await getUserById(user._id);
              if (data?.data) {
                const users = data.data.map((user: any) => ({
                  ...user,
                  name: `${user.firstName} ${user.lastName}`,
                  status: user.active ? 'active' : 'inactive'
                }));
                setUsersData({
                  users,
                  totalUsers: users.length,
                  activeUsers: users.filter((u: DisplayUserData) => u.active).length
                });
              }
              break;
            case 'cases':
              data = await getCaseSettings(user._id);
              if (data?.data) {
                setCaseSettingsData(data.data.value);
              }
              break;
            case 'forms':
              data = await getFormTemplates(user._id);
              if (data?.data) {
                // setFormTemplatesData(data.data.value);
              }
              break;
            case 'reports':
              data = await getReportSettings(user._id);
              if (data?.data.value) {
                setNewReport({
                  name: '',
                  category: 'Case Reports',
                  description: '',
                  schedule: {
                    frequency: 'weekly',
                    time: '09:00'
                  },
                  content: {
                    caseStatusSummary: false,
                    financialSummary: false,
                    staffPerformance: false
                  },
                  recipients: [],
                  format: 'PDF',
                  parameters: {
                    dateRange: {
                      start: '',
                      end: ''
                    },
                    caseStatus: [],
                    caseType: [],
                    assignedTo: [],
                    priority: [],
                    customFields: []
                  },
                  filters: {
                    dateRange: {
                      start: '',
                      end: ''
                    },
                    caseStatus: [],
                    caseType: [],
                    assignedTo: [],
                    priority: [],
                    customFields: []
                  },
                  exportOptions: {
                    includeCharts: true,
                    includeTables: true,
                    includeSummary: true,
                    includeDetails: false,
                    includeAttachments: false
                  },
                  deliveryMethod: 'email',
                  emailTemplate: 'default',
                  fileNameFormat: '{report_name}_{date}',
                  compression: false,
                  passwordProtection: false
                });
              }
              break;
            case 'roles':
              // data = await getRoles(user._id);
              data = await getRoles();
              if (data?.data) {
                // setRolesData(data.data.value);
                setRoles(data.data.roles.map(role => ({
                  ...role,
                  type: ((role.type as string).toLowerCase() === 'admin' ? 'SUPER_ADMIN' : (role.type as string).toUpperCase()) as keyof typeof ROLE_TYPES
                })));
              }
              break;
            case 'database':
              data = await getDatabaseSettings(user._id);
              if (data?.data) {
                setDatabaseSettingsData(data.data.value);
              }
              break;
            case 'system':
              data = await getSystemSettings(user._id);
              if (data?.data) {
                setSystemData(data.data);
              }
              break;
            case 'audit':
              data = await getAuditLogs(user._id);
              if (data?.data) {
                setAuditLogsData(data.data.value);
              }
              break;
            case 'backup':
              data = await getBackupSettings(user._id);
              if (data?.data) {
                setBackupSettingsData(data.data.value);
              }
              break;
            case 'api':
              data = await getApiSettings(user._id);
              if (data?.data) {
                const apiData: ApiSettingsData = {
                  ...data.data,
                  monitoring: data.data.monitoring || {
                    enabled: true,
                    logLevel: 'info',
                    retentionDays: 30,
                    metricsEnabled: true,
                    alertThresholds: {
                      errorRate: 5,
                      responseTime: 1000,
                      requestCount: 1000
                    }
                  },
                  documentation: data.data.documentation || {
                    enabled: true,
                    swaggerEnabled: true,
                    redocEnabled: true,
                    version: '1.0.0',
                    basePath: '/api/v1'
                  }
                };
                setApiSettingsData(apiData);
              }
              break;
            case 'performance':
              data = await getPerformanceSettings(user._id);
              if (data?.data) {
                setPerformanceSettingsData(data.data.value);
              }
              break;
          }
          setLastUpdateTime(currentTime);
        }
      } catch (error) {
        console.error('Error polling settings:', error);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [activeTab, user?._id, lastUpdateTime]);

  // Update handleSave to set lastUpdateTime
  const handleSave = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);

      switch (activeTab) {
        case 'profile':
          await updateProfile(user._id, profileData);
          break;
        case 'organization':
          await updateOrganization(user._id, organizationData);
          break;
        case 'notifications':
          await updateNotifications(user._id, notificationData);
          break;
        case 'security':
          await updateSecurity(user._id, securityData);
          break;
        case 'email':
          await updateEmailSettings(user._id, emailData);
          break;
        case 'integrations':
          await updateIntegrations(user._id, integrationData);
          break;
        case 'billing':
          await updateBilling(user._id, billingData);
          break;
        case 'users':
          await updateUsers(user._id, usersData);
          break;
        case 'cases':
          await updateCaseSettings(user._id, caseSettingsData);
          break;
        case 'forms':
          // await updateFormTemplates(user._id, formTemplatesData);
          break;
        case 'reports':
          await updateReportSettings(user._id, newReport);
          break;
        case 'roles':
          if (!selectedRole) {
            toast.error('No role selected');
            break;
          }
          await updateRole(user._id, selectedRole._id!, selectedRole);
          break;
        case 'database':
          await updateDatabaseSettings(user._id, databaseSettingsData);
          break;
        case 'system':
          await updateSystemSettings(user._id, systemData);
          break;
        case 'backup':
          await updateBackupSettings(user._id, backupSettingsData);
          break;
        case 'api':
          await updateApiSettings(user._id, apiSettingsData);
          break;
        case 'performance':
          await updatePerformanceSettings(user._id, performanceSettingsData);
          break;
      }
      toast.success('Settings updated successfully');
      setUpdateTrigger(prev => prev + 1);
      setLastUpdateTime(Date.now());
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      await signOutAllDevices(user._id);
      // You might want to redirect to login page or show a success message
      window.location.href = '/'; // Redirect to login page after signing out
    } catch (error) {
      console.error('Error signing out all devices:', error);
      // Handle error (show error message to user)
    } finally {
      setLoading(false);
      setShowSignOutConfirmation(false);
    }
  };

  const navigationItems = [
    { id: 'profile', name: 'Profile', icon: User, adminOnly: false },
    { id: 'organization', name: 'Organization', icon: Building, adminOnly: false },
    { id: 'notifications', name: 'Notifications', icon: Bell, adminOnly: false },
    { id: 'security', name: 'Security', icon: Lock, adminOnly: false },
    { id: 'email', name: 'Email', icon: Mail, adminOnly: false },
    { id: 'integrations', name: 'Integrations', icon: Globe, adminOnly: false },
    { id: 'billing', name: 'Billing', icon: CreditCard, adminOnly: false },
    { id: 'users', name: 'User Management', icon: Users, adminOnly: false, attorneyAllowed: true },
    { id: 'cases', name: 'Case Settings', icon: Briefcase, adminOnly: false, attorneyAllowed: true },
    { id: 'forms', name: 'Form Templates', icon: FileText, adminOnly: false, attorneyAllowed: true },
    { id: 'reports', name: 'Report Settings', icon: BarChart, adminOnly: false, attorneyAllowed: true },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield, adminOnly: true },
    { id: 'database', name: 'Database Settings', icon: Database, adminOnly: true },
    { id: 'system', name: 'System Settings', icon: Settings, adminOnly: true },
    { id: 'audit', name: 'Audit Logs', icon: Activity, adminOnly: true },
    { id: 'backup', name: 'Backup & Recovery', icon: HardDrive, adminOnly: true },
    { id: 'api', name: 'API Settings', icon: Key, adminOnly: true },
    { id: 'performance', name: 'Performance', icon: Zap, adminOnly: true }
  ];

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleSecuritySubmit(); }}>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={securityData.currentPassword}
                onChange={handleSecurityChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={securityData.newPassword}
                onChange={handleSecurityChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={securityData.confirmPassword}
                onChange={handleSecurityChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="twoFactorEnabled"
                name="twoFactorEnabled"
                checked={securityData.twoFactorEnabled}
                onChange={handleSecurityChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="twoFactorEnabled" className="ml-2 block text-sm text-gray-900">
                Enable Two-Factor Authentication
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Update Security Settings
            </button>
          </div>
        </form>

        {/* Security Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Security Information</h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Password Change</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(securityData.lastPasswordChange).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Modified By</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {securityData.lastModifiedBy}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(securityData.updatedAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Two-Factor Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {securityData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Sign Out All Devices Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sign out from all other devices where you're currently logged in. This will invalidate all active sessions except your current one.
        </p>
        <button
          onClick={() => setShowSignOutConfirmation(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out All Other Devices
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Sign Out</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to sign out from all other devices? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSignOutConfirmation(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOutAllDevices}
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {loading ? 'Signing Out...' : 'Sign Out All Devices'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleDatabaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const [section, field] = name.split('.');
    setDatabaseSettingsData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof DatabaseSettingsData] as Record<string, any>),
        [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
          type === 'number' ? Number(value) : value
      }
    }));
  };

  const handlePerformanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const [section, field, subfield] = name.split('.');

    setPerformanceSettingsData(prev => {
      const newData = { ...prev };

      if (subfield) {
        // Handle nested fields like monitoring.alertThresholds.cpu
        (newData[section as keyof PerformanceSettingsData] as any)[field][subfield] = type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? Number(value)
            : value;
      } else {
        // Handle top-level fields
        (newData[section as keyof PerformanceSettingsData] as any)[field] = type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? Number(value)
            : value;
      }

      return newData;
    });
  };

  const handleAuditLogsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setAuditLogsData(prev => {
      const newData = { ...prev };
      const keys = name.split('.');
      let current: any = newData;

      // Ensure all nested objects exist
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      if (isCheckbox) {
        current[lastKey] = checked;
      } else if (type === 'number') {
        current[lastKey] = Number(value);
      } else if (type === 'select-multiple') {
        const select = e.target as HTMLSelectElement;
        current[lastKey] = Array.from(select.selectedOptions, option => option.value);
      } else {
        current[lastKey] = value;
      }

      return newData;
    });
  };

  const handleDatabaseMaintenance = async (operation: 'vacuum' | 'analyze' | 'export') => {
    if (!user?._id) return;
    setLoading(true);
    try {
      switch (operation) {
        case 'vacuum':
          await vacuumDatabase(user._id);
          toast.success('Database vacuum completed successfully');
          break;
        case 'analyze':
          await analyzeDatabase(user._id);
          toast.success('Table analysis completed successfully');
          break;
        case 'export':
          const response = await exportDatabaseSchema(user._id);
          // Create a download link for the schema file
          const blob = new Blob([response.data], { type: 'application/sql' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'database_schema.sql';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('Database schema exported successfully');
          break;
      }
    } catch (error) {
      console.error(`Error during database ${operation}:`, error);
      toast.error(`Failed to ${operation} database`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { firstName, lastName, email, role, password, confirmPassword } = newUser;

      // Validate required fields
      if (!firstName || !lastName || !email || !role) {
        toast.error('Please fill in all required fields');
        return;
      }

      // For attorneys, use their company ID
      const finalCompanyId = isAttorney ? user?.companyId : newUser.companyId;
      if (!finalCompanyId) {
        toast.error('Company ID is required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Validate password
      if (!password || password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Validate role-based permissions
      if (isSuperAdmin && role !== 'attorney') {
        toast.error('Superadmins can only add attorneys');
        return;
      }

      if (isAttorney && !['paralegal', 'client'].includes(role)) {
        toast.error('Attorneys can only add paralegals and clients');
        return;
      }

      let response;
      if (role === 'attorney') {
        response = await registerAttorney(
          firstName,
          lastName,
          email,
          password,
          user?._id || '', // superadminId
          finalCompanyId
        );
      } else {
        response = await registerUser(
          firstName,
          lastName,
          email,
          password,
          role,
          user?._id || '', // superadminId
          user?._id || '', // attorneyId
          finalCompanyId
        );
      }

      if (response?.data) {
        toast.success('User added successfully');
        setShowAddUser(false);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          role: '',
          active: true,
          companyId: '',
          password: '',
          confirmPassword: ''
        });
        // Refresh users list
        const data = await getUserById(user?._id || '');
        if (data?.data) {
          const users = data.data.map((user: any) => ({
            ...user,
            name: `${user.firstName} ${user.lastName}`,
            status: user.active ? 'active' : 'inactive'
          }));
          setUsersData({
            users,
            totalUsers: users.length,
            activeUsers: users.filter((u: DisplayUserData) => u.active).length
          });
        }
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.response?.data?.message || 'Failed to add user');
    }
  };

  // Add company search filter
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) || companySearchTerm === 'All Companies'
  );

  // Add this function after the other handlers
  const handleCompanySelect = async (companyId: string, companyName: string) => {
    setIsLoadingUsers(true);
    setSelectedCompanyId(companyId);
    setCompanySearchTerm(companyName);
    setShowCompanyDropdown(false);
    setNewUser(prev => ({
      ...prev,
      companyId
    }));

    try {
      if (companyId) {
        const response = await getCompanyUsers(companyId);
        if (response?.data) {
          const users = response.data.map((user: any) => ({
            ...user,
            name: `${user.firstName} ${user.lastName}`,
            status: user.active ? 'active' : 'inactive'
          }));
          setUsersData(prev => ({
            ...prev,
            totalUsers: users.length,
            activeUsers: users.filter((u: DisplayUserData) => u.active).length
          }));
        }
      } else {
        // If no company selected, show all users
        const data = await getUserById(user?._id || '');
        if (data?.data) {
          const users = data.data.map((user: any) => ({
            ...user,
            name: `${user.firstName} ${user.lastName}`,
            status: user.active ? 'active' : 'inactive'
          }));
          setUsersData({
            users,
            totalUsers: users.length,
            activeUsers: users.filter((u: DisplayUserData) => u.active).length
          });
        }
      }
    } catch (error) {
      console.error('Error fetching company users:', error);
      toast.error('Failed to fetch company users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Add a clear filter function
  const clearCompanyFilter = () => {
    setSelectedCompanyId('');
    setCompanySearchTerm('All Companies');
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (userId: string) => {
    const user = usersData.users.find(u => u._id === userId);
    if (user) {
      setUserToDelete(userId);
      setShowDeleteConfirmation(true);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setLoading(true);
      const response = await updateUser(editingUser._id, editingUser);
      if (response.data) {
        // Update the users list
        const updatedUsers = usersData.users.map(user =>
          user._id === editingUser._id ? { ...user, ...editingUser } : user
        );
        setUsersData(prev => ({
          ...prev,
          users: updatedUsers
        }));
        setEditingUser(null);
        toast.success('User updated successfully');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete && !reportToDelete) return;

    try {
      setLoading(true);
      if (userToDelete) {
        await deleteUser(userToDelete);
        // Remove the deleted user from the lists
        const updatedUsers = usersData.users.filter(user => user._id !== userToDelete);
        setUsersData(prev => ({
          ...prev,
          users: updatedUsers,
          totalUsers: prev.totalUsers - 1,
          activeUsers: updatedUsers.filter(u => u.active).length
        }));
        setShowDeleteConfirmation(false);
        setUserToDelete(null);
        toast.success('User deleted successfully');
      } else if (reportToDelete && user?._id) {
        await deleteReportSettings(user._id, reportToDelete._id!);
        // Remove the deleted report from the list
        setReports(reports.filter(report => report._id !== reportToDelete._id));
        setShowDeleteConfirmation(false);
        setReportToDelete(null);
        toast.success('Report deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setApiSettingsData(prev => {
      const newData = { ...prev };
      const keys = name.split('.');
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      if (isCheckbox) {
        current[lastKey] = checked;
      } else if (name === 'cors.allowedOrigins' || name === 'security.ipWhitelist') {
        current[lastKey] = value.split('\n').filter(item => item.trim());
      } else if (name === 'security.allowedMethods') {
        const methods = (e.target as HTMLSelectElement).selectedOptions;
        current[lastKey] = Array.from(methods).map(option => option.value);
      } else {
        current[lastKey] = value;
      }

      return newData;
    });
  };

  const handleRegenerateApiKey = async (type: 'production' | 'development') => {
    if (!user?._id) return;
    try {
      const response = await regenerateApiKey(user._id, type);
      setApiSettingsData(prev => ({
        ...prev,
        keys: {
          ...prev.keys,
          [type]: response.data
        }
      }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} API key regenerated successfully`);
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast.error('Failed to regenerate API key');
    }
  };

  const handleTestApiConnection = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const testConfig = {
        endpoint: apiSettingsData.documentation.basePath,
        method: 'GET' as const,
        headers: {
          'Authorization': `Bearer ${apiSettingsData.keys.production.key}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };

      const response = await testApiConnection(user._id, testConfig);

      if (response.data.success) {
        toast.success(`API connection test successful. Response time: ${response.data.responseTime}ms`);
      } else {
        toast.error('API connection test failed');
      }
    } catch (error) {
      console.error('Error testing API connection:', error);
      toast.error('API connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleValidateSettings = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const response = await validateApiSettings(user._id, apiSettingsData);
      if (response.data.valid) {
        toast.success('API settings validation successful');
        if (response.data.warnings?.length > 0) {
          toast.warning(response.data.warnings.map((w: any) => w.message).join('\n'));
        }
      } else {
        toast.error('API settings validation failed');
      }
    } catch (error) {
      console.error('Error validating API settings:', error);
      toast.error('Failed to validate API settings');
    } finally {
      setLoading(false);
    }
  };

  const handleApiSettingsSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateApiSettings(user._id, apiSettingsData);
      toast.success('API settings updated successfully');
    } catch (error) {
      console.error('Error updating API settings:', error);
      toast.error('Failed to update API settings');
    } finally {
      setLoading(false);
    }
  };

  const renderBillingSection = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4">Billing Settings</h2>

      {/* Current Plan */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Current Plan</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Plan</label>
            <select
              name="subscription.plan"
              value={billingData.subscription.plan}
              onChange={handleBillingChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="demo">Demo</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
            <select
              name="subscription.billingCycle"
              value={billingData.subscription.billingCycle}
              onChange={handleBillingChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Payment Method</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Card Type</label>
            <select
              name="paymentMethod.type"
              value={billingData.paymentMethod.type}
              onChange={handleBillingChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last 4 Digits</label>
            <input
              type="text"
              name="paymentMethod.last4"
              value={billingData.paymentMethod.last4}
              onChange={handleBillingChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Month</label>
            <input
              type="number"
              name="paymentMethod.expiryMonth"
              value={billingData.paymentMethod.expiryMonth}
              onChange={handleBillingChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Year</label>
            <input
              type="number"
              name="paymentMethod.expiryYear"
              value={billingData.paymentMethod.expiryYear}
              onChange={handleBillingChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={handlePaymentMethodUpdate}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Update Payment Method
        </button>
      </div>

      {/* Subscription Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Subscription Actions</h3>
        <div className="flex space-x-4">
          <button
            onClick={handleCancelSubscription}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Cancel Subscription
          </button>
          <button
            onClick={handleRenewSubscription}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Renew Subscription
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h3 className="text-lg font-medium mb-3">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingData.paymentHistory.map((payment, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.currency} {payment.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.transactionId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.receiptUrl && (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Receipt
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderApiSettingsSection = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">API Settings</h3>
          <div className="flex space-x-3">
            <button
              onClick={handleTestApiConnection}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              onClick={handleValidateSettings}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Validate Settings
            </button>
            <button
              onClick={handleApiSettingsSubmit}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* API Keys Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">API Keys</h4>
            <div className="space-y-4">
              {/* Production Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Key</label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={apiSettingsData.keys.production.key}
                    readOnly
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={() => handleRegenerateApiKey('production')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">Last used: {apiSettingsData.keys.production.lastUsed || 'Never'}</p>
              </div>

              {/* Development Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Development Key</label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={apiSettingsData.keys.development.key}
                    readOnly
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={() => handleRegenerateApiKey('development')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">Last used: {apiSettingsData.keys.development.lastUsed || 'Never'}</p>
              </div>
            </div>
          </div>

          {/* Rate Limiting Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Rate Limiting</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rateLimiting.enabled"
                  name="rateLimiting.enabled"
                  checked={apiSettingsData.rateLimiting.enabled}
                  onChange={handleApiSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="rateLimiting.enabled" className="ml-2 block text-sm text-gray-900">
                  Enable Rate Limiting
                </label>
              </div>
              <div>
                <label htmlFor="rateLimiting.requestsPerMinute" className="block text-sm font-medium text-gray-700">
                  Requests per Minute
                </label>
                <input
                  type="number"
                  id="rateLimiting.requestsPerMinute"
                  name="rateLimiting.requestsPerMinute"
                  value={apiSettingsData.rateLimiting.requestsPerMinute}
                  onChange={handleApiSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="rateLimiting.burstLimit" className="block text-sm font-medium text-gray-700">
                  Burst Limit
                </label>
                <input
                  type="number"
                  id="rateLimiting.burstLimit"
                  name="rateLimiting.burstLimit"
                  value={apiSettingsData.rateLimiting.burstLimit}
                  onChange={handleApiSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* CORS Settings Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">CORS Settings</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="cors.allowedOrigins" className="block text-sm font-medium text-gray-700">
                  Allowed Origins (one per line)
                </label>
                <textarea
                  id="cors.allowedOrigins"
                  name="cors.allowedOrigins"
                  value={apiSettingsData.cors.allowedOrigins.join('\n')}
                  onChange={handleApiSettingsChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cors.allowCredentials"
                  name="cors.allowCredentials"
                  checked={apiSettingsData.cors.allowCredentials}
                  onChange={handleApiSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="cors.allowCredentials" className="ml-2 block text-sm text-gray-900">
                  Allow Credentials
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Security Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="security.requireApiKey"
                  name="security.requireApiKey"
                  checked={apiSettingsData.security.requireApiKey}
                  onChange={handleApiSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="security.requireApiKey" className="ml-2 block text-sm text-gray-900">
                  Require API Key
                </label>
              </div>
              <div>
                <label htmlFor="security.ipWhitelist" className="block text-sm font-medium text-gray-700">
                  IP Whitelist (one per line)
                </label>
                <textarea
                  id="security.ipWhitelist"
                  name="security.ipWhitelist"
                  value={apiSettingsData.security.ipWhitelist.join('\n')}
                  onChange={handleApiSettingsChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="security.allowedMethods" className="block text-sm font-medium text-gray-700">
                  Allowed Methods
                </label>
                <select
                  id="security.allowedMethods"
                  name="security.allowedMethods"
                  multiple
                  value={apiSettingsData.security.allowedMethods}
                  onChange={handleApiSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
            </div>
          </div>

          {/* Monitoring Settings Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Monitoring</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="monitoring.enabled"
                  name="monitoring.enabled"
                  checked={apiSettingsData.monitoring.enabled}
                  onChange={handleApiSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="monitoring.enabled" className="ml-2 block text-sm text-gray-900">
                  Enable Monitoring
                </label>
              </div>
              <div>
                <label htmlFor="monitoring.logLevel" className="block text-sm font-medium text-gray-700">
                  Log Level
                </label>
                <select
                  id="monitoring.logLevel"
                  name="monitoring.logLevel"
                  value={apiSettingsData.monitoring.logLevel}
                  onChange={handleApiSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documentation Settings Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Documentation</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="documentation.enabled"
                  name="documentation.enabled"
                  checked={apiSettingsData.documentation.enabled}
                  onChange={handleApiSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="documentation.enabled" className="ml-2 block text-sm text-gray-900">
                  Enable Documentation
                </label>
              </div>
              <div>
                <label htmlFor="documentation.version" className="block text-sm font-medium text-gray-700">
                  API Version
                </label>
                <input
                  type="text"
                  id="documentation.version"
                  name="documentation.version"
                  value={apiSettingsData.documentation.version}
                  onChange={handleApiSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="documentation.basePath" className="block text-sm font-medium text-gray-700">
                  Base Path
                </label>
                <input
                  type="text"
                  id="documentation.basePath"
                  name="documentation.basePath"
                  value={apiSettingsData.documentation.basePath}
                  onChange={handleApiSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleBackupSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const [section, field, subfield] = name.split('.');

    setBackupSettingsData(prev => {
      const sectionData = prev[section as keyof BackupSettingsData];
      if (!sectionData) return prev;

      return {
        ...prev,
        [section]: {
          ...sectionData,
          ...(subfield ? {
            [field]: {
              ...(sectionData as any)[field],
              [subfield]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? Number(value) : value
            }
          } : {
            [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? Number(value) : value
          })
        }
      };
    });
  };

  const handleCreateBackup = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const response = await createBackup(user._id);
      toast.success('Backup started successfully');
      // Update last backup info
      setBackupSettingsData(prev => ({
        ...prev,
        lastBackup: {
          id: response.data.backupId,
          timestamp: new Date().toISOString(),
          size: 0,
          status: 'in_progress',
          location: ''
        }
      }));
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!user?._id) return;
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) return;

    setLoading(true);
    try {
      await restoreBackup(user._id, backupId);
      toast.success('Backup restored successfully');
      // Refresh backup list
      await loadBackupList();
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!user?._id) return;
    if (!window.confirm('Are you sure you want to delete this backup?')) return;

    setLoading(true);
    try {
      await deleteBackup(user._id, backupId);
      toast.success('Backup deleted successfully');
      // Refresh backup list
      await loadBackupList();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const { location, credentials } = backupSettingsData.storage;

      // Always pass both location and credentials
      await testBackupConnection(user._id, {
        location,
        credentials: credentials || {} // Pass empty object if no credentials
      });

      toast.success(`${location.toUpperCase()} storage connection verified`);
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // const handleValidateSettings = async () => {
  //   if (!user?._id) return;
  //   setLoading(true);
  //   try {
  //     await validateBackupSettings(user._id, backupSettingsData);
  //     toast.success('Settings validation successful');
  //   } catch (error) {
  //     console.error('Error validating settings:', error);
  //     toast.error('Settings validation failed');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadBackupList = async () => {
    if (!user?._id) return;
    try {
      const response = await listBackups(user._id);
      setBackupList(response.data);
    } catch (error) {
      console.error('Error loading backup list:', error);
      toast.error('Failed to load backup list');
    }
  };

  const handleTestPerformanceSettings = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      // Add your performance testing logic here
      await testPerformanceSettings(user._id, {
        poolSize: 10,
        queryTimeout: 30,
        queryCacheEnabled: true
      });
      toast.success('Performance settings tested successfully');
    } catch (error) {
      toast.error('Failed to test performance settings');
      console.error('Error testing performance settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePerformanceSettings = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      // Add your validation logic here
      await validatePerformanceSettings(user._id, {
        poolSize: 10,
        queryTimeout: 30,
        queryCacheEnabled: true
      });
      toast.success('Performance settings validated successfully');
    } catch (error) {
      toast.error('Failed to validate performance settings');
    } finally {
      setLoading(false);
    }
  };

  const renderDatabaseSection = () => (
    <div className="space-y-6">
      {/* Connection Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Connection</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="connection.host" className="block text-sm font-medium text-gray-700">
              Host
            </label>
            <input
              type="text"
              id="connection.host"
              name="connection.host"
              value={databaseSettingsData.connection.host}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="connection.port" className="block text-sm font-medium text-gray-700">
              Port
            </label>
            <input
              type="number"
              id="connection.port"
              name="connection.port"
              value={databaseSettingsData.connection.port}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="connection.database" className="block text-sm font-medium text-gray-700">
              Database Name
            </label>
            <input
              type="text"
              id="connection.database"
              name="connection.database"
              value={databaseSettingsData.connection.database}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="connection.schema" className="block text-sm font-medium text-gray-700">
              Schema
            </label>
            <input
              type="text"
              id="connection.schema"
              name="connection.schema"
              value={databaseSettingsData.connection.schema}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Configuration</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="backup.schedule" className="block text-sm font-medium text-gray-700">
              Backup Schedule
            </label>
            <select
              id="backup.schedule"
              name="backup.schedule"
              value={databaseSettingsData.backup.schedule}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label htmlFor="backup.retentionDays" className="block text-sm font-medium text-gray-700">
              Retention Period (days)
            </label>
            <input
              type="number"
              id="backup.retentionDays"
              name="backup.retentionDays"
              value={databaseSettingsData.backup.retentionDays}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="backup.compression"
              name="backup.compression"
              checked={databaseSettingsData.backup.compression}
              onChange={handleDatabaseChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="backup.compression" className="ml-2 block text-sm text-gray-900">
              Enable Backup Compression
            </label>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Settings</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="performance.poolSize" className="block text-sm font-medium text-gray-700">
              Connection Pool Size
            </label>
            <input
              type="number"
              id="performance.poolSize"
              name="performance.poolSize"
              value={databaseSettingsData.performance.poolSize}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="performance.queryTimeout" className="block text-sm font-medium text-gray-700">
              Query Timeout (seconds)
            </label>
            <input
              type="number"
              id="performance.queryTimeout"
              name="performance.queryTimeout"
              value={databaseSettingsData.performance.queryTimeout}
              onChange={handleDatabaseChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="performance.queryCacheEnabled"
              name="performance.queryCacheEnabled"
              checked={databaseSettingsData.performance.queryCacheEnabled}
              onChange={handleDatabaseChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="performance.queryCacheEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Query Cache
            </label>
          </div>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Maintenance</h3>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => handleDatabaseMaintenance('vacuum')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Running...' : 'Run VACUUM'}
            </button>
            <button
              onClick={() => handleDatabaseMaintenance('analyze')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Running...' : 'Run ANALYZE'}
            </button>
            <button
              onClick={() => handleDatabaseMaintenance('export')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Running...' : 'Export Schema'}
            </button>
          </div>
          <p className="text-sm text-gray-500">
            These maintenance operations help optimize database performance and ensure data integrity.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
        <button
          type="button"
          className="btn btn-primary flex items-center"
          onClick={handleSave}
          disabled={loading}
        >
          <Save size={18} className="mr-2" />
          {loading ? 'Saving...' : 'Save Database Settings'}
        </button>
      </div>

    </div>
  );

  const handleNewUserCompanySelect = (companyId: string) => {
    setNewUser(prev => ({
      ...prev,
      companyId
    }));
  };

  // Utility to check for plain object
  const isPlainObject = (obj: any): obj is object => obj !== null && typeof obj === 'object' && !Array.isArray(obj);

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isSelectMultiple = (el: any): el is HTMLSelectElement => el && el.multiple;

    // Helper to get array of selected values for multi-select
    const getSelectedValues = (options: HTMLCollectionOf<HTMLOptionElement>) =>
      Array.from(options)
        .filter(option => option.selected)
        .map(option => option.value);

    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      if (grandchild) {
        // For deeply nested fields like parameters.dateRange.start
        setNewReport(prev => {
          const parentValue = prev[parent as keyof Report];
          const parentObj = isPlainObject(parentValue) ? parentValue : {};
          const childValue = (parentObj as any)[child];
          const childObj = isPlainObject(childValue) ? childValue : {};
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: {
                ...childObj,
                [grandchild]: isCheckbox ? (e.target as HTMLInputElement).checked : value
              }
            }
          };
        });
      } else {
        setNewReport(prev => {
          const parentValue = prev[parent as keyof Report];
          const parentObj = isPlainObject(parentValue) ? parentValue : {};
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: isSelectMultiple(e.target) ? getSelectedValues((e.target as HTMLSelectElement).options) : (isCheckbox ? (e.target as HTMLInputElement).checked : value)
            }
          };
        });
      }
    } else {
      setNewReport(prev => ({
        ...prev,
        [name]: isSelectMultiple(e.target) ? getSelectedValues((e.target as HTMLSelectElement).options) : (isCheckbox ? (e.target as HTMLInputElement).checked : value)
      }));
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setNewReport(report);
    setShowAddReport(true);
  };

  const handleDeleteReport = async (report: Report) => {
    setReportToDelete(report);
    setShowDeleteConfirmation(true);
  };

  // Update handleReportSubmit to handle both create and edit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?._id) {
        throw new Error('User ID is required');
      }

      const response = await updateReportSettings(user._id, {
        action: editingReport ? 'update' : 'create',
        report: newReport
      });

      if (response.status === 200) {
        if (editingReport) {
          setReports(reports.map(r => r._id === editingReport._id ? newReport : r));
        } else {
          setReports([...reports, newReport]);
        }

        setNewReport({
          name: '',
          category: 'Case Reports',
          description: '',
          schedule: {
            frequency: 'weekly',
            time: '09:00'
          },
          content: {
            caseStatusSummary: false,
            financialSummary: false,
            staffPerformance: false
          },
          recipients: [],
          format: 'PDF',
          parameters: {
            dateRange: {
              start: '',
              end: ''
            },
            caseStatus: [],
            caseType: [],
            assignedTo: [],
            priority: [],
            customFields: []
          },
          filters: {
            dateRange: {
              start: '',
              end: ''
            },
            caseStatus: [],
            caseType: [],
            assignedTo: [],
            priority: [],
            customFields: []
          },
          exportOptions: {
            includeCharts: true,
            includeTables: true,
            includeSummary: true,
            includeDetails: false,
            includeAttachments: false
          },
          deliveryMethod: 'email',
          emailTemplate: 'default',
          fileNameFormat: '{report_name}_{date}',
          compression: false,
          passwordProtection: false
        });
        setEditingReport(null);
        setShowAddReport(false);
      }
    } catch (error) {
      console.error('Error updating report settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReportSettingsForm = () => (
    <form onSubmit={handleReportSubmit} className="space-y-6">

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Report Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newReport.name}
            onChange={handleReportChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            name="category"
            value={newReport.category}
            onChange={handleReportChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="Case Reports">Case Reports</option>
            <option value="Financial Reports">Financial Reports</option>
            <option value="Performance Reports">Performance Reports</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            value={newReport.description}
            onChange={handleReportChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Schedule</h3>
        <div>
          <label htmlFor="schedule.frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
          <select
            id="schedule.frequency"
            name="schedule.frequency"
            value={newReport.schedule.frequency}
            onChange={handleReportChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div>
          <label htmlFor="schedule.time" className="block text-sm font-medium text-gray-700">Time</label>
          <input
            type="time"
            id="schedule.time"
            name="schedule.time"
            value={newReport.schedule.time}
            onChange={handleReportChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Content</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="content.caseStatusSummary"
              name="content.caseStatusSummary"
              checked={newReport.content.caseStatusSummary}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="content.caseStatusSummary" className="ml-2 block text-sm text-gray-700">Case Status Summary</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="content.financialSummary"
              name="content.financialSummary"
              checked={newReport.content.financialSummary}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="content.financialSummary" className="ml-2 block text-sm text-gray-700">Financial Summary</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="content.staffPerformance"
              name="content.staffPerformance"
              checked={newReport.content.staffPerformance}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="content.staffPerformance" className="ml-2 block text-sm text-gray-700">Staff Performance</label>
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recipients</h3>
        <div>
          <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">Email Addresses</label>
          <input
            type="text"
            id="recipients"
            name="recipients"
            value={newReport.recipients.join(', ')}
            onChange={(e) => {
              const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
              setNewReport(prev => ({
                ...prev,
                recipients: emails
              }));
            }}
            placeholder="Enter email addresses separated by commas"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Format and Delivery */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Format and Delivery</h3>
        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700">Format</label>
          <select
            id="format"
            name="format"
            value={newReport.format}
            onChange={handleReportChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="PDF">PDF</option>
            <option value="Excel">Excel</option>
            <option value="CSV">CSV</option>
            <option value="HTML">HTML</option>
          </select>
        </div>
        <div>
          <label htmlFor="deliveryMethod" className="block text-sm font-medium text-gray-700">Delivery Method</label>
          <select
            id="deliveryMethod"
            name="deliveryMethod"
            value={newReport.deliveryMethod}
            onChange={handleReportChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="email">Email</option>
            <option value="download">Download</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label htmlFor="emailTemplate" className="block text-sm font-medium text-gray-700">Email Template</label>
          <select
            id="emailTemplate"
            name="emailTemplate"
            value={newReport.emailTemplate}
            onChange={handleReportChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="default">Default Template</option>
            <option value="custom">Custom Template</option>
          </select>
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                name="parameters.dateRange.start"
                value={newReport.parameters.dateRange.start}
                onChange={handleReportChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <input
                type="date"
                name="parameters.dateRange.end"
                value={newReport.parameters.dateRange.end}
                onChange={handleReportChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Case Status</label>
            <select
              multiple
              name="parameters.caseStatus"
              value={newReport.parameters.caseStatus}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Case Type</label>
            <select
              multiple
              name="parameters.caseType"
              value={newReport.parameters.caseType}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="immigration">Immigration</option>
              <option value="family">Family</option>
              <option value="criminal">Criminal</option>
              <option value="civil">Civil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <select
              multiple
              name="parameters.assignedTo"
              value={newReport.parameters.assignedTo}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {/* Add your staff list here */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              multiple
              name="parameters.priority"
              value={newReport.parameters.priority}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
            <select
              multiple
              name="parameters.customFields"
              value={newReport.parameters.customFields}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {/* Add your custom fields here */}
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Filters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                name="filters.dateRange.start"
                value={newReport.filters.dateRange.start}
                onChange={handleReportChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <input
                type="date"
                name="filters.dateRange.end"
                value={newReport.filters.dateRange.end}
                onChange={handleReportChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Case Status</label>
            <select
              multiple
              name="filters.caseStatus"
              value={newReport.filters.caseStatus}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Case Type</label>
            <select
              multiple
              name="filters.caseType"
              value={newReport.filters.caseType}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="immigration">Immigration</option>
              <option value="family">Family</option>
              <option value="criminal">Criminal</option>
              <option value="civil">Civil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <select
              multiple
              name="filters.assignedTo"
              value={newReport.filters.assignedTo}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {/* Add your staff list here */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              multiple
              name="filters.priority"
              value={newReport.filters.priority}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
            <select
              multiple
              name="filters.customFields"
              value={newReport.filters.customFields}
              onChange={handleReportChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {/* Add your custom fields here */}
            </select>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Export Options</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="exportOptions.includeCharts"
              name="exportOptions.includeCharts"
              checked={newReport.exportOptions.includeCharts}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="exportOptions.includeCharts" className="ml-2 block text-sm text-gray-700">Include Charts</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="exportOptions.includeTables"
              name="exportOptions.includeTables"
              checked={newReport.exportOptions.includeTables}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="exportOptions.includeTables" className="ml-2 block text-sm text-gray-700">Include Tables</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="exportOptions.includeSummary"
              name="exportOptions.includeSummary"
              checked={newReport.exportOptions.includeSummary}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="exportOptions.includeSummary" className="ml-2 block text-sm text-gray-700">Include Summary</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="exportOptions.includeDetails"
              name="exportOptions.includeDetails"
              checked={newReport.exportOptions.includeDetails}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="exportOptions.includeDetails" className="ml-2 block text-sm text-gray-700">Include Details</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="exportOptions.includeAttachments"
              name="exportOptions.includeAttachments"
              checked={newReport.exportOptions.includeAttachments}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="exportOptions.includeAttachments" className="ml-2 block text-sm text-gray-700">Include Attachments</label>
          </div>
        </div>
      </div>

      {/* File Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">File Settings</h3>
        <div>
          <label htmlFor="fileNameFormat" className="block text-sm font-medium text-gray-700">File Name Format</label>
          <input
            type="text"
            id="fileNameFormat"
            name="fileNameFormat"
            value={newReport.fileNameFormat}
            onChange={handleReportChange}
            placeholder="e.g., {report_name}_{date}"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Use {'{date}'} for current date, {'{name}'} for report name</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="compression"
              name="compression"
              checked={newReport.compression}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="compression" className="ml-2 block text-sm text-gray-700">Enable Compression</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="passwordProtection"
              name="passwordProtection"
              checked={newReport.passwordProtection}
              onChange={handleReportChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="passwordProtection" className="ml-2 block text-sm text-gray-700">Enable Password Protection</label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-5 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setShowAddReport(false)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Saving...' : editingReport ? 'Update Report' : 'Create Report'}
        </button>
      </div>

    </form>
  );

  const handleAuditLogsFilter = async () => {
    try {
      // Validate required fields
      if (!auditLogsData.filters.dateRange?.start || !auditLogsData.filters.dateRange?.end) {
        console.error('Date range is required');
        return;
      }

      if (!auditLogsData.filters.eventTypes?.length) {
        console.error('At least one event type must be selected');
        return;
      }

      if (!auditLogsData.filters.users?.length) {
        console.error('At least one user must be selected');
        return;
      }

      if (!auditLogsData.filters.ipAddresses?.length) {
        console.error('At least one IP address must be specified');
        return;
      }

      const response = await filterAuditLogs(user?._id || '', {
        dateRange: auditLogsData.filters.dateRange,
        eventTypes: auditLogsData.filters.eventTypes,
        users: auditLogsData.filters.users,
        ipAddresses: auditLogsData.filters.ipAddresses
      });

      if (response.status === 200) {
        console.log('Audit logs filtered successfully');
        // Handle the filtered results here
      }
    } catch (error) {
      console.error('Error filtering audit logs:', error);
    }
  };

  const handleAuditLogsExport = async () => {
    try {
      const response = await exportAuditLogs(user?._id || '', auditLogsData.export);
      if (response.status === 200) {
        const blob = new Blob([response.data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString()}.${auditLogsData.export.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  const handleAuditLogsArchive = async () => {
    try {
      const response = await archiveAuditLogs(user?._id || '', {
        dateRange: auditLogsData.filters.dateRange,
        storageLocation: auditLogsData.logging.storageLocation
      });
      if (response.status === 200) console.log('Audit logs archived successfully');
    } catch (error) {
      console.error('Error archiving audit logs:', error);
    }
  };

  const handleRoleSelect = async (role: Role) => {
    try {
      const response = await getPermissions(role._id!);
      if (response.data) {
        setSelectedRole({ ...role, permissions: response.data.permissions });
      }
    } catch (error) {
      enqueueSnackbar('Failed to load role permissions', { variant: 'error' });
    }
    setIsEditMode(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedRole(roles.find(r => r._id === selectedRole?._id) || null);
  };

  const handleSaveRole = async () => {
    if (!user?._id) return;
    if (!selectedRole) return;

    try {
      const [roleResponse, permissionsResponse] = await Promise.all([
        updateRole(user._id,selectedRole._id!, selectedRole),
        updatePermissions({ permissions: selectedRole.permissions, roleId: selectedRole._id! })
      ]);

      if (roleResponse.data && permissionsResponse.data) {
        setRoles(roles.map(r => r._id === roleResponse.data._id ? roleResponse.data : r));
        setIsEditMode(false);
        enqueueSnackbar('Role updated successfully', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to update role', { variant: 'error' });
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleRoleConfirmDelete = async () => {
    if (!selectedRole?._id) return;

    try {
      await deleteRole(selectedRole._id);
      setRoles(roles.filter(r => r._id !== selectedRole._id));
      setSelectedRole(null);
      setIsDeleteDialogOpen(false);
      enqueueSnackbar('Role deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete role', { variant: 'error' });
    }
  };

  const handleNewRoleClick = () => {
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[newRole.type as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
    setNewRole({
      name: '',
      type: 'STAFF',
      description: '',
      permissions: Object.entries(defaultPermissions).map(([module, actions]) => ({
        module: module as keyof typeof PERMISSION_MODULES,
        actions: actions as Array<keyof typeof PERMISSION_ACTIONS>
      })),
      isDefault: false,
    });
    setIsNewRoleDialogOpen(true);
  };

  const handleCreateRole = async () => {
    try {
      const response = await createRole(newRole as Role);
      if (response.data) {
        setRoles([...roles, response.data]);
        setIsNewRoleDialogOpen(false);
        enqueueSnackbar('Role created successfully', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to create role', { variant: 'error' });
    }
  };

  const handlePermissionChange = (module: keyof typeof PERMISSION_MODULES, action: keyof typeof PERMISSION_ACTIONS) => {
    if (!selectedRole) return;

    const updatedPermissions = [...selectedRole.permissions];
    const moduleIndex = updatedPermissions.findIndex(p => p.module === module);

    if (moduleIndex === -1) {
      updatedPermissions.push({
        module,
        actions: [action],
      });
    } else {
      const actionIndex = updatedPermissions[moduleIndex].actions.indexOf(action);
      if (actionIndex === -1) {
        updatedPermissions[moduleIndex].actions.push(action);
      } else {
        updatedPermissions[moduleIndex].actions.splice(actionIndex, 1);
        if (updatedPermissions[moduleIndex].actions.length === 0) {
          updatedPermissions.splice(moduleIndex, 1);
        }
      }
    }

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions,
    });
  };

  const renderPermissionsTable = () => {
    if (!selectedRole) return null;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Module</TableCell>
              {Object.values(PERMISSION_ACTIONS).map(action => (
                <TableCell key={action} align="center">
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.values(PERMISSION_MODULES).map(module => (
              <TableRow key={module}>
                <TableCell>{module.charAt(0).toUpperCase() + module.slice(1)}</TableCell>
                {Object.values(PERMISSION_ACTIONS).map(action => (
                  <TableCell key={action} align="center">
                    <Checkbox
                      checked={selectedRole.permissions.some(
                        p => p.module === module.toUpperCase() && p.actions.includes(action.toUpperCase() as keyof typeof PERMISSION_ACTIONS)
                      )}
                      onChange={() => handlePermissionChange(module.toUpperCase() as keyof typeof PERMISSION_MODULES, action.toUpperCase() as keyof typeof PERMISSION_ACTIONS)}
                      disabled={!isEditMode}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderRolePermissions = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">Roles & Permissions</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNewRoleClick}
            >
              New Role
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Roles
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {roles.map(role => (
                  <Paper
                    key={role._id}
                    sx={{
                      p: 2,
                      mb: 1,
                      cursor: 'pointer',
                      bgcolor: selectedRole?._id === role._id ? 'action.selected' : 'background.paper',
                    }}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1">{role.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                      {role.isDefault && (
                        <Chip label="Default" size="small" color="primary" />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedRole ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {isEditMode ? 'Edit Role' : 'Role Details'}
                  </Typography>
                  <Box>
                    {isEditMode ? (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveRole}
                          sx={{ mr: 1 }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={handleEditClick}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={handleDeleteClick}
                          disabled={selectedRole.isDefault}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>

                {isEditMode ? (
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Role Name"
                          value={selectedRole.name}
                          onChange={(e) =>
                            setSelectedRole({ ...selectedRole, name: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Role Type</InputLabel>
                          <Select
                            value={selectedRole.type}
                            label="Role Type"
                            onChange={(e) =>
                              setSelectedRole({
                                ...selectedRole,
                                type: e.target.value as keyof typeof ROLE_TYPES,
                              })
                            }
                          >
                            {Object.entries(ROLE_TYPES).map(([key, value]) => (
                              <MenuItem key={key} value={key}>
                                {value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={selectedRole.description}
                          onChange={(e) =>
                            setSelectedRole({ ...selectedRole, description: e.target.value })
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Name: {selectedRole.name}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Type: {selectedRole.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Description: {selectedRole.description}
                    </Typography>
                  </Box>
                )}

                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                {renderPermissionsTable()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center">
                  Select a role to view its details and permissions
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* New Role Dialog */}
      <Dialog open={isNewRoleDialogOpen} onClose={() => setIsNewRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid component="div" item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </Grid>
              <Grid component="div" item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role Type</InputLabel>
                  <Select
                    value={newRole.type}
                    label="Role Type"
                    onChange={(e) =>
                      setNewRole({
                        ...newRole,
                        type: e.target.value as keyof typeof ROLE_TYPES,
                      })
                    }
                  >
                    {Object.entries(ROLE_TYPES).map(([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid component="div" item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                />
              </Grid>
              <Grid component="div" item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newRole.isDefault}
                      onChange={(e) => setNewRole({ ...newRole, isDefault: e.target.checked })}
                    />
                  }
                  label="Set as Default Role"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRole}
            variant="contained"
            color="primary"
            disabled={!newRole.name || !newRole.type}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRoleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <nav className="space-y-1">
          {navigationItems
            .filter(item => {
              if (isSuperAdmin) return true;
              if (isAttorney) return !item.adminOnly || item.attorneyAllowed;
              return !item.adminOnly && !item.attorneyAllowed;
            })
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === item.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${activeTab === item.id ? 'text-primary-500' : 'text-gray-400'
                    }`}
                />
                <span>{item.name}</span>
                <ChevronRight
                  className={`ml-auto h-5 w-5 ${activeTab === item.id ? 'text-primary-500' : 'text-gray-400'
                    }`}
                />
              </button>
            ))}
        </nav>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-md rounded-lg">

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-12 w-12 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoChange}
                          className="hidden"
                          id="profile-photo"
                        />
                        <label
                          htmlFor="profile-photo"
                          className="btn btn-outline cursor-pointer"
                        >
                          Change Photo
                        </label>
                        <p className="mt-1 text-sm text-gray-500">JPG, GIF or PNG. Max size of 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          className="mt-1 form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          className="mt-1 form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className="mt-1 form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="mt-1 form-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <textarea
                        rows={4}
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        className="mt-1 form-input"
                      ></textarea>
                    </div>

                  </div>
                </div>

                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleProfileSubmit}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Organization Settings */}
            {activeTab === 'organization' && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Organization Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Building className="h-12 w-12 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleOrganizationLogoChange}
                          className="hidden"
                          id="organization-logo"
                        />
                        <label
                          htmlFor="organization-logo"
                          className="btn btn-outline cursor-pointer"
                        >
                          Change Logo
                        </label>
                        <p className="mt-1 text-sm text-gray-500">JPG, GIF or PNG. Max size of 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                        <input
                          type="text"
                          name="organizationName"
                          value={organizationData.organizationName}
                          onChange={handleOrganizationChange}
                          className="mt-1 form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Legal Name</label>
                        <input
                          type="text"
                          name="legalName"
                          value={organizationData.legalName}
                          onChange={handleOrganizationChange}
                          className="mt-1 form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                        <input
                          type="text"
                          name="taxId"
                          value={organizationData.taxId}
                          onChange={handleOrganizationChange}
                          className="mt-1 form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <input
                          type="url"
                          name="website"
                          value={organizationData.website}
                          onChange={handleOrganizationChange}
                          className="mt-1 form-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <textarea
                        rows={3}
                        name="address"
                        value={organizationData.address}
                        onChange={handleOrganizationChange}
                        className="mt-1 form-input"
                      ></textarea>
                    </div>

                  </div>
                </div>
                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleOrganizationSubmit}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        <div key="case-updates" className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Case Updates</p>
                            <p className="text-xs text-gray-500">Get notified when cases are updated</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="caseUpdates"
                              checked={notificationData.caseUpdates}
                              onChange={handleNotificationChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        <div key="document-alerts" className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Document Alerts</p>
                            <p className="text-xs text-gray-500">Get notified about new documents</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="documentAlerts"
                              checked={notificationData.documentAlerts}
                              onChange={handleNotificationChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">In-App Notifications</h3>
                      <div className="space-y-4">
                        <div key="task-reminders" className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Task Reminders</p>
                            <p className="text-xs text-gray-500">Get reminded about upcoming tasks</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="taskReminders"
                              checked={notificationData.taskReminders}
                              onChange={handleNotificationChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleNotificationSubmit}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && renderSecuritySection()}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Email Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Email Templates</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Welcome Email</p>
                            <p className="text-xs text-gray-500">Sent to new clients</p>
                          </div>
                          <textarea
                            name="templates.welcome"
                            value={emailData.templates.welcome}
                            onChange={handleEmailChange}
                            className="form-input"
                            rows={3}
                          ></textarea>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Case Update Email</p>
                            <p className="text-xs text-gray-500">Sent when case status changes</p>
                          </div>
                          <textarea
                            name="templates.caseUpdate"
                            value={emailData.templates.caseUpdate}
                            onChange={handleEmailChange}
                            className="form-input"
                            rows={3}
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Email Signature</h3>
                      <div className="space-y-4">
                        <textarea rows={4} className="form-input" placeholder="Enter your email signature..."></textarea>
                        <button className="btn btn-outline">Save Signature</button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleEmailSubmit}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Integrations</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div key="google-calendar" className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Globe className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Google Calendar</p>
                              <p className="text-xs text-gray-500">Sync your calendar</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="googleCalendar"
                              checked={integrationData.googleCalendar}
                              onChange={handleIntegrationChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>

                      <div key="gmail" className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Mail className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Gmail</p>
                              <p className="text-xs text-gray-500">Connect your email</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="gmail"
                              checked={integrationData.gmail}
                              onChange={handleIntegrationChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleIntegrationSubmit}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Billing Settings */}
            {activeTab === 'billing' && renderBillingSection()}

            {/* User Management */}
            {activeTab === 'users' && (isSuperAdmin || isAttorney) && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">User Management</h2>
                  <div className="space-y-6">

                    {/* Search and Add User */}
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="form-input w-full"
                        />
                      </div>
                      {isSuperAdmin && (
                        <div className="relative ml-4">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              className="btn btn-outline flex items-center min-w-[200px] justify-between"
                              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                            >
                              <span className="truncate">{companySearchTerm}</span>
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </button>
                            {selectedCompanyId && (
                              <button
                                onClick={clearCompanyFilter}
                                className="btn btn-outline text-red-600 hover:text-red-700"
                                title="Clear filter"
                              >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {showCompanyDropdown && (
                            <div
                              ref={companyDropdownRef}
                              className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                            >
                              <div className="p-2">
                                <input
                                  type="text"
                                  placeholder="Search companies..."
                                  value={companySearchTerm === 'All Companies' ? '' : companySearchTerm}
                                  onChange={(e) => setCompanySearchTerm(e.target.value)}
                                  className="form-input w-full mb-2"
                                />
                                <div className="max-h-60 overflow-y-auto">
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => handleCompanySelect('', 'All Companies')}
                                  >
                                    All Companies
                                  </button>
                                  {filteredCompanies.map((company) => (
                                    <button
                                      key={company._id}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      onClick={() => handleCompanySelect(company._id, company.name)}
                                    >
                                      {company.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(isSuperAdmin || isAttorney) && (
                        <button
                          className="btn btn-primary ml-4"
                          onClick={() => setShowAddUser(true)}
                        >
                          Add User
                        </button>
                      )}
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Total Users</p>
                        <p className="text-2xl font-semibold">
                          {isLoadingUsers ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            userCompany?.users ?
                              (userCompany.users.attorneys?.length || 0) +
                              (userCompany.users.paralegals?.length || 0) +
                              (userCompany.users.clients?.length || 0)
                              : usersData.totalUsers
                          )}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Active Users</p>
                        <p className="text-2xl font-semibold">
                          {isLoadingUsers ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            userCompany?.users ?
                              (userCompany.users.attorneys?.length || 0) +
                              (userCompany.users.paralegals?.length || 0) +
                              (userCompany.users.clients?.length || 0)
                              : usersData.activeUsers
                          )}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Inactive Users</p>
                        <p className="text-2xl font-semibold">
                          {isLoadingUsers ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            userCompany?.users ? 0 : usersData.totalUsers - usersData.activeUsers
                          )}
                        </p>
                      </div>
                      {!isSuperAdmin && (
                        <div className="bg-white p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-500">User Limit</p>
                          <p className="text-2xl font-semibold">
                            {isLoadingUsers ? (
                              <span className="animate-pulse">Loading...</span>
                            ) : (
                              userCompany?.userLimit || 'N/A'
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Users List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {isLoadingUsers ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center">
                                <div className="flex justify-center items-center space-x-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                  <span>Loading users...</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            usersData.users
                              .filter(user => !isSuperAdmin || user.role === 'attorney')
                              .map((user) => (
                                <tr key={user._id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                          <User className="h-6 w-6 text-gray-400" />
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : ''}
                          ${user.role === 'attorney' ? 'bg-blue-100 text-blue-800' : ''}
                          ${user.role === 'paralegal' ? 'bg-green-100 text-green-800' : ''}
                          ${user.role === 'client' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {(isSuperAdmin || (isAttorney && user.role !== 'superadmin' && user.role !== 'attorney')) && (
                                      <div className="flex justify-end space-x-2">
                                        <button
                                          onClick={() => handleEditUser(user)}
                                          className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                          <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(user._id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          <Trash2 className="h-5 w-5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Add User Modal */}
                {showAddUser && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                      <form onSubmit={handleAddUser}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={newUser.firstName}
                              onChange={handleNewUserChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={newUser.lastName}
                              onChange={handleNewUserChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                              type="email"
                              name="email"
                              value={newUser.email}
                              onChange={handleNewUserChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>

                          {isSuperAdmin ? (
                            <CompanySelect
                              onCompanySelect={handleNewUserCompanySelect}
                              selectedCompanyId={newUser.companyId}
                              className="mb-4"
                              userId={user?._id || ''}
                            />
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Company</label>
                              <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2">
                                {userCompany?.name || 'Your Company'}
                              </div>
                              <input type="hidden" name="companyId" value={userCompany?._id || ''} />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select
                              name="role"
                              value={newUser.role}
                              onChange={handleNewUserChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select a role</option>
                              {isSuperAdmin ? (
                                <option value="attorney">Attorney</option>
                              ) : isAttorney ? (
                                <>
                                  <option value="paralegal">Paralegal</option>
                                  <option value="client">Client</option>
                                </>
                              ) : null}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                              type="password"
                              name="password"
                              value={newUser.password}
                              onChange={handleNewUserChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required
                              minLength={8}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={newUser.confirmPassword}
                              onChange={handleNewUserChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required
                              minLength={8}
                            />
                          </div>

                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowAddUser(false)}
                              className="btn btn-secondary"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                            >
                              Add User
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Edit User Modal */}
                {editingUser && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                      <div className="mt-3">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
                        <form onSubmit={handleUpdateUser}>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">First Name</label>
                              <input
                                type="text"
                                value={editingUser.firstName}
                                onChange={(e) => setEditingUser(prev => ({ ...prev!, firstName: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Last Name</label>
                              <input
                                type="text"
                                value={editingUser.lastName}
                                onChange={(e) => setEditingUser(prev => ({ ...prev!, lastName: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Email</label>
                              <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) => setEditingUser(prev => ({ ...prev!, email: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Role</label>
                              <select
                                value={editingUser.role}
                                onChange={(e) => setEditingUser(prev => ({ ...prev!, role: e.target.value as any }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              >
                                {isSuperAdmin ? (
                                  <>
                                    <option value="attorney">Attorney</option>
                                    <option value="paralegal">Paralegal</option>
                                    <option value="client">Client</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="paralegal">Paralegal</option>
                                    <option value="client">Client</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Status</label>
                              <select
                                value={editingUser.active ? 'active' : 'inactive'}
                                onChange={(e) => setEditingUser(prev => ({ ...prev!, active: e.target.value === 'active' }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-5 flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setEditingUser(null)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              disabled={loading}
                            >
                              {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add this for delete confirmation */}
                {showDeleteConfirmation && userToDelete && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                      <div className="mt-3">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                        <p className="text-gray-500">
                          Are you sure you want to delete {usersData.users.find(u => u._id === userToDelete)?.name}? This action cannot be undone.
                        </p>
                        <div className="mt-5 flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setShowDeleteConfirmation(false);
                              setUserToDelete(null);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            disabled={loading}
                          >
                            {loading ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Case Settings */}
            {activeTab === 'cases' && (isSuperAdmin || isAttorney) && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Case Settings</h2>
                  <div className="space-y-6">
                    {/* Categories Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Case Categories</h3>
                        <button
                          className="btn btn-outline text-xs py-1"
                          onClick={() => setShowAddCategory(true)}
                        >
                          Add Category
                        </button>
                      </div>
                      <div className="space-y-4">
                        {caseSettingsData.categories.map((category) => (
                          <div key={category.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{category.name}</p>
                                <p className="text-xs text-gray-500">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-gray-400 hover:text-gray-500">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-gray-400 hover:text-gray-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Statuses Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Case Statuses</h3>
                        <button
                          className="btn btn-outline text-xs py-1"
                          onClick={() => setShowAddStatus(true)}
                        >
                          Add Status
                        </button>
                      </div>
                      <div className="space-y-4">
                        {caseSettingsData.statuses.map((status) => (
                          <div key={status.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{status.name}</p>
                                <p className="text-xs text-gray-500">{status.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-gray-400 hover:text-gray-500">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-gray-400 hover:text-gray-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Default Settings Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Default Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Auto-assign Cases</p>
                            <p className="text-xs text-gray-500">Automatically assign new cases to available attorneys</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={caseSettingsData.defaultSettings.autoAssign}
                              onChange={(e) => setCaseSettingsData(prev => ({
                                ...prev,
                                defaultSettings: {
                                  ...prev.defaultSettings,
                                  autoAssign: e.target.checked
                                }
                              }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Notify on Status Change</p>
                            <p className="text-xs text-gray-500">Send notifications when case status changes</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={caseSettingsData.defaultSettings.notifyOnStatusChange}
                              onChange={(e) => setCaseSettingsData(prev => ({
                                ...prev,
                                defaultSettings: {
                                  ...prev.defaultSettings,
                                  notifyOnStatusChange: e.target.checked
                                }
                              }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Require Document Upload</p>
                            <p className="text-xs text-gray-500">Require document upload for new cases</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={caseSettingsData.defaultSettings.requireDocumentUpload}
                              onChange={(e) => setCaseSettingsData(prev => ({
                                ...prev,
                                defaultSettings: {
                                  ...prev.defaultSettings,
                                  requireDocumentUpload: e.target.checked
                                }
                              }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Default Priority</label>
                          <select
                            value={caseSettingsData.defaultSettings.defaultPriority}
                            onChange={(e) => setCaseSettingsData(prev => ({
                              ...prev,
                              defaultSettings: {
                                ...prev.defaultSettings,
                                defaultPriority: e.target.value as 'low' | 'medium' | 'high'
                              }
                            }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Custom Fields Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Custom Fields</h3>
                        <button
                          className="btn btn-outline text-xs py-1"
                          onClick={() => setShowAddField(true)}
                        >
                          Add Field
                        </button>
                      </div>
                      <div className="space-y-4">
                        {caseSettingsData.customFields.map((field) => (
                          <div key={field.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{field.name}</p>
                              <p className="text-xs text-gray-500">
                                Type: {field.type} • Required: {field.required ? 'Yes' : 'No'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-gray-400 hover:text-gray-500">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="text-gray-400 hover:text-gray-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Add Category Modal */}
            {showAddCategory && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Category</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        rows={3}
                        placeholder="Enter category description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Color</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                          className="h-8 w-8 rounded-md border border-gray-300"
                        />
                        <input
                          type="text"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowAddCategory(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setCaseSettingsData(prev => ({
                          ...prev,
                          categories: [...prev.categories, { ...newCategory, id: Date.now().toString() }]
                        }));
                        setNewCategory({ name: '', description: '', color: '#3B82F6' });
                        setShowAddCategory(false);
                      }}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Status Modal */}
            {showAddStatus && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Status</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={newStatus.name}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Enter status name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={newStatus.description}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        rows={3}
                        placeholder="Enter status description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Color</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="color"
                          value={newStatus.color}
                          onChange={(e) => setNewStatus(prev => ({ ...prev, color: e.target.value }))}
                          className="h-8 w-8 rounded-md border border-gray-300"
                        />
                        <input
                          type="text"
                          value={newStatus.color}
                          onChange={(e) => setNewStatus(prev => ({ ...prev, color: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order</label>
                      <input
                        type="number"
                        value={newStatus.order}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowAddStatus(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setCaseSettingsData(prev => ({
                          ...prev,
                          statuses: [...prev.statuses, { ...newStatus, id: Date.now().toString() }]
                        }));
                        setNewStatus({ name: '', description: '', color: '#3B82F6', order: 0 });
                        setShowAddStatus(false);
                      }}
                    >
                      Add Status
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Field Modal */}
            {showAddField && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Custom Field</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Field Name</label>
                      <input
                        type="text"
                        value={newField.name}
                        onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Enter field name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Field Type</label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField(prev => ({
                          ...prev,
                          type: e.target.value as 'text' | 'number' | 'date' | 'select',
                          options: e.target.value === 'select' ? prev.options : []
                        }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                      </select>
                    </div>
                    {newField.type === 'select' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Options</label>
                        <div className="space-y-2">
                          {newField.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...newField.options];
                                  newOptions[index] = e.target.value;
                                  setNewField(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="Enter option"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = newField.options.filter((_, i) => i !== index);
                                  setNewField(prev => ({ ...prev, options: newOptions }));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setNewField(prev => ({ ...prev, options: [...prev.options, ''] }))}
                            className="btn btn-outline text-xs py-1"
                          >
                            Add Option
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="required"
                        checked={newField.required}
                        onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                        Required field
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowAddField(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setCaseSettingsData(prev => ({
                          ...prev,
                          customFields: [...prev.customFields, { ...newField, id: Date.now().toString() }]
                        }));
                        setNewField({ name: '', type: 'text', required: false, options: [] });
                        setShowAddField(false);
                      }}
                    >
                      Add Field
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Templates */}
            {activeTab === 'forms' && (isSuperAdmin || isAttorney) && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Form Templates</h2>
                  <div className="space-y-6">
                    {/* Search and Add Template */}
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search templates..."
                          className="form-input w-full"
                        />
                      </div>
                      <button
                        className="btn btn-primary flex items-center"
                        onClick={() => setShowAddTemplate(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Template
                      </button>
                    </div>

                    {/* Template Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Family-Based</h3>
                        <p className="text-sm text-gray-500">I-130, I-485, I-751</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Employment-Based</h3>
                        <p className="text-sm text-gray-500">I-140, I-765, I-131</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Naturalization</h3>
                        <p className="text-sm text-gray-500">N-400, N-600</p>
                      </div>
                    </div>

                    {/* Templates List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">I-130 Petition</div>
                                  <div className="text-sm text-gray-500">Family-based immigrant petition</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Family-Based
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              2 days ago
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                <button className="text-gray-600 hover:text-gray-900">Preview</button>
                                <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteReport(reports[0])}>Delete</button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">I-485 Application</div>
                                  <div className="text-sm text-gray-500">Application to register permanent residence</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Family-Based
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              1 week ago
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                <button className="text-gray-600 hover:text-gray-900">Preview</button>
                                <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteReport(reports[1])}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Add Template Modal */}
                {showAddTemplate && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Template</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        // Handle form submission
                        setShowAddTemplate(false);
                      }}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Template Name</label>
                            <input
                              type="text"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="e.g., I-130 Petition"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              required
                            >
                              <option value="">Select a category</option>
                              <option value="family">Family-Based</option>
                              <option value="employment">Employment-Based</option>
                              <option value="naturalization">Naturalization</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              rows={3}
                              placeholder="Enter template description"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Template Content</label>
                            <div className="mt-1">
                              <textarea
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                rows={10}
                                placeholder="Enter template content"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Required Documents</label>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Birth Certificate
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Passport
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Marriage Certificate
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setShowAddTemplate(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                          >
                            Create Template
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Report Settings */}
            {activeTab === 'reports' && (isSuperAdmin || isAttorney) && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Report Settings</h2>
                  <div className="space-y-6">
                    {/* Search and Add Report */}
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search reports..."
                          className="form-input w-full"
                        />
                      </div>
                      <button
                        className="btn btn-primary flex items-center"
                        onClick={() => setShowAddReport(true)}
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        Add Report
                      </button>
                    </div>

                    {/* Report Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Case Reports</h3>
                        <p className="text-sm text-gray-500">Status, Progress, Timeline</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Financial Reports</h3>
                        <p className="text-sm text-gray-500">Billing, Payments, Revenue</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Performance Reports</h3>
                        <p className="text-sm text-gray-500">Staff, Workload, Efficiency</p>
                      </div>
                    </div>

                    {/* Reports List */}
                    <div className="mt-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(reports) && reports.map((report, index) => (
                              <tr key={report._id || index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {report.schedule.frequency} at {report.schedule.time}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.format}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <button
                                    onClick={() => handleEditReport(report)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReport(report)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Report Modal */}
                {showAddReport && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    {/* <div className="bg-white rounded-lg p-6 max-w-2xl w-full"></div> */}
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Report</h3>
                      {renderReportSettingsForm()}
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Roles & Permissions */}
            {activeTab === 'roles' && isSuperAdmin && (
              // <RolesPermissionsPage />
              <>
                {renderRolePermissions()}
              </>
            )}

            {/* System Settings */}
            {activeTab === 'system' && isSuperAdmin && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-semibold mb-6">System Settings</h2>

                  {/* Basic System Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Basic Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">System Name</label>
                        <input
                          type="text"
                          name="systemName"
                          value={systemData.systemName}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                        <select
                          name="timeZone"
                          value={systemData.timeZone}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="EST">EST</option>
                          <option value="PST">PST</option>
                          {/* Add more time zones as needed */}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date Format</label>
                        <select
                          name="dateFormat"
                          value={systemData.dateFormat}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Language</label>
                        <select
                          name="language"
                          value={systemData.language}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          {/* Add more languages as needed */}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Maintenance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="maintenance.maintenanceMode"
                          checked={systemData.maintenance.maintenanceMode}
                          onChange={handleSystemChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Enable Maintenance Mode</label>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-md font-medium">Scheduled Maintenance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Start Time</label>
                            <input
                              type="datetime-local"
                              name="maintenance.scheduledMaintenance.startTime"
                              value={systemData.maintenance.scheduledMaintenance.startTime}
                              onChange={handleSystemChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                            <input
                              type="number"
                              name="maintenance.scheduledMaintenance.duration"
                              value={systemData.maintenance.scheduledMaintenance.duration}
                              onChange={handleSystemChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Maintenance Message</label>
                          <textarea
                            name="maintenance.scheduledMaintenance.message"
                            value={systemData.maintenance.scheduledMaintenance.message}
                            onChange={handleSystemChange}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Upload Size (MB)</label>
                        <input
                          type="number"
                          name="performance.maxUploadSize"
                          value={systemData.performance.maxUploadSize}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Concurrent Uploads</label>
                        <input
                          type="number"
                          name="performance.maxConcurrentUploads"
                          value={systemData.performance.maxConcurrentUploads}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          name="performance.sessionTimeout"
                          value={systemData.performance.sessionTimeout}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Idle Timeout (minutes)</label>
                        <input
                          type="number"
                          name="performance.idleTimeout"
                          value={systemData.performance.idleTimeout}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                        <input
                          type="number"
                          name="security.loginAttempts"
                          value={systemData.security.loginAttempts}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Lockout Duration (minutes)</label>
                        <input
                          type="number"
                          name="security.lockoutDuration"
                          value={systemData.security.lockoutDuration}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password Expiry (days)</label>
                        <input
                          type="number"
                          name="security.passwordExpiry"
                          value={systemData.security.passwordExpiry}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="security.sessionManagement.allowMultipleSessions"
                            checked={systemData.security.sessionManagement.allowMultipleSessions}
                            onChange={handleSystemChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">Allow Multiple Sessions</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Concurrent Sessions</label>
                          <input
                            type="number"
                            name="security.sessionManagement.maxConcurrentSessions"
                            value={systemData.security.sessionManagement.maxConcurrentSessions}
                            onChange={handleSystemChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifications.systemAlerts"
                          checked={systemData.notifications.systemAlerts}
                          onChange={handleSystemChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">System Alerts</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifications.maintenanceNotifications"
                          checked={systemData.notifications.maintenanceNotifications}
                          onChange={handleSystemChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Maintenance Notifications</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifications.errorNotifications"
                          checked={systemData.notifications.errorNotifications}
                          onChange={handleSystemChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Error Notifications</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notification Recipients</label>
                        <input
                          type="text"
                          name="notifications.recipients"
                          value={systemData.notifications.recipients.join(', ')}
                          onChange={handleSystemChange}
                          placeholder="Enter email addresses separated by commas"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logging Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Logging</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="logging.enabled"
                          checked={systemData.logging.enabled}
                          onChange={handleSystemChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Enable Logging</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Log Level</label>
                        <select
                          name="logging.level"
                          value={systemData.logging.level}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="debug">Debug</option>
                          <option value="info">Info</option>
                          <option value="warn">Warning</option>
                          <option value="error">Error</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
                        <input
                          type="number"
                          name="logging.retention"
                          value={systemData.logging.retention}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Log Format</label>
                        <select
                          name="logging.format"
                          value={systemData.logging.format}
                          onChange={handleSystemChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="json">JSON</option>
                          <option value="text">Text</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="logging.includeStackTraces"
                          checked={systemData.logging.includeStackTraces}
                          onChange={handleSystemChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Include Stack Traces</label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleMaintenance('cache')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Clear Cache
                    </button>
                    <button
                      onClick={() => handleMaintenance('database')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Optimize Database
                    </button>
                    <button
                      onClick={handleSystemSubmit}
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Audit Logs</h2>
                  <div className="space-y-6">
                    {/* Search and Export */}
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search logs..."
                          className="form-input w-full"
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                              type="date"
                              name="filters.dateRange.start"
                              value={auditLogsData.filters?.dateRange?.start || ''}
                              onChange={handleAuditLogsChange}
                              className="mt-1 form-input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                              type="date"
                              name="filters.dateRange.end"
                              value={auditLogsData.filters?.dateRange?.end || ''}
                              onChange={handleAuditLogsChange}
                              className="mt-1 form-input"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Event Types</label>
                          <select
                            multiple
                            name="filters.eventTypes"
                            value={auditLogsData.filters?.eventTypes || []}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-select"
                          >
                            <option value="userActivity">User Activity</option>
                            <option value="systemChanges">System Changes</option>
                            <option value="securityEvents">Security Events</option>
                            <option value="dataAccess">Data Access</option>
                            <option value="apiCalls">API Calls</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Users</label>
                          <input
                            type="text"
                            name="filters.users"
                            value={(auditLogsData.filters?.users || []).join(', ')}
                            onChange={(e) => {
                              const users = e.target.value.split(',').map(user => user.trim());
                              setAuditLogsData(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  users
                                }
                              }));
                            }}
                            className="mt-1 form-input"
                            placeholder="Enter user IDs (comma-separated)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">IP Addresses</label>
                          <input
                            type="text"
                            name="filters.ipAddresses"
                            value={(auditLogsData.filters?.ipAddresses || []).join(', ')}
                            onChange={(e) => {
                              const ips = e.target.value.split(',').map(ip => ip.trim());
                              setAuditLogsData(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  ipAddresses: ips
                                }
                              }));
                            }}
                            className="mt-1 form-input"
                            placeholder="Enter IP addresses (comma-separated)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Existing sections remain unchanged */}
                    {/* Logging Configuration */}
                    {/* Event Types */}
                    {/* Export Settings */}
                    {/* Notifications */}

                    {/* Save Button */}
                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        onClick={handleAuditLogsFilter}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={handleAuditLogsExport}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Export Logs
                      </button>
                      <button
                        onClick={handleAuditLogsArchive}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Archive Logs
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Backup & Recovery */}
            {activeTab === 'backup' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Backup & Recovery</h2>
                  <div className="space-y-6">
                    {/* Schedule Settings */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Settings</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Frequency</label>
                          <select
                            name="schedule.frequency"
                            value={backupSettingsData.schedule.frequency}
                            onChange={handleBackupSettingsChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Time</label>
                          <input
                            type="time"
                            name="schedule.time"
                            value={backupSettingsData.schedule.time}
                            onChange={handleBackupSettingsChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        {backupSettingsData.schedule.frequency === 'weekly' && (
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                            <div className="flex flex-wrap gap-4">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                <label key={day} className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    name={`schedule.daysOfWeek.${index}`}
                                    checked={backupSettingsData.schedule.daysOfWeek?.includes(index)}
                                    onChange={handleBackupSettingsChange}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{day}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {backupSettingsData.schedule.frequency === 'monthly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Day of Month</label>
                            <input
                              type="number"
                              name="schedule.dayOfMonth"
                              value={backupSettingsData.schedule.dayOfMonth}
                              onChange={handleBackupSettingsChange}
                              min="1"
                              max="31"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Retention Settings */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Retention Settings</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
                          <input
                            type="number"
                            name="retention.days"
                            value={backupSettingsData.retention.days}
                            onChange={handleBackupSettingsChange}
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Maximum Backups</label>
                          <input
                            type="number"
                            name="retention.maxBackups"
                            value={backupSettingsData.retention.maxBackups}
                            onChange={handleBackupSettingsChange}
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              name="retention.deleteAfterRestore"
                              checked={backupSettingsData.retention.deleteAfterRestore}
                              onChange={handleBackupSettingsChange}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Delete backup after successful restore</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Storage Settings */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                          <select
                            name="storage.location"
                            value={backupSettingsData.storage.location}
                            onChange={handleBackupSettingsChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="local">Local Storage</option>
                            <option value="s3">Amazon S3</option>
                            <option value="azure">Azure Blob Storage</option>
                            <option value="gcp">Google Cloud Storage</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Storage Path</label>
                          <input
                            type="text"
                            name="storage.path"
                            value={backupSettingsData.storage.path}
                            onChange={handleBackupSettingsChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="/backups"
                          />
                        </div>
                        {backupSettingsData.storage.location !== 'local' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Access Key</label>
                              <input
                                type="password"
                                name="storage.credentials.accessKey"
                                value={backupSettingsData.storage.credentials?.accessKey}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Secret Key</label>
                              <input
                                type="password"
                                name="storage.credentials.secretKey"
                                value={backupSettingsData.storage.credentials?.secretKey}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Bucket</label>
                              <input
                                type="text"
                                name="storage.credentials.bucket"
                                value={backupSettingsData.storage.credentials?.bucket}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Region</label>
                              <input
                                type="text"
                                name="storage.credentials.region"
                                value={backupSettingsData.storage.credentials?.region}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Encryption Settings */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Encryption Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="encryption.enabled"
                            checked={backupSettingsData.encryption.enabled}
                            onChange={handleBackupSettingsChange}
                            className="form-checkbox"
                            id="encryptionEnabled"
                          />
                          <label htmlFor="encryptionEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable Encryption
                          </label>
                        </div>
                        {backupSettingsData.encryption.enabled && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Encryption Algorithm</label>
                              <select
                                name="encryption.algorithm"
                                value={backupSettingsData.encryption.algorithm}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 form-select"
                              >
                                <option value="aes-256-gcm">AES-256-GCM</option>
                                <option value="aes-256-cbc">AES-256-CBC</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Key Rotation (days)</label>
                              <input
                                type="number"
                                name="encryption.keyRotation"
                                value={backupSettingsData.encryption.keyRotation}
                                onChange={handleBackupSettingsChange}
                                min="1"
                                className="mt-1 form-input"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Compression Settings */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Compression Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="compression.enabled"
                            checked={backupSettingsData.compression.enabled}
                            onChange={handleBackupSettingsChange}
                            className="form-checkbox"
                            id="compressionEnabled"
                          />
                          <label htmlFor="compressionEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable Compression
                          </label>
                        </div>
                        {backupSettingsData.compression.enabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Compression Level</label>
                            <select
                              name="compression.level"
                              value={backupSettingsData.compression.level}
                              onChange={handleBackupSettingsChange}
                              className="mt-1 form-select"
                            >
                              <option value="none">None</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notifications.onSuccess"
                            checked={backupSettingsData.notifications.onSuccess}
                            onChange={handleBackupSettingsChange}
                            className="form-checkbox"
                            id="notifyOnSuccess"
                          />
                          <label htmlFor="notifyOnSuccess" className="ml-2 block text-sm text-gray-700">
                            Notify on Successful Backup
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notifications.onFailure"
                            checked={backupSettingsData.notifications.onFailure}
                            onChange={handleBackupSettingsChange}
                            className="form-checkbox"
                            id="notifyOnFailure"
                          />
                          <label htmlFor="notifyOnFailure" className="ml-2 block text-sm text-gray-700">
                            Notify on Backup Failure
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notification Recipients</label>
                          <input
                            type="text"
                            name="notifications.recipients"
                            value={backupSettingsData.notifications.recipients.join(', ')}
                            onChange={(e) => {
                              const recipients = e.target.value.split(',').map(email => email.trim());
                              setBackupSettingsData(prev => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  recipients
                                }
                              }));
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter email addresses (comma-separated)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Backup List */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Available Backups</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {backupList.map((backup) => (
                              <tr key={backup.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{backup.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(backup.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{backup.size} MB</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${backup.status === 'success' ? 'bg-green-100 text-green-800' :
                                    backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {backup.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{backup.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleRestoreBackup(backup.id)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBackup(backup.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={handleTestConnection}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Test Connection
                      </button>
                      <button
                        onClick={handleValidateSettings}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Validate Settings
                      </button>
                      <button
                        onClick={handleCreateBackup}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Create Backup
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Database Settings */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                {renderDatabaseSection()}
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && isSuperAdmin && (
              <>
                {renderApiSettingsSection()}
              </>
            )}

            {/* Performance Settings */}
            {activeTab === 'performance' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Performance Settings</h2>
                  <div className="space-y-6">
                    {/* Optimization Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Optimization Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cache Duration (seconds)</label>
                          <input
                            type="number"
                            name="optimization.cacheDuration"
                            value={performanceSettingsData.optimization.cacheDuration}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Query Timeout (seconds)</label>
                          <input
                            type="number"
                            name="optimization.queryTimeout"
                            value={performanceSettingsData.optimization.queryTimeout}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Connections</label>
                          <input
                            type="number"
                            name="optimization.maxConnections"
                            value={performanceSettingsData.optimization.maxConnections}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Upload Size (MB)</label>
                          <input
                            type="number"
                            name="optimization.maxUploadSize"
                            value={performanceSettingsData.optimization.maxUploadSize}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Concurrent Uploads</label>
                          <input
                            type="number"
                            name="optimization.maxConcurrentUploads"
                            value={performanceSettingsData.optimization.maxConcurrentUploads}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                          <input
                            type="number"
                            name="optimization.sessionTimeout"
                            value={performanceSettingsData.optimization.sessionTimeout}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Idle Timeout (minutes)</label>
                          <input
                            type="number"
                            name="optimization.idleTimeout"
                            value={performanceSettingsData.optimization.idleTimeout}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Connection Pool Size</label>
                          <input
                            type="number"
                            name="optimization.poolSize"
                            value={performanceSettingsData.optimization.poolSize}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Compression Level</label>
                          <select
                            name="optimization.compressionLevel"
                            value={performanceSettingsData.optimization.compressionLevel}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-select"
                          >
                            <option value="none">None</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="optimization.debugMode"
                            checked={performanceSettingsData.optimization.debugMode}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="debugMode"
                          />
                          <label htmlFor="debugMode" className="ml-2 block text-sm text-gray-700">
                            Enable Debug Mode
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="optimization.queryCacheEnabled"
                            checked={performanceSettingsData.optimization.queryCacheEnabled}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="queryCacheEnabled"
                          />
                          <label htmlFor="queryCacheEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable Query Cache
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Monitoring Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Monitoring Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="monitoring.enabled"
                            checked={performanceSettingsData.monitoring.enabled}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="monitoringEnabled"
                          />
                          <label htmlFor="monitoringEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable Performance Monitoring
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Metrics Collection Interval (seconds)</label>
                          <input
                            type="number"
                            name="monitoring.metricsInterval"
                            value={performanceSettingsData.monitoring.metricsInterval}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data Retention Period (hours)</label>
                          <input
                            type="number"
                            name="monitoring.retentionPeriod"
                            value={performanceSettingsData.monitoring.retentionPeriod}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Alert Thresholds</h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">CPU Usage (%)</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.cpu"
                              value={performanceSettingsData.monitoring.alertThresholds.cpu}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Memory Usage (%)</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.memory"
                              value={performanceSettingsData.monitoring.alertThresholds.memory}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Storage Usage (%)</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.storage"
                              value={performanceSettingsData.monitoring.alertThresholds.storage}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Response Time (ms)</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.responseTime"
                              value={performanceSettingsData.monitoring.alertThresholds.responseTime}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Error Rate (%)</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.errorRate"
                              value={performanceSettingsData.monitoring.alertThresholds.errorRate}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Request Count</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.requestCount"
                              value={performanceSettingsData.monitoring.alertThresholds.requestCount}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Concurrent Users</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.concurrentUsers"
                              value={performanceSettingsData.monitoring.alertThresholds.concurrentUsers}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Database Connections</label>
                            <input
                              type="number"
                              name="monitoring.alertThresholds.databaseConnections"
                              value={performanceSettingsData.monitoring.alertThresholds.databaseConnections}
                              onChange={handlePerformanceChange}
                              className="mt-1 form-input"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Caching Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Caching Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="caching.enabled"
                            checked={performanceSettingsData.caching.enabled}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="cachingEnabled"
                          />
                          <label htmlFor="cachingEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable Caching
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cache Type</label>
                          <select
                            name="caching.type"
                            value={performanceSettingsData.caching.type}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-select"
                          >
                            <option value="memory">Memory</option>
                            <option value="redis">Redis</option>
                            <option value="file">File</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">TTL (seconds)</label>
                          <input
                            type="number"
                            name="caching.ttl"
                            value={performanceSettingsData.caching.ttl}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Size (MB)</label>
                          <input
                            type="number"
                            name="caching.maxSize"
                            value={performanceSettingsData.caching.maxSize}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="caching.compression"
                            checked={performanceSettingsData.caching.compression}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="cacheCompression"
                          />
                          <label htmlFor="cacheCompression" className="ml-2 block text-sm text-gray-700">
                            Enable Cache Compression
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Database Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Database Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Min Connections</label>
                          <input
                            type="number"
                            name="database.connectionPool.min"
                            value={performanceSettingsData.database.connectionPool.min}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Connections</label>
                          <input
                            type="number"
                            name="database.connectionPool.max"
                            value={performanceSettingsData.database.connectionPool.max}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Idle Timeout (seconds)</label>
                          <input
                            type="number"
                            name="database.connectionPool.idleTimeout"
                            value={performanceSettingsData.database.connectionPool.idleTimeout}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="database.queryOptimization.enabled"
                            checked={performanceSettingsData.database.queryOptimization.enabled}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="queryOptimizationEnabled"
                          />
                          <label htmlFor="queryOptimizationEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable Query Optimization
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Execution Time (ms)</label>
                          <input
                            type="number"
                            name="database.queryOptimization.maxExecutionTime"
                            value={performanceSettingsData.database.queryOptimization.maxExecutionTime}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Slow Query Threshold (ms)</label>
                          <input
                            type="number"
                            name="database.queryOptimization.slowQueryThreshold"
                            value={performanceSettingsData.database.queryOptimization.slowQueryThreshold}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="database.indexing.autoIndex"
                            checked={performanceSettingsData.database.indexing.autoIndex}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="autoIndex"
                          />
                          <label htmlFor="autoIndex" className="ml-2 block text-sm text-gray-700">
                            Enable Auto Indexing
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="database.indexing.backgroundIndexing"
                            checked={performanceSettingsData.database.indexing.backgroundIndexing}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="backgroundIndexing"
                          />
                          <label htmlFor="backgroundIndexing" className="ml-2 block text-sm text-gray-700">
                            Enable Background Indexing
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Alert Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Alert Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="alerts.email"
                            checked={performanceSettingsData.alerts.email}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="emailAlerts"
                          />
                          <label htmlFor="emailAlerts" className="ml-2 block text-sm text-gray-700">
                            Enable Email Alerts
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="alerts.slack"
                            checked={performanceSettingsData.alerts.slack}
                            onChange={handlePerformanceChange}
                            className="form-checkbox"
                            id="slackAlerts"
                          />
                          <label htmlFor="slackAlerts" className="ml-2 block text-sm text-gray-700">
                            Enable Slack Alerts
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                          <input
                            type="text"
                            name="alerts.webhook"
                            value={performanceSettingsData.alerts.webhook}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            placeholder="https://hooks.slack.com/services/..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Alert Recipients</label>
                          <input
                            type="text"
                            name="alerts.recipients"
                            value={performanceSettingsData.alerts.recipients.join(', ')}
                            onChange={handlePerformanceChange}
                            className="mt-1 form-input"
                            placeholder="email1@example.com, email2@example.com"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Comma-separated list of email addresses
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Notification Channels</h4>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="alerts.notificationChannels.email"
                              checked={performanceSettingsData.alerts.notificationChannels.email}
                              onChange={handlePerformanceChange}
                              className="form-checkbox"
                              id="notificationEmail"
                            />
                            <label htmlFor="notificationEmail" className="ml-2 block text-sm text-gray-700">
                              Email
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="alerts.notificationChannels.slack"
                              checked={performanceSettingsData.alerts.notificationChannels.slack}
                              onChange={handlePerformanceChange}
                              className="form-checkbox"
                              id="notificationSlack"
                            />
                            <label htmlFor="notificationSlack" className="ml-2 block text-sm text-gray-700">
                              Slack
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="alerts.notificationChannels.webhook"
                              checked={performanceSettingsData.alerts.notificationChannels.webhook}
                              onChange={handlePerformanceChange}
                              className="form-checkbox"
                              id="notificationWebhook"
                            />
                            <label htmlFor="notificationWebhook" className="ml-2 block text-sm text-gray-700">
                              Webhook
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="alerts.notificationChannels.sms"
                              checked={performanceSettingsData.alerts.notificationChannels.sms}
                              onChange={handlePerformanceChange}
                              className="form-checkbox"
                              id="notificationSms"
                            />
                            <label htmlFor="notificationSms" className="ml-2 block text-sm text-gray-700">
                              SMS
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Alert Levels</h4>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="alerts.alertLevels.critical"
                              checked={performanceSettingsData.alerts.alertLevels.critical}
                              onChange={handlePerformanceChange}
                              className="form-checkbox"
                              id="alertCritical"
                            />
                            <label htmlFor="alertCritical" className="ml-2 block text-sm text-gray-700">
                              Critical
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="alerts.alertLevels.warning"
                              checked={performanceSettingsData.alerts.alertLevels.warning}
                              onChange={handlePerformanceChange}
                              className="form-checkbox"
                              id="alertWarning"
                            />
                            <label htmlFor="alertWarning" className="ml-2 block text-sm text-gray-700">
                              Warning
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="alerts.alertLevels.info"
                              checked={performanceSettingsData.alerts.alertLevels.info}
                              onChange={handlePerformanceChange}
                              className="form-checkbox"
                              id="alertInfo"
                            />
                            <label htmlFor="alertInfo" className="ml-2 block text-sm text-gray-700">
                              Info
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className="btn btn-secondary flex items-center"
                      onClick={() => handleTestPerformanceSettings()}
                      disabled={loading}
                    >
                      {/* <Test size={18} className="mr-2" /> */}
                      Test Settings
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary flex items-center"
                      onClick={() => handleValidatePerformanceSettings()}
                      disabled={loading}
                    >
                      {/* <Validate size={18} className="mr-2" /> */}
                      Validate Settings
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && reportToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Report</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete the report "{reportToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setReportToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;