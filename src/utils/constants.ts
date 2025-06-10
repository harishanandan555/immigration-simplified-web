export const APPCONSTANTS = {
    API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5005"
        : "https://immigration-simplified-api.onrender.com"
};

export const AUTH_END_POINTS = {
    REGISTER_SUPERADMIN: "/api/v1/auth/register/superadmin",
    REGISTER_ATTORNEY: "/api/v1/auth/register/attorney",
    REGISTER_USER: "/api/v1/auth/register/user",
    LOGIN: "/api/v1/auth/login",
    REFRESH_TOKEN: "/api/v1/auth/refresh-token",
    PROFILE_GET: "/api/v1/auth/profile",
    PROFILE_PUT: "/api/v1/auth/profile",
    USER_UPDATE: "/api/v1/auth/users/:id",
    USER_DELETE: "/api/v1/auth/users/:id",
    GET_USERS_BY_ID: "/api/v1/auth/users/:id"
};

export const BILLING_END_POINTS = {
    GET_SUBSCRIPTION: "/api/v1/billing/subscription",
    UPDATE_SUBSCRIPTION: "/api/v1/billing/subscription",
    GET_PAYMENT_HISTORY: "/api/v1/billing/payment-history",
    UPDATE_PAYMENT_METHOD: "/api/v1/billing/payment-method",
    CANCEL_SUBSCRIPTION: "/api/v1/billing/subscription/cancel",
    RENEW_SUBSCRIPTION: "/api/v1/billing/subscription/renew",
    GET_INVOICES: "/api/v1/billing/invoices",
    GET_PLANS: "/api/v1/billing/plans",
    GET_PLAN_DETAILS: "/api/v1/billing/plans/:id"
};

export const CASE_END_POINTS = {
    GETCASES: "/api/v1/cases",
    CREATECASE: "/api/v1/cases",
    GETCASEBYID: "/api/v1/cases/:id",
    GETCASEBYNUMBER: "/api/v1/cases/number/:caseNumber",
    UPDATECASE: "/api/v1/cases/:id",
    ADDCASETASK: "/api/v1/cases/:id/tasks",
    UPDATECASETASK: "/api/v1/cases/:id/tasks/:taskId",
};

export const CLIENT_END_POINTS = {
    GETCLIENTS: "/api/v1/clients",
    CREATECLIENT: "/api/v1/clients",
    GETCLIENTBYID: "/api/v1/clients/:id",
    UPDATECLIENT: "/api/v1/clients/:id",
    ADDCLIENTDOCUMENT: "/api/v1/clients/:id/documents",
    GETCLIENTCASES: "/api/v1/clients/:id/cases",
};

export const COMPANY_END_POINTS = {
    GETCOMPANIESLIST: "/api/v1/companies/list/:userId",
    CREATECOMPANY: "/api/v1/companies/:userId",
    GETCOMPANYBYID: "/api/v1/companies/:id",
    UPDATECOMPANY: "/api/v1/companies/:id",
    DELETECOMPANY: "/api/v1/companies/:id",
    GETCOMPANYUSERS: "/api/v1/companies/:id/users"
};

export const FOIA_CASE_END_POINTS = {
    CREATECASE: "/api/v1/foia-cases",
    GETCASES: "/api/v1/foia-cases",
    GETCASEBYID: "/api/v1/foia-cases/:id",
};

export const IMMIGRATION_END_POINTS = {
    BASE: "/api/v1/immigration/process",
    GET_FORMS: "/api/v1/immigration/process/forms",
    START_PROCESS: "/api/v1/api/immigration/process/start",
    GET_PROCESS: "/api/v1/immigration/process/:processId",
    UPDATE_STEP: "/api/v1/immigration/process/:processId/step",
    ADD_DOCUMENT: "/api/v1/immigration/process/:processId/document",
    UPDATE_DOCUMENT: "/api/v1/immigration/process/:processId/document/:documentId",
    VALIDATE_FORM: "/api/v1/immigration/process/:processId/validate",
};

export const SETTINGS_END_POINTS = {
    // Profile
    PROFILE_GET: "/api/v1/settings/profile/:userId",
    PROFILE_UPDATE: "/api/v1/settings/profile/:userId",
    
    // Organization
    ORGANIZATION_GET: "/api/v1/settings/organization/:userId",
    ORGANIZATION_UPDATE: "/api/v1/settings/organization/:userId",
    
    // Notifications
    NOTIFICATIONS_GET: "/api/v1/settings/notifications/:userId",
    NOTIFICATIONS_UPDATE: "/api/v1/settings/notifications/:userId",
    
    // Security
    SECURITY_GET: "/api/v1/settings/security/:userId",
    SECURITY_UPDATE: "/api/v1/settings/security/:userId",
    SECURITY_SIGNOUT_ALL: "/api/v1/settings/security/signout-all/:userId",
    
    // Email
    EMAIL_GET: "/api/v1/settings/email/:userId",
    EMAIL_UPDATE: "/api/v1/settings/email/:userId",
    
    // Integrations
    INTEGRATIONS_GET: "/api/v1/settings/integrations/:userId",
    INTEGRATIONS_UPDATE: "/api/v1/settings/integrations/:userId",
    
    // Billing
    BILLING_GET: "/api/v1/settings/billing/:userId",
    BILLING_UPDATE: "/api/v1/settings/billing/:userId",
    
    // User Management
    USERS_GET: "/api/v1/settings/users/:userId",
    USERS_UPDATE: "/api/v1/settings/users/:userId",
    USERS_CREATE: "/api/v1/settings/users/:userId",
    
    // Case Settings
    CASE_SETTINGS_GET: "/api/v1/settings/cases/:userId",
    CASE_SETTINGS_UPDATE: "/api/v1/settings/cases/:userId",
    
    // Form Templates
    FORM_TEMPLATES_GET: "/api/v1/settings/forms/:userId",
    FORM_TEMPLATES_UPDATE: "/api/v1/settings/forms/:userId",
    
    // Report Settings
    REPORT_SETTINGS_GET: "/api/v1/settings/reports/:userId",
    REPORT_SETTINGS_UPDATE: "/api/v1/settings/reports/:userId",
    REPORT_SETTINGS_DELETE: "/api/v1/settings/reports/:userId/:reportId",
    
    // Roles & Permissions
    ROLES_GET: "/api/v1/settings/roles/:userId",
    ROLES_UPDATE: "/api/v1/settings/roles/:userId",
    ROLES_CREATE: "/api/v1/settings/roles/:userId",
    ROLES_DELETE: "/api/v1/settings/roles/:userId/:roleId",
    PERMISSIONS_GET: "/api/v1/settings/permissions/:userId",
    PERMISSIONS_UPDATE: "/api/v1/settings/permissions/:userId",
    
    // Database Settings
    DATABASE_GET: "/api/v1/settings/database/:userId",
    DATABASE_UPDATE: "/api/v1/settings/database/:userId",
    DATABASE_VACUUM: "/api/v1/settings/database/vacuum/:userId",
    DATABASE_ANALYZE: "/api/v1/settings/database/analyze/:userId",
    DATABASE_EXPORT: "/api/v1/settings/database/export/:userId",
    
    // System Settings
    SYSTEM_GET: "/api/v1/settings/system/:userId",
    SYSTEM_UPDATE: "/api/v1/settings/system/:userId",
    CLEAR_CACHE: "/api/v1/settings/system/cache/clear/:userId",
    OPTIMIZE_DATABASE: "/api/v1/settings/system/database/optimize/:userId",
    UPDATE_MAINTENANCE_MODE: "/api/v1/settings/system/maintenance/:userId",
    UPDATE_SYSTEM_PERFORMANCE: "/api/v1/settings/system/performance/:userId",
    UPDATE_SYSTEM_SECURITY: "/api/v1/settings/system/security/:userId",
    UPDATE_SYSTEM_NOTIFICATIONS: "/api/v1/settings/system/notifications/:userId",
    UPDATE_SYSTEM_LOGGING: "/api/v1/settings/system/logging/:userId",
    
    // Audit Logs
    AUDIT_LOGS_GET: "/api/v1/settings/audit-logs/:userId",
    AUDIT_LOGS_UPDATE: "/api/v1/settings/audit-logs/:userId",
    AUDIT_LOGS_EXPORT: "/api/v1/settings/audit-logs/:userId/export",
    AUDIT_LOGS_ARCHIVE: "/api/v1/settings/audit-logs/:userId/archive",
    AUDIT_LOGS_FILTER: "/api/v1/settings/audit-logs/:userId/filter",
    AUDIT_LOGS_NOTIFICATIONS: "/api/v1/settings/audit-logs/:userId/notifications",
    
    // Backup & Recovery
    BACKUP_GET: "/api/v1/settings/backup/:userId",
    BACKUP_UPDATE: "/api/v1/settings/backup/:userId",
    BACKUP_CREATE: "/api/v1/settings/backup/:userId/create",
    BACKUP_RESTORE: "/api/v1/settings/backup/:userId/restore",
    BACKUP_LIST: "/api/v1/settings/backup/:userId/list",
    BACKUP_DELETE: "/api/v1/settings/backup/:userId/delete",
    BACKUP_TEST_CONNECTION: "/api/v1/settings/backup/:userId/test-connection",
    BACKUP_VALIDATE: "/api/v1/settings/backup/:userId/validate",
    
    // API Settings
    API_SETTINGS_GET: "/api/v1/settings/api/:userId",
    API_SETTINGS_UPDATE: "/api/v1/settings/api/:userId",
    API_SETTINGS_VALIDATE: "/api/v1/settings/api/:userId/validate",
    API_SETTINGS_REGENERATE_KEY: "/api/v1/settings/api/:userId/keys/regenerate",
    API_SETTINGS_TEST_CONNECTION: "/api/v1/settings/api/:userId/test-connection",
    
    // Performance
    PERFORMANCE_GET: "/api/v1/settings/performance/:userId",
    PERFORMANCE_UPDATE: "/api/v1/settings/performance/:userId",
    PERFORMANCE_OPTIMIZE: "/api/v1/settings/performance/:userId/optimize",
    PERFORMANCE_MONITOR: "/api/v1/settings/performance/:userId/monitor",
    PERFORMANCE_CACHE: "/api/v1/settings/performance/:userId/cache",
    PERFORMANCE_DATABASE: "/api/v1/settings/performance/:userId/database",
    PERFORMANCE_ALERTS: "/api/v1/settings/performance/:userId/alerts",
    PERFORMANCE_TEST: "/api/v1/settings/performance/:userId/test",
    PERFORMANCE_METRICS: "/api/v1/settings/performance/:userId/metrics",
    PERFORMANCE_VALIDATE: "/api/v1/settings/performance/:userId/validate"
};

export const SUBSCRIPTION_END_POINTS = {
    GET_PLANS: "/api/v1/subscriptions/plans",
    GET_PLAN_BY_ID: "/api/v1/subscriptions/plans/:id",
    SUBSCRIBE: "/api/v1/subscriptions/subscribe",
    CANCEL: "/api/v1/subscriptions/cancel",
    GET_COMPANY_SUBSCRIPTION: "/api/v1/subscriptions/company/:companyId"
};

export const ROLE_TYPES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    ATTORNEY: 'attorney',
    PARALEGAL: 'paralegal',
    CLIENT: 'client',
    STAFF: 'staff',
} as const;

export const PERMISSION_MODULES = {
    CASES: 'cases',
    DOCUMENTS: 'documents',
    USERS: 'users',
    SETTINGS: 'settings',
    REPORTS: 'reports',
    BILLING: 'billing',
    CALENDAR: 'calendar',
    COMMUNICATIONS: 'communications',
    ANALYTICS: 'analytics',
} as const;

export const PERMISSION_ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',
    IMPORT: 'import',
    APPROVE: 'approve',
    REJECT: 'reject',
    ASSIGN: 'assign',
    SHARE: 'share',
} as const;

export const DEFAULT_ROLE_PERMISSIONS = {
    [ROLE_TYPES.SUPER_ADMIN]: {
        [PERMISSION_MODULES.CASES]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.DOCUMENTS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.USERS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.SETTINGS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.REPORTS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.BILLING]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.CALENDAR]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.COMMUNICATIONS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.ANALYTICS]: Object.values(PERMISSION_ACTIONS),
    },
    [ROLE_TYPES.ADMIN]: {
        [PERMISSION_MODULES.CASES]: [PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE, PERMISSION_ACTIONS.DELETE],
        [PERMISSION_MODULES.DOCUMENTS]: [PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE, PERMISSION_ACTIONS.DELETE],
        [PERMISSION_MODULES.USERS]: [PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.SETTINGS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.REPORTS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.BILLING]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.CALENDAR]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.COMMUNICATIONS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.ANALYTICS]: [PERMISSION_ACTIONS.READ],
    },
    [ROLE_TYPES.ATTORNEY]: {
        [PERMISSION_MODULES.CASES]: [PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.DOCUMENTS]: [PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.USERS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.SETTINGS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.REPORTS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.EXPORT],
        [PERMISSION_MODULES.BILLING]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.CALENDAR]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.COMMUNICATIONS]: Object.values(PERMISSION_ACTIONS),
        [PERMISSION_MODULES.ANALYTICS]: [PERMISSION_ACTIONS.READ],
    },
    [ROLE_TYPES.PARALEGAL]: {
        [PERMISSION_MODULES.CASES]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.DOCUMENTS]: [PERMISSION_ACTIONS.CREATE, PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.USERS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.SETTINGS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.REPORTS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.BILLING]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.CALENDAR]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.COMMUNICATIONS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.ANALYTICS]: [PERMISSION_ACTIONS.READ],
    },
    [ROLE_TYPES.CLIENT]: {
        [PERMISSION_MODULES.CASES]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.DOCUMENTS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.USERS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.SETTINGS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.REPORTS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.BILLING]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.CALENDAR]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.COMMUNICATIONS]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.UPDATE],
        [PERMISSION_MODULES.ANALYTICS]: [PERMISSION_ACTIONS.READ],
    },
    [ROLE_TYPES.STAFF]: {
        [PERMISSION_MODULES.CASES]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.DOCUMENTS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.USERS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.SETTINGS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.REPORTS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.BILLING]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.CALENDAR]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.COMMUNICATIONS]: [PERMISSION_ACTIONS.READ],
        [PERMISSION_MODULES.ANALYTICS]: [PERMISSION_ACTIONS.READ],
    },
} as const;

// Form Template Categories
export const FORM_TEMPLATE_CATEGORIES = {
  FAMILY_BASED: 'family',
  EMPLOYMENT_BASED: 'employment',
  NATURALIZATION: 'naturalization',
  ASYLUM: 'asylum',
  FOIA: 'foia',
  OTHER: 'other'
} as const;

// Form Template Status
export const FORM_TEMPLATE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived'
} as const;

// Form Template Types
export const FORM_TEMPLATE_TYPES = {
  USCIS: 'uscis',
  CUSTOM: 'custom',
  HYBRID: 'hybrid'
} as const;

// Form Field Types
export const FORM_FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  MULTI_SELECT: 'multi_select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  SIGNATURE: 'signature',
  ADDRESS: 'address',
  PHONE: 'phone',
  EMAIL: 'email',
  SSN: 'ssn',
  ALIEN_NUMBER: 'alien_number',
  RECEIPT_NUMBER: 'receipt_number'
} as const;

// Form Template Endpoints
export const FORM_TEMPLATE_ENDPOINTS = {
  GET_ALL: '/api/form-templates',
  GET_BY_ID: '/api/form-templates/:id',
  CREATE: '/api/form-templates',
  UPDATE: '/api/form-templates/:id',
  DELETE: '/api/form-templates/:id',
  DUPLICATE: '/api/form-templates/:id/duplicate',
  EXPORT: '/api/form-templates/:id/export',
  IMPORT: '/api/form-templates/import'
} as const;


