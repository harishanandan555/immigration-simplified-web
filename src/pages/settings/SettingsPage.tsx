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
  Server,
  Zap,
  HardDrive,
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth, updateUser, deleteUser, registerAttorney, registerUser, getUserById } from '../../controllers/AuthControllers';
import api from '../../utils/api';
import { SETTINGS_END_POINTS } from '../../utils/constants';
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
  updateFormTemplates,
  getReportSettings,
  updateReportSettings,
  getRoles,
  updateRoles,
  getDatabaseSettings,
  updateDatabaseSettings,
  getSystemSettings,
  updateSystemSettings,
  getAuditLogs,
  getBackupSettings,
  updateBackupSettings,
  getApiSettings,
  updateApiSettings,
  getPerformanceSettings,
  updatePerformanceSettings
} from '../../controllers/SettingsControllers';
import { getCompanies, getCompanyUsers, Company } from '../../controllers/CompanyControllers';
// import { getSubscriptionPlans, getSubscriptionPlanById, subscribeToPlan, cancelSubscription, getCompanySubscription } from '../../controllers/BillingControllers';

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
  plan: string;
  paymentMethod: {
    cardNumber: string;
    expiryDate: string;
  };
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
    };
  };
  alerts: {
    email: boolean;
    slack: boolean;
    webhook: string;
    recipients: string[];
  };
}

interface ApiSettingsData {
  keys: {
    production: {
      key: string;
      lastUsed: string;
      createdAt: string;
    };
    development: {
      key: string;
      lastUsed: string;
      createdAt: string;
    };
  };
  rateLimiting: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  cors: {
    allowedOrigins: string[];
    allowCredentials: boolean;
  };
  security: {
    requireApiKey: boolean;
    ipWhitelist: string[];
    allowedMethods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
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
    retentionPeriod: number; // in days
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

const SettingsPage = () => {

  const { isAttorney, isSuperAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const POLLING_INTERVAL = 30000; // 30 seconds

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
  const [billingData, setBillingData] = useState<BillingData>({
    plan: '',
    paymentMethod: {
      cardNumber: '',
      expiryDate: ''
    }
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
  const [filteredUsers, setFilteredUsers] = useState<DisplayUserData[]>([]);
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
  const [formTemplatesData, setFormTemplatesData] = useState<any>({});
  const [reportSettingsData, setReportSettingsData] = useState<any>({});
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
  const [apiSettingsData, setApiSettingsData] = useState<ApiSettingsData>({
    keys: {
      production: {
        key: '',
        lastUsed: '',
        createdAt: ''
      },
      development: {
        key: '',
        lastUsed: '',
        createdAt: ''
      }
    },
    rateLimiting: {
      requestsPerMinute: 100,
      burstLimit: 200
    },
    cors: {
      allowedOrigins: [],
      allowCredentials: true
    },
    security: {
      requireApiKey: true,
      ipWhitelist: [],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    monitoring: {
      enabled: true,
      logLevel: 'info',
      retentionDays: 30
    }
  });
  const [performanceSettingsData, setPerformanceSettingsData] = useState<PerformanceSettingsData>({
    optimization: {
      cacheDuration: 3600,
      queryTimeout: 30,
      maxConnections: 10,
      compressionLevel: 'medium',
      debugMode: false
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
        errorRate: 2
      }
    },
    alerts: {
      email: true,
      slack: false,
      webhook: '',
      recipients: []
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
      schedule: 'none',
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

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

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
              setFilteredUsers(users);
            }
            // Load companies for the dropdown
            const companiesData = await getCompanies(user._id);
            if (companiesData?.data) {
              setCompanies(companiesData.data);
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
              setFormTemplatesData(data.data.value);
            }
            break;
          case 'reports':
            data = await getReportSettings(user._id);
            if (data?.data) {
              setReportSettingsData(data.data.value);
            }
            break;
          case 'roles':
            data = await getRoles(user._id);
            if (data?.data) {
              setRolesData(data.data.value);
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
              setSystemData(data.data.value);
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
              setApiSettingsData(data.data.value);
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

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBillingData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BillingData] as Record<string, string>),
          [child]: value
        }
      }));
    } else {
      setBillingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBillingSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateBilling(user._id, billingData);
      // Show success message
    } catch (error) {
      console.error('Error updating billing:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const [section, field, subfield] = name.split('.');

    setSystemData(prev => {
      const newData = { ...prev };

      if (subfield) {
        // Handle nested fields like maintenance.scheduledMaintenance.startTime
        (newData[section as keyof SystemData] as any)[field][subfield] = type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? Number(value)
            : value;
      } else if (field) {
        // Handle nested fields like maintenance.maintenanceMode
        (newData[section as keyof SystemData] as any)[field] = type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? Number(value)
            : value;
      } else {
        // Handle top-level fields
        (newData[name as keyof SystemData] as any) = type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? Number(value)
            : value;
      }

      return newData;
    });
  };

  const handleSystemSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateSystemSettings(user._id, systemData);
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating system:', error);
      toast.error('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenance = async (operation: 'cache' | 'database') => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const endpoint = operation === 'cache'
        ? SETTINGS_END_POINTS.CLEAR_CACHE
        : SETTINGS_END_POINTS.OPTIMIZE_DATABASE;

      await api.post(`${endpoint}/${user._id}`);

      // Update the last maintenance timestamp
      setSystemData(prev => ({
        ...prev,
        maintenance: {
          ...prev.maintenance,
          [`last${operation === 'cache' ? 'CacheClear' : 'DatabaseOptimization'}`]: new Date().toISOString()
        }
      }));

      toast.success(`${operation === 'cache' ? 'Cache cleared' : 'Database optimized'} successfully`);
    } catch (error) {
      console.error(`Error performing ${operation} maintenance:`, error);
      toast.error(`Failed to ${operation === 'cache' ? 'clear cache' : 'optimize database'}`);
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
                setFilteredUsers(users);
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
                setFormTemplatesData(data.data.value);
              }
              break;
            case 'reports':
              data = await getReportSettings(user._id);
              if (data?.data) {
                setReportSettingsData(data.data.value);
              }
              break;
            case 'roles':
              data = await getRoles(user._id);
              if (data?.data) {
                setRolesData(data.data.value);
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
                setSystemData(data.data.value);
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
                setApiSettingsData(data.data.value);
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
          await updateFormTemplates(user._id, formTemplatesData);
          break;
        case 'reports':
          await updateReportSettings(user._id, reportSettingsData);
          break;
        case 'roles':
          await updateRoles(user._id, rolesData);
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

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      if (isCheckbox) {
        current[lastKey] = checked;
      } else if (type === 'number') {
        current[lastKey] = Number(value);
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
          await api.post(`${SETTINGS_END_POINTS.DATABASE_MAINTENANCE}/vacuum`, { userId: user._id });
          toast.success('Database vacuum completed successfully');
          break;
        case 'analyze':
          await api.post(`${SETTINGS_END_POINTS.DATABASE_MAINTENANCE}/analyze`, { userId: user._id });
          toast.success('Table analysis completed successfully');
          break;
        case 'export':
          const response = await api.post(`${SETTINGS_END_POINTS.DATABASE_MAINTENANCE}/export`, { userId: user._id });
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
          toast.success('Schema exported successfully');
          break;
      }
    } catch (error) {
      console.error(`Error performing database ${operation}:`, error);
      toast.error(`Failed to perform database ${operation}`);
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
      const { firstName, lastName, email, role, companyId, password, confirmPassword } = newUser;

      // Validate required fields
      if (!firstName || !lastName || !email || !role) {
        toast.error('Please fill in all required fields');
        return;
      }

      // For attorneys, use their company ID
      const finalCompanyId = isAttorney ? user?.companyId : companyId;
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
          setFilteredUsers(users);
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
          setFilteredUsers(users);
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
    }
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
        setFilteredUsers(updatedUsers);
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
    if (!userToDelete) return;

    try {
      setLoading(true);
      await deleteUser(userToDelete);
      // Remove the deleted user from the lists
      const updatedUsers = usersData.users.filter(user => user._id !== userToDelete);
      setUsersData(prev => ({
        ...prev,
        users: updatedUsers,
        totalUsers: prev.totalUsers - 1,
        activeUsers: updatedUsers.filter(u => u.active).length
      }));
      setFilteredUsers(updatedUsers);
      setShowDeleteConfirmation(false);
      setUserToDelete(null);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
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
      } else if (name === 'cors.allowedOrigins') {
        current[lastKey] = value.split('\n').filter(origin => origin.trim());
      } else if (name === 'security.ipWhitelist') {
        current[lastKey] = value.split('\n').filter(ip => ip.trim());
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
    try {
      const response = await api.post(`${SETTINGS_END_POINTS.API_SETTINGS_UPDATE}/keys/regenerate`, { type });
      setApiSettingsData(prev => ({
        ...prev,
        keys: {
          ...prev.keys,
          [type]: response.data.data
        }
      }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} API key regenerated successfully`);
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast.error('Failed to regenerate API key');
    }
  };

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
      const response = await api.post(`${SETTINGS_END_POINTS.BACKUP_GET}/create`, { userId: user._id });
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
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Saving...' : 'Save Database Settings'}
        </button>
      </div>
    </div>
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
            {activeTab === 'billing' && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Billing Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Current Plan</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Professional Plan</p>
                            <p className="text-xs text-gray-500">$99/month • 10 users</p>
                          </div>
                          <button className="btn btn-outline">Change Plan</button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Payment Method</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-6 w-6 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                              <input
                                type="text"
                                name="paymentMethod.cardNumber"
                                value={billingData.paymentMethod.cardNumber}
                                onChange={handleBillingChange}
                                className="mt-1 form-input"
                                placeholder="•••• •••• •••• 4242"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Expires 12/24</p>
                              <input
                                type="text"
                                name="paymentMethod.expiryDate"
                                value={billingData.paymentMethod.expiryDate}
                                onChange={handleBillingChange}
                                className="mt-1 form-input"
                                placeholder="MM/YY"
                              />
                            </div>
                          </div>
                          <button className="btn btn-outline text-xs py-1">Update</button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Billing History</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Invoice #1234</p>
                            <p className="text-xs text-gray-500">Dec 1, 2023</p>
                          </div>
                          <button className="btn btn-outline text-xs py-1">Download</button>
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
                    onClick={handleBillingSubmit}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

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
                      {(isSuperAdmin || isAttorney) && (
                        <button
                          className="btn btn-primary"
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
                        <p className="text-2xl font-semibold">{usersData.totalUsers}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Active Users</p>
                        <p className="text-2xl font-semibold">{usersData.activeUsers}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Inactive Users</p>
                        <p className="text-2xl font-semibold">{usersData.totalUsers - usersData.activeUsers}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Selected Company</p>
                        <div className="relative" ref={companyDropdownRef}>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search companies..."
                              value={companySearchTerm}
                              onChange={(e) => {
                                setCompanySearchTerm(e.target.value);
                                setShowCompanyDropdown(true);
                              }}
                              onFocus={() => setShowCompanyDropdown(true)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              {selectedCompanyId && (
                                <button
                                  onClick={() => {
                                    setSelectedCompanyId('');
                                    setCompanySearchTerm('All Companies');
                                    setFilteredUsers(usersData.users);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 mr-2"
                                >
                                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                              <ChevronRight className="h-5 w-5 text-gray-400 transform rotate-90" />
                            </div>
                          </div>

                          {showCompanyDropdown && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                              <div
                                onClick={() => {
                                  setSelectedCompanyId('');
                                  setCompanySearchTerm('All Companies');
                                  setFilteredUsers(usersData.users);
                                  setShowCompanyDropdown(false);
                                }}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${!selectedCompanyId ? 'bg-blue-50' : ''}`}
                              >
                                <div className="flex items-center">
                                  <span className="ml-3 block truncate">All Companies</span>
                                </div>
                                {!selectedCompanyId && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {filteredCompanies.length === 0 ? (
                                <div className="px-4 py-2 text-gray-500">No companies found</div>
                              ) : (
                                filteredCompanies.map((company) => (
                                  <div
                                    key={company._id}
                                    onClick={() => handleCompanySelect(company._id, company.name)}
                                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${selectedCompanyId === company._id ? 'bg-blue-50' : ''}`}
                                  >
                                    <div className="flex items-center">
                                      <span className="ml-3 block truncate">{company.name}</span>
                                    </div>
                                    {selectedCompanyId === company._id && (
                                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Users List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers
                            .filter(user => {
                              // First apply the search filter
                              const matchesSearch =
                                user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                user.email.toLowerCase().includes(userSearchQuery.toLowerCase());

                              // Then apply role filter for superadmin
                              const matchesRole = isSuperAdmin ? user.role === 'attorney' : true;

                              return matchesSearch && matchesRole;
                            })
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
                            ))}
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

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Company</label>
                            <div className="relative" ref={companyDropdownRef}>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search companies..."
                                  value={companySearchTerm}
                                  onChange={(e) => {
                                    setCompanySearchTerm(e.target.value);
                                    setShowCompanyDropdown(true);
                                  }}
                                  onFocus={() => setShowCompanyDropdown(true)}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  {selectedCompanyId && (
                                    <button
                                      onClick={() => {
                                        setSelectedCompanyId('');
                                        setCompanySearchTerm('All Companies');
                                        setFilteredUsers(usersData.users);
                                      }}
                                      className="text-gray-400 hover:text-gray-600 mr-2"
                                    >
                                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  )}
                                  <ChevronRight className="h-5 w-5 text-gray-400 transform rotate-90" />
                                </div>
                              </div>

                              {showCompanyDropdown && (
                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                                  <div
                                    onClick={() => {
                                      setSelectedCompanyId('');
                                      setCompanySearchTerm('All Companies');
                                      setFilteredUsers(usersData.users);
                                      setShowCompanyDropdown(false);
                                    }}
                                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${!selectedCompanyId ? 'bg-blue-50' : ''}`}
                                  >
                                    {!selectedCompanyId && (
                                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                  {filteredCompanies.length === 0 ? (
                                    <div className="px-4 py-2 text-gray-500">No companies found</div>
                                  ) : (
                                    filteredCompanies.map((company) => (
                                      <div
                                        key={company._id}
                                        onClick={() => handleCompanySelect(company._id, company.name)}
                                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${selectedCompanyId === company._id ? 'bg-blue-50' : ''}`}
                                      >
                                        <div className="flex items-center">
                                          <span className="ml-3 block truncate">{company.name}</span>
                                        </div>
                                        {selectedCompanyId === company._id && (
                                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

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
                                <option value="client">Client</option>
                                <option value="attorney">Attorney</option>
                                <option value="paralegal">Paralegal</option>
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
                                <button className="text-red-600 hover:text-red-900">Delete</button>
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
                                <button className="text-red-600 hover:text-red-900">Delete</button>
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
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
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
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <BarChart className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Weekly Case Summary</div>
                                  <div className="text-sm text-gray-500">Overview of all active cases</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Case Reports
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Every Monday at 9:00 AM
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              5 recipients
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                <button className="text-gray-600 hover:text-gray-900">Preview</button>
                                <button className="text-red-600 hover:text-red-900">Delete</button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <BarChart className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">Monthly Financial Report</div>
                                  <div className="text-sm text-gray-500">Revenue and billing summary</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Financial Reports
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              First day of each month
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              3 recipients
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                <button className="text-gray-600 hover:text-gray-900">Preview</button>
                                <button className="text-red-600 hover:text-red-900">Delete</button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Add Report Modal */}
                {showAddReport && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    {/* <div className="bg-white rounded-lg p-6 max-w-2xl w-full"></div> */}
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Report</h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        // Handle form submission
                        setShowAddReport(false);
                      }}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Report Name</label>
                            <input
                              type="text"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="e.g., Weekly Case Summary"
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
                              <option value="case">Case Reports</option>
                              <option value="financial">Financial Reports</option>
                              <option value="performance">Performance Reports</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              rows={3}
                              placeholder="Enter report description"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Schedule</label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <select
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  required
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                  <option value="quarterly">Quarterly</option>
                                </select>
                              </div>
                              <div>
                                <input
                                  type="time"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Report Content</label>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Case Status Summary
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Financial Summary
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Staff Performance
                                </label>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Recipients</label>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  All Attorneys
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  All Paralegals
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Management Team
                                </label>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Export Format</label>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  PDF
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  Excel
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                  CSV
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setShowAddReport(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                          >
                            Create Report
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

            {/* Roles & Permissions */}
            {activeTab === 'roles' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Roles & Permissions</h2>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search roles..."
                          className="form-input w-full"
                        />
                      </div>
                      <button className="btn btn-primary">Add Role</button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        <li>
                          <div className="px-4 py-4 flex items-center sm:px-6">
                            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <div className="flex text-sm">
                                  <p className="font-medium text-primary-600 truncate">Administrator</p>
                                  <p className="ml-1 flex-shrink-0 font-normal text-gray-500">Full access</p>
                                </div>
                                <div className="mt-2 flex">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Shield className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                    <p>5 users with this role</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="ml-5 flex-shrink-0">
                              <button className="btn btn-outline text-xs py-1">Edit</button>
                            </div>
                          </div>
                        </li>
                      </ul>
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

            {/* System Settings */}
            {activeTab === 'system' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">System Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">General Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">System Name</label>
                          <input
                            type="text"
                            name="systemName"
                            value={systemData.systemName}
                            onChange={handleSystemChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter system name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                          <select
                            name="timeZone"
                            value={systemData.timeZone}
                            onChange={handleSystemChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York</option>
                            <option value="America/Los_Angeles">America/Los_Angeles</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="Asia/Tokyo">Asia/Tokyo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date Format</label>
                          <select
                            name="dateFormat"
                            value={systemData.dateFormat}
                            onChange={handleSystemChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Language</label>
                          <input
                            type="text"
                            name="language"
                            value={systemData.language}
                            onChange={handleSystemChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter language code"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Maintenance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <button
                              className="btn btn-outline flex items-center"
                              onClick={() => handleMaintenance('cache')}
                              disabled={loading}
                            >
                              <Server className="h-4 w-4 mr-2" />
                              Clear Cache
                            </button>
                            {systemData.maintenance.lastCacheClear && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last cleared: {new Date(systemData.maintenance.lastCacheClear).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div>
                            <button
                              className="btn btn-outline flex items-center"
                              onClick={() => handleMaintenance('database')}
                              disabled={loading}
                            >
                              <Database className="h-4 w-4 mr-2" />
                              Optimize Database
                            </button>
                            {systemData.maintenance.lastDatabaseOptimization && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last optimized: {new Date(systemData.maintenance.lastDatabaseOptimization).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={systemData.maintenance.maintenanceMode}
                            onChange={handleSystemChange}
                            className="form-checkbox"
                            id="maintenanceMode"
                          />
                          <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                            Enable Maintenance Mode
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Scheduled Maintenance</label>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                name="scheduledMaintenance.enabled"
                                checked={systemData.maintenance.scheduledMaintenance.enabled}
                                onChange={handleSystemChange}
                                className="form-checkbox"
                                id="scheduledMaintenanceEnabled"
                              />
                              <label htmlFor="scheduledMaintenanceEnabled" className="ml-2 block text-sm text-gray-700">
                                Enable Scheduled Maintenance
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Start Time</label>
                              <input
                                type="datetime-local"
                                name="scheduledMaintenance.startTime"
                                value={systemData.maintenance.scheduledMaintenance.startTime}
                                onChange={handleSystemChange}
                                className="mt-1 form-input"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Duration (hours)</label>
                              <input
                                type="number"
                                name="scheduledMaintenance.duration"
                                value={systemData.maintenance.scheduledMaintenance.duration}
                                onChange={handleSystemChange}
                                className="mt-1 form-input"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Message</label>
                              <textarea
                                name="scheduledMaintenance.message"
                                value={systemData.maintenance.scheduledMaintenance.message}
                                onChange={handleSystemChange}
                                className="mt-1 form-textarea"
                                rows={3}
                                placeholder="Enter maintenance message"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Performance</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Upload Size (MB)</label>
                          <input
                            type="number"
                            name="performance.maxUploadSize"
                            value={systemData.performance.maxUploadSize}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Concurrent Uploads</label>
                          <input
                            type="number"
                            name="performance.maxConcurrentUploads"
                            value={systemData.performance.maxConcurrentUploads}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                          <input
                            type="number"
                            name="performance.sessionTimeout"
                            value={systemData.performance.sessionTimeout}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Idle Timeout (minutes)</label>
                          <input
                            type="number"
                            name="performance.idleTimeout"
                            value={systemData.performance.idleTimeout}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Security</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Login Attempts</label>
                          <input
                            type="number"
                            name="security.loginAttempts"
                            value={systemData.security.loginAttempts}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Lockout Duration (minutes)</label>
                          <input
                            type="number"
                            name="security.lockoutDuration"
                            value={systemData.security.lockoutDuration}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Password Expiry (days)</label>
                          <input
                            type="number"
                            name="security.passwordExpiry"
                            value={systemData.security.passwordExpiry}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="security.sessionManagement.allowMultipleSessions"
                            checked={systemData.security.sessionManagement.allowMultipleSessions}
                            onChange={handleSystemChange}
                            className="form-checkbox"
                            id="allowMultipleSessions"
                          />
                          <label htmlFor="allowMultipleSessions" className="ml-2 block text-sm text-gray-700">
                            Allow Multiple Sessions
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Concurrent Sessions</label>
                          <input
                            type="number"
                            name="security.sessionManagement.maxConcurrentSessions"
                            value={systemData.security.sessionManagement.maxConcurrentSessions}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notifications.systemAlerts"
                            checked={systemData.notifications.systemAlerts}
                            onChange={handleSystemChange}
                            className="form-checkbox"
                            id="systemAlerts"
                          />
                          <label htmlFor="systemAlerts" className="ml-2 block text-sm text-gray-700">
                            Enable System Alerts
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notifications.maintenanceNotifications"
                            checked={systemData.notifications.maintenanceNotifications}
                            onChange={handleSystemChange}
                            className="form-checkbox"
                            id="maintenanceNotifications"
                          />
                          <label htmlFor="maintenanceNotifications" className="ml-2 block text-sm text-gray-700">
                            Enable Maintenance Notifications
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notifications.errorNotifications"
                            checked={systemData.notifications.errorNotifications}
                            onChange={handleSystemChange}
                            className="form-checkbox"
                            id="errorNotifications"
                          />
                          <label htmlFor="errorNotifications" className="ml-2 block text-sm text-gray-700">
                            Enable Error Notifications
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notification Recipients</label>
                          <textarea
                            name="notifications.recipients"
                            value={systemData.notifications.recipients.join('\n')}
                            onChange={handleSystemChange}
                            className="mt-1 form-textarea"
                            placeholder="Enter email addresses (one per line)"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Logging</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="logging.enabled"
                            checked={systemData.logging.enabled}
                            onChange={handleSystemChange}
                            className="form-checkbox"
                            id="loggingEnabled"
                          />
                          <label htmlFor="loggingEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable Logging
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Log Level</label>
                          <select
                            name="logging.level"
                            value={systemData.logging.level}
                            onChange={handleSystemChange}
                            className="mt-1 form-select"
                          >
                            <option value="debug">Debug</option>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="error">Error</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Log Retention (days)</label>
                          <input
                            type="number"
                            name="logging.retention"
                            value={systemData.logging.retention}
                            onChange={handleSystemChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="logging.includeStackTraces"
                            checked={systemData.logging.includeStackTraces}
                            onChange={handleSystemChange}
                            className="form-checkbox"
                            id="includeStackTraces"
                          />
                          <label htmlFor="includeStackTraces" className="ml-2 block text-sm text-gray-700">
                            Include Stack Traces
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
                    onClick={handleSystemSubmit}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Audit Logs</h2>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search logs..."
                          className="form-input w-full"
                        />
                      </div>
                      <button className="btn btn-outline">Export Logs</button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        <li>
                          <div className="px-4 py-4 flex items-center sm:px-6">
                            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <div className="flex text-sm">
                                  <p className="font-medium text-primary-600 truncate">User Login</p>
                                  <p className="ml-1 flex-shrink-0 font-normal text-gray-500">John Doe</p>
                                </div>
                                <div className="mt-2 flex">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Activity className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                    <p>2 minutes ago</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
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

            {/* Backup & Recovery */}
            {activeTab === 'backup' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Backup & Recovery</h2>
                  <div className="space-y-6">
                    {/* Backup Schedule */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Backup Schedule</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Frequency</label>
                          <select
                            name="schedule.frequency"
                            value={backupSettingsData.schedule.frequency}
                            onChange={handleBackupSettingsChange}
                            className="mt-1 form-select"
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
                            className="mt-1 form-input"
                          />
                        </div>
                        {backupSettingsData.schedule.frequency === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Days of Week</label>
                            <div className="mt-2 space-x-2">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                <label key={day} className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    name={`schedule.daysOfWeek.${index}`}
                                    checked={backupSettingsData.schedule.daysOfWeek?.includes(index)}
                                    onChange={handleBackupSettingsChange}
                                    className="form-checkbox"
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
                              className="mt-1 form-input"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Retention Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Retention Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
                          <input
                            type="number"
                            name="retention.days"
                            value={backupSettingsData.retention.days}
                            onChange={handleBackupSettingsChange}
                            min="1"
                            className="mt-1 form-input"
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
                            className="mt-1 form-input"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="retention.deleteAfterRestore"
                            checked={backupSettingsData.retention.deleteAfterRestore}
                            onChange={handleBackupSettingsChange}
                            className="form-checkbox"
                            id="deleteAfterRestore"
                          />
                          <label htmlFor="deleteAfterRestore" className="ml-2 block text-sm text-gray-700">
                            Delete backup after successful restore
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Storage Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Storage Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                          <select
                            name="storage.location"
                            value={backupSettingsData.storage.location}
                            onChange={handleBackupSettingsChange}
                            className="mt-1 form-select"
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
                            className="mt-1 form-input"
                            placeholder="/backups"
                          />
                        </div>
                        {backupSettingsData.storage.location !== 'local' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Access Key</label>
                              <input
                                type="password"
                                name="storage.credentials.accessKey"
                                value={backupSettingsData.storage.credentials?.accessKey}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 form-input"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Secret Key</label>
                              <input
                                type="password"
                                name="storage.credentials.secretKey"
                                value={backupSettingsData.storage.credentials?.secretKey}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 form-input"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Bucket</label>
                              <input
                                type="text"
                                name="storage.credentials.bucket"
                                value={backupSettingsData.storage.credentials?.bucket}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 form-input"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Region</label>
                              <input
                                type="text"
                                name="storage.credentials.region"
                                value={backupSettingsData.storage.credentials?.region}
                                onChange={handleBackupSettingsChange}
                                className="mt-1 form-input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Encryption Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Encryption Settings</h3>
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
                            Enable backup encryption
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
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Compression Settings</h3>
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
                            Enable backup compression
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
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Settings</h3>
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
                            Notify on successful backup
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
                            Notify on backup failure
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notification Recipients</label>
                          <textarea
                            name="notifications.recipients"
                            value={backupSettingsData.notifications.recipients.join('\n')}
                            onChange={handleBackupSettingsChange}
                            className="mt-1 form-textarea"
                            placeholder="Enter email addresses (one per line)"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Manual Backup */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Manual Backup</h3>
                      <div className="space-y-4">
                        <button
                          className="btn btn-primary flex items-center"
                          onClick={handleCreateBackup}
                          disabled={loading}
                        >
                          <HardDrive className="h-4 w-4 mr-2" />
                          {loading ? 'Creating Backup...' : 'Create Backup Now'}
                        </button>
                        {backupSettingsData.lastBackup && (
                          <div className="mt-4 p-4 bg-white rounded-lg border">
                            <h4 className="text-sm font-medium text-gray-900">Last Backup</h4>
                            <div className="mt-2 space-y-2">
                              <p className="text-sm text-gray-600">
                                Status: <span className={`font-medium ${backupSettingsData.lastBackup.status === 'success' ? 'text-green-600' : backupSettingsData.lastBackup.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {backupSettingsData.lastBackup.status.charAt(0).toUpperCase() + backupSettingsData.lastBackup.status.slice(1)}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Time: {new Date(backupSettingsData.lastBackup.timestamp).toLocaleString()}
                              </p>
                              {backupSettingsData.lastBackup.size > 0 && (
                                <p className="text-sm text-gray-600">
                                  Size: {(backupSettingsData.lastBackup.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                          </div>
                        )}
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

            {/* Database Settings */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                {renderDatabaseSection()}
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">API Settings</h2>
                  <div className="space-y-6">
                    {/* API Keys */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">API Keys</h3>
                      <div className="space-y-4">
                        {/* Production Key */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Production Key</p>
                            <p className="text-xs text-gray-500">Last used: {apiSettingsData.keys.production.lastUsed}</p>
                            <p className="text-xs text-gray-500">Created: {apiSettingsData.keys.production.createdAt}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              className="btn btn-outline text-xs py-1"
                              onClick={() => handleRegenerateApiKey('production')}
                            >
                              Regenerate
                            </button>
                            <button
                              className="btn btn-outline text-xs py-1"
                              onClick={() => navigator.clipboard.writeText(apiSettingsData.keys.production.key)}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        {/* Development Key */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Development Key</p>
                            <p className="text-xs text-gray-500">Last used: {apiSettingsData.keys.development.lastUsed}</p>
                            <p className="text-xs text-gray-500">Created: {apiSettingsData.keys.development.createdAt}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              className="btn btn-outline text-xs py-1"
                              onClick={() => handleRegenerateApiKey('development')}
                            >
                              Regenerate
                            </button>
                            <button
                              className="btn btn-outline text-xs py-1"
                              onClick={() => navigator.clipboard.writeText(apiSettingsData.keys.development.key)}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rate Limiting */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Rate Limiting</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Requests per Minute</label>
                          <input
                            type="number"
                            name="rateLimiting.requestsPerMinute"
                            value={apiSettingsData.rateLimiting.requestsPerMinute}
                            onChange={handleApiSettingsChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Burst Limit</label>
                          <input
                            type="number"
                            name="rateLimiting.burstLimit"
                            value={apiSettingsData.rateLimiting.burstLimit}
                            onChange={handleApiSettingsChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CORS Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">CORS Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Allowed Origins</label>
                          <textarea
                            name="cors.allowedOrigins"
                            value={apiSettingsData.cors.allowedOrigins.join('\n')}
                            onChange={handleApiSettingsChange}
                            className="mt-1 form-textarea"
                            rows={4}
                            placeholder="Enter one origin per line"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="cors.allowCredentials"
                            checked={apiSettingsData.cors.allowCredentials}
                            onChange={handleApiSettingsChange}
                            className="form-checkbox"
                            id="allowCredentials"
                          />
                          <label htmlFor="allowCredentials" className="ml-2 block text-sm text-gray-700">
                            Allow Credentials
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Security Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="security.requireApiKey"
                            checked={apiSettingsData.security.requireApiKey}
                            onChange={handleApiSettingsChange}
                            className="form-checkbox"
                            id="requireApiKey"
                          />
                          <label htmlFor="requireApiKey" className="ml-2 block text-sm text-gray-700">
                            Require API Key
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">IP Whitelist</label>
                          <textarea
                            name="security.ipWhitelist"
                            value={apiSettingsData.security.ipWhitelist.join('\n')}
                            onChange={handleApiSettingsChange}
                            className="mt-1 form-textarea"
                            rows={4}
                            placeholder="Enter one IP address per line"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Allowed Methods</label>
                          <select
                            name="security.allowedMethods"
                            multiple
                            value={apiSettingsData.security.allowedMethods}
                            onChange={handleApiSettingsChange}
                            className="mt-1 form-select"
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

                    {/* Monitoring Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Monitoring Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="monitoring.enabled"
                            checked={apiSettingsData.monitoring.enabled}
                            onChange={handleApiSettingsChange}
                            className="form-checkbox"
                            id="monitoringEnabled"
                          />
                          <label htmlFor="monitoringEnabled" className="ml-2 block text-sm text-gray-700">
                            Enable API Monitoring
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Log Level</label>
                          <select
                            name="monitoring.logLevel"
                            value={apiSettingsData.monitoring.logLevel}
                            onChange={handleApiSettingsChange}
                            className="mt-1 form-select"
                          >
                            <option value="debug">Debug</option>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="error">Error</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Log Retention (days)</label>
                          <input
                            type="number"
                            name="monitoring.retentionDays"
                            value={apiSettingsData.monitoring.retentionDays}
                            onChange={handleApiSettingsChange}
                            className="mt-1 form-input"
                            min="1"
                            max="365"
                          />
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
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
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

            {/* Audit Logs Settings */}
            {activeTab === 'audit' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Audit Logs Settings</h2>
                  <div className="space-y-6">
                    {/* Logging Configuration */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Logging Configuration</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="logging.enabled"
                            checked={auditLogsData.logging.enabled}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Enable Audit Logging</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Log Level</label>
                          <select
                            name="logging.level"
                            value={auditLogsData.logging.level}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-select"
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
                            name="logging.retentionPeriod"
                            value={auditLogsData.logging.retentionPeriod}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-input"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                          <select
                            name="logging.storageLocation"
                            value={auditLogsData.logging.storageLocation}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-select"
                          >
                            <option value="local">Local Storage</option>
                            <option value="s3">Amazon S3</option>
                            <option value="azure">Azure Blob Storage</option>
                            <option value="gcp">Google Cloud Storage</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Export Format</label>
                          <select
                            name="logging.exportFormat"
                            value={auditLogsData.logging.exportFormat}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-select"
                          >
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="xml">XML</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="logging.autoArchive"
                            checked={auditLogsData.logging.autoArchive}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Auto-Archive Old Logs</label>
                        </div>
                      </div>
                    </div>

                    {/* Event Types */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Event Types</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="events.userActivity"
                            checked={auditLogsData.events.userActivity}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">User Activity</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="events.systemChanges"
                            checked={auditLogsData.events.systemChanges}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">System Changes</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="events.securityEvents"
                            checked={auditLogsData.events.securityEvents}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Security Events</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="events.dataAccess"
                            checked={auditLogsData.events.dataAccess}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Data Access</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="events.apiCalls"
                            checked={auditLogsData.events.apiCalls}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-gray-700">API Calls</label>
                        </div>
                      </div>
                    </div>

                    {/* Export Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Export Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Export Schedule</label>
                          <select
                            name="export.schedule"
                            value={auditLogsData.export.schedule}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-select"
                          >
                            <option value="none">No Schedule</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        {auditLogsData.export.schedule !== 'none' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Export Time</label>
                            <input
                              type="time"
                              name="export.time"
                              value={auditLogsData.export.time}
                              onChange={handleAuditLogsChange}
                              className="mt-1 form-input"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Export Format</label>
                          <select
                            name="export.format"
                            value={auditLogsData.export.format}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-select"
                          >
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="xml">XML</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="export.compression"
                            checked={auditLogsData.export.compression}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Enable Compression</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="export.encryption"
                            checked={auditLogsData.export.encryption}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Enable Encryption</label>
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notifications.onCritical"
                            checked={auditLogsData.notifications.onCritical}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Notify on Critical Events</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="notifications.onWarning"
                            checked={auditLogsData.notifications.onWarning}
                            onChange={handleAuditLogsChange}
                            className="form-checkbox"
                          />
                          <label className="ml-2 text-sm text-gray-700">Notify on Warning Events</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notification Recipients</label>
                          <textarea
                            name="notifications.recipients"
                            value={auditLogsData.notifications.recipients.join('\n')}
                            onChange={handleAuditLogsChange}
                            className="mt-1 form-textarea"
                            rows={3}
                            placeholder="Enter email addresses (one per line)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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

    </div>
  );
};

export default SettingsPage;