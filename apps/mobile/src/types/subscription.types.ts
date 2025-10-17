export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  autoRenew: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  usageStats?: SubscriptionUsage[];
}

export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

export interface SubscriptionUsage {
  id: string;
  subscriptionId: string;
  month: number;
  year: number;
  eventsCreated: number;
  ticketsSold: number;
  revenue: number;
  apiCalls: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanDetails {
  id: string;
  name: SubscriptionPlan;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    eventsPerMonth: number;
    ticketsPerEvent: number;
    apiCallsPerMonth: number;
    storageLimit: number;
    supportLevel: 'basic' | 'priority' | 'dedicated';
  };
  isPopular?: boolean;
  isRecommended?: boolean;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  revenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  subscriptionsByPlan: Array<{
    plan: SubscriptionPlan;
    count: number;
    percentage: number;
  }>;
  subscriptionsByStatus: Array<{
    status: SubscriptionStatus;
    count: number;
    percentage: number;
  }>;
  revenueByPlan: Array<{
    plan: SubscriptionPlan;
    revenue: number;
    percentage: number;
  }>;
}

// Import from other types (to avoid circular dependencies)
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

