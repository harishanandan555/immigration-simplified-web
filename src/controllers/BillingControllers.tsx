import { APPCONSTANTS, BILLING_END_POINTS } from '../utils/constants';

export interface SubscriptionPlan {
  name: 'demo' | 'basic' | 'professional' | 'enterprise';
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    attorneys: number;
    paralegals: number;
    clients: number;
  };
  isActive: boolean;
}

export interface PaymentMethod {
  type: 'credit_card' | 'bank_transfer' | 'other';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PaymentHistory {
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  paymentDate: Date;
  transactionId: string;
  receiptUrl: string;
}

export interface Subscription {
  companyId: string;
  subscriptionPlanId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'failed';
  startDate: Date;
  endDate: Date;
  paymentMethod: PaymentMethod;
  paymentHistory: PaymentHistory[];
  nextBillingDate: Date;
  autoRenew: boolean;
  notes: string;
}

export interface ApiResponse<T> {
  data: T | null;
  status: number;
  statusText: string;
}

const handleApiError = (error: any): ApiResponse<any> => {
  console.error('API Error:', error);
  return {
    data: null,
    status: error.response?.status || 500,
    statusText: error.response?.statusText || 'Internal Server Error'
  };
};

export const getSubscriptionPlans = async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.GET_PLANS}`);
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getSubscriptionPlanById = async (planId: string): Promise<ApiResponse<SubscriptionPlan>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.GET_PLAN_DETAILS.replace(':id', planId)}`);
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getCurrentSubscription = async (companyId: string): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.GET_SUBSCRIPTION}?companyId=${companyId}`);
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateSubscription = async (
  companyId: string,
  subscriptionData: Partial<Subscription>
): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.UPDATE_SUBSCRIPTION}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId, ...subscriptionData }),
    });
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPaymentHistory = async (companyId: string): Promise<ApiResponse<PaymentHistory[]>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.GET_PAYMENT_HISTORY}?companyId=${companyId}`);
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updatePaymentMethod = async (
  companyId: string,
  paymentMethod: PaymentMethod
): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.UPDATE_PAYMENT_METHOD}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId, paymentMethod }),
    });
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const cancelSubscription = async (companyId: string): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.CANCEL_SUBSCRIPTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId }),
    });
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const renewSubscription = async (companyId: string): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.RENEW_SUBSCRIPTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId }),
    });
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getInvoices = async (companyId: string): Promise<ApiResponse<PaymentHistory[]>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.GET_INVOICES}?companyId=${companyId}`);
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
}; 

// Superadmin: get all payments / subscribers
// Backend returns { success, count, data: Payment[] }
export const getAllPayments = async (): Promise<ApiResponse<{ success: boolean; count: number; data: any[] }>> => {
  try {
    const response = await fetch(`${APPCONSTANTS.API_BASE_URL}${BILLING_END_POINTS.GET_ALL_PAYMENTS}`);
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return handleApiError(error);
  }
};