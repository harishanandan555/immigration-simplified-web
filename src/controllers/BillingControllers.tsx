import api from '../utils/api';
import { SUBSCRIPTION_END_POINTS } from '../utils/constants';

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

export interface Subscription {
  planId: string;
  companyId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  billingCycle: 'monthly' | 'yearly';
  autoRenew: boolean;
  paymentMethod: {
    type: string;
    last4: string;
    expiryDate: string;
  };
}

export interface ApiResponse<T> {
  data: T | null;
  status: number;
  statusText: string;
}

// Get all subscription plans
export const getSubscriptionPlans = async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
  try {
    const response = await api.get(SUBSCRIPTION_END_POINTS.GET_PLANS);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Get subscription plan by ID
export const getSubscriptionPlanById = async (planId: string): Promise<ApiResponse<SubscriptionPlan>> => {
  try {
    const response = await api.get(SUBSCRIPTION_END_POINTS.GET_PLAN_BY_ID.replace(':id', planId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    throw error;
  }
};

// Subscribe to a plan
export const subscribeToPlan = async (
  companyId: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  paymentMethod: {
    type: string;
    token: string;
  }
): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await api.post(SUBSCRIPTION_END_POINTS.SUBSCRIBE, {
      companyId,
      planId,
      billingCycle,
      paymentMethod
    });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async (companyId: string): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await api.post(SUBSCRIPTION_END_POINTS.CANCEL, {
      companyId
    });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// Get company subscription
export const getCompanySubscription = async (companyId: string): Promise<ApiResponse<Subscription>> => {
  try {
    const response = await api.get(SUBSCRIPTION_END_POINTS.GET_COMPANY_SUBSCRIPTION.replace(':companyId', companyId));
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching company subscription:', error);
    throw error;
  }
}; 