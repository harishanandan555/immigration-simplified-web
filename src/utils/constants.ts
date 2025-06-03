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
    
    // Audit Logs
    AUDIT_LOGS_GET: "/api/v1/settings/audit-logs/:userId",
    
    // Backup & Recovery
    BACKUP_GET: "/api/v1/settings/backup/:userId",
    BACKUP_UPDATE: "/api/v1/settings/backup/:userId",
    
    // API Settings
    API_SETTINGS_GET: "/api/v1/settings/api/:userId",
    API_SETTINGS_UPDATE: "/api/v1/settings/api/:userId",
    
    // Performance
    PERFORMANCE_GET: "/api/v1/settings/performance/:userId",
    PERFORMANCE_UPDATE: "/api/v1/settings/performance/:userId"
};

export const SUBSCRIPTION_END_POINTS = {
    GET_PLANS: "/api/v1/subscriptions/plans",
    GET_PLAN_BY_ID: "/api/v1/subscriptions/plans/:id",
    SUBSCRIBE: "/api/v1/subscriptions/subscribe",
    CANCEL: "/api/v1/subscriptions/cancel",
    GET_COMPANY_SUBSCRIPTION: "/api/v1/subscriptions/company/:companyId"
};


