
export const APPCONSTANTS = {
    API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://immigration-simplified-api.onrender.com" : "https://efile-legal.onrender.com"
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
};

