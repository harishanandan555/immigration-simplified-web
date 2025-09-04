import api from '../utils/api';
import { SETTINGS_END_POINTS, ROLE_TYPES, PERMISSION_MODULES, PERMISSION_ACTIONS } from '../utils/constants';
import axios from 'axios';
import {
  FORM_FIELD_TYPES,
  FORM_TEMPLATE_CATEGORIES,
  FORM_TEMPLATE_TYPES,
  FORM_TEMPLATE_STATUS,
  FORM_TEMPLATE_ENDPOINTS
} from '../utils/constants';

// Define common response type
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

const handleApiError = (error: any) => {
    if (axios.isAxiosError(error)) {
        return {
            data: error.response?.data || 'An error occurred',
            status: error.response?.status || 500,
            statusText: error.response?.statusText || 'Internal Server Error'
        };
    }
    return {
        data: 'An unexpected error occurred',
        status: 500,
        statusText: 'Internal Server Error'
    };
};


// Form Template Interfaces
export interface FormTemplateField {
  id: string;
  name: string;
  label: string;
  type: keyof typeof FORM_FIELD_TYPES;
  required: boolean;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  options?: string[];
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  order: number;
}

export interface FormTemplate {
  _id?: string;
  name: string;
  description: string;
  category: keyof typeof FORM_TEMPLATE_CATEGORIES;
  type: keyof typeof FORM_TEMPLATE_TYPES;
  status: keyof typeof FORM_TEMPLATE_STATUS;
  fields: FormTemplateField[];
  version: string;
  effectiveDate: string;
  expirationDate?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    uscisFormNumber?: string;
    uscisFormLink?: string;
    estimatedProcessingTime?: string;
    fee?: number;
    instructions?: string;
  };
}

export interface FormTemplateData {
  templates: FormTemplate[];
  totalTemplates: number;
  activeTemplates: number;
}

export interface GetFormTemplatesParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  type?: string;
  search?: string;
}

// Roles & Permissions Interfaces
interface Permission {
  module: keyof typeof PERMISSION_MODULES;
  actions: Array<keyof typeof PERMISSION_ACTIONS>;
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

interface RoleData {
  roles: Role[];
  defaultRole: string;
}

interface PermissionData {
  permissions: Permission[];
  roleId: string;
}

// Set to false to skip the method
const IS_PROFILE_ENABLED = true;
const IS_ORGANIZATION_ENABLED = true;
const IS_NOTIFICATIONS_ENABLED = true;
const IS_SECURITY_ENABLED = true;
const IS_EMAIL_ENABLED = true;
const IS_INTEGRATIONS_ENABLED = true;
const IS_BILLING_ENABLED = false;
const IS_CASE_SETTINGS_ENABLED = true;
const IS_FORM_TEMPLATES_ENABLED = true;
const IS_REPORT_SETTINGS_ENABLED = true;
const IS_ROLES_ENABLED = true;
const IS_DATABASE_ENABLED = true;
const IS_SYSTEM_ENABLED = true;
const IS_AUDIT_LOGS_ENABLED = true;
const IS_BACKUP_ENABLED = true;
const IS_API_SETTINGS_ENABLED = true;
const IS_PERFORMANCE_ENABLED = false;

// Profile Settings
export const getProfile = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_PROFILE_ENABLED) {
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.PROFILE_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.PROFILE_UPDATE}`.replace(':userId', userId), profileData);
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.ORGANIZATION_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.ORGANIZATION_UPDATE}`.replace(':userId', userId), orgData);
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.NOTIFICATIONS_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.NOTIFICATIONS_UPDATE}`.replace(':userId', userId), notificationData);
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.SECURITY_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.SECURITY_UPDATE}`.replace(':userId', userId), securityData);
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
    const response = await api.post(`${SETTINGS_END_POINTS.SECURITY_SIGNOUT_ALL}`.replace(':userId', userId));
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.EMAIL_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.EMAIL_UPDATE}`.replace(':userId', userId), emailData);
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.INTEGRATIONS_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.INTEGRATIONS_UPDATE}`.replace(':userId', userId), integrationData);
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.BILLING_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.BILLING_UPDATE}`.replace(':userId', userId), billingData);
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

export const updateUsers = async (userId: string, usersData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.USERS_UPDATE}`.replace(':userId', userId), usersData);
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.CASE_SETTINGS_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.CASE_SETTINGS_UPDATE}`.replace(':userId', userId), caseSettingsData);
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

// Form Template Settings
export const getFormTemplates = async (
  userId: string,
  params?: GetFormTemplatesParams
): Promise<ApiResponse<FormTemplateData>> => {
  if (!IS_FORM_TEMPLATES_ENABLED) {
    return {
      data: {
        templates: [],
        totalTemplates: 0,
        activeTemplates: 0
      },
      status: 200,
      statusText: 'Form templates feature is disabled'
    };
  }

  try {
    const response = await api.get(FORM_TEMPLATE_ENDPOINTS.GET_ALL, { params });
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getUscisFormNumbers = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await api.get(FORM_TEMPLATE_ENDPOINTS.GET_USCIS_FORM_NUMBERS);
    return {
      data: response.data.formNumbers,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getFormTemplateById = async (userId: string, templateId: string): Promise<ApiResponse<FormTemplate>> => {
  try {
    const response = await api.get(FORM_TEMPLATE_ENDPOINTS.GET_BY_ID.replace(':id', templateId));
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createFormTemplate = async (userId: string, templateData: Partial<FormTemplate>): Promise<ApiResponse<FormTemplate>> => {
  try {
    const response = await api.post(FORM_TEMPLATE_ENDPOINTS.CREATE, templateData);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateFormTemplate = async (userId: string, templateId: string, templateData: Partial<FormTemplate>): Promise<ApiResponse<FormTemplate>> => {
  try {
    const response = await api.put(FORM_TEMPLATE_ENDPOINTS.UPDATE.replace(':id', templateId), templateData);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteFormTemplate = async (userId: string, templateId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(FORM_TEMPLATE_ENDPOINTS.DELETE.replace(':id', templateId));
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const duplicateFormTemplate = async (userId: string, templateId: string): Promise<ApiResponse<FormTemplate>> => {
  try {
    const response = await api.post(FORM_TEMPLATE_ENDPOINTS.DUPLICATE.replace(':id', templateId));
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const exportFormTemplate = async (userId: string, templateId: string): Promise<ApiResponse<Blob>> => {
  try {
    const response = await api.get(FORM_TEMPLATE_ENDPOINTS.EXPORT.replace(':id', templateId), {
      responseType: 'blob'
    });
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const importFormTemplate = async (userId: string, file: File): Promise<ApiResponse<FormTemplate>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(FORM_TEMPLATE_ENDPOINTS.IMPORT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};


// Report Settings
export const getReportSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_REPORT_SETTINGS_ENABLED) {
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.REPORT_SETTINGS_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.REPORT_SETTINGS_UPDATE}`.replace(':userId', userId), reportSettingsData);
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

export const deleteReportSettings = async (userId: string, reportId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.delete(`${SETTINGS_END_POINTS.REPORT_SETTINGS_DELETE}`
      .replace(':userId', userId)
      .replace(':reportId', reportId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error deleting report settings:', error);
    throw error;
  }
};

// Roles & Permissions Settings
export const getRoles = async (): Promise<ApiResponse<RoleData>> => {
  if (!IS_ROLES_ENABLED) {
    return {
      data: { roles: [], defaultRole: '' },
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(SETTINGS_END_POINTS.ROLES_GET);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const createRole = async (roleData: Role): Promise<ApiResponse<Role>> => {
  if (!IS_ROLES_ENABLED) {
    return {
      data: roleData,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.post(SETTINGS_END_POINTS.ROLES_CREATE, roleData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateRole = async (userId: string, roleId: string, roleData: Partial<Role>): Promise<ApiResponse<Role>> => {
  try {
    const response = await api.put(
      SETTINGS_END_POINTS.ROLES_UPDATE.replace(':roleId', roleId),
      roleData
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteRole = async (roleId: string): Promise<ApiResponse<void>> => {
  if (!IS_ROLES_ENABLED) {
    return {
      data: undefined,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.delete(SETTINGS_END_POINTS.ROLES_DELETE.replace(':roleId', roleId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPermissions = async (roleId: string): Promise<ApiResponse<PermissionData>> => {
  if (!IS_ROLES_ENABLED) {
    return {
      data: { permissions: [], roleId },
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(SETTINGS_END_POINTS.PERMISSIONS_GET.replace(':roleId', roleId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updatePermissions = async (permissionData: PermissionData): Promise<ApiResponse<PermissionData>> => {
  if (!IS_ROLES_ENABLED) {
    return {
      data: permissionData,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.put(
      SETTINGS_END_POINTS.PERMISSIONS_UPDATE.replace(':roleId', permissionData.roleId),
      permissionData
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Database Settings
export const getDatabaseSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_DATABASE_ENABLED) {
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.DATABASE_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.DATABASE_UPDATE}`.replace(':userId', userId), databaseData);
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
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.SYSTEM_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.SYSTEM_UPDATE}`.replace(':userId', userId), systemData);
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

export const clearSystemCache = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.CLEAR_CACHE}`.replace(':userId', userId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error clearing system cache:', error);
    throw error;
  }
};

export const optimizeSystemDatabase = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.OPTIMIZE_DATABASE}`.replace(':userId', userId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error optimizing system database:', error);
    throw error;
  }
};

export const updateMaintenanceMode = async (userId: string, maintenanceData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.UPDATE_MAINTENANCE_MODE}`.replace(':userId', userId), maintenanceData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    throw error;
  }
};

export const updateSystemPerformance = async (userId: string, performanceData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.UPDATE_SYSTEM_PERFORMANCE}`.replace(':userId', userId), performanceData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating system performance:', error);
    throw error;
  }
};

export const updateSystemSecurity = async (userId: string, securityData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.UPDATE_SYSTEM_SECURITY}`.replace(':userId', userId), securityData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating system security:', error);
    throw error;
  }
};

export const updateSystemNotifications = async (userId: string, notificationData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.UPDATE_SYSTEM_NOTIFICATIONS}`.replace(':userId', userId), notificationData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating system notifications:', error);
    throw error;
  }
};

export const updateSystemLogging = async (userId: string, loggingData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.UPDATE_SYSTEM_LOGGING}`.replace(':userId', userId), loggingData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating system logging:', error);
    throw error;
  }
};

// Audit Logs Settings
export const getAuditLogs = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_AUDIT_LOGS_ENABLED) {
    
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.AUDIT_LOGS_GET}`.replace(':userId', userId));
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

export const updateAuditLogs = async (userId: string, auditLogsData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(
      SETTINGS_END_POINTS.AUDIT_LOGS_UPDATE.replace(':userId', userId),
      auditLogsData
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const exportAuditLogs = async (userId: string, exportParams: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(
      SETTINGS_END_POINTS.AUDIT_LOGS_EXPORT.replace(':userId', userId),
      exportParams
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const archiveAuditLogs = async (userId: string, archiveParams: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(
      SETTINGS_END_POINTS.AUDIT_LOGS_ARCHIVE.replace(':userId', userId),
      archiveParams
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const filterAuditLogs = async (userId: string, filterParams: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(
      SETTINGS_END_POINTS.AUDIT_LOGS_FILTER.replace(':userId', userId),
      filterParams
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateAuditLogsNotifications = async (userId: string, notificationData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(
      SETTINGS_END_POINTS.AUDIT_LOGS_NOTIFICATIONS.replace(':userId', userId),
      notificationData
    );
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// Backup & Recovery Settings
export const getBackupSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_BACKUP_ENABLED) {
    
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.BACKUP_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.BACKUP_UPDATE}`.replace(':userId', userId), backupData);
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

export const createBackup = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.BACKUP_CREATE}`.replace(':userId', userId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const restoreBackup = async (userId: string, backupId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.BACKUP_RESTORE}`.replace(':userId', userId), { backupId });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
};

export const listBackups = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get(`${SETTINGS_END_POINTS.BACKUP_LIST}`.replace(':userId', userId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error listing backups:', error);
    throw error;
  }
};

export const deleteBackup = async (userId: string, backupId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.delete(`${SETTINGS_END_POINTS.BACKUP_DELETE}`.replace(':userId', userId), {
      data: { backupId }
    });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw error;
  }
};

export const testBackupConnection = async (userId: string, storage: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.BACKUP_TEST_CONNECTION}`.replace(':userId', userId), storage);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error testing backup connection:', error);
    throw error;
  }
};

export const validateBackupSettings = async (userId: string, settings: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.BACKUP_VALIDATE}`.replace(':userId', userId), settings);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error validating backup settings:', error);
    throw error;
  }
};

// API Settings
export const getApiSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_API_SETTINGS_ENABLED) {
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.API_SETTINGS_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.API_SETTINGS_UPDATE}`.replace(':userId', userId), apiSettingsData);
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

export const regenerateApiKey = async (userId: string, type: 'production' | 'development'): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.API_SETTINGS_REGENERATE_KEY}`.replace(':userId', userId), { type });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error regenerating API key:', error);
    throw error;
  }
};

export const validateApiSettings = async (userId: string, settings: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.API_SETTINGS_VALIDATE}`.replace(':userId', userId), settings);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error validating API settings:', error);
    throw error;
  }
};

export const testApiConnection = async (userId: string, testConfig: {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(
      `${SETTINGS_END_POINTS.API_SETTINGS_TEST_CONNECTION}`.replace(':userId', userId),
      testConfig
    );
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error testing API connection:', error);
    throw error;
  }
};

// Performance Settings
export const getPerformanceSettings = async (userId: string): Promise<ApiResponse<any>> => {
  if (!IS_PERFORMANCE_ENABLED) {
    return {
      data: null,
      status: 0,
      statusText: 'Method skipped'
    };
  }

  try {
    const response = await api.get(`${SETTINGS_END_POINTS.PERFORMANCE_GET}`.replace(':userId', userId));
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
    const response = await api.put(`${SETTINGS_END_POINTS.PERFORMANCE_UPDATE}`.replace(':userId', userId), performanceData);
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

export const optimizePerformance = async (userId: string, optimizationData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.PERFORMANCE_OPTIMIZE}`.replace(':userId', userId), optimizationData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error optimizing performance:', error);
    throw error;
  }
};

export const updatePerformanceMonitoring = async (userId: string, monitoringData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.PERFORMANCE_MONITOR}`.replace(':userId', userId), monitoringData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating performance monitoring:', error);
    throw error;
  }
};

export const updatePerformanceCache = async (userId: string, cacheData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.PERFORMANCE_CACHE}`.replace(':userId', userId), cacheData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating performance cache:', error);
    throw error;
  }
};

export const updatePerformanceDatabase = async (userId: string, databaseData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.PERFORMANCE_DATABASE}`.replace(':userId', userId), databaseData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating performance database:', error);
    throw error;
  }
};

export const updatePerformanceAlerts = async (userId: string, alertsData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.put(`${SETTINGS_END_POINTS.PERFORMANCE_ALERTS}`.replace(':userId', userId), alertsData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating performance alerts:', error);
    throw error;
  }
};

export const testPerformanceSettings = async (userId: string, testConfig: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.PERFORMANCE_TEST}`.replace(':userId', userId), testConfig);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error testing performance settings:', error);
    throw error;
  }
};

export const getPerformanceMetrics = async (userId: string, params: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get(`${SETTINGS_END_POINTS.PERFORMANCE_METRICS}`.replace(':userId', userId), { params });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

export const validatePerformanceSettings = async (userId: string, settings: any): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.PERFORMANCE_VALIDATE}`.replace(':userId', userId), settings);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error validating performance settings:', error);
    throw error;
  }
};

// Database Maintenance Operations
export const vacuumDatabase = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.DATABASE_VACUUM}`.replace(':userId', userId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error performing database vacuum:', error);
    throw error;
  }
};

export const analyzeDatabase = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(`${SETTINGS_END_POINTS.DATABASE_ANALYZE}`.replace(':userId', userId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error analyzing database:', error);
    throw error;
  }
};

export const exportDatabaseSchema = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get(`${SETTINGS_END_POINTS.DATABASE_EXPORT}`.replace(':userId', userId), {
      responseType: 'blob'
    });
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error exporting database schema:', error);
    throw error;
  }
};