export const APPCONSTANTS = {
    API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5005"
        : "https://immigration-simplified-api.onrender.com"
};

export const AUTH_END_POINTS = {
    REGISTER: "/api/v1/auth/register",
    LOGIN: "/api/v1/auth/login",
    PROFILE_GET: "/api/v1/auth/profile",
    PROFILE_PUT: "/api/v1/auth/profile",
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
    PROFILE_GET: "/api/v1/settings/profile",
    PROFILE_UPDATE: "/api/v1/settings/profile",
    
    // Organization
    ORGANIZATION_GET: "/api/v1/settings/organization",
    ORGANIZATION_UPDATE: "/api/v1/settings/organization",
    
    // Notifications
    NOTIFICATIONS_GET: "/api/v1/settings/notifications",
    NOTIFICATIONS_UPDATE: "/api/v1/settings/notifications",
    
    // Security
    SECURITY_GET: "/api/v1/settings/security",
    SECURITY_UPDATE: "/api/v1/settings/security",
    SECURITY_SIGNOUT_ALL: "/api/v1/settings/security/signout-all",
    
    // Email
    EMAIL_GET: "/api/v1/settings/email",
    EMAIL_UPDATE: "/api/v1/settings/email",
    
    // Integrations
    INTEGRATIONS_GET: "/api/v1/settings/integrations",
    INTEGRATIONS_UPDATE: "/api/v1/settings/integrations",
    
    // Billing
    BILLING_GET: "/api/v1/settings/billing",
    BILLING_UPDATE: "/api/v1/settings/billing",
    
    // User Management
    USERS_GET: "/api/v1/settings/users",
    USERS_UPDATE: "/api/v1/settings/users",
    
    // Case Settings
    CASE_SETTINGS_GET: "/api/v1/settings/cases",
    CASE_SETTINGS_UPDATE: "/api/v1/settings/cases",
    
    // Form Templates
    FORM_TEMPLATES_GET: "/api/v1/settings/forms",
    FORM_TEMPLATES_UPDATE: "/api/v1/settings/forms",
    
    // Report Settings
    REPORT_SETTINGS_GET: "/api/v1/settings/reports",
    REPORT_SETTINGS_UPDATE: "/api/v1/settings/reports",
    
    // Roles & Permissions
    ROLES_GET: "/api/v1/settings/roles",
    ROLES_UPDATE: "/api/v1/settings/roles",
    
    // Database Settings
    DATABASE_GET: "/api/v1/settings/database",
    DATABASE_UPDATE: "/api/v1/settings/database",
    
    // System Settings
    SYSTEM_GET: "/api/v1/settings/system",
    SYSTEM_UPDATE: "/api/v1/settings/system",
    
    // Audit Logs
    AUDIT_LOGS_GET: "/api/v1/settings/audit-logs",
    
    // Backup & Recovery
    BACKUP_GET: "/api/v1/settings/backup",
    BACKUP_UPDATE: "/api/v1/settings/backup",
    
    // API Settings
    API_SETTINGS_GET: "/api/v1/settings/api",
    API_SETTINGS_UPDATE: "/api/v1/settings/api",
    
    // Performance
    PERFORMANCE_GET: "/api/v1/settings/performance",
    PERFORMANCE_UPDATE: "/api/v1/settings/performance"
};


