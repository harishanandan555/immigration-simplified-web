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

