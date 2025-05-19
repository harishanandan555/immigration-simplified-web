import api from '../utils/api';
import { SETTINGS_END_POINTS } from '../utils/constants';

// Define common response type
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Set to false to skip the method
const IS_PROFILE_ENABLED = true;
const IS_ORGANIZATION_ENABLED = true;
const IS_NOTIFICATIONS_ENABLED = true;
const IS_SECURITY_ENABLED = true;
const IS_EMAIL_ENABLED = true;
const IS_INTEGRATIONS_ENABLED = true;
const IS_BILLING_ENABLED = false;
const IS_USERS_ENABLED = true;
const IS_CASE_SETTINGS_ENABLED = true;
const IS_FORM_TEMPLATES_ENABLED = false;
const IS_REPORT_SETTINGS_ENABLED = false;
const IS_ROLES_ENABLED = false;
const IS_DATABASE_ENABLED = false;
const IS_SYSTEM_ENABLED = false;
const IS_AUDIT_LOGS_ENABLED = false;
const IS_BACKUP_ENABLED = false;
const IS_API_SETTINGS_ENABLED = false;
const IS_PERFORMANCE_ENABLED = false;

// Profile Settings
export const getProfile = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_PROFILE_ENABLED) {
    console.log('getProfile method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.PROFILE_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, profileData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.PROFILE_UPDATE}/${userId}`, profileData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Organization Settings
export const getOrganization = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_ORGANIZATION_ENABLED) {
    console.log('getOrganization method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.ORGANIZATION_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
};

export const updateOrganization = async (userId: string, orgData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.ORGANIZATION_UPDATE}/${userId}`, orgData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

// Notification Settings
export const getNotifications = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_NOTIFICATIONS_ENABLED) {
    console.log('getNotifications method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.NOTIFICATIONS_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const updateNotifications = async (userId: string, notificationData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.NOTIFICATIONS_UPDATE}/${userId}`, notificationData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating notifications:', error);
    throw error;
  }
};

// Security Settings
export const getSecurity = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_SECURITY_ENABLED) {
    console.log('getSecurity method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.SECURITY_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching security settings:', error);
    throw error;
  }
};

export const updateSecurity = async (userId: string, securityData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.SECURITY_UPDATE}/${userId}`, securityData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating security settings:', error);
    throw error;
  }
};

export const signOutAllDevices = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.SECURITY_SIGNOUT_ALL}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error signing out all devices:', error);
    throw error;
  }
};

// Email Settings
export const getEmailSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_EMAIL_ENABLED) {
    console.log('getEmailSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.EMAIL_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching email settings:', error);
    throw error;
  }
};

export const updateEmailSettings = async (userId: string, emailData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.EMAIL_UPDATE}/${userId}`, emailData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating email settings:', error);
    throw error;
  }
};

// Integration Settings
export const getIntegrations = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_INTEGRATIONS_ENABLED) {
    console.log('getIntegrations method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.INTEGRATIONS_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching integrations:', error);
    throw error;
  }
};

export const updateIntegrations = async (userId: string, integrationData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.INTEGRATIONS_UPDATE}/${userId}`, integrationData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating integrations:', error);
    throw error;
  }
};

// Billing Settings
export const getBilling = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_BILLING_ENABLED) {
    console.log('getBilling method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.BILLING_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching billing:', error);
    throw error;
  }
};


export const updateBilling = async (userId: string, billingData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.BILLING_UPDATE}/${userId}`, billingData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating billing:', error);
    throw error;
  }
};

// User Management
export const getUsers = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_USERS_ENABLED) {
    console.log('getUsers method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.USERS_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUsers = async (userId: string, usersData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.USERS_UPDATE}/${userId}`, usersData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating users:', error);
    throw error;
  }
};

// Case Settings
export const getCaseSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_CASE_SETTINGS_ENABLED) {
    console.log('getCaseSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.CASE_SETTINGS_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching case settings:', error);
    throw error;
  }
};

export const updateCaseSettings = async (userId: string, caseSettingsData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.CASE_SETTINGS_UPDATE}/${userId}`, caseSettingsData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating case settings:', error);
    throw error;
  }
};

// Form Templates
export const getFormTemplates = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_FORM_TEMPLATES_ENABLED) {
    console.log('getFormTemplates method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.FORM_TEMPLATES_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching form templates:', error);
    throw error;
  }
};

export const updateFormTemplates = async (userId: string, formTemplatesData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.FORM_TEMPLATES_UPDATE}/${userId}`, formTemplatesData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating form templates:', error);
    throw error;
  }
};

// Report Settings
export const getReportSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_REPORT_SETTINGS_ENABLED) {
    console.log('getReportSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.REPORT_SETTINGS_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching report settings:', error);
    throw error;
  }
};

export const updateReportSettings = async (userId: string, reportSettingsData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.REPORT_SETTINGS_UPDATE}/${userId}`, reportSettingsData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating report settings:', error);
    throw error;
  }
};

// Roles & Permissions
export const getRoles = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_ROLES_ENABLED) {
    console.log('getRoles method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.ROLES_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const updateRoles = async (userId: string, rolesData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.ROLES_UPDATE}/${userId}`, rolesData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating roles:', error);
    throw error;
  }
};

// Database Settings
export const getDatabaseSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_DATABASE_ENABLED) {
    console.log('getDatabaseSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.DATABASE_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching database settings:', error);
    throw error;
  }
};

export const updateDatabaseSettings = async (userId: string, databaseData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.DATABASE_UPDATE}/${userId}`, databaseData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating database settings:', error);
    throw error;
  }
};

// System Settings
export const getSystemSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_SYSTEM_ENABLED) {
    console.log('getSystemSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.SYSTEM_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (userId: string, systemData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.SYSTEM_UPDATE}/${userId}`, systemData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// Audit Logs
export const getAuditLogs = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_AUDIT_LOGS_ENABLED) {
    console.log('getAuditLogs method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.AUDIT_LOGS_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Backup & Recovery
export const getBackupSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_BACKUP_ENABLED) {
    console.log('getBackupSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.BACKUP_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching backup settings:', error);
    throw error;
  }
};

export const updateBackupSettings = async (userId: string, backupData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.BACKUP_UPDATE}/${userId}`, backupData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating backup settings:', error);
    throw error;
  }
};

// API Settings
export const getApiSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_API_SETTINGS_ENABLED) {
    console.log('getApiSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.API_SETTINGS_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching API settings:', error);
    throw error;
  }
};

export const updateApiSettings = async (userId: string, apiSettingsData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.API_SETTINGS_UPDATE}/${userId}`, apiSettingsData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating API settings:', error);
    throw error;
  }
};

// Performance Settings
export const getPerformanceSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_PERFORMANCE_ENABLED) {
    console.log('getPerformanceSettings method is skipped.');
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.PERFORMANCE_GET}/${userId}`);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching performance settings:', error);
    throw error;
  }
};

export const updatePerformanceSettings = async (userId: string, performanceData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.PERFORMANCE_UPDATE}/${userId}`, performanceData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating performance settings:', error);
    throw error;
  }
};