
export const APPCONSTANTS = {
    API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5001" : "https://efile-legal.onrender.com"
};

export const API_END_POINTS = {

    REGISTER: "/api/users/register",
    LOGIN: "/api/users/login",

    ADDUSER: "/api/users/addUser",
    GETUSCISUSERLIST: "/api/users/getUserList",
    UPDATEUSERSTATUS: "/api/users/updateUserStatus",

    ASKUSCISQUESTIONS: "/api/ai/askquestion",

    ADDCOMPANY: "/api/users/addCompany",
    GETCOMPANYLIST: "/api/users/getCompanyList",
    UPDATECOMPANYSTATUS: "/api/users/updateCompanyStatus",

    GETUSCISCASESTATUS: "/api/uscis/case-status/:receiptNumber",
    SUBMITUSCISCASE: "/api/uscis/submit-case",
    GETUSCISCASELIST: "/api/uscis/caselist",
    GETUSCISLIST: "/api/uscis/list",
    BOOKUSCISDEMO: "/api/uscis/bookdemo",
    GETBOOKDEMOLIST: "/api/uscis/demolist",

    ADDCLIENTCONTACT: "/api/uscisclients/addClientContact",
    GETALLCLIENTSLIST: "/api/uscisclients/getAllClientsList",
    GETCLIENTBYID: "/api/uscisclients/getClientById",

    ADDCLIENTCASES: "/api/uscisclients/addClientCases",
    GETCLIENTCASES: "/api/uscisclients/getClientCases",

    GETCLIENTGENERALINFO: "/api/uscisclients/getClientGeneralInfo",
    UPDATECLIENTGENERALINFO: "/api/uscisclients/updateClientGeneralInfo",

    GETCLIENTOTHERNAMES: "/api/uscisclients/getClientOtherNames",
    UPDATECLIENTOTHERNAMES: "/api/uscisclients/updateClientOtherNames",

    GETCLIENTBIOGRAPHICINFO: "/api/uscisclients/getClientBiographicInfo",
    UPDATECLIENTBIOGRAPHICINFO: "/api/uscisclients/updateClientBiographicInfo",

    GETCLIENTADDRESSES: "/api/uscisclients/getClientAddresses",
    UPDATECLIENTADDRESSES: "/api/uscisclients/updateClientAddresses",

    GETCLIENTCUSTOMFIELDS: "/api/uscisclients/getClientCustomFields",
    UPDATECLIENTCUSTOMFIELDS: "/api/uscisclients/updateClientCustomFields",

    GETCLIENTPREVIOUSADDRESSES: "/api/uscisclients/getClientPreviousAddresses",
    UPDATECLIENTPREVIOUSADDRESSES: "/api/uscisclients/updateClientPreviousAddresses",

    GETCLIENTMARRIAGE: "/api/uscisclients/getClientMarriage",
    UPDATECLIENTMARRIAGE: "/api/uscisclients/updateClientMarriage",

    GETCLIENTEMPLOYMENT: "/api/uscisclients/getClientEmployment",
    UPDATECLIENTEMPLOYMENT: "/api/uscisclients/updateClientEmployment",

    GETCLIENTEDUCATION: "/api/uscisclients/getClientEducation",
    UPDATECLIENTEDUCATION: "/api/uscisclients/updateClientEducation",

    GETCLIENTABROADTRIPS: "/api/uscisclients/getClientAbroadTrips",
    UPDATECLIENTABROADTRIPS: "/api/uscisclients/updateClientAbroadTrips",

    GETCLIENTMEMBERS: "/api/uscisclients/getClientMembers",
    UPDATECLIENTMEMBERS: "/api/uscisclients/updateClientMembers",

    GETCLIENTGENERALCHECK: "/api/uscisclients/getClientGeneralCheck",
    UPDATECLIENTGENERALCHECK: "/api/uscisclients/updateClientGeneralCheck",

    GETCLIENTAFFILIATION: "/api/uscisclients/getClientAffiliation",
    UPDATECLIENTAFFILIATION: "/api/uscisclients/updateClientAffiliation",

    GETCLIENTARRESTS: "/api/uscisclients/getClientArrests",
    UPDATECLIENTARRESTS: "/api/uscisclients/updateClientArrests",

    GETCLIENTLOGS: "/api/uscisclients/getClientLogs",
    UPDATECLIENTLOGS: "/api/uscisclients/updateClientLogs",

    GETCLIENTREMINDERS: "/api/uscisclients/getClientReminders",
    UPDATECLIENTREMINDERS: "/api/uscisclients/updateClientReminders",

    GETCLIENTAPPOINTMENTS: "/api/uscisclients/getClientAppointments",
    UPDATECLIENTAPPOINTMENTS: "/api/uscisclients/updateClientAppointments",

    GETCLIENTPASSPORTDOCUMENTS: "/api/uscisclients/getClientPassportDocuments",
    UPDATECLIENTPASSPORTDOCUMENTS: "/api/uscisclients/updateClientPassportDocuments",

    GETCLIENTI94SENTRYDOCUMENTS: "/api/uscisclients/getClientI94sEntryDocuments",
    UPDATECLIENTI94SENTRYDOCUMENTS: "/api/uscisclients/updateClientI94sEntryDocuments",

    GETCLIENTVISASDOCUMENTS: "/api/uscisclients/getClientVisasDocuments",
    UPDATECLIENTVISASDOCUMENTS: "/api/uscisclients/updateClientVisasDocuments",

    GETCLIENTUSERDEFINEDDOCUMENTS: "/api/uscisclients/getClientUserDefinedDocuments",
    UPDATECLIENTUSERDEFINEDDOCUMENTS: "/api/uscisclients/updateClientUserDefinedDocuments",

    GETCLIENTOTHERSDOCUMENTS: "/api/uscisclients/getClientOthersDocuments",
    UPDATECLIENTOTHERSDOCUMENTS: "/api/uscisclients/updateClientOthersDocuments",
    
};

