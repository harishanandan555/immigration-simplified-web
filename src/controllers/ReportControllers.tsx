import api from '../utils/api';
import { REPORT_END_POINTS } from '../utils/constants';

// Report Types
export interface Report {
  _id: string;
  name: string;
  type: 'case' | 'client' | 'document' | 'user' | 'financial' | 'custom';
  category: string;
  description: string;
  parameters: ReportParameters;
  schedule?: ReportSchedule;
  recipients: string[];
  format: 'PDF' | 'Excel' | 'CSV' | 'HTML';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ReportParameters {
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    status?: string[];
    type?: string[];
    priority?: string[];
    assignedTo?: string[];
    clientId?: string[];
    caseId?: string[];
  };
  grouping?: string[];
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  limit?: number;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  customCron?: string;
  timezone: string;
  isActive: boolean;
}

export interface ReportData {
  reportId: string;
  generatedAt: string;
  data: any[];
  summary: ReportSummary;
  metadata: ReportMetadata;
}

export interface ReportSummary {
  totalRecords: number;
  filteredRecords: number;
  dateRange: string;
  filters: string[];
  generatedBy: string;
}

export interface ReportMetadata {
  version: string;
  dataSource: string;
  lastUpdated: string;
  recordCount: number;
}

// Case Report Types
export interface CaseReportData {
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  clientName: string;
  assignedTo: string;
  openDate: string;
  lastUpdated: string;
  documentsCount: number;
  tasksCount: number;
  completionPercentage: number;
}

// Client Report Types
export interface ClientReportData {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  caseCount: number;
  totalDocuments: number;
  lastActivity: string;
  registrationDate: string;
  immigrationStatus: string;
}

// Document Report Types
export interface DocumentReportData {
  documentId: string;
  name: string;
  type: string;
  size: string;
  status: string;
  uploadedBy: string;
  uploadedAt: string;
  clientName: string;
  caseNumber?: string;
  tags: string[];
  verificationStatus: string;
}

// User Report Types
export interface UserReportData {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  caseCount: number;
  documentCount: number;
  taskCount: number;
  performanceScore: number;
}

// Financial Report Types
export interface FinancialReportData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  caseRevenue: number;
  subscriptionRevenue: number;
  outstandingInvoices: number;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  invoiceId: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate?: string;
  clientName: string;
}

// Report Generation Request
export interface GenerateReportRequest {
  reportId: string;
  parameters: ReportParameters;
  format: 'PDF' | 'Excel' | 'CSV' | 'HTML';
  includeCharts?: boolean;
  includeSummary?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  status: number;
  message?: string;
}

export interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ReportDataResponse {
  reportData: ReportData;
  downloadUrl?: string;
  expiresAt?: string;
}

// Report Controllers
export const getReports = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  isActive?: boolean;
}): Promise<ApiResponse<ReportListResponse>> => {
  try {
    const response = await api.get(REPORT_END_POINTS.GET_REPORTS, { params });
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching reports:', error.message);
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }
    throw new Error('Failed to fetch reports due to an unknown error');
  }
};

export const getReportById = async (reportId: string): Promise<ApiResponse<Report>> => {
  try {
    const response = await api.get(REPORT_END_POINTS.GET_REPORT_BY_ID.replace(':id', reportId));
    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching report:', error.message);
      throw new Error(`Failed to fetch report: ${error.message}`);
    }
    throw new Error('Failed to fetch report due to an unknown error');
  }
};

export const createReport = async (reportData: Omit<Report, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Report>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.CREATE_REPORT, reportData);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating report:', error.message);
      throw new Error(`Failed to create report: ${error.message}`);
    }
    throw new Error('Failed to create report due to an unknown error');
  }
};

export const updateReport = async (reportId: string, updateData: Partial<Report>): Promise<ApiResponse<Report>> => {
  try {
    const response = await api.put(REPORT_END_POINTS.UPDATE_REPORT.replace(':id', reportId), updateData);
    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating report:', error.message);
      throw new Error(`Failed to update report: ${error.message}`);
    }
    throw new Error('Failed to update report due to an unknown error');
  }
};

export const deleteReport = async (reportId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(REPORT_END_POINTS.DELETE_REPORT.replace(':id', reportId));
    return {
      data: undefined,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting report:', error.message);
      throw new Error(`Failed to delete report: ${error.message}`);
    }
    throw new Error('Failed to delete report due to an unknown error');
  }
};

export const generateReport = async (request: GenerateReportRequest): Promise<ApiResponse<ReportDataResponse>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.GENERATE_REPORT, request);
    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error generating report:', error.message);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
    throw new Error('Failed to generate report due to an unknown error');
  }
};

export const downloadReport = async (reportId: string, format: string): Promise<Blob> => {
  try {
    const response = await api.get(REPORT_END_POINTS.DOWNLOAD_REPORT.replace(':id', reportId), {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error downloading report:', error.message);
      throw new Error(`Failed to download report: ${error.message}`);
    }
    throw new Error('Failed to download report due to an unknown error');
  }
};

// Report Data Controllers
export const getCaseReportData = async (parameters: ReportParameters): Promise<ApiResponse<CaseReportData[]>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.GET_CASE_REPORT_DATA, parameters);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching case report data:', error.message);
      throw new Error(`Failed to fetch case report data: ${error.message}`);
    }
    throw new Error('Failed to fetch case report data due to an unknown error');
  }
};

export const getClientReportData = async (parameters: ReportParameters): Promise<ApiResponse<ClientReportData[]>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.GET_CLIENT_REPORT_DATA, parameters);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching client report data:', error.message);
      throw new Error(`Failed to fetch client report data: ${error.message}`);
    }
    throw new Error('Failed to fetch client report data due to an unknown error');
  }
};

export const getDocumentReportData = async (parameters: ReportParameters): Promise<ApiResponse<DocumentReportData[]>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.GET_DOCUMENT_REPORT_DATA, parameters);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching document report data:', error.message);
      throw new Error(`Failed to fetch document report data: ${error.message}`);
    }
    throw new Error('Failed to fetch document report data due to an unknown error');
  }
};

export const getUserReportData = async (parameters: ReportParameters): Promise<ApiResponse<UserReportData[]>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.GET_USER_REPORT_DATA, parameters);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching user report data:', error.message);
      throw new Error(`Failed to fetch user report data: ${error.message}`);
    }
    throw new Error('Failed to fetch user report data due to an unknown error');
  }
};

export const getFinancialReportData = async (parameters: ReportParameters): Promise<ApiResponse<FinancialReportData[]>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.GET_FINANCIAL_REPORT_DATA, parameters);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching financial report data:', error.message);
      throw new Error(`Failed to fetch financial report data: ${error.message}`);
    }
    throw new Error('Failed to fetch financial report data due to an unknown error');
  }
};

// Report Analytics
export const getReportAnalytics = async (reportId: string, parameters: ReportParameters): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.GET_REPORT_ANALYTICS.replace(':id', reportId), parameters);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching report analytics:', error.message);
      throw new Error(`Failed to fetch report analytics: ${error.message}`);
    }
    throw new Error('Failed to fetch report analytics due to an unknown error');
  }
};

// Report Scheduling
export const scheduleReport = async (reportId: string, schedule: ReportSchedule): Promise<ApiResponse<Report>> => {
  try {
    const response = await api.post(REPORT_END_POINTS.SCHEDULE_REPORT.replace(':id', reportId), schedule);
    return {
      data: response.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error scheduling report:', error.message);
      throw new Error(`Failed to schedule report: ${error.message}`);
    }
    throw new Error('Failed to schedule report due to an unknown error');
  }
};

export const getScheduledReports = async (): Promise<ApiResponse<Report[]>> => {
  try {
    const response = await api.get(REPORT_END_POINTS.GET_SCHEDULED_REPORTS);
    return {
      data: response.data.data,
      success: true,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching scheduled reports:', error.message);
      throw new Error(`Failed to fetch scheduled reports: ${error.message}`);
    }
    throw new Error('Failed to fetch scheduled reports due to an unknown error');
  }
};
