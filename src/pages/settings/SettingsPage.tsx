import { useState, useEffect } from 'react';
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
  Cloud,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../controllers/AuthControllers';
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
  getUsers,
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
  name: string;
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

const SettingsPage = () => {

  const { isAttorney, isSuperAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);

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
    name: '',
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
    timeZone: '',
    dateFormat: ''
  });

  // Add these state variables after the existing state declarations
  const [usersData, setUsersData] = useState<any>({});
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
  const [databaseSettingsData, setDatabaseSettingsData] = useState<any>({});
  const [backupSettingsData, setBackupSettingsData] = useState<any>({});
  const [apiSettingsData, setApiSettingsData] = useState<any>({});
  const [performanceSettingsData, setPerformanceSettingsData] = useState<any>({});

  // Add these state variables for modals
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showAddField, setShowAddField] = useState(false);

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

  // Load initial data
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?._id) return;
      
      try {
        let data;
        switch (activeTab) {
          case 'profile':
            data = await getProfile(user._id);
            setProfileData(data.data.value);
            break;
          case 'organization':
            data = await getOrganization(user._id);
            setOrganizationData(data.data.value);
            break;
          case 'notifications':
            data = await getNotifications(user._id);
            setNotificationData(data.data.value);
            break;
          case 'security':
            data = await getSecurity(user._id);
            setSecurityData(data.data.value);
            break;
          case 'email':
            data = await getEmailSettings(user._id);
            setEmailData(data.data.value);
            break;
          case 'integrations':
            data = await getIntegrations(user._id);
            setIntegrationData(data.data);
            break;
          case 'billing':
            data = await getBilling(user._id);
            setBillingData(data.data.value);
            break;
          case 'users':
            data = await getUsers(user._id);
            setUsersData(data.data.value);
            break;
          case 'cases':
            data = await getCaseSettings(user._id);
            setCaseSettingsData(data.data);
            break;
          case 'forms':
            data = await getFormTemplates(user._id);
            setFormTemplatesData(data.data.value);
            break;
          case 'reports':
            data = await getReportSettings(user._id);
            setReportSettingsData(data.data);
            break;
          case 'roles':
            data = await getRoles(user._id);
            setRolesData(data.data);
            break;
          case 'database':
            data = await getDatabaseSettings(user._id);
            setDatabaseSettingsData(data.data);
            break;
          case 'system':
            data = await getSystemSettings(user._id);
            setSystemData(data.data);
            break;
          case 'audit':
            data = await getAuditLogs(user._id);
            // Handle audit logs data
            break;
          case 'backup':
            data = await getBackupSettings(user._id);
            setBackupSettingsData(data.data);
            break;
          case 'api':
            data = await getApiSettings(user._id);
            setApiSettingsData(data.data);
            break;
          case 'performance':
            data = await getPerformanceSettings(user._id);
            setPerformanceSettingsData(data.data);
            break;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [activeTab, user?._id]);

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

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSystemData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSystemSubmit = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateSystemSettings(user._id, systemData);
      // Show success message
    } catch (error) {
      console.error('Error updating system:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const userId = user._id; // Store user._id in a variable to avoid null checks
      switch (activeTab) {
        case 'profile':
          await updateProfile(userId, profileData);
          break;
        case 'organization':
          await updateOrganization(userId, organizationData);
          break;
        case 'notifications':
          await updateNotifications(userId, notificationData);
          break;
        case 'security':
          await updateSecurity(userId, securityData);
          break;
        case 'email':
          await updateEmailSettings(userId, emailData);
          break;
        case 'integrations':
          await updateIntegrations(userId, integrationData);
          break;
        case 'billing':
          await updateBilling(userId, billingData);
          break;
        case 'users':
          await updateUsers(userId, usersData);
          break;
        case 'cases':
          await updateCaseSettings(userId, caseSettingsData);
          break;
        case 'forms':
          await updateFormTemplates(userId, formTemplatesData);
          break;
        case 'reports':
          await updateReportSettings(userId, reportSettingsData);
          break;
        case 'roles':
          await updateRoles(userId, rolesData);
          break;
        case 'database':
          await updateDatabaseSettings(userId, databaseSettingsData);
          break;
        case 'system':
          await updateSystemSettings(userId, systemData);
          break;
        case 'backup':
          await updateBackupSettings(userId, backupSettingsData);
          break;
        case 'api':
          await updateApiSettings(userId, apiSettingsData);
          break;
        case 'performance':
          await updatePerformanceSettings(userId, performanceSettingsData);
          break;
        default:
          console.warn('No settings to save for this section');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Implement delete logic
    setShowDeleteConfirmation(false);
  };

  const handleSignOutAllDevices = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      await signOutAllDevices(user._id);
      // You might want to redirect to login page or show a success message
      window.location.href = '/login'; // Redirect to login page after signing out
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
                          name="name"
                          value={organizationData.name}
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
                        <div className="flex items-center justify-between">
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
                        <div className="flex items-center justify-between">
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
                        <div className="flex items-center justify-between">
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
                      <div className="bg-gray-50 p-4 rounded-lg">
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

                      <div className="bg-gray-50 p-4 rounded-lg">
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
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search users..."
                          className="form-input w-full"
                        />
                      </div>
                      <button className="btn btn-primary">Add User</button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        <li>
                          <div className="px-4 py-4 flex items-center sm:px-6">
                            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <div className="flex text-sm">
                                  <p className="font-medium text-primary-600 truncate">John Doe</p>
                                  <p className="ml-1 flex-shrink-0 font-normal text-gray-500">Admin</p>
                                </div>
                                <div className="mt-2 flex">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Mail className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                    <p>john@example.com</p>
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
                    <div className="flex justify-between items-center">
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Search templates..."
                          className="form-input w-full"
                        />
                      </div>
                      <button className="btn btn-primary">Add Template</button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        <li>
                          <div className="px-4 py-4 flex items-center sm:px-6">
                            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                              <div>
                                <div className="flex text-sm">
                                  <p className="font-medium text-primary-600 truncate">I-130 Petition</p>
                                  <p className="ml-1 flex-shrink-0 font-normal text-gray-500">Family-Based</p>
                                </div>
                                <div className="mt-2 flex">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                    <p>Last updated 2 days ago</p>
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

            {/* Report Settings */}
            {activeTab === 'reports' && (isSuperAdmin || isAttorney) && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Report Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Report Templates</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Case Status Report</p>
                            <p className="text-xs text-gray-500">Monthly case status summary</p>
                          </div>
                          <button className="btn btn-outline text-xs py-1">Edit</button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Financial Report</p>
                            <p className="text-xs text-gray-500">Monthly financial summary</p>
                          </div>
                          <button className="btn btn-outline text-xs py-1">Edit</button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Schedule Reports</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Weekly Case Summary</p>
                            <p className="text-xs text-gray-500">Every Monday at 9:00 AM</p>
                          </div>
                          <button className="btn btn-outline text-xs py-1">Edit</button>
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
                            className="mt-1 form-input" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                          <select 
                            name="timeZone"
                            value={systemData.timeZone}
                            onChange={handleSystemChange}
                            className="mt-1 form-select"
                          >
                            <option>UTC</option>
                            <option>America/New_York</option>
                            <option>America/Los_Angeles</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date Format</label>
                          <select 
                            name="dateFormat"
                            value={systemData.dateFormat}
                            onChange={handleSystemChange}
                            className="mt-1 form-select"
                          >
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Maintenance</h3>
                      <div className="space-y-4">
                        <button className="btn btn-outline flex items-center">
                          <Server className="h-4 w-4 mr-2" />
                          Clear Cache
                        </button>
                        <button className="btn btn-outline flex items-center">
                          <Database className="h-4 w-4 mr-2" />
                          Optimize Database
                        </button>
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
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Backup Schedule</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Frequency</label>
                          <select className="mt-1 form-select">
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Time</label>
                          <input type="time" className="mt-1 form-input" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Retention Period</label>
                          <input type="number" className="mt-1 form-input" placeholder="30" />
                          <p className="mt-1 text-xs text-gray-500">Number of days to keep backups</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Manual Backup</h3>
                      <div className="space-y-4">
                        <button className="btn btn-outline flex items-center">
                          <HardDrive className="h-4 w-4 mr-2" />
                          Create Backup Now
                        </button>
                        <button className="btn btn-outline flex items-center">
                          <Cloud className="h-4 w-4 mr-2" />
                          Upload Backup
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Backups</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Backup 2023-12-01</p>
                            <p className="text-xs text-gray-500">2.3 GB • 1 day ago</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="btn btn-outline text-xs py-1">Download</button>
                            <button className="btn btn-outline text-xs py-1">Restore</button>
                          </div>
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

            {/* Database Settings */}
            {activeTab === 'database' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Database Settings</h2>
                  <div className="space-y-6">
                    {/* Connection Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Connection Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Host</label>
                          <input
                            type="text"
                            className="mt-1 form-input"
                            placeholder="localhost"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Port</label>
                          <input
                            type="number"
                            className="mt-1 form-input"
                            placeholder="5432"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Database Name</label>
                          <input
                            type="text"
                            className="mt-1 form-input"
                            placeholder="immigration_db"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Schema</label>
                          <input
                            type="text"
                            className="mt-1 form-input"
                            placeholder="public"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Backup Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Backup Configuration</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Backup Schedule</label>
                          <select className="mt-1 form-select">
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
                          <input
                            type="number"
                            className="mt-1 form-input"
                            placeholder="30"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            id="compression"
                          />
                          <label htmlFor="compression" className="ml-2 block text-sm text-gray-700">
                            Enable backup compression
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Performance Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Connection Pool Size</label>
                          <input
                            type="number"
                            className="mt-1 form-input"
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Query Timeout (seconds)</label>
                          <input
                            type="number"
                            className="mt-1 form-input"
                            placeholder="30"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            id="queryCache"
                          />
                          <label htmlFor="queryCache" className="ml-2 block text-sm text-gray-700">
                            Enable query caching
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Maintenance */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Maintenance</h3>
                      <div className="space-y-4">
                        <button className="btn btn-outline flex items-center">
                          <Server className="h-4 w-4 mr-2" />
                          Run Database Vacuum
                        </button>
                        <button className="btn btn-outline flex items-center">
                          <Activity className="h-4 w-4 mr-2" />
                          Analyze Tables
                        </button>
                        <button className="btn btn-outline flex items-center">
                          <Cloud className="h-4 w-4 mr-2" />
                          Export Schema
                        </button>
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
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Production Key</p>
                            <p className="text-xs text-gray-500">Last used: 2 hours ago</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="btn btn-outline text-xs py-1">
                              Regenerate
                            </button>
                            <button className="btn btn-outline text-xs py-1">
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Development Key</p>
                            <p className="text-xs text-gray-500">Last used: 5 minutes ago</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="btn btn-outline text-xs py-1">
                              Regenerate
                            </button>
                            <button className="btn btn-outline text-xs py-1">
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rate Limiting */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Rate Limiting</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Requests per minute (per IP)
                          </label>
                          <input
                            type="number"
                            className="mt-1 form-input"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Burst limit
                          </label>
                          <input
                            type="number"
                            className="mt-1 form-input"
                            placeholder="200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Webhooks */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Webhooks</h3>
                        <button className="btn btn-outline text-xs py-1">
                          Add Webhook
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Case Updates</p>
                            <p className="text-xs text-gray-500">https://example.com/webhook/cases</p>
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
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Document Events</p>
                            <p className="text-xs text-gray-500">https://example.com/webhook/documents</p>
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
                      </div>
                    </div>

                    {/* CORS Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">CORS Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Allowed Origins
                          </label>
                          <textarea
                            className="mt-1 form-input"
                            rows={3}
                            placeholder="https://example.com&#10;https://app.example.com"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            One origin per line
                          </p>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            id="allowCredentials"
                          />
                          <label htmlFor="allowCredentials" className="ml-2 block text-sm text-gray-700">
                            Allow credentials
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
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Performance Monitoring */}
            {activeTab === 'performance' && isSuperAdmin && (
              <>
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Performance Monitoring</h2>
                  <div className="space-y-6">
                    {/* System Resources */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">System Resources</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-500">CPU Usage</p>
                          <p className="text-2xl font-semibold text-gray-900">45%</p>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-primary-500 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Memory Usage</p>
                          <p className="text-2xl font-semibold text-gray-900">2.1 GB</p>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-primary-500 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Storage</p>
                          <p className="text-2xl font-semibold text-gray-900">45.3 GB</p>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-primary-500 rounded-full" style={{ width: '30%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Response Times */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">API Response Times</h3>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">GET /cases</span>
                            <span className="text-sm text-gray-500">Avg: 120ms</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: '20%' }}></div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">POST /documents</span>
                            <span className="text-sm text-gray-500">Avg: 450ms</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">GET /forms</span>
                            <span className="text-sm text-gray-500">Avg: 80ms</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: '15%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Error Rates */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Error Rates (Last 24h)</h3>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">4xx Errors</p>
                              <p className="text-xs text-gray-500">Client-side errors</p>
                            </div>
                            <span className="text-sm font-medium text-yellow-600">2.3%</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">5xx Errors</p>
                              <p className="text-xs text-gray-500">Server-side errors</p>
                            </div>
                            <span className="text-sm font-medium text-red-600">0.1%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cache Performance */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Cache Performance</h3>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Cache Hit Rate</p>
                              <p className="text-xs text-gray-500">Last hour</p>
                            </div>
                            <span className="text-sm font-medium text-green-600">89.5%</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: '89.5%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Users */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Active Users</h3>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-semibold text-gray-900">127</p>
                              <p className="text-sm text-gray-500">Current active users</p>
                            </div>
                            <Users className="h-8 w-8 text-primary-500" />
                          </div>
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

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirm Delete
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this item? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Cancel
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